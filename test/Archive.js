const Archive = require('../modules/Archive');
let archive = new Archive({
    dir: __dirname,
    url: 'https://eatbook.sg/popular-hawker-stalls/'
});

console.log(__dirname);

archive.fetchFavicon().then(result => {
    console.log(result);
    return archive.fetchPDF();
}).then(result => {
    console.log(result);
    return archive.fetchScreenshot();
}).then(result => {
    console.log(result);
    return archive.fetchDom();
}).then(result => {
    console.log(result);
    return archive.submitArchiveOrg();
}).then(result => {
    console.log(result);
}).catch(error => {
    console.log(error);
});