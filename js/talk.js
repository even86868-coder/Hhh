// Glue between dialogue data, voices, AI banter and the game.
import { SCENES, CAMP, barkOptions, monsterBark, fill } from './dialogue.js';
import { speak, hasRecording, voicePackReady } from './voice.js';
import { aiReady, generateBanter } from './aibanter.js';
import { RACES, CLASSES } from './rules.js';

export const talkSettings = { bubbles: true, banter: true };

export const heroPersonality = (c) => c?.personality || 'heroic';
export function speakerOf(c) {
  if (!c) return { kind: 'narrator' };
  return c.isPlayer ? { name: c.name, kind: 'hero', preset: c.appearance?.voice || 'warm' } : { name: c.name, kind: 'companion' };
}
function barkKey(c) { return c.isPlayer ? heroPersonality(c) : c.name; }

// Skip lines that name a companion who isn't travelling with you (the player's own role is left out).
const COMPANION_NAMES = ['Brannoc', 'Tamsin', 'Quillan', 'Pip'];
export function mentionsAbsent(text, party) {
  return COMPANION_NAMES.some((n) => new RegExp(`\\b${n}\\b`).test(text) && !party.some((c) => c.name === n && !c.isPlayer && !c.dead));
}

// ------------------------------------------------------------------ story scenes
function resolveLines(lines, party) {
  const hero = party[0];
  const byRole = (role) => party.find((c) => !c.isPlayer && c.role === role && !c.dead);
  const out = [];
  for (const l of lines) {
    const c = l.who === 'hero' ? hero : byRole(l.who);
    if (!c) continue;
    const raw = typeof l.text === 'string' ? l.text : l.text[heroPersonality(hero)];
    const text = fill(raw, { hero: hero.name });
    if (mentionsAbsent(text, party)) continue;
    out.push({ c, text });
  }
  return out;
}

export function sceneLines(nodeId, state) { return SCENES[nodeId] ? resolveLines(SCENES[nodeId], state.party) : []; }

export function campLines(state) {
  state.flags.campSeen = state.flags.campSeen || [];
  const roles = new Set(state.party.filter((c) => !c.isPlayer).map((c) => c.role));
  const ok = CAMP.map((c, i) => ({ conv: Array.isArray(c) ? c : c.lines, cond: Array.isArray(c) ? null : c.if, i }))
    .filter(({ conv, cond, i }) => !state.flags.campSeen.includes(i) && (!cond || cond(state)) && conv.every((l) => l.who === 'hero' || roles.has(l.who)));
  if (!ok.length) return [];
  const { conv, i } = ok[Math.floor(Math.random() * ok.length)];
  state.flags.campSeen.push(i);
  return resolveLines(conv, state.party);
}

const aiParty = (party) => party.filter((c) => !c.dead).map((c) => ({ name: c.name, isPlayer: c.isPlayer, raceName: RACES[c.race].name, className: CLASSES[c.cls].name }));

// Ask Claude for fresh lines about this story moment. Resolves to [{c,text}] or null.
export async function aiSceneLines(state, situation, count = 3) {
  if (!aiReady() || !talkSettings.banter) return null;
  const lines = await generateBanter({ party: aiParty(state.party), heroPersonality: heroPersonality(state.party[0]), situation, count });
  if (!lines) return null;
  return lines.map((l) => ({ c: state.party.find((c) => c.name === l.speaker), text: l.text })).filter((l) => l.c);
}

// ------------------------------------------------------------------ combat barks
export class Barker {
  constructor({ view, onLine, speed = 1, state }) {
    this.view = view;
    this.onLine = onLine;
    this.speed = speed;
    this.state = state;
    this.next = 0;
    this.lastBy = new Map();
    this.aiBusy = false;
  }

  say(unit, text, { force = false, voice = true } = {}) {
    if (!text || !talkSettings.banter) return false;
    const now = performance.now();
    if (!force && now < this.next) return false;
    if (!force && now - (this.lastBy.get(unit.id) || -1e9) < 7000 / this.speed) return false;
    this.next = now + 2200 / this.speed;
    this.lastBy.set(unit.id, now);
    if (talkSettings.bubbles) this.view.say(unit, text, (1800 + text.length * 45) / Math.sqrt(this.speed));
    this.onLine?.(unit.name, text);
    if (voice) speak(text, unit.c ? speakerOf(unit.c) : { kind: 'monster', monsterKey: unit.key, name: unit.name });
    return true;
  }

  pc(unit, event, vars, opts) {
    if (!unit?.c) return false;
    const party = this.state.party;
    const named = (line) => line.replace(vars?.t || '\u0000', '').replace(vars?.src || '\u0000', '').replace(vars?.a || '\u0000', '');
    const ok = barkOptions(event, barkKey(unit.c), vars).filter((l) => !mentionsAbsent(named(l), party));
    if (!ok.length) return false;
    // Prefer lines with a recording: lines that say the hero's or an enemy's name can't be pre-recorded.
    const sp = speakerOf(unit.c);
    const recorded = voicePackReady() ? ok.filter((l) => hasRecording(l, sp)) : [];
    const pool = recorded.length ? recorded : ok;
    return this.say(unit, pool[Math.floor(Math.random() * pool.length)], opts);
  }
  monster(unit, opts) { return unit && !unit.c ? this.say(unit, monsterBark(unit.key), opts) : false; }

  livingParty(e, except) { return e.units.filter((u) => u.side === 'party' && u.conscious() && u !== except); }
  rand(list) { return list[Math.floor(Math.random() * list.length)]; }

  handle(type, d, e) {
    const roll = Math.random();
    switch (type) {
      case 'start': {
        const boss = e.units.find((u) => u.side === 'enemy' && u.def.boss) || this.rand(e.units.filter((u) => u.side === 'enemy'));
        if (boss) this.say(boss, monsterBark(boss.key), { force: true });
        setTimeout(() => { const p = this.rand(this.livingParty(e)); if (p) this.pc(p, 'start', {}, { force: true }); }, 1400 / this.speed);
        break;
      }
      case 'crit':
        if (d.att.side === 'party') { if (roll < 0.65) this.pc(d.att, 'crit'); else { const a = this.rand(this.livingParty(e, d.att)); this.pc(a, 'allyCrit', { a: d.att.name }); } }
        else if (roll < 0.6) this.monster(d.att);
        break;
      case 'miss': if (d.att.side === 'enemy' && roll < 0.12) this.monster(d.att); break;
      case 'fumble': if (d.att.side === 'party' && roll < 0.7) this.pc(d.att, 'fumble'); break;
      case 'down':
        if (d.t.side === 'party') { const a = this.rand(this.livingParty(e, d.t)); this.pc(a, 'allyDown', { t: d.t.name }, { force: true }); }
        else if (d.src?.side === 'party' && roll < 0.45) this.pc(d.src, 'kill', { t: d.t.name });
        else if (d.t.def?.boss) this.monster(d.t, { force: true });
        break;
      case 'lowHp': this.pc(d.t, 'lowHp', {}); break;
      case 'healed': if (d.src && d.src !== d.t && roll < 0.55) this.pc(d.t, 'healedBy', { src: d.src.name }); break;
      case 'revived': this.pc(d.t, 'revived', {}, { force: true }); break;
      case 'spell': if (d.u.side === 'party' && roll < 0.35) this.pc(d.u, 'spell'); else if (d.u.side === 'enemy' && roll < 0.5) this.monster(d.u); break;
      case 'end':
        if (d.res === 'victory') { const p = this.rand(this.livingParty(e)); if (p) this.pc(p, 'victory', {}, { force: true }); }
        break;
      default: break;
    }
  }
}
