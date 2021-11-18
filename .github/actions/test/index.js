console.log('Hello World!')
const testFolder = './';
const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
fs.readdirSync(testFolder).forEach(file => {
  console.log(file);
});
fs.readFile('index.html', function(err, data) {
    console.log(data.toString());


  });