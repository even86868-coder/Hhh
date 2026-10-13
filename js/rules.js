// Pathfinder 1st Edition core rules data + derived character statistics.
import { mod } from './dice.js';

export const ABILS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
export const ABIL_NAMES = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' };

export const POINT_BUY = 20; // "High fantasy" point buy, the usual for Adventure Paths
export const POINT_COST = { 7: -4, 8: -2, 9: -1, 10: 0, 11: 1, 12: 2, 13: 3, 14: 5, 15: 7, 16: 10, 17: 13, 18: 17 };
export const MAX_LEVEL = 4;

// ---------------------------------------------------------------- Races
export const RACES = {
  human: {
    name: 'Human', size: 'M', speed: 30, mods: {}, flex: true, bonusFeat: true, skilled: 1,
    desc: 'Ambitious and adaptable. +2 to any one ability, a bonus feat and an extra trained skill.',
    traits: ['+2 to one ability', 'Bonus feat', 'Skilled'],
  },
  elf: {
    name: 'Elf', size: 'M', speed: 30, mods: { dex: 2, int: 2, con: -2 },
    skills: { perception: 2 }, immune: ['sleep'], enchantSave: 2,
    desc: 'Graceful and long-lived. Immune to magic sleep, keen senses.',
    traits: ['+2 Dex, +2 Int, -2 Con', 'Immune to sleep', '+2 Perception', '+2 vs enchantment'],
  },
  dwarf: {
    name: 'Dwarf', size: 'M', speed: 20, mods: { con: 2, wis: 2, cha: -2 }, steady: true,
    hatred: ['goblinoid', 'orc'], defensive: ['giant'],
    desc: 'Stout and stubborn. Never slowed by armor. Hates goblins with a passion.',
    traits: ['+2 Con, +2 Wis, -2 Cha', 'Slow and steady (20 ft)', '+1 attack vs goblinoids', '+4 AC vs giants'],
  },
  halfling: {
    name: 'Halfling', size: 'S', speed: 20, mods: { dex: 2, cha: 2, str: -2 },
    skills: { perception: 2, acrobatics: 2, climb: 2 }, luck: 1, fearSave: 2,
    desc: 'Small, lucky and brave. +1 on all saves.',
    traits: ['+2 Dex, +2 Cha, -2 Str', 'Small size', '+1 all saves', '+2 Acrobatics/Climb/Perception'],
  },
  gnome: {
    name: 'Gnome', size: 'S', speed: 20, mods: { con: 2, cha: 2, str: -2 },
    skills: { perception: 2 }, hatred: ['goblinoid', 'reptilian'], defensive: ['giant'],
    desc: 'Curious fey-touched folk. Small and tough, with old grudges against goblins.',
    traits: ['+2 Con, +2 Cha, -2 Str', 'Small size', '+1 attack vs goblinoids', '+2 Perception'],
  },
  halfOrc: {
    name: 'Half-Orc', size: 'M', speed: 30, mods: {}, flex: true, ferocity: true,
    skills: { intimidate: 2 },
    desc: 'Fierce survivors. Can keep fighting when dying, once per day.',
    traits: ['+2 to one ability', 'Orc ferocity', '+2 Intimidate'],
  },
  halfElf: {
    name: 'Half-Elf', size: 'M', speed: 30, mods: {}, flex: true, immune: ['sleep'], enchantSave: 2,
    skills: { perception: 2 }, skillFocus: true,
    desc: 'Between two worlds. Immune to magic sleep and quick to adapt.',
    traits: ['+2 to one ability', 'Immune to sleep', '+2 Perception', '+2 vs enchantment'],
  },
};

