console.log('Hello World!')
const testFolder = './tests/';
const fs = require('fs');

fs.readdirSync(testFolder).forEach(file => {
  console.log(file);
});