// Collects every line the game can speak with a fixed text, per recorded voice.
// Lines containing the player's own name can't be pre-recorded; the game speaks
// those (and anything else unrecorded) with the device's built-in voices.
import { BARKS, MONSTER_BARKS, SCENES, CAMP, fill } from '../js/dialogue.js';
import { TIPS, ALL_GM_LINES } from '../js/gm.js';
import { STORY } from '../js/story.js';
import { ENCOUNTERS } from '../js/maps.js';
import { MONSTERS } from '../js/monsters.js';
import { lineKey, normalizeLine, MONSTER_PACK } from '../js/voicekey.js';

const COMPANION_BY_ROLE = { tank: 'Brannoc', healer: 'Tamsin', arcane: 'Quillan', skirm: 'Pip' };
const COMPANIONS = Object.values(COMPANION_BY_ROLE);
const PERSONALITIES = ['heroic', 'cheerful', 'grim', 'snarky'];
const HERO_VOICES = ['hero_a', 'hero_b', 'hero_c', 'hero_d'];
const PLAYER = '\u0000PLAYER\u0000'; // stand-in for the player's name: lines containing it are skipped

export function collectLines({ heroVoices = HERO_VOICES } = {}) {
  const out = new Map();
  const add = (voice, text, source) => {
    if (!text || text.includes(PLAYER) || /\{\w+\}/.test(text)) return;
    const t = normalizeLine(text);
    const key = lineKey(voice, t);
    if (!out.has(key)) out.set(key, { key, voice, text: t, source });
  };
  const heroVoicesFor = (personality) => heroVoices.map((v) => ({ v, personality }));

  // Combat barks. Tokens name an ally ({t}, {src}, {a}): expand with companion names.
  for (const [event, bySpeaker] of Object.entries(BARKS)) {
    for (const [speaker, lines] of Object.entries(bySpeaker)) {
      const isHero = PERSONALITIES.includes(speaker);
      const voices = isHero ? heroVoices : [speaker];
      for (const line of lines) {
        const others = COMPANIONS.filter((n) => n !== speaker);
        const variants = /\{(t|src|a)\}/.test(line) ? others.map((n) => fill(line, { t: n, src: n, a: n })) : [line];
        for (const v of voices) for (const text of variants) add(v, text, `bark:${event}`);
      }
    }
  }
  // Monster taunts
  for (const [key, lines] of Object.entries(MONSTER_BARKS)) for (const l of lines) add(MONSTER_PACK[key] || 'thug', l, `monster:${key}`);

  // Scene banter and campfire talks (role lines are always voiced by that role's companion)
  const roleLines = (lines, source) => {
    for (const l of lines) {
      if (l.who === 'hero') {
        for (const p of PERSONALITIES) for (const { v } of heroVoicesFor(p)) add(v, fill(typeof l.text === 'string' ? l.text : l.text[p], { hero: PLAYER }), source);
      } else add(COMPANION_BY_ROLE[l.who], fill(l.text, { hero: PLAYER }), source);
    }
  };
  for (const [id, lines] of Object.entries(SCENES)) roleLines(lines, `scene:${id}`);
  CAMP.forEach((c, i) => roleLines(Array.isArray(c) ? c : c.lines, `camp:${i}`));

  // Game Master: stage directions, intros, rules tips, battle lines
  for (const l of ALL_GM_LINES()) add('gm', l, 'gm');
  for (const l of Object.values(TIPS)) add('gm', l, 'gm:tip');
  const bosses = new Set();
  for (const enc of Object.values(ENCOUNTERS)) for (const e of enc.enemies) if (MONSTERS[e.key]?.boss) bosses.add(e.name || MONSTERS[e.key].name);
  for (const b of bosses) add('gm', `${b} stands before you. Roll initiative!`, 'gm:start');
  for (let n = 1; n <= 6; n++) add('gm', `${n} foes close in. Roll initiative!`, 'gm:start');

  // Story narration read by the GM: resolve role tokens for each possible party.
  for (const [id, node] of Object.entries(STORY)) {
    if (node.combat || !node.text) continue;
    for (const playerRole of Object.keys(COMPANION_BY_ROLE)) {
      const names = { ...COMPANION_BY_ROLE, [playerRole]: PLAYER, name: PLAYER, who: 'You' };
      const states = [{ flags: {}, party: [] }, { flags: new Proxy({}, { get: (t, k) => (/Seen|gmTips/.test(String(k)) ? [] : true) }), party: [] }];
      const texts = new Set();
      if (typeof node.text === 'string') texts.add(node.text);
      else for (const s of states) { try { texts.add(node.text(s)); } catch (e) { /* needs more state */ } }
      for (const t of texts) add('gm', t.replace(/\{(\w+)\}/g, (m, k) => names[k] ?? m), `story:${id}`);
    }
  }
  return [...out.values()];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { readFileSync } = await import('fs');
  const cast = JSON.parse(readFileSync('voices/cast.json', 'utf8'));
  const lines = collectLines({ heroVoices: cast.heroVoices });
  const by = {};
  let chars = 0;
  for (const l of lines) { by[l.voice] = (by[l.voice] || 0) + 1; chars += l.text.length; }
  console.log(`${lines.length} recordable lines, ${chars.toLocaleString()} characters`);
  console.log(Object.entries(by).sort((a, b) => b[1] - a[1]).map(([v, n]) => `${v}: ${n}`).join(', '));
}
