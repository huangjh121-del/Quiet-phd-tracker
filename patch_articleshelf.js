const fs = require('fs');
let code = fs.readFileSync('src/app/library/articles/page.tsx', 'utf8');

const oldProgress = `<span className="bg-[#F3F4F6] px-2 py-1 rounded-md">{article.progress}% Read</span>`;
const newProgress = `
                  {article.isCompleted ? (
                    <span className="bg-[#5B8266]/10 text-[#5B8266] px-2 py-1 rounded-md uppercase tracking-widest">Completed</span>
                  ) : article.progress > 0 ? (
                    <span className="bg-[#111827] text-white px-2 py-1 rounded-md">{article.progress}% Read</span>
                  ) : (
                    <span className="bg-[#F3F4F6] px-2 py-1 rounded-md uppercase tracking-widest text-[#6B7280]">New</span>
                  )}
`;

code = code.replace(oldProgress, newProgress);
fs.writeFileSync('src/app/library/articles/page.tsx', code);
console.log('Patched articleshelf');
