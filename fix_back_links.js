const fs = require('fs');

const files = [
  'src/app/review/words/page.tsx',
  'src/app/review/phrases/page.tsx',
  'src/app/review/session/page.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    // Replace the exact back button Link destination
    code = code.replace('<Link href="/review" className="flex items-center justify-center w-10 h-10', '<Link href="/" className="flex items-center justify-center w-10 h-10');
    // For session/page.tsx which might have different classes or multiple /review links:
    code = code.replace(/href="\/review"/g, 'href="/"');
    fs.writeFileSync(file, code);
  }
}

// Check sentences page
const sentencesFile = 'src/app/sentences/page.tsx';
if (fs.existsSync(sentencesFile)) {
  let code = fs.readFileSync(sentencesFile, 'utf8');
  code = code.replace(/href="\/review"/g, 'href="/"');
  fs.writeFileSync(sentencesFile, code);
}
