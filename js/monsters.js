// Monster stat blocks (PF1 Bestiary / Burnt Offerings inspired, condensed).
import { mod } from './dice.js';
import { statusAttackMods } from './rules.js';

const A = (key, name, bonus, dice, dmgBonus, crit = 20, mult = 2, extra = {}) => {
  const [n, s] = dice.split('d').map(Number);
  return { key, name, bonus, n, s, dmgBonus, crit, mult, ...extra };
};

export const MONSTERS = {
  goblin: {
    name: 'Goblin', sprite: 'goblin', size: 'S', type: 'humanoid', subtypes: ['goblinoid'], evil: true,
    hd: 1, hp: 6, abil: { str: 11, dex: 15, con: 12, int: 10, wis: 9, cha: 6 },
    ac: { armor: 2, shield: 1 }, bab: 1, saves: { fort: 3, ref: 2, will: -1 }, init: 6, speed: 30,
    melee: [A('dogslicer', 'Dogslicer', 2, '1d6', 0, 19)],
    ranged: [A('shortbow', 'Shortbow', 4, '1d4', 0, 20, 3, { range: 60 })],
    ai: 'melee', xp: 135,
  },
  goblinArcher: {
    name: 'Goblin Archer', sprite: 'goblinArcher', size: 'S', type: 'humanoid', subtypes: ['goblinoid'], evil: true,
    hd: 1, hp: 6, abil: { str: 11, dex: 15, con: 12, int: 10, wis: 9, cha: 6 },
    ac: { armor: 2 }, bab: 1, saves: { fort: 3, ref: 2, will: -1 }, init: 6, speed: 30,
    melee: [A('dogslicer', 'Dogslicer', 2, '1d6', 0, 19)],
    ranged: [A('shortbow', 'Shortbow', 4, '1d4', 0, 20, 3, { range: 60 })],
    ai: 'ranged', xp: 135,
  },
  warchanter: {
    name: 'Goblin Warchanter', sprite: 'warchanter', size: 'S', type: 'humanoid', subtypes: ['goblinoid'], evil: true,
    hd: 1, hp: 9, abil: { str: 8, dex: 14, con: 13, int: 10, wis: 8, cha: 15 },
    ac: { armor: 2 }, bab: 0, saves: { fort: 1, ref: 4, will: 1 }, init: 2, speed: 30,
    melee: [A('dogslicer', 'Dogslicer', 0, '1d6', -1, 19)],
    abilities: ['inspire'], ai: 'support', xp: 200,
  },
  goblinDog: {
    name: 'Goblin Dog', sprite: 'goblinDog', size: 'M', type: 'animal', subtypes: [], evil: false,
    hd: 1, hp: 9, abil: { str: 15, dex: 14, con: 15, int: 2, wis: 12, cha: 8 },
    ac: { natural: 1 }, bab: 0, saves: { fort: 4, ref: 4, will: 1 }, init: 2, speed: 50,
    melee: [A('bite', 'Bite', 2, '1d6', 3)],
    ai: 'melee', xp: 400,
  },
  boar: {
    name: 'Tickwood Boar', sprite: 'boar', size: 'M', type: 'animal', subtypes: [], evil: false,
    hd: 2, hp: 18, abil: { str: 15, dex: 10, con: 17, int: 2, wis: 13, cha: 4 },
    ac: { natural: 6 }, bab: 1, saves: { fort: 6, ref: 3, will: 1 }, init: 0, speed: 40,
    melee: [A('gore', 'Gore', 4, '1d8', 3)], ferocity: true,
    ai: 'melee', xp: 600,
  },
  tsuto: {
    name: 'Tsuto Kaijitsu', sprite: 'tsuto', size: 'M', type: 'humanoid', subtypes: ['human'], evil: true,
    hd: 3, hp: 24, abil: { str: 12, dex: 18, con: 12, int: 14, wis: 14, cha: 8 },
    ac: { monk: 3 }, bab: 2, saves: { fort: 4, ref: 9, will: 5 }, init: 4, speed: 40,
    melee: [A('unarmed', 'Unarmed strike', 5, '1d6', 1)],
    fullMelee: [A('unarmed', 'Flurry', 3, '1d6', 1), A('unarmed', 'Flurry', 3, '1d6', 1)],
    sneak: 1, evasion: true, ai: 'melee', xp: 800, boss: true,
  },
  sinspawn: {
    name: 'Sinspawn', sprite: 'sinspawn', size: 'M', type: 'aberration', subtypes: [], evil: true,
    hd: 3, hp: 19, abil: { str: 14, dex: 12, con: 15, int: 8, wis: 11, cha: 8 },
    ac: { natural: 4 }, bab: 2, saves: { fort: 3, ref: 2, will: 4 }, init: 1, speed: 30,
    melee: [A('bite', 'Sinful bite', 4, '1d6', 2, 20, 2, { effect: 'sinfulBite' })],
    fullMelee: [A('bite', 'Sinful bite', 4, '1d6', 2, 20, 2, { effect: 'sinfulBite' }), A('claw', 'Claw', 4, '1d4', 2), A('claw', 'Claw', 4, '1d4', 2)],
    ai: 'melee', xp: 600,
  },
  erylium: {
    name: 'Erylium', sprite: 'quasit', size: 'T', type: 'outsider', subtypes: ['demon'], evil: true,
    hd: 3, hp: 18, abil: { str: 8, dex: 17, con: 10, int: 11, wis: 12, cha: 12 },
    ac: { natural: 3 }, bab: 3, saves: { fort: 1, ref: 6, will: 4 }, init: 7, speed: 50, flying: true,
    melee: [A('claw', 'Claw', 8, '1d3', -1, 20, 2, { effect: 'poisonDex' })],
    fullMelee: [A('claw', 'Claw', 8, '1d3', -1, 20, 2, { effect: 'poisonDex' }), A('claw', 'Claw', 8, '1d3', -1, 20, 2, { effect: 'poisonDex' }), A('bite', 'Bite', 3, '1d4', -1)],
    dr: { amt: 5, bypass: 'good' }, fastHealing: 2, ai: 'melee', xp: 800, boss: true,
  },
  bruthazmus: {
    name: 'Bruthazmus', sprite: 'bugbear', size: 'M', type: 'humanoid', subtypes: ['goblinoid'], evil: true,
    hd: 5, hp: 34, abil: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 6 },
    ac: { armor: 3, natural: 3 }, bab: 4, saves: { fort: 6, ref: 7, will: 2 }, init: 2, speed: 30,
    melee: [A('morningstar', 'Morningstar', 7, '1d8', 3)],
    ranged: [A('longbow', 'Composite longbow', 7, '1d8', 3, 20, 3, { range: 110 })],
    fullRanged: [A('longbow', 'Rapid shot', 5, '1d8', 3, 20, 3, { range: 110 }), A('longbow', 'Rapid shot', 5, '1d8', 3, 20, 3, { range: 110 })],
    favoredVs: 'elf', ai: 'ranged', xp: 1200, boss: true,
  },
  ripnugget: {
    name: 'Ripnugget', sprite: 'ripnugget', size: 'S', type: 'humanoid', subtypes: ['goblinoid'], evil: true,
    hd: 4, hp: 32, abil: { str: 15, dex: 14, con: 14, int: 10, wis: 8, cha: 12 },
    ac: { armor: 5, shield: 1 }, bab: 3, saves: { fort: 6, ref: 3, will: 1 }, init: 2, speed: 50,
    melee: [A('dogslicer', 'Dogslicer', 7, '1d6', 3, 19)],
    fullMelee: [A('dogslicer', 'Dogslicer', 7, '1d6', 3, 19), A('bite', 'Stickfoot bite', 3, '1d6', 2)],
    ai: 'melee', xp: 1200, boss: true,
  },
  orik: {
    name: 'Orik Vancaskerkin', sprite: 'orik', size: 'M', type: 'humanoid', subtypes: ['human'], evil: false,
    hd: 3, hp: 31, abil: { str: 16, dex: 13, con: 14, int: 10, wis: 8, cha: 12 },
    ac: { armor: 6, shield: 2 }, bab: 3, saves: { fort: 5, ref: 2, will: 0 }, init: 1, speed: 20,
    melee: [A('longsword', 'Longsword', 7, '1d8', 4, 19)],
    ai: 'melee', xp: 800,
  },
  lyrie: {
    name: 'Lyrie Akenja', sprite: 'lyrie', size: 'M', type: 'humanoid', subtypes: ['human'], evil: true,
    hd: 4, hp: 20, abil: { str: 8, dex: 14, con: 12, int: 17, wis: 10, cha: 12 },
    ac: { armor: 4 }, bab: 2, saves: { fort: 2, ref: 3, will: 4 }, init: 6, speed: 30,
    melee: [A('dagger', 'Dagger', 1, '1d4', -1, 19)],
    spells: { magicMissile: 3, scorchingRay: 2 }, caster: { cl: 4, mod: 3, concentration: 11 },
    ai: 'caster', xp: 800,
  },
  nualia: {
    name: 'Nualia', sprite: 'nualia', size: 'M', type: 'humanoid', subtypes: ['aasimar'], evil: true,
    hd: 5, hp: 46, abil: { str: 16, dex: 12, con: 14, int: 10, wis: 15, cha: 14 },
    ac: { armor: 6, deflection: 1 }, bab: 4, saves: { fort: 7, ref: 2, will: 7 }, init: 5, speed: 30,
    melee: [A('bastardSword', '+1 Bastard sword', 9, '1d10', 5, 19)],
    fullMelee: [A('bastardSword', '+1 Bastard sword', 9, '1d10', 5, 19), A('claw', "Lamashtu's claw", 3, '1d6', 1)],
    spells: { divineFavor: 1, cureModerate: 2, inflictLight: 2 }, caster: { cl: 4, mod: 2, concentration: 10 },
    ai: 'melee', xp: 1600, boss: true,
  },
  yethHound: {
    name: 'Yeth Hound', sprite: 'yethHound', size: 'M', type: 'outsider', subtypes: ['evil'], evil: true,
    hd: 3, hp: 22, abil: { str: 17, dex: 15, con: 15, int: 6, wis: 12, cha: 10 },
    ac: { natural: 4 }, bab: 3, saves: { fort: 6, ref: 5, will: 4 }, init: 6, speed: 40, flying: true,
    melee: [A('bite', 'Bite', 6, '2d6', 4, 20, 2, { effect: 'trip' })],
    dr: { amt: 5, bypass: 'silver' }, abilities: ['bay'], ai: 'melee', xp: 800,
  },
};

