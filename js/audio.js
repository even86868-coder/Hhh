// Tiny chiptune synth: sound effects and looping background tunes via WebAudio.
let ctx = null;
let master = null;
let musicGain = null;
let musicTimer = null;
let currentTune = null;
export const settings = { sfx: true, music: true };

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.25; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.35; musicGain.connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, { type = 'square', vol = 0.5, slide = 0, delay = 0, dest = null } = {}) {
  const a = ac(); if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(dest || master);
  o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol = 0.3, delay = 0) {
  const a = ac(); if (!a) return;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = a.createBufferSource(), g = a.createGain();
  s.buffer = buf; g.gain.value = vol; s.connect(g); g.connect(master);
  s.start(a.currentTime + delay);
}

export function sfx(name) {
  if (!settings.sfx) return;
  switch (name) {
    case 'click': tone(880, 0.05, { vol: 0.2 }); break;
    case 'step': tone(220, 0.04, { type: 'triangle', vol: 0.25 }); break;
    case 'swing': noise(0.08, 0.15); break;
    case 'hit': noise(0.1, 0.35); tone(160, 0.1, { slide: -80, vol: 0.4 }); break;
    case 'crit': noise(0.15, 0.4); tone(300, 0.08, { vol: 0.4 }); tone(600, 0.15, { vol: 0.4, delay: 0.08 }); break;
    case 'miss': tone(400, 0.12, { type: 'triangle', slide: -200, vol: 0.2 }); break;
    case 'spell': tone(500, 0.25, { type: 'sine', slide: 600, vol: 0.3 }); tone(750, 0.25, { type: 'sine', slide: 400, vol: 0.2, delay: 0.05 }); break;
    case 'heal': [523, 659, 784].forEach((f, i) => tone(f, 0.15, { type: 'sine', vol: 0.3, delay: i * 0.07 })); break;
    case 'down': tone(300, 0.4, { slide: -250, vol: 0.4 }); break;
    case 'win': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, { vol: 0.3, delay: i * 0.12 })); break;
    case 'lose': [392, 330, 262, 196].forEach((f, i) => tone(f, 0.3, { vol: 0.3, delay: i * 0.2 })); break;
    case 'dice': for (let i = 0; i < 5; i++) tone(600 + Math.random() * 400, 0.03, { vol: 0.15, delay: i * 0.04 }); break;
    case 'success': tone(660, 0.1, { vol: 0.3 }); tone(990, 0.2, { vol: 0.3, delay: 0.1 }); break;
    case 'fail': tone(300, 0.15, { vol: 0.3 }); tone(220, 0.25, { vol: 0.3, delay: 0.12 }); break;
    case 'level': [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.15, { vol: 0.3, delay: i * 0.09 })); break;
    default: break;
  }
}

// note names -> freq
const N = (n) => {
  if (n === '-') return 0;
  const m = /^([A-G])(#?)(\d)$/.exec(n);
  const idx = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]] + (m[2] ? 1 : 0);
  return 440 * Math.pow(2, (idx - 9) / 12 + (+m[3] - 4));
};
const TUNES = {
  town: { bpm: 150, lead: 'E5 G5 A5 G5 E5 D5 C5 D5 E5 E5 G5 E5 D5 - - - C5 E5 G5 A5 G5 E5 D5 C5 D5 E5 D5 C5 C5 - - -', bass: 'C3 - G3 - A2 - E3 - F2 - C3 - G2 - D3 -' },
  battle: { bpm: 180, lead: 'A4 A4 C5 A4 D5 C5 A4 G4 A4 A4 C5 E5 D5 C5 B4 G4 A4 A4 C5 A4 D5 C5 A4 G4 E5 D5 C5 B4 A4 - A4 -', bass: 'A2 A2 A2 A2 F2 F2 G2 G2 A2 A2 A2 A2 E2 E2 E2 E2' },
  boss: { bpm: 170, lead: 'D5 - D5 F5 E5 - C5 - D5 - D5 A5 G5 - F5 E5 D5 - D5 F5 E5 - C5 - A4 - C5 D5 C#5 - - -', bass: 'D2 D2 D2 D2 A#1 A#1 C2 C2 D2 D2 D2 D2 A1 A1 A1 A1' },
  dungeon: { bpm: 100, lead: 'D4 - F4 - E4 - A3 - D4 - F4 G4 E4 - - - C4 - E4 - D4 - A3 - B3 - C4 D4 A3 - - -', bass: 'D2 - - - A1 - - - A#1 - - - A1 - - -' },
};

export function playMusic(name) {
  if (currentTune === name) return;
  stopMusic();
  currentTune = name;
  if (!settings.music || !TUNES[name]) return;
  const a = ac(); if (!a) return;
  const tune = TUNES[name];
  const lead = tune.lead.split(' '), bass = tune.bass.split(' ');
  const step = 60 / tune.bpm / 2;
  let i = 0;
  let next = a.currentTime + 0.05;
  const schedule = () => {
    while (next < a.currentTime + 0.3) {
      const l = N(lead[i % lead.length]);
      if (l) tone(l, step * 0.9, { vol: 0.18, dest: musicGain, delay: next - a.currentTime });
      if (i % 2 === 0) {
        const b = N(bass[(i / 2) % bass.length]);
        if (b) tone(b, step * 1.8, { type: 'triangle', vol: 0.35, dest: musicGain, delay: next - a.currentTime });
      }
      i++; next += step;
    }
  };
  musicTimer = setInterval(schedule, 100);
  schedule();
}
export function stopMusic() { if (musicTimer) clearInterval(musicTimer); musicTimer = null; currentTune = null; }
export function unlockAudio() { ac(); }
