const fs = require('fs');
let code = fs.readFileSync('src/app/reader/page.tsx', 'utf8');

code = code.replace(
  "const isPdf = blob.type === 'application/pdf' || blob.name?.toLowerCase().endsWith('.pdf');",
  "const isPdf = blob.type === 'application/pdf' || (blob as File).name?.toLowerCase().endsWith('.pdf');"
);

fs.writeFileSync('src/app/reader/page.tsx', code);
