// Spells. Each has a `cast(engine, caster, target)` coroutine.
// target is a unit (single-target spells) or a cell {x,y} (area spells).
import { d, roll } from './dice.js';

const min = Math.min;

export const SPELLS = {
  // ---- Cantrips / orisons (at will)
  rayOfFrost: {
    name: 'Ray of Frost', lv: { wizard: 0, sorcerer: 0 }, range: 'close', target: 'enemy', ray: true, color: '#9ee8ff',
    desc: 'Ranged touch attack: 1d3 cold damage.', evocation: true,
    async cast(e, c, t) {
      const r = await e.touchAttack(c, t, { ranged: true });
      if (r.hit) await e.dealDamage(t, e.spellDmg(c, 1, 3, 0, { crit: r.crit, evocation: true }), { src: c, spell: true });
    },
  },
  acidSplash: {
    name: 'Acid Splash', lv: { wizard: 0, sorcerer: 0 }, range: 'close', target: 'enemy', ray: true, color: '#9be05a',
    desc: 'Ranged touch attack: 1d3 acid damage.',
    async cast(e, c, t) {
      const r = await e.touchAttack(c, t, { ranged: true });
      if (r.hit) await e.dealDamage(t, e.spellDmg(c, 1, 3, 0, { crit: r.crit }), { src: c, spell: true });
    },
  },
  daze: {
    name: 'Daze', lv: { wizard: 0, sorcerer: 0 }, range: 'close', target: 'enemy', color: '#e0b0ff', enchant: true,
    desc: 'Humanoid of 4 HD or less loses its next action (Will negates).',
    valid: (e, c, t) => t.stats().type === 'humanoid' && t.stats().hd <= 4,
    async cast(e, c, t) {
      if (!(await e.save(t, 'will', e.dc(c, 0), { enchant: true }))) e.addStatus(t, 'dazed', 1);
    },
  },
  guidance: {
    name: 'Guidance', lv: { cleric: 0 }, range: 'touch', target: 'ally', color: '#fff0a0',
    desc: '+1 on the target\'s next attack roll or save.',
    async cast(e, c, t) { e.addStatus(t, 'guidance', 10); },
  },
  stabilize: {
    name: 'Stabilize', lv: { cleric: 0 }, range: 'close', target: 'dying', color: '#fff0a0',
    desc: 'A dying creature stops losing hit points.',
    async cast(e, c, t) { t.stable = true; e.log(`${t.name} is stabilized.`, 'heal'); },
  },
  // ---- 1st level
  magicMissile: {
    name: 'Magic Missile', lv: { wizard: 1, sorcerer: 1 }, range: 'medium', target: 'enemy', color: '#c58cff',
    desc: '1 missile (+1 per 2 levels after 1st), each 1d4+1 force. Never misses.', evocation: true,
    async cast(e, c, t) {
      const cs = c.stats();
      const n = min(5, 1 + Math.floor((cs.caster.cl - 1) / 2));
      let total = 0;
      for (let i = 0; i < n; i++) total += d(4) + 1;
      total += cs.intense || 0;
      e.log(`${n} missile${n > 1 ? 's' : ''} strike!`);
      await e.dealDamage(t, total, { src: c, spell: true });
    },
  },
  sleep: {
    name: 'Sleep', lv: { wizard: 1, sorcerer: 1 }, range: 'medium', target: 'area', area: { shape: 'burst', r: 10 }, color: '#8fa8ff', enchant: true,
    desc: '4 HD of creatures in a 10-ft burst fall asleep (Will negates). Hits allies too!',
    async cast(e, c, cell) {
      let hd = 4;
      const victims = e.unitsInArea(this, c, cell).filter((u) => u.conscious()).sort((a, b) => a.stats().hd - b.stats().hd);
      for (const u of victims) {
        const s = u.stats();
        if (s.hd > hd) continue;
        if (s.immune.includes('sleep') || ['construct', 'undead'].includes(s.type)) { e.log(`${u.name} is immune to sleep.`); continue; }
        hd -= s.hd;
        if (!(await e.save(u, 'will', e.dc(c, 1), { enchant: true }))) { e.addStatus(u, 'asleep', 10 * c.stats().caster.cl); e.float(u, 'Zzz', '#8fa8ff'); }
      }
    },
  },
  colorSpray: {
    name: 'Color Spray', lv: { wizard: 1, sorcerer: 1 }, range: 'self', target: 'area', area: { shape: 'cone', len: 15 }, color: '#ff8ae0',
    desc: '15-ft cone of colors. Weak foes fall unconscious, others are stunned (Will negates).',
    async cast(e, c, cell) {
      for (const u of e.unitsInArea(this, c, cell)) {
        if (!u.conscious()) continue;
        if (await e.save(u, 'will', e.dc(c, 1))) continue;
        const hd = u.stats().hd;
        if (hd <= 2) { e.addStatus(u, 'unconscious', d(4) + d(4)); e.float(u, 'KO', '#ff8ae0'); }
        else if (hd <= 4) { const r = d(4); e.addStatus(u, 'stunned', r); e.addStatus(u, 'blinded', r); e.float(u, 'Stun', '#ff8ae0'); }
        else { e.addStatus(u, 'stunned', 1); e.float(u, 'Stun', '#ff8ae0'); }
      }
    },
  },
  burningHands: {
    name: 'Burning Hands', lv: { wizard: 1, sorcerer: 1 }, range: 'self', target: 'area', area: { shape: 'cone', len: 15 }, color: '#ff8a3a',
    desc: '15-ft cone of fire: 1d4 per level (max 5d4), Reflex half. Hits allies too!', evocation: true, fire: true,
    async cast(e, c, cell) {
      const n = min(5, c.stats().caster.cl);
      const dmg = e.spellDmg(c, n, 4, 0, { evocation: true, fire: true });
      for (const u of e.unitsInArea(this, c, cell)) {
        if (u.dead) continue;
        await e.dealDamage(u, await e.reflexHalf(u, e.dc(c, 1), dmg), { src: c, spell: true });
      }
    },
  },
  shockingGrasp: {
    name: 'Shocking Grasp', lv: { wizard: 1, sorcerer: 1 }, range: 'touch', target: 'enemy', color: '#a0e8ff',
    desc: 'Melee touch attack: 1d6 electricity per level (max 5d6).', evocation: true,
    async cast(e, c, t) {
      const r = await e.touchAttack(c, t, { ranged: false });
      if (r.hit) await e.dealDamage(t, e.spellDmg(c, min(5, c.stats().caster.cl), 6, 0, { crit: r.crit, evocation: true }), { src: c, spell: true });
    },
  },
  mageArmor: {
    name: 'Mage Armor', lv: { wizard: 1, sorcerer: 1 }, range: 'touch', target: 'ally', color: '#9ec2ff',
    desc: '+4 armor bonus to AC (doesn\'t stack with worn armor).',
    async cast(e, c, t) { e.addStatus(t, 'mageArmor', 600); },
  },
  shield: {
    name: 'Shield', lv: { wizard: 1, sorcerer: 1 }, range: 'self', target: 'self', color: '#9ec2ff',
    desc: '+4 shield bonus to AC.',
    async cast(e, c) { e.addStatus(c, 'shieldSpell', 10 * c.stats().caster.cl); },
  },
  cureLight: {
    name: 'Cure Light Wounds', lv: { cleric: 1 }, range: 'touch', target: 'ally', heal: true, color: '#fff7a8',
    desc: 'Heals 1d8 + caster level (max +5).',
    async cast(e, c, t) { await e.heal(t, d(8) + min(5, c.stats().caster.cl), c); },
  },
  bless: {
    name: 'Bless', lv: { cleric: 1 }, range: 'self', target: 'party', color: '#fff7a8',
    desc: 'Allies within 50 ft gain +1 on attack rolls and saves vs fear.',
    async cast(e, c) {
      for (const u of e.alliesOf(c, true)) if (e.dist(c, u) <= 50 && !u.dead) { e.addStatus(u, 'blessed', 10 * c.stats().caster.cl); e.float(u, '+1', '#fff7a8'); }
    },
  },
  shieldOfFaith: {
    name: 'Shield of Faith', lv: { cleric: 1 }, range: 'touch', target: 'ally', color: '#fff7a8',
    desc: '+2 deflection bonus to AC.',
    async cast(e, c, t) { e.addStatus(t, 'shieldOfFaith', 10 * c.stats().caster.cl, 2); },
  },
  divineFavor: {
    name: 'Divine Favor', lv: { cleric: 1 }, range: 'self', target: 'self', color: '#fff7a8',
    desc: '+1 luck bonus on attack and damage rolls per 3 levels (min +1).',
    async cast(e, c) { e.addStatus(c, 'divineFavor', 10, Math.max(1, min(3, Math.floor(c.stats().caster.cl / 3)))); },
  },
  command: {
    name: 'Command', lv: { cleric: 1 }, range: 'close', target: 'enemy', color: '#fff7a8', enchant: true,
    desc: '"Halt!" The target loses its next turn (Will negates).',
    async cast(e, c, t) {
      if (!(await e.save(t, 'will', e.dc(c, 1), { enchant: true }))) { e.addStatus(t, 'dazed', 1); e.float(t, 'Halt!', '#fff7a8'); }
    },
  },
  inflictLight: {
    name: 'Inflict Light Wounds', lv: { cleric: 1 }, range: 'touch', target: 'enemy', color: '#a040c0',
    desc: 'Melee touch: 1d8 + caster level (max +5) negative energy, Will half.',
    async cast(e, c, t) {
      const r = await e.touchAttack(c, t, { ranged: false });
      if (!r.hit) return;
      let dmg = d(8) + min(5, c.stats().caster.cl);
      if (r.crit) dmg += d(8) + min(5, c.stats().caster.cl);
      if (await e.save(t, 'will', e.dc(c, 1))) dmg = Math.floor(dmg / 2);
      await e.dealDamage(t, dmg, { src: c, spell: true });
    },
  },
  // ---- 2nd level
  scorchingRay: {
    name: 'Scorching Ray', lv: { wizard: 2, sorcerer: 2 }, range: 'close', target: 'enemy', ray: true, color: '#ff6a2a',
    desc: 'Ranged touch attack: 4d6 fire damage.', evocation: true, fire: true,
    async cast(e, c, t) {
      const r = await e.touchAttack(c, t, { ranged: true });
      if (r.hit) await e.dealDamage(t, e.spellDmg(c, 4, 6, 0, { crit: r.crit, evocation: true, fire: true }), { src: c, spell: true });
    },
  },
  acidArrow: {
    name: 'Acid Arrow', lv: { wizard: 2, sorcerer: 2 }, range: 'long', target: 'enemy', ray: true, color: '#9be05a',
    desc: 'Ranged touch attack: 2d4 acid now and again on following rounds.',
    async cast(e, c, t) {
      const r = await e.touchAttack(c, t, { ranged: true });
      if (!r.hit) return;
      await e.dealDamage(t, e.spellDmg(c, 2, 4, 0, { crit: r.crit }), { src: c, spell: true });
      e.addStatus(t, 'acidArrow', 1 + Math.floor(c.stats().caster.cl / 3));
    },
  },
  glitterdust: {
    name: 'Glitterdust', lv: { wizard: 2, sorcerer: 2 }, range: 'medium', target: 'area', area: { shape: 'burst', r: 10 }, color: '#ffe066',
    desc: 'Creatures in a 10-ft spread are blinded (Will negates). Hits allies too!',
    async cast(e, c, cell) {
      for (const u of e.unitsInArea(this, c, cell)) {
        if (u.dead) continue;
        if (!(await e.save(u, 'will', e.dc(c, 2)))) { e.addStatus(u, 'blinded', c.stats().caster.cl); e.float(u, 'Blind', '#ffe066'); }
      }
    },
  },
  bullStrength: {
    name: "Bull's Strength", lv: { wizard: 2, sorcerer: 2, cleric: 2 }, range: 'touch', target: 'ally', color: '#ffb070',
    desc: '+4 Strength.',
    async cast(e, c, t) { e.addStatus(t, 'bullStrength', 10 * c.stats().caster.cl); },
  },
  cureModerate: {
    name: 'Cure Moderate Wounds', lv: { cleric: 2 }, range: 'touch', target: 'ally', heal: true, color: '#fff7a8',
    desc: 'Heals 2d8 + caster level (max +10).',
    async cast(e, c, t) { await e.heal(t, d(8) + d(8) + min(10, c.stats().caster.cl), c); },
  },
  holdPerson: {
    name: 'Hold Person', lv: { cleric: 2 }, range: 'medium', target: 'enemy', color: '#fff7a8', enchant: true,
    desc: 'Paralyzes a humanoid (Will negates, new save each round).',
    valid: (e, c, t) => t.stats().type === 'humanoid',
    async cast(e, c, t) {
      if (!(await e.save(t, 'will', e.dc(c, 2), { enchant: true }))) {
        e.addStatus(t, 'held', c.stats().caster.cl, e.dc(c, 2)); e.float(t, 'Held', '#fff7a8');
      }
    },
  },
};

export function spellLevel(key, cls) {
  const lv = SPELLS[key].lv;
  return cls && lv[cls] !== undefined ? lv[cls] : Math.max(0, ...Object.values(lv));
}

export function spellsForClass(cls, maxLevel) {
  return Object.keys(SPELLS).filter((k) => SPELLS[k].lv[cls] !== undefined && SPELLS[k].lv[cls] <= maxLevel);
}

export function rangeFeet(range, cl) {
  switch (range) {
    case 'touch': return 5;
    case 'close': return 25 + 5 * Math.floor(cl / 2);
    case 'medium': return 100 + 10 * cl;
    case 'long': return 400 + 40 * cl;
    default: return 0;
  }
}

export { roll };
