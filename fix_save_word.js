const fs = require('fs');
let code = fs.readFileSync('src/app/api/save-word/route.ts', 'utf8');

const regex = /const nextReviewAt = now \+ 86400000;/;
const replacement = `const nextReviewAt = now;`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/app/api/save-word/route.ts', code);
