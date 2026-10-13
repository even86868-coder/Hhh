// Paints the game's art with OpenAI's image model: one WebP per portrait, token and scene.
//   node tools/generate-art.mjs --dry-run            # list what's missing and the rough cost
//   OPENAI_API_KEY=... node tools/generate-art.mjs [--limit 10] [--only scene] [--redo hero:elf:wizard:f]
// Already-painted images are skipped, so it's safe to re-run. Settings live in art/art.json.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { collectArt, artFile } from './art-list.mjs';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const dry = args.includes('--dry-run');
const limit = +(opt('--limit') || Infinity);
const only = opt('--only'); // hero | companion | npc | monster | scene
const redo = (opt('--redo') || '').split(',').filter(Boolean);
const cfg = JSON.parse(readFileSync('art/art.json', 'utf8'));
const OUT = 'art/img';
mkdirSync(OUT, { recursive: true });
const BASE = process.env.OPENAI_BASE_URL || 'https://api.openai.com';

for (const key of redo) { const f = `${OUT}/${artFile(key)}`; if (existsSync(f)) unlinkSync(f); }
const all = collectArt().filter((a) => !only || a.kind === only);
const missing = all.filter((a) => !existsSync(`${OUT}/${artFile(a.key)}`));
// Sample runs paint one of each kind first.
const firstOfEach = missing.filter((a, i) => missing.findIndex((b) => b.kind === a.kind) === i);
const order = args.includes('--sample') ? [...firstOfEach, ...missing] : missing;
const todo = [...new Set(order)].slice(0, limit);
const price = (a) => (cfg.pricePerImage?.[cfg.quality] ?? 0.05) * (a.size === '1024x1024' ? 1 : 1.5);
const cost = todo.reduce((s, a) => s + price(a), 0);
console.log(`${all.length} images in the game, ${all.length - missing.length} already painted, ${todo.length} to paint now with ${cfg.model} (${cfg.quality} quality), about $${cost.toFixed(2)}.`);
if (dry) { for (const a of todo.slice(0, 5)) console.log(`  ${a.key}: ${a.prompt.slice(0, 160)}...`); process.exit(0); }
if (!process.env.OPENAI_API_KEY) { console.error('Set OPENAI_API_KEY first.'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let model = cfg.model;
async function paint(a) {
  const res = await fetch(`${BASE}/v1/images/generations`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: a.prompt, size: a.size, quality: cfg.quality, n: 1, output_format: 'webp', output_compression: cfg.compression ?? 80 }),
  });
  const text = await res.text();
  if (!res.ok) throw Object.assign(new Error(`OpenAI ${res.status}: ${text.slice(0, 300)}`), { status: res.status, body: text, retryAfter: +res.headers.get('retry-after') || 0 });
  const b64 = JSON.parse(text).data?.[0]?.b64_json;
  if (!b64) throw new Error('No image in the response');
  return Buffer.from(b64, 'base64');
}

let done = 0, failed = 0;
for (const a of todo) {
  for (let attempt = 1; ; attempt++) {
    try {
      writeFileSync(`${OUT}/${artFile(a.key)}`, await paint(a));
      done++;
      console.log(`  ${done}/${todo.length} ${a.key}`);
      break;
    } catch (err) {
      const fallback = cfg.fallbackModels?.[model];
      if ((err.status === 400 || err.status === 404) && /model/i.test(err.body || '') && fallback) {
        console.log(`  ${model} isn't available to this account (${err.status}); switching to ${fallback}.`);
        model = fallback; attempt = 0; continue;
      }
      if (err.status === 401 || /billing|insufficient_quota|hard_limit/i.test(err.body || '')) {
        console.error(`  Stopping: ${err.message}`); failed++;
        writeIndex(); process.exit(done ? 0 : 1);
      }
      const retry = err.status === 429 || !err.status || err.status >= 500;
      if (retry && attempt < 8) { await sleep(Math.max(err.retryAfter * 1000, 15000 * attempt)); continue; }
      failed++;
      console.error(`  failed ${a.key}: ${err.message}`);
      break;
    }
  }
}
function writeIndex() {
  const keys = readdirSync(OUT).filter((f) => f.endsWith('.webp')).map((f) => f.slice(0, -5).replace(/_/g, ':')).sort();
  writeFileSync('art/index.json', JSON.stringify({ dir: 'img', keys }));
  return keys.length;
}
const total = writeIndex();
console.log(`Painted ${done}, failed ${failed}. The game now has ${total} painted images (art/index.json updated).${model !== cfg.model ? ` Used ${model}.` : ''}`);
process.exit(failed && !done ? 1 : 0);
