const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// For Book
const oldBookProgress = `<div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-[#6B7280]">Progress</span>
                      <span className="text-xs font-bold text-[#111827]">{mostRecentBook.progress}%</span>
                    </div>
                    <div className="w-full bg-[#F3F4F6] rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#3D5A80] h-full rounded-full" style={{ width: \`\${mostRecentBook.progress}%\` }}></div>
                    </div>`;

const newBookProgress = `<div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-[#6B7280]">Status</span>
                      <span className="text-xs font-bold text-[#111827] uppercase tracking-widest">{mostRecentBook.isCompleted ? 'Completed' : mostRecentBook.progress > 0 ? \`\${mostRecentBook.progress}% Read\` : 'New'}</span>
                    </div>
                    <div className="w-full bg-[#F3F4F6] rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#3D5A80] h-full rounded-full" style={{ width: \`\${mostRecentBook.isCompleted ? 100 : mostRecentBook.progress}%\` }}></div>
                    </div>`;

code = code.replace(oldBookProgress, newBookProgress);

// For Article
const oldArticleProgress = `<div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-[#6B7280]">Progress</span>
                      <span className="text-xs font-bold text-[#111827]">{mostRecentArticle.progress}%</span>
                    </div>
                    <div className="w-full bg-[#F3F4F6] rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#E07A5F] h-full rounded-full" style={{ width: \`\${mostRecentArticle.progress}%\` }}></div>
                    </div>`;

const newArticleProgress = `<div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-[#6B7280]">Status</span>
                      <span className="text-xs font-bold text-[#111827] uppercase tracking-widest">{mostRecentArticle.isCompleted ? 'Completed' : mostRecentArticle.progress > 0 ? \`\${mostRecentArticle.progress}% Read\` : 'New'}</span>
                    </div>
                    <div className="w-full bg-[#F3F4F6] rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#E07A5F] h-full rounded-full" style={{ width: \`\${mostRecentArticle.isCompleted ? 100 : mostRecentArticle.progress}%\` }}></div>
                    </div>`;

code = code.replace(oldArticleProgress, newArticleProgress);

fs.writeFileSync('src/app/page.tsx', code);
console.log('Patched dashboard recent status');
