'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, BookA, TextQuote, Quote, Target, Settings, Search, Clock, Plus, ChevronRight, Bookmark, X, Upload, Loader2, Flame, CheckCircle2, FileText, Book } from 'lucide-react';
import Link from 'next/link';
import { useAuth, SignInButton, SignUpButton, Show, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import localforage from 'localforage';

interface BookMetadata {
  id: string;
  title: string;
  author?: string;
  type: 'pdf' | 'epub' | 'text';
  category: 'book' | 'article';
  lastReadAt: number;
  progress: number;
  isCompleted?: boolean;
  currentLocation: string | number;
  totalSize: number;
}

export default function Home() {
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [showImportModal, setShowImportModal] = useState(false);
  const [importCategory, setImportCategory] = useState<'book' | 'article'>('book');
  const [importMethod, setImportMethod] = useState<'file' | 'text'>('file');
  const [pastedTitle, setPastedTitle] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [libStats, setLibStats] = useState({ words: 0, phrases: 0, sentences: 0, dueWords: 0, duePhrases: 0 });
  const [readingStats, setReadingStats] = useState({ todayMins: 0, streak: 0, activeDays: [] as number[], history: {} as Record<string, number> });
  const [displayDays, setDisplayDays] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [library, setLibrary] = useState<BookMetadata[]>([]);

  useEffect(() => {
    loadLibrary();
    
    // Fetch D1 stats with token
    (async () => {
      try {
        let token: string | null = null;
        try { token = await getToken(); } catch (e) {}
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const [wRes, pRes, sRes] = await Promise.all([
          fetch('/api/library-items?type=word&t=' + Date.now(), { headers }).then(r => r.json()).catch(() => ({ items: [] })),
          fetch('/api/library-items?type=phrase&t=' + Date.now(), { headers }).then(r => r.json()).catch(() => ({ items: [] })),
          fetch('/api/sentences?t=' + Date.now(), { headers }).then(r => r.json()).catch(() => ({ sentences: [] }))
        ]);

        const words = wRes.items || [];
        const phrases = pRes.items || [];
        const sentences = sRes.sentences || [];
        const now = Date.now();
        setLibStats({
          words: words.length,
          phrases: phrases.length,
          sentences: sentences.length,
          dueWords: words.filter((w: any) => (w.repetition || 0) > 0 && w.next_review_at <= now).length,
          duePhrases: phrases.filter((p: any) => (p.repetitions || 0) > 0 && p.next_review_at <= now).length
        });
      } catch (err) {
        console.warn("Failed to load lib stats:", err);
      }
    })();

    // Fetch localforage stats
    localforage.getItem<any>('quiet_reading_stats').then(stats => {
      let days = [];
      const now = new Date();
      now.setHours(0,0,0,0);
      let startDate = new Date(now);

      if (stats) {
        const todayStr = new Date().toDateString();
        setReadingStats({
          todayMins: stats[todayStr] || 0,
          streak: stats.streak || 1,
          activeDays: stats.activeDays || [new Date().getDay()],
          history: stats
        });

        // Filter out metadata keys to find actual dates
        const historyKeys = Object.keys(stats).filter(k => k !== 'streak' && k !== 'activeDays' && stats[k] > 0);
        if (historyKeys.length > 0) {
          const timestamps = historyKeys.map(d => new Date(d).getTime()).filter(t => !isNaN(t));
          if (timestamps.length > 0) {
            const firstActiveDay = new Date(Math.min(...timestamps));
            firstActiveDay.setHours(0,0,0,0);
            
            const diffDays = Math.floor((now.getTime() - firstActiveDay.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 30 && diffDays >= 0) {
              startDate = firstActiveDay;
            } else {
              startDate.setDate(startDate.getDate() - 29);
            }
          }
        }
      } else {
        setReadingStats({ todayMins: 0, streak: 1, activeDays: [new Date().getDay()], history: {} });
      }
      
      for (let i = 0; i < 30; i++) {
         const d = new Date(startDate);
         d.setDate(d.getDate() + i);
         days.push(d.toDateString());
      }
      setDisplayDays(days);
    });

  }, [isLoaded, isSignedIn]);

  const loadLibrary = async () => {
    try {
      let token: string | null = null;
      try { token = await getToken(); } catch (e) {}

      const fetchHeaders: Record<string, string> = {
        'Cache-Control': 'no-cache',
      };
      if (token) fetchHeaders['Authorization'] = `Bearer ${token}`;

      // 1. Cloud documents
      const res = await fetch('/api/documents?t=' + Date.now(), { headers: fetchHeaders });
      const data = await res.json();
      let cloudDocs: BookMetadata[] = [];
      if (data.documents) {
        cloudDocs = data.documents.map((d: any) => ({
          id: d.id,
          title: d.title,
          author: d.author || 'Imported Document',
          type: (d.file_name && d.file_name.toLowerCase().endsWith('.epub')) ? 'epub' : ((d.type === 'article' || d.content) ? 'text' : 'pdf'),
          category: d.type === 'book' ? 'book' : 'article',
          lastReadAt: d.last_read_at || Date.now(),
          progress: d.percentage || 0,
          isCompleted: (d.percentage || 0) >= 100,
          currentLocation: d.reading_progress || ((d.file_name && d.file_name.toLowerCase().endsWith('.epub')) ? 0 : 1),
          totalSize: Number(d.total_progress) || 0
        }));
      }

      // 2. Local fallback
      const localLib = await localforage.getItem<BookMetadata[]>('quiet_library') || [];
      const migratedLocal = localLib.map(b => ({
        ...b,
        category: b.category || (b.type === 'epub' ? 'book' : 'article'),
        author: b.author || 'Imported Document'
      }));

      // 3. Auto-sync any local-only documents to Cloudflare D1
      for (const localDoc of migratedLocal) {
        const alreadyInCloud = cloudDocs.some(cd => cd.id === localDoc.id || cd.title === localDoc.title);
        if (!alreadyInCloud) {
          try {
            let content = '';
            if (localDoc.type === 'text') {
              const fileBlob = await localforage.getItem(`quiet_book_${localDoc.id}`);
              if (fileBlob instanceof Blob) {
                content = await fileBlob.text();
              } else if (typeof fileBlob === 'string') {
                content = fileBlob;
              }
            }
            const syncHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) syncHeaders['Authorization'] = `Bearer ${token}`;

            const syncRes = await fetch('/api/documents', {
              method: 'POST',
              headers: syncHeaders,
              body: JSON.stringify({
                id: localDoc.id,
                type: localDoc.category || 'article',
                title: localDoc.title,
                author: localDoc.author || 'Pasted Text',
                fileName: `${localDoc.title.slice(0, 20)}.txt`,
                fileKey: '',
                content: content,
                totalProgress: String(localDoc.totalSize || 0),
                percentage: localDoc.isCompleted ? 100 : (localDoc.progress || 0),
                readingProgress: String(localDoc.currentLocation || '')
              })
            });
            if (syncRes.ok) {
              const syncData = await syncRes.json();
              if (syncData.document) {
                cloudDocs.push({
                  id: syncData.document.id,
                  title: syncData.document.title,
                  author: localDoc.author || 'Pasted Text',
                  type: 'text',
                  category: (syncData.document.type || 'article') as 'book' | 'article',
                  lastReadAt: localDoc.lastReadAt || Date.now(),
                  progress: localDoc.progress || 0,
                  isCompleted: localDoc.isCompleted || false,
                  currentLocation: localDoc.currentLocation || 0,
                  totalSize: localDoc.totalSize || 0
                });
              }
            }
          } catch (syncErr) {
            console.warn("Auto sync local doc to cloud failed:", syncErr);
          }
        }
      }

      // Merge (prefer cloud)
      const map = new Map<string, BookMetadata>();
      migratedLocal.forEach(b => map.set(b.id, b));
      cloudDocs.forEach(b => map.set(b.id, b));

      setLibrary(Array.from(map.values()).sort((a, b) => b.lastReadAt - a.lastReadAt));
    } catch (e) {
      console.error("Failed to load library:", e);
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
      const title = file.name.replace(/\.[^/.]+$/, "");
      const contentType = file.type || (isPdf ? 'application/pdf' : 'application/epub+zip');

      // 1. Get presigned upload URL for R2
      let fileKey = '';
      try {
        const urlRes = await fetch('/api/documents/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, contentType })
        });
        const urlData = await urlRes.json();
        if (urlData.uploadUrl) {
          fileKey = urlData.fileKey;
          // Direct PUT to R2
          await fetch(urlData.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': contentType },
            body: file
          });
        }
      } catch (uploadErr) {
        console.warn("Cloud upload warning, proceeding with local fallback:", uploadErr);
      }

      // 2. Save document metadata to D1
      try {
        await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            type: importCategory,
            title,
            author: 'Imported Document',
            fileName: file.name,
            fileKey,
            totalProgress: ''
          })
        });
      } catch (d1Err) {
        console.warn("D1 metadata save warning:", d1Err);
      }

      // 3. Cache locally in localforage for instant zero-latency loading
      const newBook: BookMetadata = {
        id,
        title,
        author: "Imported Document",
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
      await localforage.setItem(`quiet_book_${id}`, file);
      
      router.push(`/reader?id=${id}`);
    } catch (err: any) {
      console.error("Error saving file:", err);
      alert("Could not process this file: " + (err.message || 'Unknown error'));
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handlePasteSave = async () => {
    if (!pastedText.trim()) return;
    setIsExtracting(true);
    try {
      const title = pastedTitle.trim() || pastedText.trim().split('\n')[0].slice(0, 50) || 'Pasted Article';
      
      // 1. Cloud Save to D1
      let docId = Date.now().toString();
      try {
        let token: string | null = null;
        try { token = await getToken(); } catch (e) {}
        const postHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) postHeaders['Authorization'] = `Bearer ${token}`;

        const cloudRes = await fetch('/api/documents', {
          method: 'POST',
          headers: postHeaders,
          body: JSON.stringify({
            id: docId,
            type: 'article',
            title: title,
            author: 'Pasted Text',
            fileName: `${title.slice(0, 20)}.txt`,
            fileKey: '',
            content: pastedText,
            percentage: 0,
          })
        });
        if (cloudRes.ok) {
          const cloudData = await cloudRes.json();
          if (cloudData.document?.id) {
            docId = cloudData.document.id;
          }
        } else {
          console.warn("Cloud save non-ok response:", await cloudRes.text());
        }
      } catch (cloudErr) {
        console.warn("Cloud save failed, falling back to local:", cloudErr);
      }

      // 2. Local cache in localforage
      const newDoc: BookMetadata = {
        id: docId,
        title: title,
        author: 'Pasted Text',
        type: 'text',
        category: 'article',
        lastReadAt: Date.now(),
        progress: 0,
        currentLocation: 0,
        totalSize: pastedText.length,
      };

      const currentLib = await localforage.getItem<BookMetadata[]>('quiet_library') || [];
      currentLib.unshift(newDoc);
      await localforage.setItem('quiet_library', currentLib);

      // Save content for offline / instant reader
      const blob = new Blob([pastedText], { type: 'text/plain' });
      await localforage.setItem(`quiet_book_${docId}`, blob);

      setShowImportModal(false);
      setPastedTitle('');
      setPastedText('');
      router.push(`/reader?id=${docId}`);
    } catch (err) {
      console.error("Failed to save pasted text:", err);
      alert("Failed to save article");
    } finally {
      setIsExtracting(false);
    }
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
      try {
        await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      } catch (e) {
        console.error("Failed to delete document from cloud:", e);
      }
      const currentLib = library.filter(b => b.id !== id);
      await localforage.setItem('quiet_library', currentLib);
      await localforage.removeItem(`quiet_book_${id}`);
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
            <span className="font-serif font-bold text-lg tracking-tight">Quiet Reading Tracker</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 bg-[#111827] text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:shadow-md transition-all">
              <Plus className="w-4 h-4" /> Import
            </button>
            <button className="text-[#6B7280] hover:text-[#111827] transition-colors p-2"><Search className="w-5 h-5" /></button>
            <button className="text-[#6B7280] hover:text-[#111827] transition-colors p-2"><Settings className="w-5 h-5" /></button>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="text-sm font-bold text-[#111827] hover:text-[#3D5A80] transition-colors ml-2">Sign In</button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <div className="ml-2">
                <UserButton  />
              </div>
            </Show>
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
            <div className="bg-white px-8 py-6 rounded-3xl border border-[#E5E5E5] flex items-center gap-8 min-w-[320px] shadow-sm hover:shadow-md transition-shadow">
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-[#F3F4F6]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                  <path className="text-[#3D5A80]" strokeDasharray={`${Math.min((readingStats.todayMins / 60) * 100, 100)}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <div className="absolute flex items-center justify-center">
                  <Target className="w-5 h-5 text-[#3D5A80]" />
                </div>
              </div>
              <div>
                <h3 className="text-[11px] font-bold tracking-widest uppercase text-[#6B7280] mb-1">Today's Reading</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-serif font-bold text-[#111827]">{readingStats.todayMins}</span>
                  <span className="text-sm text-[#6B7280] font-medium">/ 60 mins</span>
                </div>
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
              <Link href={`/reader?id=${mostRecentBook.id}`} className="group flex bg-white rounded-3xl border border-[#E5E5E5] overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
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
                      <span className="text-xs font-bold text-[#6B7280]">Status</span>
                      <span className="text-xs font-bold text-[#111827] uppercase tracking-widest">{mostRecentBook.isCompleted ? 'Completed' : mostRecentBook.progress > 0 ? `${mostRecentBook.progress}% Read` : 'New'}</span>
                    </div>
                    <div className="w-full bg-[#F3F4F6] rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#3D5A80] h-full rounded-full" style={{ width: `${mostRecentBook.isCompleted ? 100 : mostRecentBook.progress}%` }}></div>
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
              <Link href={`/reader?id=${mostRecentArticle.id}`} className="group flex bg-white rounded-3xl border border-[#E5E5E5] overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
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
                      <span className="text-xs font-bold text-[#6B7280]">Status</span>
                      <span className="text-xs font-bold text-[#111827] uppercase tracking-widest">{mostRecentArticle.isCompleted ? 'Completed' : mostRecentArticle.progress > 0 ? `${mostRecentArticle.progress}% Read` : 'New'}</span>
                    </div>
                    <div className="w-full bg-[#F3F4F6] rounded-full h-1.5 overflow-hidden">
                      <div className="bg-[#E07A5F] h-full rounded-full" style={{ width: `${mostRecentArticle.isCompleted ? 100 : mostRecentArticle.progress}%` }}></div>
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
            
            
            {/* Unified Shelves Navigation */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/library/books" className="group bg-white rounded-3xl p-8 border border-[#E5E5E5] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center justify-center min-h-[220px]">
                <div className="w-16 h-16 rounded-full bg-[#3D5A80]/10 flex items-center justify-center mb-6 text-[#3D5A80] group-hover:scale-110 transition-transform">
                  <Book className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-[#111827] mb-2 group-hover:text-[#3D5A80] transition-colors">Book Shelf</h2>
                <p className="text-[#6B7280] text-sm text-center">Browse your imported books</p>
                <span className="mt-4 text-[10px] font-bold tracking-widest uppercase text-[#9CA3AF] bg-[#F3F4F6] px-3 py-1 rounded-full">
                  {books.length} Books
                </span>
              </Link>

              <Link href="/library/articles" className="group bg-white rounded-3xl p-8 border border-[#E5E5E5] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center justify-center min-h-[220px]">
                <div className="w-16 h-16 rounded-full bg-[#E07A5F]/10 flex items-center justify-center mb-6 text-[#E07A5F] group-hover:scale-110 transition-transform">
                  <FileText className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-[#111827] mb-2 group-hover:text-[#E07A5F] transition-colors">Article Shelf</h2>
                <p className="text-[#6B7280] text-sm text-center">Browse short-form articles</p>
                <span className="mt-4 text-[10px] font-bold tracking-widest uppercase text-[#9CA3AF] bg-[#F3F4F6] px-3 py-1 rounded-full">
                  {articles.length} Articles
                </span>
              </Link>
            </section>

            {/* Wide Consistency Tracker */}
            <section className="bg-white p-6 rounded-3xl border border-[#E5E5E5] shadow-sm flex items-center justify-between mt-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-[#E07A5F]/10 px-3 py-1.5 rounded-xl">
                  <Flame className="w-5 h-5 text-[#E07A5F]" />
                  <span className="text-sm font-bold text-[#E07A5F] tracking-wide">{readingStats.streak} Day Streak</span>
                </div>
                <span className="text-[11px] font-bold tracking-widest uppercase text-[#9CA3AF] hidden md:block">30-Day Habit</span>
              </div>
              {(() => {
                const colors = ['#E07A5F', '#3D5A80', '#5B8266', '#F6CA83', '#F4A261', '#293241'];
                // If not mounted/calculated yet, render empty placeholders to avoid layout shift
                const days = displayDays.length > 0 ? displayDays : Array.from({ length: 30 }).map((_, i) => 'placeholder-' + i);
                return (
                  <div className="grid grid-cols-10 gap-1.5 md:gap-2 ml-auto shrink-0 py-1">
                    {days.map((dateStr, i) => {
                      const isPlaceholder = dateStr.startsWith('placeholder-');
                      const isRead = !isPlaceholder && readingStats.history && readingStats.history[dateStr] > 0;
                      const color = colors[i % colors.length];
                      return (
                        <div 
                          key={dateStr}
                          className={`w-4 h-4 md:w-5 md:h-5 rounded-full transition-all border shadow-sm`}
                          style={{
                            backgroundColor: isRead ? color : 'transparent',
                            borderColor: isRead ? color : '#E5E5E5',
                            opacity: isRead ? 1 : 0.5
                          }}
                          title={!isPlaceholder ? dateStr : undefined}
                        />
                      );
                    })}
                  </div>
                );
              })()}
            </section>

          </div>

          {/* Right Column: SRS Review */}
          <div className="space-y-6">
            <section className="bg-white p-8 rounded-3xl border border-[#E5E5E5] sticky top-24 shadow-sm">
              <h2 className="text-2xl font-serif font-semibold text-[#111827] mb-6">Knowledge Library</h2>
              <div className="space-y-4">
                <Link href="/review/words" className="flex items-center justify-between p-4 rounded-2xl bg-white hover:bg-[#F9FAFB] transition-all group border border-[#E5E5E5] hover:shadow-md hover:-translate-y-0.5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#3D5A80]/10 text-[#3D5A80] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <BookA className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block font-bold text-sm text-[#111827] mb-1">Vocabulary</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#6B7280]">{libStats.words} Words</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap shrink-0 ${libStats.dueWords > 0 ? 'bg-[#E07A5F] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                    {libStats.dueWords} Due
                  </span>
                </Link>

                <Link href="/review/phrases" className="flex items-center justify-between p-4 rounded-2xl bg-white hover:bg-[#F9FAFB] transition-all group border border-[#E5E5E5] hover:shadow-md hover:-translate-y-0.5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#E07A5F]/10 text-[#E07A5F] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TextQuote className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block font-bold text-sm text-[#111827] mb-1">Expressions</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#6B7280]">{libStats.phrases} Phrases</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm whitespace-nowrap shrink-0 ${libStats.duePhrases > 0 ? 'bg-[#E07A5F] text-white' : 'bg-[#F3F4F6] text-[#6B7280]'}`}>
                    {libStats.duePhrases} Due
                  </span>
                </Link>

                <Link href="/sentences" className="flex items-center justify-between p-4 rounded-2xl bg-white hover:bg-[#F9FAFB] transition-all group border border-[#E5E5E5] hover:shadow-md hover:-translate-y-0.5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#5B8266]/10 text-[#5B8266] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Quote className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block font-bold text-sm text-[#111827] mb-1">Sentences</span>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#6B7280]">{libStats.sentences} Sentences</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#D1D5DB] group-hover:text-[#111827] transition-colors" />
                </Link>
              </div>
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
                    onClick={() => { setImportCategory('book'); setImportMethod('file'); }}
                    className={`flex-1 flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all ${importCategory === 'book' ? 'border-[#3D5A80] bg-[#3D5A80]/5' : 'border-[#E5E5E5] hover:border-[#D1D5DB] bg-white'}`}
                  >
                    <Book className={`w-8 h-8 ${importCategory === 'book' ? 'text-[#3D5A80]' : 'text-[#9CA3AF]'}`} />
                    <span className={`font-bold ${importCategory === 'book' ? 'text-[#3D5A80]' : 'text-[#6B7280]'}`}>Book</span>
                  </button>
                  <button 
                    onClick={() => setImportCategory('article')}
                    className={`flex-1 flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all ${importCategory === 'article' ? 'border-[#E07A5F] bg-[#E07A5F]/5' : 'border-[#E5E5E5] hover:border-[#D1D5DB] bg-white'}`}
                  >
                    <FileText className={`w-8 h-8 ${importCategory === 'article' ? 'text-[#E07A5F]' : 'text-[#9CA3AF]'}`} />
                    <span className={`font-bold ${importCategory === 'article' ? 'text-[#E07A5F]' : 'text-[#6B7280]'}`}>Article</span>
                  </button>
                </div>
              </div>

              {/* If Article, show Method Toggle */}
              {importCategory === 'article' && (
                <div className="flex gap-2 bg-[#F3F4F6] p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setImportMethod('file')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${importMethod === 'file' ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'}`}
                  >
                    <Upload className="w-4 h-4" /> Upload Document (.pdf / .epub)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMethod('text')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${importMethod === 'text' ? 'bg-white text-[#E07A5F] shadow-sm' : 'text-[#6B7280] hover:text-[#111827]'}`}
                  >
                    <FileText className="w-4 h-4" /> Paste Text (复制粘贴)
                  </button>
                </div>
              )}

              {/* Method 1: File Upload */}
              {importMethod === 'file' ? (
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
              ) : (
                /* Method 2: Paste Text */
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold tracking-widest uppercase text-[#6B7280] mb-2">Article Title (文章标题)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. The Economist: The Future of AI (或留空自动提取)" 
                      value={pastedTitle}
                      onChange={(e) => setPastedTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#E07A5F] focus:border-transparent text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold tracking-widest uppercase text-[#6B7280] mb-2">Article Content (文章正文)</label>
                    <textarea 
                      rows={8}
                      placeholder="Paste your English text or article here (直接粘贴文章正文)..."
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#E07A5F] focus:border-transparent text-sm leading-relaxed bg-white"
                    />
                  </div>
                  <button
                    disabled={!pastedText.trim() || isExtracting}
                    onClick={handlePasteSave}
                    className="w-full py-3.5 bg-[#E07A5F] hover:bg-[#D0694E] disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving to Cloud...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Save Article & Start Reading
                      </>
                    )}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
