// DOM user interface: title, character creation, story, combat, sheets.
import { RACES, CLASSES, FEATS, SKILLS, ABILS, ABIL_NAMES, POINT_BUY, POINT_COST, TRAITS, ROLE_NAMES, COMPANIONS,
  createCharacter, derive, finalAbilities, trainedSkillCount, featsGainedAt, featAllowed, levelUp, maxHp, companionRolesFor, MAX_LEVEL } from './rules.js';
import { mod, sign, d } from './dice.js';
import { characterSprite, monsterSprite, npcSprite, drawScene, SKIN, HAIR, OUTFIT, HAIR_STYLES, makeCanvas } from './sprites.js';
import { G, newGame, save, load, hasSave, deleteSave, snapshot, restore, fillText, rollCheck, previewCheck, checkLabel, applyEffects, restParty, choicesFor, player, companions } from './game.js';
import { STORY, START } from './story.js';
import { buildEncounter } from './maps.js';
import { Combat } from './combat.js';
import { aiTurn } from './ai.js';
import { CombatView } from './render.js';
import { SPELLS } from './spells.js';
import { sfx, playMusic, stopMusic, settings as audioSettings, unlockAudio } from './audio.js';
import { PERSONALITIES, DEFAULT_PERSONALITY } from './dialogue.js';
import { speak, stopVoices, voiceSettings, VOICE_PRESETS, voiceAvailable, castList, setCast, listVoices, voicePackSize } from './voice.js';
import { gmSettings, sceneIntro, stageDirection, explainCheck, explainResult, GMCommentator } from './gm.js';
import { aiSettings, AI_MODELS, getApiKey, setApiKey, testConnection, aiReady } from './aibanter.js';
import { talkSettings, sceneLines, campLines, aiSceneLines, speakerOf, Barker } from './talk.js';

// ------------------------------------------------------------------ helpers
const $ = (s, root = document) => root.querySelector(s);
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid === null || kid === undefined || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}
const btn = (label, onclick, cls = '', disabled = false) => h('button', { class: `btn ${cls}`, onclick: (e) => { if (disabled) return; sfx('click'); onclick(e); }, disabled }, label);
const app = () => $('#app');
const prefs = { speed: 1, typewriter: true };
try {
  Object.assign(prefs, JSON.parse(localStorage.getItem('runelords.prefs') || '{}'));
  Object.assign(audioSettings, prefs.audio || {});
  Object.assign(voiceSettings, prefs.voice || {});
  Object.assign(talkSettings, prefs.talk || {});
  Object.assign(aiSettings, prefs.ai || {});
} catch (e) { /* ignore */ }
function savePrefs() {
  try { localStorage.setItem('runelords.prefs', JSON.stringify({ ...prefs, audio: audioSettings, voice: voiceSettings, talk: talkSettings, ai: { enabled: aiSettings.enabled, model: aiSettings.model } })); } catch (e) { /* ignore */ }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
gmSettings.mode = voiceSettings.gm || 'full';
const GM_SPEAKER = { kind: 'gm', name: 'Game Master' };
const autoplay = () => !!G.state?.autoplay;

function spriteCanvas(src, scale = 4, cls = 'sprite') {
  const c = h('canvas', { class: cls, width: 18 * scale, height: 18 * scale });
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, 18 * scale, 18 * scale);
  return c;
}
const portraitOf = (c, scale = 3) => spriteCanvas(characterSprite(c), scale, 'portrait');
const unitPortrait = (u, scale = 2) => spriteCanvas(u.c ? characterSprite(u.c) : monsterSprite(u.def.sprite), scale, 'portrait');

let sceneRAF = null;
function sceneCanvas(key) {
  const c = h('canvas', { class: 'scene', width: 160, height: 90 });
  const ctx = c.getContext('2d');
  cancelAnimationFrame(sceneRAF);
  const loop = (t) => { if (!c.isConnected && sceneRAF) return; drawScene(ctx, key, t); sceneRAF = requestAnimationFrame(loop); };
  drawScene(ctx, key, 0);
  sceneRAF = requestAnimationFrame(loop);
  return c;
}

let lastScreen = null;
function setScreen(...kids) {
  const a = app();
  const key = kids[0]?.className || '';
  const same = key === lastScreen;
  const y = window.scrollY;
  a.innerHTML = '';
  a.append(...kids);
  if (same) { kids[0].classList.add('noanim'); window.scrollTo(0, y); } else { window.scrollTo(0, 0); stopVoices(); }
  lastScreen = key;
  keyHandler = null;
}

// Keyboard controls (desktop): number keys pick choices/actions, Enter confirms, Esc cancels.
let keyHandler = null;
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.repeat) return;
  const m = document.querySelector('.modal:last-of-type');
  if (m) {
    if (e.key === 'Escape') m.querySelector('.x')?.click();
    else if (e.key === 'Enter') { e.preventDefault(); (m.querySelector('.modal-actions .btn.primary') || m.querySelector('.modal-actions .btn:last-child'))?.click(); }
    return;
  }
  if (keyHandler) keyHandler(e);
});
const digit = (e) => (/^[1-9]$/.test(e.key) ? +e.key - 1 : -1);

export function toast(msg) {
  const t = h('div', { class: 'toast' }, msg);
  document.body.append(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2200);
}

function modal(title, body, actions = [], { wide = false, onClose = null } = {}) {
  const wrap = h('div', { class: 'modal' });
  const close = () => { wrap.remove(); if (onClose) onClose(); };
  const panel = h('div', { class: `panel modal-panel ${wide ? 'wide' : ''}` },
    h('div', { class: 'modal-head' }, h('h2', {}, title), onClose !== false ? h('button', { class: 'x', onclick: close, 'aria-label': 'Close' }, '✕') : null),
    h('div', { class: 'modal-body' }, body),
    actions.length ? h('div', { class: 'modal-actions' }, actions.map((a) => btn(a.label, () => { if (!a.keep) wrap.remove(); a.onClick?.(); }, a.cls || ''))) : null);
  wrap.append(panel);
  wrap.addEventListener('click', (e) => { if (e.target === wrap && onClose !== false) close(); });
  document.body.append(wrap);
  return { close, el: wrap };
}

// ------------------------------------------------------------------ title
export function showTitle() {
  playMusic('town');
  const cont = hasSave();
  setScreen(h('div', { class: 'screen title-screen' },
    sceneCanvas('title'),
    h('div', { class: 'logo' },
      h('div', { class: 'logo-small' }, 'A Pathfinder Pixel Adventure'),
      h('h1', {}, 'Rise of the', h('br'), h('span', {}, 'Runelords')),
      h('div', { class: 'logo-sub' }, 'Chapter 1: Burnt Offerings')),
    h('div', { class: 'menu' },
      cont ? btn('Continue', () => { unlockAudio(); if (load()) resumeGame(); }, 'primary') : null,
      btn('New Game', () => { unlockAudio(); if (cont) confirmNew(); else showCreator(); }, cont ? '' : 'primary'),
      btn('🤖 Watch AI Play', () => { unlockAudio(); if (cont) confirmNew(startWatchMode); else startWatchMode(); }),
      btn('How to Play', showHelp),
      btn('Settings', showSettings),
      btn('About', showAbout)),
    h('div', { class: 'fineprint' }, 'Unofficial fan game. Uses the Pathfinder RPG 1e rules.')));
}

function confirmNew(then = showCreator) {
  modal('Start over?', h('p', {}, 'Starting a new game will overwrite your current save.'), [
    { label: 'Cancel' },
    { label: 'New Game', cls: 'danger', onClick: () => { deleteSave(); then(); } },
  ]);
}

function showHelp() {
  modal('How to Play', h('div', { class: 'help' },
    h('h3', {}, 'Your party'), h('p', {}, 'You create one hero. Three companions, controlled by the game, fill the other roles: a defender, a healer, an arcanist and a skirmisher.'),
    h('h3', {}, 'The story'), h('p', {}, 'Choices change the story. Some choices call for a skill check: a d20 plus your skill bonus against a Difficulty Class (DC). "Party" checks use whoever is best at it.'),
    h('h3', {}, 'Combat (Pathfinder rules)'),
    h('ul', {},
      h('li', {}, 'Initiative: d20 + Dex decides turn order. Before your first turn you are flat-footed.'),
      h('li', {}, 'Each turn: one Standard action (attack, cast), one Move action (move your speed), one Swift action, plus free actions. You can swap a standard action for a second move.'),
      h('li', {}, 'Full-round actions (Full Attack, Charge) use both. A 5-foot Step can be taken only if you don\'t otherwise move.'),
      h('li', {}, 'Attack: d20 + attack bonus vs AC. A natural 20 always hits, a natural 1 always misses. A roll in your weapon\'s threat range must be confirmed to score a critical hit.'),
      h('li', {}, 'Moving out of a threatened square, shooting, casting or drinking a potion next to an enemy provokes an attack of opportunity. Spellcasters cast defensively (concentration check).'),
      h('li', {}, 'Flanking: you and an ally on opposite sides of a foe each get +2 to hit, and rogues add sneak attack.'),
      h('li', {}, 'At 0 HP you are disabled; below 0 you are dying and lose 1 HP each round until stabilized. At negative HP equal to your Constitution, you die.'),
      h('li', {}, 'Diagonal movement costs 5 ft, then 10 ft, alternating. Brambles and rubble cost double.')),
    h('h3', {}, 'Controls'), h('p', {}, 'Tap an action, then tap a highlighted square or target. Tap any creature to inspect it. The log shows every roll.'),
    h('h3', {}, 'Watch mode'), h('p', {}, 'Tap the 🤖 button any time to let the AI play for you: it makes story choices in character and fights your battles. Tap it again to take back control. "Watch AI Play" on the title screen starts a game with a random AI hero.'),
    h('h3', {}, 'Voices & banter'), h('p', {}, 'Your party talks: in story scenes, at camp and during battle. Each character has their own voice using your device\'s built-in speech. Turn voices, the narrator and live AI banter on or off in Settings.')),
  [{ label: 'Got it!' }], { wide: true });
}

function showAbout() {
  modal('About', h('div', { class: 'help' },
    h('p', {}, 'A cute pixel-art retelling of the first part of the Rise of the Runelords Adventure Path, played with Pathfinder 1st Edition combat rules.'),
    h('p', {}, 'This is a non-commercial fan project. Pathfinder and Rise of the Runelords are trademarks of Paizo Inc. This game is not published, endorsed or specifically approved by Paizo. For more information on Paizo\'s Community Use Policy, visit paizo.com/communityuse.'),
    h('p', {}, 'All art and music are generated procedurally in your browser.')), [{ label: 'Close' }]);
}

