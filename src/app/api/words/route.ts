import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const DB_ID = process.env.CLOUDFLARE_DATABASE_ID;
    const TOKEN = process.env.CLOUDFLARE_D1_TOKEN;

    if (!ACCOUNT_ID || !DB_ID || !TOKEN) {
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });
    }

    const now = Date.now();
    
    const payloadWords = { sql: "SELECT * FROM saved_words WHERE next_review_at <= ? ORDER BY next_review_at ASC", params: [now] };
    const payloadPhrases = { sql: "SELECT * FROM saved_phrases WHERE next_review_at <= ? ORDER BY next_review_at ASC", params: [now] };

    const fetchD1 = (payload: any) => fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => res.json());

    const [wordsRes, phrasesRes] = await Promise.all([fetchD1(payloadWords), fetchD1(payloadPhrases)]);

    const words = wordsRes.success ? (wordsRes.result[0]?.results || []).map((w: any) => ({ ...w, type: 'word' })) : [];
    const phrases = phrasesRes.success ? (phrasesRes.result[0]?.results || []).map((p: any) => ({ ...p, type: 'phrase' })) : [];

    // Combine and sort by how overdue they are
    const combined = [...words, ...phrases].sort((a, b) => a.next_review_at - b.next_review_at);

    return NextResponse.json({ items: combined });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
