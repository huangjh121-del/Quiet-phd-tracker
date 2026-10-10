const fs = require('fs');
let code = fs.readFileSync('src/app/reader/ReaderClient.tsx', 'utf8');

const oldLink = `<Link href="/" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E5E5E5] text-[#6B7280] hover:text-[#111827] transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>`;
          
const newBtn = `<button onClick={() => {
            if (window.history.length > 2) {
              router.back();
            } else {
              router.push('/');
            }
          }} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E5E5E5] text-[#6B7280] hover:text-[#111827] transition-all cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>`;

code = code.replace(oldLink, newBtn);

fs.writeFileSync('src/app/reader/ReaderClient.tsx', code);
console.log('Patched back button');