// ---------------------------------------------------------------- Equipment
// dmg: [count, sides] for Medium (M) and Small (S) wielders.
export const WEAPONS = {
  longsword: { name: 'Longsword', M: [1, 8], S: [1, 6], crit: 19, mult: 2, dt: 'S', icon: 'sword' },
  greatsword: { name: 'Greatsword', M: [2, 6], S: [1, 10], crit: 19, mult: 2, dt: 'S', twoHanded: true, icon: 'greatsword' },
  greataxe: { name: 'Greataxe', M: [1, 12], S: [1, 10], crit: 20, mult: 3, dt: 'S', twoHanded: true, icon: 'axe' },
  rapier: { name: 'Rapier', M: [1, 6], S: [1, 4], crit: 18, mult: 2, dt: 'P', finesse: true, icon: 'rapier' },
  shortsword: { name: 'Short Sword', M: [1, 6], S: [1, 4], crit: 19, mult: 2, dt: 'P', light: true, icon: 'dagger' },
  dagger: { name: 'Dagger', M: [1, 4], S: [1, 3], crit: 19, mult: 2, dt: 'P', light: true, icon: 'dagger' },
  scimitar: { name: 'Scimitar', M: [1, 6], S: [1, 4], crit: 18, mult: 2, dt: 'S', icon: 'sword' },
  morningstar: { name: 'Morningstar', M: [1, 8], S: [1, 6], crit: 20, mult: 2, dt: 'B', icon: 'mace' },
  heavyMace: { name: 'Heavy Mace', M: [1, 8], S: [1, 6], crit: 20, mult: 2, dt: 'B', icon: 'mace' },
  quarterstaff: { name: 'Quarterstaff', M: [1, 6], S: [1, 4], crit: 20, mult: 2, dt: 'B', twoHanded: true, icon: 'staff' },
  spear: { name: 'Spear', M: [1, 8], S: [1, 6], crit: 20, mult: 3, dt: 'P', twoHanded: true, icon: 'spear' },
  bastardSword: { name: 'Bastard Sword', M: [1, 10], S: [1, 8], crit: 19, mult: 2, dt: 'S', twoHanded: true, icon: 'greatsword' },
  dogslicer: { name: 'Dogslicer', M: [1, 8], S: [1, 6], crit: 19, mult: 2, dt: 'S', light: true, icon: 'dagger' },
  // ranged
  javelin: { name: 'Javelin', M: [1, 6], S: [1, 4], crit: 20, mult: 2, dt: 'P', ranged: true, thrown: true, range: 30, icon: 'spear' },
  longbow: { name: 'Longbow', M: [1, 8], S: [1, 6], crit: 20, mult: 3, dt: 'P', ranged: true, range: 100, bow: true, icon: 'bow' },
  shortbow: { name: 'Shortbow', M: [1, 6], S: [1, 4], crit: 20, mult: 3, dt: 'P', ranged: true, range: 60, bow: true, icon: 'bow' },
  lightCrossbow: { name: 'Light Crossbow', M: [1, 8], S: [1, 6], crit: 19, mult: 2, dt: 'P', ranged: true, range: 80, reload: true, icon: 'crossbow' },
  sling: { name: 'Sling', M: [1, 4], S: [1, 3], crit: 20, mult: 2, dt: 'B', ranged: true, range: 50, thrown: true, icon: 'sling' },
};

export const ARMORS = {
  none: { name: 'No armor', ac: 0, maxDex: 99, acp: 0, type: 'none' },
  leather: { name: 'Leather armor', ac: 2, maxDex: 6, acp: 0, type: 'light' },
  studded: { name: 'Studded leather', ac: 3, maxDex: 5, acp: -1, type: 'light' },
  chainShirt: { name: 'Chain shirt', ac: 4, maxDex: 4, acp: -2, type: 'light' },
  hide: { name: 'Hide armor', ac: 4, maxDex: 4, acp: -3, type: 'medium' },
  scale: { name: 'Scale mail', ac: 5, maxDex: 3, acp: -4, type: 'medium' },
};
export const SHIELDS = {
  heavyWood: { name: 'Heavy wooden shield', ac: 2, acp: -2 },
  lightWood: { name: 'Light wooden shield', ac: 1, acp: -1 },
};

// ---------------------------------------------------------------- Skills
export const SKILLS = {
  acrobatics: { name: 'Acrobatics', ab: 'dex', acp: true },
  bluff: { name: 'Bluff', ab: 'cha' },
  climb: { name: 'Climb', ab: 'str', acp: true },
  diplomacy: { name: 'Diplomacy', ab: 'cha' },
  disable: { name: 'Disable Device', ab: 'dex', acp: true, trained: true },
  heal: { name: 'Heal', ab: 'wis' },
  intimidate: { name: 'Intimidate', ab: 'cha' },
  arcana: { name: 'Knowledge (arcana)', ab: 'int', trained: true },
  local: { name: 'Knowledge (local)', ab: 'int', trained: true },
  religion: { name: 'Knowledge (religion)', ab: 'int', trained: true },
  perception: { name: 'Perception', ab: 'wis' },
  sense: { name: 'Sense Motive', ab: 'wis' },
  stealth: { name: 'Stealth', ab: 'dex', acp: true },
  survival: { name: 'Survival', ab: 'wis' },
};

