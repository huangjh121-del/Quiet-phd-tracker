import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const DB_ID = process.env.CLOUDFLARE_DATABASE_ID;
    const TOKEN = process.env.CLOUDFLARE_D1_TOKEN;

    if (!ACCOUNT_ID || !DB_ID || !TOKEN) {
      return NextResponse.json({ error: 'Config missing', sentences: [] }, { status: 500 });
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
    
    return NextResponse.json({ sentences: data.result[0]?.results || [] });
  } catch (err: any) {
    console.error("Error in /api/sentences:", err);
    return NextResponse.json({ error: err.message, sentences: [] }, { status: 500 });
  }
}
