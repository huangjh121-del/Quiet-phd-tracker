const fs = require('fs');

async function migrate() {
  const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
  const DB_ID = process.env.CLOUDFLARE_DATABASE_ID;
  const TOKEN = process.env.CLOUDFLARE_D1_TOKEN;

  if (!ACCOUNT_ID || !DB_ID || !TOKEN) {
    console.error('Missing CF env vars');
    return;
  }

  const queries = [
    "ALTER TABLE saved_words ADD COLUMN user_id TEXT DEFAULT 'public';",
    "ALTER TABLE saved_phrases ADD COLUMN user_id TEXT DEFAULT 'public';",
    "ALTER TABLE saved_sentences ADD COLUMN user_id TEXT DEFAULT 'public';"
  ];

  for (const sql of queries) {
    const payload = { sql, params: [] };
    try {
      const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log(sql, data.success ? 'SUCCESS' : data.errors);
    } catch (e) {
      console.error(e);
    }
  }
}

migrate();