// ---------------------------------------------------------------- Classes
export const CLASSES = {
  fighter: {
    name: 'Fighter', hd: 10, bab: 'full', fort: 'good', ref: 'poor', will: 'poor', ranks: 2, role: 'tank',
    classSkills: ['climb', 'intimidate', 'survival'],
    desc: 'Master of arms and armor. Extra combat feats every other level.',
    kits: [
      { name: 'Sword & Board', weapons: ['longsword', 'javelin'], armor: 'scale', shield: 'heavyWood' },
      { name: 'Greatsword', weapons: ['greatsword', 'javelin'], armor: 'scale' },
    ],
    features: ['Bonus combat feats (1st, 2nd, 4th)', 'Bravery (2nd)', 'Armor training (3rd)'],
  },
  barbarian: {
    name: 'Barbarian', hd: 12, bab: 'full', fort: 'good', ref: 'poor', will: 'poor', ranks: 4, role: 'tank',
    classSkills: ['acrobatics', 'climb', 'intimidate', 'perception', 'survival'],
    desc: 'Furious warrior. Rages for +4 Str and Con. Fast movement.',
    kits: [
      { name: 'Greataxe', weapons: ['greataxe', 'javelin'], armor: 'hide' },
      { name: 'Greatsword', weapons: ['greatsword', 'javelin'], armor: 'hide' },
    ],
    features: ['Rage', 'Fast movement', 'Uncanny dodge (2nd)', 'Trap sense (3rd)'],
  },
  paladin: {
    name: 'Paladin', hd: 10, bab: 'full', fort: 'good', ref: 'poor', will: 'good', ranks: 2, role: 'tank',
    classSkills: ['diplomacy', 'heal', 'religion', 'sense'],
    desc: 'Holy knight. Smites evil, heals with a touch, shrugs off curses.',
    kits: [
      { name: 'Sword & Board', weapons: ['longsword', 'javelin'], armor: 'scale', shield: 'heavyWood' },
      { name: 'Greatsword', weapons: ['greatsword', 'javelin'], armor: 'scale' },
    ],
    features: ['Smite evil', 'Divine grace (2nd)', 'Lay on hands (2nd)', 'Aura of courage (3rd)'],
  },
  ranger: {
    name: 'Ranger', hd: 10, bab: 'full', fort: 'good', ref: 'good', will: 'poor', ranks: 6, role: 'skirm',
    classSkills: ['climb', 'heal', 'perception', 'stealth', 'survival'],
    desc: 'Wilderness hunter. Deadly against a favored enemy. Archery style.',
    kits: [
      { name: 'Archer', weapons: ['longbow', 'longsword'], armor: 'studded' },
      { name: 'Blade & Bow', weapons: ['longsword', 'longbow'], armor: 'studded' },
    ],
    features: ['Favored enemy', 'Track', 'Archery combat style (2nd)'],
  },
  rogue: {
    name: 'Rogue', hd: 8, bab: '3/4', fort: 'poor', ref: 'good', will: 'poor', ranks: 8, role: 'skirm',
    classSkills: ['acrobatics', 'bluff', 'climb', 'diplomacy', 'disable', 'intimidate', 'local', 'perception', 'sense', 'stealth'],
    desc: 'Cunning skirmisher. Sneak attacks flanked or flat-footed foes.',
    kits: [
      { name: 'Rapier', weapons: ['rapier', 'shortbow'], armor: 'leather' },
      { name: 'Short Sword', weapons: ['shortsword', 'shortbow'], armor: 'leather' },
    ],
    features: ['Sneak attack', 'Trapfinding', 'Evasion (2nd)', 'Combat trick talents (2nd, 4th)'],
  },
  cleric: {
    name: 'Cleric', hd: 8, bab: '3/4', fort: 'good', ref: 'poor', will: 'good', ranks: 2, role: 'healer',
    classSkills: ['diplomacy', 'heal', 'arcana', 'religion', 'sense'],
    desc: 'Divine caster. Channels positive energy to heal the whole party.',
    caster: 'wis',
    kits: [
      { name: 'Mace & Shield', weapons: ['heavyMace', 'lightCrossbow'], armor: 'scale', shield: 'heavyWood' },
      { name: 'Morningstar', weapons: ['morningstar', 'lightCrossbow'], armor: 'scale', shield: 'lightWood' },
    ],
    features: ['Divine spells', 'Channel energy', 'Selective channeling'],
  },
  wizard: {
    name: 'Wizard', hd: 6, bab: '1/2', fort: 'poor', ref: 'poor', will: 'good', ranks: 2, role: 'arcane',
    classSkills: ['arcana', 'local', 'religion'],
    desc: 'Scholar of arcane magic. Evocation school: spells hit harder.',
    caster: 'int',
    kits: [
      { name: 'Staff', weapons: ['quarterstaff', 'lightCrossbow'], armor: 'none' },
      { name: 'Crossbow', weapons: ['lightCrossbow', 'dagger'], armor: 'none' },
    ],
    features: ['Arcane spells', 'Evoker: intense spells', 'Cantrips at will'],
  },
  sorcerer: {
    name: 'Sorcerer', hd: 6, bab: '1/2', fort: 'poor', ref: 'poor', will: 'good', ranks: 2, role: 'arcane',
    classSkills: ['bluff', 'arcana', 'intimidate'],
    desc: 'Born with draconic magic. Many spell slots, fire spells burn hotter.',
    caster: 'cha',
    kits: [
      { name: 'Spear', weapons: ['spear', 'lightCrossbow'], armor: 'none' },
      { name: 'Crossbow', weapons: ['lightCrossbow', 'dagger'], armor: 'none' },
    ],
    features: ['Arcane spells (spontaneous)', 'Draconic bloodline (fire +1/die)', 'Dragon scales (3rd)'],
  },
};

