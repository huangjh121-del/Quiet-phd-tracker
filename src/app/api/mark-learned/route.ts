import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { type, id, nextReviewAt } = await request.json();
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const DB_ID = process.env.CLOUDFLARE_DATABASE_ID;
    const TOKEN = process.env.CLOUDFLARE_D1_TOKEN;
    
    const tableName = type === 'phrase' ? 'saved_phrases' : 'saved_words';
    const idColumn = type === 'phrase' ? 'id' : 'word';

    const payload = {
      sql: `UPDATE ${tableName} SET ${type === "phrase" ? "repetitions" : "repetition"} = 1, next_review_at = ? WHERE ${idColumn} = ?`,
      params: [nextReviewAt, id]
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
