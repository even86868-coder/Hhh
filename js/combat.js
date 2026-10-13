// Pathfinder 1e tactical combat engine on a 5-ft square grid.
// Pure logic: rendering & input go through the `fx` and `controllers` hooks.
import { d, rand, mod, sign } from './dice.js';
import { derive, maxHp, CLASSES, finalAbilities } from './rules.js';
import { MONSTERS, monsterStats } from './monsters.js';
import { SPELLS, spellLevel, spellsForClass, rangeFeet } from './spells.js';

export const NOFX = {
  log() {}, update() {}, float() {},
  async move() {}, async attack() {}, async spell() {}, async banner() {}, async wait() {}, async turnStart() {},
};

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const INCAP = ['asleep', 'unconscious', 'held', 'stunned', 'dazed'];
const HELPLESS = ['asleep', 'unconscious', 'held'];

// Map tile semantics (shared with renderer)
export const TILE = {
  '.': { pass: true }, ',': { pass: true }, 'b': { pass: true }, 'P': { pass: true },
  '#': { pass: false, los: false }, 'T': { pass: false, los: false }, 'f': { pass: false, los: false },
  '~': { pass: false, los: true }, 'c': { pass: false, los: true, cover: true }, 't': { pass: false, los: true, cover: true },
  'S': { pass: false, los: false }, 'w': { pass: false, los: true },
  '%': { pass: true, difficult: true }, 'r': { pass: true, difficult: true },
  'g': { pass: false, los: true, cover: true }, 'A': { pass: false, los: true, cover: true },
};
export const tileInfo = (ch) => TILE[ch] || { pass: true };

// ------------------------------------------------------------------ Unit
export class Unit {
  constructor(o) { Object.assign(this, o); this.st = {}; this.tempHp = 0; this.acted = false; this.aoo = 0; this.uses = this.uses || {}; this.loaded = true; this.powerAttack = false; }
  get isPC() { return !!this.c; }
  flags() {
    const f = {};
    for (const [k, s] of Object.entries(this.st)) f[k] = s.v !== undefined ? s.v : true;
    if (HELPLESS.some((k) => this.st[k]) || (this.hp < 0 && !this.ferocious)) f.helpless = true;
    if (!this.acted && !this.uncanny()) f.flatFooted = true;
    return f;
  }
  uncanny() {
    if (!this.c) return false;
    return (this.c.cls === 'barbarian' && this.c.level >= 2) || (this.c.cls === 'rogue' && this.c.level >= 4);
  }
  stats() { return this.c ? derive(this.c, this.flags()) : monsterStats(this.def, this.flags()); }
  get maxHp() { return this.c ? maxHp(this.c) : this.hpMax || this.def.hp; }
  conscious() { return !this.dead && (this.hp >= 0 || this.ferocious) && !this.st.asleep && !this.st.unconscious; }
  canAct() { return this.conscious() && !INCAP.some((k) => this.st[k]); }
  out() { return this.dead || this.fled || (this.hp < 0 && !this.ferocious); }
}

