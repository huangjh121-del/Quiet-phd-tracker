const fs = require('fs');
const dir = 'src/app/api/delete-item';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const code = `import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { type, id } = await req.json();
    if (!type || !id) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const DB_ID = process.env.CLOUDFLARE_DATABASE_ID;
    const TOKEN = process.env.CLOUDFLARE_D1_TOKEN;

    let tableName, idColumn;
    if (type === 'word') {
      tableName = 'saved_words';
      idColumn = 'word';
    } else if (type === 'phrase') {
      tableName = 'saved_phrases';
      idColumn = 'id';
    } else if (type === 'sentence') {
      tableName = 'saved_sentences';
      idColumn = 'id';
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const payload = {
      sql: \`DELETE FROM \${tableName} WHERE \${idColumn} = ?\`,
      params: [id]
    };

    const res = await fetch(\`https://api.cloudflare.com/client/v4/accounts/\${ACCOUNT_ID}/d1/database/\${DB_ID}/query\`, {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${TOKEN}\`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!data.success) throw new Error('D1 error');
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}`;

fs.writeFileSync(dir + '/route.ts', code);
console.log('Created delete api');
