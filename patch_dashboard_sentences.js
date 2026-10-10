const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const oldHeader = `<div className="flex gap-4">\n          <Link href="/review" className="bg-[#1C1C1C] text-[#FAF9F6] px-6 py-2.5 rounded-full font-bold text-sm tracking-wide shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all">`;
const newHeader = `<div className="flex gap-4">\n          <Link href="/sentences" className="bg-[#FAF9F6] border border-[#E5E5E5] text-[#1C1C1C] px-6 py-2.5 rounded-full font-bold text-sm tracking-wide shadow-sm hover:-translate-y-0.5 hover:bg-white transition-all">\n            Beautiful Sentences\n          </Link>\n          <Link href="/review" className="bg-[#1C1C1C] text-[#FAF9F6] px-6 py-2.5 rounded-full font-bold text-sm tracking-wide shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all">`;

code = code.replace(oldHeader, newHeader);
fs.writeFileSync('src/app/page.tsx', code);
