const fs = require('fs');
let code = fs.readFileSync('src/app/reader/ReaderClient.tsx', 'utf8');

// 1. Add isCompleted state
code = code.replace(
  "const [toast, setToast] = useState<string | null>(null);",
  "const [toast, setToast] = useState<string | null>(null);\n  const [isCompleted, setIsCompleted] = useState<boolean>(false);"
);

// 2. Initialize isCompleted
code = code.replace(
  "setBookTitle(bookInfo.title);",
  "setBookTitle(bookInfo.title);\n          setIsCompleted(bookInfo.isCompleted || false);"
);

// 3. Prevent progress overwriting if completed
const oldSaveProgress = `      lib[idx].progress = progressPercent;
      lib[idx].lastReadAt = Date.now();`;
const newSaveProgress = `      lib[idx].progress = lib[idx].isCompleted ? 100 : progressPercent;
      lib[idx].lastReadAt = Date.now();`;
code = code.replace(oldSaveProgress, newSaveProgress);

// 4. Create Mark as Completed function
const completeFunc = `
  const markAsCompleted = async () => {
    if (!bookId) return;
    setIsCompleted(true);
    const lib = await localforage.getItem<any[]>('quiet_library') || [];
    const idx = lib.findIndex(b => b.id === bookId);
    if (idx !== -1) {
      lib[idx].isCompleted = true;
      lib[idx].progress = 100;
      await localforage.setItem('quiet_library', lib);
      showToast("Marked as Completed!");
    }
  };
`;
code = code.replace('const saveProgress = async', completeFunc + '\n  const saveProgress = async');

// 5. Add button to the header
// We'll put it in a right-side group
// Check where to inject. There's a div holding PDF controls, or if it's EPUB/text it might be empty on the right.
// The header right side currently is:
/*
        {fileType === 'pdf' && (
          <div className="flex items-center gap-4">
            ...
          </div>
        )}
*/
// Let's replace the whole header structure. We'll find it:

const oldHeaderRight = `{fileType === 'pdf' && (
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white border border-[#E5E5E5] rounded-full p-1 shadow-sm">
              <button 
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber(p => { const next = p - 1; saveProgress(next, Math.round((next/numPages)*100), numPages); return next; })}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3F4F6] text-[#6B7280] disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center px-2">
                <input 
                  type="number" 
                  min={1} 
                  max={numPages} 
                  value={pageNumber}
                  onChange={(e) => { const val = Number(e.target.value); if(val >= 1 && val <= numPages) { setPageNumber(val); saveProgress(val, Math.round((val/numPages)*100), numPages); } }}
                  className="w-12 text-center text-sm font-bold text-[#111827] bg-transparent outline-none focus:ring-2 focus:ring-[#3D5A80] rounded"
                />
                <span className="text-xs text-[#9CA3AF] ml-1">/ {numPages}</span>
              </div>
              <button 
                disabled={pageNumber >= numPages}
                onClick={() => setPageNumber(p => { const next = p + 1; saveProgress(next, Math.round((next/numPages)*100), numPages); return next; })}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3F4F6] text-[#6B7280] disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}`;

const newHeaderRight = `<div className="flex items-center gap-4">
          {fileType === 'pdf' && (
            <div className="flex items-center bg-white border border-[#E5E5E5] rounded-full p-1 shadow-sm">
              <button 
                disabled={pageNumber <= 1}
                onClick={() => setPageNumber(p => { const next = p - 1; saveProgress(next, Math.round((next/numPages)*100), numPages); return next; })}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3F4F6] text-[#6B7280] disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center px-2">
                <input 
                  type="number" 
                  min={1} 
                  max={numPages} 
                  value={pageNumber}
                  onChange={(e) => { const val = Number(e.target.value); if(val >= 1 && val <= numPages) { setPageNumber(val); saveProgress(val, Math.round((val/numPages)*100), numPages); } }}
                  className="w-12 text-center text-sm font-bold text-[#111827] bg-transparent outline-none focus:ring-2 focus:ring-[#3D5A80] rounded"
                />
                <span className="text-xs text-[#9CA3AF] ml-1">/ {numPages}</span>
              </div>
              <button 
                disabled={pageNumber >= numPages}
                onClick={() => setPageNumber(p => { const next = p + 1; saveProgress(next, Math.round((next/numPages)*100), numPages); return next; })}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3F4F6] text-[#6B7280] disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {isCompleted ? (
            <div className="flex items-center gap-2 px-4 py-2 bg-[#5B8266]/10 text-[#5B8266] rounded-full text-xs font-bold uppercase tracking-widest">
              <Check className="w-4 h-4" /> Completed
            </div>
          ) : (
            <button 
              onClick={markAsCompleted}
              className="flex items-center gap-2 px-4 py-2 bg-[#111827] hover:bg-[#3D5A80] text-white rounded-full text-xs font-bold uppercase tracking-widest transition-colors shadow-sm"
            >
              <Check className="w-4 h-4" /> Mark Complete
            </button>
          )}
        </div>`;

code = code.replace(oldHeaderRight, newHeaderRight);

fs.writeFileSync('src/app/reader/ReaderClient.tsx', code);
console.log('Patched reader client with complete button');
