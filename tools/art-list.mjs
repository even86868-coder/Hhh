// Every painted image the game can show, with the prompt used to paint it.
// Keys match js/art.js: hero:<race>:<class>:<m|f>, pc:<companion>, npc:<name>, mon:<sprite>, scene:<name>.
import { RACES, CLASSES } from '../js/rules.js';

export const STYLE = 'Painted high-fantasy illustration in the style of modern tabletop role-playing game rulebook art: rich painterly brushwork, '
  + 'confident linework, dramatic warm rim lighting, saturated but natural colors, detailed costume and gear, heroic and characterful. '
  + 'No text, no letters, no logo, no watermark, no frame or border.';
const PORTRAIT = 'Head-and-shoulders portrait, face centered in the frame and fully visible, looking slightly toward the viewer, '
  + 'soft dark atmospheric background with a gentle vignette.';
const BEAST = 'Close-up of the creature\'s head and upper body, centered in the frame, menacing, soft dark atmospheric background with a gentle vignette.';
const SCENE = 'Wide establishing shot of a location, no people in the foreground, cinematic composition, depth and atmosphere.';

const RACE_LOOK = {
  human: 'human',
  elf: 'elf with long pointed ears and fine, ageless features',
  dwarf: 'stout dwarf with a broad face',
  halfling: 'halfling, small and nimble with a youthful round face and curly hair',
  gnome: 'gnome with a small wiry frame, big expressive eyes and vividly colored hair',
  halfOrc: 'half-orc with grey-green skin, a strong jaw and small tusks',
  halfElf: 'half-elf with softly pointed ears',
};
const CLASS_LOOK = {
  fighter: 'fighter in polished steel armor with a longsword and a battered shield',
  barbarian: 'barbarian with furs, leather straps, war paint and a greataxe',
  paladin: 'paladin in shining plate armor with a holy symbol and a radiant longsword',
  ranger: 'ranger in a green hooded cloak and leather armor with a longbow and quiver',
  rogue: 'rogue in dark leather armor with a short hood, daggers on the belt and a sly look',
  cleric: 'cleric in chainmail and a tabard with a glowing sun holy symbol and a mace',
  wizard: 'wizard in embroidered robes with a staff, a spellbook and faint arcane light around the hands',
  sorcerer: 'sorcerer in elegant traveling clothes with crackling magical energy swirling around one hand',
};

