'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Quote, BookOpen, Trash2, ArrowUpRight } from "lucide-react";
import Link from 'next/link';
import localforage from 'localforage';
import { useReadingTimer } from '@/lib/readingTracker';

export default function SentencesPage() {
  useReadingTimer();
  const [sentences, setSentences] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [library, setLibrary] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch sentences from D1
    fetch('/api/sentences?t=' + Date.now())
      .then(res => res.json())
      .then(data => {
        if (data.sentences) {
          const seen = new Set<string>();
          const unique = data.sentences.filter((s: any) => {
            const key = (s.sentence || '').trim().toLowerCase();
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setSentences(unique);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to load sentences", err);
        setIsLoading(false);
      });

    // 2. Fetch library from both Cloudflare D1 and localforage
    Promise.all([
      fetch('/api/documents?t=' + Date.now()).then(r => r.json()).catch(() => ({ documents: [] })),
      localforage.getItem<any[]>('quiet_library').catch(() => [])
    ]).then(([dRes, localLib]) => {
      const cloudDocs = (dRes.documents || []).map((d: any) => ({
        id: String(d.id),
        title: d.title,
      }));
      const localDocs = (localLib || []).map((d: any) => ({
        id: String(d.id),
        title: d.title,
      }));
      const map = new Map<string, any>();
      localDocs.forEach((d: any) => map.set(d.id, d));
      cloudDocs.forEach((d: any) => map.set(d.id, d));
      setLibrary(Array.from(map.values()));
    });
  }, []);

  const findBookForSentence = (item: any) => {
    // 1. Match by book_id if available
    if (item.book_id) {
      const direct = library.find(b => b.id === String(item.book_id));
      if (direct) return direct;
      return { id: String(item.book_id), title: item.source_title };
    }
    // 2. Match by source title
    if (item.source_title && item.source_title !== 'Unknown') {
      const exact = library.find(b => b.title === item.source_title);
      if (exact) return exact;

      // Loose match (trimmed/case-insensitive)
      const normSource = item.source_title.toLowerCase().trim();
      const loose = library.find(b => {
        const normTitle = (b.title || '').toLowerCase().trim();
        return normTitle === normSource || normTitle.includes(normSource) || normSource.includes(normTitle);
      });
      if (loose) return loose;
    }

    // 3. If there is only one document in library and it's an article, provide fallback
    if (library.length === 1) {
      return library[0];
    }
    return null;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sentence?')) return;
    try {
      const res = await fetch('/api/delete-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sentence', id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSentences(prev => prev.filter(i => i.id !== id));
      } else {
        alert(data.error || 'Failed to delete sentence');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while deleting sentence');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1C1C] flex flex-col relative selection:bg-[#E2E8F0]">
      
      <header className="h-20 border-b border-[#E5E5E5] flex items-center justify-between px-8 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E5E5E5] text-[#6B7280] hover:text-[#111827] transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <h1 className="font-serif font-bold text-lg text-[#111827]">Sentences Library</h1>
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#6B7280]">
              {sentences.length} {sentences.length === 1 ? 'SENTENCE' : 'SENTENCES'} COLLECTED
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#3D5A80]" />
          </div>
        ) : sentences.length === 0 ? (
          <div className="text-center py-20">
            <Quote className="w-12 h-12 text-[#E5E5E5] mx-auto mb-6" />
            <h2 className="text-2xl font-serif font-bold text-[#111827] mb-4">No sentences yet.</h2>
            <p className="text-[#6B7280]">Highlight beautiful sentences while reading to collect them here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sentences.map((item) => {
              const book = findBookForSentence(item);
              const href = book 
                ? `/reader?id=${book.id}&highlight=${encodeURIComponent(item.sentence)}&from=sentences` 
                : '#';
              
              return (
                <div key={item.id} className="group bg-white p-6 rounded-2xl border border-[#E5E5E5] hover:border-[#3D5A80]/40 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <Link href={href} className="flex-1 cursor-pointer block">
                      <p className="font-serif text-lg md:text-xl text-[#111827] leading-relaxed group-hover:text-[#3D5A80] transition-colors">
                        “{item.sentence}”
                      </p>
                      
                      <div className="flex items-center gap-2 mt-3 text-xs text-[#6B7280]">
                        <BookOpen className="w-3.5 h-3.5 text-[#3D5A80]" />
                        <span className="font-medium text-[#4B5563]">
                          {item.source_title && item.source_title !== 'Unknown' ? item.source_title : (book?.title || 'Article')}
                        </span>
                        {book && (
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#3D5A80] bg-[#EEF2F6] px-2 py-0.5 rounded-full ml-1">
                            Locate in text <ArrowUpRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </Link>

                    <div className="shrink-0 flex items-center pt-1">
                      <button 
                        onClick={() => handleDelete(item.id)} 
                        className="text-[#D1D5DB] hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50" 
                        title="Delete Sentence"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
