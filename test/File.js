const filenamify = require('filenamify');
console.log(filenamify('https://eatbook.sg/popular-hawker-stalls/', {replacement: ''}).replace(/https|http/g, ''));