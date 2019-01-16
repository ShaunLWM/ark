const fs = require('fs-extra');
const download = require('download');
const path = require('path');
const puppeteer = require('puppeteer');
const request = require('request');

class Archive {
    constructor({ dir, url, forceRedownload = true }) {
        this.dirName = dir;
        this.url = url;
        this.forceRedownload = forceRedownload;
        this.mainDirectory = path.join(__dirname, this.dirName);
        fs.ensureDirSync(this.mainDirectory);
    }

    async fetchFavicon() {
        return new Promise((resolve, reject) => {
            let iconPath = path.join(this.mainDirectory, 'favicon.ico');
            console.debug(`[#] fetchFavicon: ${iconPath}`);
            if (fs.pathExistsSync(iconPath) && !this.forceRedownload) {
                console.debug(`[#] fetchFavicon: File exist.`);
                return resolve({
                    output: 'favicon.ico',
                    status: 'skipped'
                });
            }

            console.debug(`[@] fetchFavicon: Downloading ${iconPath}`);
            download(`https://www.google.com/s2/favicons?domain=${this.url}`).pipe(fs.createWriteStream(iconPath));
            return resolve({
                output: 'favicon.ico',
                status: 'success'
            });
        });
    }

    fetchWebpage() {

    }

    async fetchPDF() {
        let pdfPath = path.join(this.mainDirectory, 'output.pdf');
        console.debug(`[#] fetchPDF ${pdfPath}`);
        if (fs.pathExistsSync(pdfPath) && !this.forceRedownload) {
            console.debug(`[#] fetchPDF: File exist.`);
            return resolve({
                output: 'output.pdf',
                status: 'skipped'
            });
        }

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(this.url, { waitUntil: 'networkidle2' });
        await page.pdf({ path: pdfPath, format: 'A4' });
        console.debug(`[@] fetchPDF: Downloading ${pdfPath}`);
        await browser.close();
        return resolve({
            output: 'output.pdf',
            status: 'success'
        });
    }

    async fetchScreenshot() {
        let screenPath = path.join(this.mainDirectory, 'output.png');
        console.debug(`[#] fetchScreenshot ${screenPath}`);
        if (fs.pathExistsSync(screenPath) && !this.forceRedownload) {
            console.debug(`[#] fetchScreenshot: File exist.`);
            return resolve({
                output: 'output.png',
                status: 'skipped'
            });
        }

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(this.url, { waitUntil: 'networkidle2' });
        await page.screenshot({ path: screenPath, fullPage: true, omitBackground: true });
        console.debug(`[@] fetchScreenshot: Downloading ${screenPath}`);
        await browser.close();
        return resolve({
            output: 'output.png',
            status: 'success'
        });
    }

    async fetchDom() {
        let htmlPath = path.join(this.mainDirectory, 'output.html');
        console.debug(`[#] fetchDom ${htmlPath}`);
        if (fs.pathExistsSync(htmlPath) && !this.forceRedownload) {
            console.debug(`[#] fetchDom: File exist.`);
            return resolve({
                output: 'output.html',
                status: 'skipped'
            });
        }

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(this.url, { waitUntil: 'networkidle2' });
        let bodyHTML = await page.content();
        fs.writeFileSync(htmlPath, bodyHTML);
        console.debug(`[@] fetchDom: Downloading ${htmlPath}`);
        await browser.close();
        return resolve({
            output: 'output.html',
            status: 'success'
        });
    }

    async submitArchiveOrg() {
        return new Promise((resolve, reject) => {
            let archiveFile = path.join(this.mainDirectory, 'archive.org.txt');
            if (fs.pathExistsSync(archiveFile) && !this.forceRedownload) {
                console.debug(`[#] submitArchiveOrg: Already submitted.`);
                return resolve({
                    output: fs.readFileSync(archiveFile),
                    status: 'skipped'
                });
            }

            let domain = `http://web.archive.org`;
            let url = `${domain}/save/${this.url}`;
            console.debug(`[#] submitArchiveOrg: ${url}`);
            const options = {
                url,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36'
                }
            };

            request(options, (error, response, body) => {
                if (error) {
                    return resolve({
                        status: 'failed',
                        message: error
                    })
                }

                if (typeof response.headers['x-archive-wayback-runtime-error'] !== 'undefined') {
                    let errorHeader = response.headers['x-archive-wayback-runtime-error'];
                    if (errorHeader === 'RobotAccessControlException: Blocked By Robots') {
                        return resolve({
                            status: 'failed',
                            message: 'archive.org returned blocked by robots.txt error'
                        })
                    }

                    return resolve({
                        status: 'failed',
                        message: errorHeader
                    });
                }

                if (response.statusCode === 403 || response.statusCode === 502) {
                    return resolve({
                        status: 'failed',
                        message: `statusCode ${response.statusCode}`
                    })
                }

                if (typeof response.headers['content-location'] === 'undefined') {
                    return resolve({
                        status: 'failed',
                        message: 'unable to retrieve archive.org id'
                    })
                }

                console.debug(`[#] submitArchiveOrg: success ${url}`);
                let archiveId = response.headers['content-location'];
                let archiveUrl = `${domain}/${archiveId}`;
                fs.writeFileSync(archiveFile, archiveUrl);
                // https://github.com/pastpages/savepagenow/blob/master/savepagenow/api.py#L57
                return resolve({
                    status: 'success',
                    archiveUrl
                });
            });
        });
    }
}

module.exports = Archive;