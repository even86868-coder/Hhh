// Stable fingerprint for a spoken line: who says it + exactly what is said.
// Shared by the game (to find a recording) and tools/generate-voices.mjs (to name it).
export function normalizeLine(text) {
  return String(text).replace(/\s+/g, ' ').trim();
}
export function lineKey(voiceKey, text) {
  const s = `${voiceKey}|${normalizeLine(text)}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  let h2 = 0x12345678;
  for (let i = s.length - 1; i >= 0; i--) { h2 ^= s.charCodeAt(i); h2 = Math.imul(h2, 0x5bd1e995); h2 ^= h2 >>> 13; }
  return `${voiceKey}-${(h >>> 0).toString(36)}${(h2 >>> 0).toString(36)}`;
}

// Which recorded voice a speaker uses. Hero voice presets share 4 recorded hero voices.
export const HERO_PACK = { deep: 'hero_a', low: 'hero_a', warm: 'hero_b', bright: 'hero_c', high: 'hero_c', squeaky: 'hero_d' };
export const MONSTER_PACK = {
  goblin: 'goblin', goblinArcher: 'goblin', warchanter: 'goblin', ripnugget: 'ripnugget', erylium: 'erylium',
  goblinDog: 'beast', boar: 'beast', sinspawn: 'beast', yethHound: 'beast', reefclaw: 'beast',
  tsuto: 'tsuto', bruthazmus: 'bruthazmus', orik: 'orik', lyrie: 'lyrie', nualia: 'nualia', thug: 'thug', enforcer: 'thug',
};
// If a hero voice wasn't recorded, use the most similar one that was.
export const HERO_FALLBACK = { hero_a: ['hero_a', 'hero_d', 'hero_b', 'hero_c'], hero_b: ['hero_b', 'hero_c', 'hero_a', 'hero_d'], hero_c: ['hero_c', 'hero_b', 'hero_a', 'hero_d'], hero_d: ['hero_d', 'hero_a', 'hero_c', 'hero_b'] };
export function packVoice(speaker) {
  if (!speaker) return 'gm';
  if (speaker.kind === 'companion') return speaker.name;
  if (speaker.kind === 'hero') return HERO_PACK[speaker.preset] || 'hero_b';
  if (speaker.kind === 'monster') return MONSTER_PACK[speaker.monsterKey] || 'thug';
  return 'gm'; // gm + narrator
}
