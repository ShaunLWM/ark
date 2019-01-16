const Archive = require('../module/Archive');
let archive = new Archive({
    dir: 'eatbook',
    url: 'https://eatbook.sg/popular-hawker-stalls/'
});


archive.fetchFavicon().then(result => {
    console.log(result);
    return archive.fetchPDF();
}).then(() => {
    return archive.fetchScreenshot();
}).then(() => {
    return archive.fetchDom();
}).then(() => {
    return archive.submitArchiveOrg();
}).then(result => {
    console.log(result);
}).catch(error => {
    console.log(error);
});