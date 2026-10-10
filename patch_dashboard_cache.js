const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

code = code.replace("fetch('/api/library-items?type=word')", "fetch('/api/library-items?type=word&t=' + Date.now())");
code = code.replace("fetch('/api/library-items?type=phrase')", "fetch('/api/library-items?type=phrase&t=' + Date.now())");
code = code.replace("fetch('/api/sentences')", "fetch('/api/sentences?t=' + Date.now())");

fs.writeFileSync('src/app/page.tsx', code);
console.log('Patched dashboard cache');
