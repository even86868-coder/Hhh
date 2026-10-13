// Tactical AI for companion bots and monsters. Uses only legal engine actions.
import { SPELLS } from './spells.js';

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

function roleOf(u) {
  if (!u.c) return u.def.ai;
  const c = u.c;
  if (c.cls === 'wizard' || c.cls === 'sorcerer') return 'caster';
  if (c.cls === 'cleric') return 'healer';
  if (c.cls === 'ranger' && c.kit === 0) return 'ranged';
  return 'melee';
}

function hitChance(bonus, ac) { return Math.min(0.95, Math.max(0.05, (21 - (ac - bonus)) / 20)); }

function distField(e, target) {
  const field = new Map([[`${target.x},${target.y}`, 0]]);
  const q = [{ x: target.x, y: target.y }];
  while (q.length) {
    const cur = q.shift();
    const v = field.get(`${cur.x},${cur.y}`);
    for (const [dx, dy] of DIRS) {
      const x = cur.x + dx, y = cur.y + dy, k = `${x},${y}`;
      if (field.has(k) || !e.passable(x, y)) continue;
      field.set(k, v + (e.difficult(x, y) ? 2 : 1));
      q.push({ x, y });
    }
  }
  return field;
}

function wouldFlank(e, u, cell, t) {
  const va = [cell.x - t.x, cell.y - t.y];
  return e.alliesOf(u).some((al) => {
    if (!e.adjacent(al, t) || !e.threatens(al)) return false;
    const vb = [al.x - t.x, al.y - t.y];
    return (va[0] * vb[0] + va[1] * vb[1]) / (Math.hypot(...va) * Math.hypot(...vb)) <= -0.7;
  });
}

function targetValue(e, u, t) {
  let v = 10 - Math.min(10, t.hp) * 0.4;
  const r = t.c ? roleOf(t) : t.def?.ai;
  if (r === 'caster' || r === 'healer' || r === 'support') v += 2;
  if (t.def?.boss) v += 1;
  if (t.st.asleep || t.st.held || t.st.unconscious) v -= 6; // let them be, unless nothing else
  return v;
}

const sleepyRemove = (list) => list.filter((t) => !t.out());

export async function aiTurn(e, u) {
  let guard = 0;
  while (!e.turnOver() && guard++ < 8) {
    if (e.result()) break;
    const acted = await aiStep(e, u);
    if (!acted) break;
    await e.fx.wait(120);
  }
  e.endTurn();
}

async function aiStep(e, u) {
  const enemies = sleepyRemove(e.enemiesOf(u));
  if (!enemies.length) return false;
  await freeActions(e, u, enemies);
  const role = roleOf(u);
  if (await tryHeal(e, u)) return true;
  if (await tryBuff(e, u, enemies)) return true;
  if (u.side === 'party' && (await tryRescue(e, u))) return true;
  if (role === 'caster' && (await tryOffensiveSpell(e, u, enemies))) return true;
  if (role === 'healer' && (await tryControlSpell(e, u, enemies))) return true;
  if (role === 'ranged' || role === 'caster') {
    if (await tryRanged(e, u, enemies)) return true;
    if (role === 'caster' && !e.isThreatened(u)) return false;
  }
  if (await tryMelee(e, u, enemies)) return true;
  if (await tryRanged(e, u, enemies)) return true;
  return false;
}

