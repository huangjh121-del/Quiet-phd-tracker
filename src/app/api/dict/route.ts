import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { r2 } from '@/lib/r2';
import zlib from 'zlib';

// In-memory cache for loaded prefix dictionaries
const oaldCache = new Map<string, Record<string, string>>();
const collocCache = new Map<string, Record<string, string>>();
const MAX_CACHE = 120;

function getPrefix(word: string): string {
  const clean = (word || '').toLowerCase().trim();
  if (!clean) return '_other';
  if (!/^[a-z]/.test(clean)) return '_other';
  if (clean.length === 1) return clean;
  const p = clean.slice(0, 2);
  return /^[a-z]{2}$/.test(p) ? p : clean[0];
}

const bucketName = 
  process.env.R2_BUCKET_NAME || 
  process.env.CF_R2_BUCKET || 
  'quiet-tracker-storage';

async function fetchShard(type: 'oald' | 'collocation', prefix: string): Promise<Record<string, string> | null> {
  const cache = type === 'oald' ? oaldCache : collocCache;
  if (cache.has(prefix)) {
    return cache.get(prefix)!;
  }

  try {
    const res = await r2.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: `dict/${type}/${prefix}.json.gz`,
    }));

    if (!res.Body) return null;
    const bytes = await res.Body.transformToByteArray();
    const unzipped = zlib.gunzipSync(Buffer.from(bytes));
    const map = JSON.parse(unzipped.toString('utf-8'));

    if (cache.size >= MAX_CACHE) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    cache.set(prefix, map);
    return map;
  } catch (err: any) {
    if (err.name !== 'NoSuchKey') {
      console.warn(`[dict API] Error fetching ${type} shard for ${prefix}:`, err.message);
    }
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawWord = searchParams.get('word');

  if (!rawWord) {
    return NextResponse.json({ error: 'Word is required' }, { status: 400 });
  }

  const word = rawWord.trim().toLowerCase();
  const prefix = getPrefix(word);

  try {
    // 1. Check Oxford Advanced Learner's Dictionary (OALD10)
    let oaldMap = await fetchShard('oald', prefix);
    let definitionHtml = oaldMap?.[word] || oaldMap?.[rawWord.trim()];

    // Handle OALD10 redirection links (e.g. @@@LINK=word)
    if (definitionHtml && definitionHtml.startsWith('@@@LINK=')) {
      const linkWord = definitionHtml.replace('@@@LINK=', '').trim().toLowerCase();
      const linkPrefix = getPrefix(linkWord);
      const linkMap = linkPrefix === prefix ? oaldMap : await fetchShard('oald', linkPrefix);
      definitionHtml = linkMap?.[linkWord] || definitionHtml;
    }

    // 2. If not found in OALD, check Oxford Collocations
    if (!definitionHtml) {
      const collocMap = await fetchShard('collocation', prefix);
      definitionHtml = collocMap?.[word] || collocMap?.[rawWord.trim()];
    }

    if (definitionHtml) {
      // Fix relative assets to public folder
      let html = definitionHtml;
      html = html.replace(/href="oald10\.css"/g, 'href="/oald10.css"');
      html = html.replace(/src="oald10\.js"/g, 'src="/oald10.js"');

      return NextResponse.json({ html });
    }

    return NextResponse.json({ error: 'Not found in Oxford dictionary' }, { status: 404 });
  } catch (error: any) {
    console.error('[dict API] Lookup error:', error);
    return NextResponse.json({ error: 'Dictionary lookup failed' }, { status: 500 });
  }
}
