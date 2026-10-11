import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { r2 } from '@/lib/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';

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

    const doc = results[0];
    if (!doc.file_key) {
      return NextResponse.json({ error: 'No file associated with document' }, { status: 400 });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: doc.file_key
    });

    const s3Response = await r2.send(command);

    // Stream the body directly
    const body = s3Response.Body;
    if (!body) {
      return NextResponse.json({ error: 'File stream empty' }, { status: 404 });
    }

    // Convert node stream/web stream to Response
    const responseHeaders = new Headers();
    if (s3Response.ContentType) responseHeaders.set('Content-Type', s3Response.ContentType);
    if (s3Response.ContentLength) responseHeaders.set('Content-Length', s3Response.ContentLength.toString());
    responseHeaders.set('Content-Disposition', `inline; filename="${encodeURIComponent(doc.file_name || 'document')}"`);
    responseHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');

    // @ts-ignore
    return new Response(body.transformToWebStream ? await body.transformToWebStream() : body, {
      headers: responseHeaders
    });
  } catch (error: any) {
    console.error('File stream error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
