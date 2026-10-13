// Dice utilities. The RNG can be swapped for a seeded one (used by tests).
let _rng = Math.random;
export const setRng = (f) => { _rng = f; };
export const rand = () => _rng();
export const d = (n) => 1 + Math.floor(_rng() * n);

export function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Roll `n` dice of `s` sides. Returns { total, rolls }.
export function dice(n, s) {
  const rolls = [];
  let total = 0;
  for (let i = 0; i < n; i++) { const r = d(s); rolls.push(r); total += r; }
  return { total, rolls };
}

// Parse "2d6+3" -> { n:2, s:6, b:3 }
export function parse(expr) {
  if (typeof expr === 'object') return expr;
  const m = /^(\d+)d(\d+)([+-]\d+)?$/.exec(String(expr).replace(/\s/g, ''));
  if (!m) return { n: 0, s: 0, b: parseInt(expr, 10) || 0 };
  return { n: +m[1], s: +m[2], b: m[3] ? +m[3] : 0 };
}

export function roll(expr) {
  const p = parse(expr);
  const r = dice(p.n, p.s);
  return { total: r.total + p.b, rolls: r.rolls, bonus: p.b };
}

export const mod = (score) => Math.floor((score - 10) / 2);
export const sign = (n) => (n >= 0 ? `+${n}` : `${n}`);
export const pick = (arr) => arr[Math.floor(_rng() * arr.length)];
