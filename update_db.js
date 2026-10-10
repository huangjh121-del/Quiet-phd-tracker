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

  const now = Date.now();
  const sql = `UPDATE saved_words SET next_review_at = ${now}`;

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
