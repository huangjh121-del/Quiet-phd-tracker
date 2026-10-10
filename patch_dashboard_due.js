const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

const oldDueWords = `dueWords: words.filter((w: any) => w.next_review_at <= now).length,`;
const newDueWords = `dueWords: words.filter((w: any) => (w.repetition || 0) > 0 && w.next_review_at <= now).length,`;

const oldDuePhrases = `duePhrases: phrases.filter((p: any) => p.next_review_at <= now).length`;
const newDuePhrases = `duePhrases: phrases.filter((p: any) => (p.repetitions || 0) > 0 && p.next_review_at <= now).length`;

code = code.replace(oldDueWords, newDueWords);
code = code.replace(oldDuePhrases, newDuePhrases);

fs.writeFileSync('src/app/page.tsx', code);
console.log('Patched dashboard due logic');
