const fs = require('fs');
let code = fs.readFileSync('src/app/reader/page.tsx', 'utf8');

const oldCheck = `    const isBackground = el.tagName === 'MAIN' || el.classList.contains('overflow-y-auto') || el.classList.contains('bg-[#FAF9F6]');`;
const newCheck = `    const className = typeof el.className === 'string' ? el.className : '';
    const isBackground = el.tagName === 'MAIN' || className.includes('overflow-y-auto') || className.includes('bg-[#FAF9F6]');`;

code = code.replace(oldCheck, newCheck);
fs.writeFileSync('src/app/reader/page.tsx', code);
