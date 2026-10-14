// Character voices. Recorded clips from the voice pack (voices/) play when available;
// everything else uses the device's built-in speech synthesis (free, offline).
import { lineKey, packVoice, HERO_FALLBACK, spokenForm, paragraphs, sentences } from './voicekey.js';
import { splitDialogue, NPC_VOICES, COMPANION_NAMES } from './speakers.js';
// To sound less robotic we (1) rank the installed voices and prefer the natural/neural
// ones, (2) give each character a *different voice* instead of heavy pitch-shifting,
// and (3) speak sentence by sentence with natural pauses.
export const voiceSettings = {
  enabled: true,
  narrator: true, // the Game Master reads story narration aloud
  gm: 'tips', // Game Master's own commentary: 'full' (adds scene framing) | 'tips' (rules only) | 'off'
  volume: 0.9,
  cast: {}, // user overrides: speaker key -> voiceURI
  recorded: true, // use the recorded voice pack when present
};

// ---------------------------------------------------------------- recorded voice pack
const pack = { keys: new Set(), dir: 'voices/clips', ext: 'mp3', loaded: false };
export const voicePackSize = () => pack.keys.size;
export async function loadVoicePack() {
  if (typeof fetch === 'undefined' || typeof location === 'undefined' || !/^(https?|app):$/.test(location.protocol)) return 0;
  try {
    const res = await fetch('voices/index.json', { cache: 'no-cache' });
    if (!res.ok) return 0;
    const j = await res.json();
    pack.keys = new Set(j.keys || []);
    pack.dir = `voices/${j.dir || 'clips'}`;
    pack.ext = j.ext || 'mp3';
    pack.loaded = true;
  } catch (e) { /* no pack: device voices only */ }
  return pack.keys.size;
}
if (typeof window !== 'undefined') loadVoicePack();

// The player's name (set by the UI) lets lines that address the player use a recording made without it.
export const voiceContext = { playerName: '', heroPreset: 'warm' };
function clipFor(text, speaker) {
  if (!text || !voiceSettings.recorded || !pack.keys.size) return null;
  const pv = packVoice(speaker);
  for (const v of HERO_FALLBACK[pv] || [pv]) {
    const key = lineKey(v, text);
    if (pack.keys.has(key)) return `${pack.dir}/${key}.${pack.ext}`;
  }
  return null;
}
function recordedClip(text, speaker) {
  const name = voiceContext.playerName;
  return clipFor(text, speaker) || (name && text.includes(name) ? clipFor(spokenForm(text, name), speaker) : null);
}
// True if this exact line has a recording for this speaker (so it won't fall back to the device voice).
export function hasRecording(text, speaker) { return !!recordedClip(text, speaker); }
export const voicePackReady = () => voiceSettings.enabled && voiceSettings.recorded && pack.keys.size > 0;

