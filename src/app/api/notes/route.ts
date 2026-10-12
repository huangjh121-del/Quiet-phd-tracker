import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    const uid = userId || 'public';
    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get('bookId');

    const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const DB_ID = process.env.CLOUDFLARE_DATABASE_ID;
    const TOKEN = process.env.CLOUDFLARE_D1_TOKEN;

    if (!ACCOUNT_ID || !DB_ID || !TOKEN) {
      return NextResponse.json({ error: 'Config missing', notes: [] }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    let sql = "SELECT * FROM reading_notes WHERE (user_id = ? OR user_id = 'public')";
    const params: any[] = [uid];

    if (bookId) {
      sql += " AND book_id = ?";
      params.push(bookId);
    }
    sql += " ORDER BY created_at DESC";

    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql, params })
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || 'D1 error');
    }

    const notes = data.result[0]?.results || [];
    return NextResponse.json({ notes }, { headers: NO_CACHE_HEADERS });
  } catch (err: any) {
    console.error("GET /api/notes error:", err);
    return NextResponse.json({ error: err.message || 'Internal Error', notes: [] }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const uid = userId || 'public';

    const { bookId, sourceTitle, highlightedText, note, location } = await req.json();
    if (!highlightedText || !highlightedText.trim()) {
      return NextResponse.json({ error: 'Missing highlighted text' }, { status: 400 });
    }

    const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const DB_ID = process.env.CLOUDFLARE_DATABASE_ID;
    const TOKEN = process.env.CLOUDFLARE_D1_TOKEN;

    if (!ACCOUNT_ID || !DB_ID || !TOKEN) {
      return NextResponse.json({ error: 'Config missing' }, { status: 500 });
    }

    const id = `note_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = Date.now();

    const sql = `
      INSERT INTO reading_notes (id, user_id, book_id, source_title, highlighted_text, note, location, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      id,
      uid,
      bookId || '',
      sourceTitle || 'Untitled Document',
      highlightedText.trim(),
      note ? note.trim() : '',
      location ? String(location) : '',
      now,
      now
    ];

    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql, params })
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || 'D1 save note error');
    }

    return NextResponse.json({
      success: true,
      note: {
        id,
        user_id: uid,
        book_id: bookId || '',
        source_title: sourceTitle || 'Untitled Document',
        highlighted_text: highlightedText.trim(),
        note: note ? note.trim() : '',
        location: location ? String(location) : '',
        created_at: now,
        updated_at: now
      }
    });
  } catch (err: any) {
    console.error("POST /api/notes error:", err);
    return NextResponse.json({ error: err.message || 'Internal Error' }, { status: 500 });
  }
}
