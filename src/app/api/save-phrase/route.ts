import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phrase, context, sourceTitle, meaning } = await req.json();
    if (!phrase) return NextResponse.json({ error: 'Missing phrase' }, { status: 400 });

    const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const DB_ID = process.env.CLOUDFLARE_DATABASE_ID;
    const TOKEN = process.env.CLOUDFLARE_D1_TOKEN;

    if (!ACCOUNT_ID || !DB_ID || !TOKEN) {
      return NextResponse.json({ error: 'Config missing' }, { status: 500 });
    }

    const cleanPhrase = phrase.trim();
    const cleanContext = (context || cleanPhrase).trim();
    const cleanMeaning = typeof meaning === 'string' ? meaning.trim() : '';

    // Check for duplicates first (case-insensitive & trimmed per user)
    const checkPayload = {
      sql: "SELECT id FROM saved_phrases WHERE LOWER(TRIM(phrase)) = LOWER(TRIM(?)) AND user_id = ? LIMIT 1",
      params: [cleanPhrase, userId]
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
      sql: "INSERT INTO saved_phrases (id, phrase, context, source_title, saved_at, next_review_at, user_id, meaning) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      params: [id, cleanPhrase, cleanContext, sourceTitle || 'Unknown', now, now, userId, cleanMeaning]
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
      console.error("D1 save phrase error:", data.errors);
      throw new Error(data.errors?.[0]?.message || 'D1 error');
    }
    
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error("Save phrase error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
