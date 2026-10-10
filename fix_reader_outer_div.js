const fs = require('fs');
let code = fs.readFileSync('src/app/reader/page.tsx', 'utf8');

code = code.replace(
  "<div className=\"flex flex-col h-screen bg-[#FAF9F6] text-[#1C1C1C] overflow-hidden relative\" onMouseMove={fileType === 'pdf' ? handleMouseMoveGlobal : undefined}>",
  "<div className=\"flex flex-col h-screen bg-[#FAF9F6] text-[#1C1C1C] overflow-hidden relative\" onMouseMove={fileType === 'epub' ? undefined : handleMouseMoveGlobal}>"
);

fs.writeFileSync('src/app/reader/page.tsx', code);