async function freeActions(e, u, enemies) {
  const s = u.stats();
  const near = enemies.some((t) => e.dist(u, t) <= s.speed * 2);
  const abil = e.abilities(u);
  const rage = abil.find((a) => a.key === 'rage' && a.ok);
  if (rage && near) await e.useAbility(u, 'rage');
  const smite = abil.find((a) => a.key === 'smite' && a.ok);
  if (smite && e.canUse('swift')) {
    const evil = enemies.filter((t) => t.stats().evil && e.dist(u, t) <= 60 && e.los(u, t));
    const boss = evil.find((t) => t.def?.boss) || evil.find((t) => t.hp >= 15);
    if (boss) await e.useAbility(u, 'smite', boss);
  }
  // Power attack: turn on when it improves expected damage.
  if (s.feats.has('powerAttack')) {
    const prof = s.attacks.melee[0];
    const t = enemies.sort((a, b) => e.dist(u, a) - e.dist(u, b))[0];
    if (prof && t) {
      const ac = t.stats().ac;
      const pa = 1 + Math.floor(s.bab / 4);
      const avg = prof.n * (prof.s + 1) / 2 + prof.dmgBonus;
      const without = hitChance(prof.bonus, ac) * avg;
      const withPa = hitChance(prof.bonus - pa, ac) * (avg + (prof.twoHanded ? 3 : 2) * pa);
      u.powerAttack = withPa > without;
    }
  }
}

function urgentAlly(e, u) {
  const allies = e.alliesOf(u, true).filter((a) => !a.dead);
  let best = null, score = 0;
  for (const a of allies) {
    let sc = 0;
    if (a.hp < 0 && !a.stable) sc = 4;
    else if (a.hp < 0) sc = 3;
    else if (a.hp <= a.maxHp * 0.35) sc = 2;
    if (sc > score || (sc === score && best && a.hp < best.hp)) { best = a; score = sc; }
  }
  return score ? best : null;
}

async function moveAdjacentTo(e, u, t) {
  if (!e.canUse('move') || !e.b.std || e.b.stepped || e.b.single) return false;
  const reach = e.reachable(u, u.stats().speed);
  let best = null;
  for (const c of reach.values()) {
    if (Math.max(Math.abs(c.x - t.x), Math.abs(c.y - t.y)) !== 1) continue;
    const sc = c.aoo * 10 + c.feet / 5;
    if (!best || sc < best.sc) best = { ...c, sc };
  }
  if (!best || best.aoo > 0 && u.hp < u.maxHp * 0.5) return false;
  return e.moveTo(u, best.x, best.y);
}

async function tryHeal(e, u) {
  if (!e.canUse('std') && !e.canUse('swift')) return false;
  const known = e.knownSpells(u).filter((k) => SPELLS[k.key].heal && k.left > 0).sort((a, b) => b.level - a.level);
  const abil = e.abilities(u);
  const channel = abil.find((a) => a.key === 'channel' && a.ok);
  const loh = abil.find((a) => a.key === 'layOnHands' && a.ok);
  if (!known.length && !channel && !loh) return false;

  // Enemies only care about themselves (Nualia)
  if (u.side === 'enemy') {
    if (u.hp < u.maxHp * 0.4 && known.length && e.canUse('std')) return e.cast(u, known[0].key, u);
    return false;
  }
  if (channel && e.canUse('std')) {
    const inRange = e.alliesOf(u, true).filter((a) => !a.dead && e.dist(u, a) <= 30);
    const hurt = inRange.filter((a) => a.hp < a.maxHp * 0.6);
    if (hurt.length >= 3 || (hurt.length >= 2 && hurt.some((a) => a.hp < 0)) || (hurt.some((a) => a.hp < 0 && !a.stable) && !known.length)) return e.useAbility(u, 'channel');
  }
  const t = urgentAlly(e, u);
  if (!t) return false;
  if (loh && t === u && e.canUse('swift')) return e.useAbility(u, 'layOnHands', u);
  if (known.length && e.canUse('std')) {
    const sp = t.hp < 0 || t.maxHp - t.hp >= 12 ? known[0] : known[known.length - 1];
    if (t === u || e.adjacent(u, t)) return e.cast(u, sp.key, t);
    if (await moveAdjacentTo(e, u, t)) return true;
  }
  if (loh && e.canUse('std') && t !== u) {
    if (e.adjacent(u, t)) return e.useAbility(u, 'layOnHands', t);
    if (await moveAdjacentTo(e, u, t)) return true;
  }
  if (channel && e.canUse('std') && e.dist(u, t) <= 30) return e.useAbility(u, 'channel');
  return false;
}

