const fs = require('fs');
let code = fs.readFileSync('src/app/reader/page.tsx', 'utf8');

code = code.replace(
  "if (bookInfo && bookInfo.type === 'text') {",
  "if (blob.type === 'text/plain') {"
);

fs.writeFileSync('src/app/reader/page.tsx', code);
