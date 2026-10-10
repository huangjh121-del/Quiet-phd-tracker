const fs = require('fs');

let code = fs.readFileSync('src/app/reader/page.tsx', 'utf8');

// Find the text rendering block using a regex
const regex = /<div[^>]*className="max-w-3xl[^>]*>[\s\S]*?\{fileData as string\}[\s\S]*?<\/div>/m;

const replacement = `<div 
              className="max-w-3xl mx-auto text-lg leading-loose font-serif text-[#374151] whitespace-pre-wrap selection:bg-[#E2E8F0] pb-32"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-[#111827] mb-12 leading-tight">{bookTitle}</h1>
              {fileData as string}
            </div>`;

code = code.replace(regex, replacement);

// Also attach handleMouseMoveGlobal to the outermost div for ALL files, so it catches margin movements
const outerDivRegex = /<div className="flex flex-col h-screen bg-\\[#FAF9F6\\] text-\\[#1C1C1C\\] overflow-hidden relative" onMouseMove=\{[^\}]*\}>/;
const newOuterDiv = `<div className="flex flex-col h-screen bg-[#FAF9F6] text-[#1C1C1C] overflow-hidden relative" onMouseMove={fileType === 'epub' ? undefined : handleMouseMoveGlobal}>`;

code = code.replace(outerDivRegex, newOuterDiv);

fs.writeFileSync('src/app/reader/page.tsx', code);
