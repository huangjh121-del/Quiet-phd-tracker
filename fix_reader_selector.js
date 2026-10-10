const fs = require('fs');

let code = fs.readFileSync('src/app/reader/page.tsx', 'utf8');

// 1. Add ID to the text scroll container
code = code.replace(
  'className="w-full h-full overflow-y-auto bg-[#FAF9F6] px-8 py-16"',
  'id="text-scroll-container"\n            className="w-full h-full overflow-y-auto bg-[#FAF9F6] px-8 py-16"'
);

// 2. Fix the querySelector
code = code.replace(
  "const container = document.querySelector('.overflow-y-auto.bg-\\[\\#FAF9F6\\]');",
  "const container = document.getElementById('text-scroll-container');"
);

// Double check the string parsing of the old selector in JS
code = code.replace(
  "const container = document.querySelector('.overflow-y-auto.bg-\\[\\#FAF9F6\\]');",
  "const container = document.getElementById('text-scroll-container');"
);
// And also check for the literal one in case it was written exactly as the screenshot
code = code.replace(
  "const container = document.querySelector('.overflow-y-auto.bg-\\[\\#FAF9F6\\]');",
  "const container = document.getElementById('text-scroll-container');"
);

// Fallback regex if backslashes are messed up
code = code.replace(/const container = document\.querySelector\('\.overflow[^']+'\);/, "const container = document.getElementById('text-scroll-container');");

fs.writeFileSync('src/app/reader/page.tsx', code);
