const fs = require('fs-extra');
const path = require('path');
const lodashId = require('lodash-id');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const Archive = require('./Archive');

class ArchiveManager {
    constructor({ mainDirectory = null, fetchFavicon = true, fetchDom = true, fetchScreenshot = true, fetchPDF = true, fetchArchiveOrg = true }) {
        if (mainDirectory === null) {
            throw new Error('[!] options: mainDirectory not set.')
        }

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

            if (this.fetchFavicon) {
                await archive.fetchFavicon();
            }

            if (this.fetchPDF) {
                let res = await archive.fetchPDF();
                this.info.title = res.title;
            }

            if (this.fetchScreenshot) {
                let res = await archive.fetchScreenshot();
                this.info.title = res.title;
            }

            if (this.fetchDom) {
                let res = await archive.fetchDom();
                this.info.title = res.title;
            }

            if (this.fetchArchiveOrg) {
                await archive.submitArchiveOrg();
            }

            this.archivesDb.insert({
                folder: archive.folderName,
                lastUpdated: Math.round((new Date()).getTime()),
                ...this.info
            }).write();
        } catch (error) {
            console.error(`[!] addUrl: ${error}`);
        }
    }
}

module.exports = ArchiveManager;