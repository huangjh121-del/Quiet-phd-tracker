import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { word, htmlDefinition, context } = body;

    if (!word) {
      return NextResponse.json({ error: 'Word is required' }, { status: 400 });
    }

    const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const DB_ID = process.env.CLOUDFLARE_DATABASE_ID;
    const TOKEN = process.env.CLOUDFLARE_D1_TOKEN;

    if (!ACCOUNT_ID || !DB_ID || !TOKEN) {
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });
    }

    const cleanWord = word.trim().toLowerCase();

    // Check if word already saved for this user
    const checkPayload = {
      sql: "SELECT word FROM saved_words WHERE LOWER(TRIM(word)) = ? AND user_id = ? LIMIT 1",
      params: [cleanWord, userId]
    };
    const checkRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(checkPayload)
    });
    const checkData = await checkRes.json();
    if (checkData.success && checkData.result[0]?.results?.length > 0) {
      return NextResponse.json({ success: true, message: 'already_saved' });
    }

    const now = Date.now();
    const nextReviewAt = now;
    
    const payload = {
      sql: "INSERT INTO saved_words (word, html_definition, context, saved_at, next_review_at, interval, repetition, ease_factor, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(word, user_id) DO NOTHING",
      params: [cleanWord, htmlDefinition || "", (context || "").trim(), now, nextReviewAt, 1, 0, 2.5, userId]
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
      console.error("D1 Error in save-word:", JSON.stringify(data.errors, null, 2));
      return NextResponse.json({ error: 'Failed to save to D1', details: data.errors }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("save-word API Route Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
