const fs = require('fs');
let code = fs.readFileSync('src/app/review/session/page.tsx', 'utf8');

if (!code.includes('<link rel="stylesheet" href="/oald10.css" />')) {
  code = code.replace(
    '<div className="min-h-screen bg-[#FAF9F6] text-[#1C1C1C] flex flex-col selection:bg-[#E2E8F0]">',
    '<div className="min-h-screen bg-[#FAF9F6] text-[#1C1C1C] flex flex-col selection:bg-[#E2E8F0]">\n      <link rel="stylesheet" href="/oald10.css" />'
  );
  fs.writeFileSync('src/app/review/session/page.tsx', code);
  console.log("Added CSS to session page");
}
