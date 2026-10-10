import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { phrase, context, sourceTitle } = await req.json();
    if (!phrase || !context) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const DB_ID = process.env.CLOUDFLARE_DATABASE_ID;
    const TOKEN = process.env.CLOUDFLARE_D1_TOKEN;

    if (!ACCOUNT_ID || !DB_ID || !TOKEN) {
      return NextResponse.json({ error: 'Config missing' }, { status: 500 });
    }

    const id = crypto.randomUUID();
    const now = Date.now();
    
    // For phrases, next_review_at is initially just now (due immediately)
    
    // Check for duplicates first
    const checkPayload = {
      sql: "SELECT id FROM saved_phrases WHERE phrase = ? AND user_id = ? LIMIT 1",
      params: [phrase, userId]
    };
    const checkRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(checkPayload)
    });
    const checkData = await checkRes.json();
    if (checkData.success && checkData.result[0].results.length > 0) {
      // Already exists, just return success
      return NextResponse.json({ success: true, message: 'Already exists' });
    }

    const payload = {
      sql: "INSERT INTO saved_phrases (id, phrase, context, source_title, saved_at, next_review_at) VALUES (?, ?, ?, ?, ?, ?)",
      params: [id, phrase, context, sourceTitle || 'Unknown', now, now]
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
    if (!data.success) throw new Error('D1 error');
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
