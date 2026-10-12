'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ArrowLeft, BookOpen, Loader2, Pencil, X, Trash2, Search, Plus, 
  CheckCircle2, Bookmark, Sparkles, BookMarked
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import localforage from 'localforage';
import { useAuth } from '@clerk/nextjs';

interface BookItem {
  id: string;
  title: string;
  author?: string;
  progress: number;
  isCompleted: boolean;
  lastReadAt: number;
  type?: 'pdf' | 'epub' | 'text';
  fileKey?: string;
}

const BOOK_THEMES = [
  {
    bg: 'from-[#1E293B] via-[#0F172A] to-[#090D16]', // Oxford Midnight Navy
    border: 'border-[#334155]/70',
    titleColor: 'text-[#F8FAFC]',
    subColor: 'text-[#94A3B8]',
    accentColor: '#38BDF8',
    ribbon: 'bg-[#0284C7]',
    goldRule: 'bg-gradient-to-r from-transparent via-[#38BDF8]/60 to-transparent',
    spineShadow: 'from-black/50 via-black/20 to-transparent',
  },
  {
    bg: 'from-[#7F1D1D] via-[#5C1414] to-[#3B0D0D]', // Burgundy Leather
    border: 'border-[#991B1B]/70',
    titleColor: 'text-[#FEF2F2]',
    subColor: 'text-[#FCA5A5]',
    accentColor: '#F87171',
    ribbon: 'bg-[#DC2626]',
    goldRule: 'bg-gradient-to-r from-transparent via-[#FCA5A5]/60 to-transparent',
    spineShadow: 'from-black/55 via-black/25 to-transparent',
  },
  {
    bg: 'from-[#14532D] via-[#0F3D21] to-[#0A2615]', // British Forest Green
    border: 'border-[#166534]/70',
    titleColor: 'text-[#F0FDF4]',
    subColor: 'text-[#86EFAC]',
    accentColor: '#4ADE80',
    ribbon: 'bg-[#16A34A]',
    goldRule: 'bg-gradient-to-r from-transparent via-[#86EFAC]/60 to-transparent',
    spineShadow: 'from-black/55 via-black/25 to-transparent',
  },
  {
    bg: 'from-[#78350F] via-[#572608] to-[#381805]', // Vintage Amber Leather
    border: 'border-[#92400E]/70',
    titleColor: 'text-[#FFFBEB]',
    subColor: 'text-[#FDE68A]',
    accentColor: '#FBBF24',
    ribbon: 'bg-[#D97706]',
    goldRule: 'bg-gradient-to-r from-transparent via-[#FDE68A]/60 to-transparent',
    spineShadow: 'from-black/55 via-black/25 to-transparent',
  },
  {
    bg: 'from-[#312E81] via-[#231F63] to-[#171445]', // Royal Indigo Cloth
    border: 'border-[#3730A3]/70',
    titleColor: 'text-[#EEF2FF]',
    subColor: 'text-[#C7D2FE]',
    accentColor: '#818CF8',
    ribbon: 'bg-[#4F46E5]',
    goldRule: 'bg-gradient-to-r from-transparent via-[#C7D2FE]/60 to-transparent',
    spineShadow: 'from-black/50 via-black/20 to-transparent',
  },
  {
    bg: 'from-[#27272A] via-[#18181B] to-[#09090B]', // Charcoal Ebony Cloth
    border: 'border-[#3F3F46]/70',
    titleColor: 'text-[#FAFAFA]',
    subColor: 'text-[#A1A1AA]',
    accentColor: '#E4E4E7',
    ribbon: 'bg-[#52525B]',
    goldRule: 'bg-gradient-to-r from-transparent via-[#E4E4E7]/60 to-transparent',
    spineShadow: 'from-black/50 via-black/20 to-transparent',
  },
];

function getThemeForBook(id: string, title: string) {
  const sum = (id + title).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return BOOK_THEMES[sum % BOOK_THEMES.length];
}

