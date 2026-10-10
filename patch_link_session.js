const fs = require('fs');
let code = fs.readFileSync('src/app/review/session/page.tsx', 'utf8');

code = code.replace(/<Link href="\/review\/words"/g, '<a href="/review/words"');
code = code.replace(/<Link href="\/"/g, '<a href="/"');
code = code.replace(/<\/Link>/g, '</a>');

fs.writeFileSync('src/app/review/session/page.tsx', code);
console.log('Replaced Link with a tag in session');
