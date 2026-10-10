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

  const sql = "ALTER TABLE saved_words ADD COLUMN context TEXT DEFAULT '';";

  const response = await fetch("https://api.cloudflare.com/client/v4/accounts/" + accountId + "/d1/database/" + dbId + "/query", {
    method: 'POST',
    headers: {
      'Authorization': "Bearer " + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql })
  });
  console.log(await response.json());
}
run();
