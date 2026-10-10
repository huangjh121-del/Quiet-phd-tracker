const fs = require('fs');
let code = fs.readFileSync('src/app/reader/ReaderClient.tsx', 'utf8');

const oldLogic = `    if (anchor) {
      e.preventDefault();
      let wordToLookUp = anchor.innerText.trim();`;

const newLogic = `    if (anchor) {
      // Don't intercept sound icons
      if (anchor.getAttribute('href')?.startsWith('sound://')) return;
      
      let wordToLookUp = anchor.innerText.trim();`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/app/reader/ReaderClient.tsx', code);
console.log('Fixed preventDefault');
