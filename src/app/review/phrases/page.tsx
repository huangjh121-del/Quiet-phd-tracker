'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, BookOpen, GraduationCap, Flame, Trash2, PenLine, Check } from "lucide-react";
import Link from 'next/link';

export default function WordsLibrary() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, 'idle' | 'saving' | 'saved'>>({});

  useEffect(() => {
    fetch('/api/library-items?type=phrase&t=' + Date.now())
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          setItems(data.items);
          const initialNotes: Record<string, string> = {};
          data.items.forEach((item: any) => {
            initialNotes[item.id] = item.meaning || '';
          });
          setNotes(initialNotes);
        }
        setIsLoading(false);
      })
      .catch(err => setIsLoading(false));
  }, []);

  const handleSaveMeaning = async (id: string, phrase: string) => {
    const currentMeaning = notes[id] !== undefined ? notes[id] : (items.find(i => i.id === id)?.meaning || '');
    setSaveStatus(prev => ({ ...prev, [id]: 'saving' }));
    try {
      const res = await fetch('/api/update-phrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, phrase, meaning: currentMeaning })
      });
      if (res.ok) {
        setItems(prev => prev.map(item => item.id === id ? { ...item, meaning: currentMeaning } : item));
        setSaveStatus(prev => ({ ...prev, [id]: 'saved' }));
        setTimeout(() => {
          setSaveStatus(prev => ({ ...prev, [id]: 'idle' }));
        }, 2000);
      } else {
        setSaveStatus(prev => ({ ...prev, [id]: 'idle' }));
      }
    } catch (err) {
      console.error("Failed to update phrase meaning", err);
      setSaveStatus(prev => ({ ...prev, [id]: 'idle' }));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this phrase?')) return;
    try {
      const res = await fetch('/api/delete-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'phrase', id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setItems(items.filter(i => i.id !== id));
      } else {
        alert(data.error || 'Failed to delete phrase');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while deleting phrase');
    }
  };

  const [endOfTodayMs, setEndOfTodayMs] = useState(0);
  useEffect(() => {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    setEndOfTodayMs(endOfToday.getTime());
  }, []);
  // New phrases are those with repetitions = 0
  const newPhrases = items.filter(i => (i.repetitions || 0) === 0);
  // Due phrases are those that have been learned (repetitions > 0) and their review date is on or before today
  const duePhrases = items.filter(i => (i.repetitions || 0) > 0 && (i.next_review_at || 0) <= endOfTodayMs);
  const learnedPhrases = items.filter(i => (i.repetitions || 0) > 0);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1C1C] flex flex-col relative selection:bg-[#E2E8F0]">
      
      <header className="h-20 border-b border-[#E5E5E5] flex items-center justify-between px-8 bg-[#FAF9F6] sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E5E5E5] text-[#6B7280] hover:text-[#111827] transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <h1 className="font-serif font-bold text-lg text-[#111827]">Good Expressions (短语库)</h1>
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#6B7280]">
              {items.length} PHRASES TOTAL
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            href={newPhrases.length > 0 ? "/review/learn?type=phrase" : "#"} 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm tracking-wide transition-all ${newPhrases.length > 0 ? 'bg-[#E07A5F] text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md' : 'bg-[#E5E5E5] text-[#9CA3AF] cursor-not-allowed'}`}
          >
            <GraduationCap className="w-4 h-4" /> Start Learning ({newPhrases.length})
          </Link>
          
          <Link 
            href={duePhrases.length > 0 ? "/review/session?type=phrase" : "#"} 
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm tracking-wide transition-all ${duePhrases.length > 0 ? 'bg-[#111827] text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md' : 'bg-[#E5E5E5] text-[#9CA3AF] cursor-not-allowed'}`}
          >
            <Flame className={`w-4 h-4 ${duePhrases.length > 0 ? 'text-[#E07A5F]' : ''}`} /> Review Due ({duePhrases.length})
          </Link>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-[#3D5A80]" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-[#6B7280]">No phrases added yet.</div>
        ) : (
          <div className="space-y-4">
            {items.map(item => {
              const isNew = (item.repetitions || 0) === 0;
              const isDue = !isNew && (item.next_review_at || 0) <= endOfTodayMs;
              
              return (
                <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-[#E5E5E5] flex flex-col gap-4 group hover:border-[#D1D5DB] transition-all">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="w-48 shrink-0">
                      <h3 className="text-lg font-serif font-bold text-[#111827] mb-1">{item.phrase}</h3>
                      <div className="flex gap-2">
                        {isNew ? (
                          <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md bg-[#F3F4F6] text-[#6B7280]">New</span>
                        ) : isDue ? (
                          <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md bg-[#E07A5F]/10 text-[#E07A5F]">Due Review</span>
                        ) : (
                          <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md bg-[#5B8266]/10 text-[#5B8266]">Learned ({item.repetitions} reps)</span>
                        )}
                        <button onClick={() => handleDelete(item.id)} className="text-[#9CA3AF] hover:text-red-500 transition-colors p-1" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 border-t md:border-t-0 md:border-l border-[#F3F4F6] pt-3 md:pt-0 md:pl-6 relative flex flex-col justify-center">
                      <div className="text-sm text-[#6B7280] italic leading-relaxed line-clamp-3 md:line-clamp-2">
                        "{item.context}"
                      </div>
                      <div className="mt-2 text-xs font-bold uppercase tracking-widest text-[#9CA3AF] flex items-center gap-2">
                        <BookOpen className="w-3 h-3" /> {item.source_title || 'Unknown Source'}
                      </div>
                    </div>

                    <div className="ml-0 md:ml-6 shrink-0 min-w-[90px] text-left md:text-right">
                      {!isNew && (
                        <div>
                          <div className="text-[10px] font-bold tracking-widest uppercase text-[#9CA3AF]">Next Review</div>
                          <div className={`text-xs font-semibold mt-0.5 ${isDue ? 'text-[#E07A5F]' : 'text-[#111827]'}`}>
                            {isDue ? 'NOW' : new Date(item.next_review_at).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Editable Meaning & Notes Section */}
                  <div className="pt-3 border-t border-[#F3F4F6] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-bold tracking-wider uppercase text-[#3D5A80]">
                      <PenLine className="w-3.5 h-3.5" />
                      <span>含义与笔记:</span>
                    </div>

                    <input
                      type="text"
                      value={notes[item.id] !== undefined ? notes[item.id] : (item.meaning || '')}
                      onChange={(e) => setNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                      onBlur={() => {
                        const currentVal = notes[item.id];
                        if (currentVal !== undefined && currentVal !== (item.meaning || '')) {
                          handleSaveMeaning(item.id, item.phrase);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveMeaning(item.id, item.phrase);
                        }
                      }}
                      placeholder="输入查询到的中文含义或重要用法笔记 (回车或失焦自动保存)..."
                      className="flex-1 text-xs bg-[#FAF9F6] border border-[#E5E5E5] focus:bg-white rounded-lg px-3 py-1.5 text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#3D5A80] focus:ring-1 focus:ring-[#3D5A80] transition-all"
                    />

                    <button
                      onClick={() => handleSaveMeaning(item.id, item.phrase)}
                      disabled={saveStatus[item.id] === 'saving'}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1.5 ${
                        saveStatus[item.id] === 'saved'
                          ? 'bg-[#5B8266] text-white'
                          : 'bg-[#111827] hover:bg-[#374151] text-white shadow-sm'
                      }`}
                    >
                      {saveStatus[item.id] === 'saving' ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> 保存中</>
                      ) : saveStatus[item.id] === 'saved' ? (
                        <><Check className="w-3 h-3" /> 已保存</>
                      ) : (
                        '保存'
                      )}
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