export const ROLE_NAMES = { tank: 'Defender', healer: 'Healer', arcane: 'Arcanist', skirm: 'Skirmisher' };

// ---------------------------------------------------------------- Feats
const bab = (c) => babFor(CLASSES[c.cls].bab, c.level);
export const FEATS = {
  powerAttack: { name: 'Power Attack', combat: true, desc: 'Trade attack bonus for damage (toggle in combat).', req: (c, a) => a.str >= 13 && bab(c) >= 1 },
  cleave: { name: 'Cleave', combat: true, desc: 'On a hit, make another attack against an adjacent foe (-2 AC).', req: (c) => c.feats.includes('powerAttack') },
  weaponFocus: { name: 'Weapon Focus', combat: true, desc: '+1 attack with your primary weapon.', req: (c) => bab(c) >= 1 },
  weaponFinesse: { name: 'Weapon Finesse', combat: true, desc: 'Use Dex instead of Str to hit with light weapons and rapiers.', req: () => true },
  improvedInit: { name: 'Improved Initiative', combat: true, desc: '+4 initiative.', req: () => true },
  dodge: { name: 'Dodge', combat: true, desc: '+1 dodge bonus to AC.', req: (c, a) => a.dex >= 13 },
  toughness: { name: 'Toughness', desc: '+3 hit points (+1 per level beyond 3rd).', req: () => true },
  pointBlank: { name: 'Point-Blank Shot', combat: true, desc: '+1 attack and damage with ranged attacks within 30 ft.', req: () => true },
  preciseShot: { name: 'Precise Shot', combat: true, desc: 'No -4 penalty for shooting into melee.', req: (c) => c.feats.includes('pointBlank') },
  rapidShot: { name: 'Rapid Shot', combat: true, desc: 'Full attack: one extra ranged attack, all at -2.', req: (c, a) => a.dex >= 13 && c.feats.includes('pointBlank') },
  combatReflexes: { name: 'Combat Reflexes', combat: true, desc: 'Extra attacks of opportunity equal to Dex modifier.', req: () => true },
  combatCasting: { name: 'Combat Casting', desc: '+4 concentration to cast defensively.', req: (c) => !!CLASSES[c.cls].caster },
  extraChannel: { name: 'Extra Channel', desc: '+2 uses of channel energy per day.', req: (c) => c.cls === 'cleric' },
  ironWill: { name: 'Iron Will', desc: '+2 Will saves.', req: () => true },
  lightningReflexes: { name: 'Lightning Reflexes', desc: '+2 Reflex saves.', req: () => true },
  greatFortitude: { name: 'Great Fortitude', desc: '+2 Fortitude saves.', req: () => true },
  alertness: { name: 'Alertness', desc: '+2 Perception and Sense Motive.', req: () => true },
  persuasive: { name: 'Persuasive', desc: '+2 Diplomacy and Intimidate.', req: () => true },
  stealthy: { name: 'Stealthy', desc: '+2 Stealth and Acrobatics.', req: () => true },
};

