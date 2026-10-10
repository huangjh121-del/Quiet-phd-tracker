const fs = require('fs');
let code = fs.readFileSync('src/app/reader/ReaderClient.tsx', 'utf8');

const regex = /doc\.addEventListener\('mousedown', \(\) => \{\n                  if \(hoverTimer\.current\) clearTimeout\(hoverTimer\.current\);\n                  setActivePopup\(null\);\n                \}\);/;

const replacement = `doc.addEventListener('mousedown', () => {
                  if (hoverTimer.current) clearTimeout(hoverTimer.current);
                  if (closeTimer.current) clearTimeout(closeTimer.current);
                  setActivePopup(null);
                }, true); // use capture`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/app/reader/ReaderClient.tsx', code);