function showSettings() {
  const body = h('div', { class: 'settings' });
  const render = () => {
    body.innerHTML = '';
    body.append(
      h('label', { class: 'row' }, 'Music', btn(audioSettings.music ? 'On' : 'Off', () => { audioSettings.music = !audioSettings.music; savePrefs(); if (!audioSettings.music) stopMusic(); else playMusic('town'); render(); })),
      h('label', { class: 'row' }, 'Sound effects', btn(audioSettings.sfx ? 'On' : 'Off', () => { audioSettings.sfx = !audioSettings.sfx; savePrefs(); render(); })),
      h('label', { class: 'row' }, 'Battle speed', btn(`${prefs.speed}x`, () => { prefs.speed = prefs.speed >= 3 ? 1 : prefs.speed + 1; savePrefs(); render(); })),
      h('label', { class: 'row' }, 'Typewriter text', btn(prefs.typewriter ? 'On' : 'Off', () => { prefs.typewriter = !prefs.typewriter; savePrefs(); render(); })),
      h('h3', {}, 'Voices & dialogue'),
      h('label', { class: 'row' }, 'Character banter', btn(talkSettings.banter ? 'On' : 'Off', () => { talkSettings.banter = !talkSettings.banter; savePrefs(); render(); })),
      h('label', { class: 'row' }, 'Speech bubbles in battle', btn(talkSettings.bubbles ? 'On' : 'Off', () => { talkSettings.bubbles = !talkSettings.bubbles; savePrefs(); render(); })),
      voiceAvailable() ? h('label', { class: 'row' }, 'Character voices', btn(voiceSettings.enabled ? 'On' : 'Off', () => { voiceSettings.enabled = !voiceSettings.enabled; if (!voiceSettings.enabled) stopVoices(); savePrefs(); render(); })) : h('p', { class: 'hint' }, 'Voices are not supported on this device.'),
      h('label', { class: 'row' }, 'Game Master', btn({ full: 'Full', tips: 'Rules tips only', off: 'Off' }[voiceSettings.gm || 'full'], () => { voiceSettings.gm = { full: 'tips', tips: 'off', off: 'full' }[voiceSettings.gm || 'full']; gmSettings.mode = voiceSettings.gm; savePrefs(); render(); })),
      voiceAvailable() ? h('label', { class: 'row' }, 'GM reads the story aloud', btn(voiceSettings.narrator ? 'On' : 'Off', () => { voiceSettings.narrator = !voiceSettings.narrator; savePrefs(); render(); })) : null,
      voicePackSize() ? h('label', { class: 'row' }, `Recorded voices (${voicePackSize()} lines)`, btn(voiceSettings.recorded ? 'On' : 'Off', () => { voiceSettings.recorded = !voiceSettings.recorded; savePrefs(); render(); })) : null,
      voiceAvailable() ? h('label', { class: 'row' }, 'Voice casting', btn('Choose voices', () => { document.querySelector('.modal')?.remove(); showCasting(); })) : null,
      voiceAvailable() ? h('label', { class: 'row' }, 'Voice volume', btn(`${Math.round(voiceSettings.volume * 100)}%`, () => { voiceSettings.volume = voiceSettings.volume >= 1 ? 0.25 : Math.round((voiceSettings.volume + 0.25) * 100) / 100; savePrefs(); speak('Like this?', { kind: 'companion', name: 'Pip' }, { queue: false }); render(); })) : null,
      h('label', { class: 'row' }, 'Live AI banter', btn(aiSettings.enabled && getApiKey() ? 'On' : 'Set up', () => { document.querySelector('.modal')?.remove(); showAiSettings(); })),
    );
  };
  render();
  modal('Settings', body, [{ label: 'Done' }]);
}

function showCasting() {
  const body = h('div', { class: 'casting' });
  const voices = listVoices();
  const render = () => {
    body.innerHTML = '';
    if (!voices.length) { body.append(h('p', {}, 'No voices are installed on this device.')); return; }
    body.append(h('p', { class: 'hint' }, 'Pick a voice for each character. Voices marked ★ are the natural-sounding ones on your device. More natural voices: on Windows use Microsoft Edge ("Natural" voices), on iPhone/Mac download "Enhanced" or "Premium" voices in Settings → Accessibility → Spoken Content, on Android install Google\'s speech voices.'));
    for (const c of castList()) {
      const sel = h('select', { id: `cast-${c.key}`, onchange: (e) => { setCast(c.key, e.target.value); savePrefs(); } },
        voices.map((v) => h('option', { value: v.voiceURI, selected: c.voice?.voiceURI === v.voiceURI }, `${/natural|neural|enhanced|premium|siri|google/i.test(v.name) ? '★ ' : ''}${v.name}`)));
      const sample = { gm: 'Roll for initiative!', Brannoc: 'Form up. Behind me.', Tamsin: 'Dawnflower, guide our blades!', Quillan: 'Ooh, a tactical puzzle!', Pip: 'Dibs on whatever they\'re carrying!', hero: 'For Sandpoint!', goblin: 'Goblins chew and goblins bite!', beast: 'Grrrr.', villain: 'You will never stop me.' }[c.key];
      const speaker = c.key === 'gm' ? GM_SPEAKER : c.key === 'hero' ? { kind: 'hero', preset: player()?.appearance?.voice || 'warm' } : ['goblin', 'beast', 'villain'].includes(c.key) ? { kind: 'monster', monsterKey: { goblin: 'goblin', beast: 'boar', villain: 'lyrie' }[c.key] } : { kind: 'companion', name: c.key };
      body.append(h('div', { class: 'cast-row' }, h('b', {}, c.label), sel, btn('▶', () => speak(sample, speaker, { queue: false }), 'small')));
    }
  };
  render();
  modal('Voice Casting', body, [{ label: 'Done' }], { wide: true });
}

function showAiSettings() {
  const keyInput = h('input', { class: 'name-input', type: 'password', placeholder: 'sk-ant-...', value: getApiKey(), autocomplete: 'off' });
  const modelSel = h('select', {}, AI_MODELS.map((m) => h('option', { value: m.id, selected: aiSettings.model === m.id }, m.name)));
  const status = h('div', { class: 'small' }, aiSettings.lastError ? `Last error: ${aiSettings.lastError}` : '');
  const apply = () => { setApiKey(keyInput.value); aiSettings.model = modelSel.value; };
  modal('Live AI Banter', h('div', { class: 'help' },
    h('p', {}, 'With live AI banter, Claude writes fresh dialogue for your party as you play, reacting to each story scene and to big battle moments. Without it, the game uses its written lines.'),
    h('ul', {},
      h('li', {}, 'Needs an internet connection and your own Anthropic API key (console.anthropic.com).'),
      h('li', {}, 'Each story scene makes one small request to the API, billed to your key. Haiku is the cheapest option.'),
      h('li', {}, 'Your key is stored only on this device and is sent only to Anthropic.')),
    h('label', { class: 'field' }, 'API key', keyInput),
    h('label', { class: 'field' }, 'Model', modelSel),
    status), [
    { label: 'Test', keep: true, onClick: async () => { apply(); aiSettings.enabled = true; status.textContent = 'Testing...'; const r = await testConnection(); status.textContent = r.ok ? `It works! ${r.lines.map((l) => `${l.speaker}: "${l.text}"`).join(' ')}` : `Failed: ${r.error}`; } },
    { label: 'Turn off', onClick: () => { aiSettings.enabled = false; savePrefs(); toast('Live AI banter off. Using written dialogue.'); } },
    { label: 'Save & turn on', cls: 'primary', onClick: () => { apply(); aiSettings.enabled = !!getApiKey(); savePrefs(); toast(aiSettings.enabled ? 'Live AI banter on!' : 'Enter an API key first.'); } },
  ], { wide: true });
}

// ------------------------------------------------------------------ watch mode (AI plays everything)
const FEAT_PREFS = {
  fighter: ['powerAttack', 'weaponFocus', 'dodge', 'cleave', 'toughness', 'improvedInit', 'ironWill'],
  barbarian: ['powerAttack', 'toughness', 'cleave', 'improvedInit', 'ironWill'],
  paladin: ['powerAttack', 'weaponFocus', 'toughness', 'cleave', 'ironWill'],
  ranger: ['pointBlank', 'preciseShot', 'weaponFocus', 'toughness', 'improvedInit', 'rapidShot'],
  rogue: ['weaponFinesse', 'dodge', 'improvedInit', 'pointBlank', 'preciseShot', 'toughness'],
  cleric: ['toughness', 'extraChannel', 'combatCasting', 'ironWill'],
  wizard: ['combatCasting', 'toughness', 'improvedInit', 'lightningReflexes'],
  sorcerer: ['combatCasting', 'toughness', 'improvedInit', 'lightningReflexes'],
};
function autoFeats(c, L, need) {
  const chosen = [];
  const order = [...FEAT_PREFS[c.cls], ...Object.keys(FEATS)];
  const combatOnly = (c.cls === 'fighter' || c.cls === 'rogue') && L % 2 === 0 && L !== 3;
  for (const k of order) {
    if (chosen.length >= need) break;
    if (chosen.includes(k)) continue;
    if (featAllowed({ ...c, feats: [...c.feats, ...chosen] }, k, combatOnly && chosen.length === 0 && need === 1)) chosen.push(k);
  }
  return chosen;
}

function startWatchMode() {
  const pickOf = (o) => o[Math.floor(Math.random() * o.length)];
  const race = pickOf(Object.keys(RACES)), cls = pickOf(Object.keys(CLASSES));
  draft = freshDraft();
  Object.assign(draft, { race, cls, name: randomName(), personality: DEFAULT_PERSONALITY[cls] });
  applyClassDefaults();
  draft.appearance = { skin: Math.floor(Math.random() * SKIN.length), hair: Math.floor(Math.random() * HAIR.length), hairStyle: Math.floor(Math.random() * HAIR_STYLES.length), outfit: Math.floor(Math.random() * OUTFIT.length), beard: race === 'dwarf' || Math.random() < 0.2, voice: pickOf(Object.keys(VOICE_PRESETS)) };
  const base = draftChar();
  draft.feats = autoFeats({ ...base, feats: [] }, 1, featsGainedAt(base, 1));
  if (cls === 'fighter' && !draft.feats.some((f) => FEATS[f].combat)) draft.feats[0] = 'powerAttack';
  autoSkills();
  beginAdventure(true);
  toast(`🤖 The AI is playing ${draft.name} the ${RACES[race].name} ${CLASSES[cls].name}. Tap 🤖 to take over.`);
}

function autoPill(onChange, compact = true) {
  const label = () => (autoplay() && compact === false ? '🤖 AI' : '🤖');
  const b = h('button', { class: `autopill ${autoplay() ? 'on' : ''}`, title: 'Let the AI play', 'aria-label': 'Toggle AI autoplay' }, label());
  b.addEventListener('click', () => {
    sfx('click');
    G.state.autoplay = !G.state.autoplay;
    save();
    b.classList.toggle('on', autoplay());
    b.textContent = label();
    toast(autoplay() ? 'The AI is playing. Tap 🤖 to take over.' : 'You have control!');
    onChange?.();
  });
  return b;
}

