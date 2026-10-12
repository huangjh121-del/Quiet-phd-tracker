import { NextResponse } from 'next/server';

// SM-2 Algorithm implementation
function calculateSM2(quality: number, repetitions: number, easeFactor: number, interval: number) {
  let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEaseFactor < 1.3) newEaseFactor = 1.3;

  let newRepetitions = repetitions;
  let newInterval = interval;

  if (quality < 3) {
    newRepetitions = 0;
    newInterval = 1;
  } else {
    newRepetitions += 1;
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }
  }

  return { newInterval, newRepetitions, newEaseFactor };
}

export async function POST(req: Request) {
  try {
    const { id, type, quality, currentEase, currentReps, currentInterval, tzOffset } = await req.json();
    if (!id || !type || quality === undefined) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
    const DB_ID = process.env.CLOUDFLARE_DATABASE_ID;
    const TOKEN = process.env.CLOUDFLARE_D1_TOKEN;

    if (!ACCOUNT_ID || !DB_ID || !TOKEN) {
      return NextResponse.json({ error: 'Config missing' }, { status: 500 });
    }

    const { newInterval, newRepetitions, newEaseFactor } = calculateSM2(
      quality, 
      currentReps || 0, 
      currentEase || 2.5, 
      currentInterval || 0
    );

    // Calculate nextReviewAt strictly by calendar days, normalized to 00:00:00 of the target day
    // tzOffset is in minutes (e.g. -480 for UTC+8, or 0 if omitted)
    const offsetMs = typeof tzOffset === 'number' ? tzOffset * 60000 : 0;
    const localNow = new Date(Date.now() - offsetMs);
    localNow.setDate(localNow.getDate() + newInterval);
    localNow.setHours(0, 0, 0, 0);
    const nextReviewAt = localNow.getTime() + offsetMs;

    const tableName = type === 'word' ? 'saved_words' : 'saved_phrases';
    const idColumn = type === 'word' ? 'word' : 'id';
    const repColumn = type === 'word' ? 'repetition' : 'repetitions';

    const payload = {
      sql: `UPDATE ${tableName} SET next_review_at = ?, interval = ?, ease_factor = ?, ${repColumn} = ? WHERE ${idColumn} = ?`,
      params: [nextReviewAt, newInterval, newEaseFactor, newRepetitions, id]
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
    
    return NextResponse.json({ success: true, nextReviewAt, newInterval });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
