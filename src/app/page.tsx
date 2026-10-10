import React from 'react';
import { BookOpen, Clock, Target, Calendar, ChevronRight, Bookmark, Flame } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1C1C] p-6 md:p-12 font-sans selection:bg-[#E2E8F0]">
      <div className="max-w-6xl mx-auto space-y-12">
        
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
          
          {/* Left Column: Bookshelf & Reading */}
          <div className="xl:col-span-2 space-y-10">
            
            {/* Section: Currently Reading */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif font-semibold text-[#111827]">Monthly Focus</h2>
                <button className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors flex items-center group">
                  View all <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Book Card 1 */}
                <div className="bg-white p-8 rounded-3xl border border-[#E5E5E5] hover:border-[#D1D5DB] hover:shadow-sm transition-all flex flex-col justify-between group h-full">
                  <div>
                    <div className="flex justify-between items-start mb-5">
                      <span className="text-[11px] font-bold tracking-widest uppercase bg-[#F3F4F6] text-[#4B5563] px-3 py-1.5 rounded-full">The Economist</span>
                      <Bookmark className="w-5 h-5 text-[#D1D5DB] group-hover:text-[#111827] transition-colors" />
                    </div>
                    <h3 className="font-serif font-bold text-2xl mb-2 leading-tight text-[#111827]">How to fix the global economy</h3>
                    <p className="text-sm text-[#6B7280] mb-8 font-medium">Finance & Economics · 2026</p>
                  </div>
                  
                  <div>
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-xs font-bold tracking-wide text-[#4B5563] uppercase">
                        <span>Progress</span>
                        <span>45%</span>
                      </div>
                      <div className="w-full bg-[#F3F4F6] rounded-full h-2 overflow-hidden">
                        <div className="bg-[#3D5A80] h-full rounded-full transition-all duration-500" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                    <Link href="/reader" className="block w-full bg-[#111827] hover:bg-[#374151] text-white text-sm font-semibold py-3.5 rounded-2xl transition-colors text-center">
                      Continue Reading
                    </Link>
                  </div>
                </div>

                {/* Book Card 2 */}
                <div className="bg-white p-8 rounded-3xl border border-[#E5E5E5] hover:border-[#D1D5DB] hover:shadow-sm transition-all flex flex-col justify-between group h-full">
                  <div>
                    <div className="flex justify-between items-start mb-5">
                      <span className="text-[11px] font-bold tracking-widest uppercase bg-[#F3F4F6] text-[#4B5563] px-3 py-1.5 rounded-full">Book</span>
                      <Bookmark className="w-5 h-5 text-[#D1D5DB] group-hover:text-[#111827] transition-colors" />
                    </div>
                    <h3 className="font-serif font-bold text-2xl mb-2 leading-tight text-[#111827]">Atomic Habits</h3>
                    <p className="text-sm text-[#6B7280] mb-8 font-medium">James Clear · 2018</p>
                  </div>

                  <div>
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-xs font-bold tracking-wide text-[#4B5563] uppercase">
                        <span>Progress</span>
                        <span>12%</span>
                      </div>
                      <div className="w-full bg-[#F3F4F6] rounded-full h-2 overflow-hidden">
                        <div className="bg-[#5B8266] h-full rounded-full transition-all duration-500" style={{ width: '12%' }}></div>
                      </div>
                    </div>
                    <Link href="/reader" className="block w-full bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] text-sm font-semibold py-3.5 rounded-2xl transition-colors text-center">
                      Continue Reading
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Recent Expressions Review */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif font-semibold text-[#111827]">Due for Review <span className="text-[#6B7280] text-lg font-normal ml-1">(12)</span></h2>
                <button className="text-sm font-medium text-[#6B7280] hover:text-[#111827] transition-colors flex items-center group">
                  Start Review <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              <div className="bg-white rounded-3xl border border-[#E5E5E5] overflow-hidden">
                <div className="divide-y divide-[#F3F4F6]">
                  {/* Expression Item */}
                  <div className="p-6 hover:bg-[#FAFAFA] transition-colors cursor-pointer flex justify-between items-center group">
                    <div className="pr-4">
                      <h4 className="font-serif font-bold text-xl text-[#111827] mb-2 group-hover:text-[#3D5A80] transition-colors">status quo</h4>
                      <p className="text-sm text-[#6B7280] leading-relaxed line-clamp-1">They are defending the <span className="font-semibold text-[#111827] bg-[#F3F4F6] px-1.5 py-0.5 rounded">status quo</span> rather than innovating.</p>
                    </div>
                    <span className="text-[10px] font-bold tracking-wider uppercase bg-[#FEE2E2] text-[#991B1B] px-3 py-1.5 rounded-full whitespace-nowrap">Due Today</span>
                  </div>
                  {/* Expression Item */}
                  <div className="p-6 hover:bg-[#FAFAFA] transition-colors cursor-pointer flex justify-between items-center group">
                    <div className="pr-4">
                      <h4 className="font-serif font-bold text-xl text-[#111827] mb-2 group-hover:text-[#3D5A80] transition-colors">mitigate</h4>
                      <p className="text-sm text-[#6B7280] leading-relaxed line-clamp-1">Measures need to be taken to <span className="font-semibold text-[#111827] bg-[#F3F4F6] px-1.5 py-0.5 rounded">mitigate</span> the environmental impact.</p>
                    </div>
                    <span className="text-[10px] font-bold tracking-wider uppercase bg-[#FEE2E2] text-[#991B1B] px-3 py-1.5 rounded-full whitespace-nowrap">Due Today</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Habit Tracker & Stats */}
          <div className="space-y-6">
            <section className="bg-[#111827] text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#3D5A80] rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
              
              <h2 className="text-sm font-bold tracking-widest uppercase text-[#9CA3AF] mb-8">Daily Goal</h2>
              
              <div className="flex flex-col items-center justify-center mb-8 relative z-10">
                <div className="relative flex items-center justify-center w-40 h-40 mb-6">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-[#374151]" />
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="439.8" strokeDashoffset="175.9" className="text-[#E07A5F] transition-all duration-1000 ease-in-out drop-shadow-[0_0_8px_rgba(224,122,95,0.4)]" strokeLinecap="round" />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-bold font-serif">27</span>
                    <span className="text-xs font-medium tracking-wide text-[#9CA3AF] mt-1 uppercase">/ 45 min</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-[#D1D5DB] text-center">
                  18 mins left to reach today's goal.
                </p>
              </div>

              <button className="w-full bg-[#E07A5F] hover:bg-[#D56A4D] text-white text-sm font-bold tracking-wide uppercase py-4 rounded-2xl transition-colors relative z-10">
                Start Focus Timer
              </button>
            </section>

            <section className="bg-white p-8 rounded-3xl border border-[#E5E5E5]">
              <h2 className="text-sm font-bold tracking-widest uppercase text-[#6B7280] mb-6">Consistency</h2>
              <div className="grid grid-cols-7 gap-2.5">
                {/* Simulated Heatmap */}
                {Array.from({ length: 28 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`aspect-square rounded-md transition-colors ${
                      i > 24 ? 'bg-[#F3F4F6]' : 
                      i % 4 === 0 ? 'bg-[#5B8266]' : 
                      i % 3 === 0 ? 'bg-[#8CA894]' : 'bg-[#C5D4C9]'
                    }`}
                  ></div>
                ))}
              </div>
              <div className="mt-6 flex justify-between items-center text-xs font-bold tracking-wide uppercase text-[#9CA3AF]">
                <span>Less</span>
                <div className="flex gap-1.5">
                  <div className="w-3.5 h-3.5 bg-[#F3F4F6] rounded-sm"></div>
                  <div className="w-3.5 h-3.5 bg-[#C5D4C9] rounded-sm"></div>
                  <div className="w-3.5 h-3.5 bg-[#8CA894] rounded-sm"></div>
                  <div className="w-3.5 h-3.5 bg-[#5B8266] rounded-sm"></div>
                </div>
                <span>More</span>
              </div>
            </section>
          </div>
        </div>

      </div>
    </div>
  );
}