async function tryBuff(e, u, enemies) {
  if (!e.canUse('std')) return false;
  const abil = e.abilities(u);
  if (abil.find((a) => a.key === 'inspire' && a.ok)) return e.useAbility(u, 'inspire');
  if (abil.find((a) => a.key === 'bay' && a.ok) && enemies.some((t) => e.dist(u, t) <= 60)) return e.useAbility(u, 'bay');
  const wake = abil.find((a) => a.key === 'wake');
  if (wake && !e.isThreatened(u)) return e.useAbility(u, 'wake', wake.auto);
  if (e.round > 2) return false;
  const known = e.knownSpells(u);
  const adjacentFoe = enemies.some((t) => e.adjacent(u, t));
  if (u.side === 'party' && u.c?.cls === 'cleric' && !adjacentFoe && enemies.length >= 3) {
    const bless = known.find((k) => k.key === 'bless' && k.left >= 2);
    if (bless && !u.st.blessed) return e.cast(u, 'bless', u);
  }
  if (u.side === 'enemy') {
    const df = known.find((k) => k.key === 'divineFavor' && k.left > 0);
    if (df && !u.st.divineFavor) return e.cast(u, 'divineFavor', u);
  }
  return false;
}

async function tryRescue(e, u) {
  if (!e.canUse('std') || e.isThreatened(u)) return false;
  const inv = e.inventory;
  const dying = e.alliesOf(u).filter((a) => !a.dead && a.hp < 0 && !a.stable);
  if (!dying.length) return false;
  const t = dying[0];
  if (e.adjacent(u, t)) {
    if (inv && inv.potions > 0) return e.usePotion(u, t, inv);
    return e.stabilizeCheck(u, t);
  }
  return moveAdjacentTo(e, u, t);
}

async function stepAwayIfThreatened(e, u, enemies) {
  if (!e.isThreatened(u) || !e.canUse('step') || e.b.movedDistance) return false;
  const opts = e.stepOptions(u).filter((p) => e.threatenersOf(p.x, p.y, u).length === 0);
  if (!opts.length) return false;
  opts.sort((a, b) => Math.min(...enemies.map((t) => e.dist(b, t))) - Math.min(...enemies.map((t) => e.dist(a, t))));
  return e.step(u, opts[0].x, opts[0].y);
}

function areaVictims(e, u, sp, cell) {
  const victims = e.unitsInArea(sp, u, cell).filter((v) => v.conscious());
  return { foes: victims.filter((v) => v.side !== u.side), friends: victims.filter((v) => v.side === u.side) };
}

