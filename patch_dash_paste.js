const fs = require('fs');

let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Add new state for the tabs and text pasting
code = code.replace(
  "const [importCategory, setImportCategory] = useState<'book' | 'article'>('book');",
  "const [importCategory, setImportCategory] = useState<'book' | 'article'>('book');\n  const [importMethod, setImportMethod] = useState<'file' | 'text'>('file');\n  const [pastedTitle, setPastedTitle] = useState('');\n  const [pastedText, setPastedText] = useState('');"
);

// 2. Add handlePasteSave function
const handlePasteSave = `
  const handlePasteSave = async () => {
    if (!pastedText.trim()) {
      alert("Please enter some text.");
      return;
    }
    
    setIsExtracting(true);
    try {
      const id = Date.now().toString();
      const title = pastedTitle.trim() || 'Pasted Document';
      const newBook: BookMetadata = {
        id,
        title,
        author: "Pasted Text",
        type: 'text' as any,
        category: importCategory,
        lastReadAt: Date.now(),
        progress: 0,
        currentLocation: 0,
        totalSize: 0
      };

      const currentLib = await localforage.getItem<BookMetadata[]>('quiet_library') || [];
      currentLib.push(newBook);
      
      const blob = new Blob([pastedText], { type: 'text/plain' });
      
      await localforage.setItem('quiet_library', currentLib);
      await localforage.setItem(\`quiet_book_\${id}\`, blob);
      
      router.push(\`/reader?id=\${id}\`);
    } catch (err) {
      console.error("Error saving text:", err);
      alert("Could not save this text.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileUpload`;

code = code.replace("const handleFileUpload", handlePasteSave);

// 3. Update the modal UI to include tabs and the textarea
const oldUploadZone = `              {/* Upload Zone */}
              <div>
                <h4 className="text-[11px] font-bold tracking-widest uppercase text-[#6B7280] mb-3">Upload File (PDF / EPUB)</h4>
                <div 
                  className={"border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer group transition-colors " + (isDragging ? (importCategory==='book'?'border-[#3D5A80] bg-[#3D5A80]/5':'border-[#E07A5F] bg-[#E07A5F]/5') : 'border-[#D1D5DB] hover:border-[#9CA3AF] bg-[#FAF9F6]')} 
                  onClick={() => fileInputRef.current?.click()} 
                  onDragOver={handleDragOver} 
                  onDragLeave={handleDragLeave} 
                  onDrop={handleDrop}
                >
                  <input type="file" accept=".epub,.pdf" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-10 h-10 text-[#6B7280] animate-spin mb-4" />
                      <p className="font-bold text-[#111827]">Processing Document...</p>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Upload className="w-6 h-6 text-[#9CA3AF]" /></div>
                      <p className="font-bold text-[#111827] mb-1">Click or Drag & Drop</p>
                      <p className="text-xs text-[#6B7280]">Supports .epub and .pdf formats</p>
                    </>
                  )}
                </div>
              </div>`;

const newUploadZone = `              {/* Import Method Tabs */}
              <div>
                <div className="flex gap-4 border-b border-[#E5E5E5] mb-6">
                  <button onClick={() => setImportMethod('file')} className={\`pb-3 font-bold text-sm tracking-wide border-b-2 transition-all \${importMethod === 'file' ? 'border-[#111827] text-[#111827]' : 'border-transparent text-[#9CA3AF] hover:text-[#6B7280]'}\`}>Upload File</button>
                  <button onClick={() => setImportMethod('text')} className={\`pb-3 font-bold text-sm tracking-wide border-b-2 transition-all \${importMethod === 'text' ? 'border-[#111827] text-[#111827]' : 'border-transparent text-[#9CA3AF] hover:text-[#6B7280]'}\`}>Paste Text</button>
                </div>

                {importMethod === 'file' ? (
                  <div 
                    className={"border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer group transition-colors " + (isDragging ? (importCategory==='book'?'border-[#3D5A80] bg-[#3D5A80]/5':'border-[#E07A5F] bg-[#E07A5F]/5') : 'border-[#D1D5DB] hover:border-[#9CA3AF] bg-[#FAF9F6]')} 
                    onClick={() => fileInputRef.current?.click()} 
                    onDragOver={handleDragOver} 
                    onDragLeave={handleDragLeave} 
                    onDrop={handleDrop}
                  >
                    <input type="file" accept=".epub,.pdf" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-10 h-10 text-[#6B7280] animate-spin mb-4" />
                        <p className="font-bold text-[#111827]">Processing Document...</p>
                      </>
                    ) : (
                      <>
                        <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Upload className="w-6 h-6 text-[#9CA3AF]" /></div>
                        <p className="font-bold text-[#111827] mb-1">Click or Drag & Drop</p>
                        <p className="text-xs text-[#6B7280]">Supports .epub and .pdf formats</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <input 
                      type="text" 
                      placeholder="Article Title (Optional)" 
                      value={pastedTitle}
                      onChange={(e) => setPastedTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[#D1D5DB] focus:outline-none focus:border-[#3D5A80] focus:ring-1 focus:ring-[#3D5A80] font-serif"
                    />
                    <textarea 
                      placeholder="Paste your article or text here..." 
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      className="w-full h-48 px-4 py-3 rounded-xl border border-[#D1D5DB] focus:outline-none focus:border-[#3D5A80] focus:ring-1 focus:ring-[#3D5A80] resize-none font-serif"
                    />
                    <button 
                      onClick={handlePasteSave}
                      disabled={isExtracting || !pastedText.trim()}
                      className="w-full bg-[#111827] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#374151] transition-colors disabled:opacity-50"
                    >
                      {isExtracting ? 'Saving...' : 'Save & Start Reading'}
                    </button>
                  </div>
                )}
              </div>`;

code = code.replace(oldUploadZone, newUploadZone);

// 4. Update the BookMetadata interface locally to include 'text' type without throwing TS errors
code = code.replace(
  "type: 'pdf' | 'epub';",
  "type: 'pdf' | 'epub' | 'text';"
);

fs.writeFileSync('src/app/page.tsx', code);
