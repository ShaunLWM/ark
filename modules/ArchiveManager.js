const fs = require('fs-extra');
const path = require('path');
const lodashId = require('lodash-id');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const Archive = require('./Archive');
const Utils = require('./Utils');

class ArchiveManager {
    constructor({ mainDirectory = null, fullFullWebpage = true, fetchFavicon = true, fetchDom = true, fetchScreenshot = true, fetchPDF = true, fetchArchiveOrg = true }) {
        if (mainDirectory === null) {
            throw new Error('[!] options: mainDirectory not set.')
        }

        this.fullFullWebpage = fullFullWebpage;
        this.fetchFavicon = fetchFavicon;
        this.fetchDom = fetchDom;
        this.fetchScreenshot = fetchScreenshot;
        this.fetchPDF = fetchPDF;
        this.fetchArchiveOrg = fetchArchiveOrg;

        this.dir = mainDirectory;
        this.adapter = new FileSync('db.json');
        this.db = low(this.adapter);
        this.db._.mixin(lodashId);
        this.archivesDb = this.db.defaults({ archives: [] }).get('archives');
        this.info = {};
    }

    getArchives() {
        return this.archivesDb.sortBy('lastUpdated').value().filter(val => {
            return fs.pathExistsSync(path.join(this.dir, val['folder']));
        });
    }

    async addUrl(url) {
        this.info.url = url;
        try {
            let archive = new Archive({
                dir: this.dir,
                url
            });

            if (this.fullFullWebpage) {
                console.debug(`[#] fetchFullWebpage: intialising`);
                let result = await archive.fetchWebpage();
                console.log(`[@] fullFullWebpage: ${result.filename}`);
            }

            if (this.fetchFavicon) {
                console.debug(`[#] fetchFavicon: fetching favicon.ico.`);
                let result = await archive.fetchFavicon();
                if (result.status === 'skipped') {
                    console.error(`[!] fetchFavicon: file exist.`);
                } else {
                    console.log(`[@] fetchFavicon: downloaded favicon.ico`);
                }
            }

            if (this.fetchPDF) {
                console.debug(`[#] fetchPDF: converting to pdf..`);
                let result = await archive.fetchPDF();
                if (result === 'skipped') {
                    console.debug(`[#] fetchPDF: file exist.`);
                } else {
                    console.log(`[@] fetchPDF: downloaded ${result.output}`);
                }

                this.info.title = result.title;
            }

            if (this.fetchScreenshot) {
                console.debug(`[#] fetchScreenshot: converting to png..`);
                let result = await archive.fetchScreenshot();
                if (result === 'skipped') {
                    console.debug(`[#] fetchScreenshot: file exist.`);
                } else {
                    console.log(`[@] fetchScreenshot: downloaded ${result.output}`);
                }

                this.info.title = result.title;
            }

            if (this.fetchDom) {
                console.debug(`[#] fetchDom: fetching full html without external dependencies..`);
                let result = await archive.fetchDom();
                if (result === 'skipped') {
                    console.debug(`[#] fetchDom: file exist.`);
                } else {
                    console.log(`[@] fetchDom: downloaded ${result.output}`);
                }

                this.info.title = result.title;
            }

            if (this.fetchArchiveOrg) {
                let result = await archive.submitArchiveOrg();
                if (result.status === 'skipped') {
                    console.debug(`[#] submitArchiveOrg: already submitted.`);
                } else if (result.status === 'failed') {
                    console.error(`[!] submitArchiveOrg: ${result.message}`);
                } else {
                    console.log(`[@] submitArchiveOrg: submitted ${result.archiveUrl}`);
                }
            }

            console.debug(`[#] ArchiveManager: done. writing to database..`);
            this.archivesDb.insert({
                folder: archive.folderName,
                lastUpdated: Math.round((new Date()).getTime()),
                ...this.info
            }).write();
            console.debug(`[#] ArchiveManager: done. exiting..`)
        } catch (error) {
            console.error(`[!] addUrl: ${error}`);
        }
    }
}

module.exports = ArchiveManager;