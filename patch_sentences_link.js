const fs = require('fs');
let code = fs.readFileSync('src/app/sentences/page.tsx', 'utf8');

const oldHref = "const href = book ? `/reader?id=${book.id}` : '#';";
const newHref = "const href = book ? `/reader?id=${book.id}&highlight=${encodeURIComponent(item.sentence)}` : '#';";

code = code.replace(oldHref, newHref);
fs.writeFileSync('src/app/sentences/page.tsx', code);
console.log('Patched sentences link');
