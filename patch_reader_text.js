const fs = require('fs');

let code = fs.readFileSync('src/app/reader/page.tsx', 'utf8');

// 1. Update the state interface to include 'text' and string Data
code = code.replace(
  "const [fileType, setFileType] = useState<'pdf' | 'epub' | null>(null);",
  "const [fileType, setFileType] = useState<'pdf' | 'epub' | 'text' | null>(null);"
);
code = code.replace(
  "const [fileData, setFileData] = useState<File | ArrayBuffer | null>(null);",
  "const [fileData, setFileData] = useState<File | ArrayBuffer | string | null>(null);"
);

// 2. Update the localforage load to support text files
const oldLoadBlob = `const isPdf = blob.type === 'application/pdf' || (blob as File).name?.toLowerCase().endsWith('.pdf');
        if (isPdf) {
          setFileData(blob as File);
        } else {
          const buffer = await blob.arrayBuffer();
          setFileData(buffer);
        }`;
        
const newLoadBlob = `if (bookInfo && bookInfo.type === 'text') {
          const text = await blob.text();
          setFileData(text);
        } else {
          const isPdf = blob.type === 'application/pdf' || (blob as File).name?.toLowerCase().endsWith('.pdf');
          if (isPdf) {
            setFileData(blob as File);
          } else {
            const buffer = await blob.arrayBuffer();
            setFileData(buffer);
          }
        }`;
code = code.replace(oldLoadBlob, newLoadBlob);

// 3. Render the text file in the main component
const oldMainRender = `{!fileData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#6B7280]">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#3D5A80]" />
            <p>Loading document...</p>
          </div>
        ) : fileType === 'epub' ? (`;

const newMainRender = `{!fileData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#6B7280]">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#3D5A80]" />
            <p>Loading document...</p>
          </div>
        ) : fileType === 'text' ? (
          <div 
            className="w-full h-full overflow-y-auto bg-[#FAF9F6] px-8 py-16"
            onScroll={(e) => {
              const target = e.target as HTMLElement;
              const percent = Math.round((target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100);
              saveProgress(target.scrollTop, percent || 0);
            }}
          >
            <div 
              className="max-w-3xl mx-auto text-lg leading-loose font-serif text-[#374151] whitespace-pre-wrap selection:bg-[#E2E8F0]"
              onMouseMove={(e) => {
                if (hoverTimer.current) clearTimeout(hoverTimer.current);
                hoverTimer.current = setTimeout(() => {
                  if ((e.target as HTMLElement).closest('.dict-popup')) return;
                  const word = getWordFromPoint(document, e.clientX, e.clientY);
                  if (word && word.length > 1) lookupWord(word, e.clientX, e.clientY);
                }, 1500);
              }}
            >
              {fileData as string}
            </div>
          </div>
        ) : fileType === 'epub' ? (`;

code = code.replace(oldMainRender, newMainRender);

// Also need to set scroll position on mount for text files
const oldEffectEnd = `        }
      }
    });
  }, []);`;
  
const newEffectEnd = `        }
      }
    });
  }, []);

  // Restore scroll position for text files when data is loaded
  useEffect(() => {
    if (fileType === 'text' && fileData && typeof fileData === 'string') {
      localforage.getItem<any[]>('quiet_library').then(lib => {
        if (lib && bookId) {
          const bookInfo = lib.find(b => b.id === bookId);
          if (bookInfo && bookInfo.currentLocation) {
            // Find the scrolling container and set its scrollTop
            setTimeout(() => {
              const container = document.querySelector('.overflow-y-auto.bg-\\[\\#FAF9F6\\]');
              if (container) {
                container.scrollTop = Number(bookInfo.currentLocation);
              }
            }, 100);
          }
        }
      });
    }
  }, [fileData, fileType, bookId]);`;

code = code.replace(oldEffectEnd, newEffectEnd);

fs.writeFileSync('src/app/reader/page.tsx', code);
