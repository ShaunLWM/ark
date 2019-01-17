const express = require('express');
const exphbs = require('express-handlebars');

const ArchiveManager = require('./modules/ArchiveManager');
let archiveManager = new ArchiveManager({ mainDirectory: __dirname });

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

app.use(express.static('public'));
app.get('/', (req, res) => res.render('index.hbs'));
app.listen(port, () => console.log(`Example app listening on port ${port}!`))