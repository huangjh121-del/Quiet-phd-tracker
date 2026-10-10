const fs = require('fs');
let code = fs.readFileSync('src/app/review/words/page.tsx', 'utf8');

// The words/page.tsx is our template. We just replace word specifics with phrase specifics!
code = code.replace(/type=word/g, 'type=phrase');
code = code.replace(/Vocabulary \(生词库\)/g, 'Good Expressions (短语库)');
code = code.replace(/WORDS TOTAL/g, 'PHRASES TOTAL');
code = code.replace(/newWords/g, 'newPhrases');
code = code.replace(/dueWords/g, 'duePhrases');
code = code.replace(/learnedWords/g, 'learnedPhrases');
code = code.replace(/No words added yet./g, 'No phrases added yet.');
code = code.replace(/\{item\.word\}/g, '{item.phrase}');
// phrases use 'repetitions', words use 'repetition'
code = code.replace(/item\.repetition/g, 'item.repetitions');
code = code.replace(/newPhrases = items\.filter\(i => i\.repetitions === 0\);/g, 'newPhrases = items.filter(i => (i.repetitions || 0) === 0);');
code = code.replace(/isNew = item\.repetitions === 0;/g, 'isNew = (item.repetitions || 0) === 0;');

// For phrase list items, the right side shouldn't have dict-html-container since there's no html_definition!
// Instead, the right side should show the source_title and context nicely.
const rightSide = `<div className="flex-1 border-l border-[#F3F4F6] pl-6 relative max-h-[160px] overflow-y-auto overflow-x-hidden custom-scrollbar bg-[#F9FAFB]/30">
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

const newRightSide = `<div className="flex-1 border-l border-[#F3F4F6] pl-6 relative flex flex-col justify-center">
                      <div className="text-sm text-[#6B7280] italic leading-relaxed line-clamp-3 md:line-clamp-2">
                        "{item.context}"
                      </div>
                      <div className="mt-3 text-xs font-bold uppercase tracking-widest text-[#9CA3AF] flex items-center gap-2">
                        <BookOpen className="w-3 h-3" /> {item.source_title || 'Unknown Source'}
                      </div>
                    </div>`;

code = code.replace(rightSide, newRightSide);

// Also need to import BookOpen if not imported
if (!code.includes('BookOpen')) {
  code = code.replace('Flame } from \'lucide-react\';', 'Flame, BookOpen } from \'lucide-react\';');
}

// Remove oald10.css link since phrases don't need it
code = code.replace('<link rel="stylesheet" href="/oald10.css" />', '');

fs.writeFileSync('src/app/review/phrases/page.tsx', code);
console.log('Rewritten phrases page');
