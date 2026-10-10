const fs = require('fs');

const paths = [
  'src/app/api/save-word/route.ts',
  'src/app/api/save-phrase/route.ts',
  'src/app/api/save-sentence/route.ts',
  'src/app/api/library-items/route.ts',
  'src/app/api/sentences/route.ts',
  'src/app/api/delete-item/route.ts',
  'src/app/api/mark-learned/route.ts'
];

paths.forEach(p => {
  let code = fs.readFileSync(p, 'utf8');
  
  if (!code.includes("@clerk/nextjs/server")) {
    code = code.replace("import { NextResponse } from 'next/server';", "import { NextResponse } from 'next/server';\nimport { auth } from '@clerk/nextjs/server';");
  }

  const authCheck = `\n    const { userId } = await auth();\n    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });\n`;
  if (!code.includes("const { userId } = await auth();")) {
    // Some endpoints have multiple exports (GET/POST) so we replace all try {
    code = code.replaceAll("try {", "try {" + authCheck);
  }

  // save-word
  if (p.includes('save-word')) {
    code = code.replace("VALUES (?, ?, ?, ?, ?, ?, ?, ?)", "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    code = code.replace("INTO saved_words (word, html_definition, context, saved_at, next_review_at, interval, repetition, ease_factor)", "INTO saved_words (word, html_definition, context, saved_at, next_review_at, interval, repetition, ease_factor, user_id)");
    code = code.replace("params: [word, htmlDefinition || \"\", context || \"\", now, nextReviewAt, 1, 0, 2.5]", "params: [word, htmlDefinition || \"\", context || \"\", now, nextReviewAt, 1, 0, 2.5, userId]");
  }
  
  // save-phrase
  if (p.includes('save-phrase')) {
    code = code.replace(
      "SELECT id FROM saved_phrases WHERE phrase = ?",
      "SELECT id FROM saved_phrases WHERE phrase = ? AND user_id = ?"
    );
    code = code.replace(
      "params: [phrase]",
      "params: [phrase, userId]"
    );
    code = code.replace(
      "INSERT INTO saved_phrases (id, phrase, translation, saved_at, next_review_at, interval, repetitions, ease_factor) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      "INSERT INTO saved_phrases (id, phrase, translation, saved_at, next_review_at, interval, repetitions, ease_factor, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    code = code.replace(
      "params: [id, phrase, translation || '', now, nextReviewAt, 1, 0, 2.5]",
      "params: [id, phrase, translation || '', now, nextReviewAt, 1, 0, 2.5, userId]"
    );
  }

  // save-sentence
  if (p.includes('save-sentence')) {
    code = code.replace(
      "SELECT id FROM saved_sentences WHERE sentence = ?",
      "SELECT id FROM saved_sentences WHERE sentence = ? AND user_id = ?"
    );
    code = code.replace(
      "params: [sentence]",
      "params: [sentence, userId]"
    );
    code = code.replace(
      "INSERT INTO saved_sentences (id, sentence, source_title, saved_at) VALUES (?, ?, ?, ?)",
      "INSERT INTO saved_sentences (id, sentence, source_title, saved_at, user_id) VALUES (?, ?, ?, ?, ?)"
    );
    code = code.replace(
      "params: [id, sentence, sourceTitle || 'Unknown', now]",
      "params: [id, sentence, sourceTitle || 'Unknown', now, userId]"
    );
  }

  // library-items
  if (p.includes('library-items')) {
    code = code.replace("SELECT * FROM saved_words ORDER BY saved_at DESC", "SELECT * FROM saved_words WHERE user_id = ? ORDER BY saved_at DESC");
    code = code.replace("SELECT * FROM saved_phrases ORDER BY saved_at DESC", "SELECT * FROM saved_phrases WHERE user_id = ? ORDER BY saved_at DESC");
    code = code.replaceAll("params: []", "params: [userId]");
  }

  // sentences
  if (p.includes('sentences/route.ts')) {
    code = code.replace("SELECT * FROM saved_sentences ORDER BY saved_at DESC", "SELECT * FROM saved_sentences WHERE user_id = ? ORDER BY saved_at DESC");
    code = code.replaceAll("params: []", "params: [userId]");
  }

  // delete-item
  if (p.includes('delete-item')) {
    code = code.replace("DELETE FROM saved_words WHERE word = ?", "DELETE FROM saved_words WHERE word = ? AND user_id = ?");
    code = code.replace("DELETE FROM saved_phrases WHERE id = ?", "DELETE FROM saved_phrases WHERE id = ? AND user_id = ?");
    code = code.replace("DELETE FROM saved_sentences WHERE id = ?", "DELETE FROM saved_sentences WHERE id = ? AND user_id = ?");
    code = code.replaceAll("params: [id]", "params: [id, userId]");
  }

  // mark-learned
  if (p.includes('mark-learned')) {
    code = code.replace(
      "SET next_review_at = ?, interval = ?, repetition = ?, ease_factor = ? WHERE word = ?",
      "SET next_review_at = ?, interval = ?, repetition = ?, ease_factor = ? WHERE word = ? AND user_id = ?"
    );
    code = code.replace(
      "SET next_review_at = ?, interval = ?, repetitions = ?, ease_factor = ? WHERE id = ?",
      "SET next_review_at = ?, interval = ?, repetitions = ?, ease_factor = ? WHERE id = ? AND user_id = ?"
    );
    code = code.replaceAll(
      "params: [nextReviewAt, interval, repetition, easeFactor, id]",
      "params: [nextReviewAt, interval, repetition, easeFactor, id, userId]"
    );
  }

  fs.writeFileSync(p, code);
  console.log('Updated ' + p);
});
