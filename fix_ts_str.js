const fs = require('fs');
let code = fs.readFileSync('src/app/review/page.tsx', 'utf8');

code = code.replace(
  "{words.length > 0 ? \\`\\${currentIndex + 1} OF \\${words.length}\\` : 'NO WORDS YET'}",
  "{words.length > 0 ? (currentIndex + 1) + ' OF ' + words.length : 'NO WORDS YET'}"
);

fs.writeFileSync('src/app/review/page.tsx', code);
