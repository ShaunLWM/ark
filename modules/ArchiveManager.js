const lodashId = require('lodash-id');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const Archive = require('./Archive');

class ArchiveManager {
    constructor({ mainDirectory = null }) {
        if (mainDirectory === null) {
            throw new Error('[!] options: mainDirectory not set.')
        }

        this.dir = mainDirectory;
        this.adapter = new FileSync('db.json');
        this.db = low(this.adapter);
        this.db._.mixin(lodashId);
        this.archivesDb = this.db.defaults({ archives: [] }).get('archives');
    }

    addUrl(url) {
        let archive = new Archive({
            dir: this.dir,
            url
        });

        archive.fetchFavicon().then(result => {
            console.log(result);
            return archive.fetchPDF();
        }).then(result => {
            console.log(result);
            return archive.fetchScreenshot();
        }).then(result => {
            console.log(result);
            return archive.fetchDom();
        })
            // .then(result => {
            //     console.log(result);
            //     // return archive.submitArchiveOrg();
            //     return true;
            // })
            .then(result => {
                console.log(result);
                this.archivesDb.insert({
                    title: archive.folderName,
                    lastUpdated: Math.round((new Date()).getTime() / 1000)
                }).write();
            }).catch(error => {
                console.log(error);
            });
    }
}

module.exports = ArchiveManager;