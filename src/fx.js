// Particles, explosions, floating score text, screen shake and cartoon gore
// (blood drops, gibs, temporary stains on solid tiles).
const GORE = {
  blood: ["#6e0606", "#a81010", "#d82418", "#ff3a2a"],
  oil: ["#0c0c0c", "#1e1e1e", "#2e2c28"],
  spark: ["#ffd040", "#fff4a0", "#ff9a20"],
  metal: ["#6c7484", "#b8c0cc", "#3a404e"],
  suit: ["#5a6272", "#3a404e", "#e8a880"],
  shell: ["#8c2c1c", "#561810", "#b84a32", "#e8c8b0"],
  punk: ["#40e040", "#e8a880", "#1a1414", "#3858a8"],
  maxStains: 64, stainLife: 20, stainFade: 3,
};
function pick(a) { return a[(Math.random() * a.length) | 0]; }

const FX = {
  parts: [],
  texts: [],
  stains: [],
  shakeT: 0, shakeAmp: 0,
  clear() { this.parts.length = 0; this.texts.length = 0; this.stains.length = 0; this.shakeT = 0; },

  // Blood (or oil) drops spraying mostly in direction dir (-1, 0, 1). They stain solid tiles they hit.
  blood(x, y, dir, n, palette, stain) {
    for (let i = 0; i < n; i++) {
      this.parts.push({ x: x + rnd(-2, 2), y: y + rnd(-2, 2), vx: dir * rnd(20, 130) + rnd(-50, 50), vy: rnd(-170, -30),
        life: rnd(0.9, 1.6), max: 1.6, color: pick(palette || GORE.blood), grav: 520, size: Math.random() < 0.35 ? 2 : 1,
        stains: stain !== false });
    }
  },
  // Chunky pieces that bounce once and settle; may leave a stain where they land.
  gibs(x, y, palette, n, stain) {
    for (let i = 0; i < (n || 5); i++) {
      this.parts.push({ x: x + rnd(-3, 3), y: y + rnd(-4, 2), vx: rnd(-130, 130), vy: rnd(-280, -120), life: rnd(2.2, 3.2), max: 3.2,
        color: pick(palette), grav: 650, size: 2 + (Math.random() < 0.5 ? 1 : 0), gib: true, bounces: 0, stains: stain !== false });
    }
  },
  addStain(x, y, color) {
    const sz = 1 + ((Math.random() * 3) | 0);
    this.stains.push({ x: Math.round(x - sz / 2), y: Math.round(y), w: sz + ((Math.random() * 2) | 0), h: Math.max(1, sz - 1), color: color, t: 0 });
    while (this.stains.length > GORE.maxStains) this.stains.shift();
  },
  drawStains(cx, cy) {
    for (const st of this.stains) {
      const left = GORE.stainLife - st.t;
      ctx.globalAlpha = left < GORE.stainFade ? Math.max(0, left / GORE.stainFade) : 1;
      ctx.fillStyle = st.color;
      ctx.fillRect(Math.round(st.x - cx), Math.round(st.y - cy), st.w, st.h);
    }
    ctx.globalAlpha = 1;
  },
  spark(x, y, color, n, speed, life, grav) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = speed * (0.3 + Math.random() * 0.7);
      this.parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: life * (0.5 + Math.random() * 0.5),
        max: life, color: color, grav: grav === undefined ? 300 : grav, size: 1 + (Math.random() < 0.3 ? 1 : 0) });
    }
  },
  explode(x, y, big) {
    const n = big ? 60 : 24;
    this.spark(x, y, "#fff4a0", n / 3, big ? 160 : 90, 0.35, 0);
    this.spark(x, y, "#ff9a20", n / 2, big ? 130 : 80, 0.6, 120);
    this.spark(x, y, "#c02010", n / 3, big ? 100 : 60, 0.8, 200);
    this.parts.push({ x: x, y: y, vx: 0, vy: 0, life: 0.18, max: 0.18, ring: big ? 22 : 12, color: "#fff", grav: 0 });
  },
  text(x, y, str, color) { this.texts.push({ x: x, y: y, str: String(str), color: color || "#fff", life: 0.9 }); },
  shake(amp, t) { this.shakeAmp = Math.max(this.shakeAmp, amp); this.shakeT = Math.max(this.shakeT, t); },
  update(dt) {
    const L = typeof Game !== "undefined" ? Game.level : null;
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt;
      if (p.life <= 0) { this.parts.splice(i, 1); continue; }
      if (p.settled) continue;
      const px = p.x, py = p.y;
      p.vy += p.grav * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (L && (p.stains || p.gib) && L.isSolid(Math.floor(p.x / TILE), Math.floor(p.y / TILE))) {
        if (p.stains) this.addStain(px, p.vy > 0 ? Math.floor(p.y / TILE) * TILE : py, p.color);
        if (p.gib && p.bounces < 1 && p.vy > 0) {
          p.bounces++; p.x = px; p.y = py; p.vy = -p.vy * 0.3; p.vx *= 0.5; p.stains = false;
        } else if (p.gib) {
          p.x = px; p.y = Math.min(py, Math.floor(p.y / TILE) * TILE - p.size); p.settled = true; p.stains = false;
        } else this.parts.splice(i, 1);
      }
    }
    for (let i = this.stains.length - 1; i >= 0; i--) {
      this.stains[i].t += dt;
      if (this.stains[i].t >= GORE.stainLife) this.stains.splice(i, 1);
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt; t.y -= 20 * dt;
      if (t.life <= 0) this.texts.splice(i, 1);
    }
    if (this.shakeT > 0) { this.shakeT -= dt; if (this.shakeT <= 0) this.shakeAmp = 0; }
  },
  shakeOffset() {
    if (this.shakeT <= 0) return { x: 0, y: 0 };
    return { x: Math.round(rnd(-1, 1) * this.shakeAmp), y: Math.round(rnd(-1, 1) * this.shakeAmp) };
  },
  draw(cx, cy) {
    for (const p of this.parts) {
      if (p.ring) {
        const r = Math.round(p.ring * (1 - p.life / p.max)) + 2;
        ctx.strokeStyle = p.color; ctx.lineWidth = 2;
        ctx.strokeRect(Math.round(p.x - cx - r), Math.round(p.y - cy - r), r * 2, r * 2);
        continue;
      }
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x - cx), Math.round(p.y - cy), p.size || 1, p.size || 1);
    }
    for (const t of this.texts) drawText(t.str, t.x - cx, t.y - cy, t.color, { align: "center", shadow: "#000" });
  },
};
