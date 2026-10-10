const fs = require('fs');

function patchFile(path, color, defaultMsg) {
  let code = fs.readFileSync(path, 'utf8');
  
  const oldProgress = `{book.progress > 0 && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-[#111827] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                    {book.progress}% Read
                  </div>
                )}`;
                
  const newProgress = `
                {book.isCompleted ? (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-[#5B8266] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap uppercase tracking-widest">
                    Completed
                  </div>
                ) : book.progress > 0 ? (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-[#111827] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                    {book.progress}% Read
                  </div>
                ) : (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-[#F3F4F6] text-[#6B7280] text-[10px] font-bold px-3 py-1 rounded-full shadow-sm whitespace-nowrap uppercase tracking-widest border border-[#E5E5E5]">
                    New
                  </div>
                )}
  `;
  
  code = code.replace(oldProgress, newProgress);
  
  // Articles page uses 'article' instead of 'book' in map
  if (path.includes('articles')) {
    code = code.replace(/\{book\./g, '{article.');
  }

  fs.writeFileSync(path, code);
}

patchFile('src/app/library/books/page.tsx', '3D5A80');
console.log('Patched bookshelf');