// Campaign traits, picked through the opening story choice.
export const TRAITS = {
  faith: { name: 'Chosen of the Cathedral', desc: '+1 Will saves and +1 Knowledge (religion).' },
  lore: { name: 'Thassilonian Scholar', desc: '+2 Knowledge (arcana), +1 initiative.' },
  home: { name: 'Sandpoint Local', desc: '+2 Diplomacy and Knowledge (local).' },
  coin: { name: 'Sellsword', desc: '+1 Perception and +1 attack on attacks of opportunity.' },
};

// ---------------------------------------------------------------- Progressions
export function babFor(prog, L) {
  if (prog === 'full') return L;
  if (prog === '3/4') return Math.floor((L * 3) / 4);
  return Math.floor(L / 2);
}
export function saveFor(prog, L) {
  return prog === 'good' ? 2 + Math.floor(L / 2) : Math.floor(L / 3);
}

const SLOTS = {
  cleric: [null, { 1: 1 }, { 1: 2 }, { 1: 2, 2: 1 }, { 1: 3, 2: 2 }],
  wizard: [null, { 1: 1 }, { 1: 2 }, { 1: 2, 2: 1 }, { 1: 3, 2: 2 }],
  sorcerer: [null, { 1: 3 }, { 1: 4 }, { 1: 5 }, { 1: 6, 2: 3 }],
};
export function spellSlots(cls, L, castMod) {
  const t = SLOTS[cls]?.[Math.min(L, 4)];
  if (!t) return {};
  const out = {};
  for (const k of Object.keys(t)) {
    const lvl = +k;
    let n = t[k];
    if (cls !== 'sorcerer') n += 1; // domain / specialist school slot
    if (castMod >= lvl) n += Math.floor((castMod - lvl) / 4) + 1;
    out[lvl] = n;
  }
  return out;
}

// ---------------------------------------------------------------- Derived stats
export function finalAbilities(c, st = {}) {
  const race = RACES[c.race];
  const a = { ...c.base };
  for (const k in race.mods) a[k] += race.mods[k];
  if (race.flex && c.flex) a[c.flex] += 2;
  for (const k of c.increases || []) a[k] += 1;
  if (st.rage) { a.str += 4; a.con += 4; }
  if (st.bullStrength) a.str += 4;
  if (st.fatigued) { a.str -= 2; a.dex -= 2; }
  if (st.dexDamage) a.dex -= st.dexDamage;
  return a;
}

export function trainedSkillCount(c) {
  const a = finalAbilities(c);
  return Math.max(1, CLASSES[c.cls].ranks + mod(a.int) + (RACES[c.race].skilled || 0));
}

export function maxHp(c) {
  const cls = CLASSES[c.cls];
  const con = mod(finalAbilities(c).con);
  let hp = cls.hd + con;
  for (let L = 2; L <= c.level; L++) hp += Math.max(1, cls.hd / 2 + 1 + con) + 1; // +1 favored class
  hp += 1; // favored class bonus at 1st level
  if (c.feats.includes('toughness')) hp += Math.max(3, c.level);
  return hp;
}

// Status-dependent attack/damage mods shared by PCs and monsters.
export function statusAttackMods(st) {
  let atk = 0, dmg = 0;
  if (st.blessed) atk += 1;
  if (st.inspired) { atk += 1; dmg += 1; }
  if (st.divineFavor) { atk += st.divineFavor; dmg += st.divineFavor; }
  if (st.shaken) atk -= 2;
  if (st.sickened) { atk -= 2; dmg -= 2; }
  return { atk, dmg };
}

function sizeMod(size) { return size === 'S' ? 1 : size === 'L' ? -1 : 0; }

