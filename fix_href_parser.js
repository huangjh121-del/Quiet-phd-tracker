const fs = require('fs');
let code = fs.readFileSync('src/app/reader/ReaderClient.tsx', 'utf8');

const oldLogic = `      const href = anchor.getAttribute('href');
      if (href && href.startsWith('entry://')) {
        wordToLookUp = decodeURIComponent(href.replace('entry://', ''));
      } else if (href && href.startsWith('dict://')) {
        wordToLookUp = decodeURIComponent(href.replace('dict://', ''));
      } else if (href && href.startsWith('bvg://')) {
        wordToLookUp = decodeURIComponent(href.replace('bvg://', ''));
      }
      
      wordToLookUp = wordToLookUp.replace(/[^a-zA-Z-\\s]/g, '').toLowerCase().trim();`;

const newLogic = `      const href = anchor.getAttribute('href');
      let usedHref = false;
      if (href && href.startsWith('entry://')) {
        wordToLookUp = decodeURIComponent(href.replace('entry://', ''));
        usedHref = true;
      } else if (href && href.startsWith('dict://')) {
        wordToLookUp = decodeURIComponent(href.replace('dict://', ''));
        usedHref = true;
      } else if (href && href.startsWith('bvg://')) {
        wordToLookUp = decodeURIComponent(href.replace('bvg://', ''));
        usedHref = true;
      }
      
      if (usedHref) {
        // Strip hash fragment (e.g., #beefup2_e)
        if (wordToLookUp.includes('#')) {
          wordToLookUp = wordToLookUp.split('#')[0];
        }
        // Often internal links use hyphens instead of spaces for phrases. 
        // We will just let the backend handle it or try both if needed, but for now just use it directly.
        // Also remove weird chars but keep hyphens and spaces
        wordToLookUp = wordToLookUp.replace(/[^a-zA-Z-\\s]/g, '').toLowerCase().trim();
      } else {
        wordToLookUp = wordToLookUp.replace(/[^a-zA-Z-\\s]/g, '').toLowerCase().trim();
      }`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/app/reader/ReaderClient.tsx', code);
console.log('Fixed parser');
