'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Quote, BookOpen, Trash2 } from "lucide-react";
import Link from 'next/link';
import localforage from 'localforage';

export default function SentencesPage() {
  const [sentences, setSentences] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [library, setLibrary] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/sentences?t=' + Date.now())
      .then(res => res.json())
      .then(data => {
        if (data.sentences) setSentences(data.sentences);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to load sentences", err);
        setIsLoading(false);
      });
      
    localforage.getItem<any[]>('quiet_library').then(lib => {
      if (lib) setLibrary(lib);
    });
  }, []);

  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sentence?')) return;
    try {
      await fetch('/api/delete-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sentence', id })
      });
      setSentences(sentences.filter(i => i.id !== id));
    } catch (err) {
      console.error(err);
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
            <h1 className="font-serif font-bold text-lg text-[#111827]">Beautiful Sentences</h1>
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#6B7280]">
              {sentences.length} {sentences.length === 1 ? 'SENTENCE' : 'SENTENCES'} COLLECTED
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
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
          <div className="flex flex-col gap-3">
            {sentences.map((item) => {
              const book = library.find(b => b.title === item.source_title);
              const href = book ? `/reader?id=${book.id}&highlight=${encodeURIComponent(item.sentence)}` : '#';
              return (
                <div key={item.id} className="group flex items-center justify-between bg-white px-6 py-4 rounded-xl border border-[#E5E5E5] hover:shadow-md transition-all">
                  <Link href={href} className="flex-1 pr-6 cursor-pointer block">
                    <p className="font-serif text-lg text-[#111827] leading-relaxed group-hover:text-[#3D5A80] transition-colors">
                      {item.sentence}
                    </p>
                  </Link>
                  <div className="shrink-0 flex items-center">
                    <button onClick={() => handleDelete(item.id)} className="text-[#D1D5DB] hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
