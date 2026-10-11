const Database = require('better-sqlite3');
const zlib = require('zlib');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

// Initialize S3 / R2 client
const s3 = new S3Client({
  region: 'auto',
  endpoint: 'https://203c8e3689d03e222355fba43f13e51b.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: '2f88e2350f39fcf4e40b8be2d3cf7736',
    secretAccessKey: 'afea63a2bd167df099ecf21b25b2c4bd04365a4daeb6a3b6e5b9ee987ac1c624'
  }
});

const BUCKET = 'quiet-tracker-storage';

function getPrefix(word) {
  const clean = (word || '').toLowerCase().trim();
  if (!clean) return '_other';
  if (!/^[a-z]/.test(clean)) return '_other';
  if (clean.length === 1) return clean;
  const p = clean.slice(0, 2);
  return /^[a-z]{2}$/.test(p) ? p : clean[0];
}

async function run() {
  console.log('Connecting to quiet_dictionary.sqlite...');
  const db = new Database(path.join(__dirname, '../quiet_dictionary.sqlite'), { readonly: true });

  console.log('Reading dict_oald words...');
  const rows = db.prepare('SELECT word, definition_html FROM dict_oald').all();
  console.log(`Loaded ${rows.length} words from dict_oald.`);

  const shards = {};
  for (const row of rows) {
    const prefix = getPrefix(row.word);
    if (!shards[prefix]) shards[prefix] = {};
    shards[prefix][row.word.toLowerCase()] = row.definition_html;
  }

  const prefixes = Object.keys(shards);
  console.log(`Grouped into ${prefixes.length} prefixes. Starting upload to Cloudflare R2...`);

  const concurrency = 20;
  let index = 0;
  let completed = 0;

  async function worker() {
    while (index < prefixes.length) {
      const p = prefixes[index++];
      const map = shards[p];
      const json = JSON.stringify(map);
      const gz = zlib.gzipSync(Buffer.from(json));

      const cmd = new PutObjectCommand({
        Bucket: BUCKET,
        Key: `dict/oald/${p}.json.gz`,
        Body: gz,
        ContentType: 'application/json',
        ContentEncoding: 'gzip',
      });

      try {
        await s3.send(cmd);
        completed++;
        if (completed % 50 === 0 || completed === prefixes.length) {
          console.log(`Uploaded ${completed}/${prefixes.length} prefixes to R2...`);
        }
      } catch (err) {
        console.error(`Failed to upload prefix ${p}:`, err.message);
      }
    }
  }

  const workers = Array.from({ length: concurrency }).map(() => worker());
  await Promise.all(workers);

  console.log('Oxford Dictionary (dict_oald) successfully uploaded to Cloudflare R2!');
}

run().catch(console.error);
