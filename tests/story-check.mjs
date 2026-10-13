// Validates the story graph: links, combats, skills, text functions, reachability, dialogue shapes.
import { STORY, START } from '../js/story.js';
import { ENCOUNTERS } from '../js/maps.js';
import { SKILLS, ABIL_NAMES, createCharacter, createCompanion, companionRolesFor } from '../js/rules.js';
import { SCENES, CAMP, BARKS, MONSTER_BARKS, countLines } from '../js/dialogue.js';
import { MONSTERS } from '../js/monsters.js';

const errors = [], warns = [];
const SPECIAL = new Set(['__title', '__return']);
const ROLE = new Set(['tank', 'healer', 'arcane', 'skirm', 'hero']);
const okTarget = (t) => SPECIAL.has(t) || STORY[t];

// Sample states (each class so every companion mix is covered)
const states = ['fighter', 'cleric', 'wizard', 'rogue'].map((cls) => {
  const p = createCharacter({ name: 'Tester', isPlayer: true, race: 'human', cls, flex: 'str', base: { str: 14, dex: 14, con: 14, int: 12, wis: 12, cha: 12 }, feats: [], skills: [] });
  p.personality = 'heroic';
  return { party: [p, ...companionRolesFor(cls).map((r) => createCompanion(r, 1))], flags: {}, potions: 2, gold: 0 };
});
const flagStates = [...states, ...states.map((s) => ({ ...s, flags: new Proxy({}, { get: (t, k) => (k === 'campSeen' || k === 'sceneSeen' || k === 'gmTips' ? [] : true) }) }))];

for (const [id, n] of Object.entries(STORY)) {
  if (n.combat) {
    if (!ENCOUNTERS[n.combat]) errors.push(`${id}: unknown combat "${n.combat}"`);
    if (!n.win || !okTarget(n.win)) errors.push(`${id}: combat needs a valid win target (got ${n.win})`);
    continue;
  }
  if (!n.text) errors.push(`${id}: missing text`);
  if (typeof n.text === 'function') for (const s of flagStates) { try { const t = n.text(s); if (typeof t !== 'string') errors.push(`${id}: text() must return a string`); } catch (e) { errors.push(`${id}: text() threw ${e.message}`); break; } }
  if (!n.end && !(n.choices || []).length) errors.push(`${id}: no choices`);
  for (const ch of n.choices || []) {
    if (!ch.t) errors.push(`${id}: choice without t`);
    if (ch.check) {
      const k = ch.check.skill;
      if (!SKILLS[k] && !ABIL_NAMES[k]) errors.push(`${id}: unknown check skill "${k}"`);
      if (typeof ch.check.dc !== 'number') errors.push(`${id}: check needs numeric dc`);
      if (!okTarget(ch.pass) || !okTarget(ch.fail)) errors.push(`${id}: check needs valid pass/fail (got ${ch.pass}/${ch.fail})`);
      if (ch.check.bonus) for (const s of flagStates) { try { ch.check.bonus(s); } catch (e) { errors.push(`${id}: bonus() threw ${e.message}`); break; } }
    } else if (!okTarget(ch.go)) errors.push(`${id}: choice "${ch.t}" -> missing node "${ch.go}"`);
    if (ch.if && typeof ch.if === 'function') for (const s of flagStates) { try { ch.if(s); } catch (e) { errors.push(`${id}: if() threw ${e.message}`); break; } }
    if (ch.go === '__return' && !ch.ret && !ch.check) { /* fine: returns to stored node */ }
  }
  for (const fx of n.on || []) if (fx.gear && !['resistance', 'weaponEnh', 'ringProt', 'armorEnh'].includes(fx.gear.key)) errors.push(`${id}: unknown gear ${fx.gear.key}`);
  const raw = typeof n.text === 'string' ? n.text : '';
  for (const m of raw.matchAll(/\{(\w+)\}/g)) if (!['name', 'who', 'tank', 'healer', 'arcane', 'skirm', 'c0', 'c1', 'c2'].includes(m[1])) errors.push(`${id}: unknown token {${m[1]}}`);
}

// Reachability (ignoring conditions)
const seen = new Set([START]);
const q = [START];
while (q.length) {
  const n = STORY[q.shift()];
  if (!n) continue;
  const nexts = n.combat ? [n.win] : (n.choices || []).flatMap((c) => [c.go, c.pass, c.fail]);
  for (const t of nexts) if (t && STORY[t] && !seen.has(t)) { seen.add(t); q.push(t); }
}
for (const id of Object.keys(STORY)) if (!seen.has(id)) warns.push(`unreachable node: ${id}`);

// Dialogue shapes
for (const [id, lines] of Object.entries(SCENES)) {
  if (!STORY[id]) warns.push(`SCENES for unknown node ${id}`);
  for (const l of lines) {
    if (!ROLE.has(l.who)) errors.push(`SCENES.${id}: bad who "${l.who}"`);
    if (typeof l.text !== 'string' && !(l.text && ['heroic', 'cheerful', 'grim', 'snarky'].every((k) => typeof l.text[k] === 'string'))) errors.push(`SCENES.${id}: hero lines need all 4 personalities`);
  }
}
CAMP.forEach((c, i) => {
  const lines = Array.isArray(c) ? c : c?.lines;
  if (!Array.isArray(lines)) { errors.push(`CAMP[${i}] must be an array or {if, lines}`); return; }
  for (const l of lines) if (!ROLE.has(l.who)) errors.push(`CAMP[${i}]: bad who "${l.who}"`);
});
const SPEAKERS = new Set(['Brannoc', 'Tamsin', 'Quillan', 'Pip', 'heroic', 'cheerful', 'grim', 'snarky']);
for (const [ev, by] of Object.entries(BARKS)) for (const sp of Object.keys(by)) if (!SPEAKERS.has(sp)) errors.push(`BARKS.${ev}: unknown speaker ${sp}`);
for (const k of Object.keys(MONSTER_BARKS)) if (!MONSTERS[k]) errors.push(`MONSTER_BARKS: unknown monster ${k}`);

console.log(`nodes: ${Object.keys(STORY).length}, reachable: ${seen.size}, combats: ${Object.values(STORY).filter((n) => n.combat).length}, dialogue lines: ${countLines()}`);
for (const w of warns) console.log('WARN', w);
for (const e of errors) console.log('ERROR', e);
console.log(errors.length ? `FAILED with ${errors.length} errors` : 'OK');
process.exit(errors.length ? 1 : 0);
