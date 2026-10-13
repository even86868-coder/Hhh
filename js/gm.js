// The Game Master: frames the party's dialogue, explains skill checks and teaches
// the Pathfinder rules as they come up in battle.
import { SKILLS, ABIL_NAMES } from './rules.js';
import { GM_MORE } from './dialogue_more.js';

const pick = (a) => a[Math.floor(Math.random() * a.length)];

// Stage directions before a companion speaks.
const ACTIONS = {
  Brannoc: ['Brannoc grunts.', 'Brannoc folds both arms.', 'Brannoc rests a hand on his sword hilt.', 'Brannoc takes a long sip of ale.', 'Brannoc doesn\'t look up.', 'Brannoc rolls his shoulders.'],
  Tamsin: ['Tamsin smiles warmly.', 'Tamsin touches her sun amulet.', 'Tamsin frowns.', 'Tamsin steps forward.', 'Tamsin lets out a sigh.', 'Tamsin glances at everyone\'s wounds.'],
  Quillan: ['Quillan pushes up his spectacles.', 'Quillan flips through his notebook.', 'Quillan practically bounces.', 'Quillan raises a finger.', 'Quillan peers closer.', 'Quillan clears his throat.'],
  Pip: ['Pip grins.', 'Pip pockets something shiny.', 'Pip pops up from nowhere.', 'Pip tosses a coin.', 'Pip snickers.', 'Pip leans in close.'],
};
const HERO_ACTIONS = {
  heroic: ['{n} stands tall.', '{n} looks around at the others.', '{n} squares both shoulders.'],
  cheerful: ['{n} beams.', '{n} laughs.', '{n} claps happily.'],
  grim: ['{n} stares into the distance.', '{n} mutters.', '{n} checks a blade\'s edge.'],
  snarky: ['{n} rolls both eyes.', '{n} smirks.', '{n} raises an eyebrow.'],
};
const SCENE_INTROS = [
  'The party trades a few words.',
  'Your companions have something to say.',
  'A moment passes, and the party speaks up.',
  'Before you decide, your friends chime in.',
];
const CAMP_INTROS = [
  'Later, around the campfire...',
  'The fire crackles. The party settles in for the night.',
  'With the watch set, quiet conversation drifts around the fire.',
];

for (const [k, list] of Object.entries(GM_MORE.actions || {})) ACTIONS[k] = [...(ACTIONS[k] || []), ...list];
for (const [k, list] of Object.entries(GM_MORE.heroActions || {})) HERO_ACTIONS[k] = [...(HERO_ACTIONS[k] || []), ...list];
SCENE_INTROS.push(...(GM_MORE.sceneIntros || []));
CAMP_INTROS.push(...(GM_MORE.campIntros || []));

export const gmSettings = { mode: 'tips' }; // mirrors voiceSettings.gm; set by the UI

const VICTORY_LINES = ['And the battle is won.', 'Silence falls over the battlefield. You are victorious.', 'The last foe falls. Well played.'];
export const fallenLine = (name) => `${name} has fallen. The dice can be cruel.`;

// Every GM line that is spoken (for the recorded voice pack): the scene framing read in story
// scenes. Rules tips, dice rolls and battle announcements are shown on screen, not spoken.
export function ALL_GM_LINES() {
  return [...Object.values(ACTIONS).flat(), ...SCENE_INTROS, ...CAMP_INTROS];
}

export function sceneIntro(camp = false) { return pick(camp ? CAMP_INTROS : SCENE_INTROS); }

export function stageDirection(c, personality) {
  if (c.isPlayer) return pick(HERO_ACTIONS[personality] || HERO_ACTIONS.heroic).replace(/\{n\}/g, c.name);
  return ACTIONS[c.name] ? pick(ACTIONS[c.name]) : null;
}

// ---------------------------------------------------------------- skill checks
const skillName = (k) => ABIL_NAMES[k] || SKILLS[k]?.name || k;
const sgn = (n) => (n >= 0 ? `plus ${n}` : `minus ${Math.abs(n)}`);

export function explainCheck(check, whoName, mod, bonus) {
  const what = ABIL_NAMES[check.skill] ? `a ${skillName(check.skill)} check` : `a ${skillName(check.skill)} check`;
  const who = whoName === 'You' ? 'You roll' : `${whoName} rolls`;
  if (mod === null) return `This needs ${what}, but nobody here is trained in it.`;
  const b = bonus ? `, ${sgn(bonus)} for what you've learned` : '';
  return `This calls for ${what}. ${who} a twenty-sided die, ${sgn(mod)}${b}. The target is ${check.dc}.`;
}

