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

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Netlify-CDN-Cache-Control': 'no-store',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// GET: List all user's documents (books or articles)
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ documents: [] }, { headers: NO_CACHE_HEADERS });
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
    return NextResponse.json({ documents: results }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Fetch documents error:', error);
    return NextResponse.json({ error: error.message, documents: [] }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

// POST: Register a new document
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_CACHE_HEADERS });
    }

    const body = await req.json();
    let { id, type, title, author, fileName, fileKey, content, totalProgress, readingProgress, percentage } = body;

    if (!type || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const docId = id || Date.now().toString();
    const now = Date.now();
    const percentVal = typeof percentage === 'number' ? percentage : 0;
    const progressVal = readingProgress ? String(readingProgress) : '';

    const sql = `
      INSERT INTO documents (id, user_id, type, title, author, file_name, file_key, content, reading_progress, total_progress, percentage, created_at, last_read_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        author = excluded.author,
        content = CASE WHEN excluded.content != '' THEN excluded.content ELSE documents.content END,
        percentage = CASE WHEN excluded.percentage > 0 THEN excluded.percentage ELSE documents.percentage END,
        reading_progress = CASE WHEN excluded.reading_progress != '' THEN excluded.reading_progress ELSE documents.reading_progress END,
        last_read_at = excluded.last_read_at
    `;
    const params = [
      docId,
      userId,
      type,
      title,
      author || '',
      fileName || '',
      fileKey || '',
      content || '',
      progressVal,
      totalProgress || '',
      percentVal,
      now,
      now
    ];

    await queryD1(sql, params);
    return NextResponse.json({ success: true, id: docId, document: { id: docId, type, title, content, percentage: percentVal } }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Create document error:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