// Pick a story choice in character: likely-success checks, flavored by personality.
const PERSONA_TASTE = {
  heroic: /save|protect|help|fight|attack|charge|surrender|spare|storm|challenge|face|father|tend|this ends/i,
  cheerful: /charm|story|toast|chat|help|thank|ask|knife|crowd|boar|invitation/i,
  grim: /attack|fight|now|kick|end|charge|press forward|smash|alone/i,
  snarky: /bluff|mercenar|escape|sneak|pick the|lock|stroll|mock|challenge/i,
};
function aiPick(node) {
  const list = choicesFor(node);
  const persona = player().personality || 'heroic';
  let best = null;
  for (const ch of list) {
    let score = 0.55 + Math.random() * 0.15;
    if (ch.check) {
      const pv = previewCheck(ch.check);
      const bonus = ch.check.bonus ? ch.check.bonus(G.state) : 0;
      const p = pv && pv.mod !== null ? Math.min(0.95, Math.max(0.05, (21 - (ch.check.dc - pv.mod - bonus)) / 20)) : 0;
      score = p * 1.05;
    }
    if (PERSONA_TASTE[persona].test(ch.t)) score += 0.22;
    if (/head back|return to|politely escape/i.test(ch.t) && list.length > 1) score -= 0.15;
    if (!best || score > best.score) best = { ch, score };
  }
  return best?.ch;
}

// ------------------------------------------------------------------ character creation
const STEPS = ['Origin', 'Abilities', 'Training', 'Looks', 'Ready'];
const ARRAYS = {
  fighter: { str: 17, dex: 13, con: 14, int: 10, wis: 10, cha: 9 }, barbarian: { str: 17, dex: 13, con: 14, int: 10, wis: 10, cha: 9 },
  paladin: { str: 16, dex: 10, con: 14, int: 8, wis: 10, cha: 15 }, ranger: { str: 14, dex: 17, con: 12, int: 10, wis: 12, cha: 8 },
  rogue: { str: 10, dex: 17, con: 14, int: 12, wis: 10, cha: 10 }, cleric: { str: 12, dex: 10, con: 14, int: 10, wis: 17, cha: 10 },
  wizard: { str: 8, dex: 14, con: 12, int: 17, wis: 12, cha: 10 }, sorcerer: { str: 8, dex: 14, con: 12, int: 10, wis: 12, cha: 17 },
};
const FLEX_BEST = { fighter: 'str', barbarian: 'str', paladin: 'cha', ranger: 'dex', rogue: 'dex', cleric: 'wis', wizard: 'int', sorcerer: 'cha' };
const SKILL_PICKS = {
  fighter: ['climb', 'intimidate', 'perception', 'survival'], barbarian: ['perception', 'intimidate', 'climb', 'survival', 'acrobatics'],
  paladin: ['diplomacy', 'sense', 'heal', 'religion'], ranger: ['perception', 'stealth', 'survival', 'climb', 'heal', 'sense'],
  rogue: ['perception', 'stealth', 'disable', 'acrobatics', 'bluff', 'diplomacy', 'sense', 'climb', 'local'],
  cleric: ['heal', 'religion', 'diplomacy', 'sense'], wizard: ['arcana', 'religion', 'local', 'perception', 'sense'], sorcerer: ['bluff', 'arcana', 'diplomacy', 'perception'],
};

let draft = null;
function freshDraft() {
  return { name: '', race: 'human', cls: 'fighter', base: { ...ARRAYS.fighter }, flex: 'str', feats: [], skills: [], kit: 0, favoredEnemy: 'goblinoid', personality: 'heroic', appearance: { skin: 1, hair: 1, hairStyle: 0, outfit: 0, beard: false, voice: 'warm' }, step: 0 };
}
const draftChar = () => createCharacter({ ...draft, isPlayer: true, name: draft.name || 'Hero' });
const pointsSpent = () => ABILS.reduce((s, k) => s + POINT_COST[draft.base[k]], 0);

function showCreator() {
  draft = freshDraft();
  applyClassDefaults();
  renderCreator();
}

function applyClassDefaults() {
  draft.base = { ...ARRAYS[draft.cls] };
  draft.flex = FLEX_BEST[draft.cls];
  draft.kit = 0;
  draft.feats = [];
  autoSkills();
}
function autoSkills() {
  const c = draftChar();
  const n = trainedSkillCount(c);
  const order = [...new Set([...SKILL_PICKS[draft.cls], ...CLASSES[draft.cls].classSkills, ...Object.keys(SKILLS)])];
  draft.skills = order.slice(0, n);
}

function renderCreator() {
  const c = draftChar();
  const preview = h('div', { class: 'creator-preview' },
    spriteCanvas(characterSprite(c), 6, 'sprite big bob'),
    h('div', { class: 'preview-info' },
      h('div', { class: 'pname' }, draft.name || 'Your Hero'),
      h('div', { class: 'psub' }, `${RACES[draft.race].name} ${CLASSES[draft.cls].name}`),
      h('div', { class: 'psub small' }, `HP ${maxHp(c)} · AC ${derive(c).ac} · ${ROLE_NAMES[CLASSES[draft.cls].role]}`)));
  const steps = h('div', { class: 'steps' }, STEPS.map((s, i) => h('div', { class: `stepdot ${i === draft.step ? 'on' : i < draft.step ? 'done' : ''}` }, s)));
  let body;
  if (draft.step === 0) body = creatorOrigin();
  else if (draft.step === 1) body = creatorAbilities();
  else if (draft.step === 2) body = creatorTraining();
  else if (draft.step === 3) body = creatorLooks();
  else body = creatorReady();
  const valid = stepValid();
  const nav = h('div', { class: 'creator-nav' },
    btn(draft.step === 0 ? 'Title' : 'Back', () => { if (draft.step === 0) showTitle(); else { draft.step--; renderCreator(); } }),
    draft.step < 4 ? btn('Next', () => { const v = stepValid(); if (!v.ok) { toast(v.msg); return; } draft.step++; renderCreator(); }, valid.ok || draft.step === 0 ? 'primary' : 'dim') : btn('Begin Adventure!', () => beginAdventure(), 'primary'));
  setScreen(h('div', { class: 'screen creator' }, h('h2', { class: 'screen-title' }, 'Create Your Hero'), steps, preview, h('div', { class: 'creator-body' }, body), nav));
}

function stepValid() {
  if (draft.step === 0 && !draft.name.trim()) return { ok: false, msg: 'Give your hero a name!' };
  if (draft.step === 1 && pointsSpent() > POINT_BUY) return { ok: false, msg: 'You spent too many points.' };
  if (draft.step === 2) {
    const c = draftChar();
    const need = featsGainedAt(c, 1);
    if (draft.feats.length !== need) return { ok: false, msg: `Choose ${need} feat${need > 1 ? 's' : ''}.` };
    if (draft.cls === 'fighter' && !draft.feats.some((f) => FEATS[f].combat)) return { ok: false, msg: 'Fighters need at least one combat feat.' };
    const invalid = draft.feats.find((f) => !FEATS[f].req({ ...c, feats: draft.feats.filter((x) => x !== f) }, finalAbilities(c)));
    if (invalid) return { ok: false, msg: `You don't meet the prerequisites for ${FEATS[invalid].name}.` };
    if (draft.skills.length !== trainedSkillCount(c)) return { ok: false, msg: `Train exactly ${trainedSkillCount(c)} skills.` };
  }
  return { ok: true };
}

function cardGrid(items, selected, onPick, cls = '') {
  return h('div', { class: `cards ${cls}` }, items.map(([key, it]) => h('button', { class: `card ${key === selected ? 'sel' : ''}`, onclick: () => { sfx('click'); onPick(key); } },
    h('div', { class: 'card-title' }, it.name), h('div', { class: 'card-desc' }, it.desc))));
}

function creatorOrigin() {
  const input = h('input', { class: 'name-input', maxlength: 16, placeholder: 'Name your hero', value: draft.name, oninput: (e) => { draft.name = e.target.value; $('.pname').textContent = draft.name || 'Your Hero'; } });
  return h('div', {},
    h('label', { class: 'field' }, 'Name', input, btn('🎲', () => { draft.name = randomName(); renderCreator(); }, 'small')),
    h('h3', {}, 'Race'),
    cardGrid(Object.entries(RACES), draft.race, (k) => { draft.race = k; if (k === 'dwarf') draft.appearance.beard = true; autoSkills(); renderCreator(); }),
    h('div', { class: 'traits' }, RACES[draft.race].traits.map((t) => h('span', { class: 'chip' }, t))),
    h('h3', {}, 'Class'),
    cardGrid(Object.entries(CLASSES), draft.cls, (k) => { draft.cls = k; applyClassDefaults(); renderCreator(); }),
    h('div', { class: 'traits' }, CLASSES[draft.cls].features.map((t) => h('span', { class: 'chip' }, t))),
    h('p', { class: 'hint' }, `Your companions will be: ${companionRolesFor(draft.cls).map((r) => `${COMPANIONS[r].name} the ${CLASSES[COMPANIONS[r].cls].name}`).join(', ')}.`));
}

function randomName() {
  const a = ['Ari', 'Bel', 'Cor', 'Dax', 'Ely', 'Fen', 'Gwyn', 'Hal', 'Isa', 'Jor', 'Kae', 'Lio', 'Mira', 'Nox', 'Ora', 'Per', 'Quin', 'Rho', 'Sel', 'Tam', 'Ula', 'Vex', 'Wren', 'Zan'];
  const b = ['', 'a', 'en', 'ric', 'wyn', 'ia', 'os', 'eth', 'ra', 'lin', 'dor', 'is'];
  return a[Math.floor(Math.random() * a.length)] + b[Math.floor(Math.random() * b.length)];
}

function creatorAbilities() {
  const race = RACES[draft.race];
  const fa = finalAbilities(draftChar());
  const left = POINT_BUY - pointsSpent();
  const rows = ABILS.map((k) => {
    const v = draft.base[k];
    const canUp = v < 18 && POINT_COST[v + 1] - POINT_COST[v] <= left;
    const canDown = v > 7;
    const racial = (race.mods[k] || 0) + (race.flex && draft.flex === k ? 2 : 0);
    return h('div', { class: 'abil-row' },
      h('div', { class: 'abil-name' }, ABIL_NAMES[k]),
      btn('−', () => { draft.base[k]--; renderCreator(); }, 'small', !canDown),
      h('div', { class: 'abil-base' }, v),
      btn('+', () => { draft.base[k]++; renderCreator(); }, 'small', !canUp),
      h('div', { class: `abil-race ${racial > 0 ? 'pos' : racial < 0 ? 'neg' : ''}` }, racial ? sign(racial) : ''),
      h('div', { class: 'abil-final' }, fa[k]),
      h('div', { class: 'abil-mod' }, sign(mod(fa[k]))));
  });
  return h('div', {},
    h('div', { class: `points ${left < 0 ? 'neg' : ''}` }, `Points left: ${left} / ${POINT_BUY}`),
    h('div', { class: 'abil-head' }, h('span', {}, 'Ability'), h('span', {}, 'Base'), h('span', {}, 'Race'), h('span', {}, 'Score'), h('span', {}, 'Mod')),
    rows,
    race.flex ? h('label', { class: 'field' }, `${race.name} bonus +2 to:`, h('select', { onchange: (e) => { draft.flex = e.target.value; autoSkills(); renderCreator(); } }, ABILS.map((k) => h('option', { value: k, selected: draft.flex === k }, ABIL_NAMES[k])))) : null,
    h('div', { class: 'row-btns' }, btn('Recommended', () => { draft.base = { ...ARRAYS[draft.cls] }; draft.flex = FLEX_BEST[draft.cls]; renderCreator(); })),
    h('p', { class: 'hint' }, 'Pathfinder point buy: higher scores cost more. Scores of 7-9 refund points. Every 2 points above 10 adds +1 to the modifier.'));
}