export function explainResult(r) {
  if (r.untrained) return 'Without training, there is no chance. The attempt fails.';
  if (r.roll === 20) return `A natural twenty! ${r.total} beats ${r.dc}. Success!`;
  if (r.success) return `${r.roll}, for a total of ${r.total}. That meets the target of ${r.dc}. Success!`;
  return `${r.roll}, for a total of ${r.total}. The target was ${r.dc}. Not quite.`;
}

// ---------------------------------------------------------------- combat rules tips (each shown once per game)
export const TIPS = {
  initiative: 'Roll for initiative! Everyone rolls a twenty-sided die plus their Dexterity. Highest goes first. Until you take your first turn, you are flat-footed and lose your Dexterity bonus to Armor Class.',
  surprise: 'A surprise round! Only the side that noticed the other can act, and each gets just one quick action.',
  yourTurn: 'Your turn. Each round you get a standard action, like an attack or a spell, and a move action. You can trade the standard action for a second move. Tap an action, then tap a square or a target.',
  aoo: 'An attack of opportunity! Moving away from an enemy who threatens you, shooting, or casting next to one, gives them a free swing. A careful five-foot step avoids it.',
  flank: 'Flanking! With an ally on the opposite side of an enemy, both of you get plus two to hit. Rogues also deal sneak attack damage.',
  sneak: 'Sneak attack! Rogues deal extra damage dice to enemies that are flanked or caught flat-footed.',
  crit: 'A critical hit! A roll in a weapon\'s threat range is confirmed with a second attack roll. If it hits, the damage is multiplied.',
  charge: 'A charge moves up to double speed in a straight line for a plus two attack, at the cost of minus two Armor Class until your next turn.',
  intoMelee: 'Shooting into a crowded melee gives a minus four penalty, unless you have the Precise Shot feat.',
  powerAttack: 'Power Attack trades accuracy for damage: a small penalty to hit for a bigger hit.',
  dying: 'Below zero hit points, a character is dying and loses one hit point every round. A heal, a potion, or a Heal check can stabilize them. At negative hit points equal to their Constitution, they die.',
  defensive: 'Casting next to an enemy means casting defensively: a concentration check, or the spell fizzles.',
  dr: 'Damage reduction! Some creatures shrug off part of every weapon blow. Magic, or the right material, gets past it.',
  fullAttack: 'A full attack uses the whole turn to make every attack you\'re capable of, like monsters\' claws and bites, or a ranger\'s Rapid Shot.',
};

export class GMCommentator {
  constructor({ state, show }) {
    this.state = state;
    this.show = show; // (text) => void
    this.state.flags.gmTips = this.state.flags.gmTips || [];
  }
  get on() { return gmSettings.mode !== 'off'; }
  tip(key) {
    if (!this.on || this.state.flags.gmTips.includes(key)) return false;
    this.state.flags.gmTips.push(key);
    this.show(TIPS[key]);
    return true;
  }
  say(text) { if (gmSettings.mode === 'full') this.show(text); }

  handle(type, d, e) {
    switch (type) {
      case 'start': {
        const foes = e.units.filter((u) => u.side === 'enemy');
        if (e.surprise) this.tip('surprise');
        if (!this.tip('initiative')) {
          const boss = foes.find((u) => u.def.boss);
          this.say(boss ? `${boss.name} stands before you. Roll initiative!` : `${foes.length} foes close in. Roll initiative!`);
        }
        break;
      }
      case 'aoo': if (d.tgt.side === 'party') this.tip('aoo'); break;
      case 'notes':
        if (d.att.side !== 'party') break;
        if (d.notes.some((n) => n.startsWith('sneak'))) this.tip('sneak');
        else if (d.notes.some((n) => n.startsWith('flank'))) this.tip('flank');
        if (d.notes.some((n) => n.startsWith('charge'))) this.tip('charge');
        if (d.notes.some((n) => n.startsWith('into melee'))) this.tip('intoMelee');
        if (d.notes.some((n) => n.startsWith('power attack'))) this.tip('powerAttack');
        break;
      case 'crit': this.tip('crit'); break;
      case 'down': if (d.t.side === 'party' && !d.t.dead) this.tip('dying'); else if (d.t.side === 'party') this.say(fallenLine(d.t.name)); break;
      case 'defensive': if (d.u.side === 'party') this.tip('defensive'); break;
      case 'dr': this.tip('dr'); break;
      case 'end':
        if (d.res === 'victory') this.say(pick(VICTORY_LINES));
        break;
      default: break;
    }
  }
}
