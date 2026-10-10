import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

// Tell Next.js we must run this on the Node.js runtime, not Edge, because better-sqlite3 uses native C++ bindings

let db: any = null;

function getDb() {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'quiet_dictionary.sqlite');
    db = new Database(dbPath, { readonly: true });
  }
  return db;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word');

  if (!word) {
    return NextResponse.json({ error: 'Word is required' }, { status: 400 });
  }

  try {
    const database = getDb();
    // Query OALD10 (case-insensitive)
    const stmt = database.prepare("SELECT definition_html FROM dict_oald WHERE word COLLATE NOCASE = ? LIMIT 1");
    let result = stmt.get(word);

    if (result && result.definition_html.startsWith('@@@LINK=')) {
      const linkWord = result.definition_html.replace('@@@LINK=', '').trim();
      result = stmt.get(linkWord);
    }

    if (result) {
      // Fix relative paths in the original MDX HTML so they point to the Next.js public folder
      let html = result.definition_html;
      html = html.replace(/href="oald10\\.css"/g, 'href="/oald10.css"');
      html = html.replace(/src="oald10\\.js"/g, 'src="/oald10.js"');
      
      return NextResponse.json({ html });
    } else {
      return NextResponse.json({ error: 'Not found in local dictionary' }, { status: 404 });
    }
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
  }
}