function creatorTraining() {
  const c = draftChar();
  const cls = CLASSES[draft.cls];
  const needFeats = featsGainedAt(c, 1);
  const needSkills = trainedSkillCount(c);
  const kits = cls.kits.map((k, i) => h('button', { class: `card ${draft.kit === i ? 'sel' : ''}`, onclick: () => { draft.kit = i; renderCreator(); } },
    h('div', { class: 'card-title' }, k.name), h('div', { class: 'card-desc' }, `${k.weapons.map((w) => w.replace(/([A-Z])/g, ' $1').toLowerCase()).join(' + ')}${k.shield ? ' + shield' : ''}`)));
  const feats = Object.entries(FEATS).map(([k, f]) => {
    const on = draft.feats.includes(k);
    const ok = f.req({ ...c, feats: draft.feats.filter((x) => x !== k) }, finalAbilities(c));
    return h('button', { class: `pick ${on ? 'on' : ''} ${ok ? '' : 'locked'}`, onclick: () => {
      if (on) draft.feats = draft.feats.filter((x) => x !== k);
      else if (!ok) { toast('Prerequisites not met.'); return; }
      else if (draft.feats.length >= needFeats) { toast(`Only ${needFeats} feat${needFeats > 1 ? 's' : ''} at 1st level.`); return; }
      else draft.feats.push(k);
      renderCreator();
    } }, h('b', {}, f.name, f.combat ? ' ⚔' : ''), h('span', {}, f.desc));
  });
  const skills = Object.entries(SKILLS).map(([k, s]) => {
    const on = draft.skills.includes(k);
    const cs = cls.classSkills.includes(k);
    return h('button', { class: `pick skill ${on ? 'on' : ''}`, onclick: () => {
      if (on) draft.skills = draft.skills.filter((x) => x !== k);
      else if (draft.skills.length >= needSkills) { toast(`You can train ${needSkills} skills.`); return; }
      else draft.skills.push(k);
      renderCreator();
    } }, h('b', {}, s.name, cs ? ' ★' : ''), h('span', {}, `${sign(derive(c).skills[k] ?? mod(finalAbilities(c)[s.ab]))}`));
  });
  return h('div', {},
    h('h3', {}, 'Equipment'), h('div', { class: 'cards two' }, kits),
    draft.cls === 'ranger' ? h('label', { class: 'field' }, 'Favored enemy', h('select', { onchange: (e) => { draft.favoredEnemy = e.target.value; } },
      [['goblinoid', 'Humanoid (goblinoid)'], ['aberration', 'Aberration'], ['outsider', 'Outsider'], ['animal', 'Animal'], ['human', 'Humanoid (human)']].map(([v, l]) => h('option', { value: v, selected: draft.favoredEnemy === v }, l)))) : null,
    h('h3', {}, `Feats (${draft.feats.length}/${needFeats})`),
    draft.cls === 'fighter' ? h('p', { class: 'hint' }, 'Fighters get a bonus combat feat (⚔).') : null,
    h('div', { class: 'picks' }, feats),
    h('h3', {}, `Trained skills (${draft.skills.length}/${needSkills})`),
    h('p', { class: 'hint' }, '★ = class skill (+3 when trained). Trained skills gain a rank every level.'),
    h('div', { class: 'picks skills' }, skills));
}

function creatorLooks() {
  const ap = draft.appearance;
  const swatches = (list, key) => h('div', { class: 'swatches' }, list.map((col, i) => h('button', { class: `swatch ${ap[key] === i ? 'on' : ''}`, style: { background: col }, onclick: () => { ap[key] = i; renderCreator(); }, 'aria-label': `${key} ${i}` })));
  return h('div', {},
    h('h3', {}, 'Skin'), swatches(SKIN, 'skin'),
    h('h3', {}, 'Hair color'), swatches(HAIR, 'hair'),
    h('h3', {}, 'Hair style'), h('div', { class: 'row-btns wrap' }, HAIR_STYLES.map((n, i) => btn(n, () => { ap.hairStyle = i; renderCreator(); }, ap.hairStyle === i ? 'on small' : 'small'))),
    h('h3', {}, 'Outfit'), swatches(OUTFIT, 'outfit'),
    h('h3', {}, 'Personality'),
    h('div', { class: 'cards' }, Object.entries(PERSONALITIES).map(([k, pp]) => h('button', { class: `card ${draft.personality === k ? 'sel' : ''}`, onclick: () => { draft.personality = k; renderCreator(); } }, h('div', { class: 'card-title' }, pp.name), h('div', { class: 'card-desc' }, pp.desc)))),
    voiceAvailable() ? h('div', {}, h('h3', {}, 'Voice'), h('div', { class: 'row-btns wrap' }, Object.entries(VOICE_PRESETS).map(([k, v]) => btn(`▶ ${v.name}`, () => {
      ap.voice = k; renderCreator();
      speak({ heroic: 'For Sandpoint! Stand with me!', cheerful: 'Hi there! This is going to be fun!', grim: 'Let\'s get this over with.', snarky: 'Oh great. Goblins. My favorite.' }[draft.personality || 'heroic'], { kind: 'hero', preset: k }, { queue: false });
    }, ap.voice === k ? 'on small' : 'small')))) : null,
    h('div', { class: 'row-btns' }, btn(ap.beard ? 'Beard: yes' : 'Beard: no', () => { ap.beard = !ap.beard; renderCreator(); }, 'small'),
      btn('🎲 Randomize', () => { ap.skin = Math.floor(Math.random() * SKIN.length); ap.hair = Math.floor(Math.random() * HAIR.length); ap.hairStyle = Math.floor(Math.random() * HAIR_STYLES.length); ap.outfit = Math.floor(Math.random() * OUTFIT.length); renderCreator(); }, 'small')));
}

function creatorReady() {
  const c = draftChar();
  return h('div', {}, sheetBody(c),
    h('h3', {}, 'Your companions'),
    h('div', { class: 'companions' }, companionRolesFor(draft.cls).map((r) => {
      const t = COMPANIONS[r];
      const cc = createCharacter({ ...t });
      return h('div', { class: 'companion' }, portraitOf(cc, 3), h('div', {}, h('b', {}, `${t.name}`), h('div', { class: 'small' }, `${RACES[t.race].name} ${CLASSES[t.cls].name} · ${ROLE_NAMES[r]}`), h('div', { class: 'small dim' }, t.bio)));
    })));
}

function beginAdventure(watch = false) {
  const c = draftChar();
  c.name = draft.name.trim() || 'Hero';
  c.isPlayer = true;
  c.personality = draft.personality || 'heroic';
  newGame(c);
  G.state.autoplay = watch === true;
  save();
  enterNode(START);
}

// ------------------------------------------------------------------ character sheet
function sheetBody(c) {
  const s = derive(c);
  const cls = CLASSES[c.cls];
  const atk = (a) => `${a.name} ${sign(a.bonus)} (${a.n}d${a.s}${a.dmgBonus ? sign(a.dmgBonus) : ''}${a.crit < 20 ? `, ${a.crit}-20` : ''}${a.mult > 2 ? `/×${a.mult}` : ''}${a.range ? `, ${a.range} ft` : ''})`;
  const slots = s.caster ? Object.entries(s.caster.slots).map(([l, n]) => `${l}${['th', 'st', 'nd'][l] || 'th'}: ${n - ((c.used.slots || {})[l] || 0)}/${n}`).join(' · ') : null;
  return h('div', { class: 'sheet' },
    h('div', { class: 'sheet-top' }, portraitOf(c, 4), h('div', {},
      h('div', { class: 'sheet-name' }, c.name), h('div', {}, `Level ${c.level} ${RACES[c.race].name} ${cls.name}`),
      h('div', { class: 'hpline' }, `HP ${c.hp}/${maxHp(c)}`), c.trait ? h('div', { class: 'small gold' }, `Trait: ${TRAITS[c.trait].name}: ${TRAITS[c.trait].desc}`) : null)),
    h('div', { class: 'abil-grid' }, ABILS.map((k) => h('div', { class: 'abil-box' }, h('small', {}, k.toUpperCase()), h('b', {}, s.abil[k]), h('span', {}, sign(s.m[k]))))),
    h('div', { class: 'stat-grid' },
      stat('AC', s.ac), stat('Touch', s.touch), stat('Flat', s.flat), stat('Init', sign(s.init)),
      stat('Fort', sign(s.fort)), stat('Ref', sign(s.ref)), stat('Will', sign(s.will)), stat('Speed', `${s.speed}ft`),
      stat('BAB', sign(s.bab)), stat('CMB', sign(s.cmb)), stat('CMD', s.cmd), stat('Size', s.size === 'S' ? 'Small' : 'Med')),
    h('h4', {}, 'Attacks'), h('ul', { class: 'compact' }, [...s.attacks.melee, ...s.attacks.ranged].map((a) => h('li', {}, atk(a)))),
    h('h4', {}, 'Feats'), h('div', { class: 'chips' }, c.feats.map((f) => h('span', { class: 'chip', title: FEATS[f]?.desc }, FEATS[f]?.name || f))),
    h('h4', {}, 'Class features'), h('div', { class: 'chips' }, cls.features.map((f) => h('span', { class: 'chip' }, f))),
    s.caster ? h('div', {}, h('h4', {}, 'Spells per day'), h('div', { class: 'small' }, slots, ' · cantrips at will'),
      h('div', { class: 'chips' }, Object.entries(SPELLS).filter(([, sp]) => sp.lv[c.cls] !== undefined && (sp.lv[c.cls] === 0 || s.caster.slots[sp.lv[c.cls]])).map(([, sp]) => h('span', { class: 'chip', title: sp.desc }, `${sp.name} (${sp.lv[c.cls]})`)))) : null,
    h('h4', {}, 'Skills'), h('div', { class: 'skill-list' }, Object.entries(SKILLS).filter(([k]) => s.skills[k] !== null).map(([k, sk]) => h('div', { class: c.skills.includes(k) ? 'trained' : '' }, h('span', {}, sk.name), h('b', {}, sign(s.skills[k]))))),
    c.bio ? h('p', { class: 'small dim' }, c.bio) : null);
}
const stat = (l, v) => h('div', { class: 'stat' }, h('small', {}, l), h('b', {}, v));

