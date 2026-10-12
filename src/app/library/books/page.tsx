'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';
import localforage from 'localforage';
import { useAuth } from '@clerk/nextjs';

export default function BookShelf() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        let cloudBooks: any[] = [];
        if (data.documents) {
          cloudBooks = data.documents.map((d: any) => ({
            id: d.id,
            title: d.title,
            author: d.author,
            progress: d.percentage || 0,
            isCompleted: (d.percentage || 0) >= 100,
            lastReadAt: d.last_read_at || 0,
          }));
        }

        // 2. Fetch local books fallback
        const localLib = await localforage.getItem<any[]>('quiet_library') || [];
        const localBooks = localLib
          .filter(b => b.category === 'book')
          .map(b => ({
            id: b.id,
            title: b.title,
            author: b.author,
            progress: b.progress || 0,
            isCompleted: b.isCompleted || false,
            lastReadAt: b.lastReadAt || 0,
          }));

        // Merge (prefer cloud book if ID matches)
        const map = new Map();
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

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1C1C] flex flex-col relative selection:bg-[#E2E8F0]">
      <header className="h-20 border-b border-[#E5E5E5] flex items-center px-8 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E5E5E5] text-[#6B7280] hover:text-[#111827] transition-all mr-6">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-serif font-bold text-xl text-[#111827]">Book Shelf</h1>
      </header>

      <main className="flex-1 p-8 md:p-16 max-w-5xl mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[#3D5A80]" /></div>
        ) : books.length === 0 ? (
          <div className="text-center py-20 text-[#6B7280]">Your book shelf is empty. Upload a book from the dashboard.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {books.map((book) => (
              <Link key={book.id} href={`/reader?id=${book.id}`} className="group relative">
                <div className="aspect-[2/3] bg-white border border-[#E5E5E5] rounded-lg shadow-sm group-hover:shadow-xl transition-all overflow-hidden flex flex-col items-center justify-center p-4">
                  <div className="w-12 h-12 rounded-full bg-[#3D5A80]/10 flex items-center justify-center mb-4 text-[#3D5A80] group-hover:scale-110 transition-transform">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif font-bold text-center text-sm leading-tight text-[#111827] line-clamp-3">{book.title}</h3>
                </div>
                
                {book.isCompleted ? (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-[#5B8266] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap uppercase tracking-widest">
                    Completed
                  </div>
                ) : book.progress > 0 ? (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-[#111827] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                    {book.progress}% Read
                  </div>
                ) : (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-[#F3F4F6] text-[#6B7280] text-[10px] font-bold px-3 py-1 rounded-full shadow-sm whitespace-nowrap uppercase tracking-widest border border-[#E5E5E5]">
                    New
                  </div>
                )}
  
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
