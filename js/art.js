// Painted art (art/img, made by tools/generate-art.mjs). Anything not painted yet, or the
// "Pixel" art style setting, falls back to the original pixel sprites.
export const artSettings = { style: 'painted' }; // 'painted' | 'pixel'

const pack = { keys: new Set(), dir: 'art/img' };
const images = new Map();
export async function loadArt() {
  if (typeof fetch === 'undefined' || typeof location === 'undefined' || !/^(https?|app):$/.test(location.protocol)) return 0;
  try {
    const res = await fetch('art/index.json', { cache: 'no-cache' });
    if (res.ok) { const j = await res.json(); pack.keys = new Set(j.keys || []); pack.dir = `art/${j.dir || 'img'}`; }
  } catch (e) { /* no painted art: pixel sprites only */ }
  return pack.keys.size;
}
export const artCount = () => pack.keys.size;
const file = (key) => `${pack.dir}/${key.replace(/:/g, '_')}.webp`;

// The URL for a painted image, or null to use pixel art.
export function artUrl(key) {
  return artSettings.style === 'painted' && key && pack.keys.has(key) ? file(key) : null;
}
// A loaded <img> for canvas drawing (null until it has loaded).
export function artImage(key) {
  const url = artUrl(key);
  if (!url) return null;
  let img = images.get(url);
  if (!img) { img = new Image(); img.src = url; images.set(url, img); }
  return img.complete && img.naturalWidth ? img : null;
}

// Which painting shows a character or monster.
const COMPANION_NAMES = ['Brannoc', 'Tamsin', 'Quillan', 'Pip'];
export function bodyOf(c) {
  const ap = c.appearance || {};
  if (ap.body) return ap.body;
  return ['warm', 'bright'].includes(ap.voice) ? 'f' : 'm';
}
export function characterArtKey(c) {
  if (!c) return null;
  if (!c.isPlayer && COMPANION_NAMES.includes(c.name)) return `pc:${c.name}`;
  return `hero:${c.race}:${c.cls}:${bodyOf(c)}`;
}
const NPC_ART = ['tsuto', 'orik', 'lyrie', 'nualia', 'thug', 'enforcer', 'aldern', 'ameiko', 'hemlock', 'zantus', 'gm', 'shalelu'];
export const npcArtKey = (name) => (NPC_ART.includes(name) ? `npc:${name}` : null);
export const monsterArtKey = (sprite) => npcArtKey(sprite) || `mon:${sprite}`;
export const unitArtKey = (u) => (u.c ? characterArtKey(u.c) : monsterArtKey(u.def.sprite));
export const sceneArtKey = (name) => `scene:${name}`;
