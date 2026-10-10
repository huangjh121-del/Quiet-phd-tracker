const fs = require('fs');
let code = fs.readFileSync('src/app/review/phrases/page.tsx', 'utf8');

code = code.replace(
  'const newPhrases = items.filter(i => i.repetition === 0);',
  'const newPhrases = items.filter(i => i.repetitions === 0 || i.repetitions === undefined);'
);

code = code.replace(
  'const duePhrases = items.filter(i => i.repetition > 0 && i.next_review_at <= now);',
  'const duePhrases = items.filter(i => i.repetitions > 0 && i.next_review_at <= now);'
);

code = code.replace(
  'const learnedPhrases = items.filter(i => i.repetition > 0);',
  'const learnedPhrases = items.filter(i => i.repetitions > 0);'
);

// Check if there are any other 'i.repetition'
code = code.replace(/i\.repetition/g, 'i.repetitions');

fs.writeFileSync('src/app/review/phrases/page.tsx', code);
console.log('Fixed filters');
