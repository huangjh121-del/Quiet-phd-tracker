const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...rest] = line.split('=');
  if (key) acc[key.trim()] = rest.join('=').trim().replace(/"/g, '');
  return acc;
}, {});

async function run() {
  const accountId = env.CLOUDFLARE_ACCOUNT_ID;
  const dbId = env.CLOUDFLARE_DATABASE_ID;
  const token = env.CLOUDFLARE_D1_TOKEN;

  const sql = "CREATE TABLE IF NOT EXISTS saved_phrases (id TEXT PRIMARY KEY, phrase TEXT NOT NULL, context TEXT NOT NULL, source_title TEXT, saved_at INTEGER NOT NULL, next_review_at INTEGER NOT NULL, interval INTEGER DEFAULT 0, ease_factor REAL DEFAULT 2.5, repetitions INTEGER DEFAULT 0); CREATE TABLE IF NOT EXISTS saved_sentences (id TEXT PRIMARY KEY, sentence TEXT NOT NULL, source_title TEXT, saved_at INTEGER NOT NULL);";

  const response = await fetch("https://api.cloudflare.com/client/v4/accounts/" + accountId + "/d1/database/" + dbId + "/query", {
    method: 'POST',
    headers: {
      'Authorization': "Bearer " + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql })
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