export function derive(c, st = {}) {
  const race = RACES[c.race];
  const cls = CLASSES[c.cls];
  const kit = cls.kits[c.kit || 0];
  const L = c.level;
  const a = finalAbilities(c, st);
  const m = {};
  for (const k of ABILS) m[k] = mod(a[k]);
  const size = race.size;
  const sm = sizeMod(size);
  const feats = new Set(c.feats);
  const gear = c.gear || {};
  const B = babFor(cls.bab, L);

  // Armor class
  const armor = ARMORS[kit.armor];
  const shield = kit.shield ? SHIELDS[kit.shield] : null;
  const acp = (armor.acp || 0) + (shield ? shield.acp : 0) + (L >= 3 && c.cls === 'fighter' ? 1 : 0);
  const maxDex = armor.maxDex + (L >= 3 && c.cls === 'fighter' ? 1 : 0);
  const loseDex = st.flatFooted || st.blinded || st.stunned || st.helpless;
  let dexAC = Math.min(m.dex, maxDex);
  if (st.helpless) dexAC = -5;
  else if (loseDex && dexAC > 0) dexAC = 0;
  const parts = {
    armor: Math.max(armor.ac + (armor.ac ? gear.armorEnh || 0 : 0), st.mageArmor ? 4 : 0),
    shield: Math.max(shield ? shield.ac : 0, st.shieldSpell ? 4 : 0),
    dex: dexAC,
    size: sm,
    natural: c.cls === 'sorcerer' && L >= 3 ? 1 : 0,
    deflection: Math.max(gear.ringProt || 0, st.shieldOfFaith || 0),
    dodge: (feats.has('dodge') && !loseDex ? 1 : 0) + (st.totalDefense ? 4 : 0),
    misc: (st.rage ? -2 : 0) + (st.charging ? -2 : 0) + (st.stunned || st.blinded ? -2 : 0),
  };
  const ac = 10 + Object.values(parts).reduce((s, v) => s + v, 0);
  const touch = ac - parts.armor - parts.shield - parts.natural;
  const flatParts = { ...parts, dex: Math.min(parts.dex, 0), dodge: 0 };
  const flat = 10 + Object.values(flatParts).reduce((s, v) => s + v, 0);

  // Saves
  const cloak = gear.resistance || 0;
  const luck = race.luck || 0;
  const grace = c.cls === 'paladin' && L >= 2 ? Math.max(0, m.cha) : 0;
  const stSave = (st.shaken ? -2 : 0) + (st.sickened ? -2 : 0);
  const fort = saveFor(cls.fort, L) + m.con + cloak + luck + grace + (feats.has('greatFortitude') ? 2 : 0) + stSave;
  const ref = saveFor(cls.ref, L) + m.dex + cloak + luck + grace + (feats.has('lightningReflexes') ? 2 : 0) + stSave;
  const will = saveFor(cls.will, L) + m.wis + cloak + luck + grace + (feats.has('ironWill') ? 2 : 0) + (st.rage ? 2 : 0) + (c.trait === 'faith' ? 1 : 0) + stSave;

  // Speed
  let speed = race.speed;
  if (armor.type === 'medium' && !race.steady) speed = speed === 30 ? 20 : 15;
  if (c.cls === 'barbarian' && armor.type !== 'heavy') speed += 10;
  if (st.blinded) speed = Math.floor(speed / 2 / 5) * 5;

  // Attacks
  const sa = statusAttackMods(st);
  const strDmg = st.fatigued ? m.str : m.str;
  const attacks = { melee: [], ranged: [] };
  kit.weapons.forEach((wk, idx) => {
    const w = WEAPONS[wk];
    const enh = idx === 0 ? gear.weaponEnh || 0 : 0;
    const focus = idx === 0 && feats.has('weaponFocus') ? 1 : 0;
    const [n, s] = w[size] || w.M;
    if (!w.ranged) {
      const finesse = feats.has('weaponFinesse') && (w.light || w.finesse);
      const abil = finesse ? Math.max(m.dex, m.str) : m.str;
      const dmgBonus = (w.twoHanded ? Math.floor(strDmg * 1.5) : strDmg) + enh + sa.dmg;
      attacks.melee.push({ key: wk, name: w.name, bonus: B + abil + sm + enh + focus + sa.atk, n, s, dmgBonus, crit: w.crit, mult: w.mult, dt: w.dt, twoHanded: !!w.twoHanded, icon: w.icon });
    }
    if (w.ranged || w.thrownToo) {
      const dmgBonus = (w.thrown ? strDmg : Math.min(0, strDmg)) + enh + sa.dmg;
      attacks.ranged.push({ key: wk, name: w.name, bonus: B + m.dex + sm + enh + focus + sa.atk, n, s, dmgBonus, crit: w.crit, mult: w.mult, dt: w.dt, range: w.range, reload: !!w.reload, thrown: !!w.thrown, icon: w.icon });
    }
  });
  if (!attacks.melee.length) {
    // unarmed strike (doesn't threaten, but can still punch)
    attacks.melee.push({ key: 'unarmed', name: 'Unarmed', bonus: B + m.str + sm + sa.atk, n: 1, s: size === 'S' ? 2 : 3, dmgBonus: m.str, crit: 20, mult: 2, dt: 'B', unarmed: true });
  }

  // Skills
  const trained = new Set(c.skills || []);
  const skills = {};
  for (const [k, sk] of Object.entries(SKILLS)) {
    const isTrained = trained.has(k);
    if (sk.trained && !isTrained) { skills[k] = null; continue; }
    let v = m[sk.ab] + (isTrained ? L : 0);
    if (isTrained && cls.classSkills.includes(k)) v += 3;
    if (race.skills?.[k]) v += race.skills[k];
    if (sk.acp) v += acp;
    if (k === 'stealth' && size === 'S') v += 4;
    if (feats.has('alertness') && (k === 'perception' || k === 'sense')) v += 2;
    if (feats.has('persuasive') && (k === 'diplomacy' || k === 'intimidate')) v += 2;
    if (feats.has('stealthy') && (k === 'stealth' || k === 'acrobatics')) v += 2;
    if (c.trait === 'faith' && k === 'religion') v += 1;
    if (c.trait === 'lore' && k === 'arcana') v += 2;
    if (c.trait === 'home' && (k === 'diplomacy' || k === 'local')) v += 2;
    if (c.trait === 'coin' && k === 'perception') v += 1;
    if (c.cls === 'ranger' && k === 'survival') v += Math.max(1, Math.floor(L / 2));
    if (c.cls === 'rogue' && (k === 'disable' || k === 'perception')) v += Math.max(1, Math.floor(L / 2));
    if (st.shaken || st.sickened) v -= 2;
    skills[k] = v;
  }

  // Spellcasting
  let caster = null;
  if (cls.caster) {
    const cm = m[cls.caster];
    caster = { cls: c.cls, cl: L, mod: cm, slots: spellSlots(c.cls, L, cm), concentration: L + cm + (feats.has('combatCasting') ? 4 : 0) };
  }

  const init = m.dex + (feats.has('improvedInit') ? 4 : 0) + (c.trait === 'lore' ? 1 : 0);
  const cmb = B + m.str - sm;
  const cmd = 10 + B + m.str + (loseDex ? 0 : m.dex) - sm;

  return {
    name: c.name, size, sizeMod: sm, type: 'humanoid', subtypes: [c.race], level: L, hd: L,
    abil: a, m, bab: B, acParts: parts, ac, touch, flat, fort, ref, will, speed, init, cmb, cmd,
    attacks, skills, caster, feats, acp,
    sneak: c.cls === 'rogue' ? Math.ceil(L / 2) : 0,
    evasion: c.cls === 'rogue' && L >= 2,
    uncannyDodge: (c.cls === 'barbarian' && L >= 2) || (c.cls === 'rogue' && L >= 4),
    favoredEnemy: c.cls === 'ranger' ? c.favoredEnemy || 'goblinoid' : null,
    hatred: race.hatred || [],
    defensive: race.defensive || [],
    immune: [...(race.immune || []), ...(c.cls === 'paladin' && L >= 3 ? ['fear', 'disease'] : [])],
    enchantSave: race.enchantSave || 0,
    fearSave: race.fearSave || 0,
    ferocity: !!race.ferocity,
    evil: false,
    conScore: a.con,
    intense: c.cls === 'wizard' ? Math.max(1, Math.floor(L / 2)) : 0,
    draconic: c.cls === 'sorcerer',
  };
}

