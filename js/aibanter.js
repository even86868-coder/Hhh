// Optional live AI banter via the Claude API, using the player's own API key.
// Falls back to written lines (returns null) on any problem.
import { CAST, PERSONALITIES } from './dialogue.js';

export const AI_MODELS = [
  { id: 'claude-opus-5-5', name: 'Claude Opus 5.5 (best writing, default)' },
  { id: 'claude-sonnet-5-5', name: 'Claude Sonnet 5.5 (balanced)' },
  { id: 'claude-haiku-5-5', name: 'Claude Haiku 5.5 (cheapest, fastest)' },
];
export const aiSettings = { enabled: false, model: 'claude-opus-5-5' };

const KEY_STORE = 'runelords.anthropicKey';
export function getApiKey() { try { return localStorage.getItem(KEY_STORE) || ''; } catch (e) { return ''; } }
export function setApiKey(k) { try { if (k) localStorage.setItem(KEY_STORE, k.trim()); else localStorage.removeItem(KEY_STORE); } catch (e) { /* ignore */ } sdk = null; }
export const aiReady = () => aiSettings.enabled && !!getApiKey() && navigator.onLine !== false;

let sdk = null;
let pausedUntil = 0;
async function getClient() {
  if (!sdk) {
    const { Anthropic } = await import('./vendor/anthropic-sdk.js');
    sdk = { Anthropic, client: new Anthropic({ apiKey: getApiKey(), dangerouslyAllowBrowser: true, maxRetries: 1, timeout: 25000 }) };
  }
  return sdk;
}

const SYSTEM = `You write in-character party banter for a cute pixel-art fantasy RPG based on the Rise of the Runelords adventure path (Pathfinder). The tone is warm, funny and adventurous, suitable for all ages.
Rules:
- Write short spoken lines only: one or two sentences each, under 25 words. No narration, no stage directions, no emoji.
- Stay true to each speaker's personality and react specifically to the situation given.
- Characters can tease, comfort or disagree with each other. Never repeat a line from the "recent lines" list.
- Only use the speakers you are given.`;

function castSheet(party, hero) {
  return party.map((c) => {
    if (c.isPlayer) return `- ${c.name} (the player's hero, ${c.raceName} ${c.className}): ${PERSONALITIES[hero]?.desc || 'brave'}`;
    return `- ${c.name}: ${CAST[c.name] || 'adventurer'}`;
  }).join('\n');
}

const recent = [];

// party: [{ name, isPlayer, raceName, className }], situation: text, count: lines wanted
export async function generateBanter({ party, heroPersonality, situation, count = 3 }) {
  if (!aiReady() || Date.now() < pausedUntil) return null;
  const names = party.map((c) => c.name);
  const schema = {
    type: 'object',
    properties: {
      lines: {
        type: 'array',
        items: {
          type: 'object',
          properties: { speaker: { type: 'string', enum: names }, text: { type: 'string' } },
          required: ['speaker', 'text'],
          additionalProperties: false,
        },
      },
    },
    required: ['lines'],
    additionalProperties: false,
  };
  const prompt = `Speakers:\n${castSheet(party, heroPersonality)}\n\nSituation: ${situation}\n\nRecent lines (don't repeat): ${recent.slice(-8).join(' | ') || 'none'}\n\nWrite ${count} line${count > 1 ? 's' : ''} of banter between different speakers, reacting to this moment.`;
  try {
    const { Anthropic, client } = await getClient();
    const params = {
      model: aiSettings.model,
      max_tokens: 2000,
      system: SYSTEM,
      output_config: { effort: 'low', format: { type: 'json_schema', schema } },
      messages: [{ role: 'user', content: prompt }],
    };
    // Server-side refusal fallback where supported (not available for Haiku).
    if (aiSettings.model !== 'claude-haiku-5-5') { params.betas = ['server-side-fallback-2026-07-01']; params.fallbacks = 'default'; }
    let res;
    try {
      res = await client.beta.messages.create(params);
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) { aiSettings.lastError = 'API key rejected'; aiSettings.enabled = false; }
      else if (err instanceof Anthropic.RateLimitError) { aiSettings.lastError = 'Rate limited, pausing AI banter for a minute'; pausedUntil = Date.now() + 60000; }
      else if (err instanceof Anthropic.APIError) { aiSettings.lastError = `API error ${err.status ?? ''}`.trim(); }
      else aiSettings.lastError = 'Could not reach the Claude API';
      return null;
    }
    if (res.stop_reason === 'refusal' || res.stop_reason === 'max_tokens') return null;
    const text = res.content.find((b) => b.type === 'text')?.text;
    if (!text) return null;
    const out = JSON.parse(text).lines
      .filter((l) => names.includes(l.speaker) && l.text && l.text.length < 220)
      .slice(0, count + 1);
    for (const l of out) recent.push(l.text);
    aiSettings.lastError = null;
    return out.length ? out : null;
  } catch (e) {
    return null;
  }
}

export async function testConnection() {
  const party = [{ name: 'Pip', isPlayer: false }, { name: 'Brannoc', isPlayer: false }];
  const r = await generateBanter({ party, heroPersonality: 'cheerful', situation: 'The party is testing whether their magic speaking stones work.', count: 2 });
  return r ? { ok: true, lines: r } : { ok: false, error: aiSettings.lastError || 'No response' };
}
