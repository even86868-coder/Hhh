// Headless balance / crash test: AI plays every encounter many times.
import { createCharacter, createCompanion, companionRolesFor, levelUp, rest, CLASSES } from '../js/rules.js';
import { Combat } from '../js/combat.js';
import { aiTurn } from '../js/ai.js';
import { buildEncounter, ENCOUNTERS } from '../js/maps.js';
import { setRng, seeded } from '../js/dice.js';

const LEVELS = { festival: 1, aldern: 1, cathedral: 1, boar: 2, glassworks: 2, tsuto: 2, sinspawn: 3, erylium: 3, nettlewood: 3, bridge: 4, bruthazmus: 4, ripnugget: 4, duel: 4, orikLyrie: 4, nualia: 4 };
const PLAYERS = {
  fighter: { race: 'human', flex: 'str', base: { str: 17, dex: 14, con: 14, int: 10, wis: 10, cha: 7 }, feats: ['powerAttack', 'weaponFocus', 'dodge'], kit: 1 },
  wizard: { race: 'gnome', base: { str: 8, dex: 14, con: 14, int: 17, wis: 10, cha: 10 }, feats: ['toughness'], kit: 0 },
  rogue: { race: 'elf', base: { str: 10, dex: 17, con: 14, int: 12, wis: 10, cha: 10 }, feats: ['weaponFinesse'], kit: 0 },
  cleric: { race: 'dwarf', base: { str: 14, dex: 10, con: 14, int: 10, wis: 17, cha: 10 }, feats: ['toughness'], kit: 0 },
  barbarian: { race: 'halfOrc', flex: 'str', base: { str: 17, dex: 14, con: 14, int: 10, wis: 10, cha: 7 }, feats: ['powerAttack'], kit: 0 },
  paladin: { race: 'human', flex: 'cha', base: { str: 17, dex: 10, con: 14, int: 8, wis: 10, cha: 14 }, feats: ['powerAttack', 'weaponFocus'], kit: 0 },
  ranger: { race: 'halfElf', flex: 'dex', base: { str: 14, dex: 17, con: 12, int: 10, wis: 12, cha: 8 }, feats: ['pointBlank'], kit: 0 },
  sorcerer: { race: 'halfling', base: { str: 8, dex: 14, con: 14, int: 10, wis: 10, cha: 17 }, feats: ['toughness'], kit: 1 },
};

function party(cls, level) {
  const p = createCharacter({ name: 'Hero', isPlayer: true, cls, ...PLAYERS[cls], skills: [] });
  for (let L = 2; L <= level; L++) levelUp(p, { feats: L === 3 ? ['toughness'].filter((f) => !p.feats.includes(f)) : [], increase: L === 4 ? 'str' : null });
  rest(p);
  return [p, ...companionRolesFor(cls).map((r) => createCompanion(r, level))];
}

const N = +(process.argv[2] || 40);
let errors = 0;
const only = process.argv[3];
for (const key of Object.keys(ENCOUNTERS)) {
  if (only && key !== only) continue;
  const row = [];
  for (const cls of Object.keys(PLAYERS)) {
    let wins = 0, rounds = 0, deaths = 0;
    for (let i = 0; i < N; i++) {
      setRng(seeded(i * 7919 + key.length * 31 + cls.length));
      const pts = party(cls, LEVELS[key]);
      const enc = buildEncounter(key, {});
      const members = enc.soloPlayer ? [pts[0]] : pts;
      const cb = new Combat({ map: enc.map, party: members, enemies: enc.enemies, controllers: { player: aiTurn, ai: aiTurn } });
      cb.inventory = { potions: 2 };
      try {
        const res = await cb.run();
        if (res === 'victory') wins++;
        rounds += cb.round;
        deaths += cb.units.filter((u) => u.side === 'party' && u.dead).length;
      } catch (err) {
        errors++;
        if (errors < 5) console.error(key, cls, err.stack);
      }
    }
    row.push(`${cls.slice(0, 4)} ${String(Math.round((wins / N) * 100)).padStart(3)}% r${(rounds / N).toFixed(1)} d${(deaths / N).toFixed(2)}`);
  }
  console.log(key.padEnd(11), row.join(' | '));
}
console.log('errors:', errors);
