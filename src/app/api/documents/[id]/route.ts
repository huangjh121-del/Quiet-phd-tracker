import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { deleteFromR2 } from '@/lib/r2';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DATABASE_ID = process.env.CLOUDFLARE_DATABASE_ID;
const TOKEN = process.env.CLOUDFLARE_D1_TOKEN;

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
    throw new Error(data.errors?.[0]?.message || 'Database error');
  }
  return data.result[0].results;
}

// GET: Get document details
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const results = await queryD1('SELECT * FROM documents WHERE id = ? AND user_id = ?', [id, userId]);

    if (!results || results.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ document: results[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update reading progress
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { readingProgress, totalProgress, percentage } = body;

    const now = Date.now();
    let updates = ['last_read_at = ?'];
    let sqlParams: any[] = [now];

    if (readingProgress !== undefined) {
      updates.push('reading_progress = ?');
      sqlParams.push(readingProgress);
    }
    if (totalProgress !== undefined) {
      updates.push('total_progress = ?');
      sqlParams.push(totalProgress);
    }
    if (percentage !== undefined) {
      updates.push('percentage = ?');
      sqlParams.push(percentage);
    }

    sqlParams.push(id, userId);
    const sql = `UPDATE documents SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;

    await queryD1(sql, sqlParams);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete document
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const results = await queryD1('SELECT * FROM documents WHERE id = ? AND user_id = ?', [id, userId]);

    if (results && results.length > 0) {
      const doc = results[0];
      if (doc.file_key) {
        try {
          await deleteFromR2(doc.file_key);
        } catch (e) {
          console.error('Failed to delete file from R2:', e);
        }
      }
      await queryD1('DELETE FROM documents WHERE id = ? AND user_id = ?', [id, userId]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