// ---------------------------------------------------------------- Creation
let _uid = 1;
export function uid(prefix = 'c') { return `${prefix}${Date.now().toString(36)}${(_uid++).toString(36)}`; }

export function createCharacter(o) {
  const c = {
    id: o.id || uid(),
    name: o.name || 'Hero',
    isPlayer: !!o.isPlayer,
    race: o.race, cls: o.cls, level: o.level || 1,
    base: { ...o.base }, flex: o.flex || null, increases: o.increases ? [...o.increases] : [],
    feats: [...(o.feats || [])], skills: [...(o.skills || [])], kit: o.kit || 0,
    favoredEnemy: o.favoredEnemy || 'goblinoid', trait: o.trait || null,
    appearance: { ...(o.appearance || {}) },
    gear: { weaponEnh: 0, armorEnh: 0, ringProt: 0, resistance: 0, ...(o.gear || {}) },
    bio: o.bio || '', role: CLASSES[o.cls].role,
    used: {},
  };
  c.hp = maxHp(c);
  return c;
}

// Number of feats the character is due at a given level.
export function featsGainedAt(c, L) {
  let n = 0;
  if (L === 1) n += 1 + (RACES[c.race].bonusFeat ? 1 : 0);
  if (L === 3 || L === 5) n += 1;
  if (c.cls === 'fighter' && (L === 1 || L % 2 === 0)) n += 1; // combat feat
  if (c.cls === 'rogue' && L % 2 === 0) n += 1; // combat trick talent
  return n;
}
export function featAllowed(c, key, combatOnly = false) {
  const f = FEATS[key];
  if (!f || c.feats.includes(key)) return false;
  if (combatOnly && !f.combat) return false;
  return f.req(c, finalAbilities(c));
}