function showParty(startIdx = 0) {
  const party = G.state.party;
  let idx = startIdx;
  const body = h('div', {});
  const render = () => {
    body.innerHTML = '';
    body.append(h('div', { class: 'tabs' }, party.map((c, i) => h('button', { class: `tab ${i === idx ? 'on' : ''}`, onclick: () => { idx = i; render(); } }, portraitOf(c, 2), c.name))),
      sheetBody(party[idx]),
      h('div', { class: 'small gold' }, `Party: ${G.state.potions} potions of cure light wounds · ${G.state.gold} gp`));
  };
  render();
  modal('Party', body, [{ label: 'Close' }], { wide: true });
}

function showMenu() {
  modal('Menu', h('div', { class: 'menu' },
    btn('Party', () => { document.querySelector('.modal')?.remove(); showParty(); }),
    btn('Settings', () => { document.querySelector('.modal')?.remove(); showSettings(); }),
    btn('How to Play', () => { document.querySelector('.modal')?.remove(); showHelp(); }),
    btn('Save & Quit to Title', () => { document.querySelector('.modal')?.remove(); save(); showTitle(); })), []);
}

// ------------------------------------------------------------------ story
function resumeGame() {
  const node = STORY[G.state.node];
  if (node?.combat) { startCombat(G.state.node); return; }
  enterNode(G.state.node, { resume: true });
}

function partyBar() {
  return h('div', { class: 'partybar' },
    G.state.party.map((c, i) => {
      const ratio = Math.max(0, c.hp) / maxHp(c);
      return h('button', { class: `pmini ${c.dead ? 'dead' : ''}`, onclick: () => showParty(i) }, portraitOf(c, 2),
        h('div', { class: 'pmini-info' }, h('span', {}, c.name), h('div', { class: 'bar' }, h('i', { style: { width: `${ratio * 100}%`, background: ratio > 0.5 ? '#5ad85a' : ratio > 0.25 ? '#f2c84b' : '#ff4646' } })), h('small', {}, `${c.hp}/${maxHp(c)}`)));
    }),
    autoPill(() => storyAutoHook?.()),
    h('button', { class: 'menu-btn', onclick: showMenu, 'aria-label': 'Menu' }, '☰'));
}
let storyAutoHook = null;

export function enterNode(id, { resume = false } = {}) {
  if (id === '__title') { save(); showTitle(); return; }
  let returning = false;
  if (id === '__return') { id = G.state.returnTo || 'day2'; G.state.returnTo = null; returning = true; }
  const node = STORY[id];
  if (!node) { console.error('Missing node', id); return; }
  G.state.node = id;
  if (node.combat) { startCombat(id); return; }
  let notes = [];
  if (returning) { resume = true; G.state.nodeApplied = true; } // coming back to a hub: don't re-award its effects
  if (!resume || !G.state.nodeApplied) {
    G.state.nodeApplied = false;
    notes = applyEffects(node.on);
    G.state.nodeApplied = true;
  }
  save();
  const needLevel = node.levelUp && player().level < Math.min(node.levelUp, MAX_LEVEL);
  if (needLevel) { levelUpFlow(node.levelUp, () => { if (node.rest) restParty(); save(); renderStory(node, notes); }); return; }
  if (node.rest && !resume) restParty();
  save();
  renderStory(node, notes);
}

function renderStory(node, notes = []) {
  playMusic(['catacombs', 'runewell', 'shrine'].includes(node.scene) ? 'dungeon' : 'town');
  const text = fillText(node.text, { who: G.state.lastWho || 'You' });
  const textEl = h('div', { class: 'story-text' });
  const choicesEl = h('div', { class: 'choices' });
  const banterEl = h('div', { class: 'banter' });
  const npc = node.npc ? spriteCanvas(npcSprite(node.npc), 4, 'npc-portrait bob') : null;
  const screen = h('div', { class: 'screen story' },
    partyBar(),
    node.chapter ? h('div', { class: 'chapter' }, node.chapter) : null,
    h('div', { class: 'scene-wrap' }, sceneCanvas(node.scene || 'sandpoint'), npc),
    h('div', { class: 'panel story-panel' }, textEl, notes.length ? h('div', { class: 'notes' }, notes.map((n) => h('div', {}, `✦ ${n}`))) : null, banterEl, choicesEl));
  setScreen(screen);
  // Start fetching live AI banter right away so it's ready when the narration ends.
  const situation = `${node.chapter ? `[${node.chapter}] ` : ''}${text}`.slice(0, 1400);
  const aiLines = aiReady() && talkSettings.banter && !node.end ? aiSceneLines(G.state, situation, node.rest ? 4 : 3) : null;
  const narration = speak(text, { kind: 'narrator' }, { queue: false });
  const nodeId = G.state.node;
  const showChoices = () => {
    choicesEl.innerHTML = '';
    for (const ch of choicesFor(node)) {
      const label = [h('span', {}, fillText(ch.t))];
      if (ch.check) {
        const pv = previewCheck(ch.check);
        const bonus = ch.check.bonus ? ch.check.bonus(G.state) : 0;
        const modTxt = pv && pv.mod !== null ? sign(pv.mod + bonus) : 'untrained';
        label.push(h('em', { class: 'check-tag' }, `[${checkLabel(ch.check)} · ${ch.check.who === 'party' ? (pv ? pv.c.name : 'party') : 'you'} ${modTxt}]`));
      }
      choicesEl.append(h('button', { class: 'choice', onclick: () => { sfx('click'); storyAutoHook = null; choose(node, ch, choicesEl); } }, label));
    }
    storyAutoHook = () => scheduleAutoChoice(node, choicesEl);
    if (autoplay()) scheduleAutoChoice(node, choicesEl);
  };
  storyAutoHook = null;
  typewrite(textEl, text, async () => {
    if (voiceSettings.narrator) await narration;
    await playBanter(node, nodeId, banterEl, aiLines);
    if (textEl.isConnected) showChoices();
  });
  keyHandler = (e) => {
    const list = [...choicesEl.querySelectorAll('.choice')];
    const i = digit(e);
    if (i >= 0 && list[i]) { list[i].click(); return; }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!list.length) textEl.click();
      else if (list.length === 1) list[0].click();
    }
  };
}

function scheduleAutoChoice(node, choicesEl) {
  setTimeout(() => {
    if (!autoplay() || !choicesEl.isConnected) return;
    const btns = [...choicesEl.querySelectorAll('.choice')];
    if (!btns.length) return;
    if (node.end) { G.state.autoplay = false; save(); toast('The end! The AI hands control back to you.'); return; }
    const ch = aiPick(node);
    const idx = choicesFor(node).indexOf(ch);
    const b = btns[idx] || btns[0];
    b.classList.add('ai-pick');
    setTimeout(() => { if (b.isConnected && autoplay()) b.click(); }, 900 / prefs.speed);
  }, 1200 / prefs.speed);
}

// Show the party's conversation for this scene: speech bubbles + voices, one line at a time.
async function playBanter(node, nodeId, el, aiLinesPromise) {
  if (!talkSettings.banter) return;
  G.state.flags.sceneSeen = G.state.flags.sceneSeen || [];
  let lines = G.state.flags.sceneSeen.includes(nodeId) ? [] : sceneLines(nodeId, G.state);
  if (aiLinesPromise) {
    const ai = await Promise.race([aiLinesPromise, sleep(8000).then(() => null)]);
    if (ai && ai.length) lines = ai;
  }
  if (node.rest) lines = [...lines, ...campLines(G.state).map((l) => ({ ...l, camp: true }))];
  if (!G.state.flags.sceneSeen.includes(nodeId)) G.state.flags.sceneSeen.push(nodeId);
  save();
  if (!lines.length || !el.isConnected) return;
  let skip = false;
  const skipBtn = h('button', { class: 'skip-banter', onclick: () => { skip = true; stopVoices(); } }, 'Skip ▸▸');
  el.append(skipBtn);
  // The Game Master sets the scene and frames who is speaking.
  const gmFull = gmSettings.mode === 'full';
  const script = [];
  if (gmFull && lines[0] && !lines[0].camp) script.push({ gm: true, text: sceneIntro(false) });
  let lastSpeaker = null;
  let campIntro = false;
  for (const l of lines) {
    if (gmFull && l.camp && !campIntro) { script.push({ gm: true, text: sceneIntro(true) }); campIntro = true; lastSpeaker = null; }
    if (gmFull && l.c !== lastSpeaker && Math.random() < 0.45) { const dir = stageDirection(l.c, player().personality); if (dir) script.push({ gm: true, text: dir }); }
    script.push(l);
    lastSpeaker = l.c;
  }
  for (const l of script) {
    if (!el.isConnected) return;
    const row = l.gm
      ? h('div', { class: 'say gm' }, spriteCanvas(npcSprite('gm'), 2, 'portrait'), h('div', { class: 'say-body' }, h('span', {}, l.text)))
      : h('div', { class: `say ${l.c.isPlayer ? 'hero' : ''}` }, portraitOf(l.c, 2), h('div', { class: 'say-body' }, h('b', {}, l.c.name), h('span', {}, l.text)));
    el.insertBefore(row, skipBtn);
    if (skip) continue;
    const minTime = (voiceSettings.enabled ? 600 : (l.gm ? 800 : 1100)) + l.text.length * (voiceSettings.enabled ? 18 : 30);
    await Promise.all([speak(l.text, l.gm ? GM_SPEAKER : speakerOf(l.c)), sleep(minTime / Math.sqrt(prefs.speed))]);
  }
  skipBtn.remove();
}

function typewrite(el, text, done) {
  const paras = text.split('\n\n');
  el.innerHTML = '';
  const ps = paras.map((p) => { const e = h('p', {}); el.append(e); return { e, t: p }; });
  if (!prefs.typewriter) { ps.forEach((p) => { p.e.textContent = p.t; }); done(); return; }
  let pi = 0, ci = 0, finished = false;
  const finish = () => { if (finished) return; finished = true; clearInterval(timer); ps.forEach((p) => { p.e.textContent = p.t; }); done(); };
  const timer = setInterval(() => {
    if (!el.isConnected) { clearInterval(timer); return; }
    const p = ps[pi];
    ci += 2;
    p.e.textContent = p.t.slice(0, ci);
    if (ci >= p.t.length) { pi++; ci = 0; if (pi >= ps.length) finish(); }
  }, 16);
  el.addEventListener('click', finish, { once: true });
}

