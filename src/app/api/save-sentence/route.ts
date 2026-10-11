import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const uid = userId || 'public';

    const { sentence, sourceTitle, bookId } = await req.json();
    if (!sentence) return NextResponse.json({ error: 'Missing sentence' }, { status: 400 });

    const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const DB_ID = process.env.CLOUDFLARE_DATABASE_ID;
    const TOKEN = process.env.CLOUDFLARE_D1_TOKEN;

    if (!ACCOUNT_ID || !DB_ID || !TOKEN) {
      return NextResponse.json({ error: 'Config missing' }, { status: 500 });
    }

    const cleanSentence = sentence.trim();

    // Check for duplicates first (case-insensitive & whitespace trimmed)
    const checkPayload = {
      sql: "SELECT id FROM saved_sentences WHERE LOWER(TRIM(sentence)) = LOWER(TRIM(?)) AND (user_id = ? OR user_id = 'public') LIMIT 1",
      params: [cleanSentence, uid]
    };
    const checkRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(checkPayload)
    });
    const checkData = await checkRes.json();
    if (checkData.success && checkData.result[0]?.results?.length > 0) {
      return NextResponse.json({ success: true, message: 'already_saved', id: checkData.result[0].results[0].id });
    }

    const id = crypto.randomUUID();
    const now = Date.now();
    
    const payload = {
      sql: "INSERT INTO saved_sentences (id, sentence, source_title, book_id, saved_at, user_id) VALUES (?, ?, ?, ?, ?, ?)",
      params: [id, cleanSentence, sourceTitle || 'Unknown', bookId || null, now, uid]
    };

    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!data.success) {
      console.error("D1 save sentence error:", data.errors);
      throw new Error(data.errors?.[0]?.message || 'D1 error');
    }
    
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error("Save sentence error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
