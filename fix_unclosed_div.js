const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

code = code.replace('<div className="flex justify-between items-center mb-6">\n                <h2 className="text-2xl font-serif font-semibold text-[#111827] mb-6">Knowledge Library</h2>', '<h2 className="text-2xl font-serif font-semibold text-[#111827] mb-6">Knowledge Library</h2>');

fs.writeFileSync('src/app/page.tsx', code);
