'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BookOpen, BookA, TextQuote, Target, Settings, Search, Clock, Plus, 
  ChevronRight, Bookmark, X, Upload, Loader2, Flame, CheckCircle2, 
  FileText, Book, Pencil, Sparkles, ArrowUpRight, Library, Layers, Highlighter
} from 'lucide-react';
import Link from 'next/link';
import { useAuth, SignInButton, Show, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import localforage from 'localforage';
import { mergeStats, calculateStreak } from '@/lib/readingTracker';

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
  const [libStats, setLibStats] = useState({ words: 0, phrases: 0, sentences: 0, notes: 0, dueWords: 0, duePhrases: 0 });
  const [readingStats, setReadingStats] = useState({ todayMins: 0, streak: 0, activeDays: [] as number[], history: {} as Record<string, number> });
  const [displayDays, setDisplayDays] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [library, setLibrary] = useState<BookMetadata[]>([]);
  const [editingDoc, setEditingDoc] = useState<{ id: string; title: string; type: 'book' | 'article' } | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setLibStats({ words: 0, phrases: 0, sentences: 0, notes: 0, dueWords: 0, duePhrases: 0 });
      setLibrary([]);
      setReadingStats({ todayMins: 0, streak: 0, activeDays: [], history: {} });
      const now = new Date();
      now.setHours(0,0,0,0);
      const days = [];
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 29);
      for (let i = 0; i < 30; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        days.push(d.toDateString());
      }
      setDisplayDays(days);
      return;
    }

    loadLibrary();
    
    // Fetch D1 stats with token
    (async () => {
      try {
        let token: string | null = null;
        try { token = await getToken(); } catch (e) {}
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const [wRes, pRes, sRes, nRes] = await Promise.all([
          fetch('/api/library-items?type=word&t=' + Date.now(), { headers }).then(r => r.json()).catch(() => ({ items: [] })),
          fetch('/api/library-items?type=phrase&t=' + Date.now(), { headers }).then(r => r.json()).catch(() => ({ items: [] })),
          fetch('/api/sentences?t=' + Date.now(), { headers }).then(r => r.json()).catch(() => ({ sentences: [] })),
          fetch('/api/notes?t=' + Date.now(), { headers }).then(r => r.json()).catch(() => ({ notes: [] }))
        ]);

        const words = wRes.items || [];
        const phrases = pRes.items || [];
        const sentences = sRes.sentences || [];
        const notes = nRes.notes || [];
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        const endOfTodayMs = endOfToday.getTime();

        setLibStats({
          words: words.length,
          phrases: phrases.length,
          sentences: sentences.length,
          notes: notes.length,
          dueWords: words.filter((w: any) => (w.repetition || 0) > 0 && (w.next_review_at || 0) <= endOfTodayMs).length,
          duePhrases: phrases.filter((p: any) => (p.repetitions || 0) > 0 && (p.next_review_at || 0) <= endOfTodayMs).length
        });
      } catch (err) {
        console.warn("Failed to load lib stats:", err);
      }
    })();

    // Fetch localforage and cloud stats
    (async () => {
      let stats = await localforage.getItem<any>('quiet_reading_stats');
      
      if (isSignedIn) {
        try {
          const res = await fetch('/api/reading-stats?t=' + Date.now());
          const data = await res.json();
          if (data && data.stats) {
            stats = mergeStats(stats, data.stats);
            await localforage.setItem('quiet_reading_stats', stats);
          } else if (stats) {
            fetch('/api/reading-stats', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ stats })
            }).catch(() => {});
          }
        } catch (e) {
          console.warn("Failed to sync cloud reading stats:", e);
        }
      }

      let days = [];
      const now = new Date();
      now.setHours(0,0,0,0);
      let startDate = new Date(now);

      if (stats) {
        const todayStr = new Date().toDateString();
        const streak = calculateStreak(stats);
        setReadingStats({
          todayMins: stats[todayStr] || 0,
          streak: streak,
          activeDays: stats.activeDays || [new Date().getDay()],
          history: stats
        });

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
    })();

  }, [isLoaded, isSignedIn]);

  const loadLibrary = async () => {
    if (!isSignedIn) {
      setLibrary([]);
      return;
    }
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
          author: d.author || '',
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
        author: b.author || ''
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
                author: localDoc.author || '',
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
                  author: localDoc.author || '',
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

      const mergedList = Array.from(map.values()).sort((a, b) => b.lastReadAt - a.lastReadAt);
      setLibrary(mergedList);
      localforage.setItem('quiet_library', mergedList).catch(() => {});
    } catch (e) {
      console.error("Failed to load library:", e);
    }
  };

  const processFile = async (file: File) => {
    if (!file) return;
    const isEpub = file.name.toLowerCase().endsWith('.epub');
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    if (!isEpub && !isPdf) {
      alert("Please upload an EPUB or PDF document.");
      return;
    }

    setIsExtracting(true);
    const id = Date.now().toString();
    const type = isEpub ? 'epub' : 'pdf';
    const category = importCategory;
    const cleanTitle = file.name.replace(/\.[^/.]+$/, "");

    try {
      await localforage.setItem(`quiet_book_${id}`, file);

      let fileKey = '';
      try {
        let token: string | null = null;
        try { token = await getToken(); } catch (e) {}

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const urlRes = await fetch('/api/documents/upload-url', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            filename: file.name,
            fileType: file.type || (isEpub ? 'application/epub+zip' : 'application/pdf')
          })
        });

        if (urlRes.ok) {
          const { uploadUrl, fileKey: key } = await urlRes.json();
          fileKey = key;
          await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': file.type || (isEpub ? 'application/epub+zip' : 'application/pdf') },
            body: file
          });
        }
      } catch (uploadErr) {
        console.warn("Cloud R2 upload skipped or failed, working with local cache:", uploadErr);
      }

      try {
        let token: string | null = null;
        try { token = await getToken(); } catch (e) {}
        const postHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) postHeaders['Authorization'] = `Bearer ${token}`;

        await fetch('/api/documents', {
          method: 'POST',
          headers: postHeaders,
          body: JSON.stringify({
            id,
            type: category,
            title: cleanTitle,
            author: '',
            fileName: file.name,
            fileKey,
            percentage: 0
          })
        });
      } catch (d1Err) {
        console.warn("Cloud D1 metadata save failed:", d1Err);
      }

      const newBook: BookMetadata = {
        id,
        title: cleanTitle,
        type,
        category,
        lastReadAt: Date.now(),
        progress: 0,
        currentLocation: isEpub ? 0 : 1,
        totalSize: file.size
      };

      const currentLib = await localforage.getItem<BookMetadata[]>('quiet_library') || [];
      currentLib.unshift(newBook);
      await localforage.setItem('quiet_library', currentLib);

      setShowImportModal(false);
      router.push(`/reader?id=${id}`);
    } catch (e) {
      console.error("Failed to process file:", e);
      alert("Failed to process file, please try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handlePasteSave = async () => {
    if (!pastedText.trim()) return;
    setIsExtracting(true);
    try {
      const title = pastedTitle.trim() || pastedText.trim().split('\n')[0].slice(0, 50) || 'Pasted Article';
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
            author: '',
            source: 'ARTICLE',
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
        }
      } catch (cloudErr) {
        console.warn("Cloud save failed, falling back to local:", cloudErr);
      }

      const newDoc: BookMetadata = {
        id: docId,
        title: title,
        author: '',
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

  const handleSaveTitle = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingDoc || !newTitle.trim() || isSavingTitle) return;
    setIsSavingTitle(true);
    const trimmedTitle = newTitle.trim();

    try {
      let token: string | null = null;
      try { token = await getToken(); } catch (e) {}
      const patchHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) patchHeaders['Authorization'] = `Bearer ${token}`;

      await fetch(`/api/documents/${editingDoc.id}`, {
        method: 'PATCH',
        headers: patchHeaders,
        body: JSON.stringify({ title: trimmedTitle }),
      });

      const currentLib = await localforage.getItem<BookMetadata[]>('quiet_library') || [];
      const updatedLib = currentLib.map(item => 
        item.id === editingDoc.id ? { ...item, title: trimmedTitle } : item
      );
      await localforage.setItem('quiet_library', updatedLib);
      setLibrary(updatedLib);

      setEditingDoc(null);
    } catch (err) {
      console.error('Failed to update title:', err);
      alert('Failed to save title. Please try again.');
    } finally {
      setIsSavingTitle(false);
    }
  };

  const books = library.filter(b => b.category === 'book');
  const articles = library.filter(b => b.category === 'article');
  
  const mostRecentBook = books[0];
  const mostRecentArticle = articles[0];

  const totalDue = libStats.dueWords + libStats.duePhrases;

  return (
    <div className="min-h-screen bg-[#F6F4EE] text-[#1C1C1C] font-sans selection:bg-[#E2E8F0]">
      {/* Refined Navigation Bar */}
      <nav className="border-b border-[#E7E2D6] bg-[#FAF8F5]/90 backdrop-blur-md sticky top-0 z-40 transition-all">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1E293B] rounded-xl flex items-center justify-center text-white shadow-xs">
              <BookOpen className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="font-serif font-bold text-lg tracking-tight text-[#111827] block leading-tight">
                Quiet Reading Tracker
              </span>
              <span className="text-[10px] uppercase font-bold tracking-[0.15em] text-[#8C7A6B]">
                Personal Study Sanctuary
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowImportModal(true)} 
              className="flex items-center gap-2 bg-[#1E293B] hover:bg-[#334155] text-white px-4 py-2 rounded-xl text-xs md:text-sm font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Import</span>
            </button>
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="text-xs md:text-sm font-semibold text-[#111827] hover:text-[#3D5A80] transition-colors px-2 py-1 cursor-pointer">
                  Sign In
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <div className="ml-1">
                <UserButton />
              </div>
            </Show>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-16">
        {/* 1. Hero & Morning Dispatch (Magazine Masthead Layout) */}
        <header className="border-b border-[#E7E2D6] pb-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-2xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#8C7A6B] bg-[#EFECE6] px-2.5 py-0.5 rounded uppercase">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="text-xs text-[#8C7A6B] font-serif">· Reading Dispatch</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-serif text-[#111827] leading-[1.15]">
                Welcome Back to Your Desk
              </h1>
              <p className="text-[#6B7280] text-base md:text-lg font-serif italic border-l-2 border-[#D7CCC8] pl-3 py-0.5">
                &ldquo;For us, there is only the trying. The rest is not our business.&rdquo; 
                <span className="text-xs not-italic text-[#8C7A6B] ml-2 font-mono">— T.S. Eliot</span>
              </p>
            </div>

            {/* Seamless Daily Reading Goal & Streak Widget (Unboxed open layout) */}
            <div className="flex items-center gap-6 py-1 self-start lg:self-auto">
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-[#E7E2D6]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                  <path className="text-[#3D5A80]" strokeDasharray={`${Math.min((readingStats.todayMins / 60) * 100, 100)}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <div className="absolute flex items-center justify-center">
                  <Target className="w-5 h-5 text-[#3D5A80]" />
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#8C7A6B] block">
                  Today&apos;s Reading
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-serif font-bold text-[#111827]">{readingStats.todayMins}</span>
                  <span className="text-xs text-[#8C7A6B] font-mono">/ 60 mins</span>
                </div>
              </div>
              <div className="h-10 w-[1px] bg-[#E7E2D6] mx-1" />
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#FFF1EB] flex items-center justify-center text-[#C2410C]">
                  <Flame className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#8C7A6B] block">Streak</span>
                  <span className="text-base font-bold text-[#111827]">{readingStats.streak} Days</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 2. Pick Up Where You Left Off (Physical Reading Showcase) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#8C7A6B] uppercase">
                Active Desk
              </span>
              <h2 className="text-2xl font-serif font-bold text-[#111827]">
                Pick Up Where You Left Off
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 pt-2">
            {/* Active Book Showcase (Realistic Miniature Hardcover on Open Desk) */}
            {mostRecentBook ? (
              <div className="group relative flex items-start gap-6 py-2">
                {/* Miniature 3D Hardcover Book */}
                <Link 
                  href={`/reader?id=${mostRecentBook.id}`}
                  className="shrink-0 block group-hover:-translate-y-1 transition-transform duration-300"
                >
                  <div className="w-24 md:w-28 aspect-[1/1.45] rounded-r-md rounded-l-xs bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#090D16] border border-[#334155] p-3 flex flex-col justify-between relative shadow-[4px_12px_20px_rgba(0,0,0,0.3)] select-none">
                    {/* Spine crease shadow */}
                    <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-r from-black/50 to-transparent pointer-events-none rounded-l-xs" />
                    <div className="absolute left-2 top-0 bottom-0 w-[1px] bg-white/15 pointer-events-none" />
                    {/* Paper edge right */}
                    <div className="absolute -right-1 top-1 bottom-1 w-1 bg-[#D7CCC8] rounded-r-xs" />
                    
                    {/* Subtle foil line */}
                    <div className="w-6 h-[1px] bg-amber-400/40 mx-auto mt-1" />
                    
                    {/* Book title */}
                    <div className="my-auto text-center px-0.5">
                      <span className="font-serif font-bold text-[10px] md:text-xs text-slate-100 line-clamp-3 leading-tight">
                        {mostRecentBook.title}
                      </span>
                    </div>

                    {/* Footer ribbon */}
                    <div className="border-t border-white/10 pt-1 text-center">
                      <span className="text-[8px] font-mono text-slate-400 font-bold">
                        {mostRecentBook.progress}%
                      </span>
                    </div>
                    {/* Ribbon */}
                    <div className="absolute -top-1 right-2 w-2 h-4 bg-sky-500 shadow-xs rounded-b-xs" />
                  </div>
                </Link>

                {/* Open Typography & Meta */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#3D5A80] bg-[#3D5A80]/10 px-2 py-0.5 rounded">
                        Book in Progress
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDoc({ id: mostRecentBook.id, title: mostRecentBook.title, type: 'book' });
                          setNewTitle(mostRecentBook.title);
                        }}
                        className="p-1.5 text-[#9CA3AF] hover:text-[#3D5A80] hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
                        title="Edit Title"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <Link 
                      href={`/reader?id=${mostRecentBook.id}`} 
                      className="font-serif font-bold text-lg md:text-xl text-[#111827] line-clamp-2 leading-snug hover:text-[#3D5A80] transition-colors block"
                    >
                      {mostRecentBook.title}
                    </Link>
                    {mostRecentBook.author && (
                      <p className="text-xs text-[#6B7280] font-serif italic mt-1 line-clamp-1">
                        {mostRecentBook.author}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#EAE5DA]">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-mono text-[#8C7A6B] text-[11px]">Reading Progress</span>
                      <span className="font-mono font-bold text-[#111827]">{mostRecentBook.progress}%</span>
                    </div>
                    <div className="w-full bg-[#E5E5E5] rounded-full h-1.5 overflow-hidden mb-3">
                      <div 
                        className="bg-[#3D5A80] h-full rounded-full transition-all" 
                        style={{ width: `${Math.min(100, mostRecentBook.progress)}%` }} 
                      />
                    </div>
                    <Link 
                      href={`/reader?id=${mostRecentBook.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#3D5A80] hover:text-[#283E58] transition-colors"
                    >
                      <span>Resume Book</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-[#D7CCC8] rounded-2xl p-8 flex flex-col items-center justify-center text-center text-[#8C7A6B] bg-[#FAF8F5]/40">
                <Book className="w-8 h-8 mb-2 opacity-30 text-[#3D5A80]" />
                <h3 className="font-serif font-bold text-base text-[#111827] mb-1">No Books in Progress</h3>
                <p className="text-xs text-[#8C7A6B] mb-4">Import an EPUB or PDF book to display here.</p>
                <button
                  onClick={() => { setImportCategory('book'); setShowImportModal(true); }}
                  className="px-4 py-2 bg-[#1E293B] text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Import Book
                </button>
              </div>
            )}

            {/* Active Article Showcase (Folded Editorial Issue on Open Desk) */}
            {mostRecentArticle ? (
              <div className="group relative flex items-start gap-6 py-2 lg:border-l lg:border-[#E7E2D6] lg:pl-10">
                {/* Miniature Editorial Issue Cover */}
                <Link 
                  href={`/reader?id=${mostRecentArticle.id}`}
                  className="shrink-0 block group-hover:-translate-y-1 transition-transform duration-300"
                >
                  <div className="w-24 md:w-28 aspect-[1/1.45] rounded-md bg-[#FFFDF9] border border-[#E7DFD5] p-3 flex flex-col justify-between relative shadow-[4px_12px_20px_rgba(0,0,0,0.12)] select-none">
                    {/* Spine & staple stitch accent */}
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/5 to-transparent pointer-events-none" />
                    <div className="absolute left-1 top-4 w-0.5 h-2 bg-[#94A3B8] rounded-xs" />
                    <div className="absolute left-1 bottom-4 w-0.5 h-2 bg-[#94A3B8] rounded-xs" />

                    {/* Subtle accent header line */}
                    <div className="w-6 h-[1.5px] bg-[#C2410C]/40 mx-auto mt-1 rounded-full" />

                    <div className="my-auto text-center px-0.5">
                      <span className="font-serif font-bold text-[10px] md:text-xs text-[#1E293B] line-clamp-3 leading-tight">
                        {mostRecentArticle.title}
                      </span>
                    </div>

                    <div className="border-t border-[#E7E2D6] pt-1 text-center">
                      <span className="text-[7.5px] font-mono text-[#8C7A6B] font-bold">
                        {mostRecentArticle.progress}%
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Open Typography & Meta */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#C2410C] bg-[#FFF1EB] px-2 py-0.5 rounded">
                        Article in Progress
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDoc({ id: mostRecentArticle.id, title: mostRecentArticle.title, type: 'article' });
                          setNewTitle(mostRecentArticle.title);
                        }}
                        className="p-1.5 text-[#9CA3AF] hover:text-[#C2410C] hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
                        title="Edit Title"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <Link 
                      href={`/reader?id=${mostRecentArticle.id}`} 
                      className="font-serif font-bold text-lg md:text-xl text-[#111827] line-clamp-2 leading-snug hover:text-[#C2410C] transition-colors block"
                    >
                      {mostRecentArticle.title}
                    </Link>
                    {mostRecentArticle.author && (
                      <p className="text-xs text-[#6B7280] font-serif italic mt-1 line-clamp-1">
                        {mostRecentArticle.author}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#EAE5DA]">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-mono text-[#8C7A6B] text-[11px]">Reading Progress</span>
                      <span className="font-mono font-bold text-[#111827]">{mostRecentArticle.progress}%</span>
                    </div>
                    <div className="w-full bg-[#E5E5E5] rounded-full h-1.5 overflow-hidden mb-3">
                      <div 
                        className="bg-[#C2410C] h-full rounded-full transition-all" 
                        style={{ width: `${Math.min(100, mostRecentArticle.progress)}%` }} 
                      />
                    </div>
                    <Link 
                      href={`/reader?id=${mostRecentArticle.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C2410C] hover:text-[#9A3412] transition-colors"
                    >
                      <span>Resume Article</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-[#D7CCC8] rounded-2xl p-8 flex flex-col items-center justify-center text-center text-[#8C7A6B] bg-[#FAF8F5]/40 lg:border-l lg:border-[#E7E2D6] lg:pl-10">
                <FileText className="w-8 h-8 mb-2 opacity-30 text-[#C2410C]" />
                <h3 className="font-serif font-bold text-base text-[#111827] mb-1">No Articles in Progress</h3>
                <p className="text-xs text-[#8C7A6B] mb-4">Paste text or upload a document to read here.</p>
                <button
                  onClick={() => { setImportCategory('article'); setShowImportModal(true); }}
                  className="px-4 py-2 bg-[#C2410C] text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Add Article
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 3. The Library Portals & Study Ledger (Split Section) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-4">
          {/* Left Column: Living Shelves Showcases (2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#8C7A6B] uppercase">
                Shelves & Archives
              </span>
              <h2 className="text-2xl font-serif font-bold text-[#111827]">
                Your Shelves
              </h2>
            </div>

            {/* Architectural Library Shelves (Open, continuous solid wood ledge across both bays) */}
            <div className="pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                {/* Book Shelf Bay */}
                <Link 
                  href="/library/books" 
                  className="group flex flex-col justify-between hover:-translate-y-1 transition-transform"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#3D5A80] bg-[#3D5A80]/10 px-2.5 py-0.5 rounded">
                        Personal Library
                      </span>
                      <span className="text-xs font-mono font-bold text-[#111827]">
                        {books.length} Volumes
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-2xl text-[#111827] group-hover:text-[#3D5A80] transition-colors">
                      Book Shelf
                    </h3>
                  </div>

                  {/* 3 Hardcover Spines standing directly on shelf ledge */}
                  <div className="mt-8 relative">
                    <div className="flex items-end justify-center gap-2 mb-[-2px] px-4">
                      {/* Spine 1 */}
                      <div className="w-10 h-22 rounded-t-xs bg-gradient-to-r from-[#1E293B] to-[#0F172A] border border-[#334155] shadow-md flex flex-col justify-around py-3 px-1 items-center">
                        <div className="w-full h-[1px] bg-amber-400/30" />
                        <div className="w-full h-[1px] bg-amber-400/30" />
                        <div className="w-full h-[1px] bg-amber-400/30" />
                      </div>
                      {/* Spine 2 */}
                      <div className="w-12 h-26 rounded-t-xs bg-gradient-to-r from-[#7F1D1D] to-[#5C1414] border border-[#991B1B] shadow-md flex flex-col justify-around py-3 px-1 items-center">
                        <div className="w-full h-[1px] bg-amber-400/30" />
                        <div className="w-full h-[1px] bg-amber-400/30" />
                        <div className="w-full h-[1px] bg-amber-400/30" />
                      </div>
                      {/* Spine 3 */}
                      <div className="w-11 h-24 rounded-t-xs bg-gradient-to-r from-[#14532D] to-[#0F3D21] border border-[#166534] shadow-md flex flex-col justify-around py-3 px-1 items-center">
                        <div className="w-full h-[1px] bg-amber-400/30" />
                        <div className="w-full h-[1px] bg-amber-400/30" />
                        <div className="w-full h-[1px] bg-amber-400/30" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 flex items-center justify-between text-xs font-semibold text-[#3D5A80]">
                    <span>Explore Book Shelf</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                {/* Article Shelf Bay */}
                <Link 
                  href="/library/articles" 
                  className="group flex flex-col justify-between hover:-translate-y-1 transition-transform md:border-l md:border-[#E7E2D6] md:pl-10"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#C2410C] bg-[#FFF1EB] px-2.5 py-0.5 rounded">
                        Article Collection
                      </span>
                      <span className="text-xs font-mono font-bold text-[#111827]">
                        {articles.length} Articles
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-2xl text-[#111827] group-hover:text-[#C2410C] transition-colors">
                      Article Shelf
                    </h3>
                  </div>

                  {/* Magazine Display Rack with 2 Overlapping Issues */}
                  <div className="mt-8 relative">
                    <div className="flex items-end justify-center mb-[-2px] px-4">
                      {/* Issue 1 */}
                      <div className="w-18 h-22 rounded-md bg-[#FFFDF9] border border-[#E7DFD5] p-2 shadow-md -rotate-6 translate-x-2 flex flex-col justify-between">
                        <div className="w-6 h-1 bg-[#C2410C]/40 rounded-xs" />
                        <div className="space-y-1">
                          <div className="w-full h-1 bg-[#E2E8F0] rounded-xs" />
                          <div className="w-3/4 h-1 bg-[#E2E8F0] rounded-xs" />
                        </div>
                      </div>
                      {/* Issue 2 */}
                      <div className="w-20 h-26 rounded-md bg-[#F8F9FA] border border-[#DCE2EA] p-2.5 shadow-lg z-10 -translate-x-1 flex flex-col justify-between">
                        <div className="w-7 h-1 bg-[#3D5A80]/50 rounded-xs" />
                        <div className="space-y-1">
                          <div className="w-full h-1.5 bg-[#CBD5E1] rounded-xs" />
                          <div className="w-5/6 h-1 bg-[#E2E8F0] rounded-xs" />
                          <div className="w-2/3 h-1 bg-[#E2E8F0] rounded-xs" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 flex items-center justify-between text-xs font-semibold text-[#C2410C]">
                    <span>Explore Article Shelf</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </div>

              {/* Continuous Architectural Solid Wood Shelf Ledge running across both bays */}
              <div className="mt-[-2px] w-full">
                <div className="h-2.5 w-full bg-gradient-to-r from-[#D7CCC8] via-[#EFEBE9] to-[#D7CCC8] border-t border-[#DFD3C3] rounded-t-xs" />
                <div className="h-4 w-full bg-gradient-to-b from-[#8D6E63] to-[#5D4037] shadow-md rounded-b-xs" />
              </div>
            </div>
          </div>

          {/* Right Column: Knowledge Study Ledger (Ruled Notebook Index) */}
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#8C7A6B] uppercase">
                Field Notes
              </span>
              <h2 className="text-2xl font-serif font-bold text-[#111827]">
                Study Ledger
              </h2>
            </div>

            {/* Ruled Notebook Ledger Catalog (Unboxed classic index layout) */}
            <div className="pt-2">
              <div className="border-b border-[#E7E2D6] pb-3 mb-1 flex items-center justify-between">
                <span className="text-xs font-serif italic text-[#8C7A6B]">
                  Spaced Repetition & Reading Memory
                </span>
                <span className="text-[10px] font-mono text-[#8C7A6B] uppercase tracking-wider">
                  Index
                </span>
              </div>

              {/* Ruled Index Entries with hairline divide-y */}
              <div className="divide-y divide-[#EAE5DA] border-b border-[#EAE5DA]">
                {/* Row 1: Vocabulary */}
                <Link 
                  href="/review/words"
                  className="flex items-center justify-between py-4 px-2 hover:bg-[#FAF8F5] rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[#3D5A80]/10 text-[#3D5A80] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <BookA className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="block font-serif font-bold text-sm text-[#111827] group-hover:text-[#3D5A80] transition-colors">
                        Vocabulary
                      </span>
                      <span className="text-[11px] font-mono text-[#8C7A6B]">{libStats.words} collected</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md ${
                    libStats.dueWords > 0 ? 'bg-[#C2410C] text-white shadow-2xs' : 'bg-[#EFECE6] text-[#8C7A6B]'
                  }`}>
                    {libStats.dueWords} Due
                  </span>
                </Link>

                {/* Row 2: Expressions */}
                <Link 
                  href="/review/phrases"
                  className="flex items-center justify-between py-4 px-2 hover:bg-[#FAF8F5] rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[#FFF1EB] text-[#C2410C] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <TextQuote className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="block font-serif font-bold text-sm text-[#111827] group-hover:text-[#C2410C] transition-colors">
                        Expressions
                      </span>
                      <span className="text-[11px] font-mono text-[#8C7A6B]">{libStats.phrases} collocations</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md ${
                    libStats.duePhrases > 0 ? 'bg-[#C2410C] text-white shadow-2xs' : 'bg-[#EFECE6] text-[#8C7A6B]'
                  }`}>
                    {libStats.duePhrases} Due
                  </span>
                </Link>

                {/* Row 3: Sentences */}
                <Link 
                  href="/sentences"
                  className="flex items-center justify-between py-4 px-2 hover:bg-[#FAF8F5] rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Bookmark className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="block font-serif font-bold text-sm text-[#111827] group-hover:text-[#15803D] transition-colors">
                        Sentences
                      </span>
                      <span className="text-[11px] font-mono text-[#8C7A6B]">{libStats.sentences} exemplary</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:translate-x-1 transition-transform" />
                </Link>

                {/* Row 4: Reading Notes */}
                <Link 
                  href="/notes"
                  className="flex items-center justify-between py-4 px-2 hover:bg-[#FAF8F5] rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Highlighter className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="block font-serif font-bold text-sm text-[#111827] group-hover:text-[#D97706] transition-colors">
                        Reading Notes
                      </span>
                      <span className="text-[11px] font-mono text-[#8C7A6B]">{libStats.notes} reflections</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 4. 30-Day Reading Rhythm (Habit Matrix at Bottom) */}
        <section className="pt-10 border-t border-[#EAE5DA]">
          <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-14">
            {/* Left Narrative & Stats Block (No empty void) */}
            <div className="space-y-3 max-w-sm shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#8C7A6B] uppercase">
                  Habit Matrix
                </span>
                {(() => {
                  const days = displayDays.length > 0 ? displayDays : [];
                  const activeCount = days.filter(d => readingStats.history && readingStats.history[d] > 0).length;
                  return (
                    <span className="text-[11px] font-mono font-bold text-[#8C7A6B] bg-[#EFECE6] px-2.5 py-0.5 rounded">
                      {activeCount} / 30 Days Active
                    </span>
                  );
                })()}
              </div>
              <h3 className="font-serif font-bold text-2xl text-[#111827]">
                30-Day Reading Rhythm
              </h3>
              <p className="text-sm font-serif italic text-[#6B7280] leading-relaxed">
                Consistency over intensity. Reading each day unfolds a colorful mosaic of your intellectual journey.
              </p>
            </div>

            {/* Architectural Vertical Hairline Divider */}
            <div className="hidden lg:block w-[1px] h-28 bg-[#E7E2D6] shrink-0" />

            {/* 3 Rows of 10 Rainbow Circles (Directly adjacent, tight and balanced) */}
            {(() => {
              // Curated harmonious rainbow palette with 10 distinctive jewel tones across the spectrum
              const rainbowPalette = [
                '#E11D48', // Day 1, 11, 21: Rose Crimson
                '#EA580C', // Day 2, 12, 22: Sunset Orange
                '#D97706', // Day 3, 13, 23: Golden Amber
                '#16A34A', // Day 4, 14, 24: Leaf Green
                '#0D9488', // Day 5, 15, 25: Teal Jade
                '#0284C7', // Day 6, 16, 26: Deep Azure
                '#2563EB', // Day 7, 17, 27: Royal Sapphire
                '#4F46E5', // Day 8, 18, 28: Twilight Indigo
                '#7C3AED', // Day 9, 19, 29: Rich Violet
                '#C026D3', // Day 10, 20, 30: Radiant Magenta
              ];
              const days = displayDays.length === 30 ? displayDays : Array.from({ length: 30 }).map((_, i) => 'placeholder-' + i);
              return (
                <div className="grid grid-cols-10 gap-2.5 sm:gap-3 shrink-0">
                  {days.map((dateStr, i) => {
                    const isPlaceholder = dateStr.startsWith('placeholder-');
                    const mins = (!isPlaceholder && readingStats.history && readingStats.history[dateStr]) || 0;
                    const isRead = mins > 0;
                    const isToday = !isPlaceholder && dateStr === new Date().toDateString();
                    const color = rainbowPalette[i % rainbowPalette.length];
                    return (
                      <div 
                        key={dateStr}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-default select-none ${
                          isToday ? 'ring-2 ring-[#111827] ring-offset-2' : ''
                        }`}
                        style={{
                          backgroundColor: isRead ? color : '#FAF8F5',
                          border: isRead ? `1px solid ${color}` : '1px solid #D7CCC8',
                          color: isRead ? '#FFFFFF' : '#8C7A6B',
                          boxShadow: isRead ? `0 2px 8px ${color}45` : 'none'
                        }}
                        title={!isPlaceholder ? `${dateStr}: ${mins > 0 ? `${mins} mins read` : 'No reading recorded'}` : `Day ${i + 1}`}
                      >
                        <span className="text-[11px] font-mono font-bold leading-none">
                          {i + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </section>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FAF9F6] border border-[#E5E5E5] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-[#E5E5E5] shrink-0">
              <h3 className="font-serif text-xl font-bold text-[#111827]">Add to Library</h3>
              <button onClick={() => setShowImportModal(false)} className="text-[#6B7280] hover:text-[#111827] p-2 rounded-full hover:bg-black/5 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 flex-1 overflow-y-auto flex flex-col gap-6">
              
              {/* Category Selector */}
              <div>
                <h4 className="text-xs font-mono font-bold tracking-widest uppercase text-[#8C7A6B] mb-3">Target Shelf</h4>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => { setImportCategory('book'); setImportMethod('file'); }}
                    className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                      importCategory === 'book' ? 'border-[#3D5A80] bg-[#3D5A80]/5' : 'border-[#E5E5E5] hover:border-[#D1D5DB] bg-white'
                    }`}
                  >
                    <Book className={`w-7 h-7 ${importCategory === 'book' ? 'text-[#3D5A80]' : 'text-[#9CA3AF]'}`} />
                    <span className={`font-bold text-sm ${importCategory === 'book' ? 'text-[#3D5A80]' : 'text-[#6B7280]'}`}>Book Shelf</span>
                  </button>
                  <button 
                    onClick={() => setImportCategory('article')}
                    className={`flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                      importCategory === 'article' ? 'border-[#C2410C] bg-[#FFF1EB]' : 'border-[#E5E5E5] hover:border-[#D1D5DB] bg-white'
                    }`}
                  >
                    <FileText className={`w-7 h-7 ${importCategory === 'article' ? 'text-[#C2410C]' : 'text-[#9CA3AF]'}`} />
                    <span className={`font-bold text-sm ${importCategory === 'article' ? 'text-[#C2410C]' : 'text-[#6B7280]'}`}>Article Shelf</span>
                  </button>
                </div>
              </div>

              {/* If Article, Method Toggle */}
              {importCategory === 'article' && (
                <div className="flex gap-2 bg-[#EFECE6] p-1.5 rounded-xl border border-[#E2DDD3]">
                  <button
                    type="button"
                    onClick={() => setImportMethod('file')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      importMethod === 'file' ? 'bg-white text-[#111827] shadow-xs' : 'text-[#6B7280] hover:text-[#111827]'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload File (.pdf / .epub)
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMethod('text')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      importMethod === 'text' ? 'bg-white text-[#C2410C] shadow-xs' : 'text-[#6B7280] hover:text-[#111827]'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" /> Paste Article Text
                  </button>
                </div>
              )}

              {/* Method 1: File Upload */}
              {importMethod === 'file' ? (
                <div>
                  <h4 className="text-xs font-mono font-bold tracking-widest uppercase text-[#8C7A6B] mb-3">Upload Document</h4>
                  <div 
                    className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                      isDragging 
                        ? (importCategory === 'book' ? 'border-[#3D5A80] bg-[#3D5A80]/5' : 'border-[#C2410C] bg-[#FFF1EB]') 
                        : 'border-[#D7CCC8] hover:border-[#8C7A6B] bg-white'
                    }`}
                    onClick={() => fileInputRef.current?.click()} 
                    onDragOver={handleDragOver} 
                    onDragLeave={handleDragLeave} 
                    onDrop={handleDrop}
                  >
                    <input type="file" accept=".epub,.pdf" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-10 h-10 text-[#6B7280] animate-spin mb-3" />
                        <p className="font-serif font-bold text-[#111827]">Processing Document...</p>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-[#F6F4EE] rounded-2xl flex items-center justify-center mb-3 text-[#8C7A6B]">
                          <Upload className="w-6 h-6" />
                        </div>
                        <p className="font-serif font-bold text-[#111827] mb-1">Click to Upload or Drag & Drop</p>
                        <p className="text-xs text-[#8C7A6B]">Supports .epub and .pdf formats</p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                /* Method 2: Paste Text */
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                      Article Title
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. The Economist: Deep Work in the Modern Age..." 
                      value={pastedTitle}
                      onChange={(e) => setPastedTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#C2410C] text-sm bg-white font-serif"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                      Article Text
                    </label>
                    <textarea 
                      rows={8}
                      placeholder="Paste your English text or article here..." 
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] focus:outline-none focus:ring-2 focus:ring-[#C2410C] text-sm leading-relaxed bg-white font-serif resize-none"
                    />
                  </div>
                  <button
                    disabled={!pastedText.trim() || isExtracting}
                    onClick={handlePasteSave}
                    className="w-full py-3.5 bg-[#C2410C] hover:bg-[#9A3412] disabled:opacity-50 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving to Shelf...
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

      {/* Edit Title Modal */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-[#FAF9F6] border border-[#E5E5E5] rounded-3xl max-w-md w-full p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-bold text-lg text-[#111827]">
                {editingDoc.type === 'book' ? 'Edit Book Title' : 'Edit Article Title'}
              </h3>
              <button 
                onClick={() => setEditingDoc(null)} 
                className="text-[#9CA3AF] hover:text-[#111827] p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTitle}>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                {editingDoc.type === 'book' ? 'Book Title' : 'Article Title'}
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#3D5A80] focus:border-transparent mb-6 transition-all font-serif"
                placeholder="Enter new title..."
              />

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#111827] rounded-xl hover:bg-black/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTitle || !newTitle.trim()}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#111827] hover:bg-[#3D5A80] rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSavingTitle && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
