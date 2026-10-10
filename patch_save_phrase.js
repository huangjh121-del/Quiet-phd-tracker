const fs = require('fs');
let code = fs.readFileSync('src/app/api/save-phrase/route.ts', 'utf8');

const insertLogic = `const payload = {
      sql: "INSERT INTO saved_phrases (id, phrase, context, source_title, saved_at, next_review_at) VALUES (?, ?, ?, ?, ?, ?)",
      params: [id, phrase, context, sourceTitle || 'Unknown', now, now]
    };`;

const newLogic = `
    // Check for duplicates first
    const checkPayload = {
      sql: "SELECT id FROM saved_phrases WHERE phrase = ? LIMIT 1",
      params: [phrase]
    };
    const checkRes = await fetch(\`https://api.cloudflare.com/client/v4/accounts/\${ACCOUNT_ID}/d1/database/\${DB_ID}/query\`, {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${TOKEN}\`, 'Content-Type': 'application/json' },
      body: JSON.stringify(checkPayload)
    });
    const checkData = await checkRes.json();
    if (checkData.success && checkData.result[0].results.length > 0) {
      // Already exists, just return success
      return NextResponse.json({ success: true, message: 'Already exists' });
    }

    const payload = {
      sql: "INSERT INTO saved_phrases (id, phrase, context, source_title, saved_at, next_review_at) VALUES (?, ?, ?, ?, ?, ?)",
      params: [id, phrase, context, sourceTitle || 'Unknown', now, now]
    };`;

code = code.replace(insertLogic, newLogic);
fs.writeFileSync('src/app/api/save-phrase/route.ts', code);
console.log('Patched save-phrase');
