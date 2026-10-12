import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Netlify-CDN-Cache-Control': 'no-store',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(req: Request) {
  try {
    const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const DB_ID = process.env.CLOUDFLARE_DATABASE_ID;
    const TOKEN = process.env.CLOUDFLARE_D1_TOKEN;

    if (!ACCOUNT_ID || !DB_ID || !TOKEN) {
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ items: [] }, { headers: NO_CACHE_HEADERS });
    }

    const { searchParams } = new URL(req.url);
    const beforeParam = searchParams.get('before');
    let cutoff = beforeParam ? Number(beforeParam) : 0;
    if (!cutoff || isNaN(cutoff)) {
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      cutoff = endOfToday.getTime();
    }

    // Only return items that have already been learned (repetition > 0) and are due on or before cutoff for this user
    const sqlWords = "SELECT * FROM saved_words WHERE user_id = ? AND (repetition > 0) AND next_review_at <= ? ORDER BY next_review_at ASC";
    const paramsWords = [userId, cutoff];

    const sqlPhrases = "SELECT * FROM saved_phrases WHERE user_id = ? AND (repetitions > 0) AND next_review_at <= ? ORDER BY next_review_at ASC";
    const paramsPhrases = [userId, cutoff];

    const fetchD1 = (payload: any) => fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => res.json());

    const [wordsRes, phrasesRes] = await Promise.all([
      fetchD1({ sql: sqlWords, params: paramsWords }), 
      fetchD1({ sql: sqlPhrases, params: paramsPhrases })
    ]);

    const words = wordsRes.success ? (wordsRes.result[0]?.results || []).map((w: any) => ({ ...w, type: 'word' })) : [];
    const phrases = phrasesRes.success ? (phrasesRes.result[0]?.results || []).map((p: any) => ({ ...p, type: 'phrase' })) : [];

    // Combine and sort by how overdue they are
    const combined = [...words, ...phrases].sort((a, b) => a.next_review_at - b.next_review_at);
    const seen = new Set<string>();
    const uniqueCombined = combined.filter((item: any) => {
      const text = item.type === 'word' ? (item.word || '') : (item.phrase || '');
      const key = `${item.type}:${text.trim().toLowerCase()}`;
      if (!text || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ items: uniqueCombined }, { headers: NO_CACHE_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
