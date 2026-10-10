const fs = require('fs');
let code = fs.readFileSync('src/app/review/words/page.tsx', 'utf8');

const oldLabels = `                        {isNew ? (
                          <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md bg-[#F3F4F6] text-[#6B7280]">New</span>
                        ) : isDue ? (
                          <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md bg-[#E07A5F]/10 text-[#E07A5F]">Due Review</span>
                        ) : (
                          <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md bg-[#5B8266]/10 text-[#5B8266]">Learning</span>
                        )}`;

const newLabels = `                        {isNew ? (
                          <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md bg-[#F3F4F6] text-[#6B7280]">New</span>
                        ) : isDue ? (
                          <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md bg-[#E07A5F]/10 text-[#E07A5F]">Due Review</span>
                        ) : (
                          <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md bg-[#5B8266]/10 text-[#5B8266]">Learned ({item.repetition} reps)</span>
                        )}`;

code = code.replace(oldLabels, newLabels);
fs.writeFileSync('src/app/review/words/page.tsx', code);
console.log('Updated labels');
