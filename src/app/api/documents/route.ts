import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DATABASE_ID = process.env.CLOUDFLARE_DATABASE_ID;
const TOKEN = process.env.CLOUDFLARE_D1_TOKEN;

async function queryD1(sql: string, params: any[] = []) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sql, params })
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.errors?.[0]?.message || 'Database error');
  }
  return data.result[0].results;
}

// GET: List all user's documents (books or articles)
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'book' or 'article'

    let sql = 'SELECT * FROM documents WHERE user_id = ?';
    const params: any[] = [userId];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    sql += ' ORDER BY last_read_at DESC';

    const results = await queryD1(sql, params);
    return NextResponse.json({ documents: results });
  } catch (error: any) {
    console.error('Fetch documents error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Register a new document
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, type, title, author, fileName, fileKey, content, totalProgress } = body;

    if (!id || !type || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const now = Date.now();
    const sql = `
      INSERT INTO documents (id, user_id, type, title, author, file_name, file_key, content, reading_progress, total_progress, percentage, created_at, last_read_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      id,
      userId,
      type,
      title,
      author || '',
      fileName || '',
      fileKey || '',
      content || '',
      '',
      totalProgress || '',
      0,
      now,
      now
    ];

    await queryD1(sql, params);
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Create document error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
