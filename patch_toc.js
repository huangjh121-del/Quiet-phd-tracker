const fs = require('fs');

let code = fs.readFileSync('src/app/reader/page.tsx', 'utf8');

// Add new state variables for TOC
code = code.replace(
  "const [bookTitle, setBookTitle] = useState<string>('');",
  "const [bookTitle, setBookTitle] = useState<string>('');\n  const [showToc, setShowToc] = useState(false);\n  const [toc, setToc] = useState<any[]>([]);\n  const [pdfDoc, setPdfDoc] = useState<any>(null);\n  const [pageInput, setPageInput] = useState<string>('');"
);

// Update PDF onLoadSuccess to capture document and outline
const oldPdfLoad = `const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };`;
const newPdfLoad = `const onDocumentLoadSuccess = async (doc: any) => {
    setPdfDoc(doc);
    setNumPages(doc.numPages);
    try {
      const outline = await doc.getOutline();
      if (outline) setToc(outline);
    } catch (err) {
      console.log('No PDF outline found');
    }
  };

  const handlePdfTocClick = async (dest: any) => {
    if (!pdfDoc || !dest) return;
    try {
      // PDF.js destination can be a string or an array
      let destination = dest;
      if (typeof dest === 'string') {
        destination = await pdfDoc.getDestination(dest);
      }
      if (Array.isArray(destination)) {
        const pageIndex = await pdfDoc.getPageIndex(destination[0]);
        const newPage = pageIndex + 1;
        setPageNumber(newPage);
        saveProgress(newPage, Math.round((newPage / numPages) * 100), numPages);
      }
    } catch(e) {
      console.error(e);
    }
    setShowToc(false);
  };
`;
code = code.replace(oldPdfLoad, newPdfLoad);

// Update EPUB getRendition to capture TOC
const oldRendition = `rendition.hooks.content.register((contents: any) => {`;
const newRendition = `rendition.book.loaded.navigation.then((nav: any) => {
                if (nav && nav.toc) setToc(nav.toc);
              });
              rendition.hooks.content.register((contents: any) => {`;
code = code.replace(oldRendition, newRendition);

// Update Header to add TOC button and Page Input
// Lucide imports: add List, Menu
code = code.replace(
  "import { ArrowLeft, PlayCircle, Plus, Type, Check, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';",
  "import { ArrowLeft, PlayCircle, Plus, Type, Check, Loader2, ChevronLeft, ChevronRight, Menu, List, X } from 'lucide-react';"
);

// Find the header controls for PDF
const oldPdfControls = `<span className="text-xs font-medium text-[#6B7280] px-3">
                {pageNumber} / {numPages}
              </span>`;
const newPdfControls = `<div className="flex items-center px-2">
                <input 
                  type="number" 
                  min={1} 
                  max={numPages}
                  value={pageInput || pageNumber}
                  onChange={(e) => setPageInput(e.target.value)}
                  onBlur={() => {
                    const val = parseInt(pageInput);
                    if (val && val >= 1 && val <= numPages) {
                      setPageNumber(val);
                      saveProgress(val, Math.round((val / numPages) * 100), numPages);
                    }
                    setPageInput('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = parseInt(pageInput);
                      if (val && val >= 1 && val <= numPages) {
                        setPageNumber(val);
                        saveProgress(val, Math.round((val / numPages) * 100), numPages);
                      }
                      setPageInput('');
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="w-12 text-center text-xs font-bold text-[#111827] bg-transparent border-b border-transparent focus:border-[#3D5A80] focus:outline-none appearance-none"
                  style={{ MozAppearance: 'textfield' }}
                />
                <span className="text-xs font-medium text-[#6B7280]">/ {numPages}</span>
              </div>`;
code = code.replace(oldPdfControls, newPdfControls);

// Add TOC button to the header
const oldHeaderRight = `</div>
        )}

        {fileType === 'epub' && (`;
