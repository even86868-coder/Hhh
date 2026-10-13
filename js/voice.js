// Character voices via the device's built-in speech synthesis (free, offline).
export const voiceSettings = { enabled: true, narrator: false, volume: 0.9 };

export const VOICE_PRESETS = {
  deep: { name: 'Deep', pitch: 0.55, rate: 0.9, pref: 'm' },
  low: { name: 'Low', pitch: 0.8, rate: 0.95, pref: 'm' },
  warm: { name: 'Warm', pitch: 1.0, rate: 1.0, pref: 'f' },
  bright: { name: 'Bright', pitch: 1.2, rate: 1.05, pref: 'f' },
  high: { name: 'High', pitch: 1.45, rate: 1.1, pref: 'any' },
  squeaky: { name: 'Squeaky', pitch: 1.85, rate: 1.18, pref: 'any' },
};

const CHAR = {
  Brannoc: { pitch: 0.5, rate: 0.88, pref: 'm', slot: 0 },
  Tamsin: { pitch: 1.12, rate: 1.0, pref: 'f', slot: 0 },
  Quillan: { pitch: 1.25, rate: 1.14, pref: 'm', slot: 1 },
  Pip: { pitch: 1.75, rate: 1.16, pref: 'f', slot: 1 },
  narrator: { pitch: 0.95, rate: 1.0, pref: 'any', slot: 2 },
  goblin: { pitch: 2, rate: 1.3, pref: 'any', slot: 3 },
  beast: { pitch: 0.3, rate: 0.8, pref: 'm', slot: 3 },
  villain: { pitch: 0.75, rate: 0.92, pref: 'any', slot: 2 },
};

const FEMALE = /samantha|victoria|karen|moira|tessa|zira|susan|hazel|female|fiona|serena|allison|ava|jenny|aria|libby|sonia|catherine|kate|emma|amy|joanna|salli|kimberly|ivy|linda|heather|natasha|clara|michelle/i;
const MALE = /daniel|alex|david|mark|george|fred|\bmale|ryan|guy|thomas|james|oliver|arthur|aaron|matthew|joey|justin|brian|eric|steffan|christopher|roger|rishi|tom/i;

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let voices = [];
function loadVoices() {
  if (!synth) return;
  const all = synth.getVoices();
  voices = all.filter((v) => /^en/i.test(v.lang));
  if (!voices.length) voices = all;
}
if (synth) { loadVoices(); synth.addEventListener?.('voiceschanged', loadVoices); }

export const voiceAvailable = () => !!synth;

function pickVoice(pref, slot) {
  if (!voices.length) loadVoices();
  if (!voices.length) return null;
  const f = voices.filter((v) => FEMALE.test(v.name));
  const m = voices.filter((v) => MALE.test(v.name) && !FEMALE.test(v.name));
  const list = pref === 'f' && f.length ? f : pref === 'm' && m.length ? m : voices;
  return list[slot % list.length];
}

// Resolve a speaker into voice parameters.
// speaker: { name, kind: 'companion'|'hero'|'monster'|'narrator', preset?, monsterKey? }
function profile(sp) {
  if (sp.kind === 'companion' && CHAR[sp.name]) return CHAR[sp.name];
  if (sp.kind === 'hero') { const p = VOICE_PRESETS[sp.preset] || VOICE_PRESETS.warm; return { ...p, slot: 2 }; }
  if (sp.kind === 'monster') {
    if (/goblin|warchanter|ripnugget|erylium/i.test(sp.monsterKey || '')) return CHAR.goblin;
    if (/dog|boar|sinspawn|yeth/i.test(sp.monsterKey || '')) return CHAR.beast;
    return CHAR.villain;
  }
  return CHAR.narrator;
}

let chain = Promise.resolve();
let generation = 0;

// Speak a line. Returns a promise that resolves when finished (or skipped).
export function speak(text, speaker = { kind: 'narrator' }, { queue = true } = {}) {
  if (!synth || !voiceSettings.enabled || !text) return Promise.resolve();
  if (speaker.kind === 'narrator' && !voiceSettings.narrator) return Promise.resolve();
  if (!queue) stopVoices();
  if (!voices.length) loadVoices();
  if (!voices.length) return Promise.resolve(); // no installed voices (e.g. some Linux setups)
  const gen = generation;
  const run = () => new Promise((resolve) => {
    if (gen !== generation) { resolve(); return; }
    const p = profile(speaker);
    const u = new SpeechSynthesisUtterance(text.replace(/[*_]/g, ''));
    const v = pickVoice(p.pref, p.slot || 0);
    try { if (v) u.voice = v; } catch (e) { /* unusual voice object; use the default voice */ }
    u.pitch = Math.max(0, Math.min(2, p.pitch));
    u.rate = p.rate;
    u.volume = voiceSettings.volume;
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    u.onend = finish; u.onerror = finish;
    setTimeout(finish, 1500 + text.length * 90); // safety net if the engine never fires onend
    synth.speak(u);
  });
  chain = chain.then(run);
  return chain;
}

export function stopVoices() {
  generation += 1;
  chain = Promise.resolve();
  try { synth?.cancel(); } catch (e) { /* ignore */ }
}

export function isSpeaking() { return !!synth?.speaking; }
