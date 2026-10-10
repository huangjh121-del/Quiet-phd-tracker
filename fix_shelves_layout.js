const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const startMarker = '{/* Book Shelf */}';
const endMarker = '            </section>\n\n          </div>'; // end of Article Shelf

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const newShelves = `
            {/* Unified Shelves Navigation */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/library/books" className="group bg-white rounded-3xl p-8 border border-[#E5E5E5] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center justify-center min-h-[220px]">
                <div className="w-16 h-16 rounded-full bg-[#3D5A80]/10 flex items-center justify-center mb-6 text-[#3D5A80] group-hover:scale-110 transition-transform">
                  <Book className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-[#111827] mb-2 group-hover:text-[#3D5A80] transition-colors">Book Shelf</h2>
                <p className="text-[#6B7280] text-sm text-center">Browse your imported books</p>
                <span className="mt-4 text-[10px] font-bold tracking-widest uppercase text-[#9CA3AF] bg-[#F3F4F6] px-3 py-1 rounded-full">
                  {books.length} Books
                </span>
              </Link>

              <Link href="/library/articles" className="group bg-white rounded-3xl p-8 border border-[#E5E5E5] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center justify-center min-h-[220px]">
                <div className="w-16 h-16 rounded-full bg-[#E07A5F]/10 flex items-center justify-center mb-6 text-[#E07A5F] group-hover:scale-110 transition-transform">
                  <FileText className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-[#111827] mb-2 group-hover:text-[#E07A5F] transition-colors">Article Shelf</h2>
                <p className="text-[#6B7280] text-sm text-center">Browse short-form articles</p>
                <span className="mt-4 text-[10px] font-bold tracking-widest uppercase text-[#9CA3AF] bg-[#F3F4F6] px-3 py-1 rounded-full">
                  {articles.length} Articles
                </span>
              </Link>
            </section>`;
            
  // We need to keep the closing </div>
  const before = code.substring(0, startIndex);
  const after = code.substring(endIndex + '            </section>'.length);
  code = before + newShelves + after;
  fs.writeFileSync('src/app/page.tsx', code);
  console.log("Success");
} else {
  console.log("Could not find markers.", startIndex, endIndex);
}