export function levelUp(c, { feats = [], increase = null } = {}) {
  const before = maxHp(c);
  c.level += 1;
  if (increase) c.increases.push(increase);
  c.feats.push(...feats);
  if (c.cls === 'ranger' && c.level === 2) {
    for (const f of ['pointBlank', 'rapidShot']) if (!c.feats.includes(f)) c.feats.push(f);
  }
  const after = maxHp(c);
  c.hp += after - before;
}

// Long rest: full HP, refresh all daily resources.
export function rest(c) {
  c.hp = maxHp(c);
  c.used = {};
  delete c.dead;
}

// ---------------------------------------------------------------- Companions (bots)
export const COMPANIONS = {
  tank: {
    name: 'Brannoc', race: 'human', cls: 'fighter', kit: 0, flex: 'str',
    base: { str: 17, dex: 13, con: 14, int: 10, wis: 10, cha: 9 },
    feats: ['powerAttack', 'weaponFocus', 'dodge'], skills: ['climb', 'intimidate', 'perception'],
    levelFeats: { 2: ['toughness'], 3: ['ironWill'], 4: ['cleave'] }, increase: 'str',
    appearance: { skin: 1, hair: 1, hairStyle: 0, outfit: 0, beard: true },
    bio: 'Former Sandpoint militia, gruff but loyal. Says little, stands in front of everything.',
  },
  healer: {
    name: 'Tamsin', race: 'halfElf', cls: 'cleric', kit: 1, flex: 'wis',
    base: { str: 13, dex: 10, con: 14, int: 10, wis: 16, cha: 12 },
    feats: ['toughness'], skills: ['heal', 'diplomacy'],
    levelFeats: { 3: ['extraChannel'] }, increase: 'wis',
    appearance: { skin: 0, hair: 3, hairStyle: 1, outfit: 3 },
    bio: 'Cleric of Sarenrae, the Dawnflower. Warm, stubborn, and far braver than she looks.',
  },
  arcane: {
    name: 'Quillan', race: 'elf', cls: 'wizard', kit: 0,
    base: { str: 8, dex: 14, con: 12, int: 17, wis: 12, cha: 10 },
    feats: ['combatCasting'], skills: ['arcana', 'local', 'religion', 'perception', 'sense', 'stealth'],
    levelFeats: { 3: ['toughness'] }, increase: 'int',
    appearance: { skin: 0, hair: 4, hairStyle: 1, outfit: 4 },
    bio: 'Elven evoker obsessed with the ruins of ancient Thassilon. Talks too much about runes.',
  },
  skirm: {
    name: 'Pip', race: 'halfling', cls: 'rogue', kit: 0,
    base: { str: 10, dex: 16, con: 14, int: 12, wis: 10, cha: 13 },
    feats: ['weaponFinesse'], skills: ['acrobatics', 'bluff', 'climb', 'diplomacy', 'disable', 'perception', 'sense', 'stealth', 'local'],
    levelFeats: { 2: ['dodge'], 3: ['pointBlank'], 4: ['preciseShot'] }, increase: 'dex',
    appearance: { skin: 1, hair: 2, hairStyle: 3, outfit: 6 },
    bio: 'Cheerful halfling "acquisitions expert". Knows every alley and every rumor in Sandpoint.',
  },
};

export function createCompanion(role, level = 1) {
  const t = COMPANIONS[role];
  const c = createCharacter({ ...t, isPlayer: false, level: 1 });
  for (let L = 2; L <= level; L++) levelUp(c, { feats: t.levelFeats[L] || [], increase: L === 4 ? t.increase : null });
  c.hp = maxHp(c);
  return c;
}

export const ROLES = ['tank', 'healer', 'arcane', 'skirm'];
export function companionRolesFor(playerCls) {
  const r = CLASSES[playerCls].role;
  return ROLES.filter((x) => x !== r);
}