// The speaker for a character named in the story text.
export function storySpeaker(who) {
  if (who === 'hero') return { kind: 'hero', preset: voiceContext.heroPreset };
  if (COMPANION_NAMES.includes(who)) return { kind: 'companion', name: who };
  return { kind: 'npc', name: who, voice: NPC_VOICES[who] };
}
// Narration read by one voice: whole passage, else paragraph by paragraph, else sentence by sentence.
function narratorParts(text, speaker) {
  const whole = recordedClip(text, speaker);
  if (whole) return [{ clip: whole, text, speaker }];
  const out = [];
  for (const p of paragraphs(text)) {
    const c = recordedClip(p, speaker);
    if (c) { out.push({ clip: c, text: p, speaker }); continue; }
    for (const s of sentences(p)) {
      const sc = recordedClip(s, speaker);
      const last = out[out.length - 1];
      if (sc) out.push({ clip: sc, text: s, speaker });
      else if (last && !last.clip) last.text += ` ${s}`;
      else out.push({ text: s, speaker });
    }
  }
  return out;
}
// What to play for a line: recordings where they exist, the device voice for the rest.
// In story narration, quoted lines are spoken by the character who says them.
function plan(text, speaker) {
  const whole = recordedClip(text, speaker);
  if (whole && !(speaker.kind === 'narrator' && voiceSettings.recorded && dialogueRecorded(text, speaker))) return [{ clip: whole, text, speaker }];
  if (speaker.kind !== 'narrator' && speaker.kind !== 'gm') return [{ text, speaker }];
  if (speaker.kind === 'narrator') {
    const segs = splitDialogue(text, { playerName: voiceContext.playerName, fallback: speaker.fallback });
    if (segs.some((s) => s.who)) {
      const out = [];
      for (const s of segs) {
        if (!s.who) { out.push(...narratorParts(s.text, speaker)); continue; }
        const sp = storySpeaker(s.who);
        const c = recordedClip(s.text, sp);
        out.push(c ? { clip: c, text: s.text, speaker: sp } : { text: s.text, speaker: sp });
      }
      return out;
    }
  }
  const parts = narratorParts(text, speaker);
  return parts.some((x) => x.clip) ? parts : [{ text, speaker }];
}
// True when the characters' own recordings exist for this passage's quotes.
function dialogueRecorded(text, speaker) {
  const segs = splitDialogue(text, { playerName: voiceContext.playerName, fallback: speaker.fallback });
  const said = segs.filter((s) => s.who);
  return said.length > 0 && said.some((s) => recordedClip(s.text, storySpeaker(s.who)));
}
let currentAudio = null;
function playClip(url, gen) {
  return new Promise((done) => {
    if (gen !== generation) { done(true); return; }
    const a = new Audio(url);
    currentAudio = a;
    a.volume = voiceSettings.volume;
    let finished = false;
    let timer = null;
    const fin = (ok) => { if (!finished) { finished = true; clearTimeout(timer); if (currentAudio === a) currentAudio = null; done(ok); } };
    // Safety net in case 'ended' never fires: give up only well after the clip's own length
    // (long narration runs past two minutes), or if it never starts loading.
    const guard = (ms) => { clearTimeout(timer); timer = setTimeout(() => fin(true), ms); };
    a.onloadedmetadata = () => { if (Number.isFinite(a.duration)) guard(a.duration * 1000 + 4000); };
    a.onended = () => fin(true);
    a.onpause = () => { if (!a.ended && gen !== generation) fin(true); }; // stopped by stopVoices()
    a.onerror = () => fin(false);
    guard(20000);
    a.play().catch(() => fin(false));
  });
}

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
  townsfolk: { label: 'Townsfolk (men)', pitch: 0.95, rate: 0.98, pref: 'm', order: 9 },
  townswomen: { label: 'Townsfolk (women)', pitch: 1.05, rate: 0.98, pref: 'f', order: 10 },
};
// Device-voice stand-ins for story characters, by their recorded voice.
const NPC_TTS = { ameiko: 'townswomen', shalelu: 'townswomen', mirela: 'townswomen', granny: 'townswomen', woman: 'townswomen', child: 'townswomen', lyrie: 'villain', nualia: 'villain', tsuto: 'villain', orik: 'villain', goblin: 'goblin', ripnugget: 'goblin' };

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
  if (sp.kind === 'npc') { const k = NPC_TTS[sp.voice] || 'townsfolk'; return { key: k, ...CHAR[k] }; }
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
  if (!voiceSettings.enabled || !text) return Promise.resolve();
  if (speaker.kind === 'narrator' && !voiceSettings.narrator) return Promise.resolve();
  if (!queue) stopVoices();
  if (synth && !voices.length) loadVoices();
  const parts = plan(text, speaker);
  const canSynth = !!synth && voices.length > 0;
  if (!canSynth && !parts.some((x) => x.clip)) return Promise.resolve(); // nothing can speak (e.g. some Linux setups)
  const gen = generation;
  const run = async () => {
    for (const part of parts) {
      if (gen !== generation) return;
      if (part.clip && (await playClip(part.clip, gen))) continue;
      if (!canSynth) continue;
      const prof = resolve(part.speaker || speaker);
      const voice = voiceFor(prof.key);
      for (const c of chunks(part.text)) { if (gen !== generation) return; await utter(c, prof, voice, gen); }
    }
  };
  chain = chain.then(run);
  return chain;
}

export function stopVoices() {
  generation += 1;
  chain = Promise.resolve();
  try { synth?.cancel(); } catch (e) { /* ignore */ }
  if (currentAudio) { try { currentAudio.pause(); } catch (e) { /* ignore */ } currentAudio = null; }
}

export function isSpeaking() { return !!synth?.speaking || !!currentAudio; }