// ------------------------------------------------------------------ Engine
export class Combat {
  constructor({ map, party, enemies, fx = NOFX, controllers, surprise = null, playerId = null }) {
    this.map = map;
    this.fx = fx;
    this.controllers = controllers;
    this.surprise = surprise; // 'party' | 'enemy' | null
    this.round = 0;
    this.units = [];
    this.logLines = [];
    const starts = [];
    const eStarts = {};
    map.tiles.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === 'P') starts.push({ x, y });
      else if (/[1-9]/.test(ch)) eStarts[ch] = { x, y };
    }));
    party.filter((c) => !c.dead).forEach((c, i) => {
      const p = starts[i] || starts[0];
      this.units.push(new Unit({ id: c.id, side: 'party', name: c.name, c, x: p.x, y: p.y, hp: c.hp, isPlayer: c.id === playerId || c.isPlayer }));
    });
    enemies.forEach((e, i) => {
      const def = MONSTERS[e.key];
      const p = e.pos ? e.pos : eStarts[String(e.at || i + 1)];
      const u = new Unit({ id: `e${i}`, side: 'enemy', name: e.name || def.name, def, key: e.key, x: p.x, y: p.y, hp: def.hp, uses: { spells: { ...(def.spells || {}) } } });
      if (e.mods) Object.assign(u, e.mods);
      this.units.push(u);
    });
    // number duplicate monster names
    const counts = {};
    for (const u of this.units.filter((x) => x.side === 'enemy')) counts[u.name] = (counts[u.name] || 0) + 1;
    const seen = {};
    for (const u of this.units.filter((x) => x.side === 'enemy')) if (counts[u.name] > 1) { seen[u.name] = (seen[u.name] || 0) + 1; u.name = `${u.name} ${seen[u.name]}`; }
  }

  // ---------------------------------------------------------------- utils
  log(text, cls = '') { this.logLines.push({ text, cls }); this.fx.log(text, cls); }
  float(u, text, color) { this.fx.float(u, text, color); }
  tile(x, y) { return this.map.tiles[y]?.[x] ?? '#'; }
  inBounds(x, y) { return x >= 0 && y >= 0 && x < this.map.w && y < this.map.h; }
  passable(x, y) { return this.inBounds(x, y) && tileInfo(this.tile(x, y)).pass; }
  difficult(x, y) { return !!tileInfo(this.tile(x, y)).difficult; }
  blocksLos(x, y) { return tileInfo(this.tile(x, y)).los === false; }
  unitAt(x, y, { includeDown = false } = {}) {
    return this.units.find((u) => u.x === x && u.y === y && !u.dead && !u.fled && (includeDown || u.conscious()));
  }
  occupied(x, y, self) { return this.units.some((u) => u !== self && u.x === x && u.y === y && !u.dead && !u.fled); }
  enemiesOf(u) { return this.units.filter((o) => o.side !== u.side && !o.out()); }
  alliesOf(u, incSelf = false) { return this.units.filter((o) => o.side === u.side && !o.dead && !o.fled && (incSelf || o !== u)); }
  adjacent(a, b) { return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) === 1; }
  cheb(a, b) { return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)); }
  dist(a, b) {
    const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
    const diag = Math.min(dx, dy), straight = Math.max(dx, dy) - diag;
    return 5 * (straight + diag + Math.floor(diag / 2));
  }
  line(a, b) {
    const pts = [];
    let x0 = a.x, y0 = a.y; const x1 = b.x, y1 = b.y;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    while (true) {
      pts.push({ x: x0, y: y0 });
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
    return pts;
  }
  los(a, b) { return this.line(a, b).slice(1, -1).every((p) => !this.blocksLos(p.x, p.y)); }
  softCover(a, b) {
    return this.line(a, b).slice(1, -1).some((p) => this.units.some((u) => u.x === p.x && u.y === p.y && !u.dead && !u.fled) || tileInfo(this.tile(p.x, p.y)).cover);
  }

  // A creature threatens adjacent squares if it can make attacks of opportunity.
  threatens(u) {
    if (!u.canAct()) return false;
    const s = u.stats();
    if (!s.attacks.melee.length || s.attacks.melee[0].unarmed) return false;
    if (!u.acted && !u.uncanny() && !s.feats.has('combatReflexes')) return false; // flat-footed
    return true;
  }
  threatenersOf(x, y, u) {
    return this.units.filter((o) => o.side !== u.side && !o.out() && Math.max(Math.abs(o.x - x), Math.abs(o.y - y)) === 1 && this.threatens(o));
  }
  isThreatened(u) { return this.threatenersOf(u.x, u.y, u).length > 0; }

  flanked(att, tgt) {
    if (!this.adjacent(att, tgt)) return false;
    const va = [att.x - tgt.x, att.y - tgt.y];
    return this.alliesOf(att).some((al) => {
      if (!this.adjacent(al, tgt) || !this.threatens(al)) return false;
      const vb = [al.x - tgt.x, al.y - tgt.y];
      const cos = (va[0] * vb[0] + va[1] * vb[1]) / (Math.hypot(...va) * Math.hypot(...vb));
      return cos <= -0.7;
    });
  }

  // ---------------------------------------------------------------- movement
  // Dijkstra over (x, y, diagonal parity, AoOs provoked). Follows PF diagonal 5/10 rule.
  reachable(u, maxFeet) {
    const key = (x, y, p, a) => `${x},${y},${p},${a}`;
    const startK = key(u.x, u.y, 0, 0);
    const best = new Map([[startK, { x: u.x, y: u.y, p: 0, a: 0, feet: 0, prev: null }]]);
    const open = [best.get(startK)];
    const flying = u.isPC ? false : !!u.def.flying;
    const threatCache = new Map();
    const threatened = (x, y) => {
      const k = `${x},${y}`;
      if (!threatCache.has(k)) threatCache.set(k, this.threatenersOf(x, y, u).length > 0);
      return threatCache.get(k);
    };
    while (open.length) {
      open.sort((a, b) => a.feet - b.feet);
      const cur = open.shift();
      for (const [dx, dy] of DIRS) {
        const nx = cur.x + dx, ny = cur.y + dy;
        if (!this.passable(nx, ny)) continue;
        const diag = dx !== 0 && dy !== 0;
        if (diag && (!this.passable(cur.x + dx, cur.y) || !this.passable(cur.x, cur.y + dy))) continue;
        const blocker = this.units.find((o) => o.x === nx && o.y === ny && !o.dead && !o.fled && o.side !== u.side && o.conscious());
        if (blocker) continue;
        let cost = diag ? (cur.p ? 10 : 5) : 5;
        if (this.difficult(nx, ny) && !flying) cost *= 2;
        const feet = cur.feet + cost;
        if (feet > maxFeet) continue;
        const np = diag ? 1 - cur.p : cur.p;
        const na = Math.min(3, cur.a + (threatened(cur.x, cur.y) ? 1 : 0));
        const k = key(nx, ny, np, na);
        const ex = best.get(k);
        if (!ex || ex.feet > feet) {
          const node = { x: nx, y: ny, p: np, a: na, feet, prev: cur };
          best.set(k, node);
          open.push(node);
        }
      }
    }
    const cells = new Map();
    for (const n of best.values()) {
      if (n.x === u.x && n.y === u.y) continue;
      if (this.occupied(n.x, n.y, u)) continue;
      const ck = `${n.x},${n.y}`;
      const ex = cells.get(ck);
      if (!ex || n.a < ex.a || (n.a === ex.a && n.feet < ex.feet)) cells.set(ck, n);
    }
    const out = new Map();
    for (const [ck, n] of cells) {
      const path = [];
      for (let p = n; p; p = p.prev) path.unshift({ x: p.x, y: p.y });
      out.set(ck, { x: n.x, y: n.y, feet: n.feet, aoo: n.a, path });
    }
    return out;
  }

  // ---------------------------------------------------------------- turn economy
  canUse(kind) {
    const b = this.b;
    if (!b || b.done) return false;
    if (b.single || b.disabled) {
      if (kind === 'free') return true;
      if (kind === 'swift') return b.swift;
      if (b.singleUsed) return false;
      if (kind === 'step') return b.step && !b.movedDistance;
      return kind === 'std' || kind === 'move';
    }
    switch (kind) {
      case 'std': return b.std;
      case 'move': return b.move || b.std;
      case 'full': return b.std && b.move && !b.movedDistance;
      case 'swift': return b.swift;
      case 'step': return b.step && !b.movedDistance;
      case 'free': return true;
      default: return false;
    }
  }
  use(kind) {
    const b = this.b;
    if (b.single && kind !== 'free' && kind !== 'swift' && kind !== 'step') b.singleUsed = true;
    switch (kind) {
      case 'std': b.std = false; break;
      case 'move': if (b.move) b.move = false; else b.std = false; break;
      case 'full': b.std = false; b.move = false; break;
      case 'swift': b.swift = false; break;
      case 'step': b.step = false; break;
      default: break;
    }
    if (b.disabled && (kind === 'std' || kind === 'full')) b.strenuous = true;
    if (b.disabled && kind !== 'free' && kind !== 'swift' && kind !== 'step') b.singleUsed = true;
    if (kind === 'std' || kind === 'full') this.current.attackedThisTurn = true;
  }
  turnOver() {
    const b = this.b;
    if (!b || b.done) return true;
    if (!this.current.canAct()) return true;
    if (b.single || b.disabled) return b.singleUsed;
    return !b.std && !b.move;
  }
  endTurn() { if (this.b) this.b.done = true; }

  // ---------------------------------------------------------------- run
  rollInitiative() {
    for (const u of this.units) {
      const s = u.stats();
      u.initMod = s.init;
      u.init = d(20) + s.init;
    }
    this.order = [...this.units].sort((a, b) => b.init - a.init || b.initMod - a.initMod || rand() - 0.5);
    this.log(`Initiative: ${this.order.map((u) => `${u.name} ${u.init}`).join(', ')}`, 'sys');
  }

  result() {
    const party = this.units.filter((u) => u.side === 'party');
    if (party.every((u) => !u.conscious() || u.st.held)) return 'defeat';
    if (this.units.filter((u) => u.side === 'enemy').every((u) => u.out())) return 'victory';
    return null;
  }

  async run() {
    this.fx.update();
    this.rollInitiative();
    if (this.surprise) {
      this.round = 0;
      await this.fx.banner(this.surprise === 'party' ? 'Surprise round!' : 'Ambush!');
      this.log(this.surprise === 'party' ? 'You catch the enemy unaware!' : 'The enemy catches you unaware!', 'sys');
      for (const u of this.order) {
        if (this.result()) break;
        if (u.side === this.surprise && !u.out()) await this.turn(u, { single: true });
      }
    }
    while (!this.result()) {
      this.round += 1;
      await this.fx.banner(`Round ${this.round}`);
      for (const u of this.order) {
        if (this.result()) break;
        if (u.dead || u.fled) continue;
        await this.turn(u, {});
      }
      if (this.round > 60) break;
    }
    const res = this.result() || 'defeat';
    this.finish(res);
    return res;
  }

  async turn(u, { single = false }) {
    this.current = u;
    u.acted = true;
    u.aoo = 0;
    u.attackedThisTurn = false;
    this.b = { std: true, move: true, swift: true, step: true, movedDistance: false, single, singleUsed: false, done: false };
    this.refreshAuras();
    this.fx.update();

    // Dying
    if (u.hp < 0 && !u.dead && !u.ferocious) {
      if (u.stable) return;
      const con = mod(u.stats().conScore);
      const r = d(20);
      if (r === 20 || r + con >= 10 - u.hp) { u.stable = true; this.log(`${u.name} stabilizes (${r}${sign(con)} vs DC ${10 - u.hp}).`, 'heal'); }
      else { this.log(`${u.name} is bleeding out...`, 'bad'); await this.dealDamage(u, 1, { bleed: true }); }
      return;
    }
    if (u.ferocious) { await this.dealDamage(u, 1, { bleed: true }); if (u.out()) return; this.b.disabled = true; }

    // Start-of-turn effects
    const s0 = u.stats();
    if (s0.fastHealing && u.hp < u.maxHp && u.hp >= 0) await this.heal(u, s0.fastHealing, null, true);
    if (u.st.acidArrow) await this.dealDamage(u, d(4) + d(4), { spell: true, note: 'acid' });
    if (u.st.rage && u.c) {
      u.c.used.rage = (u.c.used.rage || 0) + 1;
      if (u.c.used.rage > this.rageRounds(u)) this.endRage(u);
    }
    if (u.st.held && (await this.save(u, 'will', u.st.held.v, { enchant: true, quiet: true }))) {
      delete u.st.held; this.log(`${u.name} breaks free of the hold!`);
    }
    const incap = INCAP.find((k) => u.st[k]);
    this.tickStatuses(u);
    if (u.out()) return;
    if (incap) {
      this.log(`${u.name} is ${incap} and can't act.`, 'sys');
      await this.fx.turnStart(u);
      await this.fx.wait(350);
      return;
    }
    if (u.hp === 0) this.b.disabled = true;
    await this.fx.turnStart(u);
    if (u.st.prone) {
      this.log(`${u.name} stands up.`);
      this.use('move');
      delete u.st.prone;
      await this.provoke(u, 'stands up');
      if (!u.canAct()) return;
    }
    const ctl = u.isPlayer ? this.controllers.player : this.controllers.ai;
    await ctl(this, u);
    if (this.b.strenuous && u.hp === 0) { this.log(`${u.name} strains and starts dying!`, 'bad'); await this.dealDamage(u, 1, {}); }
    this.b.done = true;
    this.fx.update();
  }

  tickStatuses(u) {
    for (const [k, s] of Object.entries(u.st)) {
      if (s.r === Infinity) continue;
      s.r -= 1;
      if (s.r <= 0) {
        delete u.st[k];
        if (k === 'mageArmor' || k === 'guidance') continue;
        if (!['totalDefense', 'charging', 'cleaving'].includes(k)) this.log(`${u.name}: ${k.replace(/([A-Z])/g, ' $1').toLowerCase()} ends.`, 'sys');
      }
    }
  }

  addStatus(u, key, rounds, v) {
    if (key === 'shaken' && (u.stats().immune.includes('fear'))) { this.log(`${u.name} is immune to fear!`); return; }
    const cur = u.st[key];
    u.st[key] = { r: Math.max(rounds, cur?.r || 0), v: v !== undefined ? v : cur?.v };
    this.fx.update();
  }

  finish(res) {
    for (const u of this.units.filter((x) => x.side === 'party')) {
      const c = u.c;
      if (u.dead) { c.dead = true; c.hp = -1; continue; }
      c.hp = res === 'victory' && u.hp < 1 ? 1 : Math.min(u.hp, maxHp(c));
      if (u.st.rage) this.endRage(u, true);
    }
  }

  // ---------------------------------------------------------------- damage / healing
  async dealDamage(t, amount, { src = null, spell = false, bleed = false, weapon = false, note = '' } = {}) {
    if (t.dead || amount <= 0) return 0;
    let amt = Math.max(1, Math.floor(amount));
    const s = t.stats();
    if (weapon && s.dr && !(src && src.smiteTarget === t.id)) {
      amt = Math.max(0, amt - s.dr.amt);
      if (amt === 0) { this.log(`${t.name}'s damage reduction absorbs the blow!`, 'sys'); this.float(t, 'DR', '#ccc'); return 0; }
    }
    if (t.tempHp > 0) { const ab = Math.min(t.tempHp, amt); t.tempHp -= ab; amt -= ab; }
    t.hp -= amt;
    if (!bleed) this.float(t, `-${amount}`, '#ff5050');
    if (t.st.asleep) { delete t.st.asleep; this.log(`${t.name} wakes up!`); }
    if (note) this.log(`${t.name} takes ${amt} ${note} damage.`);
    this.checkDown(t);
    this.fx.update();
    return amt;
  }

  checkDown(t) {
    const s = t.stats();
    if (t.side === 'enemy' && !s.ferocity) {
      if (t.hp < 0) { t.dead = true; this.log(`${t.name} is defeated!`, 'good'); }
      return;
    }
    if (t.hp <= -s.conScore) { t.dead = true; t.ferocious = false; this.log(`${t.name} has died!`, 'bad'); return; }
    if (t.hp < 0) {
      if (s.ferocity && !t.ferocious && !(t.c?.used.ferocity)) {
        t.ferocious = true; if (t.c) t.c.used.ferocity = true;
        this.log(`${t.name} fights on with ferocity!`, t.side === 'party' ? 'good' : 'bad');
        return;
      }
      if (t.ferocious) return;
      if (t.side === 'enemy') { t.dead = true; this.log(`${t.name} is defeated!`, 'good'); return; }
      t.stable = false;
      this.log(`${t.name} falls unconscious and is dying!`, 'bad');
      if (t.st.rage) this.endRage(t, true);
    } else if (t.hp === 0) this.log(`${t.name} is disabled (0 HP).`, 'bad');
  }

  async heal(t, amount, src, quiet = false) {
    if (t.dead) return;
    const before = t.hp;
    t.hp = Math.min(t.maxHp, t.hp + amount);
    if (t.hp >= 0) { t.stable = false; if (t.ferocious && t.hp >= 0) t.ferocious = false; }
    if (!quiet) this.log(`${t.name} heals ${t.hp - before} HP${before < 0 && t.hp >= 0 ? ' and is back on their feet' : ''}.`, 'heal');
    this.float(t, `+${t.hp - before}`, '#7dff8a');
    this.fx.update();
  }

  // ---------------------------------------------------------------- saves
  dc(caster, level) { return 10 + level + (caster.stats().caster?.mod || 0); }
  async save(t, kind, dc, { enchant = false, fear = false, quiet = false } = {}) {
    const s = t.stats();
    let bonus = s[kind] + (enchant ? s.enchantSave : 0) + (fear ? s.fearSave + (t.st.blessed ? 1 : 0) : 0);
    if (t.st.guidance) { bonus += 1; delete t.st.guidance; }
    const r = d(20);
    const ok = r === 20 || (r !== 1 && r + bonus >= dc);
    if (!quiet || ok) this.log(`${t.name} ${kind === 'will' ? 'Will' : kind === 'fort' ? 'Fort' : 'Reflex'} save: ${r}${sign(bonus)}=${r + bonus} vs DC ${dc} — ${ok ? 'saved' : 'failed'}.`, ok ? '' : 'sys');
    return ok;
  }
  async reflexHalf(t, dc, dmg) {
    const ok = await this.save(t, 'ref', dc);
    if (ok) return t.stats().evasion ? 0 : Math.floor(dmg / 2);
    return dmg;
  }
  spellDmg(c, n, s, bonus, { crit = false, evocation = false, fire = false } = {}) {
    const cs = c.stats();
    let t = bonus;
    for (let i = 0; i < n * (crit ? 2 : 1); i++) t += d(s);
    if (evocation) t += cs.intense || 0;
    if (fire && cs.draconic) t += n;
    return t;
  }

  // ---------------------------------------------------------------- attacks
  attackProfile(u, mode) {
    const s = u.stats();
    return mode === 'ranged' ? s.attacks.ranged[0] : s.attacks.melee[0];
  }
  inRange(u, t, prof) {
    const dist = this.dist(u, t);
    if (!prof) return false;
    if (!prof.range) return this.adjacent(u, t);
    const maxR = prof.range * (prof.thrown ? 5 : 10);
    return dist <= maxR && this.los(u, t);
  }
  canAttack(u, t, mode) {
    if (!t || t.out() || t.side === u.side) return false;
    const prof = this.attackProfile(u, mode);
    return this.inRange(u, t, prof);
  }

  // Situational modifiers for an attack. Returns { atk, dmg, notes, precision }
  situational(att, tgt, prof, { charge = false, touch = false, aoo = false, ranged = false } = {}) {
    const as = att.stats(), ts = tgt.stats();
    let atk = 0, dmg = 0, precision = 0;
    const notes = [];
    if (charge) { atk += 2; notes.push('charge +2'); }
    if (!ranged && this.flanked(att, tgt)) { atk += 2; notes.push('flank +2'); }
    if (!ranged && ts.acParts.dex === -5) { atk += 4; notes.push('helpless +4'); }
    if (!ranged && att.st.prone) atk -= 4;
    if (ranged) {
      const dist = this.dist(att, tgt);
      if (prof?.range) { const inc = Math.floor(Math.max(0, dist - 1) / prof.range); if (inc > 0) { atk -= 2 * inc; notes.push(`range -${2 * inc}`); } }
      if (!as.feats.has('preciseShot') && this.alliesOf(att).some((a) => a.conscious() && this.adjacent(a, tgt))) { atk -= 4; notes.push('into melee -4'); }
      if (as.feats.has('pointBlank') && dist <= 30 && !touch) { atk += 1; dmg += 1; }
    }
    if (att.powerAttack && !ranged && !touch && as.feats.has('powerAttack')) {
      const pa = 1 + Math.floor(as.bab / 4);
      atk -= pa; dmg += prof?.twoHanded ? pa * 3 : pa * 2; notes.push(`power attack -${pa}`);
    }
    if (as.favoredEnemy && (ts.subtypes.includes(as.favoredEnemy) || ts.type === as.favoredEnemy)) { atk += 2; dmg += 2; notes.push('favored enemy +2'); }
    if (as.hatred.some((h) => ts.subtypes.includes(h))) { atk += 1; notes.push('hatred +1'); }
    if (as.favoredVs && ts.subtypes.some((s) => s === as.favoredVs || s === 'halfElf')) { atk += 2; dmg += 2; }
    if (att.smiteTarget === tgt.id) { const cha = Math.max(0, as.m.cha); atk += cha; dmg += att.c ? att.c.level : as.hd; notes.push(`smite +${cha}`); }
    if (att.st.guidance) { atk += 1; delete att.st.guidance; }
    if (aoo && att.c?.trait === 'coin') atk += 1;
    // precision damage
    const flatFoot = tgt.flags().flatFooted || tgt.st.blinded || tgt.st.stunned || ts.acParts.dex === -5;
    if (as.sneak && (flatFoot || (!ranged && this.flanked(att, tgt))) && (!ranged || this.dist(att, tgt) <= 30)) {
      for (let i = 0; i < as.sneak; i++) precision += d(6);
      notes.push(`sneak +${as.sneak}d6`);
    }
    return { atk, dmg, precision, notes };
  }

  targetAC(att, tgt, { touch = false, ranged = false } = {}) {
    const ts = tgt.stats();
    let ac = touch ? ts.touch : ts.ac;
    if (ranged && this.softCover(att, tgt)) ac += 4;
    if (tgt.st.prone) ac += ranged ? 4 : -4;
    if (ts.defensive && att.stats().subtypes?.includes('giant')) ac += 4;
    return ac;
  }

  async resolveAttack(att, tgt, prof, opts = {}) {
    const ranged = !!opts.ranged;
    const sit = this.situational(att, tgt, prof, opts);
    const bonus = prof.bonus + sit.atk + (opts.extraAtk || 0);
    const ac = this.targetAC(att, tgt, { touch: opts.touch, ranged });
    const r = d(20);
    let hit = r === 20 || (r !== 1 && r + bonus >= ac);
    let crit = false;
    let concealMiss = false;
    if (hit && att.st.blinded && rand() < 0.5) { hit = false; concealMiss = true; }
    if (hit && r >= (prof.crit || 20)) {
      const r2 = d(20);
      crit = r2 === 20 || (r2 !== 1 && r2 + bonus >= ac);
    }
    const label = opts.label || prof.name;
    let line = `${att.name} ${opts.aoo ? 'AoO ' : ''}→ ${tgt.name} (${label}): ${r}${sign(bonus)}=${r + bonus} vs ${opts.touch ? 'touch ' : ''}AC ${ac}`;
    if (sit.notes.length) line += ` [${sit.notes.join(', ')}]`;
    let dmg = 0;
    if (!hit) {
      line += concealMiss ? ' — misses (blinded)!' : r === 1 ? ' — fumble!' : ' — miss.';
      this.log(line, 'miss');
      await this.fx.attack(att, tgt, { ranged, hit: false, icon: prof.icon });
      this.float(tgt, 'miss', '#ddd');
      return { hit: false, crit: false, dmg: 0 };
    }
    if (opts.touch) {
      this.log(line + (crit ? ' — CRITICAL touch!' : ' — touch!'), 'hit');
      await this.fx.attack(att, tgt, { ranged, hit: true, touch: true, crit });
      return { hit: true, crit, dmg: 0 };
    }
    const mult = crit ? prof.mult : 1;
    for (let i = 0; i < mult; i++) {
      for (let k = 0; k < prof.n; k++) dmg += d(prof.s);
      dmg += prof.dmgBonus + sit.dmg;
    }
    dmg = Math.max(1, dmg) + sit.precision;
    line += crit ? ` — CRITICAL HIT! ${dmg} dmg` : ` — hit, ${dmg} dmg`;
    this.log(line, crit ? 'crit' : 'hit');
    await this.fx.attack(att, tgt, { ranged, hit: true, crit, icon: prof.icon });
    if (crit) this.float(tgt, 'CRIT!', '#ffd84a');
    await this.dealDamage(tgt, dmg, { src: att, weapon: true });
    if (prof.effect && !tgt.out()) await this.onHitEffect(att, tgt, prof.effect);
    return { hit: true, crit, dmg };
  }

  async onHitEffect(att, tgt, effect) {
    if (effect === 'sinfulBite') {
      if (!(await this.save(tgt, 'will', 12))) { this.addStatus(tgt, 'sickened', d(4)); this.float(tgt, 'Sick', '#b0e060'); }
    } else if (effect === 'poisonDex') {
      if (!(await this.save(tgt, 'fort', 13))) {
        const cur = tgt.st.dexDamage?.v || 0;
        this.addStatus(tgt, 'dexDamage', Infinity, cur + d(2));
        this.float(tgt, 'Poison', '#b0e060');
      }
    } else if (effect === 'trip') {
      const as = att.stats(), ts = tgt.stats();
      const r = d(20);
      if (r + as.cmb >= ts.cmd) { this.addStatus(tgt, 'prone', Infinity); this.log(`${tgt.name} is knocked prone!`); this.float(tgt, 'Prone', '#ddd'); }
    }
  }

  async provoke(mover, why = 'moves') {
    for (const o of this.threatenersOf(mover.x, mover.y, mover)) {
      if (mover.out()) return;
      const os = o.stats();
      const maxAoo = 1 + (os.feats.has('combatReflexes') ? Math.max(0, os.m.dex) : 0);
      if (o.aoo >= maxAoo) continue;
      o.aoo += 1;
      this.log(`${mover.name} ${why} and provokes an attack of opportunity!`, 'sys');
      await this.resolveAttack(o, mover, os.attacks.melee[0], { aoo: true });
    }
  }

  // ---------------------------------------------------------------- actions
  async walk(u, path, { provoke = true } = {}) {
    const provoked = new Set();
    for (let i = 1; i < path.length; i++) {
      const from = path[i - 1], to = path[i];
      if (provoke) {
        for (const o of this.threatenersOf(from.x, from.y, u)) {
          if (provoked.has(o.id) || u.out()) continue;
          const os = o.stats();
          const maxAoo = 1 + (os.feats.has('combatReflexes') ? Math.max(0, os.m.dex) : 0);
          if (o.aoo >= maxAoo) continue;
          provoked.add(o.id);
          o.aoo += 1;
          this.log(`${u.name} moves out of ${o.name}'s reach — attack of opportunity!`, 'sys');
          await this.resolveAttack(o, u, os.attacks.melee[0], { aoo: true });
        }
      }
      if (!u.conscious() || u.st.prone) return false;
      u.x = to.x; u.y = to.y;
      await this.fx.move(u, from, to);
    }
    return true;
  }

  async moveTo(u, x, y) {
    if (!this.canUse('move') || this.b.stepped) return false;
    const r = this.reachable(u, u.stats().speed).get(`${x},${y}`);
    if (!r) return false;
    this.use('move');
    this.b.movedDistance = true;
    await this.walk(u, r.path);
    return true;
  }

  async step(u, x, y) {
    if (!this.canUse('step') || this.b.movedDistance) return false;
    if (Math.max(Math.abs(u.x - x), Math.abs(u.y - y)) !== 1) return false;
    if (!this.passable(x, y) || this.occupied(x, y, u) || this.difficult(x, y) || u.stats().speed <= 5) return false;
    const dx = x - u.x, dy = y - u.y;
    if (dx && dy && (!this.passable(u.x + dx, u.y) || !this.passable(u.x, u.y + dy))) return false;
    this.use('step');
    this.b.movedDistance = true;
    this.b.stepped = true;
    const from = { x: u.x, y: u.y };
    u.x = x; u.y = y;
    this.log(`${u.name} takes a 5-foot step.`);
    await this.fx.move(u, from, { x, y });
    return true;
  }

  stepOptions(u) {
    if (!this.canUse('step') || this.b.movedDistance) return [];
    const out = [];
    for (const [dx, dy] of DIRS) {
      const x = u.x + dx, y = u.y + dy;
      if (!this.passable(x, y) || this.occupied(x, y, u) || this.difficult(x, y)) continue;
      if (dx && dy && (!this.passable(u.x + dx, u.y) || !this.passable(u.x, u.y + dy))) continue;
      out.push({ x, y });
    }
    return out;
  }

  async ensureLoaded(u, prof) {
    if (!prof.reload || u.loaded) return true;
    if (this.b.move && !this.b.single) {
      this.b.move = false;
      u.loaded = true;
      this.log(`${u.name} reloads (move action).`);
      await this.provoke(u, 'reloads');
      return u.canAct();
    }
    return false;
  }

  async attack(u, t, mode = 'melee') {
    if (!this.canUse('std') || !this.canAttack(u, t, mode)) return false;
    const prof = this.attackProfile(u, mode);
    if (mode === 'ranged' && !(await this.ensureLoaded(u, prof))) { this.log(`${u.name} must reload first.`, 'sys'); return false; }
    this.use('std');
    if (mode === 'ranged') { await this.provoke(u, 'shoots'); if (!u.canAct()) return true; }
    if (prof.reload) u.loaded = false;
    await this.resolveAttack(u, t, prof, { ranged: mode === 'ranged' });
    return true;
  }

  fullAttackList(u, mode) {
    const s = u.stats();
    if (mode === 'ranged') {
      if (s.attacks.fullRanged?.length) return s.attacks.fullRanged;
      const p = s.attacks.ranged[0];
      if (!p) return [];
      if (s.feats.has('rapidShot') && !p.reload) return [{ ...p, bonus: p.bonus - 2, name: `${p.name} (rapid)` }, { ...p, bonus: p.bonus - 2, name: `${p.name} (rapid)` }];
      return [p];
    }
    if (s.attacks.fullMelee?.length) return s.attacks.fullMelee;
    const p = s.attacks.melee[0];
    const list = [p];
    if (s.bab >= 6) list.push({ ...p, bonus: p.bonus - 5 });
    return list;
  }

  async fullAttack(u, t, mode = 'melee') {
    if (!this.canUse('full') || !this.canAttack(u, t, mode)) return false;
    const list = this.fullAttackList(u, mode);
    if (mode === 'ranged' && !(await this.ensureLoaded(u, list[0]))) return false;
    this.use('full');
    if (mode === 'ranged') { await this.provoke(u, 'shoots'); if (!u.canAct()) return true; }
    let target = t;
    for (const prof of list) {
      if (target.out()) {
        target = this.enemiesOf(u).find((e) => this.inRange(u, e, prof));
        if (!target) break;
      }
      if (prof.reload) u.loaded = false;
      await this.resolveAttack(u, target, prof, { ranged: mode === 'ranged' });
      if (!u.canAct()) break;
    }
    return true;
  }

  chargePath(u, t) {
    const s = u.stats();
    if (u.st.fatigued) return null;
    const maxFeet = s.speed * 2;
    const spots = DIRS.map(([dx, dy]) => ({ x: t.x + dx, y: t.y + dy }))
      .filter((p) => this.passable(p.x, p.y) && !this.occupied(p.x, p.y, u))
      .sort((a, b) => this.dist(u, a) - this.dist(u, b));
    for (const p of spots) {
      const dist = this.dist(u, p);
      if (dist < 10 || dist > maxFeet) continue;
      const line = this.line(u, p);
      // must be the closest square from which to attack, and clear
      if (this.dist(u, p) > this.dist(u, spots[0]) + 5) continue;
      const ok = line.slice(1).every((q) => this.passable(q.x, q.y) && !this.difficult(q.x, q.y) && !this.occupied(q.x, q.y, u));
      if (ok) return line;
    }
    return null;
  }

  async charge(u, t) {
    if (!this.canUse('full') && !(this.b.single && !this.b.singleUsed)) return false;
    if (!t || t.out() || t.side === u.side) return false;
    const path = this.chargePath(u, t);
    if (!path) return false;
    const s = u.stats();
    if (this.b.single) { if (path.length - 1 > s.speed / 5) return false; this.b.singleUsed = true; } else this.use('full');
    this.b.movedDistance = true;
    this.log(`${u.name} charges ${t.name}!`);
    this.addStatus(u, 'charging', 1);
    const ok = await this.walk(u, path);
    if (ok && u.canAct() && !t.out()) await this.resolveAttack(u, t, s.attacks.melee[0], { charge: true });
    return true;
  }

  async cleave(u, t) {
    if (!this.canUse('std') || !u.stats().feats.has('cleave') || !this.canAttack(u, t, 'melee')) return false;
    this.use('std');
    this.addStatus(u, 'cleaving', 1);
    const prof = this.attackProfile(u, 'melee');
    const r = await this.resolveAttack(u, t, prof, { label: 'Cleave' });
    if (r.hit && u.canAct()) {
      const next = this.enemiesOf(u).find((e) => e !== t && this.adjacent(u, e) && this.adjacent(t, e));
      if (next) await this.resolveAttack(u, next, prof, { label: 'Cleave' });
    }
    return true;
  }

  async totalDefense(u) {
    if (!this.canUse('std')) return false;
    this.use('std');
    this.addStatus(u, 'totalDefense', 1);
    this.log(`${u.name} takes total defense (+4 AC).`);
    return true;
  }

  async touchAttack(c, t, { ranged }) {
    if (t.side === c.side) return { hit: true, crit: false };
    const s = c.stats();
    const prof = { name: ranged ? 'ray' : 'touch', bonus: s.bab + (ranged ? s.m.dex : s.m.str) + s.sizeMod, n: 0, s: 0, dmgBonus: 0, crit: 20, mult: 2 };
    return this.resolveAttack(c, t, prof, { touch: true, ranged });
  }

  // ---------------------------------------------------------------- spells
  knownSpells(u) {
    const s = u.stats();
    if (!s.caster) return [];
    if (!u.c) return Object.keys(u.uses.spells || {}).map((k) => ({ key: k, level: spellLevel(k), left: u.uses.spells[k] }));
    const maxLvl = Math.max(0, ...Object.keys(s.caster.slots).map(Number));
    const used = u.c.used.slots || {};
    return spellsForClass(u.c.cls, maxLvl).map((k) => {
      const lvl = SPELLS[k].lv[u.c.cls];
      return { key: k, level: lvl, left: lvl === 0 ? Infinity : (s.caster.slots[lvl] || 0) - (used[lvl] || 0) };
    });
  }
  spellRange(u, key) { return rangeFeet(SPELLS[key].range, u.stats().caster?.cl || 1); }

  validSpellTarget(u, key, t) {
    const sp = SPELLS[key];
    if (sp.target === 'self' || sp.target === 'party') return t === u || t === undefined;
    if (sp.target === 'area') return !!t && this.inBounds(t.x, t.y) && (sp.area.shape === 'cone' ? this.cheb(u, t) >= 1 : (this.dist(u, t) <= this.spellRange(u, key) && this.los(u, t)));
    if (!t || t.dead) return false;
    if (sp.target === 'enemy' && (t.side === u.side || t.out())) return false;
    if (sp.target === 'ally' && t.side !== u.side) return false;
    if (sp.target === 'dying' && !(t.side === u.side && t.hp < 0 && !t.stable && !t.dead)) return false;
    if (sp.valid && !sp.valid(this, u, t)) return false;
    if (sp.range === 'touch') return t === u ? sp.target !== 'enemy' : this.adjacent(u, t);
    return this.dist(u, t) <= this.spellRange(u, key) && this.los(u, t);
  }

  areaCells(sp, caster, cell) {
    const cells = [];
    if (sp.area.shape === 'burst') {
      const r = sp.area.r;
      for (let y = 0; y < this.map.h; y++) for (let x = 0; x < this.map.w; x++) {
        if (this.dist(cell, { x, y }) <= r && !this.blocksLos(x, y) && this.los(cell, { x, y })) cells.push({ x, y });
      }
    } else {
      const vx = cell.x - caster.x, vy = cell.y - caster.y;
      const vl = Math.hypot(vx, vy) || 1;
      for (let y = 0; y < this.map.h; y++) for (let x = 0; x < this.map.w; x++) {
        if (x === caster.x && y === caster.y) continue;
        const dx = x - caster.x, dy = y - caster.y;
        if (this.dist(caster, { x, y }) > sp.area.len) continue;
        const cos = (dx * vx + dy * vy) / (Math.hypot(dx, dy) * vl);
        if (cos >= 0.7 && this.los(caster, { x, y })) cells.push({ x, y });
      }
    }
    return cells;
  }
  unitsInArea(sp, caster, cell) {
    const cells = this.areaCells(sp, caster, cell);
    return this.units.filter((u) => !u.dead && !u.fled && cells.some((p) => p.x === u.x && p.y === u.y));
  }

  async cast(u, key, target) {
    const sp = SPELLS[key];
    if (!this.canUse('std')) return false;
    const known = this.knownSpells(u).find((k) => k.key === key);
    if (!known || known.left <= 0) return false;
    if (sp.target === 'self' || sp.target === 'party') target = u;
    if (!this.validSpellTarget(u, key, target)) return false;
    this.use('std');
    if (u.c) { if (known.level > 0) { u.c.used.slots = u.c.used.slots || {}; u.c.used.slots[known.level] = (u.c.used.slots[known.level] || 0) + 1; } }
    else u.uses.spells[key] -= 1;
    this.log(`${u.name} casts ${sp.name}!`, 'spell');
    if (this.isThreatened(u)) {
      const s = u.stats();
      const dc = 15 + 2 * known.level;
      const r = d(20);
      const conc = s.caster.concentration ?? (s.caster.cl + s.caster.mod);
      if (r + conc < dc) {
        this.log(`Casting defensively: ${r}${sign(conc)}=${r + conc} vs DC ${dc} — the spell fizzles!`, 'bad');
        this.float(u, 'fizzle', '#aaa');
        return true;
      }
      this.log(`Casting defensively: ${r}${sign(conc)}=${r + conc} vs DC ${dc} — success.`, 'sys');
    }
    const cells = sp.target === 'area' ? this.areaCells(sp, u, target) : null;
    await this.fx.spell(u, target, { color: sp.color, cells, ray: sp.ray || sp.range !== 'touch' && sp.target === 'enemy', key });
    await sp.cast(this, u, target);
    return true;
  }

  // ---------------------------------------------------------------- class abilities
  rageRounds(u) { const c = u.c; return 4 + mod(finalAbilities(c).con) + 2 * (c.level - 1); }
  abilities(u) {
    const out = [];
    if (u.c) {
      const c = u.c, s = u.stats(), used = c.used;
      if (c.cls === 'barbarian') {
        if (!u.st.rage) out.push({ key: 'rage', name: 'Rage', action: 'free', left: this.rageRounds(u) - (used.rage || 0), desc: '+4 Str & Con, +2 Will, -2 AC.', ok: !u.st.fatigued && this.rageRounds(u) - (used.rage || 0) > 0 });
        else out.push({ key: 'endRage', name: 'End Rage', action: 'free', left: Infinity, desc: 'Stop raging (you become fatigued).', ok: true });
      }
      if (c.cls === 'paladin') {
        const smites = 1 + Math.floor((c.level - 1) / 3);
        out.push({ key: 'smite', name: 'Smite Evil', action: 'swift', target: 'enemy', left: smites - (used.smite || 0), desc: `+${Math.max(0, s.m.cha)} attack, +${c.level} damage vs an evil foe.`, ok: smites - (used.smite || 0) > 0 && !u.smiteTarget });
        if (c.level >= 2) {
          const loh = Math.floor(c.level / 2) + Math.max(0, s.m.cha);
          out.push({ key: 'layOnHands', name: 'Lay on Hands', action: 'swift*', target: 'ally', left: loh - (used.lay || 0), desc: `Heal ${Math.floor(c.level / 2)}d6. Swift on self, standard on others.`, ok: loh - (used.lay || 0) > 0 });
        }
      }
      if (c.cls === 'cleric') {
        const ch = 3 + Math.max(0, s.m.cha) + (s.feats.has('extraChannel') ? 2 : 0);
        out.push({ key: 'channel', name: 'Channel Energy', action: 'std', left: ch - (used.channel || 0), desc: `Heal allies within 30 ft for ${Math.ceil(c.level / 2)}d6.`, ok: ch - (used.channel || 0) > 0 });
      }
    } else {
      for (const a of u.def.abilities || []) {
        if (a === 'inspire' && !u.uses.inspiring) out.push({ key: 'inspire', name: 'Inspire Courage', action: 'std', left: 1, ok: true });
        if (a === 'bay' && !u.uses.bayed) out.push({ key: 'bay', name: 'Bay', action: 'std', left: 1, ok: true });
      }
    }
    // Universal options
    const sleeper = this.alliesOf(u).find((a) => a.st.asleep && this.adjacent(u, a));
    if (sleeper) out.push({ key: 'wake', name: `Wake ${sleeper.name}`, action: 'std', target: 'ally', left: Infinity, ok: true, auto: sleeper });
    return out;
  }

  async useAbility(u, key, target) {
    const c = u.c;
    switch (key) {
      case 'rage': {
        if (!this.canUse('free') || u.st.rage || u.st.fatigued) return false;
        if (this.rageRounds(u) - (c.used.rage || 0) <= 0) return false;
        this.addStatus(u, 'rage', Infinity);
        u.rageStart = c.used.rage || 0;
        u.tempHp = 2 * c.level;
        this.log(`${u.name} flies into a RAGE!`, 'good');
        this.float(u, 'RAGE!', '#ff5040');
        return true;
      }
      case 'endRage': this.endRage(u); return true;
      case 'smite': {
        if (!this.canUse('swift') || !target || target.side === u.side || target.out()) return false;
        const smites = 1 + Math.floor((c.level - 1) / 3);
        if ((c.used.smite || 0) >= smites) return false;
        this.use('swift');
        c.used.smite = (c.used.smite || 0) + 1;
        if (!target.stats().evil) { this.log(`${target.name} is not evil — the smite is wasted.`, 'sys'); return true; }
        u.smiteTarget = target.id;
        this.addStatus(u, 'smiting', Infinity);
        this.log(`${u.name} calls upon the light to SMITE ${target.name}!`, 'good');
        this.float(target, 'Smite', '#ffe68a');
        return true;
      }
      case 'layOnHands': {
        const self = target === u || !target;
        const t = self ? u : target;
        if (t.side !== u.side || t.dead || (!self && !this.adjacent(u, t))) return false;
        const kind = self ? 'swift' : 'std';
        if (!this.canUse(kind)) return false;
        const loh = Math.floor(c.level / 2) + Math.max(0, u.stats().m.cha);
        if ((c.used.lay || 0) >= loh) return false;
        this.use(kind);
        c.used.lay = (c.used.lay || 0) + 1;
        let amt = 0; for (let i = 0; i < Math.floor(c.level / 2); i++) amt += d(6);
        this.log(`${u.name} lays on hands.`, 'heal');
        await this.fx.spell(u, t, { color: '#fff7a8', key: 'heal' });
        await this.heal(t, amt, u);
        return true;
      }
      case 'channel': {
        if (!this.canUse('std')) return false;
        const ch = 3 + Math.max(0, u.stats().m.cha) + (u.stats().feats.has('extraChannel') ? 2 : 0);
        if ((c.used.channel || 0) >= ch) return false;
        this.use('std');
        c.used.channel = (c.used.channel || 0) + 1;
        this.log(`${u.name} channels positive energy!`, 'heal');
        const cells = []; for (let y = 0; y < this.map.h; y++) for (let x = 0; x < this.map.w; x++) if (this.dist(u, { x, y }) <= 30) cells.push({ x, y });
        await this.fx.spell(u, u, { color: '#fff7a8', cells, key: 'channel' });
        let amt = 0; for (let i = 0; i < Math.ceil(c.level / 2); i++) amt += d(6);
        for (const a of this.alliesOf(u, true)) if (!a.dead && this.dist(u, a) <= 30 && a.hp < a.maxHp) await this.heal(a, amt, u);
        return true;
      }
      case 'inspire': {
        if (!this.canUse('std')) return false;
        this.use('std');
        u.uses.inspiring = true;
        this.log(`${u.name} starts a horrid goblin war-chant! Allies are inspired.`, 'bad');
        this.float(u, '♪', '#ffe066');
        return true;
      }
      case 'bay': {
        if (!this.canUse('std')) return false;
        this.use('std');
        u.uses.bayed = true;
        this.log(`${u.name} lets out a hideous, soul-chilling bay!`, 'bad');
        await this.fx.spell(u, u, { color: '#6040a0', key: 'bay', cells: [] });
        for (const t of this.enemiesOf(u)) {
          if (t.stats().evil || !t.conscious()) continue;
          if (t.stats().immune.includes('fear')) { this.log(`${t.name} is immune to fear!`); continue; }
          if (!(await this.save(t, 'will', 13, { fear: true }))) { this.addStatus(t, 'shaken', d(4) + d(4)); this.float(t, 'Fear', '#a080ff'); }
        }
        return true;
      }
      case 'wake': {
        const t = target || this.alliesOf(u).find((a) => a.st.asleep && this.adjacent(u, a));
        if (!t || !this.canUse('std') || !t.st.asleep) return false;
        this.use('std');
        delete t.st.asleep;
        this.log(`${u.name} shakes ${t.name} awake!`);
        return true;
      }
      default: return false;
    }
  }

  endRage(u, quiet = false) {
    if (!u.st.rage) return;
    delete u.st.rage;
    const rounds = (u.c.used.rage || 0) - (u.rageStart || 0);
    u.tempHp = 0;
    if (!quiet) { this.addStatus(u, 'fatigued', Math.max(2, rounds * 2)); this.log(`${u.name}'s rage ends. Fatigued.`, 'sys'); }
  }

  // Inspire courage aura from goblin warchanters.
  refreshAuras() {
    for (const side of ['party', 'enemy']) {
      const chanting = this.units.some((u) => u.side === side && u.uses?.inspiring && u.conscious());
      for (const u of this.units.filter((x) => x.side === side)) {
        if (chanting) u.st.inspired = { r: Infinity };
        else delete u.st.inspired;
      }
    }
  }

  // ---------------------------------------------------------------- items
  async usePotion(u, target, inventory) {
    if (!this.canUse('std') || inventory.potions <= 0) return false;
    const t = target || u;
    if (t !== u && (!this.adjacent(u, t) || t.side !== u.side)) return false;
    this.use('std');
    inventory.potions -= 1;
    this.log(t === u ? `${u.name} drinks a potion of cure light wounds.` : `${u.name} pours a potion down ${t.name}'s throat.`, 'heal');
    await this.provoke(u, 'uses a potion');
    if (u.out() && t === u) return true;
    await this.heal(t, d(8) + 1, u);
    return true;
  }

  async stabilizeCheck(u, t) {
    if (!this.canUse('std') || !this.adjacent(u, t) || !(t.hp < 0) || t.stable || t.dead) return false;
    this.use('std');
    const s = u.stats();
    const r = d(20);
    const bonus = s.skills.heal ?? 0;
    if (r + bonus >= 15) { t.stable = true; this.log(`${u.name} stabilizes ${t.name} (Heal ${r}${sign(bonus)}).`, 'heal'); }
    else this.log(`${u.name} fails to stabilize ${t.name} (Heal ${r}${sign(bonus)} vs 15).`, 'sys');
    await this.provoke(u, 'tends a wound');
    return true;
  }
}

export { CLASSES };
