// Game state, persistence and story mechanics (no DOM).
import { d, roll, mod } from './dice.js';
import { createCompanion, companionRolesFor, derive, finalAbilities, rest, maxHp, SKILLS, ABIL_NAMES, ROLES } from './rules.js';
import { STORY, START } from './story.js';

const SAVE_KEY = 'runelords.save.v1';

export const G = { state: null };

export function newGame(player) {
  const companions = companionRolesFor(player.cls).map((r) => createCompanion(r, 1));
  G.state = { version: 1, party: [player, ...companions], flags: {}, node: START, nodeApplied: false, potions: 2, gold: 0, log: [] };
  return G.state;
}

export const player = () => G.state.party[0];
export const companions = () => G.state.party.slice(1);

export function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(G.state)); } catch (e) { /* storage unavailable */ }
}
export function hasSave() {
  try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
}
export function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    G.state = JSON.parse(raw);
    return G.state;
  } catch (e) { return null; }
}
export function deleteSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } }

export function snapshot() { const { checkpoint, ...rest } = G.state; return JSON.stringify(rest); }
export function restore(json) { const cp = G.state.checkpoint; G.state = JSON.parse(json); G.state.checkpoint = cp; }

// ------------------------------------------------------------------ text
export function companionByRole(role) {
  const comps = companions();
  return comps.find((c) => c.role === role) || comps[ROLES.indexOf(role) % comps.length];
}
export function fillText(text, extra = {}) {
  const s = G.state;
  const t = typeof text === 'function' ? text(s) : text;
  return t.replace(/\{(\w+)\}/g, (m, k) => {
    if (k === 'name') return player().name;
    if (k in extra) return extra[k];
    if (ROLES.includes(k)) return companionByRole(k)?.name || 'your friend';
    if (/^c\d$/.test(k)) return companions()[+k[1]]?.name || 'your friend';
    return m;
  });
}

// ------------------------------------------------------------------ checks
export function checkMod(c, skill) {
  const s = derive(c);
  if (ABIL_NAMES[skill]) return s.m[skill];
  const v = s.skills[skill];
  if (v === null || v === undefined) return null; // trained only
  return v;
}
export function checkLabel(check) {
  const name = ABIL_NAMES[check.skill] || SKILLS[check.skill]?.name || check.skill;
  return `${name} DC ${check.dc}`;
}
export function bestFor(skill, untrained = false) {
  let best = null;
  for (const c of G.state.party) {
    if (c.dead) continue;
    let m = checkMod(c, skill);
    if (m === null) { if (!untrained) continue; m = mod(finalAbilities(c)[SKILLS[skill].ab]); }
    if (!best || m > best.mod) best = { c, mod: m };
  }
  return best;
}
export function previewCheck(check) {
  if (check.who === 'party') return bestFor(check.skill, check.untrained);
  const c = player();
  let m = checkMod(c, check.skill);
  if (m === null) m = check.untrained ? mod(finalAbilities(c)[SKILLS[check.skill].ab]) : null;
  return m === null ? { c, mod: null } : { c, mod: m };
}
export function rollCheck(check) {
  const who = previewCheck(check);
  const bonus = check.bonus ? check.bonus(G.state) : 0;
  const r = d(20);
  if (!who || who.mod === null) return { who: who?.c || player(), roll: r, mod: 0, bonus, total: 0, dc: check.dc, success: false, untrained: true };
  const total = r + who.mod + bonus;
  return { who: who.c, roll: r, mod: who.mod, bonus, total, dc: check.dc, success: total >= check.dc };
}

// ------------------------------------------------------------------ effects
export function applyEffects(effects = []) {
  const s = G.state;
  const notes = [];
  for (const fx of effects) {
    if (fx.set) Object.assign(s.flags, fx.set);
    if (fx.potions) { const n = typeof fx.potions === 'function' ? fx.potions(s) : fx.potions; s.potions += n; notes.push(`+${n} potion${n > 1 ? 's' : ''} of cure light wounds`); }
    if (fx.gold) { s.gold += fx.gold; notes.push(`+${fx.gold} gold`); }
    if (fx.trait) { player().trait = fx.trait; }
    if (fx.gear) {
      for (const c of s.party) c.gear[fx.gear.key] = Math.max(c.gear[fx.gear.key] || 0, fx.gear.val);
      const names = { resistance: 'Cloaks of resistance +1 (+1 saves)', weaponEnh: '+1 weapons (+1 attack & damage)', ringProt: 'Rings of protection +1 (+1 AC)', armorEnh: '+1 armor' };
      notes.push(`Party gear: ${names[fx.gear.key] || fx.gear.key}`);
    }
    if (fx.damage) {
      const targets = fx.damage.who === 'party' ? s.party : [player()];
      for (const c of targets) { const r = roll(fx.damage.dice).total; c.hp = Math.max(1, c.hp - r); notes.push(`${c.name} takes ${r} damage`); }
    }
  }
  return notes;
}

export function restParty() {
  for (const c of G.state.party) rest(c);
}

export function choicesFor(node) {
  return (node.choices || []).filter((ch) => {
    if (!ch.if) return true;
    return typeof ch.if === 'function' ? ch.if(G.state) : !!G.state.flags[ch.if];
  });
}

export { STORY, maxHp };