const newHeaderRight = `<button 
              onClick={() => setShowToc(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3F4F6] text-[#6B7280] ml-2"
              title="Table of Contents"
            >
              <List className="w-4 h-4" />
            </button>
            </div>
        )}

        {fileType === 'epub' && (`;
code = code.replace(oldHeaderRight, newHeaderRight);

// Add TOC button for EPUB too
const epubHeaderEnd = `</button>
            <div className="w-[1px] h-4 bg-[#E5E5E5] mx-1"></div>
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3F4F6] text-[#6B7280]" onClick={() => setFontSize(f => Math.min(200, f + 10))}>
              <Type className="w-4 h-4" />
            </button>
          </div>
        )}`;
const newEpubHeaderEnd = `</button>
            <div className="w-[1px] h-4 bg-[#E5E5E5] mx-1"></div>
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3F4F6] text-[#6B7280]" onClick={() => setFontSize(f => Math.min(200, f + 10))}>
              <Type className="w-4 h-4" />
            </button>
            
            <div className="w-[1px] h-4 bg-[#E5E5E5] mx-1"></div>
            <button 
              onClick={() => setShowToc(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3F4F6] text-[#6B7280]"
              title="Table of Contents"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        )}`;
code = code.replace(epubHeaderEnd, newEpubHeaderEnd);

// Add TOC Slide-out Panel before the closing main div
// Wait, rendering recursive TOC items
const tocComponent = `
      {/* TOC Slide-out Panel */}
      {showToc && (
        <>
          <div className="fixed inset-0 bg-[#111827]/20 backdrop-blur-sm z-40 transition-opacity" onClick={() => setShowToc(false)}></div>
          <div className="fixed right-0 top-0 bottom-0 w-80 bg-[#FAF9F6] shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300 border-l border-[#E5E5E5]">
            <div className="flex justify-between items-center p-6 border-b border-[#E5E5E5] shrink-0 bg-white">
              <h3 className="font-serif text-lg font-bold text-[#111827] flex items-center gap-2"><List className="w-5 h-5 text-[#3D5A80]" /> Contents</h3>
              <button onClick={() => setShowToc(false)} className="text-[#6B7280] hover:text-[#111827] bg-[#F3F4F6] p-1.5 rounded-full"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {toc && toc.length > 0 ? (
                <ul className="space-y-1">
                  {toc.map((item: any, i: number) => renderTocItem(item, i))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-[#6B7280] space-y-3 opacity-50">
                  <List className="w-10 h-10" />
                  <p className="text-sm font-medium">No chapters found.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
`;

// Where to put renderTocItem? Inside the component.
const renderTocItemFn = `
  const renderTocItem = (item: any, idx: number, depth = 0) => {
    return (
      <li key={\`toc-\${depth}-\${idx}\`} className="w-full">
        <button 
          onClick={() => {
            if (fileType === 'pdf') {
              handlePdfTocClick(item.dest);
            } else if (fileType === 'epub' && item.href) {
              setLocation(item.href);
              setShowToc(false);
            }
          }}
          className="w-full text-left py-2 px-3 hover:bg-[#3D5A80]/10 rounded-lg text-sm text-[#374151] hover:text-[#111827] transition-colors leading-snug line-clamp-2"
          style={{ paddingLeft: \`\${depth * 16 + 12}px\` }}
        >
          {item.title || item.label}
        </button>
        {item.items && item.items.length > 0 && (
          <ul className="mt-1">
            {item.items.map((subItem: any, subIdx: number) => renderTocItem(subItem, subIdx, depth + 1))}
          </ul>
        )}
        {item.subitems && item.subitems.length > 0 && (
          <ul className="mt-1">
            {item.subitems.map((subItem: any, subIdx: number) => renderTocItem(subItem, subIdx, depth + 1))}
          </ul>
        )}
      </li>
    );
  };
`;

code = code.replace("const handleMouseMoveGlobal", renderTocItemFn + "\n  const handleMouseMoveGlobal");
code = code.replace("    </div>\n  );\n}\n", tocComponent + "    </div>\n  );\n}\n");

fs.writeFileSync('src/app/reader/page.tsx', code);
