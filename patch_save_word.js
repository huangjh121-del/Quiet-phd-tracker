const fs = require('fs');
let code = fs.readFileSync('src/app/api/save-word/route.ts', 'utf8');

code = code.replace(
  'const { word, htmlDefinition } = body;',
  'const { word, htmlDefinition, context } = body;'
);

code = code.replace(
  'sql: "INSERT INTO saved_words (word, html_definition, saved_at, next_review_at, interval, repetition, ease_factor) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(word) DO NOTHING",\n      params: [word, htmlDefinition || "", now, nextReviewAt, 1, 0, 2.5]',
  'sql: "INSERT INTO saved_words (word, html_definition, context, saved_at, next_review_at, interval, repetition, ease_factor) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(word) DO NOTHING",\n      params: [word, htmlDefinition || "", context || "", now, nextReviewAt, 1, 0, 2.5]'
);

fs.writeFileSync('src/app/api/save-word/route.ts', code);
console.log("Updated save-word API");
