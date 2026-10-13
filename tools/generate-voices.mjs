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
const EL_BASE = process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io';
let elVoices = null;
async function elVoiceId(slot, voiceKey) {
  if (!slot.elevenlabs) throw Object.assign(new Error(`No ElevenLabs voice set for "${voiceKey}". Run: node tools/cast-voices.mjs`), { status: 400, fatal: true });
  if (/^[A-Za-z0-9]{18,}$/.test(slot.elevenlabs)) return slot.elevenlabs;
  if (!elVoices) {
    const r = await fetch(`${EL_BASE}/v1/voices`, { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY } });
    elVoices = r.ok ? (await r.json()).voices || [] : [];
  }
  const v = elVoices.find((x) => x.name.toLowerCase() === slot.elevenlabs.toLowerCase());
  if (!v) throw Object.assign(new Error(`ElevenLabs voice "${slot.elevenlabs}" (for ${voiceKey}) not found in your account`), { status: 400, fatal: true });
  return v.voice_id;
}
const isNarration = (line) => line.source.startsWith('story:');
const rejected = new Set(); // models this account refused; their fallback is used instead
const fallbackFor = (m) => (cast.elevenlabs.fallback || {})[m];
const elModel = (line) => {
  let m = (isNarration(line) && cast.elevenlabs.narrationModel) || cast.elevenlabs.model;
  while (rejected.has(m) && fallbackFor(m)) m = fallbackFor(m);
  return m;
};
const credits = (lines) => Math.round(lines.reduce((sum, l) => sum + l.text.length * ((cast.elevenlabs.creditsPerChar || {})[elModel(l)] ?? 1), 0));
// Audio tags ([excited], [whispers]...) are acted out by Eleven v3/v4 and read aloud by older models,
// so they're only added for tag-aware models. They never change a line's key or its text in the game.
const tagAware = (model) => /^eleven_v[3-9]/.test(model);
function performedText(line, model) {
  const t = cast.elevenlabs.tags;
  if (!t?.enabled || !tagAware(model) || /^\[/.test(line.text)) return line.text;
  const bySource = t.source || {};
  const tag = bySource[line.source] ?? Object.entries(bySource).find(([k]) => k.endsWith(':') && line.source.startsWith(k))?.[1] ?? (t.voice || {})[line.voice];
  return tag ? `${tag} ${line.text}` : line.text;
}
function voiceSettings(v, model) {
  const s = { stability: 0.5, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true, ...(v.settings || {}) };
  if (tagAware(model)) delete s.style; // Eleven v3/v4 have no style setting
  return s;
}
let noSettings = false; // set if the model rejects our voice settings
async function ttsElevenLabs(line, v) {
  const id = await elVoiceId(v, line.voice);
  const model = elModel(line);
  const body = { text: performedText(line, model), model_id: model };
  if (!noSettings) body.voice_settings = voiceSettings(v, model);
  const res = await fetch(`${EL_BASE}/v1/text-to-speech/${id}?output_format=${cast.elevenlabs.format}`, {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = (await res.text()).slice(0, 300);
    if ((res.status === 400 || res.status === 404 || res.status === 422) && /model/i.test(msg) && fallbackFor(model)) {
      if (!rejected.has(model)) console.log(`  ElevenLabs rejected model ${model} (${res.status}: ${msg.slice(0, 120)}); using ${fallbackFor(model)} instead.`);
      rejected.add(model);
      return ttsElevenLabs(line, v);
    }
    if ((res.status === 400 || res.status === 422) && /voice_settings|stability|similarity|speaker_boost/i.test(msg) && body.voice_settings) {
      if (!noSettings) console.log(`  ElevenLabs rejected the voice settings for ${model}; recording with the voices' default settings.`);
      noSettings = true;
      return ttsElevenLabs(line, v);
    }
    throw Object.assign(new Error(`ElevenLabs ${res.status}: ${msg.slice(0, 200)}`), { status: res.status });
  }
  return Buffer.from(await res.arrayBuffer());
}
const tts = provider === 'elevenlabs' ? ttsElevenLabs : ttsOpenAI;

function writeIndex() {
  const keys = existsSync(OUT) ? readdirSync(OUT).filter((f) => f.endsWith(`.${ext}`)).map((f) => f.slice(0, -ext.length - 1)) : [];
  writeFileSync('voices/index.json', JSON.stringify({ ext, dir: 'clips', keys: keys.sort() }));
  return keys.length;
}

const all = collectLines({ heroVoices: cast.heroVoices }).filter((l) => !onlyVoice || l.voice === onlyVoice);
const missing = all.filter((l) => !existsSync(fileFor(l.key)));
const todo = missing.slice(0, limit);
const chars = todo.reduce((s, l) => s + l.text.length, 0);
console.log(`${all.length} lines in the game, ${all.length - missing.length} already recorded, ${todo.length} to record now (${chars.toLocaleString()} characters) with ${provider}.`);
if (provider === 'elevenlabs') {
  const narr = todo.filter(isNarration);
  const rest = todo.filter((l) => !isNarration(l));
  console.log(`  Story narration: ${narr.length} lines on ${cast.elevenlabs.narrationModel || cast.elevenlabs.model} = about ${credits(narr).toLocaleString()} credits`);
  console.log(`  Everything else: ${rest.length} lines on ${cast.elevenlabs.model} = about ${credits(rest).toLocaleString()} credits`);
  console.log(`  Total: about ${credits(todo).toLocaleString()} ElevenLabs credits`);
}
for (const l of todo) if (!cast.voices[l.voice]) { console.error(`No casting for voice "${l.voice}" in voices/cast.json`); process.exit(1); }
const keyVar = provider === 'elevenlabs' ? 'ELEVENLABS_API_KEY' : 'OPENAI_API_KEY';
// ElevenLabs: compare the job with the credits left on the account.
if (provider === 'elevenlabs' && process.env.ELEVENLABS_API_KEY) {
  try {
    const r = await fetch(`${EL_BASE}/v1/user/subscription`, { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY } });
    if (r.ok) {
      const sub = await r.json();
      const left = (sub.character_limit ?? 0) - (sub.character_count ?? 0);
      console.log(`ElevenLabs plan "${sub.tier || '?'}": ${left.toLocaleString()} credits left this period; this run needs about ${credits(todo).toLocaleString()}.`);
      if (left < credits(todo) && !dry) console.log('Not enough credits for everything: it will record until the credits run out, then stop. Re-run later to continue where it left off.');
    }
  } catch (e) { /* informational only */ }
}
if (dry) { console.log('Dry run: nothing generated.'); process.exit(0); }
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
        const outOfCredits = err.status === 401 || err.status === 402 || /quota_exceeded|insufficient|credits/i.test(err.message);
        const retryable = !err.fatal && !outOfCredits && (!err.status || err.status === 429 || err.status >= 500);
        if (retryable && attempt < 5) { await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt)); continue; }
        failed++;
        console.error(`  failed [${line.voice}] "${line.text.slice(0, 50)}": ${err.message}`);
        if (err.fatal || outOfCredits || err.status === 403) { console.error(outOfCredits ? 'Out of credits or the key was rejected; stopping. Everything recorded so far is kept.' : 'Stopping.'); queue.length = 0; }
        break;
      }
    }
  }
}
await Promise.all(Array.from({ length: provider === 'elevenlabs' ? 2 : 4 }, worker));
const total = writeIndex();
if (rejected.size) console.log(`Note: your account didn't accept ${[...rejected].join(', ')}, so ${[...rejected].map(fallbackFor).join(', ')} was used.`);
console.log(`Recorded ${done}, failed ${failed}. Voice pack now has ${total} clips (voices/index.json updated).`);
process.exit(failed && !done ? 1 : 0);
