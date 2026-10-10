const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const oldDue = `<h2 className="text-2xl font-serif font-semibold text-[#111827] mb-6">Due for Review (12)</h2>`;
const newDue = `<div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif font-semibold text-[#111827]">Due for Review</h2>
                <Link href="/review" className="text-sm font-bold uppercase tracking-wider text-[#3D5A80] hover:text-[#111827] flex items-center bg-[#3D5A80]/10 px-4 py-2 rounded-xl">
                  Start Review <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>`;

code = code.replace(oldDue, newDue);
fs.writeFileSync('src/app/page.tsx', code);
