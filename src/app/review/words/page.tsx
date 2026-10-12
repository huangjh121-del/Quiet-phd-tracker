'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, PlayCircle, BookOpen, GraduationCap, Flame, Trash2 } from "lucide-react";
import Link from 'next/link';

export default function WordsLibrary() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/library-items?type=word&t=' + Date.now())
      .then(res => res.json())
      .then(data => {
        if (data.items) setItems(data.items);
        setIsLoading(false);
      })
      .catch(err => setIsLoading(false));
  }, []);

  
  const handleDelete = async (word: string) => {
    if (!confirm('Are you sure you want to delete this word?')) return;
    try {
      const res = await fetch('/api/delete-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'word', id: word })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setItems(items.filter(i => i.word !== word));
      } else {
        alert(data.error || 'Failed to delete word');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while deleting word');
    }
  };

  const [endOfTodayMs, setEndOfTodayMs] = useState(0);
  useEffect(() => {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    setEndOfTodayMs(endOfToday.getTime());
  }, []);
  // New words are those with repetition = 0
  const newWords = items.filter(i => (i.repetition || 0) === 0);
  // Due words are those that have been learned (repetition > 0) and their review date is on or before today
  const dueWords = items.filter(i => (i.repetition || 0) > 0 && (i.next_review_at || 0) <= endOfTodayMs);
  const learnedWords = items.filter(i => (i.repetition || 0) > 0);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1C1C] flex flex-col relative selection:bg-[#E2E8F0]">
      <link rel="stylesheet" href="/oald10.css" />
      <header className="h-20 border-b border-[#E5E5E5] flex items-center justify-between px-8 bg-[#FAF9F6] sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E5E5E5] text-[#6B7280] hover:text-[#111827] transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <h1 className="font-serif font-bold text-lg text-[#111827]">Vocabulary (生词库)</h1>
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#6B7280]">
              {items.length} WORDS TOTAL
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href={newWords.length > 0 ? "/review/learn" : "#"} 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm tracking-wide transition-all ${newWords.length > 0 ? 'bg-[#E07A5F] text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md' : 'bg-[#E5E5E5] text-[#9CA3AF] cursor-not-allowed'}`}
          >
            <GraduationCap className="w-4 h-4" /> Start Learning ({newWords.length})
          </Link>
          
          <Link 
            href={dueWords.length > 0 ? "/review/session?type=word" : "#"} 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm tracking-wide transition-all ${dueWords.length > 0 ? 'bg-[#111827] text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md' : 'bg-[#E5E5E5] text-[#9CA3AF] cursor-not-allowed'}`}
          >
            <Flame className={`w-4 h-4 ${dueWords.length > 0 ? 'text-[#E07A5F]' : ''}`} /> Review Due ({dueWords.length})
          </Link>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[#3D5A80]" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-[#6B7280]">No words added yet.</div>
        ) : (
          <div className="space-y-4">
            {items.map(item => {
              const isNew = (item.repetition || 0) === 0;
              const isDue = !isNew && (item.next_review_at || 0) <= endOfTodayMs;
              
              return (
                <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5E5E5] flex items-center justify-between group hover:border-[#D1D5DB] transition-all">
                  <div className="flex-1 flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="w-48 shrink-0">
                      <h3 className="text-lg font-serif font-bold text-[#111827] mb-1">{item.word}</h3>
                      <div className="flex gap-2">
                        {isNew ? (
                          <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md bg-[#F3F4F6] text-[#6B7280]">New</span>
                        ) : isDue ? (
                          <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md bg-[#E07A5F]/10 text-[#E07A5F]">Due Review</span>
                        ) : (
                          <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md bg-[#5B8266]/10 text-[#5B8266]">Learned ({item.repetition} reps)</span>
                        )}
                        <button onClick={() => handleDelete(item.word)} className="text-[#9CA3AF] hover:text-red-500 transition-colors p-1" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 border-l border-[#F3F4F6] pl-6 relative max-h-[160px] overflow-y-auto overflow-x-hidden custom-scrollbar bg-[#F9FAFB]/30">
                      <div 
                        className="dict-html-container scale-[0.85] origin-top-left w-[115%] pb-4" 
                        dangerouslySetInnerHTML={{ __html: item.html_definition }} 
                        onClick={(e) => {
                          const anchor = (e.target as HTMLElement).closest('a');
                          if (anchor && !anchor.getAttribute('href')?.startsWith('sound://')) {
                            e.preventDefault(); // prevent navigation on internal dict links in list view
                          }
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="ml-6 flex items-center justify-end min-w-[100px]">
                    {!isNew && (
                      <div className="text-right">
                        <div className="text-[10px] font-bold tracking-widest uppercase text-[#9CA3AF]">Next Review</div>
                        <div className={`text-xs font-semibold mt-0.5 ${isDue ? 'text-[#E07A5F]' : 'text-[#111827]'}`}>
                          {isDue ? 'NOW' : new Date(item.next_review_at).toLocaleDateString()}
                        </div>
                      </div>
                    )}
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