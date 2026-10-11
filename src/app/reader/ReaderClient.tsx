'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, PlayCircle, Plus, Type, Check, Loader2, ChevronLeft, ChevronRight, Menu, List, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import localforage from 'localforage';
import { ReactReader } from 'react-reader';
import { Document, Page, pdfjs } from 'react-pdf';
// import 'react-pdf/dist/Page/TextLayer.css';
// import 'react-pdf/dist/Page/AnnotationLayer.css';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

export default function Reader() {
  const router = useRouter();
  const searchParamsHook = useSearchParams();
  const highlightText = searchParamsHook.get('highlight');
  const [fileData, setFileData] = useState<File | ArrayBuffer | string | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'epub' | 'text' | null>(null);
  const [bookId, setBookId] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState<string>('');
  const [showToc, setShowToc] = useState(false);
  const [toc, setToc] = useState<any[]>([]);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [selectionMenu, setSelectionMenu] = useState<{ x: number, y: number, text: string, context: string, show: boolean } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // Removed highlightText state in favor of dynamic searchParams
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const [isClient, setIsClient] = useState(false);
  const [pageInput, setPageInput] = useState<string>('');
  
  // EPUB State
  const [location, setLocation] = useState<string | number>(0);
  
  // PDF State
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pdfScale, setPdfScale] = useState<number>(1.2);

  const [fontSize, setFontSize] = useState(100); // percentage for epub
  
  const [activePopup, setActivePopup] = useState<{
    word: string;
    context?: string;
    x: number;
    y: number;
    isLoading: boolean;
    html?: string;
    isUpwards?: boolean;
    windowHeight?: number;
  } | null>(null);
  
  const [savedWords, setSavedWords] = useState<string[]>([]);
  const hoverTimer = useRef<NodeJS.Timeout | null>(null);
  const closeTimer = useRef<NodeJS.Timeout | null>(null);
  const renditionRef = useRef<any>(null);

  
  
  // Reading Time Tracker
  useEffect(() => {
    const todayStr = new Date().toDateString();
    
    // Helper to log a minute
    const logMinute = async () => {
      let stats = await localforage.getItem<any>('quiet_reading_stats') || { streak: 1, activeDays: [new Date().getDay()] };
      stats[todayStr] = (stats[todayStr] || 0) + 1;
      
      const currentDayIndex = new Date().getDay();
      if (!stats.activeDays.includes(currentDayIndex)) {
        stats.activeDays.push(currentDayIndex);
      }
      
      await localforage.setItem('quiet_reading_stats', stats);
    };

    // Log 1 minute immediately when they open the reader so they get instant feedback
    logMinute();

    // Then log 1 minute every 60 seconds they stay
    const interval = setInterval(logMinute, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectionMenu(null);
      return;
    }
    
    const text = selection.toString().trim();
    if (!text || text.length < 2) return;

    // Try to get surrounding sentence context within the current line / paragraph
    let context = text;
    try {
      const node = selection.anchorNode;
      if (node && node.textContent) {
        const fullText = node.textContent;
        // 1. Isolate to current line/paragraph (never cross newlines)
        const lines = fullText.split(/[\r\n]+/);
        const lineWithSelection = lines.find(l => l.includes(text)) || fullText;

        // 2. Extract sentence within this line
        const sentences = lineWithSelection.match(/[^.!?]+[.!?]*/g) || [lineWithSelection];
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

    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get('id');
    // Highlight is now tracked reactively via useSearchParams
    if (!id) return;
    setBookId(id);

    async function loadBookData() {
      let bookInfo: any = null;
      let blobOrBuffer: any = null;

      // 1. Try local cache first for instant speed
      const localLib = await localforage.getItem<any[]>('quiet_library');
      if (localLib) {
        bookInfo = localLib.find(b => b.id === id);
      }
      blobOrBuffer = await localforage.getItem(`quiet_book_${id}`);

      // 2. Fetch from Cloud API (D1 & R2)
      if (!bookInfo || !blobOrBuffer) {
        try {
          const docRes = await fetch(`/api/documents/${id}`);
          if (docRes.ok) {
            const { document } = await docRes.json();
            if (document) {
              const isEpub = (document.file_name && document.file_name.toLowerCase().endsWith('.epub'));
              const isTxt = document.type === 'article' && Boolean(document.content);
              bookInfo = {
                title: document.title,
                isCompleted: (document.percentage || 0) >= 100,
                type: isEpub ? 'epub' : (isTxt ? 'text' : 'pdf'),
                currentLocation: document.reading_progress || (isEpub ? 0 : 1),
              };

              // If text article
              if (document.content) {
                setFileData(document.content);
                setBookTitle(bookInfo.title);
                setIsCompleted(bookInfo.isCompleted);
                setFileType('text');
                return;
              }

              // If cloud file in R2
              if (document.file_key) {
                const fileRes = await fetch(`/api/documents/${id}/file`);
                if (fileRes.ok) {
                  const blob = await fileRes.blob();
                  await localforage.setItem(`quiet_book_${id}`, blob);
                  blobOrBuffer = blob;
                }
              }
            }
          }
        } catch (cloudErr) {
          console.warn("Cloud doc fetch error:", cloudErr);
        }
      }

      if (bookInfo) {
        setBookTitle(bookInfo.title);
        setIsCompleted(bookInfo.isCompleted || false);
        setFileType(bookInfo.type);
        if (bookInfo.type === 'pdf') {
          setPageNumber(Number(bookInfo.currentLocation) || 1);
        } else {
          setLocation(bookInfo.currentLocation || 0);
        }
      }

      if (blobOrBuffer) {
        try {
          if (typeof blobOrBuffer === 'string') {
            setFileData(blobOrBuffer);
          } else if (blobOrBuffer.type === 'text/plain') {
            const text = typeof blobOrBuffer.text === 'function' ? await blobOrBuffer.text() : await new Response(blobOrBuffer).text();
            setFileData(text);
          } else {
            const isPdf = blobOrBuffer.type === 'application/pdf' || (blobOrBuffer.name && blobOrBuffer.name.toLowerCase().endsWith('.pdf')) || (bookInfo && bookInfo.type === 'pdf');
            if (isPdf) {
              setFileData(blobOrBuffer);
            } else {
              const buffer = typeof blobOrBuffer.arrayBuffer === 'function' ? await blobOrBuffer.arrayBuffer() : await new Response(blobOrBuffer).arrayBuffer();
              setFileData(buffer);
            }
          }
        } catch (err) {
          console.error("Failed to parse blob:", err);
          setFileData(blobOrBuffer);
        }
      }
    }

    loadBookData();
  }, []);

  // Restore scroll position for text files when data is loaded
  
  useEffect(() => {
    if (fileType === 'text' && highlightText && fileData) {
      const timer = setTimeout(() => {
        const el = document.getElementById('highlight-target');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [fileType, highlightText, fileData]);

  useEffect(() => {
    if (!highlightText && fileType === 'text' && fileData && typeof fileData === 'string') {
      localforage.getItem<any[]>('quiet_library').then(lib => {
        if (lib && bookId) {
          const bookInfo = lib.find(b => b.id === bookId);
          if (bookInfo && bookInfo.currentLocation) {
            // Find the scrolling container and set its scrollTop
            setTimeout(() => {
              const container = document.getElementById('text-scroll-container');
              if (container) {
                container.scrollTop = Number(bookInfo.currentLocation);
              }
            }, 100);
          }
        }
      });
    }
  }, [fileData, fileType, bookId, highlightText]);

  
  const markAsCompleted = async () => {
    if (!bookId) return;
    setIsCompleted(true);
    // Cloud sync
    fetch(`/api/documents/${bookId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ percentage: 100 })
    }).catch(e => console.error("Cloud mark completed error:", e));

    const lib = await localforage.getItem<any[]>('quiet_library') || [];
    const idx = lib.findIndex(b => b.id === bookId);
    if (idx !== -1) {
      lib[idx].isCompleted = true;
      lib[idx].progress = 100;
      await localforage.setItem('quiet_library', lib);
      showToast("Marked as Completed!");
    }
  };

  const saveProgress = async (currentLoc: string | number, progressPercent: number, totalPages: number = 0) => {
    if (!bookId) return;
    // Cloud sync
    fetch(`/api/documents/${bookId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        readingProgress: String(currentLoc),
        percentage: isCompleted ? 100 : progressPercent,
        totalProgress: totalPages ? String(totalPages) : ''
      })
    }).catch(e => console.error("Cloud save progress error:", e));

    const lib = await localforage.getItem<any[]>('quiet_library') || [];
    const idx = lib.findIndex(b => b.id === bookId);
    if (idx !== -1) {
      lib[idx].currentLocation = currentLoc;
      lib[idx].progress = lib[idx].isCompleted ? 100 : progressPercent;
      lib[idx].lastReadAt = Date.now();
      if (totalPages) lib[idx].totalSize = totalPages;
      await localforage.setItem('quiet_library', lib);
    }
  };


  const lookupWord = async (word: string, context: string, clientX: number, clientY: number) => {
    // Ultimate guard: NEVER fire if text is actively selected anywhere
    if ((window.getSelection()?.toString() || '').trim().length > 0) return;
    try {
      const iframe = document.querySelector('iframe');
      if (iframe && (iframe.contentWindow?.getSelection()?.toString() || '').trim().length > 0) return;
    } catch(e) {}

    const cleanWord = word.replace(/[^a-zA-Z-]/g, '').toLowerCase();
    if (!cleanWord || cleanWord.length < 2) return;

    const isUpwards = clientY > window.innerHeight - 500;
    setActivePopup({
      word: cleanWord,
      context,
      x: clientX,
      y: isUpwards ? clientY - 15 : clientY + 15,
      isUpwards,
      windowHeight: window.innerHeight,
      isLoading: true
    });

    try {
      const res = await fetch(`/api/dict?word=${cleanWord}`);
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

  const getWordFromPoint = (doc: Document, clientX: number, clientY: number) => {
    // Prevent snapping to text when hovering over margins/whitespace
    const el = doc.elementFromPoint(clientX, clientY);
    if (!el) return null;
    
    // In Text mode, only allow hovering over the text container or its children
    // In PDF mode, the text layers are specific spans.
    // If the element is a generic full-width background wrapper, reject.
    const className = typeof el.className === 'string' ? el.className : '';
    const isBackground = el.tagName === 'MAIN' || className.includes('overflow-y-auto') || className.includes('bg-[#FAF9F6]');
    if (isBackground) return null;

    let range, textNode, offset;
    if ((doc as any).caretPositionFromPoint) {
      const pos = (doc as any).caretPositionFromPoint(clientX, clientY);
      if (!pos) return null;
      textNode = pos.offsetNode;
      offset = pos.offset;
    } else if ((doc as any).caretRangeFromPoint) {
      range = (doc as any).caretRangeFromPoint(clientX, clientY);
      if (!range) return null;
      textNode = range.startContainer;
      offset = range.startOffset;
    }

    if (textNode && textNode.nodeType === 3) {
      const text = textNode.textContent || '';
      let start = offset;
      let end = offset;
      while (start > 0 && /[a-zA-Z-]/.test(text[start - 1])) start--;
      while (end < text.length && /[a-zA-Z-]/.test(text[end])) end++;
      
      const word = text.slice(start, end);
      
      let context = text;
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      const match = sentences.find((s: string) => s.includes(word));
      if (match) context = match.trim();

      return { word, context };
    }
    return null;
  };

  
  const renderTocItem = (item: any, idx: number, depth = 0) => {
    return (
      <li key={`toc-${depth}-${idx}`} className="w-full">
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
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
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

  const handleMouseMoveGlobal = (e: MouseEvent | React.MouseEvent) => {
    // Always clear timers first before returning!
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);

    // If user is actively selecting text, do NOT start a new dictionary timer
    if ((window.getSelection()?.toString() || '').trim().length > 0) return;
    if (e.buttons > 0) return; // Mouse is held down (dragging)

    // If we are moving inside the popup, keep it open
    if ((e.target as HTMLElement).closest('.dict-popup')) return;

    const doc = document;
    const result = getWordFromPoint(doc, e.clientX, e.clientY);
    
    if (result && result.word.length > 1) {
      // Hovering over a valid word, start lookup timer
      hoverTimer.current = setTimeout(() => {
        lookupWord(result.word, result.context, e.clientX, e.clientY);
      }, 1500);
    } else {
      // Hovering over empty margin or whitespace. 
      // Give the user 800ms transit time to move mouse into the popup before closing it.
      closeTimer.current = setTimeout(() => {
        setActivePopup(null);
      }, 800);
    }
  };

  const handleIframeMouseMove = (e: MouseEvent) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);

    if (e.buttons > 0) return;
    try {
      const doc = (e.target as Node)?.ownerDocument as any;
      if (doc?.defaultView?.getSelection()?.toString().trim().length > 0) return;
    } catch(err) {}

    const doc = (e.target as Node)?.ownerDocument as any;
    if (!doc) return;

    const result = getWordFromPoint(doc, e.clientX, e.clientY);
    if (result && result.word.length > 1) {
      hoverTimer.current = setTimeout(() => {
        const iframe = document.querySelector('iframe');
        const iframeRect = iframe?.getBoundingClientRect();
        const adjustedX = e.clientX + (iframeRect?.left || 0);
        const adjustedY = e.clientY + (iframeRect?.top || 0);
        
        lookupWord(result.word, result.context, adjustedX, adjustedY);
      }, 1500);
    } else {
      closeTimer.current = setTimeout(() => {
        setActivePopup(null);
      }, 800);
    }
  };

  
  const renderHighlightedText = (text: string, highlight: string | null) => {
    if (!highlight || !text) return text;
    const target = highlight.trim();
    if (!target) return text;

    try {
      const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      const regex = new RegExp(`(${escaped})`, 'i');
      const parts = text.split(regex);
      if (parts.length <= 1) return text;

      return parts.map((part, i) => {
        if (i % 2 === 1) {
          return (
            <mark 
              key={i} 
              id={i === 1 ? "highlight-target" : undefined}
              className="bg-[#FEF08A] text-[#111827] rounded-md px-1 py-0.5 shadow-sm border border-[#FACC15] ring-2 ring-[#FDE047]/60"
            >
              {part}
            </mark>
          );
        }
        return part;
      });
    } catch {
      return text;
    }
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
    const handleClick = (e: Event) => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
      if (e.type === 'mousedown' && !(e.target as HTMLElement).closest('.dict-popup')) {
        setActivePopup(null);
      }
    };
    
    // Use capture phase (true) so it fires BEFORE any child elements can stop propagation
    window.addEventListener('mousedown', handleClick, true);
    window.addEventListener('selectstart', handleClick, true);
    window.addEventListener('dragstart', handleClick, true);
    
    return () => {
      window.removeEventListener('mousedown', handleClick, true);
      window.removeEventListener('selectstart', handleClick, true);
      window.removeEventListener('dragstart', handleClick, true);
    };
  }, []);

  const onDocumentLoadSuccess = async (doc: any) => {
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


  if (!isClient) return null;


  const handleDictClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a');
    if (anchor) {
      // Don't intercept sound icons
      if (anchor.getAttribute('href')?.startsWith('sound://')) return;
      e.preventDefault();
      
      let wordToLookUp = anchor.innerText.trim();
      
      const href = anchor.getAttribute('href');
      let usedHref = false;
      if (href) {
        let rawHref = '';
        if (href.startsWith('entry://')) rawHref = decodeURIComponent(href.replace('entry://', ''));
        else if (href.startsWith('dict://')) rawHref = decodeURIComponent(href.replace('dict://', ''));
        else if (href.startsWith('bvg://')) rawHref = decodeURIComponent(href.replace('bvg://', ''));
        
        if (rawHref && !rawHref.startsWith('@') && !rawHref.startsWith('collocations/')) {
          wordToLookUp = rawHref;
          usedHref = true;
        }
      }
      
      if (usedHref) {
        if (wordToLookUp.includes('#')) {
          wordToLookUp = wordToLookUp.split('#')[0];
        }
        wordToLookUp = wordToLookUp.replace(/[^a-zA-Z-\s]/g, '').toLowerCase().trim();
      } else {
        wordToLookUp = wordToLookUp.replace(/[^a-zA-Z-\s]/g, '').toLowerCase().trim();
      }
      
      if (wordToLookUp) {
        setActivePopup(prev => prev ? { ...prev, isLoading: true, word: wordToLookUp, html: undefined } : null);
        fetch(`/api/dict?word=${encodeURIComponent(wordToLookUp)}`)
          .then(res => res.json())
          .then(data => {
            setActivePopup(prev => prev?.word === wordToLookUp ? {
              ...prev,
              isLoading: false,
              html: data.html
            } : prev);
          });
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#FAF9F6] text-[#1C1C1C] overflow-hidden relative" onMouseMove={fileType === 'epub' ? undefined : handleMouseMoveGlobal}>
      <link rel="stylesheet" href="/oald10.css" />
      
      <header className="h-20 border-b border-[#E5E5E5] flex items-center justify-between px-8 bg-[#FAF9F6]/90 backdrop-blur-md shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={() => {
            const from = searchParamsHook.get('from');
            if (from === 'sentences') {
              router.push('/sentences');
            } else if (window.history.length > 2) {
              router.back();
            } else {
              router.push('/');
            }
          }} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E5E5E5] text-[#6B7280] hover:text-[#111827] transition-all cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#6B7280]">Currently Reading</span>
            <h1 className="font-serif font-medium text-sm text-[#111827]">
              {bookTitle || (fileType === 'pdf' ? 'PDF Document' : 'EPUB Document')}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
        {fileType === 'pdf' && (
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
              </div>
              <button 
                disabled={pageNumber >= numPages}
                onClick={() => setPageNumber(p => { const next = p + 1; saveProgress(next, Math.round((next/numPages)*100), numPages); return next; })}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3F4F6] text-[#6B7280] disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center bg-white border border-[#E5E5E5] rounded-full p-1 shadow-sm">
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3F4F6] text-[#6B7280]" onClick={() => setPdfScale(s => Math.max(0.5, s - 0.2))}>
                <Type className="w-3.5 h-3.5" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3F4F6] text-[#6B7280]" onClick={() => setPdfScale(s => Math.min(3, s + 0.2))}>
                <Type className="w-4 h-4" />
              </button>
            </div>
          <button 
              onClick={() => setShowToc(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3F4F6] text-[#6B7280] ml-2"
              title="Table of Contents"
            >
              <List className="w-4 h-4" />
            </button>
            </div>
        )}

        {fileType === 'epub' && (
          <div className="flex items-center bg-white border border-[#E5E5E5] rounded-full p-1 shadow-sm mr-4">
            <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3F4F6] text-[#6B7280]" onClick={() => setFontSize(f => Math.max(50, f - 10))}>
              <Type className="w-3.5 h-3.5" />
            </button>
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
        )}
        {isCompleted ? (
          <div className="flex items-center gap-2 px-4 py-2 bg-[#5B8266]/10 text-[#5B8266] rounded-full text-xs font-bold uppercase tracking-widest">
            <Check className="w-4 h-4" /> Completed
          </div>
        ) : (
          <button 
            onClick={markAsCompleted}
            className="flex items-center gap-2 px-4 py-2 bg-[#111827] hover:bg-[#3D5A80] text-white rounded-full text-xs font-bold uppercase tracking-widest transition-colors shadow-sm shrink-0"
          >
            <Check className="w-4 h-4" /> Mark Complete
          </button>
        )}
        </div>
      </header>

      <main className="flex-1 relative w-full h-full overflow-y-auto">
        {!fileData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#6B7280]">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#3D5A80]" />
            <p>Loading document...</p>
          </div>
        ) : fileType === 'text' ? (
          <div 
            id="text-scroll-container"
            className="w-full h-full overflow-y-auto bg-[#FAF9F6] px-8 py-16"
            onScroll={(e) => {
              const target = e.target as HTMLElement;
              const percent = Math.round((target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100);
              saveProgress(target.scrollTop, percent || 0);
            }}
          >
            <div 
              className="max-w-3xl mx-auto text-lg leading-loose font-serif text-[#374151] whitespace-pre-wrap selection:bg-[#E2E8F0] pb-32"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-[#111827] mb-12 leading-tight">{bookTitle}</h1>
              {renderHighlightedText(fileData as string, highlightText)}
            </div>
          </div>
        ) : fileType === 'epub' ? (
          <ReactReader
            url={fileData as ArrayBuffer}
            location={location}
            locationChanged={(epubcifi: string) => {
              setLocation(epubcifi);
              // Calculate progress
              if (renditionRef.current) {
                const loc = renditionRef.current.currentLocation();
                if (loc && loc.start) {
                  const percent = Math.round(loc.start.percentage * 100);
                  saveProgress(epubcifi, percent || 0);
                } else {
                  saveProgress(epubcifi, 0);
                }
              }
            }}
            epubOptions={{ flow: "scrolled", manager: "continuous" }}
            getRendition={(rendition) => {
              rendition.themes.fontSize(`${fontSize}%`);
              rendition.book.loaded.navigation.then((nav: any) => {
                if (nav && nav.toc) setToc(nav.toc);
              });
              rendition.hooks.content.register((contents: any) => {
                const doc = contents.document;
                contents.addStylesheetRules({
                  "body": {
                    "font-family": "Georgia, serif !important",
                    "color": "#374151 !important",
                    "line-height": "1.8 !important",
                    "padding": "0 20px !important",
                  }
                });
                doc.addEventListener('mousemove', handleIframeMouseMove);
                doc.addEventListener('mousedown', () => {
                  if (hoverTimer.current) clearTimeout(hoverTimer.current);
                  if (closeTimer.current) clearTimeout(closeTimer.current);
                  setActivePopup(null);
                }, true); // use capture
              });
            }}
          />
        ) : (
          <div 
            className="flex justify-center p-8 bg-[#E5E5E5] min-h-full cursor-pointer"
            onClick={(e) => {
              // Ignore clicks if they are inside the dictionary popup
              if (e.target instanceof Element && e.target.closest('.dict-popup')) return;
              
              // Only trigger pagination if no text is currently selected
              if (window.getSelection()?.toString().length) return;

              const clickX = e.clientX;
              const width = window.innerWidth;
              if (clickX > width * 0.7) {
                setPageNumber(p => { const next = Math.min(numPages, p + 1); saveProgress(next, Math.round((next/numPages)*100), numPages); return next; }); // Right 30% clicks next
              } else if (clickX < width * 0.3) {
                setPageNumber(p => { const next = Math.max(1, p - 1); saveProgress(next, Math.round((next/numPages)*100), numPages); return next; }); // Left 30% clicks prev
              }
            }}
          >
            <Document
              file={fileData as File}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<Loader2 className="w-8 h-8 animate-spin text-[#3D5A80]" />}
              className="shadow-2xl cursor-text"
            >
              <Page 
                pageNumber={pageNumber} 
                scale={pdfScale}
                renderTextLayer={true}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>
        )}
      </main>

      {/* Dictionary Popup overlay */}
      {activePopup && (
        <div 
          className="dict-popup fixed z-50 transform -translate-x-1/2 bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-[#E5E5E5] w-[500px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{ left: activePopup.x, ...(activePopup.isUpwards ? { bottom: (activePopup.windowHeight || window.innerHeight) - activePopup.y } : { top: activePopup.y }) }}
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
                  <div className="dict-html-container text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: activePopup.html }} onClick={handleDictClick} />
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

      
      
      {toast && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-[#111827] text-white px-6 py-3 rounded-full shadow-2xl z-50 animate-in slide-in-from-bottom-5 font-bold tracking-wide text-sm">
          {toast}
        </div>
      )}

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
                const res = await fetch('/api/save-phrase', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    phrase: selectionMenu.text, 
                    context: selectionMenu.context, 
                    sourceTitle: bookTitle 
                  })
                });
                const data = await res.json();
                if (data.message === 'already_saved') {
                  showToast('Phrase already in library!');
                } else if (res.ok && data.success) {
                  showToast('Saved to Good Expressions!');
                } else {
                  showToast(data.error || 'Failed to save phrase');
                }
              } catch(e) {
                showToast('Failed to save phrase');
              }
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
                // If user selected multiple words (>= 4 words or ends with punctuation), use their exact selection!
                const sentenceToSave = (
                  selectionMenu.text.split(/\s+/).length >= 4 || 
                  /[.!?]$/.test(selectionMenu.text) || 
                  selectionMenu.text.length > 20
                ) ? selectionMenu.text : (selectionMenu.context || selectionMenu.text);

                const res = await fetch('/api/save-sentence', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    sentence: sentenceToSave.trim(), 
                    sourceTitle: bookTitle,
                    bookId: bookId 
                  })
                });
                const data = await res.json();
                if (data.message === 'already_saved') {
                  showToast('Sentence already in library!');
                } else if (res.ok && data.success) {
                  showToast('Saved to Sentences Library!');
                } else {
                  showToast(data.error || 'Failed to save sentence');
                }
              } catch(e) {
                showToast('Failed to save sentence');
              }
              setSelectionMenu(null);
              window.getSelection()?.removeAllRanges();
            }}
            className="px-3 py-1.5 text-xs font-bold tracking-wide rounded-lg hover:bg-white/20 transition-colors whitespace-nowrap"
          >
            Save Sentence
          </button>
        </div>
      )}
      
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
    </div>
  );
}