export const COMPANION_LOOK = {
  Brannoc: 'Brannoc, a gruff, broad-shouldered human fighter in his forties, short brown hair, thick beard, scarred, dented steel breastplate and a heavy shield, weary but loyal eyes',
  Tamsin: 'Tamsin, a warm, determined young half-elf woman, cleric of the sun goddess, golden-blonde hair in a braid, chainmail under a white-and-gold tabard, a sun-shaped amulet',
  Quillan: 'Quillan, an excitable young elf man, wizard and scholar, silver-white hair, round spectacles, deep purple robes covered in rune embroidery, ink-stained fingers holding a notebook',
  Pip: 'Pip, a cheerful halfling rogue, messy red curly hair, freckles, a mischievous grin, patched dark leather jacket with many pockets, a dagger twirling in his fingers',
};
export const NPC_LOOK = {
  gm: 'a wise old storyteller wizard with a long white beard and kind, twinkling eyes, deep blue hooded robe, holding a candle over an open book, the game master of the tale',
  ameiko: 'Ameiko, a confident woman in her late twenties with East Asian features, long black hair tied back, red silk jacket, innkeeper and former adventurer, a wry smile, a tavern behind her',
  zantus: 'Father Zantus, a kindly middle-aged human priest of the sun goddess with receding brown hair, gentle smile, white and gold vestments',
  hemlock: 'Sheriff Hemlock, a stern, dark-skinned human lawman in his forties with a shaved head and short beard, studded leather armor and a sheriff\'s badge, serious eyes',
  aldern: 'Aldern Foxglove, a handsome, nervous young nobleman with neatly combed blond hair, fine violet coat with lace collar, a rapier at his hip, an eager smile',
  shalelu: 'Shalelu, a cool and serious elven ranger woman with long silver-white hair, green hooded cloak, a longbow over her shoulder',
  tsuto: 'Tsuto, a bitter, lean young half-elf man with long black hair in a topknot, monk-like dark orange clothes, fists wrapped, resentful eyes',
  orik: 'Orik, a cocky, muscular human mercenary with brown hair and a short beard, banded armor, a longsword and a heavy shield',
  lyrie: 'Lyrie, an arrogant young human woman wizard with blonde hair, violet robes, a dagger and scrolls, a sneer',
  nualia: 'Nualia, a beautiful but terrifying woman with pale skin and long white hair, scarred, one arm a monstrous demonic claw, dark armor, a bastard sword, burning eyes, a fallen angel',
  thug: 'a rough, bald Varisian street thug with a beard, dark vest, scars and a heavy mace',
  enforcer: 'a sly Varisian enforcer with long dark hair in a ponytail, red scarf and a curved dagger',
};
export const MONSTER_LOOK = {
  goblin: 'a goblin from the classic tabletop fantasy setting: small, green, huge head, enormous wide mouth full of jagged teeth, red eyes, ragged leather, a rusty dogslicer blade, cackling wildly',
  goblinArcher: 'a goblin archer: small, green, oversized head, wide toothy grin, red eyes, a crude shortbow and a quiver of crooked arrows',
  warchanter: 'a goblin warchanter: small, green, oversized head, screaming a war song, bone necklaces, painted face, a crude drum and a dogslicer',
  goblinDog: 'a goblin dog: a mangy, hairless, rat-like dog with blotchy pink skin, huge ears and snapping teeth',
  boar: 'a huge, angry wild boar with long curved tusks, bristly brown fur and wild eyes, in a forest',
  sinspawn: 'a sinspawn: a gaunt, grey-skinned humanoid abomination with long clawed arms, its jaw split into a fanged, tooth-lined maw, glowing red sigils, born from a pool of wrath',
  quasit: 'Erylium, a tiny red quasit demon with bat wings, horns, a toad-like grin and a barbed tail',
  bugbear: 'Bruthazmus, a hulking, hairy bugbear with a bear-like face, yellow eyes, crude armor, a longbow and a morningstar, cruel smile',
  yethHound: 'a yeth hound: a gaunt, hairless black hound with bat-like wings and glowing red eyes, a creature of nightmares',
  reefclaw: 'a reefclaw: a lobster-like sea creature with a long eel-like tail and huge spiked claws, dripping with seawater in a sea cave',
  ripnugget: 'Ripnugget, a goblin chieftain wearing an oversized iron crown and too-big armor, on a throne of junk, small, green, giant head, toothy sneer, holding a scepter',
};
export const SCENE_LOOK = {
  title: 'A coastal fantasy town on sea cliffs at dusk, a seven-pointed star-shaped rune glowing faintly in the clouds above, ancient ruins on a headland, epic and mysterious',
  sandpoint: 'Sandpoint, a small, cheerful fantasy fishing town on sea cliffs: timber-and-stone houses with red roofs, a new stone cathedral, a lighthouse ruin on the cliff, fishing boats, bright morning sun',
  festival: 'A fantasy town square decorated for a spring festival: bunting and ribbons, market stalls, swallowtail butterfly banners, a new cathedral, sunny and joyful',
  night: 'A small fantasy coastal town at night: lantern-lit windows, moonlight on the sea, quiet cobbled streets',
  raid: 'A fantasy town square at night under attack: fires burning, smoke, torchlight, overturned festival stalls, chaos',
  inn: 'The interior of a cozy fantasy tavern called the Rusty Dragon: warm firelight, wooden beams, a carved dragon above the bar, tankards, a lively evening',
  cathedral: 'The interior of a newly built stone cathedral of the sun goddess: tall windows, morning light streaming in, white and gold banners',
  boneyard: 'A hillside graveyard at night beside a cathedral: crooked headstones, mist, a freshly dug-up grave, moonlight',
  glassworks: 'The interior of a dark glass factory: a roaring orange furnace, glassblowing tools, molten glass, deep shadows, sinister',
  catacombs: 'Ancient stone catacombs beneath a town: carved arches, old bones in niches, flickering torchlight, carvings of a seven-pointed star',
  runewell: 'An ancient round underground chamber with a well brimming with glowing red liquid, carvings of wrath, crimson light, ominous',
  forest: 'A sunlit old forest of tall trees with a winding trail, dappled light, ferns, a fantasy wilderness',
  nettlewood: 'A dense, gloomy thorny forest of brambles and nettles, twisted trees, a narrow goblin trail, overcast light',
  thistletop: 'A ramshackle goblin fortress made of bramble walls and timber on a small island at the top of a sea cliff, a rickety rope bridge, stormy sea',
  fort: 'Inside a crude goblin fortress: rough timber walls, thorny brambles, junk and trophies, torches, a muddy courtyard',
  shrine: 'An ancient underground temple of a forgotten empire: a dark altar, a seven-pointed star symbol, demonic statues, purple and red light',
  victory: 'A golden sunrise over a coastal fantasy town on sea cliffs, triumphant and hopeful, banners in the wind',
};

export function collectArt() {
  const out = [];
  const add = (key, kind, prompt, size = '1024x1024') => out.push({ key, kind, size, prompt: `${STYLE} ${prompt}` });
  for (const race of Object.keys(RACES)) for (const cls of Object.keys(CLASSES)) for (const body of ['m', 'f']) {
    add(`hero:${race}:${cls}:${body}`, 'hero', `${PORTRAIT} A ${body === 'm' ? 'male' : 'female'} ${RACE_LOOK[race]} ${CLASS_LOOK[cls]}, a young adventurer.`);
  }
  for (const [name, look] of Object.entries(COMPANION_LOOK)) add(`pc:${name}`, 'companion', `${PORTRAIT} ${look}.`);
  for (const [name, look] of Object.entries(NPC_LOOK)) add(`npc:${name}`, 'npc', `${PORTRAIT} ${look}.`);
  for (const [name, look] of Object.entries(MONSTER_LOOK)) add(`mon:${name}`, 'monster', `${BEAST} ${look}.`);
  for (const [name, look] of Object.entries(SCENE_LOOK)) add(`scene:${name}`, 'scene', `${SCENE} ${look}.`, '1536x1024');
  return out;
}

export const artFile = (key) => `${key.replace(/:/g, '_')}.webp`;

if (import.meta.url === `file://${process.argv[1]}`) {
  const list = collectArt();
  const by = {};
  for (const a of list) by[a.kind] = (by[a.kind] || 0) + 1;
  console.log(`${list.length} images:`, JSON.stringify(by));
}
