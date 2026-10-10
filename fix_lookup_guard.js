const fs = require('fs');
let code = fs.readFileSync('src/app/reader/ReaderClient.tsx', 'utf8');

const regex = /const lookupWord = async \(word: string, clientX: number, clientY: number\) => \{\n    const cleanWord/;
const replacement = `const lookupWord = async (word: string, clientX: number, clientY: number) => {
    // Ultimate guard: NEVER fire if text is actively selected anywhere
    if ((window.getSelection()?.toString() || '').trim().length > 0) return;
    try {
      const iframe = document.querySelector('iframe');
      if (iframe && (iframe.contentWindow?.getSelection()?.toString() || '').trim().length > 0) return;
    } catch(e) {}

    const cleanWord`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/app/reader/ReaderClient.tsx', code);
