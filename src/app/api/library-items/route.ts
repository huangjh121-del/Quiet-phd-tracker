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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ items: [] }, { headers: NO_CACHE_HEADERS });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'word';
    
    const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const DB_ID = process.env.CLOUDFLARE_DATABASE_ID;
    const TOKEN = process.env.CLOUDFLARE_D1_TOKEN;

    if (!ACCOUNT_ID || !DB_ID || !TOKEN) {
      return NextResponse.json({ error: 'Config missing', items: [] }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    const tableName = type === 'word' ? 'saved_words' : 'saved_phrases';
    const payload = {
      sql: `SELECT * FROM ${tableName} WHERE user_id = ? ORDER BY saved_at DESC`,
      params: [userId]
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
    
    const rawItems = data.result[0]?.results || [];
    const seen = new Set<string>();
    const uniqueItems = rawItems.filter((item: any) => {
      const text = type === 'word' ? (item.word || '') : (item.phrase || '');
      const key = text.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ items: uniqueItems }, { headers: NO_CACHE_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, items: [] }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
