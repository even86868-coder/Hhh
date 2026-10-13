// Who says each quoted line in the story text, so characters voice their own words and
// the narrator reads the rest. Shared by the game and tools/voice-lines.mjs (which records
// exactly the pieces the game will look up).
import { normalizeLine } from './voicekey.js';

export const COMPANION_NAMES = ['Brannoc', 'Tamsin', 'Quillan', 'Pip'];

// Story characters -> recorded voice.
export const NPC_VOICES = {
  Ameiko: 'ameiko', Zantus: 'zantus', Hemlock: 'hemlock', Aldern: 'aldern', Foxglove: 'aldern', Shalelu: 'shalelu',
  Tsuto: 'tsuto', Orik: 'orik', Erylium: 'erylium', Bruthazmus: 'bruthazmus', Lyrie: 'lyrie', Nualia: 'nualia', Ripnugget: 'ripnugget', Mirela: 'mirela',
  Ogwen: 'granny', Corinne: 'granny', Quink: 'oldman', Wenzel: 'oldman', Dunmore: 'oldman', Kell: 'oldman',
  Pell: 'townsman', Dobbs: 'townsman', Jargie: 'townsman', Tolly: 'townsman', Rosto: 'thug', Wren: 'child',
  Nibsy: 'goblin', Chuffwhistle: 'goblin', Chuff: 'goblin', Gubbles: 'goblin', Brand: 'woman', Cook: 'townsman',
};
// Quotes the rules below get wrong, by how the quote starts. null = read by the narrator
// (signs, ledgers, journals); 'hero' = the player.
const QUOTE_SPEAKERS = [
  ['Sergeant.', 'Dunmore'], ["Twelve years I've meant to tell you", 'Dunmore'], ['Dunmore left this with me', 'Hemlock'],
  ["By the wall. It's wet", 'Wren'], ['Quillan. Quillan. Hey.', 'hero'],
  ['Six years, little rat', 'Mirela'], ['You owe the Goldtooth family', 'Mirela'], ['Fine. The heroes of Sandpoint get', 'Mirela'],
  ['When you leave town for good', 'Mirela'], ['Leaving town, little rat?', 'Mirela'], ['Give me the locket', 'Mirela'], ['Pleasure doing business, little rat.', 'Mirela'],
  ['My Annick. My pearl.', 'Corinne'], ['Annick, my pearl.', null],
  ['Lyrie Akenja.', 'Lyrie'], ['an illiterate magpie.', 'Lyrie'], ['O. Vancaskerkin', null], ['Do not pay.', null],
  ['voice in the runes', null], ["the Mistress's hound", null], ['what sleeps beneath Thistletop', null], ['the catacombs of wrath', null],
  ['Is just barrel.', 'Gubbles'], ['Is over? Barrel can go now?', 'Gubbles'], ['Is barrel.', 'Gubbles'], ['in very large letters', null],
  ['That one will write you every week', 'Cook'], ['Longshanks! Longshanks killed the chief!', 'Nibsy'],
  ['Chuffwhistle the Clever greets you!', 'Chuffwhistle'], ['Protection is cheap.', 'Rosto'], ['Rebuilding after a goblin raid', 'Rosto'], ["That's the first time they've smiled", 'Brand'], ["On the house. Don't tell the quartermaster.", 'Brand'],
];
// Quotes introduced as writing ("a ledger in tidy handwriting: ...", "marked only ...") are read by the narrator.
const DOCUMENT = /\b(reads|written|handwriting|scrawled|carved|inscribed|ledger|note|letter|journal|engraved|labeled|marked only)\b[^.!?"]*$/i;
const FEMALE = new Set(['Tamsin', 'Ameiko', 'Shalelu', 'Nualia', 'Lyrie', 'Mirela', 'Ogwen', 'Corinne', 'Wren', 'Brand']);
// Story scenes whose quotes default to someone when the text doesn't say who is talking.
const NPC_SPRITES = { ameiko: 'Ameiko', zantus: 'Zantus', aldern: 'Aldern', hemlock: 'Hemlock', shalelu: 'Shalelu', tsuto: 'Tsuto', orik: 'Orik', nualia: 'Nualia' };
export function defaultSpeaker(nodeId, node) {
  const arc = /^cq_(brannoc|tamsin|quillan|pip)/.exec(nodeId || '');
  if (arc) return arc[1][0].toUpperCase() + arc[1].slice(1);
  return (node && NPC_SPRITES[node.npc]) || null;
}

const VERBS = 'says|said|asks|asked|whispers|mutters|shouts|calls|snaps|growls|hisses|adds|replies|murmurs|announces|insists|admits|groans|breathes|cries|yells|answers|repeats|declares|explains|offers|grunts|sighs|laughs|grumbles|demands|squeaks|bellows|chirps|purrs|barks|calls out|tells you|tells them';
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Split narration into [{ who, text }]: who is a character name, 'hero' (the player) or null (narrator).
export function splitDialogue(text, { playerName = '', fallback = null } = {}) {
  const names = [...COMPANION_NAMES, ...Object.keys(NPC_VOICES), ...(playerName ? [playerName] : [])];
  const nameRe = new RegExp(`(${names.map(esc).join('|')})(?:'s)?\\b`, 'g');
  const asWho = (n) => (n === playerName ? 'hero' : n);
  // Last character named as a subject (possessives like "Tsuto's confession" don't count).
  const lastName = (s) => { let m, last = null; nameRe.lastIndex = 0; while ((m = nameRe.exec(s))) if (!m[0].endsWith("'s") || !s.slice(0, m.index).trim()) last = m[1]; return last; };
  const out = [];
  const push = (who, t) => {
    t = normalizeLine(t).replace(/^[\s,;:—–-]+/, '');
    if (!/[A-Za-z0-9]/.test(t)) return;
    const prev = out[out.length - 1];
    if (prev && prev.who === who && who === null && !prev.para) prev.text += ` ${t}`;
    else out.push({ who, text: t });
  };
  let lastSpeaker = null;
  // Characters named as the subject of narration ("Tsuto's journal" doesn't count; "Lyrie's eyes narrow" does).
  const subjects = (p) => {
    const found = []; let m; nameRe.lastIndex = 0;
    while ((m = nameRe.exec(p))) if (!m[0].endsWith("'s") || /(^|[.!?…]\s+|,\s+)$/.test(p.slice(0, m.index))) found.push(m[1]);
    return found;
  };
  const named = []; // subjects so far in this scene
  let paraNamed = []; // ...and in this paragraph
  const pronoun = (word) => {
    const fem = word.toLowerCase() === 'she';
    const fits = (n) => n && n !== playerName && n !== 'hero' && FEMALE.has(n) === fem;
    return [...paraNamed].reverse().find(fits) || [...named].reverse().find(fits) || (fits(lastSpeaker) && lastSpeaker) || lastSpeaker || fallback;
  };
  for (const para of String(text).split(/\n\s*\n/)) {
    paraNamed = [];
    if ((para.match(/"/g) || []).length % 2) { named.push(...subjects(para)); push(null, para); out[out.length - 1] && (out[out.length - 1].para = true); continue; }
    const parts = para.split(/("[^"]*")/);
    let seen = null; // last character named as a subject so far in this paragraph
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (!p.startsWith('"')) { push(null, p); const n = lastName(p); if (n) seen = n; const subj = subjects(p); paraNamed.push(...subj); named.push(...subj); continue; }
      const inner = p.slice(1, -1).trim();
      const words = inner.split(/\s+/).length;
      const prevText = parts[i - 1] || '';
      const startsSentence = !prevText.trim() || /[.!?…]\s*$/.test(prevText);
      const before = prevText.trim().split(/[.!?…]\s+/).pop(); // the sentence leading into the quote
      // Speech, not a quoted word ('one glyph means "doom"'): a sentence, an exclamation, or a line broken by "she says".
      const speech = /[A-Za-z]/.test(inner) && (words >= 3 || /[!?…,—–-]$/.test(inner) || (/\.$/.test(inner) && (words >= 2 || startsSentence)));
      const after = (parts[i + 1] || '').split(/[.!?…](\s|$)/)[0];
      const fixed = QUOTE_SPEAKERS.find(([start]) => inner.startsWith(start));
      if (!speech || (fixed && fixed[1] === null) || (!fixed && DOCUMENT.test(before))) { push(null, p); continue; }
      let who = fixed ? fixed[1] : null;
      const a1 = new RegExp(`^\\s*,?\\s*(?:${VERBS})\\s+(?:${names.map(esc).join('|')})`).exec(after);
      const a2 = new RegExp(`^\\s*,?\\s*(${names.map(esc).join('|')})\\s+(?:${VERBS})`).exec(after);
      if (who) { /* fixed above */ } else if (a1) who = asWho(lastName(a1[0]));
      else if (a2) who = asWho(a2[1]);
      else if (new RegExp(`^\\s*,?\\s*(he|she)\\s+(?:${VERBS})`, 'i').test(after)) who = asWho(pronoun(/^\s*,?\s*(he|she)/i.exec(after)[1]));
      else if (/^\s*,?\s*you\s+(?:say|ask|tell|call|shout|whisper|add|reply|answer|mutter|explain|insist|offer)/i.test(after)) who = 'hero';
      else if (/\byou\s+(?:say|ask|tell|call|shout|whisper|add|reply|answer|mutter|explain|insist|offer)\b[^"]*$/i.test(before)) who = 'hero';
      else if (lastName(before)) who = asWho(lastName(before));
      else if (/(^|\s)(he|she)\s/i.test(before)) who = asWho(pronoun(/(?:^|\s)(he|she)\s/i.exec(before)[1])); // "She hands you a bottle. "...""
      else if (seen) who = asWho(seen);
      else who = lastSpeaker || fallback;
      if (!who) { push(null, p); continue; }
      out.push({ who, text: normalizeLine(inner) });
      if (!fixed) lastSpeaker = who;
    }
    if (out.length) out[out.length - 1].para = true; // keep narration from merging across paragraphs
  }
  return out.map(({ who, text: t }) => ({ who, text: t }));
}
