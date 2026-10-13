// Combat canvas renderer + animation hooks (the engine's `fx`).
import { drawTile, spriteFor, makeCanvas } from './sprites.js';
import { sfx } from './audio.js';

const S = 4; // screen pixels per art pixel
const TS = 16;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const STATUS_COLORS = {
  blessed: '#fff7a8', inspired: '#ffe066', rage: '#ff4030', asleep: '#8fa8ff', unconscious: '#ff8ae0', stunned: '#ff8ae0',
  held: '#ffffff', shaken: '#a080ff', sickened: '#b0e060', blinded: '#ffe066', dazed: '#e0b0ff', prone: '#cccccc',
  shieldOfFaith: '#9ec2ff', mageArmor: '#9ec2ff', shieldSpell: '#9ec2ff', divineFavor: '#fff7a8', smiting: '#ffd84a', fatigued: '#888888',
  dexDamage: '#7aff7a', acidArrow: '#9be05a', bullStrength: '#ffb070', totalDefense: '#9ec2ff',
};

export class CombatView {
  constructor(canvas, engine) {
    this.canvas = canvas;
    this.e = engine;
    const { w, h } = engine.map;
    this.W = w * TS; this.H = h * TS;
    canvas.width = this.W * S; canvas.height = this.H * S;
    this.ctx = canvas.getContext('2d');
    this.low = makeCanvas(this.W, this.H);
    this.lctx = this.low.getContext('2d');
    this.pos = new Map();
    for (const u of engine.units) this.pos.set(u.id, { x: u.x, y: u.y });
    this.floats = [];
    this.projectiles = [];
    this.flashes = new Map();
    this.lunges = new Map();
    this.areaFx = null;
    this.hl = { cells: [], color: null, targets: [], area: [], areaColor: null };
    this.bannerText = null;
    this.onCell = null;
    this.onLog = null;
    this.speed = 1;
    this.running = true;
    canvas.addEventListener('pointerdown', (ev) => this.handlePointer(ev));
    const loop = (t) => { if (!this.running) return; this.draw(t); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  destroy() { this.running = false; }

  handlePointer(ev) {
    const r = this.canvas.getBoundingClientRect();
    const x = Math.floor(((ev.clientX - r.left) / r.width) * this.W / TS);
    const y = Math.floor(((ev.clientY - r.top) / r.height) * this.H / TS);
    if (this.onCell) this.onCell(x, y);
  }

  setHighlights(h) { this.hl = { cells: [], color: null, targets: [], area: [], areaColor: null, ...h }; }

  // ------------------------------------------------------------ fx interface
  get fx() {
    const self = this;
    const wait = (ms) => sleep(ms / self.speed);
    return {
      log(text, cls) { if (self.onLog) self.onLog(text, cls); },
      update() {},
      float(u, text, color) { const p = self.pos.get(u.id) || u; self.floats.push({ x: p.x, y: p.y, text, color, t0: performance.now(), off: self.floats.filter((f) => performance.now() - f.t0 < 300).length }); },
      async move(u, from, to) {
        sfx('step');
        const p = self.pos.get(u.id);
        const t0 = performance.now(), dur = 110 / self.speed;
        while (true) {
          const k = Math.min(1, (performance.now() - t0) / dur);
          p.x = from.x + (to.x - from.x) * k; p.y = from.y + (to.y - from.y) * k;
          if (k >= 1) break;
          await sleep(16);
        }
      },
      async attack(att, tgt, { ranged, hit, crit }) {
        if (ranged) {
          sfx('swing');
          await self.projectile(att, tgt, '#e8e0c0', 220);
        } else {
          sfx('swing');
          self.lunges.set(att.id, { tx: tgt.x - att.x, ty: tgt.y - att.y, t0: performance.now() });
          await wait(120);
        }
        if (hit) { sfx(crit ? 'crit' : 'hit'); self.flashes.set(tgt.id, performance.now()); self.shake = crit ? performance.now() : self.shake; }
        else sfx('miss');
        await wait(hit ? 220 : 160);
      },
      async spell(caster, target, { color, cells, ray }) {
        sfx(color === '#fff7a8' ? 'heal' : 'spell');
        if (cells && cells.length) {
          self.areaFx = { cells, color, t0: performance.now() };
          await wait(450);
          self.areaFx = null;
        } else if (target && target !== caster && target.x !== undefined && ray !== false) {
          await self.projectile(caster, target, color, 260, true);
        } else {
          self.areaFx = { cells: [{ x: (target || caster).x, y: (target || caster).y }], color, t0: performance.now() };
          await wait(350);
          self.areaFx = null;
        }
      },
      async banner(text) { self.bannerText = { text, t0: performance.now() }; await wait(650); self.bannerText = null; },
      async wait(ms) { await wait(ms); },
      async turnStart() { await wait(150); },
    };
  }

  async projectile(from, to, color, dur, magic = false) {
    const p = { fx: from.x, fy: from.y, tx: to.x, ty: to.y, color, t0: performance.now(), dur: dur / this.speed, magic };
    this.projectiles.push(p);
    await sleep(p.dur);
    this.projectiles = this.projectiles.filter((q) => q !== p);
  }

  // ------------------------------------------------------------ drawing
  draw(t) {
    const { lctx: c, e } = this;
    c.imageSmoothingEnabled = false;
    for (let y = 0; y < e.map.h; y++) for (let x = 0; x < e.map.w; x++) drawTile(c, e.map.tiles[y][x], x, y, e.map.theme, t);

    // highlights
    const pulse = 0.35 + Math.sin(t / 200) * 0.12;
    if (this.hl.cells.length) {
      c.fillStyle = this.hl.color || 'rgba(80,160,255,0.35)';
      for (const p of this.hl.cells) c.fillRect(p.x * TS, p.y * TS, TS, TS);
      c.fillStyle = 'rgba(255,255,255,0.18)';
      for (const p of this.hl.cells) { c.fillRect(p.x * TS, p.y * TS, TS, 1); c.fillRect(p.x * TS, p.y * TS, 1, TS); }
    }
    if (this.hl.area.length) {
      c.fillStyle = this.hl.areaColor || `rgba(255,140,40,${pulse})`;
      for (const p of this.hl.area) c.fillRect(p.x * TS, p.y * TS, TS, TS);
    }
    if (this.areaFx) {
      const k = (t - this.areaFx.t0) / 450;
      c.globalAlpha = Math.max(0, 0.7 - k * 0.5);
      c.fillStyle = this.areaFx.color;
      for (const p of this.areaFx.cells) c.fillRect(p.x * TS + 1, p.y * TS + 1, TS - 2, TS - 2);
      c.globalAlpha = 1;
    }

    // units: dead first, then sorted by y
    const units = [...e.units].filter((u) => !u.fled).sort((a, b) => (a.dead ? -1 : 0) - (b.dead ? -1 : 0) || (this.pos.get(a.id).y - this.pos.get(b.id).y));
    for (const u of units) this.drawUnit(c, u, t);

    // target markers
    for (const u of this.hl.targets) {
      const p = this.pos.get(u.id);
      c.strokeStyle = `rgba(255,70,70,${0.6 + Math.sin(t / 150) * 0.3})`;
      c.lineWidth = 1;
      c.strokeRect(p.x * TS + 0.5, p.y * TS + 0.5, TS - 1, TS - 1);
      c.fillStyle = '#ff4646';
      const by = Math.floor(Math.sin(t / 150) * 1.5);
      c.fillRect(p.x * TS + 7, p.y * TS - 4 + by, 2, 2); c.fillRect(p.x * TS + 6, p.y * TS - 6 + by, 4, 2);
    }
    // current unit marker
    const cur = e.current;
    if (cur && !cur.dead) {
      const p = this.pos.get(cur.id);
      c.fillStyle = '#ffd84a';
      const by = Math.floor(Math.sin(t / 180) * 1.5);
      c.fillRect(p.x * TS + 6, p.y * TS - 5 + by, 4, 1); c.fillRect(p.x * TS + 7, p.y * TS - 4 + by, 2, 1);
    }
    // projectiles
    for (const pr of this.projectiles) {
      const k = Math.min(1, (t - pr.t0) / pr.dur);
      const x = (pr.fx + (pr.tx - pr.fx) * k) * TS + 8, y = (pr.fy + (pr.ty - pr.fy) * k) * TS + 8 - Math.sin(k * Math.PI) * (pr.magic ? 2 : 6);
      c.fillStyle = pr.color;
      if (pr.magic) { c.fillRect(x - 2, y - 2, 4, 4); c.fillStyle = '#ffffff'; c.fillRect(x - 1, y - 1, 2, 2); c.globalAlpha = 0.5; c.fillStyle = pr.color; c.fillRect(x - 3 - (pr.tx - pr.fx) * 2, y - 1, 2, 2); c.globalAlpha = 1; }
      else c.fillRect(x - 1, y - 1, 3, 2);
    }

    // scale up
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    let sx = 0, sy = 0;
    if (this.shake && t - this.shake < 200) { sx = (Math.random() - 0.5) * 8; sy = (Math.random() - 0.5) * 8; }
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this.low, sx, sy, this.W * S, this.H * S);

    // floating text (hi-res)
    ctx.textAlign = 'center';
    ctx.font = `bold ${7 * S}px "Press Start 2P", monospace`;
    this.floats = this.floats.filter((f) => t - f.t0 < 1100);
    for (const f of this.floats) {
      const k = (t - f.t0) / 1100;
      const x = (f.x * TS + 8) * S, y = (f.y * TS - 2 - k * 10 - (f.off || 0) * 7) * S;
      ctx.globalAlpha = Math.min(1, 2 - k * 2);
      ctx.lineWidth = S * 1.5; ctx.strokeStyle = '#1b1424'; ctx.strokeText(f.text, x, y);
      ctx.fillStyle = f.color || '#fff'; ctx.fillText(f.text, x, y);
      ctx.globalAlpha = 1;
    }
    if (this.bannerText) {
      const k = (t - this.bannerText.t0) / 650;
      ctx.globalAlpha = k < 0.15 ? k / 0.15 : k > 0.8 ? (1 - k) / 0.2 : 1;
      ctx.fillStyle = 'rgba(20,12,30,0.85)';
      ctx.fillRect(0, this.canvas.height / 2 - 18 * S, this.canvas.width, 36 * S);
      ctx.font = `${10 * S}px "Press Start 2P", monospace`;
      ctx.fillStyle = '#ffd84a';
      ctx.fillText(this.bannerText.text, this.canvas.width / 2, this.canvas.height / 2 + 4 * S);
      ctx.globalAlpha = 1;
    }
  }

  drawUnit(c, u, t) {
    const p = this.pos.get(u.id);
    let x = p.x * TS, y = p.y * TS;
    const lunge = this.lunges.get(u.id);
    if (lunge) {
      const k = (t - lunge.t0) / 220;
      if (k >= 1) this.lunges.delete(u.id);
      else { const a = Math.sin(k * Math.PI) * 5; x += lunge.tx * a; y += lunge.ty * a; }
    }
    if (u.dead) {
      if (u.side === 'enemy') { c.fillStyle = '#e8e0d0'; c.fillRect(x + 5, y + 10, 6, 2); c.fillRect(x + 7, y + 8, 2, 6); c.fillStyle = 'rgba(120,0,0,0.5)'; c.fillRect(x + 3, y + 12, 10, 2); }
      else { c.globalAlpha = 0.5; this.drawDown(c, u, x, y); c.globalAlpha = 1; }
      return;
    }
    // shadow / team ring
    c.fillStyle = u.side === 'party' ? 'rgba(60,140,255,0.55)' : 'rgba(255,60,60,0.5)';
    c.fillRect(x + 3, y + 13, 10, 2); c.fillRect(x + 4, y + 12, 8, 4);
    const down = u.hp < 0 && !u.ferocious || u.st.asleep || u.st.unconscious;
    if (down) { this.drawDown(c, u, x, y); }
    else {
      const frame = Math.floor((t + (u.id.length * 137)) / 450) % 2;
      const spr = spriteFor(u, u.st.held || u.st.stunned ? 0 : frame);
      const fl = this.flashes.get(u.id);
      c.drawImage(spr, x - 1, y - 3);
      if (fl && t - fl < 220) { c.globalAlpha = 0.7; c.globalCompositeOperation = 'source-atop'; c.globalCompositeOperation = 'source-over'; c.fillStyle = '#ffffff'; c.globalAlpha = 0.6 * (1 - (t - fl) / 220); c.fillRect(x + 1, y - 1, 14, 16); c.globalAlpha = 1; }
    }
    if (u.st.asleep || u.st.unconscious) { c.fillStyle = '#c8d8ff'; const z = Math.floor(t / 300) % 3; c.fillRect(x + 11 + z, y - 2 - z * 2, 3, 1); c.fillRect(x + 13 + z, y - 1 - z * 2, 1, 1); c.fillRect(x + 11 + z, y - z * 2, 3, 1); }
    // hp bar
    const ratio = Math.max(0, u.hp) / u.maxHp;
    c.fillStyle = '#1b1424'; c.fillRect(x + 1, y + 15, 14, 2);
    c.fillStyle = ratio > 0.5 ? '#5ad85a' : ratio > 0.25 ? '#f2c84b' : '#ff4646';
    c.fillRect(x + 1, y + 15, Math.ceil(14 * ratio), 1);
    if (u.tempHp > 0) { c.fillStyle = '#7ab0ff'; c.fillRect(x + 1, y + 16, Math.min(14, u.tempHp), 1); }
    // statuses
    let i = 0;
    for (const k of Object.keys(u.st)) {
      const col = STATUS_COLORS[k];
      if (!col || i > 5) continue;
      c.fillStyle = '#1b1424'; c.fillRect(x + 1 + i * 3 - 0.5, y - 4, 3, 3);
      c.fillStyle = col; c.fillRect(x + 1 + i * 3, y - 3.5, 2, 2);
      i++;
    }
  }

  drawDown(c, u, x, y) {
    const spr = spriteFor(u, 0);
    c.save();
    c.translate(x + 8, y + 10);
    c.rotate(Math.PI / 2);
    c.drawImage(spr, -9, -9);
    c.restore();
  }
}