function choose(node, ch, choicesEl) {
  if (ch.set) Object.assign(G.state.flags, ch.set);
  if (ch.ret) G.state.returnTo = ch.ret;
  const notes = applyEffects(ch.fx);
  if (notes.length) toast(notes.join(' · '));
  if (!ch.check) { G.state.lastWho = player().name; enterNode(ch.go); return; }
  const r = rollCheck(ch.check);
  G.state.lastWho = r.who.isPlayer ? 'You' : r.who.name;
  choicesEl.innerHTML = '';
  const die = h('div', { class: 'die' }, '?');
  const result = h('div', { class: 'check-result' }, die, h('div', { class: 'check-text' }, `${r.who.isPlayer ? 'You' : r.who.name} roll${r.who.isPlayer ? '' : 's'} ${checkLabel(ch.check)}...`));
  const gmOn = gmSettings.mode !== 'off';
  const gmLine = gmOn ? explainCheck(ch.check, r.who.isPlayer ? 'You' : r.who.name, r.untrained ? null : r.mod, r.bonus) : null;
  if (gmLine) choicesEl.append(h('div', { class: 'say gm' }, spriteCanvas(npcSprite('gm'), 2, 'portrait'), h('div', { class: 'say-body' }, h('span', {}, gmLine))));
  choicesEl.append(result);
  const explained = gmLine ? speak(gmLine, GM_SPEAKER, { queue: false }) : Promise.resolve();
  sfx('dice');
  let n = 0;
  const spin = setInterval(() => {
    die.textContent = d(20);
    if (++n > 10) {
      clearInterval(spin);
      die.textContent = r.roll;
      die.classList.add(r.success ? 'ok' : 'bad');
      sfx(r.success ? 'success' : 'fail');
      const detail = r.untrained ? 'Untrained: automatic failure.' : `${r.roll} ${sign(r.mod)}${r.bonus ? ` ${sign(r.bonus)} (bonus)` : ''} = ${r.total} vs DC ${r.dc}`;
      result.querySelector('.check-text').innerHTML = '';
      result.querySelector('.check-text').append(h('b', { class: r.success ? 'good' : 'bad' }, r.success ? (r.roll === 20 ? 'Natural 20! Success!' : 'Success!') : 'Failure.'), h('div', { class: 'small' }, detail));
      const cont = h('button', { class: 'choice primary', onclick: () => { sfx('click'); enterNode(r.success ? ch.pass : ch.fail); } }, 'Continue');
      choicesEl.append(cont);
      const gmOutcome = gmOn ? explainResult(r) : null;
      if (gmOutcome) result.querySelector('.check-text').append(h('div', { class: 'small gm-outcome' }, gmOutcome));
      const said = explained.then(() => (gmOutcome ? speak(gmOutcome, GM_SPEAKER) : null));
      if (autoplay()) Promise.all([said, sleep(1600 / prefs.speed)]).then(() => { if (cont.isConnected && autoplay()) cont.click(); });
    }
  }, 60);
}

// ------------------------------------------------------------------ level up
function levelUpFlow(targetLevel, done) {
  const p = player();
  const L = p.level + 1;
  const need = featsGainedAt(p, L);
  const chosen = [];
  let inc = L === 4 ? FLEX_BEST[p.cls] : null;
  if (autoplay()) {
    levelUp(p, { feats: autoFeats(p, L, need), increase: inc });
    for (const c of companions()) {
      if (c.level >= L) continue;
      const t = COMPANIONS[c.role];
      levelUp(c, { feats: (t?.levelFeats[L] || []).filter((f) => !c.feats.includes(f)), increase: L === 4 ? t?.increase : null });
    }
    sfx('level');
    toast(`⭐ The party reached level ${L}!`);
    save();
    if (p.level < Math.min(targetLevel, MAX_LEVEL)) levelUpFlow(targetLevel, done); else done();
    return;
  }
  const before = derive(p);
  const body = h('div', {});
  const render = () => {
    body.innerHTML = '';
    const preview = JSON.parse(JSON.stringify(p));
    levelUp(preview, { feats: [...chosen], increase: inc });
    const after = derive(preview);
    const cls = CLASSES[p.cls];
    body.append(
      h('div', { class: 'levelup-head' }, portraitOf(p, 4), h('div', {}, h('div', { class: 'big gold' }, `Level ${L}!`), h('div', {}, `${RACES[p.race].name} ${cls.name}`))),
      h('div', { class: 'stat-grid' }, stat('HP', `${maxHp(p)}→${maxHp(preview)}`), stat('BAB', `${sign(before.bab)}→${sign(after.bab)}`), stat('Fort', sign(after.fort)), stat('Ref', sign(after.ref)), stat('Will', sign(after.will)), stat('AC', after.ac)),
      after.caster ? h('div', { class: 'small' }, 'Spell slots: ', Object.entries(after.caster.slots).map(([l, n]) => `${l}${['th', 'st', 'nd'][l] || 'th'} level ×${n}`).join(', ')) : null,
      L === 4 ? h('div', {}, h('h4', {}, 'Ability increase (+1)'), h('div', { class: 'row-btns wrap' }, ABILS.map((k) => btn(`${k.toUpperCase()} ${finalAbilities(p)[k]}`, () => { inc = k; render(); }, inc === k ? 'on small' : 'small')))) : null,
      need ? h('div', {}, h('h4', {}, `Choose ${need} feat${need > 1 ? 's' : ''} (${chosen.length}/${need})`), h('div', { class: 'picks' }, Object.entries(FEATS).map(([k, f]) => {
        const on = chosen.includes(k);
        const ok = featAllowed({ ...p, feats: [...p.feats, ...chosen.filter((x) => x !== k)] }, k, (p.cls === 'fighter' || p.cls === 'rogue') && L % 2 === 0 && L !== 3);
        return h('button', { class: `pick ${on ? 'on' : ''} ${ok || on ? '' : 'locked'}`, onclick: () => {
          if (on) chosen.splice(chosen.indexOf(k), 1);
          else if (!ok) { toast('Not available.'); return; }
          else if (chosen.length >= need) { toast(`Choose ${need}.`); return; }
          else chosen.push(k);
          render();
        } }, h('b', {}, f.name, f.combat ? ' ⚔' : ''), h('span', {}, f.desc));
      }))) : h('p', { class: 'hint' }, 'No new feats this level. Your skills and saves improved.'),
      h('p', { class: 'small dim' }, `Your companions also reach level ${L}.`));
  };
  render();
  sfx('level');
  const m = modal('Level Up!', body, [{ label: 'Confirm', cls: 'primary', keep: true, onClick: () => {
    if (chosen.length < need) { toast(`Choose ${need} feat${need > 1 ? 's' : ''}.`); return; }
    levelUp(p, { feats: [...chosen], increase: inc });
    for (const c of companions()) {
      if (c.level >= L) continue;
      const t = COMPANIONS[c.role];
      levelUp(c, { feats: (t?.levelFeats[L] || []).filter((f) => !c.feats.includes(f)), increase: L === 4 ? t?.increase : null });
    }
    m.close();
    save();
    if (p.level < Math.min(targetLevel, MAX_LEVEL)) levelUpFlow(targetLevel, done);
    else done();
  } }], { onClose: false });
}

// ------------------------------------------------------------------ combat
function startCombat(nodeId) {
  const node = STORY[nodeId];
  G.state.node = nodeId;
  if (!G.state.checkpoint || G.state.checkpointNode !== nodeId) { G.state.checkpoint = snapshot(); G.state.checkpointNode = nodeId; }
  save();
  new CombatUI(node).start();
}

class CombatUI {
  constructor(node) {
    this.node = node;
    this.enc = buildEncounter(node.combat, G.state.flags);
    this.busy = false;
    this.mode = null;
    this.logLines = [];
  }

  start() {
    const party = this.enc.soloPlayer || this.node.solo ? [player()] : G.state.party;
    const engine = new Combat({ map: this.enc.map, party, enemies: this.enc.enemies, surprise: this.node.surprise || null, controllers: { player: (e, u) => this.playerTurn(e, u), ai: aiTurn } });
    engine.inventory = G.state;
    this.e = engine;
    window.__combat = this;
    // Nualia falters if you reached her heart
    if (G.state.flags.nualiaFalter) { const n = engine.units.find((u) => u.key === 'nualia'); if (n) n.st.shaken = { r: 4 }; }
    playMusic(this.enc.music || 'battle');

    this.canvas = h('canvas', { class: 'battlefield' });
    this.info = h('div', { class: 'unit-info' });
    this.logEl = h('div', { class: 'log', onclick: () => this.showFullLog() });
    this.actions = h('div', { class: 'actions' });
    this.order = h('div', { class: 'order' });
    this.hint = h('div', { class: 'hint-bar' }, '');
    setScreen(h('div', { class: 'screen combat' },
      h('div', { class: 'combat-top' }, h('div', { class: 'combat-title' }, this.enc.title), autoPill(() => this.onAutoplayToggle(), false), h('button', { class: 'menu-btn', onclick: () => this.showCombatMenu(), 'aria-label': 'Menu' }, '☰')),
      this.order, h('div', { class: 'field-wrap' }, this.canvas), this.hint, this.info, this.logEl, this.actions));
    this.view = new CombatView(this.canvas, engine);
    const wrap = this.canvas.parentElement;
    const fit = () => {
      const w = wrap.clientWidth, hgt = wrap.clientHeight;
      const ratio = engine.map.w / engine.map.h;
      const cw = Math.min(w, hgt * ratio);
      this.canvas.style.width = `${Math.floor(cw)}px`;
      this.canvas.style.height = `${Math.floor(cw / ratio)}px`;
    };
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(fit).observe(wrap);
    fit();
    this.view.speed = prefs.speed;
    this.gmBox = h('div', { class: 'gm-box', hidden: true }, spriteCanvas(npcSprite('gm'), 2, 'portrait'), h('span', {}));
    this.canvas.parentElement.append(this.gmBox);
    this.gm = new GMCommentator({ state: G.state, show: (text) => this.gmSay(text) });
    this.barker = new Barker({ view: this.view, speed: prefs.speed, state: G.state, onLine: (name, text) => this.addLog(`${name}: "${text}"`, 'say') });
    engine.fx = this.wrapFx(this.view.fx);
    this.view.onCell = (x, y) => this.tap(x, y);
    this.view.onLog = (t, cls) => this.addLog(t, cls);
    this.renderOrder();
    this.renderInfo();
    engine.run().then((res) => this.finish(res)).catch((err) => { console.error(err); toast(`Error: ${err.message}`); });
  }

  wrapFx(fx) {
    const self = this;
    return {
      ...fx,
      update() { self.renderOrder(); if (!self.mode) self.renderInfo(); },
      async turnStart(u) { self.renderOrder(); self.renderInfo(u); if (!u.isPlayer) self.hint.textContent = ''; await fx.turnStart(u); },
      event(type, data, e) { self.barker.handle(type, data, e); self.gm.handle(type, data, e); },
    };
  }

