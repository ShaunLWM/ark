const express = require('express');
const exphbs = require('express-handlebars');
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