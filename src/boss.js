// The giant mutant crayfish. Faces left. Only its face/eye stalks take damage, and
// only while the claws are raised; shell and closed claws deflect shots.
// Attack cycle: claw slam (screen shake + shockwave), bubble arc, summon minions.
const BOSS_ATTACKS = ["slam", "bubbles", "summon"];

function rect(g, x, y, w, h, color) { g.fillStyle = color; g.fillRect(Math.round(x), Math.round(y), w, h); }
const bossLayers = (function () {
  let L = null;
  return function () {
    if (!L) { const c = makeCanvas(W, H), s = makeCanvas(W, H); L = { c: c, g: c.getContext("2d"), s: s, sg: s.getContext("2d") }; }
    return L;
  };
})();

const Boss = {
  active: false,
  init(px, floorY) {
    this.active = true;
    this.ox = px; this.homeX = px; this.floor = floorY;
    this.hp = CONFIG.bossHp; this.maxHp = CONFIG.bossHp;
    this.state = "intro"; this.t = 1.5; this.attackIdx = 0; this.raised = false; this.claw = 0; // 0 down .. 1 up
    this.flash = 0; this.anim = 0; this.dir = -1; this.dying = 0; this.fired = 0;
    this.healthTimer = 12;
    this.log = [];                 // attack history (used by the automated tests)
    Game.boss = this;
  },
  enraged() { return this.hp < this.maxHp * 0.5; },
  idleTime() { return this.enraged() ? 0.8 : 1.7; },

  // hitboxes in world coordinates
  face() { return { x: this.ox, y: this.floor - 66, w: 26, h: 62 }; },
  shell() { return { x: this.ox + 20, y: this.floor - 52, w: 110, h: 48 }; },
  claws() {
    return this.claw > 0.5
      ? { x: this.ox - 30, y: this.floor - 120, w: 36, h: 46 }
      : { x: this.ox - 36, y: this.floor - 56, w: 36, h: 54 };
  },
  boxes() { return [this.face(), this.shell(), this.claws()]; },

  update(dt, level) {
    if (!this.active) return;
    this.anim += dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.state === "dying") {
      this.dying -= dt;
      if (Math.random() < 0.35) {
        const gx = this.ox + rnd(-30, 120), gy = this.floor - rnd(0, 80);
        FX.explode(gx, gy, Math.random() < 0.3);
        FX.blood(gx, gy, 0, 12); if (Math.random() < 0.4) FX.gibs(gx, gy, GORE.shell, 3);
        if (Math.random() < 0.3) Sound.play("explode");
      }
      FX.shake(3, 0.1);
      if (this.dying <= 0) { this.active = false; Game.boss = null; Game.onBossDefeated(); }
      return;
    }
    this.t -= dt;
    const targetClaw = this.raised ? 1 : 0;
    this.claw += clamp(targetClaw - this.claw, -dt * 6, dt * 6);

    switch (this.state) {
      case "intro":
        if (this.t <= 0) this.toIdle();
        break;
      case "idle": {
        // creep toward / away from the hero within its home range
        const want = clamp(Player.cx() + 90, this.homeX - 50, this.homeX + 10);
        const sp = this.enraged() ? 30 : 18;
        if (Math.abs(want - this.ox) > 2) this.ox += Math.sign(want - this.ox) * sp * dt;
        if (this.t <= 0) this.startAttack(BOSS_ATTACKS[this.attackIdx++ % BOSS_ATTACKS.length]);
        break;
      }
      case "slam":
        if (this.phase === "raise" && this.t <= 0) {
          this.phase = "down"; this.raised = false; this.claw = 0; this.t = 0.6;
          FX.shake(5, 0.45); Sound.play("slam");
          const cl = this.claws();
          FX.spark(cl.x + 10, this.floor, "#c8a070", 20, 100, 0.6);
          Game.enemyShots.push({ kind: "shockwave", x: cl.x - 10, y: this.floor - 12, w: 12, h: 12,
            vx: this.enraged() ? -190 : -150, life: 3, dmg: 2 });
          this.log.push("slam");
        } else if (this.phase === "down" && this.t <= 0) this.toIdle();
        break;
      case "bubbles": {
        const total = this.enraged() ? 9 : 6;
        if (this.phase === "raise" && this.t <= 0) { this.phase = "spit"; this.t = 1.2; this.fired = 0; }
        if (this.phase === "spit") {
          const due = Math.floor((1 - this.t / 1.2) * total);
          while (this.fired < Math.min(due, total)) {
            const k = this.fired / (total - 1);
            Game.enemyShots.push({ kind: "bubble", x: this.ox - 4, y: this.floor - 34, w: 8, h: 8,
              vx: -(60 + k * 130), vy: -(150 + (1 - k) * 120), grav: 260, dmg: 1 });
            this.fired++; Sound.play("bubble");
          }
          if (this.t <= 0) { this.log.push("bubbles"); this.toIdle(); }
        }
        break;
      }
      case "summon":
        if (this.t <= 0) {
          const minions = Game.enemies.filter(function (e) { return e.type === "cray" && !e.dead; }).length;
          const n = Math.min(2, 4 - minions);
          for (let i = 0; i < n; i++) {
            const x = rnd(40, this.ox - 60);
            Game.enemies.push(makeEnemy("cray", x, 40, level, 1));
            FX.spark(x, 32, "#ff8060", 10, 60, 0.4);
          }
          Sound.play("leap");
          this.log.push("summon");
          this.toIdle();
        }
        break;
    }
    // contact damage
    for (const b of this.boxes()) if (overlap(b, Player)) { Player.hurt(2); break; }

    // periodic health pickups in the arena
    this.healthTimer -= dt;
    if (this.healthTimer <= 0) {
      this.healthTimer = 15;
      const has = Game.pickups.some(function (p) { return p.type === "h" || p.type === "s"; });
      if (!has && Game.arenaHealthSpots && Game.arenaHealthSpots.length) {
        const spot = Game.arenaHealthSpots[Math.floor(Math.random() * Game.arenaHealthSpots.length)];
        Game.addPickup("h", spot.x, spot.y);
        FX.spark(spot.x, spot.y - 8, "#ffffff", 10, 60, 0.4);
      }
    }
  },

  toIdle() { this.state = "idle"; this.raised = false; this.t = this.idleTime(); this.phase = null; },
  startAttack(name) {
    this.state = name; this.phase = "raise"; this.raised = true;
    this.t = name === "slam" ? 0.9 : name === "bubbles" ? 0.4 : 1.1;
  },

  // Called for every hero shot. Returns true when the shot hit any part of the boss.
  hitByShot(s) {
    if (!this.active || this.state === "dying" || this.state === "intro") return false;
    if (this.raised && this.claw > 0.5 && overlap(s, this.face())) {
      this.hp -= s.dmg; this.flash = 0.08;
      FX.blood(s.x + s.w / 2, s.y, -Math.sign(s.vx), 5);
      Game.addScore(10);
      Sound.play("bosshurt");
      FX.spark(s.x + s.w / 2, s.y, "#ffffff", 4, 60, 0.2);
      if (this.hp <= 0) this.die();
      return true;
    }
    for (const b of this.boxes()) {
      if (overlap(s, b)) {
        s.deflected = true; s.vx = -s.vx * 0.6; s.vy = -90; s.life = 0.35;
        FX.spark(s.x + s.w / 2, s.y + s.h / 2, "#ffffff", 5, 70, 0.2);
        if (s.spin) { FX.spark(s.x + s.w / 2, s.y + s.h / 2, "#ffd040", 14, 140, 0.4); FX.spark(s.x + s.w / 2, s.y + s.h / 2, "#ff9a20", 8, 100, 0.3); }
        Sound.play("deflect");
        this.deflects = (this.deflects || 0) + 1;
        return true;
      }
    }
    return false;
  },

  die() {
    this.hp = 0; this.state = "dying"; this.dying = 2.6; this.raised = false;
    Game.addScore(CONFIG.bossPoints);
    FX.text(this.ox + 40, this.floor - 90, CONFIG.bossPoints, "#ffe860");
    Sound.play("bigexplode");
    Game.enemyShots.length = 0;
    // the big shower
    const cx = this.ox + 40, cy = this.floor - 40;
    FX.blood(cx, cy, -1, 80); FX.blood(cx, cy, 1, 40); FX.gibs(cx, cy, GORE.shell.concat(GORE.blood), 14);
  },

  // Rendered offscreen, then outlined with the same dark outline as the sprites.
  draw(camX, camY) {
    if (!this.active) return;
    const L = bossLayers();
    L.g.clearRect(0, 0, W, H);
    this.drawBody(L.g, camX, camY);
    L.sg.globalCompositeOperation = "source-over"; L.sg.clearRect(0, 0, W, H); L.sg.drawImage(L.c, 0, 0);
    L.sg.globalCompositeOperation = "source-in"; L.sg.fillStyle = "rgb(" + OUTLINE_COLOR.join(",") + ")"; L.sg.fillRect(0, 0, W, H);
    ctx.drawImage(L.s, -1, 0); ctx.drawImage(L.s, 1, 0); ctx.drawImage(L.s, 0, -1); ctx.drawImage(L.s, 0, 1);
    ctx.drawImage(L.c, 0, 0);
  },

  // Draws the boss parts into context g (screen coordinates).
  drawBody(g, camX, camY) {
    const fl = this.flash > 0;
    // Realistic red crayfish (see the change's reference photo): glossy red-brown armour,
    // darker shading below, sheen highlights, overlapping tail plates, heavy pale-tipped claws.
    const C = {
      shell: fl ? "#fff" : "#8c2c1c", shell2: fl ? "#fff" : "#561810", hi: fl ? "#fff" : "#b84a32",
      sheen: fl ? "#fff" : "#e0806a", tip: fl ? "#fff" : "#e8c8b0", dark: fl ? "#fff" : "#3e100a",
      head: fl ? "#fff" : "#8c2c1c", leg: fl ? "#fff" : "#561810", eye: this.enraged() ? "#ff3020" : "#101018",
    };
    const sx = Math.round(this.ox - camX), sy = Math.round(this.floor - camY + HUD_H);
    const bob = Math.round(Math.sin(this.anim * 3) * 1);
    // legs
    for (let i = 0; i < 4; i++) {
      const lx = sx + 34 + i * 18, k = Math.round(Math.sin(this.anim * 6 + i) * 2);
      rect(g, lx, sy - 12, 3, 12, C.leg); rect(g, lx - 4 + k, sy - 3, 8, 3, C.leg);
    }
    // tail: overlapping plates (each lit on top, shaded below) and a two-shade tail fan
    pxEllipse(g, sx + 118, sy - 26 + bob, 16, 12, C.shell2);
    pxEllipse(g, sx + 117, sy - 29 + bob, 14, 8, C.shell);
    pxEllipse(g, sx + 136, sy - 22 + bob, 11, 9, C.shell2);
    pxEllipse(g, sx + 135, sy - 25 + bob, 9, 6, C.shell);
    rect(g, sx + 108, sy - 37 + bob, 14, 2, C.sheen); rect(g, sx + 130, sy - 30 + bob, 9, 1, C.sheen);
    pxEllipse(g, sx + 150, sy - 20 + bob, 6, 14, C.shell2);
    pxEllipse(g, sx + 149, sy - 22 + bob, 4, 10, C.hi);
    rect(g, sx + 150, sy - 32 + bob, 1, 24, C.shell2);                   // fan rib
    // carapace: glossy dome, darker lower half, plate seams, cervical groove, sheen band
    const scx = sx + 70, scy = sy - 30 + bob;
    pxEllipse(g, scx, scy, 48, 25, C.shell2);
    pxEllipse(g, scx - 2, scy - 4, 45, 20, C.shell);
    pxEllipse(g, scx - 6, scy - 12, 34, 9, C.hi);
    for (let i = 0; i < 4; i++) {                                        // overlapping plate seams
      const gx = sx + 44 + i * 16;
      rect(g, gx, scy - 20, 2, 38, C.shell2); rect(g, gx + 2, scy - 20, 1, 30, C.hi);
    }
    rect(g, sx + 36, scy - 18, 2, 30, C.dark);                           // cervical groove
    rect(g, scx - 30, scy - 19, 44, 2, C.sheen); rect(g, scx - 24, scy - 21, 26, 1, C.sheen);   // wet sheen
    for (let x = scx - 36; x <= scx + 36; x += 9) rect(g, x, scy + 6 + ((x / 9) % 2 ? 2 : 0), 2, 1, C.shell2);   // pitted texture
    // head with a pointed rostrum between the eye stalks
    pxEllipse(g, sx + 16, sy - 30 + bob, 18, 22, C.shell2);
    pxEllipse(g, sx + 17, sy - 33 + bob, 15, 17, C.head);
    rect(g, sx + 8, sy - 46 + bob, 12, 2, C.sheen);
    rect(g, sx + 2, sy - 50 + bob, 12, 3, C.hi); rect(g, sx - 4, sy - 49 + bob, 6, 2, C.hi); rect(g, sx - 7, sy - 48 + bob, 3, 1, C.shell2);   // rostrum
    rect(g, sx + 2, sy - 22 + bob, 10, 4, "#300a06");                    // mouth
    rect(g, sx + 1, sy - 18 + bob, 3, 6, C.leg); rect(g, sx + 9, sy - 18 + bob, 3, 6, C.leg); // mandibles
    // eye stalks
    rect(g, sx + 8, sy - 64 + bob, 3, 16, C.head); rect(g, sx + 20, sy - 66 + bob, 3, 18, C.head);
    pxEllipse(g, sx + 9, sy - 66 + bob, 4, 4, C.eye); pxEllipse(g, sx + 21, sy - 68 + bob, 4, 4, C.eye);
    rect(g, sx + 8, sy - 68 + bob, 1, 1, "#fff"); rect(g, sx + 20, sy - 70 + bob, 1, 1, "#fff");
    // long antennae: two whip-like arcs, about 60 px each, swaying out of phase
    g.fillStyle = C.shell2;
    for (let a = 0; a < 2; a++) {
      for (let i = 0; i < 60; i++) {
        g.fillRect(Math.round(sx + 6 + a * 8 - i * 1.5), Math.round(sy - 58 + bob - a * 4 - Math.sin(i / 12 + this.anim * 2 + a * 1.3) * (6 + i * 0.15) - i * 0.9), 1, 1);
      }
    }
    // claws (far one darker, then near one), each on a jointed arm from the body
    const cl = this.claws();
    const open = this.raised ? Math.round(4 + Math.sin(this.anim * 10) * 3) : 0;
    const shoulderX = sx + 22, shoulderY = sy - 26 + bob;
    const far = { x: cl.x - camX + 6, y: cl.y - camY + HUD_H - 6 }, near = { x: cl.x - camX, y: cl.y - camY + HUD_H };
    this.drawArm(g, shoulderX + 4, shoulderY - 4, far.x + 22, far.y + 26, C.leg);
    this.drawClaw(g, far.x, far.y, open, C.shell2, C, C.dark);
    this.drawArm(g, shoulderX, shoulderY, near.x + 22, near.y + 26, C.shell2);
    this.drawClaw(g, near.x, near.y, open, C.shell, C, C.hi);
  },

  drawArm(g, x0, y0, x1, y1, col) {
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      pxEllipse(g, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 6, 5, col);
    }
  },

  drawClaw(g, x, y, open, col, C, lit) {
    x = Math.round(x); y = Math.round(y);
    pxEllipse(g, x + 22, y + 26, 14, 16, col);                          // heavy palm
    pxEllipse(g, x + 24, y + 20, 9, 7, lit);                            // its lit upper face
    pxEllipse(g, x + 12, y + 14 - open, 13, 7, col);                    // upper finger
    pxEllipse(g, x + 12, y + 36 + open, 12, 6, col);                    // lower finger
    rect(g, x + 8, y + 9 - open, 12, 1, C.sheen);                       // wet sheen on the finger
    rect(g, x - 1, y + 12 - open, 5, 4, C.tip); rect(g, x, y + 34 + open, 5, 4, C.tip);   // pale tips
    for (let k = 0; k < 5; k++) {                                       // knobbly inner edges
      rect(g, x + 4 + k * 3, y + 19 - open, 2, 1, C.dark);
      rect(g, x + 4 + k * 3, y + 32 + open, 2, 1, C.dark);
    }
    rect(g, x + 30, y + 22, 2, 8, C.dark);                              // wrist joint
  },
};
