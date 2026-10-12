'use client';

import { Suspense } from 'react';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, PlayCircle, FileText, PenLine, Check } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useReadingTimer } from '@/lib/readingTracker';

function MainContent() {
  useReadingTimer();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const searchParams = useSearchParams();
  const reviewType = searchParams.get('type') || 'word';
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    (async () => {
      let token: string | null = null;
      try { token = await getToken(); } catch (e) {}
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      fetch(`/api/words?before=${endOfToday.getTime()}&t=${Date.now()}`, { headers })
        .then(res => res.json())
        .then(data => {
          if (data.items) setItems(data.items.filter((i: any) => i.type === reviewType));
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Failed to load review items", err);
          setIsLoading(false);
        });
    })();
  }, [reviewType, isLoaded, isSignedIn]);

  const currentItem = items[currentIndex];

  useEffect(() => {
    if (currentItem) {
      setNoteInput(currentItem.meaning || '');
      setIsEditingNote(false);
    }
  }, [currentIndex, currentItem]);

  const handleSaveReviewNote = async () => {
    if (!currentItem) return;
    setIsSavingNote(true);
    try {
      const res = await fetch('/api/update-phrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentItem.id, phrase: currentItem.phrase, meaning: noteInput })
      });
      if (res.ok) {
        setItems(prev => prev.map((item, idx) => idx === currentIndex ? { ...item, meaning: noteInput } : item));
        setIsEditingNote(false);
      }
    } catch (err) {
      console.error("Failed to update note in review session", err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleNext = async (quality: number) => {
    if (!currentItem) return;
    setIsSubmitting(true);
    
    try {
      await fetch('/api/srs-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentItem.type === 'word' ? (currentItem.word || currentItem.id) : (currentItem.id || currentItem.phrase),
          type: currentItem.type,
          quality,
          currentEase: currentItem.ease_factor,
          currentReps: currentItem.repetition ?? currentItem.repetitions ?? 0,
          currentInterval: currentItem.interval,
          tzOffset: new Date().getTimezoneOffset()
        })
      });
    } catch(e) {
      console.error(e);
    }
    
    setIsSubmitting(false);
    setShowAnswer(false);
    setCurrentIndex(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#3D5A80]" />
        <p className="mt-4 text-[#6B7280] font-medium tracking-wide">Loading your Spaced Repetition Library...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1C1C] flex flex-col relative selection:bg-[#E2E8F0]">
      <link rel="stylesheet" href="/oald10.css" />
      
      <header className="h-20 border-b border-[#E5E5E5] flex items-center justify-between px-8 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E5E5E5] text-[#6B7280] hover:text-[#111827] transition-all">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div className="flex flex-col">
            <h1 className="font-serif font-bold text-lg text-[#111827]">SRS Review</h1>
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#6B7280]">
              {items.length > 0 ? (currentIndex + 1) + ' OF ' + items.length : 'NO REVIEWS DUE'}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        {items.length === 0 ? (
          <div className="text-center">
            <h2 className="text-2xl font-serif font-bold text-[#111827] mb-4">Nothing to review right now!</h2>
            <p className="text-[#6B7280] mb-8">You have caught up with all your spaced repetition reviews.</p>
            <a href="/" className="bg-[#111827] text-white px-6 py-3 rounded-xl font-bold text-sm tracking-wide shadow-sm hover:-translate-y-0.5 transition-all">Go back to reading</a>
          </div>
        ) : currentIndex >= items.length ? (
          <div className="text-center">
            <h2 className="text-3xl font-serif font-bold text-[#5B8266] mb-4">You're all caught up!</h2>
            <p className="text-[#6B7280] mb-8">Great job finishing your review session.</p>
            <a href="/" className="bg-[#111827] text-white px-6 py-3 rounded-xl font-bold text-sm tracking-wide shadow-sm hover:-translate-y-0.5 transition-all">Go back to Dashboard</a>
          </div>
        ) : (
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-[#E5E5E5] overflow-hidden flex flex-col relative">
            <div className="absolute top-6 left-6">
              <span className={"text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full " + (currentItem.type === 'word' ? 'bg-[#3D5A80]/10 text-[#3D5A80]' : 'bg-[#E07A5F]/10 text-[#E07A5F]')}>
                {currentItem.type === 'word' ? 'Vocabulary' : 'Good Expression'}
              </span>
            </div>
            
            <div className="p-10 pt-20 flex-1 flex flex-col items-center justify-center min-h-[300px] border-b border-[#E5E5E5] bg-[#FAF9F6]">
              <h2 className="text-4xl font-serif font-bold text-[#111827] text-center mb-6 leading-tight">
                {currentItem.type === 'word' ? currentItem.word : currentItem.phrase}
              </h2>
              
              {!showAnswer && (
                <button 
                  onClick={() => setShowAnswer(true)}
                  className="bg-[#111827] text-white px-8 py-3.5 rounded-2xl font-bold tracking-wider uppercase text-sm shadow-md hover:bg-[#374151] transition-all hover:-translate-y-0.5 mt-8"
                >
                  Show Answer
                </button>
              )}
            </div>

            {showAnswer && (
              <div className="p-8 max-h-[400px] overflow-y-auto custom-scrollbar bg-white">
                {currentItem.type === 'word' ? (
                  <div className="dict-html-container text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: currentItem.html_definition }} />
                ) : (
                  <div className="space-y-6">
                    {/* User's custom Meaning & Notes */}
                    <div className="bg-[#3D5A80]/5 border-l-4 border-[#3D5A80] p-5 rounded-r-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold tracking-widest uppercase text-[#3D5A80] flex items-center gap-1.5">
                          <PenLine className="w-3.5 h-3.5" /> Meaning & Notes (释义与笔记)
                        </h4>
                        {!isEditingNote && (
                          <button
                            onClick={() => { setNoteInput(currentItem.meaning || ''); setIsEditingNote(true); }}
                            className="text-xs text-[#3D5A80] hover:underline font-bold"
                          >
                            {currentItem.meaning ? '编辑笔记' : '+ 添加笔记'}
                          </button>
                        )}
                      </div>

                      {isEditingNote ? (
                        <div className="space-y-2">
                          <textarea
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            placeholder="输入中文含义或重点笔记..."
                            rows={2}
                            className="w-full text-sm bg-white border border-[#E5E5E5] rounded-xl p-3 text-[#111827] focus:outline-none focus:border-[#3D5A80] focus:ring-1 focus:ring-[#3D5A80] resize-y"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setIsEditingNote(false)}
                              className="px-3 py-1.5 text-xs text-[#6B7280] hover:text-[#111827] font-medium"
                            >
                              取消
                            </button>
                            <button
                              onClick={handleSaveReviewNote}
                              disabled={isSavingNote}
                              className="px-4 py-1.5 bg-[#111827] hover:bg-[#374151] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1"
                            >
                              {isSavingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              保存
                            </button>
                          </div>
                        </div>
                      ) : currentItem.meaning ? (
                        <p className="text-base font-medium text-[#111827] leading-relaxed whitespace-pre-wrap">
                          {currentItem.meaning}
                        </p>
                      ) : (
                        <p className="text-sm text-[#9CA3AF] italic">
                          暂无中文释义记录。点击右上角即可添加笔记。
                        </p>
                      )}
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold tracking-widest uppercase text-[#6B7280] mb-2">Original Context</h4>
                      <p className="text-lg font-serif text-[#111827] leading-relaxed border-l-4 border-[#E07A5F] pl-4 italic">"{currentItem.context}"</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold tracking-widest uppercase text-[#6B7280] mb-1">Source</h4>
                      <p className="text-sm font-medium text-[#6B7280] flex items-center gap-1.5"><FileText className="w-4 h-4" /> {currentItem.source_title}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {showAnswer && (
              <div className="p-6 bg-[#F9FAFB] border-t border-[#E5E5E5] flex gap-4">
                <button disabled={isSubmitting} onClick={() => handleNext(0)} className="flex-1 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FECACA] transition-colors disabled:opacity-50">
                  不认识 (Again)
                </button>
                <button disabled={isSubmitting} onClick={() => handleNext(3)} className="flex-1 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider bg-[#E07A5F]/20 text-[#92400E] hover:bg-[#E07A5F]/30 transition-colors disabled:opacity-50">
                  不确定 (Hard)
                </button>
                <button disabled={isSubmitting} onClick={() => handleNext(5)} className="flex-1 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider bg-[#D1FAE5] text-[#065F46] hover:bg-[#A7F3D0] transition-colors disabled:opacity-50">
                  熟悉 (Easy)
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}


export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-gray-500">Loading...</div>}>
      <MainContent />
    </Suspense>
  );
}
