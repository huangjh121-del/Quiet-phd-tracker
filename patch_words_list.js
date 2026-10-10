const fs = require('fs');
let code = fs.readFileSync('src/app/review/words/page.tsx', 'utf8');

// Add the stylesheet
if (!code.includes('<link rel="stylesheet" href="/oald10.css" />')) {
  code = code.replace(
    '<div className="min-h-screen bg-[#FAF9F6] text-[#1C1C1C] flex flex-col relative selection:bg-[#E2E8F0]">',
    '<div className="min-h-screen bg-[#FAF9F6] text-[#1C1C1C] flex flex-col relative selection:bg-[#E2E8F0]">\n      <link rel="stylesheet" href="/oald10.css" />'
  );
}

// Replace the right-side content
const oldContent = `<div className="flex-1 text-sm text-[#6B7280] line-clamp-2 md:line-clamp-1 border-l border-[#F3F4F6] pl-4">
                      {item.context ? (
                        <span className="italic">"{item.context}"</span>
                      ) : (
                        <span dangerouslySetInnerHTML={{ __html: item.html_definition.replace(/<[^>]*>?/gm, ' ').substring(0, 100) + '...' }} />
                      )}
                    </div>`;

const newContent = `<div className="flex-1 border-l border-[#F3F4F6] pl-6 relative max-h-[80px] overflow-hidden">
                      <div className="dict-html-container pointer-events-none scale-90 origin-top-left w-[110%]" dangerouslySetInnerHTML={{ __html: item.html_definition }} />
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent"></div>
                    </div>`;

code = code.replace(oldContent, newContent);

// Wait, what if it's a phrase that has 'context' but NO html_definition? Phrases don't have html_definition!
// But this is the WORDS library. All words have html_definition.
// Wait, the user might WANT to see the context sentence instead if it's there?
// "可以显示很多实质性的内容，包括单词的发音、英文含义或者中文含义...没有完全显示"
// Let's just show the dictionary definition! It's much richer and better uses the space.
// I will keep it focused on the dictionary definition.

fs.writeFileSync('src/app/review/words/page.tsx', code);
console.log('Updated words list');
