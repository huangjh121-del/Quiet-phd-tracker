import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    const now = Date.now();
    // SRS Algorithm Phase 1: Initial review in 1 day (86400000 ms)
    const nextReviewAt = now;
    
    // Cloudflare D1 REST API payload
    // We save the word, the timestamps, and the raw HTML definition so the flashcard can render it without re-querying the 450MB database!
    const payload = {
      sql: "INSERT INTO saved_words (word, html_definition, context, saved_at, next_review_at, interval, repetition, ease_factor, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(word) DO NOTHING",
      params: [word, htmlDefinition || "", context || "", now, nextReviewAt, 1, 0, 2.5, userId]
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
      console.error("D1 Error:", JSON.stringify(data.errors, null, 2));
      return NextResponse.json({ error: 'Failed to save to D1', details: data.errors }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("API Route Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
