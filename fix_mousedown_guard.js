const fs = require('fs');
let code = fs.readFileSync('src/app/reader/ReaderClient.tsx', 'utf8');

const regex = /const handleClick = \(e: MouseEvent\) => \{\n      if \(!\(e\.target as HTMLElement\)\.closest\('\.dict-popup'\)\) \{\n        setActivePopup\(null\);\n      \}\n    \};/;

const replacement = `const handleClick = (e: MouseEvent) => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (!(e.target as HTMLElement).closest('.dict-popup')) {
        setActivePopup(null);
      }
    };`;

code = code.replace(regex, replacement);

// And also fix the iframe mousedown
const iframeRegex = /doc\.addEventListener\('mousedown', \(\) => setActivePopup\(null\)\);/;
const iframeReplacement = `doc.addEventListener('mousedown', () => {
                  if (hoverTimer.current) clearTimeout(hoverTimer.current);
                  setActivePopup(null);
                });`;

code = code.replace(iframeRegex, iframeReplacement);

fs.writeFileSync('src/app/reader/ReaderClient.tsx', code);
