// Procedural cute pixel art: characters, monsters, tiles and story scenes.
import { CLASSES, WEAPONS } from './rules.js';

export const SKIN = ['#fde0c0', '#f0c090', '#c98a5a', '#8a5a3a', '#5a3a28', '#a8c878', '#86a85e', '#c8d8f0'];
export const HAIR = ['#2b2230', '#6b4226', '#b0482a', '#ecc85c', '#f0f0f6', '#6a92d8', '#e07ab0', '#4f9a50'];
export const OUTFIT = ['#3a6ad0', '#c03a3a', '#3a9a4a', '#e8d070', '#7a4ac0', '#e07a2a', '#40405a', '#e8e8f0'];
export const HAIR_STYLES = ['Short', 'Long', 'Spiky', 'Curly', 'Ponytail', 'Bald', 'Mohawk'];
const OUTLINE = '#1b1424';

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; } else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
  return `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
}

const blank = () => Array.from({ length: 16 }, () => Array(16).fill('.'));
function stamp(grid, rows, startRow = 0) {
  rows.forEach((row, i) => {
    const y = startRow + i;
    if (y < 0 || y > 15) return;
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      grid[y][x] = ch === '_' ? '.' : ch;
    });
  });
}
function px(grid, list, ch) { for (const [x, y] of list) if (x >= 0 && x < 16 && y >= 0 && y < 16) grid[y][x] = ch; }

// ------------------------------------------------------------------ character parts
const HEAD = [
  '.....SSSSSS.....',
  '....SSSSSSSS....',
  '...SSSSSSSSSS...',
  '...SSEeSSEeSS...',
  '...SSEESSEESS...',
  '...SpSSSSSSpS...',
  '....SSSmmSSS....',
  '.....SSSSSS.....',
]; // rows 3..10

const HAIRS = [
  { 3: '.....HHHHHH.....', 4: '....HHHHHHHH....', 5: '...HHHHHHHHHH...', 6: '...HH......HH...', 7: '...H........H...' },
  { 3: '.....HHHHHH.....', 4: '....HHHHHHHH....', 5: '...HHHHHHHHHH...', 6: '..HHH......HHH..', 7: '..HH........HH..', 8: '..HH........HH..', 9: '..HH........HH..', 10: '..HH........HH..', 11: '...H........H...' },
  { 1: '....H..H..H.....', 2: '....HH.HH.HH....', 3: '...HHHHHHHHHH...', 4: '...HHHHHHHHHH...', 5: '...HHHHHHHHHH...', 6: '...HH......HH...' },
  { 2: '.....HH..HH.....', 3: '....HHHHHHHH....', 4: '...HHHHHHHHHH...', 5: '..HHHHHHHHHHHH..', 6: '..HHH......HHH..', 7: '..HH........HH..', 8: '..HH........HH..' },
  { 3: '.....HHHHHH.....', 4: '....HHHHHHHH.HH.', 5: '...HHHHHHHHHHHH.', 6: '...HH......HHHH.', 7: '...H.........HH.', 8: '.............HH.', 9: '..............H.' },
  {},
  { 0: '.......HH.......', 1: '.......HH.......', 2: '......HHHH......', 3: '.......HH.......' },
];

const BODIES = {
  fighter: ['....aAAAAAAa....', '...SaAAOOAAaS...', '....aAbbbbAa....', '.....aa..aa.....', '.....BB..BB.....'],
  paladin: ['....aAAAAAAa....', '...SaAGOOGAaS...', '....aAGbbGAa....', '.....aa..aa.....', '.....BB..BB.....'],
  barbarian: ['....FSSSSSSF....', '...SSSSSSSSSS...', '....FbbbbbbF....', '.....OO..OO.....', '.....BB..BB.....'],
  rogue: ['....oOOOOOOo....', '...SoOOOOOOoS...', '....obbbbbbo....', '.....oo..oo.....', '.....BB..BB.....'],
  ranger: ['...CoOOOOOOoC...', '...CSOOOOOOSC...', '...CobbbbbboC...', '...C.oo..oo.C...', '.....BB..BB.....'],
  cleric: ['....OOOOOOOO....', '...SOOOGGOOOS...', '....OOOGGOOO....', '....OOOOOOOO....', '.....BB..BB.....'],
  wizard: ['....OOOOOOOO....', '...SOOOOOOOOS...', '....ObbbbbbO....', '....OOOOOOOO....', '....oBB..BBo....'],
  sorcerer: ['....oOOOOOOo....', '...MoOOOOOOoM...', '....OObbbbOO....', '....OOO..OOO....', '.....BB..BB.....'],
};
const WIZ_HAT = ['.........o......', '........OO......', '.......OOOO.....', '......OOOOOO....', '..oooooooooooo..'];

const WEAPON_PX = {
  sword: { W: [[13, 5], [13, 6], [13, 7], [13, 8], [13, 9], [13, 10]], G: [[12, 11], [13, 11], [14, 11]], b: [[13, 12]] },
  greatsword: { W: [[13, 2], [13, 3], [13, 4], [13, 5], [13, 6], [13, 7], [13, 8], [13, 9], [13, 10], [14, 3], [14, 4], [14, 5], [14, 6], [14, 7], [14, 8], [14, 9], [14, 10]], G: [[12, 11], [13, 11], [14, 11], [15, 11]], b: [[13, 12], [14, 12]] },
  axe: { b: [[13, 4], [13, 5], [13, 6], [13, 7], [13, 8], [13, 9], [13, 10], [13, 11], [13, 12], [13, 13]], W: [[14, 3], [14, 4], [14, 5], [14, 6], [14, 7], [15, 4], [15, 5], [15, 6], [12, 4], [12, 5]] },
  rapier: { W: [[13, 4], [13, 5], [13, 6], [13, 7], [13, 8], [13, 9], [13, 10]], G: [[12, 11], [14, 11], [13, 11], [14, 12]] },
  dagger: { W: [[13, 9], [13, 10]], G: [[13, 11]], b: [[13, 12]] },
  mace: { b: [[13, 8], [13, 9], [13, 10], [13, 11], [13, 12]], a: [[12, 6], [13, 6], [14, 6], [12, 7], [13, 7], [14, 7]], W: [[13, 5], [11, 6], [15, 7]] },
  staff: { b: [[13, 3], [13, 4], [13, 5], [13, 6], [13, 7], [13, 8], [13, 9], [13, 10], [13, 11], [13, 12], [13, 13], [13, 14]], M: [[13, 1], [13, 2], [12, 2], [14, 2]] },
  spear: { b: [[13, 3], [13, 4], [13, 5], [13, 6], [13, 7], [13, 8], [13, 9], [13, 10], [13, 11], [13, 12], [13, 13]], W: [[13, 0], [13, 1], [13, 2], [12, 2], [14, 2]] },
  bow: { b: [[13, 5], [14, 6], [14, 7], [15, 8], [15, 9], [15, 10], [14, 11], [14, 12], [13, 13]], W: [[13, 6], [13, 7], [13, 8], [13, 9], [13, 10], [13, 11], [13, 12]] },
  crossbow: { b: [[11, 12], [12, 12], [13, 12], [14, 12], [15, 12]], W: [[14, 10], [14, 11], [14, 13], [14, 14]] },
  sling: { b: [[13, 11], [13, 12]], a: [[13, 13]] },
};
const SHIELD_PX = { Z: [[1, 11], [2, 11], [3, 11], [0, 12], [1, 12], [3, 12], [0, 13], [1, 13], [3, 13], [1, 14], [2, 14]], z: [[2, 12], [2, 13]] };

export function characterGrid(c, opts = {}) {
  const ap = c.appearance || {};
  const g = blank();
  stamp(g, HEAD, 3);
  stamp(g, BODIES[opts.body || c.cls] || BODIES.rogue, 11);
  // race features
  if (c.race === 'elf') px(g, [[2, 6], [2, 7], [1, 5], [13, 6], [13, 7], [14, 5]], 'S');
  if (c.race === 'halfElf') px(g, [[2, 7], [13, 7], [2, 6], [13, 6]], 'S');
  if (c.race === 'halfOrc') px(g, [[6, 9], [9, 9]], 'W');
  if (c.race === 'gnome') px(g, [[7, 8], [8, 8]], 's');
  if (c.race === 'halfling') { px(g, [[5, 15], [6, 15], [9, 15], [10, 15]], 'S'); }
  // hair
  const style = HAIRS[ap.hairStyle ?? 0] || {};
  for (const [row, str] of Object.entries(style)) stamp(g, [str], +row);
  if (ap.beard || c.race === 'dwarf') {
    stamp(g, ['...HS......SH...', '...HHHH..HHHH...', '....HHHHHHHH....', '.....HHHHHH.....', '......HHHH......'], 8);
    px(g, [[7, 9], [8, 9]], 'm');
  }
  if ((opts.body || c.cls) === 'wizard' && !opts.noHat) stamp(g, WIZ_HAT, 0);
  // weapons
  const kit = CLASSES[c.cls]?.kits[c.kit || 0];
  const wkey = opts.weapon || kit?.weapons[0];
  const icon = WEAPON_PX[WEAPONS[wkey]?.icon || wkey];
  if (icon) for (const [ch, list] of Object.entries(icon)) px(g, list, ch);
  if (opts.shield ?? kit?.shield) for (const [ch, list] of Object.entries(SHIELD_PX)) px(g, list, ch);
  if (opts.claw) px(g, [[2, 12], [2, 13], [1, 13], [3, 13]], 'R');
  // small folk are shorter: drop the belt row and shift down
  if (c.race === 'halfling' || c.race === 'gnome') { g.splice(13, 1); g.unshift(Array(16).fill('.')); }
  if (c.race === 'dwarf') { g.splice(14, 1); g.unshift(Array(16).fill('.')); }
  return g;
}

export function characterPalette(c) {
  const ap = c.appearance || {};
  const skin = SKIN[ap.skin ?? 0];
  const hair = HAIR[ap.hair ?? 0];
  const out = OUTFIT[ap.outfit ?? 0];
  return {
    S: skin, s: shade(skin, -0.2), p: shade(skin, -0.12).replace(/^/, ''), H: hair, E: '#241a2a', e: '#ffffff', m: shade(skin, -0.35),
    O: out, o: shade(out, -0.3), A: '#b8c0d0', a: '#727a90', G: '#f2c84b', b: '#7a4a2a', B: '#4a3020', F: '#9a7a5a',
    C: '#3d6b35', M: '#b98cff', W: '#e8eef8', Z: '#9a6a3a', z: out, R: '#c02040', k: '#241a2a', l: '#8a5a32', g: '#4f8a3a', P: '#d89a9a',
  };
}

// ------------------------------------------------------------------ monsters
const MON = {
  goblin: {
    pal: { G: '#7cc04a', g: '#4f8a2f', R: '#e8303a', W: '#fff4d0', k: '#3a1a1a', l: '#8a5a32', L: '#5a3a1e', X: '#cfd6e0' },
    rows: [
      '................', '................', '................', '................',
      '.g....GGGG....g.', '.gg.GGGGGGGG.gg.', '..gGGGGGGGGGGg..', '...GGRRGGRRGG...',
      '...GGRkGGRkGG...', '...GGGGGGGGGG...', '....GWkWkWkG....', '.....GGGGGG..X..',
      '....LllllllL.X..', '...GlllllllG.X..', '.....ll.ll...g..', '.....gg.gg......',
    ],
  },
  goblinArcher: {
    pal: { G: '#7cc04a', g: '#4f8a2f', R: '#e8303a', W: '#fff4d0', k: '#3a1a1a', l: '#6a7a3a', L: '#4a5a2a', b: '#7a4a2a', X: '#e8eef8' },
    rows: [
      '................', '................', '................', '................',
      '.g....GGGG....g.', '.gg.GGGGGGGG.gg.', '..gGGGGGGGGGGg..', '...GGRRGGRRGG...',
      '...GGRkGGRkGG.b.', '...GGGGGGGGGG.Xb', '....GWkWkWkG..Xb', '.....GGGGGG...Xb',
      '....LllllllL..Xb', '...GlllllllG..b.', '.....ll.ll......', '.....gg.gg......',
    ],
  },
  warchanter: {
    pal: { G: '#7cc04a', g: '#4f8a2f', R: '#e8303a', W: '#fff4d0', k: '#3a1a1a', l: '#a03a3a', L: '#702a2a', F: '#f2c84b', f: '#e05a3a', b: '#7a4a2a', D: '#c89a5a' },
    rows: [
      '................', '.......F.f......', '......fFfFf.....', '.....FfFfFfF....',
      '.g....GGGG....g.', '.gg.GGGGGGGG.gg.', '..gGGGGGGGGGGg..', '...GGRRGGRRGG...',
      '...GGRkGGRkGG...', '...GGGGGGGGGG...', '....GWkWkWkG....', '.....GGGGGG.....',
      '...DDlllllll....', '..DDDDllllllG...', '...DD.ll.ll.....', '.....gg.gg......',
    ],
  },
  goblinDog: {
    pal: { P: '#d89a8a', p: '#a86a62', R: '#e8303a', k: '#3a1a1a', W: '#fff4d0' },
    rows: [
      '................', '................', '................', '................',
      '................', '..........pp....', '.........pPPp...', '..p......PRPPp..',
      '..PP....PPPPPPk.', '...PPPPPPPPPWPW.', '...PPPPPPPPPPP..', '...PPpPPPPPPP...',
      '...PP.PP..PP.PP.', '...PP.PP..PP.PP.', '...pp.pp..pp.pp.', '................',
    ],
  },
  boar: {
    pal: { B: '#7a5236', b: '#523422', W: '#fff4d0', k: '#1a1010', P: '#c08070', R: '#e8303a' },
    rows: [
      '................', '................', '................', '................',
      '................', '....b.b.b.......', '...bBBBBBBBb....', '..bBBBBBBBBBBb..',
      '.bBBBBBBBBBRBBb.', '.bBBBBBBBBBBBPP.', '.bBBBBBBBBBBWPk.', '..bBBBBBBBBBW...',
      '...BB.BB..BB.B..', '...BB.BB..BB.B..', '...bb.bb..bb.b..', '................',
    ],
  },
  sinspawn: {
    pal: { V: '#b05ab8', v: '#7a3a88', R: '#ffdd44', W: '#fff4d0', k: '#2a0a2a', M: '#e04060' },
    rows: [
      '................', '................', '.....vvvvv......', '....vVVVVVv.....',
      '...vVVVVVVVv....', '...vVRVVVRVv....', '...vVVVVVVVv....', '....vVVVVVv.....',
      '..vvVVVVVVVvv...', '.vV.vVWMWVv.Vv..', '.V..vMWMWMv..V..', '.v..vVMMMVv..v..',
      '....vVVVVVv.....', '.....vV.Vv......', '.....vV.Vv......', '....vvv.vvv.....',
    ],
  },
  quasit: {
    pal: { Q: '#d8443a', q: '#9a2a2a', w: '#5a2a5a', W: '#8a4a8a', Y: '#ffe040', k: '#1a0a0a', H: '#f0e0c0' },
    rows: [
      '................', '................', '................', '....H......H....',
      '.....H....H.....', '.w...QQQQQ...w..', 'wWw.QQQQQQQ.wWw.', 'wWWwQYkQkYQwWWw.',
      '.wWwQQQQQQQwWw..', '..wwqQQkQQqww...', '.....qQQQq......', '.....QQQQQ......',
      '....Q.QQQ.Q.....', '......Q.Q.......', '.....qq.qq......', '..........q.....',
    ],
  },
  bugbear: {
    pal: { U: '#a8743a', u: '#74501f', R: '#ffdd44', k: '#2a1a0a', W: '#fff4d0', l: '#5a4a3a', L: '#3a2e24', a: '#727a90', b: '#5a3a1a' },
    rows: [
      '................', '..u.........u...', '..uU..UUUU.Uu...', '...UUUUUUUUUU...',
      '...UUUUUUUUUU...', '...UURkUURkUU...', '...UUUUUUUUUU...', '....UUWkkWUU....',
      '....uUUUUUUu.a..', '...UllllllllU.a.', '..UUllllllllUUb.', '..U.llllllll..b.',
      '....LLLLLLLL..b.', '....uUU..UUu....', '....uUU..UUu....', '...LLLL..LLLL...',
    ],
  },
  yethHound: {
    pal: { D: '#3a3446', d: '#24202e', R: '#ff3040', W: '#d8d0e8', w: '#5a4a7a' },
    rows: [
      '................', '................', '................', '.....w...w......',
      '....wWw.wWw.....', '...wWWwwWWw..dd.', '....wwDDDww.dDDd', '.......DDDDdDRDD',
      '..d...DDDDDDDDD.', '..DDDDDDDDDDDWd.', '...DDDDDDDDDD...', '...DDdDDDDDD....',
      '...DD.DD..DD.DD.', '...DD.DD..DD.DD.', '...dd.dd..dd.dd.', '................',
    ],
  },
  reefclaw: {
    pal: { C: '#d8603a', c: '#9a3a24', Y: '#ffe040', k: '#1a0a0a', W: '#ffd0b0' },
    rows: [
      '................', '................', '................', '................',
      '................', '..cC........Cc..', '..CCc......cCC..', '...cC.YkkY.Cc...',
      '....cCCCCCCc....', '...CCCWCCWCCC...', '..cCCCCCCCCCCc..', '...cCCCCCCCCc...',
      '...c.c.c..c.c.c.', '..c..c.c..c.c..c', '................', '................',
    ],
  },
  ripnugget: {
    pal: { G: '#7cc04a', g: '#4f8a2f', R: '#e8303a', W: '#fff4d0', k: '#3a1a1a', P: '#d89a8a', p: '#a86a62', C: '#f2c84b', a: '#b8c0d0', X: '#e8eef8' },
    rows: [
      '......C.C.C.....', '......CCCCC.....', '..g...GGGGG...g.', '..gGGGGGGGGGGGg.',
      '...GGRkGGGRkGG..', '...GGGGGGGGGG.X.', '....GWkWkWkG..X.', '.....aaaaaa...X.',
      '....GaaaaaaG..g.', '..p...aa.aa.pp..', '.pPPPPPPPPPPPRPp', '..PPPPPPPPPPPPWk',
      '..PPPPPPPPPPPP..', '..PP.PP..PP.PP..', '..PP.PP..PP.PP..', '..pp.pp..pp.pp..',
    ],
  },
};

const NPC_LOOKS = {
  tsuto: { name: 'Tsuto', race: 'halfElf', cls: 'rogue', appearance: { skin: 1, hair: 0, hairStyle: 4, outfit: 5 }, weapon: 'none' },
  orik: { name: 'Orik', race: 'human', cls: 'fighter', appearance: { skin: 1, hair: 1, hairStyle: 0, outfit: 0, beard: true }, weapon: 'longsword', shield: true },
  lyrie: { name: 'Lyrie', race: 'human', cls: 'wizard', appearance: { skin: 0, hair: 3, hairStyle: 1, outfit: 4 }, weapon: 'dagger' },
  nualia: { name: 'Nualia', race: 'human', cls: 'cleric', appearance: { skin: 7, hair: 4, hairStyle: 1, outfit: 1 }, weapon: 'bastardSword', claw: true, shield: false },
  aldern: { name: 'Aldern', race: 'human', cls: 'rogue', appearance: { skin: 0, hair: 3, hairStyle: 0, outfit: 4 }, weapon: 'rapier' },
  ameiko: { name: 'Ameiko', race: 'human', cls: 'rogue', appearance: { skin: 1, hair: 0, hairStyle: 1, outfit: 1 }, weapon: 'none' },
  hemlock: { name: 'Hemlock', race: 'human', cls: 'fighter', appearance: { skin: 3, hair: 0, hairStyle: 5, outfit: 6, beard: true }, weapon: 'longsword', shield: true },
  zantus: { name: 'Zantus', race: 'human', cls: 'cleric', appearance: { skin: 0, hair: 1, hairStyle: 0, outfit: 0 }, weapon: 'none' },
  thug: { name: 'Thug', race: 'human', cls: 'barbarian', appearance: { skin: 2, hair: 0, hairStyle: 5, outfit: 6, beard: true }, weapon: 'mace' },
  enforcer: { name: 'Enforcer', race: 'human', cls: 'rogue', appearance: { skin: 1, hair: 0, hairStyle: 4, outfit: 1 }, weapon: 'dagger' },
  gm: { name: 'Game Master', race: 'human', cls: 'wizard', appearance: { skin: 2, hair: 4, hairStyle: 5, outfit: 6, beard: true }, weapon: 'staff' },
  shalelu: { name: 'Shalelu', race: 'elf', cls: 'ranger', appearance: { skin: 0, hair: 4, hairStyle: 4, outfit: 2 }, weapon: 'longbow' },
};

// ------------------------------------------------------------------ rendering & cache
const cache = new Map();

function gridToCanvas(grid, pal, frame = 0) {
  const g = frame ? bobGrid(grid) : grid;
  const cv = makeCanvas(18, 18);
  const ctx = cv.getContext('2d');
  // outline pass
  ctx.fillStyle = OUTLINE;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (g[y][x] === '.') continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx > 15 || ny > 15 || g[ny][nx] === '.') ctx.fillRect(nx + 1, ny + 1, 1, 1);
    }
  }
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const ch = g[y][x];
    if (ch === '.') continue;
    ctx.fillStyle = pal[ch] || '#ff00ff';
    ctx.fillRect(x + 1, y + 1, 1, 1);
  }
  return cv;
}

function bobGrid(grid) {
  const out = grid.map((r) => [...r]);
  for (let y = 0; y < 13; y++) out[y] = [...(grid[y + 1] || Array(16).fill('.'))];
  out[13] = [...grid[13]];
  return out;
}

export function makeCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined' && typeof document === 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

export function spriteFor(unit, frame = 0) {
  if (unit.c) return characterSprite(unit.c, frame);
  return monsterSprite(unit.def.sprite, frame);
}

export function characterSprite(c, frame = 0) {
  const ap = c.appearance || {};
  const key = `pc:${c.race}:${c.cls}:${c.kit}:${ap.skin}:${ap.hair}:${ap.hairStyle}:${ap.outfit}:${ap.beard}:${frame}`;
  if (!cache.has(key)) cache.set(key, gridToCanvas(characterGrid(c), characterPalette(c), frame));
  return cache.get(key);
}

export function npcSprite(name, frame = 0) {
  const key = `npc:${name}:${frame}`;
  if (!cache.has(key)) {
    const look = NPC_LOOKS[name];
    const fake = { ...look, kit: 0 };
    cache.set(key, gridToCanvas(characterGrid(fake, { weapon: look.weapon, shield: look.shield, claw: look.claw }), characterPalette(fake), frame));
  }
  return cache.get(key);
}

export function monsterSprite(name, frame = 0) {
  if (NPC_LOOKS[name]) return npcSprite(name, frame);
  const key = `mon:${name}:${frame}`;
  if (!cache.has(key)) {
    const m = MON[name] || MON.goblin;
    cache.set(key, gridToCanvas(m.rows.map((r) => [...r]), m.pal, frame));
  }
  return cache.get(key);
}

// ------------------------------------------------------------------ tiles
function hash(x, y, s = 0) { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

const THEMES = {
  town: { floor: '#a8a49a', floor2: '#7cba5a', wall: '#9a6a4a', wallTop: '#c0503a' },
  forest: { floor: '#6cae4c', floor2: '#b08a5a', wall: '#3a7a3a', wallTop: '#2a5a2a' },
  glass: { floor: '#9a6a42', floor2: '#86603c', wall: '#8a4a3a', wallTop: '#5a2a24' },
  dungeon: { floor: '#5a5868', floor2: '#4a4858', wall: '#3a3848', wallTop: '#2a2836' },
  fort: { floor: '#8a6a44', floor2: '#6cae4c', wall: '#5a7a3a', wallTop: '#3a5a24' },
};

export function drawTile(ctx, ch, x, y, theme, t = 0) {
  const T = THEMES[theme] || THEMES.town;
  const X = x * 16, Y = y * 16;
  const r = (i) => hash(x, y, i);
  const fill = (c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(X + a, Y + b, w, h); };
  const floor = (alt) => {
    const base = alt ? T.floor2 : T.floor;
    fill(base, 0, 0, 16, 16);
    if (theme === 'town' && !alt) { // cobbles
      ctx.fillStyle = shade(base, -0.15);
      for (let i = 0; i < 4; i++) { fill(shade(base, -0.15), 0, i * 4 + 3, 16, 1); fill(shade(base, -0.15), ((i * 5 + x * 3) % 8) + (i % 2 ? 8 : 0), i * 4, 1, 4); }
    } else if ((theme === 'glass' || theme === 'fort') && !alt) { // planks
      for (let i = 0; i < 4; i++) fill(shade(base, -0.2), 0, i * 4 + 3, 16, 1);
      fill(shade(base, -0.25), (x * 7) % 16, 0, 1, 3); fill(shade(base, -0.25), (x * 7 + 8) % 16, 8, 1, 3);
    } else if (theme === 'dungeon') {
      fill(shade(base, -0.2), 0, 7, 16, 1); fill(shade(base, -0.2), 7, 0, 1, 7); fill(shade(base, -0.2), 12, 8, 1, 8);
      if (r(1) < 0.3) fill(shade(base, 0.1), 3, 3, 2, 1);
    } else { // grass / dirt specks
      for (let i = 0; i < 6; i++) fill(shade(base, r(i + 10) < 0.5 ? -0.15 : 0.12), Math.floor(r(i) * 15), Math.floor(r(i + 5) * 15), 1, 1);
      if (alt === false && theme !== 'town' && r(20) < 0.12) { fill('#f0e060', 5, 6, 1, 1); fill('#ffffff', 10, 11, 1, 1); }
    }
  };
  switch (ch) {
    case ',': floor(true); break;
    case '#': {
      if (theme === 'forest' || theme === 'fort') { floor(theme === 'fort'); fill('#3a5a24', 1, 2, 14, 13); fill('#4f7a30', 2, 3, 12, 10); for (let i = 0; i < 5; i++) fill('#a0c050', 2 + Math.floor(r(i) * 11), 3 + Math.floor(r(i + 3) * 9), 1, 1); fill('#2a3a18', 0, 14, 16, 2); break; }
      fill(T.wall, 0, 0, 16, 16);
      ctx.fillStyle = shade(T.wall, -0.3);
      for (let i = 0; i < 4; i++) { fill(shade(T.wall, -0.3), 0, i * 4 + 3, 16, 1); fill(shade(T.wall, -0.3), (i % 2) * 4 + 2, i * 4, 1, 3); fill(shade(T.wall, -0.3), (i % 2) * 4 + 10, i * 4, 1, 3); }
      fill(shade(T.wall, 0.15), 0, 0, 16, 1);
      break;
    }
    case 'T': floor(theme === 'town' ? true : false); fill('#5a3a20', 7, 10, 3, 6); fill('#2f6a2a', 2, 1, 12, 10); fill('#3f8a34', 3, 2, 9, 7); fill('#5aa840', 5, 3, 3, 2); fill('#24501f', 2, 10, 12, 1); break;
    case '~': {
      fill('#3a7ad0', 0, 0, 16, 16);
      const o = Math.floor(t / 400 + x + y) % 4;
      fill('#7ab0f0', (o * 4) % 16, 4, 4, 1); fill('#7ab0f0', ((o * 4) + 8) % 16, 11, 4, 1); fill('#2a5aa8', 0, 15, 16, 1);
      break;
    }
    case 'b': fill('#3a7ad0', 0, 0, 16, 16); fill('#9a6a42', 1, 0, 14, 16); for (let i = 0; i < 4; i++) fill('#6a4a2a', 1, i * 4 + 3, 14, 1); fill('#d8c090', 0, 0, 1, 16); fill('#d8c090', 15, 0, 1, 16); break;
    case '%': floor(false); for (let i = 0; i < 7; i++) { fill('#2f6a2a', Math.floor(r(i) * 13), Math.floor(r(i + 9) * 13), 3, 2); fill('#c8e0a0', Math.floor(r(i + 4) * 15), Math.floor(r(i + 2) * 15), 1, 1); } break;
    case 'r': floor(false); for (let i = 0; i < 5; i++) { const a = Math.floor(r(i) * 12), b = Math.floor(r(i + 7) * 12); fill('#7a7888', a, b, 4, 3); fill('#9a98a8', a, b, 3, 1); } break;
    case 'c': floor(false); fill('#7a4a24', 2, 3, 12, 12); fill('#a8703a', 3, 4, 10, 10); fill('#7a4a24', 3, 8, 10, 1); fill('#7a4a24', 7, 4, 1, 10); break;
    case 't': floor(false); fill('#6a4020', 1, 5, 14, 6); fill('#9a6a3a', 1, 4, 14, 5); fill('#6a4020', 2, 11, 2, 4); fill('#6a4020', 12, 11, 2, 4); if (r(3) < 0.5) { fill('#e8e8f0', 4, 5, 3, 2); } else fill('#c04040', 9, 5, 2, 2); break;
    case 'S': floor(false); fill('#e8e0d0', 1, 6, 14, 10); fill('#c03a3a', 0, 2, 16, 5); for (let i = 0; i < 4; i++) fill('#f0f0f0', i * 4 + 1, 2, 2, 5); fill('#8a5a32', 2, 11, 12, 2); break;
    case 'f': {
      fill('#5a2a24', 0, 0, 16, 16); fill('#8a4a3a', 1, 1, 14, 14); fill('#2a1010', 4, 6, 8, 8);
      const fl = Math.floor(t / 150) % 2;
      fill('#ff8a2a', 5, 9 - fl, 6, 5 + fl); fill('#ffe060', 6, 11, 4, 3);
      break;
    }
    case 'g': floor(false); fill('#8a8898', 4, 3, 8, 11); fill('#aaa8b8', 5, 4, 6, 2); fill('#5a5868', 6, 7, 4, 1); fill('#5a5868', 7, 6, 2, 3); fill('#4a7a3a', 3, 14, 10, 2); break;
    case 'w': {
      fill('#3a3848', 0, 0, 16, 16);
      const p = Math.sin(t / 300 + x + y) * 0.15;
      fill(shade('#c02040', p), 1, 1, 14, 14); fill('#ff6080', 3 + ((x + y) % 3) * 3, 4, 2, 2); fill('#ff90a8', 8, 9 - ((x * y) % 3), 2, 1);
      break;
    }
    case 'A': floor(false); fill('#3a2a3a', 2, 4, 12, 11); fill('#6a2a4a', 3, 5, 10, 3); fill('#c02040', 6, 1, 4, 4); fill('#ffd040', 7, 2, 2, 2); break;
    default: floor(false);
  }
}

// ------------------------------------------------------------------ story scenes (160 x 90)
export function drawScene(ctx, key, t = 0) {
  const W = 160, H = 90;
  const fill = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const sky = (top, bottom) => { for (let y = 0; y < H; y++) { const f = y / H; fill(mix(top, bottom, f), 0, y, W, 1); } };
  const stars = (n) => { for (let i = 0; i < n; i++) fill(i % 3 ? '#ffffff' : '#ffe9a0', Math.floor(hash(i, 1) * W), Math.floor(hash(i, 2) * 40), 1, 1); };
  const house = (x, y, w, h, wall, roof) => {
    fill(wall, x, y, w, h); fill(roof, x - 2, y - 6, w + 4, 6); fill(shade(roof, -0.25), x - 2, y - 1, w + 4, 1);
    fill('#ffe08a', x + 3, y + 4, 3, 3); if (w > 14) fill('#ffe08a', x + w - 6, y + 4, 3, 3); fill('#5a3a20', x + Math.floor(w / 2) - 2, y + h - 7, 4, 7);
  };
  const tree = (x, y, s = 1, c = '#3f8a34') => { fill('#5a3a20', x + 3 * s, y + 8 * s, 2 * s, 5 * s); fill(c, x, y, 8 * s, 9 * s); fill(shade(c, 0.2), x + s, y + s, 4 * s, 3 * s); };
  const sea = (y) => { fill('#3a7ad0', 0, y, W, H - y); for (let i = 0; i < 12; i++) fill('#7ab0f0', (Math.floor(hash(i, 4) * W) + Math.floor(t / 90)) % W, y + 2 + Math.floor(hash(i, 5) * (H - y - 3)), 5, 1); };
  const ground = (c, y) => { fill(c, 0, y, W, H - y); for (let i = 0; i < 40; i++) fill(shade(c, hash(i, 7) < 0.5 ? -0.15 : 0.12), Math.floor(hash(i, 8) * W), y + Math.floor(hash(i, 9) * (H - y)), 2, 1); };
  const sihedron = (cx, cy, r, color) => {
    ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 0; i <= 7; i++) { const a = -Math.PI / 2 + (i * 3 * 2 * Math.PI) / 7; const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.stroke();
  };
  const flame = (x, y) => { const f = Math.floor(t / 120 + x) % 3; fill('#ff6a2a', x, y - 4 - f, 3, 5 + f); fill('#ffe060', x + 1, y - 2, 1, 3); };

  switch (key) {
    case 'title': {
      sky('#1a1030', '#4a2050'); stars(40);
      fill('#2a1838', 0, 62, W, 28);
      for (let i = 0; i < 9; i++) fill('#20122c', i * 20 - 4, 52 + (i % 3) * 4, 16, 40);
      fill('#14101c', 104, 30, 12, 34); fill('#14101c', 101, 26, 18, 6); fill('#ffd060', 108, 28, 4, 3);
      sihedron(52, 38, 22, '#f2c84b'); sihedron(52, 38, 20, '#c0503a');
      break;
    }
    case 'sandpoint': case 'festival': {
      sky('#7ec4f0', '#d8eef8'); fill('#ffffff', 20, 12, 18, 4); fill('#ffffff', 26, 9, 10, 4); fill('#ffffff', 110, 18, 22, 4);
      sea(58); fill('#c8b080', 0, 54, 100, 6);
      fill('#8a8a9a', 128, 20, 10, 38); fill('#6a6a7a', 126, 16, 14, 5); fill('#5a5a6a', 128, 30, 10, 2); // Old Light ruin
      ground('#6cae4c', 60); fill('#a8a49a', 0, 74, W, 8);
      house(6, 40, 18, 20, '#e8d8b0', '#c0503a'); house(30, 44, 14, 16, '#d8c8a0', '#3a6ad0'); house(84, 42, 16, 18, '#e8d8b0', '#7a4a2a');
      fill('#e8e0d0', 52, 26, 26, 34); fill('#8a7a6a', 48, 20, 34, 6); fill('#e8e0d0', 61, 8, 8, 18); fill('#f2c84b', 63, 4, 4, 4); fill('#5a3a20', 61, 48, 8, 12); fill('#7ab0f0', 56, 32, 4, 6); fill('#7ab0f0', 70, 32, 4, 6);
      if (key === 'festival') {
        const cols = ['#e8303a', '#f2c84b', '#3a6ad0', '#3a9a4a'];
        for (let i = 0; i < 26; i++) fill(cols[i % 4], 4 + i * 6, 36 + Math.floor(Math.sin(i * 0.8) * 2), 3, 3);
        for (let i = 0; i < 30; i++) { const x = Math.floor(hash(i, 12) * 150) + 4, y = 66 + Math.floor(hash(i, 13) * 18); fill(cols[i % 4], x, y, 2, 3); fill('#f0c090', x, y - 2, 2, 2); }
      }
      break;
    }
    case 'night': case 'raid': {
      sky('#0e0c24', '#3a2a50'); stars(30); sea(60); ground('#2a4a30', 62); fill('#5a5868', 0, 76, W, 6);
      house(8, 42, 18, 20, '#6a5a50', '#5a2a24'); house(34, 46, 14, 16, '#5a4a40', '#2a3a6a'); house(110, 44, 18, 18, '#6a5a50', '#4a2a1a');
      fill('#8a8a9a', 64, 26, 24, 36); fill('#6a6a7a', 72, 10, 8, 16);
      if (key === 'raid') { flame(12, 40); flame(18, 38); flame(40, 44); flame(116, 42); flame(122, 40); for (let i = 0; i < 6; i++) { const x = 20 + i * 22; fill('#7cc04a', x, 72, 4, 4); fill('#e8303a', x + 1, 73, 1, 1); } }
      break;
    }
    case 'inn': {
      fill('#5a3a24', 0, 0, W, H); for (let i = 0; i < 10; i++) fill('#4a2e1c', i * 16, 0, 1, 60);
      fill('#8a6a44', 0, 60, W, 30); for (let i = 0; i < 6; i++) fill('#6a4a2a', 0, 62 + i * 5, W, 1);
      fill('#6a6a7a', 120, 26, 30, 34); fill('#2a1a10', 126, 36, 18, 24); flame(130, 58); flame(136, 58);
      fill('#c0503a', 40, 12, 40, 14); fill('#f2c84b', 44, 15, 32, 8); fill('#c0503a', 52, 17, 16, 4); // dragon sign
      for (const x of [16, 70]) { fill('#7a4a24', x, 60, 30, 5); fill('#5a3a1a', x + 2, 65, 3, 10); fill('#5a3a1a', x + 25, 65, 3, 10); fill('#e8e8f0', x + 6, 57, 4, 3); fill('#c04040', x + 18, 57, 3, 3); }
      break;
    }
    case 'cathedral': case 'boneyard': {
      sky(key === 'boneyard' ? '#2a2440' : '#9ed0f0', key === 'boneyard' ? '#6a5a70' : '#e0f0f8');
      ground(key === 'boneyard' ? '#3a5a34' : '#6cae4c', 60);
      fill('#e8e0d0', 40, 20, 80, 42); fill('#8a7a6a', 34, 14, 92, 7); fill('#e8e0d0', 72, 0, 16, 20); fill('#f2c84b', 77, 0, 6, 4);
      fill('#5a3a20', 74, 44, 12, 18); for (let i = 0; i < 5; i++) fill('#7ab0f0', 46 + i * 15, 28, 5, 9);
      if (key === 'boneyard') for (let i = 0; i < 7; i++) { fill('#8a8898', 6 + i * 22, 66 + (i % 2) * 8, 7, 10); fill('#aaa8b8', 7 + i * 22, 67 + (i % 2) * 8, 5, 2); }
      break;
    }
    case 'glassworks': {
      sky('#a8b8c8', '#d8dce0'); ground('#7a7a70', 62); sea(80);
      fill('#8a4a3a', 20, 26, 110, 38); fill('#5a2a24', 16, 20, 118, 7); fill('#5a2a24', 100, 0, 12, 22); fill('#5a2a24', 40, 6, 10, 16);
      for (let i = 0; i < 6; i++) fill('#3a2a2a', 28 + i * 17, 36, 8, 10); fill('#3a2a20', 66, 46, 14, 18);
      fill('#c8c8d0', 102, 0, 2, 2);
      break;
    }
    case 'catacombs': case 'runewell': {
      fill('#1a1822', 0, 0, W, H);
      for (let y = 0; y < 60; y += 8) for (let x = (y / 8) % 2 ? 0 : 8; x < W; x += 16) { fill('#2e2c3a', x, y, 15, 7); }
      fill('#24222e', 0, 60, W, 30);
      sihedron(80, 30, 16, key === 'runewell' ? '#ff4060' : '#8a3048');
      if (key === 'runewell') { fill('#3a3848', 50, 62, 60, 14); const p = Math.floor(t / 200) % 2; fill('#c02040', 54, 64, 52, 8); fill('#ff6080', 60 + p * 10, 66, 8, 2); fill('#ff90a8', 90 - p * 8, 68, 6, 1); }
      for (let i = 0; i < 4; i++) flame(10 + i * 46, 24);
      break;
    }
    case 'forest': case 'nettlewood': {
      const dark = key === 'nettlewood';
      sky(dark ? '#4a6a5a' : '#8ad0f0', dark ? '#a0b8a0' : '#d8f0e0'); ground(dark ? '#3a6a34' : '#6cae4c', 58);
      for (let i = 0; i < 12; i++) tree(-6 + i * 15, 30 + (i % 3) * 6, 2, dark ? '#2a5a2a' : '#3f8a34');
      if (dark) for (let i = 0; i < 30; i++) fill('#1f4a1f', Math.floor(hash(i, 30) * W), 66 + Math.floor(hash(i, 31) * 20), 6, 3);
      break;
    }
    case 'thistletop': {
      sky('#f0a070', '#f8d8b0'); sea(50);
      fill('#5a4a3a', 0, 46, 40, 44); fill('#4a7a3a', 0, 44, 40, 4);
      fill('#5a4a3a', 96, 38, 64, 52); fill('#4a7a3a', 96, 36, 64, 4);
      for (let i = 0; i < 8; i++) fill('#3a5a24', 102 + i * 7, 20 - (i % 2) * 4, 6, 18);
      fill('#6a4a2a', 120, 4, 8, 16); fill('#c02040', 128, 4, 8, 5);
      for (let x = 40; x < 96; x++) fill('#9a6a42', x, 44 + Math.floor(Math.sin((x - 40) / 56 * Math.PI) * 6), 1, 2);
      break;
    }
    case 'fort': {
      fill('#4a3a2a', 0, 0, W, H); for (let i = 0; i < 12; i++) fill('#3a2a1a', i * 14, 0, 2, 60);
      fill('#6a4a2a', 0, 60, W, 30); fill('#8a6a3a', 60, 28, 40, 34); fill('#c02040', 64, 20, 32, 8); fill('#f2c84b', 76, 22, 8, 4);
      for (let i = 0; i < 3; i++) { flame(14 + i * 60, 40); fill('#3a3a3a', 13 + i * 60, 40, 5, 4); }
      break;
    }
    case 'shrine': {
      fill('#140c18', 0, 0, W, H); for (let i = 0; i < 20; i++) fill('#2a1426', Math.floor(hash(i, 40) * W), Math.floor(hash(i, 41) * 60), 10, 6);
      fill('#2a1a2a', 0, 62, W, 28); fill('#3a2a3a', 56, 40, 48, 24); fill('#6a2a4a', 60, 44, 40, 6);
      sihedron(80, 24, 14, '#a02040');
      flame(50, 40); flame(108, 40);
      break;
    }
    case 'victory': {
      sky('#f8c070', '#fff0d0'); sea(56); ground('#6cae4c', 64);
      fill('#e8e0d0', 64, 30, 32, 34); fill('#e8e0d0', 74, 14, 12, 16); fill('#f2c84b', 77, 10, 6, 4);
      for (let i = 0; i < 20; i++) fill(['#e8303a', '#f2c84b', '#3a6ad0'][i % 3], Math.floor(hash(i, 50) * W), Math.floor(hash(i, 51) * 40) + (Math.floor(t / 100) + i * 3) % 30, 2, 2);
      break;
    }
    default: sky('#6aa0d0', '#d0e8f8'); ground('#6cae4c', 60);
  }
}

function mix(a, b, f) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) * (1 - f) + ((pb >> 16) & 255) * f);
  const g = Math.round(((pa >> 8) & 255) * (1 - f) + ((pb >> 8) & 255) * f);
  const bl = Math.round((pa & 255) * (1 - f) + (pb & 255) * f);
  return `#${[r, g, bl].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
