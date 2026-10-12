import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, id } = await req.json();
    if (!type || !id) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const DB_ID = process.env.CLOUDFLARE_DATABASE_ID;
    const TOKEN = process.env.CLOUDFLARE_D1_TOKEN;

    if (!ACCOUNT_ID || !DB_ID || !TOKEN) {
      return NextResponse.json({ error: 'Config missing' }, { status: 500 });
    }

    let tableName: string, idColumn: string;
    if (type === 'word') {
      tableName = 'saved_words';
      idColumn = 'word';
    } else if (type === 'phrase') {
      tableName = 'saved_phrases';
      idColumn = 'id';
    } else if (type === 'sentence') {
      tableName = 'saved_sentences';
      idColumn = 'id';
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // Match by ID / word and ensure user ownership
    const payload = {
      sql: `DELETE FROM ${tableName} WHERE ${idColumn} = ? AND user_id = ?`,
      params: [id, userId]
    };

    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!data.success) {
      console.error("D1 delete error:", data.errors);
      throw new Error(data.errors?.[0]?.message || 'D1 error');
    }
    
    return NextResponse.json({ success: true, changes: data.result[0]?.meta?.changes || 0 });
  } catch (err: any) {
    console.error("Delete-item error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}