const fs = require('fs');

const code = `'use client';

import React, { useState, useRef } from 'react';
import { BookOpen, Target, Settings, Search, Clock, Plus, ChevronRight, Bookmark, X, Upload, Loader2, Flame } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as pdfjsLib from 'pdfjs-dist';

// Setup pdf.js worker using unpkg CDN to avoid Next.js bundling issues
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "//unpkg.com/pdfjs-dist@" + pdfjsLib.version + "/build/pdf.worker.min.mjs";
}

export default function Home() {
  const router = useRouter();
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef(null);

  const handleImport = () => {
    if (importText.trim().length > 0) {
      localStorage.setItem('quiet_article', importText);
      router.push('/reader');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert("Please select a valid PDF file.");
      return;
    }

    setIsExtracting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");
        fullText += pageText + "\\n\\n";
      }
      
      setImportText(fullText.trim());
    } catch (err) {
      console.error("Error extracting PDF:", err);
      alert("Could not extract text from this PDF. It might be a scanned image or protected.");
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1C1C] font-sans selection:bg-[#E2E8F0]">
      {/* Top Navigation */}
      <nav className="border-b border-[#E5E5E5] bg-white/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#111827] rounded-lg flex items-center justify-center">
              <BookOpen className="text-white w-4 h-4" />
            </div>
            <span className="font-serif font-bold text-lg tracking-tight">Quiet Tracker</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-[#6B7280] hover:text-[#111827] transition-colors p-2">
              <Search className="w-5 h-5" />
            </button>
            <button className="text-[#6B7280] hover:text-[#111827] transition-colors p-2">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-12">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 pt-8 pb-4 border-b border-[#E5E5E5]">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 font-serif text-[#111827]">Welcome Back</h1>
            <p className="text-[#6B7280] text-lg font-serif italic">"For us, there is only the trying. The rest is not our business." <span className="text-sm not-italic ml-2">— T.S. Eliot</span></p>
          </div>
          <div className="inline-flex items-center space-x-2 bg-white px-5 py-2.5 rounded-2xl border border-[#E5E5E5] shadow-sm">
            <Flame className="text-[#E07A5F] w-5 h-5" />
            <span className="font-semibold text-sm tracking-wide text-[#374151]">12-DAY STREAK</span>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {/* Left Column */}
          <div className="xl:col-span-2 space-y-10">
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif font-semibold text-[#111827]">Library</h2>
                <div className="flex gap-4 items-center">
                  <button onClick={() => setShowImportModal(true)} className="text-sm font-bold uppercase tracking-wider text-[#3D5A80] hover:text-[#111827] flex items-center">
                    <Plus className="w-4 h-4 mr-1" /> Import Document
                  </button>
                  <Link href="/reader" className="text-sm font-medium text-[#6B7280] hover:text-[#111827] flex items-center group">
                    View all <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111827]/40 backdrop-blur-sm">
                  <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="flex justify-between items-center p-6 border-b border-[#E5E5E5] shrink-0">
                      <h3 className="font-serif text-xl font-bold text-[#111827]">Import New Reading</h3>
                      <button onClick={() => setShowImportModal(false)} className="text-[#6B7280] hover:text-[#111827]"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
                      <div className="border-2 border-dashed border-[#D1D5DB] hover:border-[#3D5A80] bg-[#FAF9F6] rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                        <input type="file" accept="application/pdf" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        {isExtracting ? (
                          <>
                            <Loader2 className="w-10 h-10 text-[#3D5A80] animate-spin mb-4" />
                            <p className="font-bold text-[#111827]">Extracting text from PDF...</p>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Upload className="w-5 h-5 text-[#3D5A80]" /></div>
                            <p className="font-bold text-[#111827]">Click to upload a PDF</p>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-4 py-2">
                        <div className="h-px bg-[#E5E5E5] flex-1"></div>
                        <span className="text-xs font-bold text-[#9CA3AF]">OR</span>
                        <div className="h-px bg-[#E5E5E5] flex-1"></div>
                      </div>
                      <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Paste your raw English text here..." className="w-full h-40 p-4 border border-[#E5E5E5] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#3D5A80]/10 text-[#374151] resize-none"></textarea>
                    </div>
                    <div className="p-6 bg-[#FAF9F6] border-t border-[#E5E5E5] flex justify-end gap-3 shrink-0">
                      <button onClick={() => setShowImportModal(false)} className="px-5 py-2.5 text-sm font-bold text-[#6B7280]">Cancel</button>
                      <button onClick={handleImport} disabled={importText.trim().length === 0} className="px-5 py-2.5 bg-[#111827] text-white text-sm font-bold rounded-xl flex items-center gap-2"><BookOpen className="w-4 h-4" /> Start Reading</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-3xl border border-[#E5E5E5] h-full flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-5">
                      <span className="text-[11px] font-bold uppercase bg-[#E07A5F]/10 text-[#E07A5F] px-3 py-1.5 rounded-full">Article</span>
                      <Bookmark className="w-5 h-5 text-[#D1D5DB]" />
                    </div>
                    <h3 className="font-serif font-bold text-2xl mb-2 text-[#111827]">The Nature of the Firm</h3>
                    <p className="text-sm text-[#6B7280] mb-8">R. H. Coase · 1937</p>
                  </div>
                  <Link href="/reader" className="block w-full bg-[#111827] text-white text-sm font-semibold py-3.5 rounded-2xl text-center">Continue Reading</Link>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-[#E5E5E5] h-full flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-5">
                      <span className="text-[11px] font-bold uppercase bg-[#F3F4F6] text-[#4B5563] px-3 py-1.5 rounded-full">Book</span>
                      <Bookmark className="w-5 h-5 text-[#D1D5DB]" />
                    </div>
                    <h3 className="font-serif font-bold text-2xl mb-2 text-[#111827]">Atomic Habits</h3>
                    <p className="text-sm text-[#6B7280] mb-8">James Clear · 2018</p>
                  </div>
                  <Link href="/reader" className="block w-full bg-[#F3F4F6] text-[#111827] text-sm font-semibold py-3.5 rounded-2xl text-center">Continue Reading</Link>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-serif font-semibold text-[#111827] mb-6">Due for Review (12)</h2>
              <div className="bg-white rounded-3xl border border-[#E5E5E5] overflow-hidden">
                <div className="divide-y divide-[#F3F4F6]">
                  <div className="p-6 flex justify-between items-center">
                    <div>
                      <h4 className="font-serif font-bold text-xl text-[#111827] mb-2">status quo</h4>
                      <p className="text-sm text-[#6B7280]">They are defending the <span className="font-semibold text-[#111827] bg-[#F3F4F6] px-1.5 py-0.5 rounded">status quo</span>...</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase bg-[#FEE2E2] text-[#991B1B] px-3 py-1.5 rounded-full">Due Today</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <section className="bg-[#111827] text-white p-8 rounded-3xl relative overflow-hidden">
              <h2 className="text-sm font-bold uppercase text-[#9CA3AF] mb-8">Daily Goal</h2>
              <div className="flex flex-col items-center justify-center mb-8">
                <div className="relative flex items-center justify-center w-40 h-40 mb-6">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-[#374151]" />
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="439.8" strokeDashoffset="175.9" className="text-[#E07A5F]" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-bold font-serif">27</span>
                    <span className="text-xs text-[#9CA3AF] mt-1">/ 45 min</span>
                  </div>
                </div>
                <p className="text-sm text-[#D1D5DB] text-center">18 mins left to reach today\'s goal.</p>
              </div>
              <button className="w-full bg-[#E07A5F] text-white text-sm font-bold uppercase py-4 rounded-2xl">Start Focus Timer</button>
            </section>

            <section className="bg-white p-8 rounded-3xl border border-[#E5E5E5]">
              <h2 className="text-sm font-bold uppercase text-[#6B7280] mb-6">Consistency</h2>
              <div className="grid grid-cols-7 gap-2.5">
                {Array.from({ length: 28 }).map((_, i) => (
                  <div key={i} className={"aspect-square rounded-md " + (i > 24 ? 'bg-[#F3F4F6]' : i % 4 === 0 ? 'bg-[#5B8266]' : i % 3 === 0 ? 'bg-[#8CA894]' : 'bg-[#C5D4C9]')}></div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/app/page.tsx', code);
