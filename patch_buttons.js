const fs = require('fs');
let code = fs.readFileSync('src/app/review/words/page.tsx', 'utf8');

const oldHeaderBtns = `          {newWords.length > 0 && (
            <Link href="/review/learn" className="flex items-center gap-2 bg-[#E07A5F] text-white px-5 py-2.5 rounded-full font-bold text-sm tracking-wide shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
              <GraduationCap className="w-4 h-4" /> Start Learning ({newWords.length})
            </Link>
          )}
          {dueWords.length > 0 && (
            <Link href="/review/session?type=word" className="flex items-center gap-2 bg-[#111827] text-white px-5 py-2.5 rounded-full font-bold text-sm tracking-wide shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
              <Flame className="w-4 h-4 text-[#E07A5F]" /> Review Due ({dueWords.length})
            </Link>
          )}`;

const newHeaderBtns = `          <Link 
            href={newWords.length > 0 ? "/review/learn" : "#"} 
            className={\`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm tracking-wide transition-all \${newWords.length > 0 ? 'bg-[#E07A5F] text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md' : 'bg-[#E5E5E5] text-[#9CA3AF] cursor-not-allowed'}\`}
          >
            <GraduationCap className="w-4 h-4" /> Start Learning ({newWords.length})
          </Link>
          
          <Link 
            href={dueWords.length > 0 ? "/review/session?type=word" : "#"} 
            className={\`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm tracking-wide transition-all \${dueWords.length > 0 ? 'bg-[#111827] text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md' : 'bg-[#E5E5E5] text-[#9CA3AF] cursor-not-allowed'}\`}
          >
            <Flame className={\`w-4 h-4 \${dueWords.length > 0 ? 'text-[#E07A5F]' : ''}\`} /> Review Due ({dueWords.length})
          </Link>`;

code = code.replace(oldHeaderBtns, newHeaderBtns);
fs.writeFileSync('src/app/review/words/page.tsx', code);
console.log('Updated buttons');
