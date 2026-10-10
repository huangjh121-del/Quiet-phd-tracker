const fs = require('fs');
let code = fs.readFileSync('src/app/reader/page.tsx', 'utf8');

if (!code.includes("'use client'")) {
  code = "'use client';\n\n" + code;
  fs.writeFileSync('src/app/reader/page.tsx', code);
}
