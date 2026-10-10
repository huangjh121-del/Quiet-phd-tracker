const fs = require('fs');
let code = fs.readFileSync('src/app/review/words/page.tsx', 'utf8');

const oldContent = `<div className="flex-1 border-l border-[#F3F4F6] pl-6 relative max-h-[80px] overflow-hidden">
                      <div className="dict-html-container pointer-events-none scale-90 origin-top-left w-[110%]" dangerouslySetInnerHTML={{ __html: item.html_definition }} />
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent"></div>
                    </div>`;

const newContent = `<div className="flex-1 border-l border-[#F3F4F6] pl-6 relative max-h-[160px] overflow-y-auto overflow-x-hidden custom-scrollbar bg-[#F9FAFB]/30">
                      <div 
                        className="dict-html-container scale-[0.85] origin-top-left w-[115%] pb-4" 
                        dangerouslySetInnerHTML={{ __html: item.html_definition }} 
                        onClick={(e) => {
                          const anchor = (e.target as HTMLElement).closest('a');
                          if (anchor && !anchor.getAttribute('href')?.startsWith('sound://')) {
                            e.preventDefault(); // prevent navigation on internal dict links in list view
                          }
                        }}
                      />
                    </div>`;

code = code.replace(oldContent, newContent);
fs.writeFileSync('src/app/review/words/page.tsx', code);
console.log('Updated words list scrolling');
