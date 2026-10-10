const fs = require('fs');

const code = `'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Target, Settings, Search, Clock, Plus, ChevronRight, Bookmark, X, Upload, Loader2, Flame } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import localforage from 'localforage';

interface BookMetadata {
  id: string;
  title: string;
  type: 'pdf' | 'epub';
  lastReadAt: number;
  progress: number;
  currentLocation: string | number;
  totalSize: number;
}

export default function Home() {
  const router = useRouter();
  const [showImportModal, setShowImportModal] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [library, setLibrary] = useState<BookMetadata[]>([]);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    const lib = await localforage.getItem<BookMetadata[]>('quiet_library');
    if (lib) {
      setLibrary(lib.sort((a, b) => b.lastReadAt - a.lastReadAt));
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;
    
    const isEpub = file.name.toLowerCase().endsWith('.epub');
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    
    if (!isEpub && !isPdf) {
      alert("Please select a valid PDF or EPUB file.");
      return;
    }

    setIsExtracting(true);
    try {
      const id = Date.now().toString();
      const title = file.name.replace(/\\.[^/.]+$/, "");
      const newBook: BookMetadata = {
        id,
        title,
        type: isPdf ? 'pdf' : 'epub',
        lastReadAt: Date.now(),
        progress: 0,
        currentLocation: isPdf ? 1 : 0,
        totalSize: 0
      };

      const currentLib = await localforage.getItem<BookMetadata[]>('quiet_library') || [];
      currentLib.push(newBook);
      
      await localforage.setItem('quiet_library', currentLib);
      await localforage.setItem(\`quiet_book_\${id}\`, file);
      
      router.push(\`/reader?id=\${id}\`);
    } catch (err) {
      console.error("Error saving file:", err);
      alert("Could not read this file.");
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Remove this document from library?")) {
      const currentLib = library.filter(b => b.id !== id);
      await localforage.setItem('quiet_library', currentLib);
      await localforage.removeItem(\`quiet_book_\${id}\`);
      setLibrary(currentLib);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1C1C] font-sans selection:bg-[#E2E8F0]">
      {/* Top Navigation */}
      <nav className="border-b border-[#E5E5E5] bg-white/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#111827] rounded-lg flex items-center justify-center">
              <BookOpen className="text-white w-4 h-4" />
            </div>
            <span className="font-serif font-bold text-lg tracking-tight">Quiet Tracker</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-[#6B7280] hover:text-[#111827] transition-colors p-2">
              <Search className="w-5 h-5" />
            </button>
            <button className="text-[#6B7280] hover:text-[#111827] transition-colors p-2">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-12">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 pt-8 pb-4 border-b border-[#E5E5E5]">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 font-serif text-[#111827]">Welcome Back</h1>
            <p className="text-[#6B7280] text-lg font-serif italic">"For us, there is only the trying. The rest is not our business." <span className="text-sm not-italic ml-2">— T.S. Eliot</span></p>
          </div>
          <div className="inline-flex items-center space-x-2 bg-white px-5 py-2.5 rounded-2xl border border-[#E5E5E5] shadow-sm">
            <Flame className="text-[#E07A5F] w-5 h-5" />
            <span className="font-semibold text-sm tracking-wide text-[#374151]">12-DAY STREAK</span>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {/* Left Column */}
          <div className="xl:col-span-2 space-y-10">
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif font-semibold text-[#111827]">Your Library</h2>
                <div className="flex gap-4 items-center">
                  <button onClick={() => setShowImportModal(true)} className="text-sm font-bold uppercase tracking-wider text-[#3D5A80] hover:text-[#111827] flex items-center">
                    <Plus className="w-4 h-4 mr-1" /> Import Document
                  </button>
                </div>
              </div>

              {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/40 backdrop-blur-sm">
                  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="flex justify-between items-center p-6 border-b border-[#E5E5E5] shrink-0">
                      <h3 className="font-serif text-xl font-bold text-[#111827]">Import New Reading</h3>
                      <button onClick={() => setShowImportModal(false)} className="text-[#6B7280] hover:text-[#111827]"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
                      <div 
                        className={"border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer group transition-colors " + (isDragging ? 'border-[#3D5A80] bg-[#3D5A80]/5' : 'border-[#D1D5DB] hover:border-[#3D5A80] bg-[#FAF9F6]')} 
                        onClick={() => fileInputRef.current?.click()} 
                        onDragOver={handleDragOver} 
                        onDragLeave={handleDragLeave} 
                        onDrop={handleDrop}
                      >
                        <input type="file" accept=".epub,.pdf" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        {isExtracting ? (
                          <>
                            <Loader2 className="w-10 h-10 text-[#3D5A80] animate-spin mb-4" />
                            <p className="font-bold text-[#111827]">Processing Document...</p>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Upload className="w-5 h-5 text-[#3D5A80]" /></div>
                            <p className="font-bold text-[#111827]">Click or Drag & Drop a PDF or EPUB here</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {library.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-[#E5E5E5] flex flex-col items-center justify-center text-center">
                  <BookOpen className="w-12 h-12 text-[#D1D5DB] mb-4" />
                  <h3 className="text-xl font-serif font-bold text-[#111827] mb-2">Your library is empty</h3>
                  <p className="text-[#6B7280] mb-6">Upload a PDF or EPUB to start reading.</p>
                  <button onClick={() => setShowImportModal(true)} className="bg-[#111827] text-white px-6 py-3 rounded-xl font-bold text-sm">Upload File</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {library.map((book) => (
                    <Link href={\`/reader?id=\${book.id}\`} key={book.id} className="group bg-white p-6 rounded-3xl border border-[#E5E5E5] h-full flex flex-col justify-between hover:shadow-lg transition-all hover:-translate-y-1 relative">
                      <button 
                        onClick={(e) => handleDelete(e, book.id)}
                        className="absolute top-4 right-4 text-[#D1D5DB] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove from library"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className={"text-[10px] font-bold uppercase px-3 py-1.5 rounded-full " + (book.type === 'pdf' ? 'bg-[#E07A5F]/10 text-[#E07A5F]' : 'bg-[#3D5A80]/10 text-[#3D5A80]')}>
                            {book.type.toUpperCase()}
                          </span>
                        </div>
                        <h3 className="font-serif font-bold text-lg mb-2 text-[#111827] line-clamp-2 leading-tight">{book.title}</h3>
                        <p className="text-xs text-[#6B7280] mb-6">Last read: {new Date(book.lastReadAt).toLocaleDateString()}</p>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-[#6B7280]">Progress</span>
                          <span className="text-xs font-bold text-[#111827]">{book.progress}%</span>
                        </div>
                        <div className="w-full bg-[#F3F4F6] rounded-full h-2 overflow-hidden">
                          <div className="bg-[#111827] h-full rounded-full transition-all" style={{ width: \`\${book.progress}%\` }}></div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <section className="bg-white p-8 rounded-3xl border border-[#E5E5E5]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif font-semibold text-[#111827]">Due for Review</h2>
                <Link href="/review" className="text-sm font-bold uppercase tracking-wider text-[#3D5A80] hover:text-[#111827] flex items-center bg-[#3D5A80]/10 px-4 py-2 rounded-xl">
                  Start Review <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                Your spaced repetition library is powered by Cloudflare D1. Build your vocabulary organically while reading.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/app/page.tsx', code);
