const fs = require('fs');

const code = `'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Target, Settings, Search, Clock, Plus, ChevronRight, Bookmark, X, Upload, Loader2, Flame, CheckCircle2, FileText, Book } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import localforage from 'localforage';

interface BookMetadata {
  id: string;
  title: string;
  author?: string;
  type: 'pdf' | 'epub';
  category: 'book' | 'article';
  lastReadAt: number;
  progress: number;
  currentLocation: string | number;
  totalSize: number;
}

export default function Home() {
  const router = useRouter();
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCategory, setImportCategory] = useState<'book' | 'article'>('book');
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
      // Ensure older items have a category
      const migratedLib = lib.map(b => ({
        ...b,
        category: b.category || (b.type === 'epub' ? 'book' : 'article'),
        author: b.author || 'Unknown Author'
      }));
      setLibrary(migratedLib.sort((a, b) => b.lastReadAt - a.lastReadAt));
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
        author: "Imported Document", // We can't parse PDF authors purely client-side easily without heavy libraries, so we use a placeholder
        type: isPdf ? 'pdf' : 'epub',
        category: importCategory,
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

  const books = library.filter(b => b.category === 'book');
  const articles = library.filter(b => b.category === 'article');
  
  const mostRecentBook = books[0];
  const mostRecentArticle = articles[0];

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const activeDays = [0, 1, 2, 3, 5]; // Dummy streak data

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
            <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 bg-[#111827] text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:shadow-md transition-all">
              <Plus className="w-4 h-4" /> Import
            </button>
            <button className="text-[#6B7280] hover:text-[#111827] transition-colors p-2"><Search className="w-5 h-5" /></button>
            <button className="text-[#6B7280] hover:text-[#111827] transition-colors p-2"><Settings className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-12">
        {/* Header & Habits Section */}
        <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-10 border-b border-[#E5E5E5] pb-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 font-serif text-[#111827]">Welcome Back</h1>
            <p className="text-[#6B7280] text-lg font-serif italic">"For us, there is only the trying. The rest is not our business." <span className="text-sm not-italic ml-2">— T.S. Eliot</span></p>
          </div>
          
          {/* Restored Habit Trackers */}
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-6 px-6 lg:mx-0 lg:px-0 lg:pb-0 hide-scrollbar">
            {/* Daily Goal */}
            <div className="bg-white p-5 rounded-3xl border border-[#E5E5E5] flex items-center gap-5 min-w-[240px] shadow-sm">
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-[#F3F4F6]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                  <path className="text-[#3D5A80]" strokeDasharray="65, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <div className="absolute flex items-center justify-center">
                  <Target className="w-5 h-5 text-[#3D5A80]" />
                </div>
              </div>
              <div>
                <h3 className="text-[11px] font-bold tracking-widest uppercase text-[#6B7280] mb-1">Today's Reading</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-serif font-bold text-[#111827]">45</span>
                  <span className="text-xs text-[#6B7280] font-medium">/ 120 mins</span>
                </div>
              </div>
            </div>

            {/* Consistency Tracker */}
            <div className="bg-white p-5 rounded-3xl border border-[#E5E5E5] min-w-[300px] shadow-sm flex flex-col justify-center">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[11px] font-bold tracking-widest uppercase text-[#6B7280]">Consistency</h3>
                <div className="flex items-center gap-1 bg-[#E07A5F]/10 px-2 py-1 rounded-md">
                  <Flame className="w-3 h-3 text-[#E07A5F]" />
                  <span className="text-xs font-bold text-[#E07A5F]">12 Days</span>
                </div>
              </div>
              <div className="flex justify-between">
                {daysOfWeek.map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div className={\`w-6 h-6 rounded-full flex items-center justify-center \${activeDays.includes(i) ? 'bg-[#5B8266] text-white' : 'bg-[#F3F4F6] text-[#D1D5DB]'}\`}>
                      {activeDays.includes(i) ? <CheckCircle2 className="w-4 h-4" /> : null}
                    </div>
                    <span className="text-[9px] font-bold text-[#6B7280]">{day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Currently Reading Section */}
        <section>
          <h2 className="text-2xl font-serif font-semibold text-[#111827] mb-6">Pick up where you left off</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Most Recent Book */}
            {mostRecentBook ? (
              <Link href={\`/reader?id=\${mostRecentBook.id}\`} className="group flex bg-white rounded-3xl border border-[#E5E5E5] overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-32 bg-[#3D5A80]/10 flex flex-col items-center justify-center p-4 border-r border-[#E5E5E5]">
                  <Book className="w-10 h-10 text-[#3D5A80] mb-2" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#3D5A80]">Book</span>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-xl text-[#111827] line-clamp-2 leading-tight mb-2">{mostRecentBook.title}</h3>
                    <p className="text-sm text-[#6B7280]">{mostRecentBook.author}</p>
                  </div>
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-[#6B7280]">Progress</span>
                      <span className="text-xs font-bold text-[#111827]">{mostRecentBook.progress}%</span>
                    </div>
                    <div className="w-full bg-[#F3F4F6] rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#3D5A80] h-full rounded-full" style={{ width: \`\${mostRecentBook.progress}%\` }}></div>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="bg-white rounded-3xl border border-dashed border-[#D1D5DB] p-8 flex flex-col items-center justify-center text-center text-[#6B7280]">
                <Book className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-sm font-medium">No books in progress.</p>
              </div>
            )}

            {/* Most Recent Article */}
            {mostRecentArticle ? (
              <Link href={\`/reader?id=\${mostRecentArticle.id}\`} className="group flex bg-white rounded-3xl border border-[#E5E5E5] overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-32 bg-[#E07A5F]/10 flex flex-col items-center justify-center p-4 border-r border-[#E5E5E5]">
                  <FileText className="w-10 h-10 text-[#E07A5F] mb-2" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#E07A5F]">Article</span>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-xl text-[#111827] line-clamp-2 leading-tight mb-2">{mostRecentArticle.title}</h3>
                    <p className="text-sm text-[#6B7280]">{mostRecentArticle.author}</p>
                  </div>
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-[#6B7280]">Progress</span>
                      <span className="text-xs font-bold text-[#111827]">{mostRecentArticle.progress}%</span>
                    </div>
                    <div className="w-full bg-[#F3F4F6] rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#E07A5F] h-full rounded-full" style={{ width: \`\${mostRecentArticle.progress}%\` }}></div>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="bg-white rounded-3xl border border-dashed border-[#D1D5DB] p-8 flex flex-col items-center justify-center text-center text-[#6B7280]">
                <FileText className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-sm font-medium">No articles in progress.</p>
              </div>
            )}

          </div>
        </section>

        {/* SRS Widget & Shelves Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 border-t border-[#E5E5E5] pt-10">
          
          {/* Shelves (2 columns) */}
          <div className="xl:col-span-2 space-y-12">
            
            {/* Book Shelf */}
            <section>
              <h2 className="text-2xl font-serif font-semibold text-[#111827] mb-6 flex items-center gap-2"><Book className="w-5 h-5 text-[#3D5A80]" /> Book Shelf</h2>
              {books.length === 0 ? (
                <p className="text-[#6B7280] italic text-sm">Your bookshelf is empty.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {books.map(book => (
                    <Link href={\`/reader?id=\${book.id}\`} key={book.id} className="group flex flex-col bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden hover:shadow-lg transition-all relative">
                      <button onClick={(e) => handleDelete(e, book.id)} className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full text-[#D1D5DB] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10"><X className="w-4 h-4" /></button>
                      <div className="h-32 bg-[#3D5A80]/5 flex items-center justify-center border-b border-[#E5E5E5]">
                        <Book className="w-8 h-8 text-[#3D5A80]/40" />
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-serif font-bold text-sm text-[#111827] line-clamp-2 leading-snug mb-1">{book.title}</h4>
                          <p className="text-[11px] text-[#6B7280] line-clamp-1">{book.author}</p>
                        </div>
                        <div className="mt-3">
                           <div className="w-full bg-[#F3F4F6] rounded-full h-1 overflow-hidden">
                             <div className="bg-[#3D5A80] h-full rounded-full" style={{ width: \`\${book.progress}%\` }}></div>
                           </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Article Shelf */}
            <section>
              <h2 className="text-2xl font-serif font-semibold text-[#111827] mb-6 flex items-center gap-2"><FileText className="w-5 h-5 text-[#E07A5F]" /> Article Shelf</h2>
              {articles.length === 0 ? (
                <p className="text-[#6B7280] italic text-sm">Your article shelf is empty.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {articles.map(article => (
                    <Link href={\`/reader?id=\${article.id}\`} key={article.id} className="group flex flex-col bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden hover:shadow-lg transition-all relative">
                      <button onClick={(e) => handleDelete(e, article.id)} className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full text-[#D1D5DB] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10"><X className="w-4 h-4" /></button>
                      <div className="h-32 bg-[#E07A5F]/5 flex items-center justify-center border-b border-[#E5E5E5]">
                        <FileText className="w-8 h-8 text-[#E07A5F]/40" />
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-serif font-bold text-sm text-[#111827] line-clamp-2 leading-snug mb-1">{article.title}</h4>
                          <p className="text-[11px] text-[#6B7280] line-clamp-1">{article.author}</p>
                        </div>
                        <div className="mt-3">
                           <div className="w-full bg-[#F3F4F6] rounded-full h-1 overflow-hidden">
                             <div className="bg-[#E07A5F] h-full rounded-full" style={{ width: \`\${article.progress}%\` }}></div>
                           </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

          </div>

          {/* Right Column: SRS Review */}
          <div className="space-y-6">
            <section className="bg-white p-8 rounded-3xl border border-[#E5E5E5] sticky top-24 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif font-semibold text-[#111827]">Due for Review</h2>
              </div>
              <div className="flex items-center justify-between mb-8 pb-8 border-b border-[#E5E5E5]">
                <div className="text-center">
                  <span className="block text-4xl font-bold font-serif text-[#111827]">12</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">Words</span>
                </div>
                <div className="text-center">
                  <span className="block text-4xl font-bold font-serif text-[#111827]">0</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">Phrases</span>
                </div>
              </div>
              <Link href="/review" className="w-full flex items-center justify-center gap-2 bg-[#111827] text-white px-6 py-4 rounded-2xl font-bold text-sm tracking-wider uppercase shadow-md hover:bg-[#374151] transition-all hover:-translate-y-0.5">
                Start SRS Review <ChevronRight className="w-4 h-4" />
              </Link>
            </section>
          </div>

        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-[#E5E5E5] shrink-0">
              <h3 className="font-serif text-xl font-bold text-[#111827]">Add to Library</h3>
              <button onClick={() => setShowImportModal(false)} className="text-[#6B7280] hover:text-[#111827] bg-[#F3F4F6] rounded-full p-2"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-8 flex-1 overflow-y-auto flex flex-col gap-8">
              
              {/* Category Selector */}
              <div>
                <h4 className="text-[11px] font-bold tracking-widest uppercase text-[#6B7280] mb-3">What are you importing?</h4>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setImportCategory('book')}
                    className={\`flex-1 flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all \${importCategory === 'book' ? 'border-[#3D5A80] bg-[#3D5A80]/5' : 'border-[#E5E5E5] hover:border-[#D1D5DB] bg-white'}\`}
                  >
                    <Book className={\`w-8 h-8 \${importCategory === 'book' ? 'text-[#3D5A80]' : 'text-[#9CA3AF]'}\`} />
                    <span className={\`font-bold \${importCategory === 'book' ? 'text-[#3D5A80]' : 'text-[#6B7280]'}\`}>Book</span>
                  </button>
                  <button 
                    onClick={() => setImportCategory('article')}
                    className={\`flex-1 flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all \${importCategory === 'article' ? 'border-[#E07A5F] bg-[#E07A5F]/5' : 'border-[#E5E5E5] hover:border-[#D1D5DB] bg-white'}\`}
                  >
                    <FileText className={\`w-8 h-8 \${importCategory === 'article' ? 'text-[#E07A5F]' : 'text-[#9CA3AF]'}\`} />
                    <span className={\`font-bold \${importCategory === 'article' ? 'text-[#E07A5F]' : 'text-[#6B7280]'}\`}>Article</span>
                  </button>
                </div>
              </div>

              {/* Upload Zone */}
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
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
`;

fs.writeFileSync('src/app/page.tsx', code);
