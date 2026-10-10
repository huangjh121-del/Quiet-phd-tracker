const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');
code = code.replace(
  "const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => processFile(e.target.files?.[0]);",
  "const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if(file) processFile(file); };"
);
fs.writeFileSync('src/app/page.tsx', code);
