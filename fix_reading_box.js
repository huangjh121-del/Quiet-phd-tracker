const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Change the box width and padding
const oldBox = '<div className="bg-white p-5 rounded-3xl border border-[#E5E5E5] flex items-center gap-5 min-w-[240px] shadow-sm">';
const newBox = '<div className="bg-white px-8 py-6 rounded-3xl border border-[#E5E5E5] flex items-center gap-8 min-w-[320px] shadow-sm hover:shadow-md transition-shadow">';
code = code.replace(oldBox, newBox);

// 2. Change SVG circle size
const oldSvg = '<div className="relative w-14 h-14 flex items-center justify-center shrink-0">';
const newSvg = '<div className="relative w-16 h-16 flex items-center justify-center shrink-0">';
code = code.replace(oldSvg, newSvg);

// 3. Change goal math to 60
const oldMath = 'Math.min((readingStats.todayMins / 120) * 100, 100)';
const newMath = 'Math.min((readingStats.todayMins / 60) * 100, 100)';
code = code.replace(oldMath, newMath);

// 4. Change 120 mins text to 60 mins
const oldText = '<span className="text-xs text-[#6B7280] font-medium">/ 120 mins</span>';
const newText = '<span className="text-sm text-[#6B7280] font-medium">/ 60 mins</span>';
code = code.replace(oldText, newText);

// 5. Change number text size from text-xl to text-3xl
const oldNum = '<span className="text-xl font-serif font-bold text-[#111827]">{readingStats.todayMins}</span>';
const newNum = '<span className="text-3xl font-serif font-bold text-[#111827]">{readingStats.todayMins}</span>';
code = code.replace(oldNum, newNum);

fs.writeFileSync('src/app/page.tsx', code);
console.log("Updated reading box");
