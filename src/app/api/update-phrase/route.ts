import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id, phrase, meaning } = await req.json();

    if (!id && !phrase) {
      return NextResponse.json({ error: 'Missing id or phrase' }, { status: 400 });
    }

    const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const DB_ID = process.env.CLOUDFLARE_DATABASE_ID;
    const TOKEN = process.env.CLOUDFLARE_D1_TOKEN;

    if (!ACCOUNT_ID || !DB_ID || !TOKEN) {
      return NextResponse.json({ error: 'Server config missing' }, { status: 500 });
    }

    const cleanMeaning = typeof meaning === 'string' ? meaning : '';

    let sql = '';
    let params: any[] = [];

    if (id) {
      sql = "UPDATE saved_phrases SET meaning = ? WHERE id = ? AND user_id = ?";
      params = [cleanMeaning, id, userId];
    } else {
      sql = "UPDATE saved_phrases SET meaning = ? WHERE LOWER(TRIM(phrase)) = LOWER(TRIM(?)) AND user_id = ?";
      params = [cleanMeaning, phrase, userId];
    }

    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql, params })
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || 'Database error');
    }

    return NextResponse.json({ success: true, meaning: cleanMeaning });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
