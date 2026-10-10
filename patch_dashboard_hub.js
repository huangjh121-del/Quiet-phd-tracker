const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// Change the "Beautiful Sentences" and "Review" buttons.
// Actually, earlier I added a "Beautiful Sentences" link. The new Hub is just "/review" which has all 3.
const oldHeader = /<div className="flex gap-4">\n          <Link href="\/sentences" className="bg-\\[#FAF9F6\\] border border-\\[#E5E5E5\\] text-\\[#1C1C1C\\] px-6 py-2.5 rounded-full font-bold text-sm tracking-wide shadow-sm hover:-translate-y-0.5 hover:bg-white transition-all">\n            Beautiful Sentences\n          <\/Link>\n          <Link href="\/review" className="bg-\\[#1C1C1C\\] text-\\[#FAF9F6\\] px-6 py-2.5 rounded-full font-bold text-sm tracking-wide shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all">\n            Review\n          <\/Link>\n        <\/div>/;

const newHeader = `<div className="flex gap-4">
          <Link href="/review" className="bg-[#1C1C1C] text-[#FAF9F6] px-6 py-2.5 rounded-full font-bold text-sm tracking-wide shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all">
            Knowledge Hub
          </Link>
        </div>`;
code = code.replace(oldHeader, newHeader);

// Replace the Books and Articles section with simple clickable hubs
const shelvesRegex = /\{!\!library || library\.length === 0 \? \([\s\S]*?\{\/\* Articles Shelf \*\/\}/;

const newShelves = `
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Link href="/library/books" className="group bg-white rounded-3xl p-8 border border-[#E5E5E5] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center justify-center min-h-[250px]">
            <h2 className="text-3xl font-serif font-bold text-[#111827] mb-2 group-hover:text-[#3D5A80] transition-colors">Book Shelf</h2>
            <p className="text-[#6B7280]">Browse and read your imported books</p>
          </Link>

          <Link href="/library/articles" className="group bg-white rounded-3xl p-8 border border-[#E5E5E5] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center justify-center min-h-[250px]">
            <h2 className="text-3xl font-serif font-bold text-[#111827] mb-2 group-hover:text-[#E07A5F] transition-colors">Article Shelf</h2>
            <p className="text-[#6B7280]">Browse and read your short-form articles</p>
          </Link>
        </div>

        {/* Placeholder to keep regex match happy */}
        {/* Articles Shelf */}`;

code = code.replace(shelvesRegex, newShelves);

// Also remove the old Article Shelf rendering logic below it.
const articleShelfRegex = /<h2 className="text-xl font-serif font-bold text-\\[#111827\\] mb-6">Article Shelf<\/h2>[\s\S]*?<\/div>[\s\S]*?<\/div>/;
code = code.replace(articleShelfRegex, "");

fs.writeFileSync('src/app/page.tsx', code);
