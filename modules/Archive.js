const fs = require("fs-extra");
const download = require("download");
const path = require("path");
const puppeteer = require("puppeteer");
const request = require("request");
const scrape = require("website-scraper");
const PuppeteerPlugin = require("website-scraper-puppeteer");

const Utils = require("./Utils");

class Archive {
	constructor({ dir, url, forceRedownload = true }) {
		this._folderName = Utils.safeFolderRename(url);
		this.url = url;
		this.forceRedownload = forceRedownload;
		this.mainDirectory = path.join(dir, this._folderName);
		fs.ensureDirSync(this.mainDirectory);
	}

	get folderName() {
		return this._folderName;
	}

	set folderName(url) {
		this._folderName = Utils.safeFolderRename(url);
	}

	async fetchFavicon() {
		return new Promise((resolve, reject) => {
			let iconPath = path.join(this.mainDirectory, "favicon.ico");
			if (fs.pathExistsSync(iconPath) && !this.forceRedownload) {
				return resolve({
					output: iconPath,
					status: "skipped",
				});
			}

			download(`https://www.google.com/s2/favicons?domain=${this.url}`).pipe(
				fs.createWriteStream(iconPath)
			);
			return resolve({
				output: iconPath,
				status: "success",
			});
		});
	}

	async fetchWebpage() {
		const options = {
			urls: [this.url],
			directory: path.join(this.mainDirectory, "full"),
			plugins: [new PuppeteerPlugin()],
		};

		return scrape(options);
	}

	async fetchPDF() {
		const pdfPath = path.join(this.mainDirectory, "output.pdf");
		if (fs.pathExistsSync(pdfPath) && !this.forceRedownload) {
			return {
				output: pdfPath,
				status: "skipped",
			};
		}

		const browser = await puppeteer.launch({
			args: ["--no-sandbox", "--disable-dev-shm-usage"],
		});

		const page = await browser.newPage();
		await page.goto(this.url, { waitUntil: "networkidle2" });
		await page.pdf({ path: pdfPath, format: "A4" });
		const title = await page.title();
		await browser.close();
		return {
			title,
			output: pdfPath,
			status: "success",
		};
	}

	async fetchScreenshot() {
		const screenPath = path.join(this.mainDirectory, "output.png");
		if (fs.pathExistsSync(screenPath) && !this.forceRedownload) {
			return {
				output: screenPath,
				status: "skipped",
			};
		}

		const browser = await puppeteer.launch();
		const page = await browser.newPage();
		await page.goto(this.url, { waitUntil: "networkidle2" });
		await page.screenshot({
			path: screenPath,
			fullPage: true,
			omitBackground: true,
		});
		let title = await page.title();
		await browser.close();
		return {
			title,
			output: screenPath,
			status: "success",
		};
	}

	async fetchDom() {
		let htmlPath = path.join(this.mainDirectory, "output.html");
		if (fs.pathExistsSync(htmlPath) && !this.forceRedownload) {
			return {
				output: htmlPath,
				status: "skipped",
			};
		}

		const browser = await puppeteer.launch();
		const page = await browser.newPage();
		await page.goto(this.url, { waitUntil: "networkidle2" });
		let bodyHTML = await page.content();
		let title = await page.title();
		fs.writeFileSync(htmlPath, bodyHTML);
		await browser.close();
		return {
			title,
			output: htmlPath,
			status: "success",
		};
	}

	async submitArchiveOrg() {
		return new Promise((resolve, reject) => {
			let archiveFile = path.join(this.mainDirectory, "archive.org.txt");
			if (fs.pathExistsSync(archiveFile) && !this.forceRedownload) {
				return resolve({
					output: fs.readFileSync(archiveFile),
					status: "skipped",
				});
			}

			let domain = `http://web.archive.org`;
			let url = `${domain}/save/${this.url}`;
			const options = {
				url,
				headers: {
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36",
				},
			};

			request(options, (error, response, body) => {
				if (error) {
					return resolve({
						status: "failed",
						message: error,
					});
				}

				if (
					typeof response.headers["x-archive-wayback-runtime-error"] !==
					"undefined"
				) {
					let errorHeader = response.headers["x-archive-wayback-runtime-error"];
					if (
						errorHeader === "RobotAccessControlException: Blocked By Robots"
					) {
						return resolve({
							status: "failed",
							message: "archive.org returned blocked by robots.txt error",
						});
					}

					return resolve({
						status: "failed",
						message: errorHeader,
					});
				}

				if (response.statusCode === 403 || response.statusCode === 502) {
					return resolve({
						status: "failed",
						message: `statusCode ${response.statusCode}`,
					});
				}

				if (typeof response.headers["content-location"] === "undefined") {
					return resolve({
						status: "failed",
						message: "unable to retrieve archive.org id",
					});
				}

				console.debug(`[#] submitArchiveOrg: success ${url}`);
				let archiveId = response.headers["content-location"];
				let archiveUrl = `${domain}/${archiveId}`;
				fs.writeFileSync(archiveFile, archiveUrl);
				// https://github.com/pastpages/savepagenow/blob/master/savepagenow/api.py#L57
				return resolve({
					status: "success",
					archiveUrl,
				});
			});
		});
	}
}

module.exports = Archive;
