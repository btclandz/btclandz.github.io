console.log('Hello World!')
const testFolder = './';
const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
fs.readdirSync(testFolder).forEach(file => {
  console.log(file);
});
fs.readFile('index.html', function(err, data) {
    //console.log(data.toString());
    const dom = new JSDOM(data.toString(), { runScripts: "dangerously" });
    const elements = dom.window.document.getElementsByClassName('ads-wrapper');
    while(elements.length > 0){
        elements[0].parentNode.removeChild(elements[0]);
    }
    var elements1 = dom.window.document.getElementsByClassName('dcmads');
    while(elements1.length > 0){
        elements1[0].parentNode.removeChild(elements1[0]);
    }
    elements1 = dom.window.document.getElementsByClassName('GoogleActiveViewElement');
    while(elements1.length > 0){
        elements1[0].parentNode.removeChild(elements1[0]);
    }
    elements1 = dom.window.document.getElementsByClassName('placement_473972_0_ins');
    while(elements1.length > 0){
        elements1[0].parentNode.removeChild(elements1[0]);
    }
    elements1 = dom.window.document.getElementsByClassName('etoro-popup-banner');
    while(elements1.length > 0){
        elements1[0].parentNode.removeChild(elements1[0]);
    }
    //console.log(dom.serialize());
    fs.writeFile('index.html', dom.serialize(), function (err) {
        if (err) throw err;
        console.log('Saved!');
      }); 
  });