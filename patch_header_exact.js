const fs = require('fs');
let code = fs.readFileSync('src/app/reader/ReaderClient.tsx', 'utf8');

// Find the start of the header
const headerStartIdx = code.indexOf('<header className="h-20 border-b border-[#E5E5E5]');
const headerEndIdx = code.indexOf('</header>', headerStartIdx) + '</header>'.length;

const headerBlock = code.substring(headerStartIdx, headerEndIdx);

// It looks like:
// <header ...>
//   <div className="flex items-center gap-6">...</div>
//   {fileType === 'pdf' && (...)}
//   {fileType === 'epub' && (...)}
// </header>

// I will just replace the `</header>` tag with the button + `</header>`. Wait, the `fileType` conditions are currently immediate children of the `<header>`.
// By wrapping them in `<div className="flex items-center gap-4">`, I can keep them tidy, but I can also just place the button as another child of the header. Since the header is `flex items-center justify-between`, if there are 3 children (Left, Controls, Button), it will space them out.
// Wait, the header has `justify-between`. 
// If it has Left Side, Controls, Button -> it will space them.
// To keep Left and (Controls + Button) as two groups, we should wrap the Controls and Button.
// Let's just find `</div>` that closes the left side.

const leftSideEndIdx = code.indexOf('</div>', code.indexOf('</h1>', headerStartIdx)) + '</div>'.length + 1; // Actually there are two divs closing, one for the title column, one for the gap-6 container.
// Let's be safer. Just match the PDF block start and EPUB block end.

// Let's replace the raw strings.
let newHeaderBlock = headerBlock.replace(
  "{fileType === 'pdf' && (",
  '<div className="flex items-center gap-4">\n        {fileType === \'pdf\' && ('
);

// find the closing of the epub block.
// It ends with:
//               <List className="w-4 h-4" />
//             </button>
//           </div>
//         )}
//       </header>

newHeaderBlock = newHeaderBlock.replace(
  `          </div>\n        )}\n      </header>`,
  `          </div>\n        )}\n        {isCompleted ? (\n          <div className="flex items-center gap-2 px-4 py-2 bg-[#5B8266]/10 text-[#5B8266] rounded-full text-xs font-bold uppercase tracking-widest">\n            <Check className="w-4 h-4" /> Completed\n          </div>\n        ) : (\n          <button \n            onClick={markAsCompleted}\n            className="flex items-center gap-2 px-4 py-2 bg-[#111827] hover:bg-[#3D5A80] text-white rounded-full text-xs font-bold uppercase tracking-widest transition-colors shadow-sm shrink-0"\n          >\n            <Check className="w-4 h-4" /> Mark Complete\n          </button>\n        )}\n        </div>\n      </header>`
);

code = code.replace(headerBlock, newHeaderBlock);
fs.writeFileSync('src/app/reader/ReaderClient.tsx', code);
console.log('Patched header EXACTLY');
