const path = require('path');
// console.log(__dirname);
const ArchiveManager = require('../modules/ArchiveManager');
let archiveManager = new ArchiveManager({ mainDirectory: path.join(__dirname, 'archives') });
archiveManager.addUrl('https://eatbook.sg/popular-hawker-stalls/');
