const fs = require('fs');

const files = [
  'src/app/review/phrases/page.tsx',
  'src/app/review/words/page.tsx',
  'src/app/review/learn/page.tsx',
  'src/app/review/session/page.tsx',
  'src/app/page.tsx',
  'src/app/library/books/page.tsx',
  'src/app/library/articles/page.tsx',
  'src/app/sentences/page.tsx'
];

files.forEach(p => {
  if (fs.existsSync(p)) {
    let code = fs.readFileSync(p, 'utf8');
    
    // Fix Date.now() directly in render body
    if (code.includes('const now = Date.now();') && !code.includes('const [now, setNow]')) {
      code = code.replace(
        'const now = Date.now();',
        'const [now, setNow] = useState(0);\n  useEffect(() => setNow(Date.now()), []);'
      );
    }
    
    // Fix new Date().getTime()
    if (code.includes('const now = new Date().getTime();') && !code.includes('const [now, setNow]')) {
      code = code.replace(
        'const now = new Date().getTime();',
        'const [now, setNow] = useState(0);\n  useEffect(() => setNow(Date.now()), []);'
      );
    }

    fs.writeFileSync(p, code);
  }
});

console.log('Fixed dates');