  gmSay(text) {
    this.addLog(`GM: ${text}`, 'gm');
    this.gmBox.querySelector('span').textContent = text;
    this.gmBox.hidden = false;
    clearTimeout(this.gmTimer);
    const shown = speak(text, GM_SPEAKER);
    const minTime = (2500 + text.length * 45) / Math.sqrt(prefs.speed);
    Promise.all([shown, sleep(minTime)]).then(() => { this.gmTimer = setTimeout(() => { if (this.gmBox.querySelector('span').textContent === text) this.gmBox.hidden = true; }, 300); });
  }

  onAutoplayToggle() {
    // Turning the AI on mid-turn hands the current turn over immediately.
    if (autoplay() && this.resolveTurn && !this.busy) this.act(() => aiTurn(this.e, this.unit));
  }

  addLog(text, cls) {
    this.logLines.push({ text, cls });
    const last = this.logLines.slice(window.innerWidth >= 900 ? -40 : -4);
    this.logEl.innerHTML = '';
    for (const l of last) this.logEl.append(h('div', { class: `ll c-${l.cls}` }, l.text));
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }
  showFullLog() {
    const body = h('div', { class: 'fulllog' }, this.logLines.map((l) => h('div', { class: `ll c-${l.cls}` }, l.text)));
    modal('Battle Log', body, [{ label: 'Close' }], { wide: true });
    setTimeout(() => { body.scrollTop = body.scrollHeight; }, 10);
  }

  renderOrder() {
    const e = this.e;
    if (!e.order) return;
    this.order.innerHTML = '';
    for (const u of e.order) {
      if (u.dead && u.side === 'enemy') continue;
      const el = h('button', { class: `ord ${u === e.current ? 'cur' : ''} ${u.side} ${u.out() ? 'out' : ''}`, onclick: () => this.renderInfo(u, true) }, unitPortrait(u, 2));
      this.order.append(el);
    }
  }

  renderInfo(u = this.e.current, inspect = false) {
    if (!u) return;
    const s = u.stats();
    const sts = Object.keys(u.st).map((k) => k.replace(/([A-Z])/g, ' $1').toLowerCase());
    const b = this.e.b && u === this.e.current && u.isPlayer ? this.e.b : null;
    this.info.innerHTML = '';
    this.info.append(unitPortrait(u, 2), h('div', { class: 'ui-main' },
      h('div', {}, h('b', {}, u.name), ' ', h('span', { class: 'nums' }, `HP ${u.hp}/${u.maxHp}${u.tempHp ? ` (+${u.tempHp})` : ''} · AC ${s.ac} · T ${s.touch} · FF ${s.flat}`)),
      h('div', { class: 'small' }, inspect || !b ? `F ${sign(s.fort)} R ${sign(s.ref)} W ${sign(s.will)} · Spd ${s.speed} · ${(s.attacks.melee[0] || s.attacks.ranged[0])?.name || ''} ${sign((s.attacks.melee[0] || s.attacks.ranged[0])?.bonus || 0)}` :
        h('span', { class: 'acts' }, h('i', { class: b.std ? 'on' : '' }, 'Std'), h('i', { class: b.move || b.std ? 'on' : '' }, 'Move'), h('i', { class: b.swift ? 'on' : '' }, 'Swift'), h('i', { class: b.step && !b.movedDistance ? 'on' : '' }, '5ft'), u.powerAttack ? h('i', { class: 'on pa' }, 'PA') : null)),
      sts.length ? h('div', { class: 'small statuses' }, sts.join(', ')) : null));
  }

  showCombatMenu() {
    modal('Battle', h('div', { class: 'menu' },
      btn(`Speed: ${prefs.speed}x`, () => { prefs.speed = prefs.speed >= 3 ? 1 : prefs.speed + 1; this.view.speed = prefs.speed; savePrefs(); document.querySelector('.modal')?.remove(); this.showCombatMenu(); }),
      btn('Battle log', () => { document.querySelector('.modal')?.remove(); this.showFullLog(); }),
      btn('Party sheets', () => { document.querySelector('.modal')?.remove(); showParty(); }),
      btn('How to play', () => { document.querySelector('.modal')?.remove(); showHelp(); }),
      btn('Retreat to title (lose battle progress)', () => { document.querySelector('.modal')?.remove(); this.view.destroy(); restore(G.state.checkpoint); save(); showTitle(); }, 'danger')), []);
  }

  // -------------------------------------------------- player turn
  playerTurn(e, u) {
    if (autoplay()) { this.hint.textContent = `🤖 ${u.name} is acting on their own...`; return aiTurn(e, u); }
    return new Promise((resolve) => {
      this.resolveTurn = resolve;
      this.unit = u;
      this.mode = null;
      sfx('click');
      this.gm.tip('yourTurn');
      if (e.fullAttackList(u, 'ranged').length > 1 || e.fullAttackList(u, 'melee').length > 1) this.gm.tip('fullAttack');
      keyHandler = (e) => {
        if (this.busy || !this.resolveTurn) return;
        const i = digit(e);
        const btns = [...this.actions.querySelectorAll('button')];
        if (i >= 0 && btns[i] && !btns[i].disabled) btns[i].click();
        else if (e.key === 'Escape') this.menu();
        else if (e.key.toLowerCase() === 'e' && !this.mode) this.endPlayerTurn();
      };
      this.menu();
    });
  }

  endPlayerTurn() {
    this.mode = null;
    this.view.setHighlights({});
    this.actions.innerHTML = '';
    this.hint.textContent = '';
    const r = this.resolveTurn;
    this.resolveTurn = null;
    if (r) { this.e.endTurn(); r(); }
  }

  async act(fn) {
    if (this.busy) return;
    this.busy = true;
    this.view.setHighlights({});
    this.actions.querySelectorAll('button').forEach((b) => { b.disabled = true; });
    this.hint.textContent = '';
    try { await fn(); } catch (err) { console.error(err); }
    this.busy = false;
    this.mode = null;
    if (this.e.result() || this.e.turnOver() || !this.unit.canAct()) this.endPlayerTurn();
    else this.menu();
  }

  menu() {
    const e = this.e, u = this.unit;
    this.mode = null;
    this.view.setHighlights({});
    this.renderInfo(u);
    this.hint.textContent = 'Your turn! Choose an action.';
    const enemies = e.enemiesOf(u);
    const s = u.stats();
    const canMove = e.canUse('move') && !e.b.stepped && e.reachable(u, s.speed).size > 0;
    const attackable = enemies.filter((t) => e.canAttack(u, t, 'melee') || e.canAttack(u, t, 'ranged'));
    const spells = e.knownSpells(u).filter((k) => k.left > 0);
    const abil = e.abilities(u).filter((a) => a.ok && a.left > 0 && e.canUse(a.action === 'swift*' ? 'swift' : a.action));
    const chargeable = (e.canUse('full') || (e.b.single && !e.b.singleUsed)) ? enemies.filter((t) => e.chargePath(u, t)) : [];
    const steps = e.stepOptions(u);
    const prof = s.attacks.ranged[0];
    const needsReload = prof?.reload && !u.loaded;
    this.actions.innerHTML = '';
    const B = (label, sub, fn, ok) => this.actions.append(h('button', { class: `act ${ok ? '' : 'off'}`, disabled: !ok, onclick: () => { sfx('click'); fn(); } }, h('kbd', {}, this.actions.children.length + 1), h('b', {}, label), h('small', {}, sub)));
    B('Move', `${s.speed} ft`, () => this.modeMove(), canMove);
    B('Attack', needsReload && attackable.every((t) => !e.adjacent(u, t)) ? 'reload+shoot' : 'standard', () => this.modeAttack(attackable), e.canUse('std') && attackable.length > 0);
    B('Cast', s.caster ? `${spells.length} spells` : '—', () => this.spellMenu(), !!s.caster && e.canUse('std') && spells.length > 0);
    B('Ability', abil.length ? abil[0].name : '—', () => this.abilityMenu(abil), abil.length > 0);
    B('Item', `${G.state.potions} potions`, () => this.modeItem(), G.state.potions > 0 && e.canUse('std'));
    B('5ft Step', 'no AoO', () => this.modeStep(steps), steps.length > 0);
    B('Charge', 'full-round', () => this.modeCharge(chargeable), chargeable.length > 0);
    B('More', 'options', () => this.moreMenu(), true);
    B('End Turn', '', () => this.endPlayerTurn(), true);
  }

  cancelBtn(text) {
    this.hint.textContent = text;
    this.actions.innerHTML = '';
    this.actions.append(h('button', { class: 'act wide', onclick: () => { sfx('click'); this.menu(); } }, h('b', {}, 'Cancel')));
  }

  modeMove() {
    const e = this.e, u = this.unit;
    const reach = e.reachable(u, u.stats().speed);
    const cells = [...reach.values()];
    this.mode = { type: 'move', reach };
    this.view.setHighlights({ cells: cells.filter((c) => c.aoo === 0), color: 'rgba(80,160,255,0.38)', area: cells.filter((c) => c.aoo > 0), areaColor: 'rgba(255,170,60,0.4)' });
    this.cancelBtn(e.b.move ? 'Tap a blue square to move. Orange squares provoke attacks of opportunity.' : 'Second move (uses your standard action).');
  }
  modeAttack(targets) {
    this.mode = { type: 'attack', targets };
    this.view.setHighlights({ targets });
    this.cancelBtn('Tap a target. Adjacent foes get melee, distant ones get your ranged weapon.');
  }
  modeStep(cells) {
    this.mode = { type: 'step', cells };
    this.view.setHighlights({ cells, color: 'rgba(80,255,220,0.35)' });
    this.cancelBtn('Tap a square to take a 5-foot step (no attacks of opportunity).');
  }
  modeCharge(targets) {
    this.mode = { type: 'charge', targets };
    this.view.setHighlights({ targets });
    this.cancelBtn('Charge: move up to double speed in a straight line and attack at +2 (-2 AC until your next turn).');
  }
  modeItem() {
    const e = this.e, u = this.unit;
    const targets = e.alliesOf(u, true).filter((a) => !a.dead && (a === u || e.adjacent(u, a)) && a.hp < a.maxHp);
    if (!targets.length) { toast('No one nearby needs healing.'); return; }
    this.mode = { type: 'item', targets };
    this.view.setHighlights({ targets, cells: targets.map((t) => ({ x: t.x, y: t.y })), color: 'rgba(120,255,140,0.35)' });
    this.cancelBtn('Potion of cure light wounds (1d8+1): tap yourself or an adjacent ally. Provokes.');
  }

