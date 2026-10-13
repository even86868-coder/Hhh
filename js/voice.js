// Character voices via the device's built-in speech synthesis (free, offline).
// To sound less robotic we (1) rank the installed voices and prefer the natural/neural
// ones, (2) give each character a *different voice* instead of heavy pitch-shifting,
// and (3) speak sentence by sentence with natural pauses.
export const voiceSettings = {
  enabled: true,
  narrator: false, // the Game Master reads story narration aloud
  gm: 'full', // Game Master commentary: 'full' | 'tips' | 'off'
  volume: 0.9,
  cast: {}, // user overrides: speaker key -> voiceURI
};

export const VOICE_PRESETS = {
  deep: { name: 'Deep', pitch: 0.8, rate: 0.92, pref: 'm' },
  low: { name: 'Low', pitch: 0.9, rate: 0.95, pref: 'm' },
  warm: { name: 'Warm', pitch: 1.0, rate: 0.98, pref: 'f' },
  bright: { name: 'Bright', pitch: 1.08, rate: 1.02, pref: 'f' },
  high: { name: 'High', pitch: 1.18, rate: 1.04, pref: 'any' },
  squeaky: { name: 'Squeaky', pitch: 1.35, rate: 1.08, pref: 'any' },
};

// Gentle pitch/rate tweaks only; distinct voices do the heavy lifting.
const CHAR = {
  gm: { label: 'Game Master', pitch: 0.95, rate: 0.93, pref: 'm', order: 0 },
  Brannoc: { label: 'Brannoc', pitch: 0.85, rate: 0.92, pref: 'm', order: 1 },
  Tamsin: { label: 'Tamsin', pitch: 1.05, rate: 0.98, pref: 'f', order: 2 },
  Quillan: { label: 'Quillan', pitch: 1.08, rate: 1.06, pref: 'm', order: 3 },
  Pip: { label: 'Pip', pitch: 1.2, rate: 1.08, pref: 'f', order: 4 },
  hero: { label: 'Your hero', pitch: 1, rate: 1, pref: 'any', order: 5 },
  goblin: { label: 'Goblins', pitch: 1.45, rate: 1.15, pref: 'any', order: 6 },
  beast: { label: 'Beasts', pitch: 0.7, rate: 0.85, pref: 'm', order: 7 },
  villain: { label: 'Villains', pitch: 0.88, rate: 0.92, pref: 'any', order: 8 },
};

const FEMALE = /samantha|victoria|karen|moira|tessa|zira|susan|hazel|female|fiona|serena|allison|ava|jenny|aria|libby|sonia|catherine|kate|emma|amy|joanna|salli|kimberly|ivy|linda|heather|natasha|clara|michelle|sara|nancy|ana\b|emily|olivia|zoe|ruth|aurora/i;
const MALE = /daniel|alex|david|mark|george|fred|\bmale|ryan|guy|thomas|james|oliver|arthur|aaron|matthew|joey|justin|brian|eric|steffan|christopher|roger|rishi|tom\b|andrew|brandon|davis|tony|jason|william|liam|noah/i;

// Higher = more natural sounding.
function quality(v) {
  const n = v.name;
  let s = 0;
  if (/natural|neural/i.test(n)) s += 100; // Edge / Windows neural voices
  if (/online/i.test(n)) s += 40;
  if (/enhanced|premium|siri/i.test(n)) s += 70; // Apple's downloadable voices
  if (/google/i.test(n)) s += 45; // Chrome's network voices
  if (/espeak|compact|novelty|bad news|bells|bubbles|cellos|zarvox|trinoids|whisper|wobble|bahh|boing|jester|organ|superstar|albert|deranged|hysterical/i.test(n)) s -= 200;
  if (/^en[-_](us|gb)/i.test(v.lang)) s += 8;
  if (v.localService === false) s += 5;
  return s;
}

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let voices = [];
let castMap = new Map();
function loadVoices() {
  if (!synth) return;
  const all = synth.getVoices() || [];
  let en = all.filter((v) => /^en/i.test(v.lang));
  if (!en.length) en = all;
  voices = en.filter((v) => quality(v) > -100).sort((a, b) => quality(b) - quality(a));
  castMap = new Map();
}
if (synth) { loadVoices(); synth.addEventListener?.('voiceschanged', loadVoices); }

export const voiceAvailable = () => !!synth;
export const listVoices = () => { if (!voices.length) loadVoices(); return voices; };

