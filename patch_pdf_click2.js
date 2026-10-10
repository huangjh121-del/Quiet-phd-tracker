const fs = require('fs');
let code = fs.readFileSync('src/app/reader/page.tsx', 'utf8');

const newPdfRender = `<div className="flex justify-center p-8 bg-[#E5E5E5] min-h-full relative">
            {/* Left Click Zone (Previous Page) */}
            <div 
              className="absolute left-0 top-0 w-1/3 h-full z-10 cursor-pointer"
              onClick={() => setPageNumber(p => Math.max(1, p - 1))}
              title="Previous Page"
            />
            
            {/* Right Click Zone (Next Page) */}
            <div 
              className="absolute right-0 top-0 w-1/3 h-full z-10 cursor-pointer"
              onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
              title="Next Page"
            />

            <div className="relative z-0 pointer-events-none">
              <Document
                file={fileData as File}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<Loader2 className="w-8 h-8 animate-spin text-[#3D5A80]" />}
                className="shadow-2xl pointer-events-auto"
              >
                <Page 
                  pageNumber={pageNumber} 
                  scale={pdfScale}
                  renderTextLayer={true}
                  renderAnnotationLayer={false}
                />
              </Document>
            </div>
          </div>`;

const properPdfRender = `<div 
            className="flex justify-center p-8 bg-[#E5E5E5] min-h-full cursor-pointer"
            onClick={(e) => {
              // Ignore clicks if they are inside the dictionary popup
              if (e.target instanceof Element && e.target.closest('.dict-popup')) return;
              
              // Only trigger pagination if no text is currently selected
              if (window.getSelection()?.toString().length) return;

              const clickX = e.clientX;
              const width = window.innerWidth;
              if (clickX > width * 0.7) {
                setPageNumber(p => Math.min(numPages, p + 1)); // Right 30% clicks next
              } else if (clickX < width * 0.3) {
                setPageNumber(p => Math.max(1, p - 1)); // Left 30% clicks prev
              }
            }}
          >
            <Document
              file={fileData as File}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<Loader2 className="w-8 h-8 animate-spin text-[#3D5A80]" />}
              className="shadow-2xl cursor-text"
              onClick={(e) => e.stopPropagation()} // Prevent document clicks from bubbling if we want native text selection
            >
              <Page 
                pageNumber={pageNumber} 
                scale={pdfScale}
                renderTextLayer={true}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>`;

code = code.replace(newPdfRender, properPdfRender);
fs.writeFileSync('src/app/reader/page.tsx', code);
