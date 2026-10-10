const fs = require('fs');
let code = fs.readFileSync('src/app/reader/ReaderClient.tsx', 'utf8');

const importRegex = /import React, \{ useState, useEffect, useRef \} from 'react';/;
code = code.replace(
  importRegex,
  "import React, { useState, useEffect, useRef, useCallback } from 'react';"
);

// Add state for selection menu
const stateInitRegex = /const \[pdfDoc, setPdfDoc\] = useState<any>\(null\);/;
const stateInitNew = `const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [selectionMenu, setSelectionMenu] = useState<{ x: number, y: number, text: string, context: string, show: boolean } | null>(null);`;
code = code.replace(stateInitRegex, stateInitNew);

// Add mouseup listener for selection
const useEffectRegex = /useEffect\(\(\) => \{\n    setIsClient\(true\);/;
const useEffectNew = `
  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectionMenu(null);
      return;
    }
    
    const text = selection.toString().trim();
    if (!text || text.length < 2) return;

    // Try to get surrounding sentence context
    let context = text;
    try {
      const node = selection.anchorNode;
      if (node && node.textContent) {
        const fullText = node.textContent;
        // Simple sentence boundary detection
        const sentences = fullText.match(/[^.!?]+[.!?]+/g) || [fullText];
        const match = sentences.find(s => s.includes(text));
        if (match) context = match.trim();
      }
    } catch(e) {}

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    setSelectionMenu({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      text,
      context,
      show: true
    });
  }, []);

  useEffect(() => {
    setIsClient(true);
    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
`;
code = code.replace(useEffectRegex, useEffectNew);

// Add the selection menu UI before closing main div
const tocComponentRegex = /\{\/\* TOC Slide-out Panel \*\/\}/;
const selectionMenuUI = `
      {/* Selection Menu */}
      {selectionMenu && selectionMenu.show && (
        <div 
          className="fixed z-50 transform -translate-x-1/2 -translate-y-full bg-[#111827] text-white rounded-xl shadow-2xl flex items-center p-1.5 gap-1 animate-in zoom-in-95 duration-100"
          style={{ left: selectionMenu.x, top: selectionMenu.y }}
          onMouseDown={(e) => e.stopPropagation()} // Prevent losing selection when clicking menu
        >
          <button 
            onClick={async () => {
              try {
                await fetch('/api/save-phrase', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ phrase: selectionMenu.text, context: selectionMenu.context, sourceTitle: bookTitle })
                });
                alert('Saved to Good Expressions!');
              } catch(e) {}
              setSelectionMenu(null);
              window.getSelection()?.removeAllRanges();
            }}
            className="px-3 py-1.5 text-xs font-bold tracking-wide rounded-lg hover:bg-white/20 transition-colors whitespace-nowrap"
          >
            Save Phrase
          </button>
          <div className="w-[1px] h-4 bg-white/20 mx-1"></div>
          <button 
            onClick={async () => {
              try {
                await fetch('/api/save-sentence', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sentence: selectionMenu.context, sourceTitle: bookTitle })
                });
                alert('Saved to Sentences Library!');
              } catch(e) {}
              setSelectionMenu(null);
              window.getSelection()?.removeAllRanges();
            }}
            className="px-3 py-1.5 text-xs font-bold tracking-wide rounded-lg hover:bg-white/20 transition-colors whitespace-nowrap"
          >
            Save Sentence
          </button>
        </div>
      )}
      
      {/* TOC Slide-out Panel */}`;
code = code.replace(tocComponentRegex, selectionMenuUI);

fs.writeFileSync('src/app/reader/ReaderClient.tsx', code);
