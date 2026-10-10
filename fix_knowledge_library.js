const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// Add new icons
code = code.replace("import { BookOpen,", "import { BookOpen, BookA, TextQuote, Quote,");

// Find the section and replace it
const startTag = '<h2 className="text-2xl font-serif font-semibold text-[#111827]">Knowledge Library</h2>';
const endTag = '</Link>\n            </section>';

const startIndex = code.indexOf(startTag);
const endIndex = code.indexOf(endTag) + endTag.length;

if (startIndex !== -1 && endIndex !== -1) {
  const newSection = `<h2 className="text-2xl font-serif font-semibold text-[#111827] mb-6">Knowledge Library</h2>
              <div className="space-y-4">
                <Link href="/review/words" className="flex items-center justify-between p-4 rounded-2xl bg-white hover:bg-[#F9FAFB] transition-all group border border-[#E5E5E5] hover:shadow-md hover:-translate-y-0.5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#3D5A80]/10 text-[#3D5A80] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <BookA className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block font-bold text-sm text-[#111827] mb-1">Vocabulary</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#6B7280]">{libStats.words} Words</span>
                    </div>
                  </div>
                  {libStats.dueWords > 0 ? (
                    <span className="bg-[#E07A5F] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm">{libStats.dueWords} Due</span>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-[#D1D5DB] group-hover:text-[#111827] transition-colors" />
                  )}
                </Link>

                <Link href="/review/phrases" className="flex items-center justify-between p-4 rounded-2xl bg-white hover:bg-[#F9FAFB] transition-all group border border-[#E5E5E5] hover:shadow-md hover:-translate-y-0.5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#E07A5F]/10 text-[#E07A5F] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TextQuote className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block font-bold text-sm text-[#111827] mb-1">Good Expressions</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#6B7280]">{libStats.phrases} Phrases</span>
                    </div>
                  </div>
                  {libStats.duePhrases > 0 ? (
                    <span className="bg-[#E07A5F] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm">{libStats.duePhrases} Due</span>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-[#D1D5DB] group-hover:text-[#111827] transition-colors" />
                  )}
                </Link>

                <Link href="/sentences" className="flex items-center justify-between p-4 rounded-2xl bg-white hover:bg-[#F9FAFB] transition-all group border border-[#E5E5E5] hover:shadow-md hover:-translate-y-0.5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#5B8266]/10 text-[#5B8266] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Quote className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block font-bold text-sm text-[#111827] mb-1">Beautiful Sentences</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#6B7280]">{libStats.sentences} Sentences</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#D1D5DB] group-hover:text-[#111827] transition-colors" />
                </Link>
              </div>
            </section>`;
  
  const before = code.substring(0, startIndex);
  const after = code.substring(endIndex);
  code = before + newSection + after;
  
  // also clean up the top header block if it exists
  const oldHeader = code.indexOf('<div className="flex justify-between items-center mb-6">');
  if (oldHeader !== -1 && oldHeader < code.indexOf('Knowledge Library')) {
    // it's fine
  }
}

fs.writeFileSync('src/app/page.tsx', code);
