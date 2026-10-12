import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DATABASE_ID = process.env.CLOUDFLARE_DATABASE_ID;
const TOKEN = process.env.CLOUDFLARE_D1_TOKEN;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Netlify-CDN-Cache-Control': 'no-store',
  'Pragma': 'no-cache',
  'Expires': '0',
};

async function queryD1(sql: string, params: any[] = []) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`, {
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
  return data.result[0].results;
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ stats: null }, { headers: NO_CACHE_HEADERS });
    }

    const rows = await queryD1(
      'SELECT stats_json FROM user_reading_stats WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (rows && rows.length > 0 && rows[0].stats_json) {
      const stats = JSON.parse(rows[0].stats_json);
      return NextResponse.json({ stats }, { headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ stats: null }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Error fetching reading stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, reason: 'unauthorized' });
    }

    const body = await req.json();
    const { stats } = body;
    if (!stats) {
      return NextResponse.json({ error: 'Missing stats' }, { status: 400 });
    }

    const statsJson = typeof stats === 'string' ? stats : JSON.stringify(stats);
    const now = Date.now();

    await queryD1(
      `INSERT INTO user_reading_stats (user_id, stats_json, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         stats_json = excluded.stats_json,
         updated_at = excluded.updated_at`,
      [userId, statsJson, now]
    );

    return NextResponse.json({ success: true }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    console.error('Error updating reading stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
