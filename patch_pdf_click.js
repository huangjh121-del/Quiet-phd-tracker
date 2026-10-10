const fs = require('fs');
let code = fs.readFileSync('src/app/reader/page.tsx', 'utf8');

// We need to add click zones to the PDF document wrapper
const oldPdfRender = `<div className="flex justify-center p-8 bg-[#E5E5E5] min-h-full">
            <Document
              file={fileData as File}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<Loader2 className="w-8 h-8 animate-spin text-[#3D5A80]" />}
              className="shadow-2xl"
            >
              <Page 
                pageNumber={pageNumber} 
                scale={pdfScale}
                renderTextLayer={true}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>`;

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

code = code.replace(oldPdfRender, newPdfRender);
fs.writeFileSync('src/app/reader/page.tsx', code);
