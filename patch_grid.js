const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const oldGrid = `<div className="flex items-center justify-end gap-1.5 flex-wrap flex-1 ml-4">`;
const newGrid = `<div className="grid grid-cols-10 gap-1.5 md:gap-2 ml-auto shrink-0 py-1">`;

code = code.replace(oldGrid, newGrid);

fs.writeFileSync('src/app/page.tsx', code);
console.log('Patched grid layout');