const SIZE_MOD = { T: 2, S: 1, M: 0, L: -1 };

export function monsterStats(def, st = {}) {
  const m = {};
  for (const k in def.abil) m[k] = mod(def.abil[k] - (k === 'dex' ? st.dexDamage || 0 : 0));
  const sm = SIZE_MOD[def.size] || 0;
  const loseDex = st.flatFooted || st.blinded || st.stunned || st.helpless;
  let dex = m.dex;
  if (st.helpless) dex = -5;
  else if (loseDex && dex > 0) dex = 0;
  const parts = {
    armor: Math.max(def.ac.armor || 0, st.mageArmor ? 4 : 0),
    shield: Math.max(def.ac.shield || 0, st.shieldSpell ? 4 : 0),
    dex, size: sm, natural: def.ac.natural || 0,
    deflection: Math.max(def.ac.deflection || 0, st.shieldOfFaith || 0),
    dodge: (def.ac.monk && !loseDex ? def.ac.monk : 0) + (st.totalDefense ? 4 : 0),
    misc: (st.charging ? -2 : 0) + (st.stunned || st.blinded ? -2 : 0),
  };
  const ac = 10 + Object.values(parts).reduce((s, v) => s + v, 0);
  const touch = ac - parts.armor - parts.shield - parts.natural;
  const flat = 10 + Object.values({ ...parts, dex: Math.min(parts.dex, 0), dodge: 0 }).reduce((s, v) => s + v, 0);
  const sa = statusAttackMods(st);
  const adj = (list) => (list || []).map((a) => ({ ...a, bonus: a.bonus + sa.atk, dmgBonus: a.dmgBonus + sa.dmg }));
  const stSave = (st.shaken ? -2 : 0) + (st.sickened ? -2 : 0) + (st.blessed ? 0 : 0);
  const melee = adj(def.melee);
  const ranged = adj(def.ranged);
  return {
    name: def.name, size: def.size, sizeMod: sm, type: def.type, subtypes: def.subtypes, level: def.hd, hd: def.hd,
    abil: def.abil, m, bab: def.bab, acParts: parts, ac, touch, flat,
    fort: def.saves.fort + stSave, ref: def.saves.ref + stSave, will: def.saves.will + stSave,
    speed: st.blinded ? Math.floor(def.speed / 10) * 5 : def.speed, init: def.init,
    cmb: def.bab + m.str - sm, cmd: 10 + def.bab + m.str + (loseDex ? 0 : m.dex) - sm,
    attacks: { melee, ranged, fullMelee: adj(def.fullMelee), fullRanged: adj(def.fullRanged) },
    skills: {}, caster: def.caster ? { cl: def.caster.cl, mod: def.caster.mod, concentration: def.caster.concentration } : null,
    feats: new Set(), sneak: def.sneak || 0, evasion: !!def.evasion, uncannyDodge: false,
    favoredEnemy: null, favoredVs: def.favoredVs, hatred: [], defensive: [], immune: def.immune || [], enchantSave: 0, fearSave: 0,
    ferocity: !!def.ferocity, evil: !!def.evil, conScore: def.abil.con, dr: def.dr || null, fastHealing: def.fastHealing || 0,
    intense: 0, draconic: false, flying: !!def.flying,
  };
}
