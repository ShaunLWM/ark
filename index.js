const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const fs = require('fs-extra');

const ArchiveManager = require('./modules/ArchiveManager');
let archivesDirectory = 'archives';
let mainDirectory = path.join(__dirname, archivesDirectory);
let archiveManager = new ArchiveManager({ mainDirectory });

const app = express();
let hbs = exphbs.create({
    defaultLayout: 'main.hbs',
    helpers: {
        foo: function () { return 'FOO!'; },
        bar: function () { return 'BAR!'; }
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
            let dir = path.join(archivesDirectory, archive.title);
            return {
                favicon: (fs.pathExistsSync(path.join(dir, 'favicon.ico')) ? path.join(dir, 'favicon.ico') : ''),
                dom: (fs.pathExistsSync(path.join(dir, 'output.html')) ? path.join(dir, 'output.html') : ''),
                pdf: (fs.pathExistsSync(path.join(dir, 'output.pdf')) ? path.join(dir, 'output.pdf') : ''),
                screenshot: (fs.pathExistsSync(path.join(dir, 'output.png')) ? path.join(dir, 'output.png') : ''),
                ...archive,
            }
        })
    });
});
app.listen(port, () => console.log(`[@] ark running on ${port}!`))