// Generates the recorded voice pack: one audio file per spoken line.
//   node tools/generate-voices.mjs --dry-run        # count lines/characters, no API calls
//   OPENAI_API_KEY=... node tools/generate-voices.mjs [--limit 50] [--voice Pip]
//   ELEVENLABS_API_KEY=... node tools/generate-voices.mjs   (with provider "elevenlabs" in voices/cast.json)
// Already-generated files are skipped, so it's safe to re-run after adding new lines.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { collectLines } from './voice-lines.mjs';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const dry = args.includes('--dry-run');
const limit = +(opt('--limit') || Infinity);
const onlyVoice = opt('--voice');
const cast = JSON.parse(readFileSync('voices/cast.json', 'utf8'));
const provider = opt('--provider') || cast.provider;
const OUT = 'voices/clips';
mkdirSync(OUT, { recursive: true });

const ext = 'mp3';
const fileFor = (key) => `${OUT}/${key}.${ext}`;

async function ttsOpenAI(line, v) {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: cast.openai.model, voice: v.openai, input: line.text, instructions: v.direction, response_format: cast.openai.format }),
  });
  if (!res.ok) throw Object.assign(new Error(`OpenAI ${res.status}: ${(await res.text()).slice(0, 200)}`), { status: res.status });
  return Buffer.from(await res.arrayBuffer());
}
async function ttsElevenLabs(line, v) {
  if (!v.elevenlabs) throw new Error(`No ElevenLabs voice ID set for "${line.voice}" in voices/cast.json`);
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${v.elevenlabs}?output_format=${cast.elevenlabs.format}`, {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: line.text, model_id: cast.elevenlabs.model, voice_settings: { stability: 0.45, similarity_boost: 0.8 } }),
  });
  if (!res.ok) throw Object.assign(new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 200)}`), { status: res.status });
  return Buffer.from(await res.arrayBuffer());
}
const tts = provider === 'elevenlabs' ? ttsElevenLabs : ttsOpenAI;

function writeIndex() {
  const keys = existsSync(OUT) ? readdirSync(OUT).filter((f) => f.endsWith(`.${ext}`)).map((f) => f.slice(0, -ext.length - 1)) : [];
  writeFileSync('voices/index.json', JSON.stringify({ ext, dir: 'clips', keys: keys.sort() }));
  return keys.length;
}

const all = collectLines().filter((l) => !onlyVoice || l.voice === onlyVoice);
const todo = all.filter((l) => !existsSync(fileFor(l.key))).slice(0, limit);
const chars = todo.reduce((s, l) => s + l.text.length, 0);
console.log(`${all.length} lines in the game, ${all.length - todo.length} already recorded, ${todo.length} to record (${chars.toLocaleString()} characters) with ${provider}.`);
for (const l of todo) if (!cast.voices[l.voice]) { console.error(`No casting for voice "${l.voice}" in voices/cast.json`); process.exit(1); }
if (dry) { console.log('Dry run: nothing generated.'); process.exit(0); }
const keyVar = provider === 'elevenlabs' ? 'ELEVENLABS_API_KEY' : 'OPENAI_API_KEY';
if (!process.env[keyVar]) { console.error(`Set ${keyVar} first.`); process.exit(1); }

let done = 0, failed = 0;
const queue = [...todo];
async function worker() {
  while (queue.length) {
    const line = queue.shift();
    for (let attempt = 1; ; attempt++) {
      try {
        writeFileSync(fileFor(line.key), await tts(line, cast.voices[line.voice]));
        done++;
        if (done % 25 === 0) console.log(`  ${done}/${todo.length}`);
        break;
      } catch (err) {
        const retryable = !err.status || err.status === 429 || err.status >= 500;
        if (retryable && attempt < 5) { await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt)); continue; }
        failed++;
        console.error(`  failed [${line.voice}] "${line.text.slice(0, 50)}": ${err.message}`);
        if (err.status === 401 || err.status === 403) { console.error('Authentication failed; stopping.'); queue.length = 0; }
        break;
      }
    }
  }
}
await Promise.all(Array.from({ length: provider === 'elevenlabs' ? 2 : 4 }, worker));
const total = writeIndex();
console.log(`Recorded ${done}, failed ${failed}. Voice pack now has ${total} clips (voices/index.json updated).`);
process.exit(failed && !done ? 1 : 0);
