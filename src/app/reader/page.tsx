'use client';

import React, { useState } from 'react';
import { ArrowLeft, Type, Maximize, Settings, Plus, PlayCircle, Save, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function Reader() {
  const [fontSize, setFontSize] = useState(20);
  const [showNotePanel, setShowNotePanel] = useState(true);

  // Simulated paragraph of reading material
  const articleContent = `The global economy is facing a set of complex challenges that defy simple solutions. Inflation, once thought to be a relic of the 1970s, has returned with a vengeance, forcing central banks to tighten monetary policy at an unprecedented pace. This sudden shift has exposed vulnerabilities in the financial system, particularly among heavily indebted institutions and emerging markets.

However, amidst these challenges, there are also signs of resilience and innovation. The transition to renewable energy sources is accelerating, driven by both environmental concerns and the desire for energy security. Technological advancements, particularly in artificial intelligence and biotechnology, hold the promise of significant productivity gains in the coming decades.

To navigate this uncertain landscape, policymakers must strike a delicate balance. They must remain vigilant in their fight against inflation while also avoiding a deep and prolonged recession. Furthermore, structural reforms are needed to boost long-term growth potential, such as investing in education, infrastructure, and research and development. 

The defense of the status quo is no longer a viable strategy; leaders must embrace bold and pragmatic approaches to secure a prosperous future.`;

  return (
    <div className="flex h-screen bg-[#FAF9F6] text-[#1C1C1C] selection:bg-[#E2E8F0] overflow-hidden">
      
      {/* Left Area: Immersive Reader */}
      <div className={`flex-1 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${showNotePanel ? 'md:mr-[420px]' : ''}`}>
        
        {/* Top Navbar */}
        <header className="h-20 border-b border-[#E5E5E5] flex items-center justify-between px-8 bg-[#FAF9F6]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E5E5E5] text-[#6B7280] hover:text-[#111827] transition-all">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#6B7280]">The Economist</span>
              <h1 className="font-serif font-medium text-sm text-[#111827]">How to fix the global economy</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white border border-[#E5E5E5] rounded-full p-1 shadow-sm mr-4">
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827] transition-colors" onClick={() => setFontSize(f => Math.max(14, f - 2))} title="Decrease Font Size">
                <Type className="w-3.5 h-3.5" />
              </button>
              <div className="w-[1px] h-4 bg-[#E5E5E5] mx-1"></div>
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827] transition-colors" onClick={() => setFontSize(f => Math.min(36, f + 2))} title="Increase Font Size">
                <Type className="w-4 h-4" />
              </button>
            </div>
            <button 
              className={`hidden md:flex items-center justify-center w-10 h-10 rounded-full transition-all border ${showNotePanel ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-[#6B7280] border-[#E5E5E5] hover:text-[#111827] hover:shadow-sm'}`}
              onClick={() => setShowNotePanel(!showNotePanel)} 
              title="Toggle Note Panel"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Reading Content */}
        <main className="flex-1 overflow-y-auto px-6 py-16 md:px-24 lg:px-48 pb-40 scroll-smooth">
          <article 
            className="max-w-2xl mx-auto leading-[1.8] text-[#374151] font-serif transition-all duration-300"
            style={{ fontSize: \`\${fontSize}px\` }}
          >
            {articleContent.split('\\n\\n').map((paragraph, idx) => (
              <p key={idx} className="mb-10 tracking-[-0.01em]">
                {/* Simulating a highlighted word in the last paragraph */}
                {idx === 3 ? (
                  <>
                    The defense of the <span className="bg-[#FEF3C7] text-[#92400E] border-b-2 border-[#F59E0B] rounded-sm px-1 cursor-pointer transition-colors">status quo</span> is no longer a viable strategy; leaders must embrace bold and pragmatic approaches to secure a prosperous future.
                  </>
                ) : (
                  paragraph
                )}
              </p>
            ))}
          </article>
        </main>
      </div>

      {/* Right Area: Note & Dictionary Panel (Slide in/out) */}
      <aside 
        className={\`fixed right-0 top-0 h-full w-full md:w-[420px] bg-white border-l border-[#E5E5E5] shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] z-20 flex flex-col font-sans \${showNotePanel ? 'translate-x-0' : 'translate-x-full'}\`}
      >
        <div className="h-20 border-b border-[#E5E5E5] flex items-center justify-between px-8 bg-white">
          <h2 className="font-bold text-sm tracking-widest uppercase text-[#111827] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#3D5A80]" />
            Notes & Dictionary
          </h2>
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F3F4F6] text-[#6B7280] hover:text-[#111827] transition-colors md:hidden" onClick={() => setShowNotePanel(false)}>
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          
          {/* Target Word */}
          <div>
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-4xl font-serif font-bold text-[#111827]">status quo</h3>
              <button className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F3F4F6] text-[#6B7280] hover:bg-[#3D5A80] hover:text-white transition-colors group mt-1">
                <PlayCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
            <p className="text-[#6B7280] font-mono text-sm tracking-wide">/ˌsteɪtəs ˈkwoʊ/</p>
          </div>

          {/* Dictionary Definition (Simulated Offline Dict) */}
          <div className="bg-[#FAF9F6] p-6 rounded-3xl border border-[#E5E5E5]">
            <h4 className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-4">Oxford Dictionary</h4>
            <p className="text-[#374151] leading-relaxed mb-4 text-[15px]">
              <span className="font-bold text-[#3D5A80] mr-2">noun.</span> 
              The existing state of affairs, especially regarding social or political issues.
            </p>
            <div className="pl-4 border-l-2 border-[#D1D5DB]">
              <p className="text-[14px] text-[#6B7280] italic font-serif leading-relaxed">
                "They have a vested interest in maintaining the status quo."
              </p>
            </div>
          </div>

          {/* Source Context (Auto-captured) */}
          <div>
            <h4 className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-3">Source Context</h4>
            <div className="bg-[#FEF3C7]/30 p-5 rounded-2xl border border-[#FEF3C7]">
              <p className="text-[14px] text-[#4B5563] italic font-serif leading-relaxed">
                "The defense of the <strong className="text-[#92400E] font-semibold bg-[#FEF3C7] px-1 rounded-sm">status quo</strong> is no longer a viable strategy..."
              </p>
            </div>
          </div>

          {/* User's Input Area */}
          <div className="space-y-6 pt-6 border-t border-[#E5E5E5]">
            <div>
              <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-3 block">Tags</label>
              <div className="flex flex-wrap gap-2">
                <span className="bg-[#3D5A80]/10 text-[#3D5A80] text-xs font-semibold px-3 py-1.5 rounded-full">Economics</span>
                <button className="bg-white text-[#6B7280] text-xs font-medium px-3 py-1.5 rounded-full border border-[#D1D5DB] border-dashed hover:border-[#6B7280] hover:text-[#111827] transition-colors flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Tag
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest mb-3 block">My Insight / Sentence</label>
              <textarea 
                className="w-full bg-white border border-[#E5E5E5] rounded-2xl p-4 text-[15px] text-[#111827] focus:outline-none focus:ring-4 focus:ring-[#3D5A80]/10 focus:border-[#3D5A80] transition-all resize-none placeholder-[#9CA3AF]"
                rows={4}
                placeholder="Type your own sentence here to strengthen your memory..."
              ></textarea>
            </div>
            
            <button className="w-full bg-[#111827] hover:bg-[#374151] text-white text-sm font-bold tracking-wide uppercase py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#111827]/20 hover:shadow-xl hover:shadow-[#111827]/30 hover:-translate-y-0.5">
              <Save className="w-4 h-4" />
              Save to Library
            </button>
          </div>

        </div>
      </aside>

    </div>
  );
}