// Give each speaker key its own voice, best voices first, matching the gender hint when possible.
function voiceFor(key) {
  if (!voices.length) loadVoices();
  if (!voices.length) return null;
  const override = voiceSettings.cast?.[key];
  if (override) { const v = voices.find((x) => x.voiceURI === override); if (v) return v; }
  if (castMap.has(key)) return castMap.get(key);
  const prof = CHAR[key] || CHAR.hero;
  const used = new Set([...castMap.values()].map((v) => v.voiceURI));
  const fits = (v) => prof.pref === 'any' || (prof.pref === 'f' ? FEMALE.test(v.name) : MALE.test(v.name) && !FEMALE.test(v.name));
  const v = voices.find((x) => fits(x) && !used.has(x.voiceURI)) || voices.find((x) => !used.has(x.voiceURI)) || voices.find(fits) || voices[0];
  castMap.set(key, v);
  return v;
}

export function castList() {
  return Object.entries(CHAR).map(([key, p]) => ({ key, label: p.label, voice: voiceFor(key) }));
}
export function setCast(key, voiceURI) {
  voiceSettings.cast = { ...(voiceSettings.cast || {}), [key]: voiceURI || undefined };
  if (!voiceURI) delete voiceSettings.cast[key];
  castMap = new Map();
}

// speaker: { name, kind: 'companion'|'hero'|'monster'|'gm'|'narrator', preset?, monsterKey? }
function resolve(sp) {
  if (sp.kind === 'companion' && CHAR[sp.name]) return { key: sp.name, ...CHAR[sp.name] };
  if (sp.kind === 'hero') { const p = VOICE_PRESETS[sp.preset] || VOICE_PRESETS.warm; return { key: 'hero', ...p }; }
  if (sp.kind === 'monster') {
    if (/goblin|warchanter|ripnugget|erylium/i.test(sp.monsterKey || '')) return { key: 'goblin', ...CHAR.goblin };
    if (/dog|boar|sinspawn|yeth/i.test(sp.monsterKey || '')) return { key: 'beast', ...CHAR.beast };
    return { key: 'villain', ...CHAR.villain };
  }
  return { key: 'gm', ...CHAR.gm };
}

// Clean text for speech and split it into sentence-sized chunks.
function chunks(text) {
  const clean = text
    .replace(/[*_#]/g, '')
    .replace(/\.\.\./g, '…')
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/\bvs\b/gi, 'versus')
    .replace(/\bDC\b/g, 'D C')
    .replace(/\bd20\b/gi, 'd twenty')
    .replace(/\n+/g, ' ');
  const parts = clean.match(/[^.!?…]+[.!?…]+["”']?|[^.!?…]+$/g) || [clean];
  const out = [];
  for (const p of parts.map((s) => s.trim()).filter(Boolean)) {
    if (out.length && (out[out.length - 1].length + p.length) < 90) out[out.length - 1] += ` ${p}`;
    else out.push(p);
  }
  return out;
}

let chain = Promise.resolve();
let generation = 0;

function utter(text, prof, voice, gen) {
  return new Promise((done) => {
    if (gen !== generation) { done(); return; }
    const u = new SpeechSynthesisUtterance(text);
    try { if (voice) u.voice = voice; } catch (e) { /* unusual voice object; use the default */ }
    u.pitch = Math.max(0.5, Math.min(1.6, prof.pitch));
    u.rate = prof.rate;
    u.volume = voiceSettings.volume;
    let finished = false;
    const fin = () => { if (!finished) { finished = true; done(); } };
    u.onend = fin; u.onerror = fin;
    setTimeout(fin, 1500 + text.length * 95); // safety net if the engine never fires onend
    synth.speak(u);
  });
}

// Speak a line. Returns a promise that resolves when finished (or skipped).
export function speak(text, speaker = { kind: 'gm' }, { queue = true } = {}) {
  if (!synth || !voiceSettings.enabled || !text) return Promise.resolve();
  if (speaker.kind === 'narrator' && !voiceSettings.narrator) return Promise.resolve();
  if (!queue) stopVoices();
  if (!voices.length) loadVoices();
  if (!voices.length) return Promise.resolve(); // no installed voices (e.g. some Linux setups)
  const gen = generation;
  const prof = resolve(speaker);
  const voice = voiceFor(prof.key);
  const run = async () => { for (const c of chunks(text)) { if (gen !== generation) return; await utter(c, prof, voice, gen); } };
  chain = chain.then(run);
  return chain;
}

export function stopVoices() {
  generation += 1;
  chain = Promise.resolve();
  try { synth?.cancel(); } catch (e) { /* ignore */ }
}

export function isSpeaking() { return !!synth?.speaking; }