async function tryOffensiveSpell(e, u, enemies) {
  if (!e.canUse('std')) return false;
  await stepAwayIfThreatened(e, u, enemies);
  if (!e.canUse('std')) return false;
  const s = u.stats();
  const known = e.knownSpells(u).filter((k) => k.left > 0);
  const opts = [];
  const est = (t, touch) => hitChance(s.bab + (touch === 'ray' ? s.m.dex : s.m.str) + s.sizeMod - 0, t.stats().touch);
  for (const k of known) {
    const sp = SPELLS[k.key];
    const cost = u.side === 'enemy' ? 0 : k.level * 4;
    if (sp.target === 'area') {
      const cells = new Map();
      for (const t of enemies) {
        if (sp.area.shape === 'cone') { if (e.dist(u, t) <= sp.area.len) cells.set(`${t.x},${t.y}`, t); }
        else for (const [dx, dy] of [[0, 0], ...DIRS]) cells.set(`${t.x + dx},${t.y + dy}`, { x: t.x + dx, y: t.y + dy });
      }
      for (const cell of cells.values()) {
        if (!e.validSpellTarget(u, k.key, cell)) continue;
        const { foes, friends } = areaVictims(e, u, sp, cell);
        if (friends.length || foes.length < 2) continue;
        let val = 0;
        if (k.key === 'sleep') {
          let hd = 4;
          for (const f of foes.sort((a, b) => a.stats().hd - b.stats().hd)) if (f.stats().hd <= hd && !f.stats().immune.includes('sleep')) { hd -= f.stats().hd; val += 7; }
        } else if (k.key === 'burningHands') val = foes.reduce((a, f) => a + Math.min(f.hp + 1, 2.5 * Math.min(5, s.caster.cl)), 0);
        else val = foes.length * 6;
        if (val >= 10) opts.push({ key: k.key, target: cell, val: val - cost });
      }
    } else if (sp.target === 'enemy') {
      for (const t of enemies) {
        if (!e.validSpellTarget(u, k.key, t)) continue;
        let val = 0;
        switch (k.key) {
          case 'magicMissile': val = Math.min(t.hp + 1, 3.5 * Math.min(5, 1 + Math.floor((s.caster.cl - 1) / 2)) + s.intense); break;
          case 'scorchingRay': val = Math.min(t.hp + 1, 14) * est(t, 'ray'); break;
          case 'acidArrow': val = Math.min(t.hp + 1, 10) * est(t, 'ray'); break;
          case 'rayOfFrost': case 'acidSplash': val = 2 * est(t, 'ray') + 0.5; break;
          case 'shockingGrasp': val = Math.min(t.hp + 1, 3.5 * Math.min(5, s.caster.cl)) * est(t, 'touch'); break;
          case 'inflictLight': val = Math.min(t.hp + 1, 9) * est(t, 'touch'); break;
          case 'daze': val = t.hp >= 8 ? 3 : 0; break;
          default: val = 0;
        }
        if (t.st.asleep || t.st.held) val *= 0.3;
        opts.push({ key: k.key, target: t, val: val - cost });
      }
    }
  }
  opts.sort((a, b) => b.val - a.val);
  const best = opts[0];
  if (!best || best.val <= 0.5) return false;
  return e.cast(u, best.key, best.target);
}

async function tryControlSpell(e, u, enemies) {
  if (!e.canUse('std')) return false;
  const known = e.knownSpells(u).filter((k) => k.left > 0);
  const hold = known.find((k) => k.key === 'holdPerson' && k.left >= 1);
  if (hold) {
    const t = enemies.find((x) => x.def?.boss && x.stats().type === 'humanoid' && !x.st.held && e.validSpellTarget(u, 'holdPerson', x));
    if (t) return e.cast(u, 'holdPerson', t);
  }
  return false;
}

async function tryRanged(e, u, enemies) {
  const s = u.stats();
  const prof = s.attacks.ranged[0];
  if (!prof) return false;
  if (e.isThreatened(u)) {
    if (await stepAwayIfThreatened(e, u, enemies)) return true;
    const melee = s.attacks.melee[0];
    if (melee && !melee.unarmed && roleOf(u) !== 'caster') return false;
  }
  if (!e.canUse('std')) return false;
  const targets = enemies.filter((t) => e.canAttack(u, t, 'ranged'))
    .sort((a, b) => targetValue(e, u, b) - targetValue(e, u, a));
  if (targets.length) {
    const t = targets[0];
    if (e.canUse('full') && e.fullAttackList(u, 'ranged').length > 1) return e.fullAttack(u, t, 'ranged');
    return e.attack(u, t, 'ranged');
  }
  if (e.canUse('move') && e.b.std && !e.b.stepped && !e.b.single) {
    const reach = e.reachable(u, s.speed);
    let best = null;
    for (const c of reach.values()) {
      if (e.threatenersOf(c.x, c.y, u).length) continue;
      const shots = enemies.filter((t) => e.los(c, t) && e.dist(c, t) <= prof.range * 2);
      if (!shots.length) continue;
      const nearest = Math.min(...enemies.map((t) => e.dist(c, t)));
      const sc = c.aoo * 20 + c.feet / 5 - Math.min(nearest, 30) / 5;
      if (!best || sc < best.sc) best = { ...c, sc };
    }
    if (best) return e.moveTo(u, best.x, best.y);
  }
  return false;
}

