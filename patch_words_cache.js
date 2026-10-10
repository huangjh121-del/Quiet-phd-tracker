const fs = require('fs');
let code = fs.readFileSync('src/app/review/words/page.tsx', 'utf8');
code = code.replace("fetch('/api/library-items?type=word')", "fetch('/api/library-items?type=word&t=' + Date.now())");
fs.writeFileSync('src/app/review/words/page.tsx', code);
console.log("Patched words page");
