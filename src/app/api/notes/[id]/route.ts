import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { note } = await req.json();

    const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const DB_ID = process.env.CLOUDFLARE_DATABASE_ID;
    const TOKEN = process.env.CLOUDFLARE_D1_TOKEN;

    if (!ACCOUNT_ID || !DB_ID || !TOKEN) {
      return NextResponse.json({ error: 'Config missing' }, { status: 500 });
    }

    const now = Date.now();
    const sql = "UPDATE reading_notes SET note = ?, updated_at = ? WHERE id = ? AND user_id = ?";
    const sqlParams = [note ? note.trim() : '', now, id, userId];

    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql, params: sqlParams })
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || 'D1 update error');
    }

    return NextResponse.json({ success: true, updated_at: now });
  } catch (err: any) {
    console.error("PATCH /api/notes/[id] error:", err);
    return NextResponse.json({ error: err.message || 'Internal Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const DB_ID = process.env.CLOUDFLARE_DATABASE_ID;
    const TOKEN = process.env.CLOUDFLARE_D1_TOKEN;

    if (!ACCOUNT_ID || !DB_ID || !TOKEN) {
      return NextResponse.json({ error: 'Config missing' }, { status: 500 });
    }

    const sql = "DELETE FROM reading_notes WHERE id = ? AND user_id = ?";
    const sqlParams = [id, userId];

    const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql, params: sqlParams })
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.errors?.[0]?.message || 'D1 delete error');
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/notes/[id] error:", err);
    return NextResponse.json({ error: err.message || 'Internal Error' }, { status: 500 });
  }
}
