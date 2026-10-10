const fs = require('fs');
let code = fs.readFileSync('src/app/reader/ReaderClient.tsx', 'utf8');
code = code.replace('const match = sentences.find(s => s.includes(word));', 'const match = sentences.find((s: string) => s.includes(word));');
fs.writeFileSync('src/app/reader/ReaderClient.tsx', code);
