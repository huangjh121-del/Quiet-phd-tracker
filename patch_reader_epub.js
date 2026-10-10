const fs = require('fs');
const code = `'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, PlayCircle, Plus, Type, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';
import localforage from 'localforage';
import { ReactReader } from 'react-reader';

export default function Reader() {
  const [epubData, setEpubData] = useState<ArrayBuffer | null>(null);
  const [location, setLocation] = useState<string | number>(0);
  const [fontSize, setFontSize] = useState(100); // percentage for epub
  
  const [activePopup, setActivePopup] = useState<{
    word: string;
    x: number;
    y: number;
    isLoading: boolean;
    html?: string;
  } | null>(null);
  
  const [savedWords, setSavedWords] = useState<string[]>([]);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const renditionRef = useRef<any>(null);

  useEffect(() => {
    localforage.getItem<ArrayBuffer>('quiet_epub').then(data => {
      if (data) {
        setEpubData(data);
      }
    });
  }, []);

  const lookupWord = async (word: string, clientX: number, clientY: number) => {
    const cleanWord = word.replace(/[^a-zA-Z-]/g, '').toLowerCase();
    if (!cleanWord || cleanWord.length < 2) return;

    setActivePopup({
      word: cleanWord,
      x: clientX,
      y: clientY + 15,
      isLoading: true
    });

    try {
      const res = await fetch(\`/api/dict?word=\${cleanWord}\`);
      if (res.ok) {
        const data = await res.json();
        setActivePopup(prev => prev?.word === cleanWord ? {
          ...prev,
          isLoading: false,
          html: data.html
        } : prev);
      } else {
        setActivePopup(prev => prev?.word === cleanWord ? {
          ...prev,
          isLoading: false,
          html: undefined
        } : prev);
      }
    } catch (err) {
      setActivePopup(prev => prev?.word === cleanWord ? { ...prev, isLoading: false, html: undefined } : prev);
    }
  };

  const handleIframeMouseMove = (e: MouseEvent) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);

    hoverTimer.current = setTimeout(() => {
      const doc = e.target?.ownerDocument;
      if (!doc) return;

      let range, textNode, offset;
      
      // Standard way to get text under cursor
      if (doc.caretPositionFromPoint) {
        const pos = doc.caretPositionFromPoint(e.clientX, e.clientY);
        if (!pos) return;
        textNode = pos.offsetNode;
        offset = pos.offset;
      } else if (doc.caretRangeFromPoint) {
        range = doc.caretRangeFromPoint(e.clientX, e.clientY);
        if (!range) return;
        textNode = range.startContainer;
        offset = range.startOffset;
      }

      if (textNode && textNode.nodeType === 3) {
        const text = textNode.textContent || '';
        // Expand offset to find word boundaries
        let start = offset;
        let end = offset;
        while (start > 0 && /[a-zA-Z-]/.test(text[start - 1])) start--;
        while (end < text.length && /[a-zA-Z-]/.test(text[end])) end++;
        
        const word = text.slice(start, end);
        if (word.length > 1) {
          // Adjust clientX/Y to viewport coordinates since iframe is embedded
          // iframe bounding rect:
          const iframe = document.querySelector('iframe');
          const iframeRect = iframe?.getBoundingClientRect();
          const adjustedX = e.clientX + (iframeRect?.left || 0);
          const adjustedY = e.clientY + (iframeRect?.top || 0);
          
          lookupWord(word, adjustedX, adjustedY);
        }
      }
    }, 1500);
  };

  const handleSaveWord = async () => {
    if (activePopup && !savedWords.includes(activePopup.word)) {
      const wordToSave = activePopup.word;
      const htmlToSave = activePopup.html || "";
      
      setSavedWords([...savedWords, wordToSave]);
      setTimeout(() => setActivePopup(null), 1000);

      try {
        await fetch('/api/save-word', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word: wordToSave, htmlDefinition: htmlToSave })
        });
      } catch (error) {
        console.error("Failed to save word", error);
      }
    }
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.dict-popup')) {
        setActivePopup(null);
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#FAF9F6] text-[#1C1C1C] overflow-hidden relative">
      <link rel="stylesheet" href="/oald10.css" />
      
      <header className="h-20 border-b border-[#E5E5E5] flex items-center justify-between px-8 bg-[#FAF9F6]/90 backdrop-blur-md shrink-0 z-10">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E5E5E5] text-[#6B7280] hover:text-[#111827] transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#6B7280]">Currently Reading</span>
            <h1 className="font-serif font-medium text-sm text-[#111827]">Imported EPUB</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-[#E5E5E5] rounded-full p-1 shadow-sm mr-4">
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3F4F6] text-[#6B7280]" onClick={() => setFontSize(f => Math.max(50, f - 10))}>
              <Type className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-4 bg-[#E5E5E5] mx-1"></div>
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3F4F6] text-[#6B7280]" onClick={() => setFontSize(f => Math.min(200, f + 10))}>
              <Type className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative w-full h-full">
        {!epubData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#6B7280]">
            <p className="mb-4">No EPUB document loaded.</p>
            <Link href="/" className="text-[#3D5A80] font-bold underline">Go back and upload an EPUB</Link>
          </div>
        ) : (
          <ReactReader
            url={epubData}
            location={location}
            locationChanged={(epubcifi: string) => setLocation(epubcifi)}
            epubOptions={{
              flow: "scrolled",
              manager: "continuous"
            }}
            getRendition={(rendition) => {
              renditionRef.current = rendition;
              rendition.themes.fontSize(\`\${fontSize}%\`);
              
              // Register hook to attach mousemove event to iframe content
              rendition.hooks.content.register((contents: any) => {
                const doc = contents.document;
                // Add custom CSS to iframe to ensure smooth reading font
                contents.addStylesheetRules({
                  "body": {
                    "font-family": "Georgia, serif !important",
                    "color": "#374151 !important",
                    "line-height": "1.8 !important",
                    "padding": "0 20px !important",
                  }
                });
                doc.addEventListener('mousemove', handleIframeMouseMove);
                doc.addEventListener('mousedown', () => setActivePopup(null));
              });
            }}
            epubInitOptions={{
              openAs: 'epub'
            }}
          />
        )}
      </main>

      {/* Dictionary Popup overlay outside of iframe */}
      {activePopup && (
        <div 
          className="dict-popup fixed z-50 transform -translate-x-1/2 bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-[#E5E5E5] w-[500px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{ left: activePopup.x, top: activePopup.y }}
        >
          {activePopup.isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center text-[#6B7280]">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#3D5A80]" />
              <p className="text-sm font-medium tracking-wide">Searching local OALD10...</p>
            </div>
          ) : (
            <>
              <div className="bg-[#FAF9F6] p-6 border-b border-[#E5E5E5] max-h-[400px] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-serif text-3xl font-bold text-[#111827] capitalize">{activePopup.word}</h3>
                  <button className="text-[#6B7280] hover:text-[#3D5A80] transition-colors p-1 bg-white rounded-full shadow-sm">
                    <PlayCircle className="w-5 h-5" />
                  </button>
                </div>
                
                {activePopup.html ? (
                  <div className="dict-html-container text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: activePopup.html }} />
                ) : (
                  <div className="py-4 text-[#6B7280] text-sm">
                    Definition not found in local OALD dictionary.
                  </div>
                )}
              </div>

              <div className="p-4 bg-[#F9FAFB] border-t border-[#E5E5E5] shrink-0">
                <button 
                  onClick={handleSaveWord}
                  disabled={savedWords.includes(activePopup.word)}
                  className={"w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold uppercase tracking-wider transition-all shadow-sm " + (
                    savedWords.includes(activePopup.word)
                      ? 'bg-[#5B8266] text-white shadow-none'
                      : 'bg-[#111827] text-white hover:bg-[#374151] hover:shadow-md hover:-translate-y-0.5'
                  )}
                >
                  {savedWords.includes(activePopup.word) ? (
                    <><Check className="w-4 h-4" /> Added to Library</>
                  ) : (
                    <><Plus className="w-4 h-4" /> Add to SRS Library</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
`;
fs.writeFileSync('src/app/reader/page.tsx', code);
