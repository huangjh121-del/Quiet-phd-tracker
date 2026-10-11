import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPresignedUploadUrl } from '@/lib/r2';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileName, contentType } = await req.json();
    if (!fileName) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    // Isolate by userId/uuid-filename
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileKey = `${userId}/${Date.now()}-${cleanFileName}`;

    const uploadUrl = await getPresignedUploadUrl(fileKey, contentType || 'application/octet-stream');

    return NextResponse.json({ uploadUrl, fileKey });
  } catch (error: any) {
    console.error('Presigned URL error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
