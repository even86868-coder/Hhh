// Picks an ElevenLabs voice for every character that doesn't have one yet,
// using the voices available in your ElevenLabs account, and saves them in voices/cast.json.
//   ELEVENLABS_API_KEY=... node tools/cast-voices.mjs          # fill empty slots
//   ELEVENLABS_API_KEY=... node tools/cast-voices.mjs --recast # re-pick everything
//   ELEVENLABS_API_KEY=... node tools/cast-voices.mjs --list   # just list your voices
import { readFileSync, writeFileSync } from 'fs';

const BASE = process.env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io';
const KEY = process.env.ELEVENLABS_API_KEY;
const args = process.argv.slice(2);
if (!KEY) { console.error('Set ELEVENLABS_API_KEY first.'); process.exit(1); }

export async function fetchVoices() {
  const res = await fetch(`${BASE}/v1/voices`, { headers: { 'xi-api-key': KEY } });
  if (!res.ok) throw new Error(`ElevenLabs /v1/voices ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const j = await res.json();
  return (j.voices || []).map((v) => {
    const labels = Object.fromEntries(Object.entries(v.labels || {}).map(([k, val]) => [k, String(val).toLowerCase().replace(/_/g, ' ')]));
    return { id: v.voice_id, name: v.name, labels, text: `${v.name} ${Object.values(labels).join(' ')} ${v.description || ''}`.toLowerCase() };
  });
}

const MAIN = ['gm', 'Brannoc', 'Tamsin', 'Quillan', 'Pip'];

function score(voice, want, usedByMain, usedAny) {
  let s = 0;
  const names = want.names || [];
  const ni = names.findIndex((n) => voice.name.toLowerCase().startsWith(n.toLowerCase()));
  if (ni >= 0) s += 40 - ni * 5;
  const g = voice.labels.gender;
  if (want.gender && want.gender !== 'any' && g) s += g === want.gender ? 30 : -50;
  const ages = want.age || [];
  if (voice.labels.age && ages.some((a) => a === 'any' || voice.labels.age.includes(a))) s += 10;
  for (const k of want.keywords || []) if (voice.text.includes(k.toLowerCase())) s += 6;
  for (const k of want.avoid || []) if (voice.text.includes(k.toLowerCase())) s -= 25;
  if (usedByMain.has(voice.id)) s -= 70;
  if (usedAny.has(voice.id)) s -= 12;
  return s;
}

const voices = await fetchVoices();
if (args.includes('--list')) {
  for (const v of voices) console.log(`${v.name.padEnd(22)} ${v.id}  ${Object.values(v.labels).join(', ')}`);
  process.exit(0);
}
if (!voices.length) { console.error('No voices found in this ElevenLabs account.'); process.exit(1); }

const cast = JSON.parse(readFileSync('voices/cast.json', 'utf8'));
const recast = args.includes('--recast');
const order = [...MAIN, ...(cast.heroVoices || []), ...Object.keys(cast.voices).filter((k) => !MAIN.includes(k) && !(cast.heroVoices || []).includes(k))];
const usedByMain = new Set(), usedAny = new Set();
const byNameOrId = (val) => voices.find((v) => v.id === val) || voices.find((v) => v.name.toLowerCase() === String(val).toLowerCase());
// Keep existing picks (unless recasting)
for (const key of order) {
  const slot = cast.voices[key];
  if (!slot || recast || !slot.elevenlabs) continue;
  const v = byNameOrId(slot.elevenlabs);
  if (v) { usedAny.add(v.id); if (MAIN.includes(key) || (cast.heroVoices || []).includes(key)) usedByMain.add(v.id); }
}
const rows = [];
for (const key of order) {
  const slot = cast.voices[key];
  if (!slot) continue;
  let v = !recast && slot.elevenlabs ? byNameOrId(slot.elevenlabs) : null;
  if (!v) {
    v = [...voices].sort((a, b) => score(b, slot.want || {}, usedByMain, usedAny) - score(a, slot.want || {}, usedByMain, usedAny))[0];
    slot.elevenlabs = v.id;
    slot.elevenlabsName = v.name;
  }
  usedAny.add(v.id);
  if (MAIN.includes(key) || (cast.heroVoices || []).includes(key)) usedByMain.add(v.id);
  rows.push(`${key.padEnd(11)} -> ${v.name} (${Object.values(v.labels).slice(0, 3).join(', ')})`);
}
writeFileSync('voices/cast.json', `${JSON.stringify(cast, null, 2)}\n`);
console.log(`Cast from ${voices.length} voices in your account:\n${rows.join('\n')}\nSaved to voices/cast.json. Change any slot to a voice name or ID you prefer.`);
