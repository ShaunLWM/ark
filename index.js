const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const fs = require('fs-extra');
const { format } = require('timeago.js');
const Archiver = require('archiver');

const ArchiveManager = require('./modules/ArchiveManager');
let archivesDirectory = 'archives';
let mainDirectory = path.join(__dirname, archivesDirectory);
let archiveManager = new ArchiveManager({ mainDirectory });

const app = express();
let hbs = exphbs.create({
    defaultLayout: 'main.hbs',
    helpers: {
        timeago: function (time) { return format(time, 'en_US'); }
    }
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
const port = 8081;

fs.ensureDirSync(archivesDirectory);
app.use(express.static('public'));
app.use('/archives', express.static(archivesDirectory));
app.get('/', (req, res) => {
    return res.render('index.hbs', {
        archives: archiveManager.getArchives().map(archive => {
            let dir = path.join(archivesDirectory, archive.folder);
            return {
                full: (fs.pathExistsSync(path.join(dir, 'full', 'index.html')) ? fs.pathExistsSync(path.join(dir, 'full', 'index.html')) : ''),
                archiveorg: (fs.pathExistsSync(path.join(dir, 'archive.org.txt')) ? fs.readFileSync(path.join(dir, 'archive.org.txt')) : ''),
                favicon: (fs.pathExistsSync(path.join(dir, 'favicon.ico')) ? path.join(dir, 'favicon.ico') : ''),
                dom: (fs.pathExistsSync(path.join(dir, 'output.html')) ? path.join(dir, 'output.html') : ''),
                pdf: (fs.pathExistsSync(path.join(dir, 'output.pdf')) ? path.join(dir, 'output.pdf') : ''),
                screenshot: (fs.pathExistsSync(path.join(dir, 'output.png')) ? path.join(dir, 'output.png') : ''),
                ...archive,
            }
        })
    });
});

app.get('/s', async (req, res) => {
    if (typeof req.query.url === 'undefined') {
        return res.status(404).json({
            status: 'failed',
            message: 'no parameter'
        })
    }

    let url = req.query.url;
    let expression = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})/g;
    let regex = new RegExp(expression);
    if (url.length < 1 || !url.match(regex)) {
        return res.status(404).json({
            status: 'failed',
            message: 'failed check'
        })
    }

    try {
        let result = await archiveManager.addUrl(url);
        return res.status(200).send(result);
    } catch (error) {
        return res.status(404).send(error);
    }
});

app.get('/d/:id', function (req, res) {
    let archive = archiveManager.getArchivePath(req.params.id);
    if (typeof archive === 'undefined') {
        return res.status(404).send('not found');
    }

    res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-disposition': `attachment; filename=${archive.folder}.zip`
    });

    var zip = Archiver('zip');
    zip.pipe(res);
    return zip.directory(path.join(__dirname, archivesDirectory, archive.folder, 'full'), false).finalize();
});

app.listen(port, () => console.log(`[@] ark running on ${port}!`))