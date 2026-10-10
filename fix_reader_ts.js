const fs = require('fs');
let code = fs.readFileSync('src/app/reader/ReaderClient.tsx', 'utf8');

code = code.replace("if (window.getSelection()?.toString().trim().length > 0) return;", "if ((window.getSelection()?.toString() || '').trim().length > 0) return;");

fs.writeFileSync('src/app/reader/ReaderClient.tsx', code);