async function tryMelee(e, u, enemies) {
  const s = u.stats();
  const prof = s.attacks.melee[0];
  if (!prof) return false;
  const adj = enemies.filter((t) => e.adjacent(u, t));
  if (adj.length) {
    if (!e.canUse('std')) return false;
    adj.sort((a, b) => (e.flanked(u, b) ? 3 : 0) + targetValue(e, u, b) - (e.flanked(u, a) ? 3 : 0) - targetValue(e, u, a));
    const t = adj[0];
    if (e.canUse('full') && e.fullAttackList(u, 'melee').length > 1) return e.fullAttack(u, t, 'melee');
    if (s.feats.has('cleave') && adj.some((o) => o !== t && e.adjacent(o, t))) return e.cleave(u, t);
    // Nualia & co: touch spells in melee
    const inflict = e.knownSpells(u).find((k) => k.key === 'inflictLight' && k.left > 0);
    if (inflict && u.side === 'enemy' && t.hp > 8 && Math.random() < 0.4) return e.cast(u, 'inflictLight', t);
    return e.attack(u, t, 'melee');
  }
  if (e.b.stepped || e.b.single && e.b.singleUsed) return false;
  const speed = s.speed;
  if (e.canUse('move') && e.b.std && !e.b.single) {
    const reach = e.reachable(u, speed);
    let best = null;
    for (const t of enemies) {
      for (const [dx, dy] of DIRS) {
        const c = reach.get(`${t.x + dx},${t.y + dy}`);
        if (!c) continue;
        let sc = targetValue(e, u, t) - c.aoo * 6 - c.feet / 10;
        if (wouldFlank(e, u, c, t)) sc += u.stats().sneak ? 6 : 3;
        if (!best || sc > best.sc) best = { ...c, sc };
      }
    }
    if (best && (best.aoo === 0 || u.hp > u.maxHp * 0.5)) return e.moveTo(u, best.x, best.y);
  }
  // Charge
  if (e.canUse('full') || (e.b.single && !e.b.singleUsed)) {
    const sorted = [...enemies].sort((a, b) => e.dist(u, a) - e.dist(u, b));
    for (const t of sorted) if (e.chargePath(u, t)) return e.charge(u, t);
  }
  // Skirmishers shoot rather than plod when melee is out of reach this turn.
  const ranged = s.attacks.ranged[0];
  const shooter = s.sneak || (u.c && u.c.cls === 'ranger') || !u.c && u.def.ranged;
  if (ranged && shooter && e.canUse('std') && !e.b.stepped) {
    const t = enemies.filter((x) => e.canAttack(u, x, 'ranged')).sort((a, b) => targetValue(e, u, b) - targetValue(e, u, a))[0];
    if (t) return e.attack(u, t, 'ranged');
  }
  // Move toward the closest enemy by path distance
  if (e.canUse('move')) {
    const target = [...enemies].sort((a, b) => e.dist(u, a) - e.dist(u, b))[0];
    const field = distField(e, target);
    const here = field.get(`${u.x},${u.y}`) ?? 99;
    const reach = e.reachable(u, speed);
    let best = null;
    for (const c of reach.values()) {
      const v = field.get(`${c.x},${c.y}`);
      if (v === undefined || v >= here) continue;
      const sc = v * 10 + c.aoo * 15 + c.feet / 10;
      if (!best || sc < best.sc) best = { ...c, sc };
    }
    if (best) {
      // If we can't reach melee anyway, consider shooting instead of a second move.
      return e.moveTo(u, best.x, best.y);
    }
  }
  return false;
}
