const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const oldWordsCondition = `{libStats.dueWords > 0 ? (
                    <span className="bg-[#E07A5F] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap shrink-0">{libStats.dueWords} Due</span>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-[#D1D5DB] group-hover:text-[#111827] transition-colors" />
                  )}`;

const newWordsCondition = `<span className={\`text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap shrink-0 \${libStats.dueWords > 0 ? 'bg-[#E07A5F] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}\`}>
                    {libStats.dueWords} Due
                  </span>`;

const oldPhrasesCondition = `{libStats.duePhrases > 0 ? (
                    <span className="bg-[#E07A5F] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap shrink-0">{libStats.duePhrases} Due</span>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-[#D1D5DB] group-hover:text-[#111827] transition-colors" />
                  )}`;

const newPhrasesCondition = `<span className={\`text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap shrink-0 \${libStats.duePhrases > 0 ? 'bg-[#E07A5F] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}\`}>
                    {libStats.duePhrases} Due
                  </span>`;

code = code.replace(oldWordsCondition, newWordsCondition);
code = code.replace(oldPhrasesCondition, newPhrasesCondition);

fs.writeFileSync('src/app/page.tsx', code);
console.log('Patched due conditions to show 0');
