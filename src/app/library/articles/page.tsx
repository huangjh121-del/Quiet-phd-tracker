'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import localforage from 'localforage';

export default function ArticleShelf() {
  const [articles, setArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    localforage.getItem<any[]>('quiet_library').then(lib => {
      if (lib) {
        setArticles(lib.filter(b => b.category === 'article').sort((a, b) => b.lastReadAt - a.lastReadAt));
      }
      setIsLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1C1C] flex flex-col relative selection:bg-[#E2E8F0]">
      <header className="h-20 border-b border-[#E5E5E5] flex items-center px-8 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E5E5E5] text-[#6B7280] hover:text-[#111827] transition-all mr-6">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-serif font-bold text-xl text-[#111827]">Article Shelf</h1>
      </header>

      <main className="flex-1 p-8 md:p-16 max-w-5xl mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[#3D5A80]" /></div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 text-[#6B7280]">Your article shelf is empty. Upload or paste an article from the dashboard.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link key={article.id} href={`/reader?id=${article.id}`} className="group relative bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col">
                <div className="w-10 h-10 rounded-full bg-[#E07A5F]/10 flex items-center justify-center mb-4 text-[#E07A5F] group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-serif font-bold text-lg leading-tight text-[#111827] line-clamp-3 mb-2">{article.title}</h3>
                <div className="mt-auto pt-4 flex justify-between items-center text-xs font-bold text-[#6B7280]">
                  <span>{new Date(article.lastReadAt).toLocaleDateString()}</span>
                  
                  {article.isCompleted ? (
                    <span className="bg-[#5B8266]/10 text-[#5B8266] px-2 py-1 rounded-md uppercase tracking-widest">Completed</span>
                  ) : article.progress > 0 ? (
                    <span className="bg-[#111827] text-white px-2 py-1 rounded-md">{article.progress}% Read</span>
                  ) : (
                    <span className="bg-[#F3F4F6] px-2 py-1 rounded-md uppercase tracking-widest text-[#6B7280]">New</span>
                  )}

                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