  spellMenu() {
    const e = this.e, u = this.unit;
    const known = e.knownSpells(u);
    this.actions.innerHTML = '';
    this.hint.textContent = 'Choose a spell.';
    const list = h('div', { class: 'spell-list' });
    for (const k of known.sort((a, b) => a.level - b.level)) {
      const sp = SPELLS[k.key];
      list.append(h('button', { class: `spell ${k.left > 0 ? '' : 'off'}`, disabled: k.left <= 0, onclick: () => { sfx('click'); this.modeSpell(k.key); } },
        h('b', {}, sp.name), h('span', { class: 'lvl' }, k.level === 0 ? '∞' : `L${k.level} ×${k.left}`), h('small', {}, sp.desc)));
    }
    this.actions.append(list, h('button', { class: 'act wide', onclick: () => this.menu() }, h('b', {}, 'Back')));
  }

  modeSpell(key) {
    const e = this.e, u = this.unit;
    const sp = SPELLS[key];
    if (sp.target === 'self' || sp.target === 'party') { this.act(() => e.cast(u, key, u)); return; }
    if (sp.target === 'area') {
      const cells = [];
      for (let y = 0; y < e.map.h; y++) for (let x = 0; x < e.map.w; x++) {
        if (sp.area.shape === 'cone' ? e.cheb(u, { x, y }) === 1 : e.validSpellTarget(u, key, { x, y })) cells.push({ x, y });
      }
      this.mode = { type: 'area', key, cells, pending: null };
      this.view.setHighlights({ cells, color: 'rgba(200,120,255,0.25)' });
      this.cancelBtn(sp.area.shape === 'cone' ? 'Tap a square next to you to aim the cone, then tap again to cast.' : 'Tap where to center the spell, then tap again to confirm. It affects allies too!');
      return;
    }
    const targets = e.units.filter((t) => e.validSpellTarget(u, key, t));
    if (!targets.length) { toast('No valid targets in range.'); return; }
    this.mode = { type: 'spell', key, targets };
    this.view.setHighlights({ targets, cells: targets.map((t) => ({ x: t.x, y: t.y })), color: 'rgba(200,120,255,0.3)' });
    this.cancelBtn(`${sp.name}: tap a target.`);
  }

  abilityMenu(abil) {
    const e = this.e, u = this.unit;
    this.actions.innerHTML = '';
    this.hint.textContent = 'Choose an ability.';
    const list = h('div', { class: 'spell-list' });
    for (const a of abil) {
      list.append(h('button', { class: 'spell', onclick: () => {
        sfx('click');
        if (a.target === 'enemy') {
          const targets = e.enemiesOf(u).filter((t) => e.los(u, t));
          this.mode = { type: 'ability', key: a.key, targets };
          this.view.setHighlights({ targets });
          this.cancelBtn(`${a.name}: tap an enemy.`);
        } else if (a.target === 'ally' && a.key !== 'wake') {
          const targets = e.alliesOf(u, true).filter((t) => !t.dead && (t === u || e.adjacent(u, t)));
          this.mode = { type: 'ability', key: a.key, targets };
          this.view.setHighlights({ targets, cells: targets.map((t) => ({ x: t.x, y: t.y })), color: 'rgba(120,255,140,0.35)' });
          this.cancelBtn(`${a.name}: tap yourself or an adjacent ally.`);
        } else this.act(() => e.useAbility(u, a.key, a.auto));
      } }, h('b', {}, a.name), h('span', { class: 'lvl' }, a.left === Infinity ? a.action : `×${a.left} · ${a.action.replace('*', '')}`), h('small', {}, a.desc || '')));
    }
    this.actions.append(list, h('button', { class: 'act wide', onclick: () => this.menu() }, h('b', {}, 'Back')));
  }

  moreMenu() {
    const e = this.e, u = this.unit;
    const s = u.stats();
    const enemies = e.enemiesOf(u);
    const prof = s.attacks.ranged[0];
    this.actions.innerHTML = '';
    this.hint.textContent = 'More options.';
    const list = h('div', { class: 'spell-list' });
    const add = (name, desc, ok, fn) => list.append(h('button', { class: `spell ${ok ? '' : 'off'}`, disabled: !ok, onclick: () => { sfx('click'); fn(); } }, h('b', {}, name), h('small', {}, desc)));
    if (s.feats.has('powerAttack')) add(`Power Attack: ${u.powerAttack ? 'ON' : 'OFF'}`, `Free toggle: -${1 + Math.floor(s.bab / 4)} melee attack, +${2 * (1 + Math.floor(s.bab / 4))} damage (×1.5 two-handed).`, true, () => { u.powerAttack = !u.powerAttack; this.menu(); });
    const fullR = e.fullAttackList(u, 'ranged').length > 1 && e.canUse('full');
    const fullTargets = enemies.filter((t) => e.canAttack(u, t, 'ranged'));
    add('Full Attack (Rapid Shot)', 'Full-round: two ranged attacks at -2 each.', fullR && fullTargets.length > 0, () => { this.mode = { type: 'full', targets: fullTargets }; this.view.setHighlights({ targets: fullTargets }); this.cancelBtn('Tap a target for your full attack.'); });
    const cleaveT = enemies.filter((t) => e.adjacent(u, t));
    add('Cleave', 'Attack; if you hit, attack another adjacent foe. -2 AC.', s.feats.has('cleave') && e.canUse('std') && cleaveT.length > 0, () => { this.mode = { type: 'cleave', targets: cleaveT }; this.view.setHighlights({ targets: cleaveT }); this.cancelBtn('Tap the first cleave target.'); });
    add('Auto (AI plays this turn)', 'Let your hero act on their own this turn.', true, () => this.act(() => aiTurn(e, u)));
    add('Total Defense', 'Standard action: +4 dodge AC until your next turn.', e.canUse('std'), () => this.act(() => e.totalDefense(u)));
    const dying = e.alliesOf(u).filter((a) => a.hp < 0 && !a.stable && !a.dead && e.adjacent(u, a));
    add('Stabilize ally (Heal DC 15)', 'Standard action on an adjacent dying ally. Provokes.', e.canUse('std') && dying.length > 0, () => this.act(() => e.stabilizeCheck(u, dying[0])));
    if (prof && prof.reload && !u.loaded) add('Reload', 'Move action: reload your crossbow. Provokes.', e.b.move, () => this.act(() => e.ensureLoaded(u, prof)));
    this.actions.append(list, h('button', { class: 'act wide', onclick: () => this.menu() }, h('b', {}, 'Back')));
  }

  tap(x, y) {
    const e = this.e;
    const unitHere = e.units.find((t) => t.x === x && t.y === y && !t.dead);
    if (!this.mode || this.busy) { if (unitHere) this.renderInfo(unitHere, true); return; }
    const u = this.unit;
    const m = this.mode;
    const isTarget = (list) => list.find((t) => t.x === x && t.y === y);
    switch (m.type) {
      case 'move': if (m.reach.has(`${x},${y}`)) this.act(() => e.moveTo(u, x, y)); break;
      case 'step': if (m.cells.some((c) => c.x === x && c.y === y)) this.act(() => e.step(u, x, y)); break;
      case 'attack': { const t = isTarget(m.targets); if (t) this.act(() => e.attack(u, t, e.canAttack(u, t, 'melee') ? 'melee' : 'ranged')); else if (unitHere) this.renderInfo(unitHere, true); break; }
      case 'full': { const t = isTarget(m.targets); if (t) this.act(() => e.fullAttack(u, t, 'ranged')); break; }
      case 'cleave': { const t = isTarget(m.targets); if (t) this.act(() => e.cleave(u, t)); break; }
      case 'charge': { const t = isTarget(m.targets); if (t) this.act(() => e.charge(u, t)); break; }
      case 'item': { const t = isTarget(m.targets); if (t) this.act(() => e.usePotion(u, t, G.state)); break; }
      case 'spell': { const t = isTarget(m.targets); if (t) this.act(() => e.cast(u, m.key, t)); break; }
      case 'ability': { const t = isTarget(m.targets); if (t) this.act(() => e.useAbility(u, m.key, t)); break; }
      case 'area': {
        if (!m.cells.some((c) => c.x === x && c.y === y)) break;
        if (m.pending && m.pending.x === x && m.pending.y === y) { this.act(() => e.cast(u, m.key, { x, y })); break; }
        m.pending = { x, y };
        const area = e.areaCells(SPELLS[m.key], u, { x, y });
        const hit = e.unitsInArea(SPELLS[m.key], u, { x, y });
        this.view.setHighlights({ cells: m.cells, color: 'rgba(200,120,255,0.2)', area, targets: hit });
        const allies = hit.filter((t) => t.side === u.side);
        this.hint.textContent = `Hits ${hit.length} creature${hit.length === 1 ? '' : 's'}${allies.length ? ` (incl. ${allies.length} ally!)` : ''}. Tap again to cast.`;
        break;
      }
      default: break;
    }
  }

  // -------------------------------------------------- results
  finish(res) {
    this.view.setHighlights({});
    if (res === 'victory') {
      sfx('win');
      const p = player();
      if (p.dead && !this.enc.soloPlayer) { this.defeat(true); return; }
      for (const c of G.state.party) if (c.dead) { c.dead = false; c.hp = 1; }
      G.state.checkpoint = null; G.state.checkpointNode = null;
      save();
      setTimeout(() => {
        const m = modal('Victory!', h('div', { class: 'center' }, h('div', { class: 'big gold' }, '★ Victory! ★'), h('p', {}, `The ${this.enc.title.toLowerCase()} is won.`),
          h('div', { class: 'victory-party' }, G.state.party.map((c) => h('div', {}, portraitOf(c, 3), h('small', {}, `${c.hp}/${maxHp(c)}`))))),
        [{ label: 'Continue', cls: 'primary', onClick: () => { this.view.destroy(); G.state.nodeApplied = false; enterNode(this.node.win); } }], { onClose: false });
        if (autoplay()) setTimeout(() => { if (m.el.isConnected && autoplay()) m.el.querySelector('.btn.primary')?.click(); }, 2400 / prefs.speed);
      }, 500);
    } else this.defeat(false);
  }

  defeat(playerDied) {
    sfx('lose');
    stopMusic();
    const retry = () => { const ap = G.state.autoplay; this.view.destroy(); restore(G.state.checkpoint); G.state.autoplay = ap; save(); startCombat(G.state.node); };
    setTimeout(() => {
      const m = modal(playerDied ? 'You have fallen' : 'Defeat', h('div', { class: 'center' }, h('p', {}, playerDied ? 'Your companions win the day, but you do not live to see it.' : 'The party falls. Darkness closes in...'), h('p', { class: 'small dim' }, 'Try again: the battle restarts with your party as it was before the fight.')),
        [{ label: 'Retry Battle', cls: 'primary', onClick: retry },
          { label: 'Title', onClick: () => { this.view.destroy(); restore(G.state.checkpoint); save(); showTitle(); } }], { onClose: false });
      if (autoplay()) setTimeout(() => { if (m.el.isConnected && autoplay()) { m.close(); retry(); } }, 2600 / prefs.speed);
    }, 700);
  }
}

export { draft };
