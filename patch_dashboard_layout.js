const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

code = code.replace(
  '<span className="bg-[#E07A5F] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm">{libStats.dueWords} Due</span>',
  '<span className="bg-[#E07A5F] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap shrink-0">{libStats.dueWords} Due</span>'
);

code = code.replace(
  '<span className="bg-[#E07A5F] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm">{libStats.duePhrases} Due</span>',
  '<span className="bg-[#E07A5F] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap shrink-0">{libStats.duePhrases} Due</span>'
);

code = code.replace(
  '<span className="bg-[#E07A5F] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm">{libStats.dueSentences} Due</span>',
  '<span className="bg-[#E07A5F] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap shrink-0">{libStats.dueSentences} Due</span>'
);

fs.writeFileSync('src/app/page.tsx', code);
console.log('Fixed dashboard layout');
