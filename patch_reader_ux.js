const fs = require('fs');

let code = fs.readFileSync('src/app/reader/page.tsx', 'utf8');

// 1. Add closeTimer
code = code.replace(
  "const hoverTimer = useRef<NodeJS.Timeout | null>(null);",
  "const hoverTimer = useRef<NodeJS.Timeout | null>(null);\n  const closeTimer = useRef<NodeJS.Timeout | null>(null);"
);

// 2. Update handleMouseMoveGlobal
const oldGlobalMouse = `  const handleMouseMoveGlobal = (e: MouseEvent | React.MouseEvent) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);

    hoverTimer.current = setTimeout(() => {
      // Check if we are hovering over PDF text layer or general UI (EPUB iframe is handled separately)
      if ((e.target as HTMLElement).closest('.dict-popup')) return;

      const doc = document;
      const word = getWordFromPoint(doc, e.clientX, e.clientY);
      if (word && word.length > 1) {
        lookupWord(word, e.clientX, e.clientY);
      }
    }, 1500);
  };`;

const newGlobalMouse = `  const handleMouseMoveGlobal = (e: MouseEvent | React.MouseEvent) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);

    // If we are moving inside the popup, keep it open
    if ((e.target as HTMLElement).closest('.dict-popup')) return;

    const doc = document;
    const word = getWordFromPoint(doc, e.clientX, e.clientY);
    
    if (word && word.length > 1) {
      // Hovering over a valid word, start lookup timer
      hoverTimer.current = setTimeout(() => {
        lookupWord(word, e.clientX, e.clientY);
      }, 1500);
    } else {
      // Hovering over empty margin or whitespace. 
      // Give the user 800ms transit time to move mouse into the popup before closing it.
      closeTimer.current = setTimeout(() => {
        setActivePopup(null);
      }, 800);
    }
  };`;

code = code.replace(oldGlobalMouse, newGlobalMouse);

// 3. Update handleIframeMouseMove
const oldIframeMouse = `  const handleIframeMouseMove = (e: MouseEvent) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);

    hoverTimer.current = setTimeout(() => {
      const doc = (e.target as Node)?.ownerDocument as any;
      if (!doc) return;

      const word = getWordFromPoint(doc, e.clientX, e.clientY);
      if (word && word.length > 1) {
        const iframe = document.querySelector('iframe');
        const iframeRect = iframe?.getBoundingClientRect();
        const adjustedX = e.clientX + (iframeRect?.left || 0);
        const adjustedY = e.clientY + (iframeRect?.top || 0);
        
        lookupWord(word, adjustedX, adjustedY);
      }
    }, 1500);
  };`;

const newIframeMouse = `  const handleIframeMouseMove = (e: MouseEvent) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);

    const doc = (e.target as Node)?.ownerDocument as any;
    if (!doc) return;

    const word = getWordFromPoint(doc, e.clientX, e.clientY);
    if (word && word.length > 1) {
      hoverTimer.current = setTimeout(() => {
        const iframe = document.querySelector('iframe');
        const iframeRect = iframe?.getBoundingClientRect();
        const adjustedX = e.clientX + (iframeRect?.left || 0);
        const adjustedY = e.clientY + (iframeRect?.top || 0);
        
        lookupWord(word, adjustedX, adjustedY);
      }, 1500);
    } else {
      closeTimer.current = setTimeout(() => {
        setActivePopup(null);
      }, 800);
    }
  };`;

code = code.replace(oldIframeMouse, newIframeMouse);

// 4. Update the text reader layout to include the title, and use handleMouseMoveGlobal
const oldTextRender = `<div 
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
          </div>`;

const newTextRender = `<div 
            className="max-w-3xl mx-auto text-lg leading-loose font-serif text-[#374151] whitespace-pre-wrap selection:bg-[#E2E8F0] pb-32"
            onMouseMove={handleMouseMoveGlobal}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-[#111827] mb-12 leading-tight">{bookTitle}</h1>
            {fileData as string}
          </div>`;

code = code.replace(oldTextRender, newTextRender);

fs.writeFileSync('src/app/reader/page.tsx', code);
