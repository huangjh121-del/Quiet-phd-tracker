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

    const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const DB_ID = process.env.CLOUDFLARE_DATABASE_ID;
    const TOKEN = process.env.CLOUDFLARE_D1_TOKEN;

    if (!ACCOUNT_ID || !DB_ID || !TOKEN) {
      return NextResponse.json({ error: 'Config missing', sentences: [] }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    const payload = userId 
      ? { 
          sql: "SELECT * FROM saved_sentences WHERE user_id = ? OR user_id = 'public' ORDER BY saved_at DESC",
          params: [userId]
        }
      : { 
          sql: "SELECT * FROM saved_sentences WHERE user_id = 'public' ORDER BY saved_at DESC",
          params: []
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
      console.error("D1 query error in /api/sentences:", data.errors);
      throw new Error(data.errors?.[0]?.message || 'D1 error');
    }
    
    const rawResults = data.result[0]?.results || [];
    const seen = new Set<string>();
    const uniqueSentences = rawResults.filter((s: any) => {
      const key = (s.sentence || '').trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ sentences: uniqueSentences }, { headers: NO_CACHE_HEADERS });
  } catch (err: any) {
    console.error("Error in /api/sentences:", err);
    return NextResponse.json({ error: err.message, sentences: [] }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
