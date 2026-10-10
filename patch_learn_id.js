const fs = require('fs');
let code = fs.readFileSync('src/app/review/learn/page.tsx', 'utf8');
code = code.replace('id: currentItem.id,', 'id: currentItem.id || currentItem.word,');
// Also cache bust
code = code.replace("fetch('/api/library-items?type=word')", "fetch('/api/library-items?type=word&t=' + Date.now())");
fs.writeFileSync('src/app/review/learn/page.tsx', code);
console.log("Patched learn page");
