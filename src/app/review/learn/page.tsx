'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { ArrowLeft, Loader2, CheckCircle2, ChevronRight, GraduationCap, PenLine, Check } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LearnSessionInner() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'word';
  const [items, setItems] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    fetch(`/api/library-items?type=${type}&t=` + Date.now())
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          // Only take items that have not been learned yet (repetition === 0)
          setItems(data.items.filter((i: any) => type === 'phrase' ? (i.repetitions || 0) === 0 : (i.repetition || 0) === 0));
        }
        setIsLoading(false);
      })
      .catch(err => setIsLoading(false));
  }, []);

  const currentItem = items[currentIndex];

  useEffect(() => {
    if (currentItem) {
      setNoteInput(currentItem.meaning || '');
      setIsEditingNote(false);
    }
  }, [currentIndex, currentItem]);

  const handleSaveLearnNote = async () => {
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
      console.error("Failed to update note", err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleMarkLearned = async () => {
    if (!currentItem || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      await fetch('/api/mark-learned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          id: currentItem.id || currentItem.word,
          // Set next review to tomorrow at start of day (00:00:00)
          nextReviewAt: (() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            return tomorrow.getTime();
          })()
        })
      });
      
      if (currentIndex < items.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Session complete
        setCurrentIndex(items.length);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#3D5A80]" /></div>;
  }

  if (items.length === 0 || currentIndex >= items.length) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#1C1C1C] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-[#5B8266]/10 rounded-full flex items-center justify-center mb-6 text-[#5B8266]">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-[#111827] mb-4">{type === 'phrase' ? 'All Caught Up!' : 'All Caught Up!'}</h2>
        <p className="text-[#6B7280] mb-10 max-w-sm">{type === 'phrase' ? 'You have learned all your new expressions. They will appear in your review queue starting tomorrow.' : 'You have learned all your new words. They will appear in your review queue starting tomorrow.'}</p>
        <a href={type === 'phrase' ? '/review/phrases' : '/review/words'} className="bg-[#111827] text-white px-8 py-3.5 rounded-full font-bold text-sm tracking-wide shadow-lg hover:-translate-y-0.5 transition-all">
          Back to Vocabulary
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1C1C] flex flex-col selection:bg-[#E2E8F0]">
      <link rel="stylesheet" href="/oald10.css" />
      <header className="h-20 border-b border-[#E5E5E5] flex items-center justify-between px-8 bg-white/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-6">
          <a href={type === 'phrase' ? '/review/phrases' : '/review/words'} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E5E5E5] text-[#6B7280] hover:text-[#111827] transition-all">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-[#E07A5F]" />
            <h1 className="font-serif font-bold text-lg text-[#111827]">{type === 'phrase' ? 'Learning New Expressions' : 'Learning New Words'}</h1>
          </div>
        </div>
        <div className="text-sm font-bold tracking-widest text-[#9CA3AF]">
          {currentIndex + 1} / {items.length}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-4xl mx-auto">
        <div className="w-full bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-[#E5E5E5] overflow-hidden flex flex-col h-[70vh]">
          
          <div className="p-10 border-b border-[#E5E5E5] shrink-0 text-center bg-[#F9FAFB]">
            <h2 className="text-5xl font-serif font-bold text-[#111827]">{type === 'phrase' ? currentItem.phrase : currentItem.word}</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-8">
            {type === 'phrase' && (
              <div className="bg-[#3D5A80]/5 border-l-4 border-[#3D5A80] p-6 rounded-r-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-[#3D5A80] flex items-center gap-1.5">
                    <PenLine className="w-3.5 h-3.5" /> Meaning & Notes (释义与笔记)
                  </h4>
                  {!isEditingNote && (
                    <button
                      onClick={() => { setNoteInput(currentItem.meaning || ''); setIsEditingNote(true); }}
                      className="text-xs text-[#3D5A80] hover:underline font-bold"
                    >
                      {currentItem.meaning ? '编辑笔记' : '+ 添加释义笔记'}
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
                        onClick={handleSaveLearnNote}
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
            )}

            {currentItem.context && (
              <div className="bg-[#E07A5F]/5 border-l-4 border-[#E07A5F] p-6 rounded-r-2xl">
                <h4 className="text-[10px] font-bold tracking-widest uppercase text-[#E07A5F] mb-2">Original Context</h4>
                <p className="text-lg font-serif italic text-[#1C1C1C] leading-relaxed">"{currentItem.context}"</p>
              </div>
            )}

            {type === 'word' && (<div>
              <h4 className="text-[10px] font-bold tracking-widest uppercase text-[#6B7280] mb-4">Dictionary Definition</h4>
              <div className="dict-html-container text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: currentItem.html_definition }} />
            </div>)}
            {type === 'phrase' && (<div>
              <h4 className="text-[10px] font-bold tracking-widest uppercase text-[#6B7280] mb-4">Source</h4>
              <div className="text-sm font-bold text-[#111827]">{currentItem.source_title || 'Unknown Source'}</div>
            </div>)}
          </div>
          
          <div className="p-6 border-t border-[#E5E5E5] bg-white shrink-0">
            <button 
              onClick={handleMarkLearned}
              disabled={isSubmitting}
              className="w-full bg-[#111827] text-white py-4 rounded-xl font-bold tracking-widest uppercase text-sm shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:bg-[#1f2937] transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>Mark as Learned <ChevronRight className="w-5 h-5" /></>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LearnSession() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">Loading...</div>}>
      <LearnSessionInner />
    </Suspense>
  );
}