export default function BookShelf() {
  const router = useRouter();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [books, setBooks] = useState<BookItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'reading' | 'completed'>('all');

  // Edit Modal State
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');
  const [editAuthorInput, setEditAuthorInput] = useState('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch books
  useEffect(() => {
    async function loadBooks() {
      try {
        let token: string | null = null;
        try { token = await getToken(); } catch (e) {}

        const fetchHeaders: Record<string, string> = {
          'Cache-Control': 'no-cache',
        };
        if (token) fetchHeaders['Authorization'] = `Bearer ${token}`;

        // 1. Fetch cloud documents
        const res = await fetch('/api/documents?type=book&t=' + Date.now(), { headers: fetchHeaders });
        const data = await res.json();
        let cloudBooks: BookItem[] = [];
        if (data.documents) {
          cloudBooks = data.documents.map((d: any) => ({
            id: d.id,
            title: d.title,
            author: d.author || '',
            progress: d.percentage || 0,
            isCompleted: (d.percentage || 0) >= 100,
            lastReadAt: d.last_read_at || 0,
            type: d.file_name?.endsWith('.epub') ? 'epub' : 'pdf',
            fileKey: d.file_key || '',
          }));
        }

        // 2. Fetch local books fallback
        const localLib = await localforage.getItem<any[]>('quiet_library') || [];
        const localBooks: BookItem[] = localLib
          .filter(b => b.category === 'book')
          .map(b => ({
            id: b.id,
            title: b.title,
            author: b.author || '',
            progress: b.progress || 0,
            isCompleted: b.isCompleted || false,
            lastReadAt: b.lastReadAt || 0,
            type: b.type || (b.title?.endsWith('.epub') ? 'epub' : 'pdf'),
          }));

        // Merge (prefer cloud book if ID matches)
        const map = new Map<string, BookItem>();
        localBooks.forEach(b => map.set(b.id, b));
        cloudBooks.forEach(b => map.set(b.id, b));

        const combined = Array.from(map.values()).sort((a, b) => b.lastReadAt - a.lastReadAt);
        setBooks(combined);

        // Keep local cache quiet_library in sync with cloud books
        if (localLib.length > 0 && cloudBooks.length > 0) {
          let hasDiff = false;
          cloudBooks.forEach(cb => {
            const item = localLib.find(b => b.id === cb.id);
            if (item && (item.isCompleted !== cb.isCompleted || item.progress !== cb.progress)) {
              item.isCompleted = cb.isCompleted;
              item.progress = cb.progress;
              hasDiff = true;
            }
          });
          if (hasDiff) {
            localforage.setItem('quiet_library', localLib).catch(() => {});
          }
        }
      } catch (err) {
        console.error("Error loading books:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadBooks();
  }, [isLoaded, isSignedIn]);

  // Rename title & author
  const handleSaveDetails = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingBook || !editTitleInput.trim() || isSavingDetails) return;
    setIsSavingDetails(true);
    const trimmedTitle = editTitleInput.trim();
    const trimmedAuthor = editAuthorInput.trim();

    try {
      let token: string | null = null;
      try { token = await getToken(); } catch (e) {}
      const patchHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) patchHeaders['Authorization'] = `Bearer ${token}`;

      await fetch(`/api/documents/${editingBook.id}`, {
        method: 'PATCH',
        headers: patchHeaders,
        body: JSON.stringify({ 
          title: trimmedTitle,
          author: trimmedAuthor,
        }),
      });

      const localLib = await localforage.getItem<any[]>('quiet_library') || [];
      const updatedLib = localLib.map(item => 
        item.id === editingBook.id ? { ...item, title: trimmedTitle, author: trimmedAuthor } : item
      );
      await localforage.setItem('quiet_library', updatedLib);

      setBooks(prev => prev.map(b => b.id === editingBook.id ? { ...b, title: trimmedTitle, author: trimmedAuthor } : b));
      setEditingBook(null);
    } catch (err) {
      console.error('Failed to update book details:', err);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Delete book
  const handleDeleteBook = async (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to remove "${title}" from your book shelf?`)) {
      try {
        let token: string | null = null;
        try { token = await getToken(); } catch (e) {}
        const deleteHeaders: Record<string, string> = {};
        if (token) deleteHeaders['Authorization'] = `Bearer ${token}`;

        await fetch(`/api/documents/${id}`, {
          method: 'DELETE',
          headers: deleteHeaders,
        });

        const localLib = await localforage.getItem<any[]>('quiet_library') || [];
        const updatedLib = localLib.filter(b => b.id !== id);
        await localforage.setItem('quiet_library', updatedLib);
        await localforage.removeItem(`quiet_book_${id}`);

        setBooks(prev => prev.filter(b => b.id !== id));
      } catch (err) {
        console.error('Failed to delete book:', err);
      }
    }
  };

  // Handle direct file upload from the shelf
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const id = Date.now().toString();
    const isEpub = file.name.endsWith('.epub');
    const isPdf = file.name.endsWith('.pdf');

    if (!isEpub && !isPdf) {
      alert('Only EPUB and PDF format files are supported.');
      setIsUploading(false);
      return;
    }

    try {
      const type = isEpub ? 'epub' : 'pdf';
      const cleanTitle = file.name.replace(/\.[^/.]+$/, "");

      // Save locally
      await localforage.setItem(`quiet_book_${id}`, file);
      const newBookMetadata = {
        id,
        title: cleanTitle,
        type,
        category: 'book',
        lastReadAt: Date.now(),
        progress: 0,
        isCompleted: false,
        currentLocation: 0,
        totalSize: file.size,
      };

      const currentLib = await localforage.getItem<any[]>('quiet_library') || [];
      await localforage.setItem('quiet_library', [newBookMetadata, ...currentLib]);

      // Direct to reader
      router.push(`/reader?id=${id}`);
    } catch (err) {
      console.error('Failed to import book:', err);
      alert('Failed to import book. Please try again.');
      setIsUploading(false);
    }
  };

  // Filter books
  const filteredBooks = useMemo(() => {
    return books.filter(book => {
      const matchesSearch = !searchQuery.trim() || 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (book.author && book.author.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (activeTab === 'reading') return book.progress > 0 && !book.isCompleted;
      if (activeTab === 'completed') return book.isCompleted;
      return true;
    });
  }, [books, searchQuery, activeTab]);

  // Group books into shelves of 4 (desktop default)
  const shelves = useMemo(() => {
    const itemsPerShelf = 4;
    const result: BookItem[][] = [];
    for (let i = 0; i < filteredBooks.length; i += itemsPerShelf) {
      result.push(filteredBooks.slice(i, i + itemsPerShelf));
    }
    return result;
  }, [filteredBooks]);

  // Stats
  const stats = useMemo(() => {
    const total = books.length;
    const completed = books.filter(b => b.isCompleted).length;
    const reading = books.filter(b => b.progress > 0 && !b.isCompleted).length;
    return { total, completed, reading };
  }, [books]);

  return (
    <div className="min-h-screen bg-[#F6F4EE] text-[#1C1C1C] flex flex-col relative selection:bg-[#E2E8F0]">
      {/* Hidden File Input for quick upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".pdf,.epub" 
        className="hidden" 
      />

      {/* Atmospheric Top Header */}
      <header className="border-b border-[#E7E2D6] bg-[#FAF8F5]/90 backdrop-blur-md sticky top-0 z-30 transition-all">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E5E5E5] text-[#6B7280] hover:text-[#111827] transition-all"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8C7A6B] bg-[#EFECE6] px-2 py-0.5 rounded">
                  Personal Library
                </span>
                <span className="text-xs text-[#8C7A6B] font-serif">· The Stacks</span>
              </div>
              <h1 className="font-serif font-bold text-xl md:text-2xl text-[#111827]">
                Book Shelf
              </h1>
            </div>
          </div>

          {/* Actions & Stats */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-[#1E293B] hover:bg-[#334155] text-white rounded-xl text-xs md:text-sm font-semibold shadow-sm hover:shadow transition-all cursor-pointer"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span>Import Book</span>
            </button>
          </div>
        </div>
      </header>

      {/* Library Banner & Filters Bar */}
      <div className="bg-[#FAF8F5] border-b border-[#E7E2D6] py-6 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Quick Stats Badges */}
          <div className="flex items-center gap-4 text-xs font-serif text-[#6B7280]">
            <div className="flex items-center gap-1.5 bg-white border border-[#E7E2D6] px-3 py-1.5 rounded-lg shadow-2xs">
              <BookOpen className="w-4 h-4 text-[#3D5A80]" />
              <span>Total Volumes <strong className="text-[#111827] font-sans font-bold">{stats.total}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-[#E7E2D6] px-3 py-1.5 rounded-lg shadow-2xs">
              <Bookmark className="w-4 h-4 text-[#D97706]" />
              <span>Reading <strong className="text-[#111827] font-sans font-bold">{stats.reading}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-[#E7E2D6] px-3 py-1.5 rounded-lg shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              <span>Completed <strong className="text-[#111827] font-sans font-bold">{stats.completed}</strong></span>
            </div>
          </div>

          {/* Search & Tabs */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or author..."
                className="pl-9 pr-3 py-1.5 bg-white border border-[#E7E2D6] rounded-lg text-xs md:text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#3D5A80] transition-all w-48 md:w-60"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#111827]">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-[#EFECE6] p-1 rounded-lg border border-[#E2DDD3]">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'all' 
                    ? 'bg-white text-[#111827] shadow-xs font-bold' 
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                All ({books.length})
              </button>
              <button
                onClick={() => setActiveTab('reading')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'reading' 
                    ? 'bg-white text-[#111827] shadow-xs font-bold' 
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                Reading ({stats.reading})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'completed' 
                    ? 'bg-white text-[#111827] shadow-xs font-bold' 
                    : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                Completed ({stats.completed})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Bookshelf Showcase */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-28 text-[#6B7280] space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#3D5A80]" />
            <p className="font-serif text-sm">Opening personal library...</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-24 bg-white/70 border border-[#E7E2D6] rounded-3xl max-w-lg mx-auto shadow-sm p-8">
            <div className="w-16 h-16 rounded-full bg-[#EFECE6] flex items-center justify-center mx-auto mb-4 text-[#8C7A6B]">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="font-serif font-bold text-lg text-[#111827] mb-2">No Books Found</h3>
            <p className="text-xs md:text-sm text-[#6B7280] mb-6 leading-relaxed">
              {searchQuery ? 'No books matched your search query.' : 'Upload an EPUB or PDF book to build your personal bookshelf.'}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E293B] text-white rounded-xl text-sm font-semibold shadow hover:bg-[#334155] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Import Your First Book</span>
            </button>
          </div>
        ) : (
          /* Real Bookshelf Architecture */
          <div className="space-y-16 md:space-y-20 pt-4">
            {shelves.map((shelfBooks, shelfIdx) => (
              <div key={shelfIdx} className="relative">
                {/* Books Row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 md:gap-10 px-4 md:px-8 items-end">
                  {shelfBooks.map((book) => {
                    const theme = getThemeForBook(book.id, book.title);
                    return (
                      <div 
                        key={book.id} 
                        className="group relative flex flex-col items-center transition-transform duration-300 hover:-translate-y-3 z-10"
                      >
                        {/* 3D Realistic Hardcover Book */}
                        <Link 
                          href={`/reader?id=${book.id}`}
                          className="w-full block relative"
                        >
                          <div 
                            className={`relative aspect-[1/1.45] w-full rounded-r-lg rounded-l-xs bg-gradient-to-br ${theme.bg} border ${theme.border} p-5 flex flex-col justify-between overflow-hidden cursor-pointer select-none
                              shadow-[4px_10px_20px_rgba(0,0,0,0.28),1px_2px_4px_rgba(0,0,0,0.15)]
                              group-hover:shadow-[8px_22px_32px_rgba(0,0,0,0.36),2px_4px_8px_rgba(0,0,0,0.2)]
                              transition-all duration-300`}
                          >
                            {/* Realistic Spine Crease / Binding Edge (Left) */}
                            <div className={`absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r ${theme.spineShadow} z-20 pointer-events-none rounded-l-xs`} />
                            <div className="absolute left-2.5 top-0 bottom-0 w-[1px] bg-white/15 z-20 pointer-events-none" />

                            {/* Right Multi-Layer Paper Edge Texture */}
                            <div className="absolute -right-1 top-1 bottom-1 w-1 bg-gradient-to-r from-[#D7CCC8] to-[#F5F5F0] rounded-r-xs shadow-xs z-10" />

                            {/* Book Cover Header: Gilt Rule & Category Tag */}
                            <div className="relative z-10 text-center pt-1">
                              <div className={`w-8 h-[1px] ${theme.goldRule} mx-auto mb-1.5`} />
                              <span className="text-[8px] md:text-[9px] font-sans font-bold tracking-[0.25em] uppercase text-white/50">
                                {book.type?.toUpperCase() || 'VOL. I'}
                              </span>
                            </div>

                            {/* Book Cover Center: Embossed Serif Title */}
                            <div className="relative z-10 my-auto text-center px-1">
                              <h3 
                                className={`font-serif font-bold text-sm md:text-base leading-snug ${theme.titleColor} line-clamp-4 drop-shadow-sm tracking-wide`}
                                title={book.title}
                              >
                                {book.title}
                              </h3>
                              {book.author && (
                                <p className={`mt-2 text-[10px] md:text-xs font-serif italic ${theme.subColor} line-clamp-1 opacity-80`}>
                                  {book.author}
                                </p>
                              )}
                            </div>

                            {/* Book Cover Footer: Progress Indicator / Seal */}
                            <div className="relative z-10 mt-auto pt-2 border-t border-white/10 flex items-center justify-between">
                              {book.isCompleted ? (
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#4ADE80]">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Completed</span>
                                </div>
                              ) : book.progress > 0 ? (
                                <div className="w-full">
                                  <div className="flex justify-between text-[9px] font-sans font-semibold text-white/70 mb-1">
                                    <span>Progress</span>
                                    <span>{book.progress}%</span>
                                  </div>
                                  <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-amber-400 to-amber-200 rounded-full transition-all"
                                      style={{ width: `${Math.min(100, book.progress)}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-[9px] font-sans tracking-wider uppercase text-white/50">
                                  <Sparkles className="w-3 h-3 text-amber-300/70" />
                                  <span>Unread</span>
                                </div>
                              )}
                            </div>

                            {/* Bookmark Ribbon Hanging from Top/Bottom */}
                            {book.progress > 0 && !book.isCompleted && (
                              <div className={`absolute -top-1 right-3 w-3 h-5 ${theme.ribbon} shadow-sm z-30 rounded-b-xs`} />
                            )}
                          </div>
                        </Link>

                        {/* Hover Quick Actions Bar */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -top-3 right-0 flex items-center gap-1 bg-white/95 backdrop-blur-md border border-[#E5E5E5] p-1 rounded-xl shadow-lg z-30">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingBook(book);
                              setEditTitleInput(book.title);
                              setEditAuthorInput(book.author || '');
                            }}
                            className="p-1.5 text-[#6B7280] hover:text-[#3D5A80] hover:bg-[#F3F4F6] rounded-lg transition-colors cursor-pointer"
                            title="Edit book details"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteBook(e, book.id, book.title)}
                            className="p-1.5 text-[#6B7280] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg transition-colors cursor-pointer"
                            title="Remove from shelf"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 3D Realistic Wood Shelf Ledge */}
                <div className="relative w-full mt-[-2px] select-none pointer-events-none">
                  {/* Top wood surface highlight with fine grain gradient */}
                  <div className="h-2 w-full bg-gradient-to-r from-[#D7CCC8] via-[#EFEBE9] to-[#D7CCC8] border-t border-[#DFD3C3] shadow-inner rounded-t-xs" />
                  {/* Front wood plank with rich depth & bevel */}
                  <div className="h-4.5 w-full bg-gradient-to-b from-[#8D6E63] via-[#6D4C41] to-[#4E342E] shadow-[0_10px_20px_rgba(40,20,10,0.22),0_2px_4px_rgba(0,0,0,0.1)] rounded-b-xs border-b border-[#3E2723]" />
                  {/* Soft cast drop shadow on the wall below */}
                  <div className="h-5 w-full bg-gradient-to-b from-black/15 to-transparent blur-xs" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Edit Title & Author Modal */}
      {editingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-[#FAF9F6] border border-[#E5E5E5] rounded-3xl max-w-md w-full p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-[#3D5A80]" />
                <h3 className="font-serif font-bold text-lg text-[#111827]">
                  Edit Book Details
                </h3>
              </div>
              <button 
                onClick={() => setEditingBook(null)} 
                className="text-[#9CA3AF] hover:text-[#111827] p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDetails} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                  Book Title
                </label>
                <input
                  type="text"
                  value={editTitleInput}
                  onChange={(e) => setEditTitleInput(e.target.value)}
                  autoFocus
                  required
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#3D5A80] focus:border-transparent transition-all font-serif"
                  placeholder="Enter book title..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                  Author (Optional)
                </label>
                <input
                  type="text"
                  value={editAuthorInput}
                  onChange={(e) => setEditAuthorInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-[#E5E5E5] rounded-xl text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#3D5A80] focus:border-transparent transition-all font-serif"
                  placeholder="e.g. Robert M. Sapolsky"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBook(null)}
                  className="px-4 py-2 text-sm font-medium text-[#6B7280] hover:text-[#111827] rounded-xl hover:bg-black/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDetails || !editTitleInput.trim()}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#111827] hover:bg-[#3D5A80] rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSavingDetails && <Loader2 className="w-4 h-4 animate-spin" />}
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
