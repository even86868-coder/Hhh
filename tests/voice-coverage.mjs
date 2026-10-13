// Checks that every line a character or the narrator can say finds a recording
// (as if the whole voice pack were recorded), using the same lookups as the game.
import { BARKS, MONSTER_BARKS, SCENES, CAMP, fill } from '../js/dialogue.js';
import { STORY } from '../js/story.js';
import { collectLines } from '../tools/voice-lines.mjs';
import { lineKey, spokenForm, paragraphs, sentences, HERO_FALLBACK, MONSTER_PACK } from '../js/voicekey.js';
import { readFileSync } from 'fs';

const cast = JSON.parse(readFileSync('voices/cast.json', 'utf8'));
const keys = new Set(collectLines({ heroVoices: cast.heroVoices }).map((l) => l.key));
const NAME = 'Quinlin';
const clip = (voice, t) => (HERO_FALLBACK[voice] || [voice]).some((v) => keys.has(lineKey(v, t)));
const found = (voice, t) => clip(voice, t) || (t.includes(NAME) && !!spokenForm(t, NAME) && clip(voice, spokenForm(t, NAME)));
const misses = [];
let total = 0;
const check = (voice, t, where) => { total++; if (!found(voice, t)) misses.push(`${where} [${voice}] ${t}`); };

const ROLE = { tank: 'Brannoc', healer: 'Tamsin', arcane: 'Quillan', skirm: 'Pip' };
const PERS = ['heroic', 'cheerful', 'grim', 'snarky'];
for (const heroVoice of ['hero_a', 'hero_b', 'hero_c', 'hero_d']) {
  for (const [id, lines] of [...Object.entries(SCENES), ...CAMP.map((c, i) => [`camp:${i}`, Array.isArray(c) ? c : c.lines])]) {
    for (const l of lines) for (const p of PERS) {
      const raw = typeof l.text === 'string' ? l.text : l.text[p];
      check(l.who === 'hero' ? heroVoice : ROLE[l.who], fill(raw, { hero: NAME }), id);
    }
  }
}
for (const [ev, by] of Object.entries(BARKS)) for (const [sp, lines] of Object.entries(by)) for (const l of lines) {
  const voices = PERS.includes(sp) ? ['hero_a', 'hero_b'] : [sp];
  for (const v of voices) for (const n of Object.values(ROLE).filter((n) => n !== sp)) check(v, fill(l, { t: n, src: n, a: n }), `bark:${ev}`);
}
for (const [k, lines] of Object.entries(MONSTER_BARKS)) for (const l of lines) check(MONSTER_PACK[k], l, `monster:${k}`);

// Narration: whole passage, else paragraphs, else sentences. Count sentences left to the device voice.
let sentencesTotal = 0;
const narrMisses = [];
for (const [id, node] of Object.entries(STORY)) {
  if (node.combat || !node.text || typeof node.text !== 'string') continue;
  for (const role of Object.keys(ROLE)) {
    const names = { ...ROLE, [role]: NAME, name: NAME, who: 'You' };
    const t = node.text.replace(/\{(\w+)\}/g, (m, k) => names[k] ?? m);
    for (const p of paragraphs(t)) for (const s of sentences(p)) sentencesTotal++;
    if (clip('gm', t)) continue;
    for (const p of paragraphs(t)) {
      if (clip('gm', p)) continue;
      for (const s of sentences(p)) if (!found('gm', s)) narrMisses.push(`${id}: ${s}`);
    }
  }
}
const uniq = (a) => [...new Set(a)];
console.log(`Dialogue: ${total - misses.length}/${total} lines recorded.`);
uniq(misses).forEach((m) => console.log('  device voice:', m));
console.log(`Narration: ${sentencesTotal - narrMisses.length}/${sentencesTotal} sentences recorded.`);
uniq(narrMisses).forEach((m) => console.log('  device voice:', m));
