// Game state machine, fixed-timestep loop, pickups, checkpoints and level flow.
const PICKUP_INFO = {
  o: { img: function () { return SPR.ball; } },
  t: { img: function () { return SPR.trophy; } },
  h: { img: function () { return SPR.rivella; } },
  s: { img: function () { return SPR.cervelat; } },
  "+": { img: function () { return SPR.life; } },
  w: { img: function () { return Game.level && Game.level.isBoss ? SPR.megaCutter : SPR.megagun; } },   // arena: Mega Cutter
  r: { img: function () { return SPR.keys.R; } },
  u: { img: function () { return SPR.keys.U; } },
  g: { img: function () { return SPR.keys.G; } },
};
const KEY_NAMES = { R: "RED", U: "BLUE", G: "GREEN" };

const Game = {
  state: STATE.TITLE, prevState: null, stateT: 0, time: 0,
  score: 0, levelIndex: 0, level: null,
  enemies: [], shots: [], enemyShots: [], pickups: [], checkpoints: [], exit: null, boss: null,
  stats: { shots: 0, kills: 0 }, tally: null, levelTime: 0, godMode: false, showDebug: false,
  ups: 0, fps: 0, lockedMsgT: 0, arenaHealthSpots: [], hurtFlash: 0,

  setState(s) {
    this.prevState = this.state; this.state = s; this.stateT = 0;
    if (s === STATE.TITLE) { Sound.setTrack("title"); Sound.setTempo(1); } else Sound.setTrack("valkyries");
  },

  startHash: null,           // tests: stands in for location.hash when set
  reveal: null,              // boss reveal pan at arena start: { t, x0, xb, back }

  newGame() {
    this.score = 0;
    Player.resetForGame();
    // a link like buck_nukem.html#level=4 starts every new game at that reel
    this.loadLevel(startLevelFromHash(this.startHash !== null ? this.startHash : location.hash));
  },

  loadLevel(i, data) {       // data: optional map override (used by the test harness)
    this.levelIndex = i;
    const L = this.level = new Level(data || LEVEL_DATA[i], i);
    Camera.anchorX = L.isBoss ? CONFIG.bossCamX : W / 2;   // boss arena: Buck on the left, the boss ahead
    this.fans = Fans.spawn(L, i);
    this.enemies = []; this.shots = []; this.enemyShots = []; this.pickups = []; this.checkpoints = [];
    this.reveal = null;
    this.exit = null; this.boss = null; Boss.active = false; this.arenaHealthSpots = []; this.arenaUpgradeSpot = null; this.upgradeT = 0;
    this.stats = { shots: 0, kills: 0 }; this.levelTime = 0; this.hurtFlash = 0;
    FX.clear();
    Player.keys = {};
    let start = null;
    const self = this;
    L.spawns.forEach(function (s) {
      const bx = s.tx * TILE + TILE / 2, by = (s.ty + 1) * TILE;
      switch (s.ch) {
        case "P": start = { x: bx - Player.w / 2, y: by - STAND_H }; break;
        case "L": self.enemies.push(makeEnemy("lawyer", bx, by, L, -1)); break;
        case "K": self.enemies.push(makeEnemy("cray", bx, by, L, -1)); break;
        case "M": self.enemies.push(makeEnemy("punk", bx, by, L, -1)); break;
        case "X": Boss.init(s.tx * TILE, by); break;
        case "C": self.checkpoints.push({ x: bx - 4, y: by - 24, w: 8, h: 24, on: false }); break;
        case "E": self.exit = { x: s.tx * TILE, y: by - 32, w: 16, h: 32 }; break;
        case "F": break;                                   // cheering fans: see Fans.spawn
        case "h": if (L.isBoss) self.arenaHealthSpots.push({ x: bx, y: by }); self.addPickup(s.ch, bx, by); break;
        case "w": if (L.isBoss) self.arenaUpgradeSpot = { x: bx, y: by }; self.addPickup(s.ch, bx, by); break;
        default: self.addPickup(s.ch, bx, by);
      }
    });
    if (!start) start = { x: 32, y: 32 };
    Player.placeAt(start.x, start.y);
    Player.setCheckpoint(start.x, start.y);
    Player.hp = CONFIG.maxHp;
    Player.invuln = 0;
    Camera.snap(Player, L);
    Sound.setTempo(L.isBoss ? 1.25 : 1);
    if (L.isBoss) Player.weapon = "cutter";             // the finale is fought with the disc cutter
    this.setState(STATE.LEVEL_INTRO);
  },

  addPickup(ch, bx, by) {
    const img = PICKUP_INFO[ch].img();
    this.pickups.push({ type: ch, img: img, x: bx - img.width / 2, y: by - img.height - 2, w: img.width, h: img.height, t: Math.random() * 6 });
  },

  addScore(n) { this.score += n; },

  collectPickup(p) {
    const P = Player, cx = p.x + p.w / 2;
    switch (p.type) {
      case "o": this.addScore(CONFIG.ballPoints); FX.text(cx, p.y, CONFIG.ballPoints, "#d8f040"); Sound.play("pickup"); break;
      case "t": this.addScore(CONFIG.trophyPoints); FX.text(cx, p.y, CONFIG.trophyPoints, "#ffd840"); Sound.play("pickup"); Fans.react(cx, p.y, "trophy"); break;
      case "h": P.heal(2); FX.text(cx, p.y, "RIVELLA +2", "#80ff80"); Sound.play("health"); break;
      case "s": P.heal(3); FX.text(cx, p.y, "CERVELAT +3", "#80ff80"); Sound.play("health"); break;
      case "+": P.lives++; FX.text(cx, p.y, "1UP", "#ffffff"); Sound.play("oneup"); break;
      case "w":
        if (this.level.isBoss) {            // boss arena: the disc cutter upgrade; comes back later
          P.weapon = "megacutter"; FX.text(cx, p.y, "MEGA CUTTER!", "#ffb040"); this.upgradeT = CONFIG.upgradeRespawn;
        } else { P.weapon = "mega"; FX.text(cx, p.y, "MEGA BLASTER!", "#60c0ff"); }
        Sound.play("powerup"); break;
      default: {
        const k = p.type.toUpperCase();
        P.keys[k] = true; FX.text(cx, p.y, KEY_NAMES[k] + " KEY", KEY_COLORS[k]); Sound.play("key");
      }
    }
    FX.spark(cx, p.y + p.h / 2, "#ffffff", 8, 60, 0.3, 0);
  },

  // Hero pushed against a tile: doors open with the matching key.
  touchTile(tx, ty) {
    const L = this.level, ch = L.at(tx, ty);
    if (!L.isDoor(tx, ty)) return;
    if (Player.keys[ch]) { L.openDoor(tx, ty); Sound.play("door"); }
    else if (this.lockedMsgT <= 0) {
      FX.text(Player.cx(), Player.y - 6, "NEED " + KEY_NAMES[ch] + " KEY", KEY_COLORS[ch]);
      Sound.play("locked"); this.lockedMsgT = 1.2;
    }
  },

  onPlayerDeath() {
    Player.lives--;
    if (Player.lives > 0) {
      Player.respawn();
      this.enemyShots = []; this.shots = [];
      Camera.snap(Player, this.level);
    } else {
      this.setState(STATE.GAME_OVER);
    }
  },

  onBossDefeated() {
    this.setState(STATE.VICTORY);
    FX.clear();
  },

  completeLevel() {
    const time = Math.max(0, 300 - Math.floor(this.levelTime)) * 10;
    const t = { level: CONFIG.levelBonus, health: Player.hp * 100, time: time };
    t.total = t.level + t.health + t.time; t.shown = 0; t.done = false;
    this.tally = t;
    Sound.play("oneup");
    this.setState(STATE.LEVEL_COMPLETE);
  },

  nextLevel() {
    this.addScore(this.tally.total);
    const next = this.levelIndex + 1;
    if (next < LEVEL_DATA.length) this.loadLevel(next);
    else this.setState(STATE.VICTORY);
  },

  // ---------------- update ----------------
  // The (at most 2) nearest running, on-screen petrol mowers, for the engine sound.
  engineList() {
    const pcx = Player.cx(), pcy = Player.cy(), x0 = Camera.x - 16, x1 = Camera.x + W + 16;
    return this.enemies.filter(function (e) {
      return e.type === "punk" && !e.dead && e.active && e.x + e.w > x0 && e.x < x1;
    }).map(function (e) {
      const dx = e.x + e.w / 2 - pcx, dy = e.y + e.h / 2 - pcy;
      return { id: e, state: e.state, throttle: e.state === "rev" ? 1 - e.t / CONFIG.punkRev : 0, dist: Math.sqrt(dx * dx + dy * dy) };
    }).sort(function (a, b) { return a.dist - b.dist; }).slice(0, 2);
  },
  updateEngines() {
    const playing = this.state === STATE.PLAY || this.state === STATE.BOSS;
    const list = playing && this.level ? this.engineList() : [];
    list.forEach(function (m) {                        // pull-start when a mower's engine first runs
      if (!m.id.engineStarted) { m.id.engineStarted = true; Sound.play("pullstart"); }
    });
    Sound.setEngines(list);
  },

  update(dt) {
    this.time += dt; this.stateT += dt;
    if (Input.pressed("mute")) Sound.toggleMute();
    if (Input.pressed("debug")) this.showDebug = !this.showDebug;
    if (Input.pressed("film")) Film.enabled = !Film.enabled;
    if (Fullscreen.noteT > 0) Fullscreen.noteT = Math.max(0, Fullscreen.noteT - dt);
    switch (this.state) {
      case STATE.TITLE:
        if (Input.pressed("enter")) { Sound.play("select"); this.newGame(); }
        break;
      case STATE.LEVEL_INTRO:
        if (this.stateT > introTotal(this.level.isBoss) || (this.stateT > 0.3 && (Input.pressed("enter") || Input.pressed("jump")))) {
          this.setState(this.level.isBoss ? STATE.BOSS : STATE.PLAY);
          if (this.level.isBoss) this.startReveal();
        }
        break;
      case STATE.PLAY:
      case STATE.BOSS:
        if (Input.pressed("pause") || Input.pressed("enter")) { this.setState(STATE.PAUSE); break; }
        if (this.reveal) { this.updateReveal(dt); break; }
        this.updateWorld(dt);
        break;
      case STATE.PAUSE:
        if (Input.pressed("pause") || Input.pressed("enter")) { this.state = this.prevState; this.prevState = STATE.PAUSE; }
        break;
      case STATE.LEVEL_COMPLETE: {
        const t = this.tally;
        if (!t.done) {
          t.shown = Math.min(t.total, t.shown + Math.ceil(t.total * dt / 1.5));
          if (Input.pressed("enter")) t.shown = t.total;
          if (t.shown >= t.total) t.done = true;
        } else if (Input.pressed("enter")) this.nextLevel();
        break;
      }
      case STATE.GAME_OVER:
        if (this.stateT > 1 && Input.pressed("enter")) this.setState(STATE.TITLE);
        break;
      case STATE.VICTORY:
        FX.update(dt);
        if (this.stateT > 2 && Input.pressed("enter")) { FX.clear(); this.setState(STATE.TITLE); }
        break;
    }
    this.updateEngines();
  },

  // Boss reveal (arena entry only, not on respawn): the camera pans to the boss, holds while it
  // raises its claws, and pans back to Buck. No input, no attacks; Jump/Fire skip to a short pan back.
  startReveal() {
    Camera.snap(Player, this.level);
    const xb = clamp(Boss.ox + 47 - W / 2, 0, this.level.pxW - W);     // the whole boss in view
    this.reveal = { t: 0, x0: Camera.x, xb: xb, back: CONFIG.reveal.back };
    Boss.state = "intro"; Boss.t = 99;
  },
  updateReveal(dt) {
    const R = this.reveal, C = CONFIG.reveal, ease = function (u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
    const backAt = C.pan + C.hold;
    if (R.t < backAt && (Input.pressed("jump") || Input.pressed("fire"))) {          // skip
      const fromX = Camera.x;
      R.t = backAt; R.back = C.skipBack; R.xb = fromX;
    }
    R.t += dt;
    Fans.update(dt); FX.update(dt);
    Boss.anim += dt; Boss.t = 99;
    Boss.raised = R.t > C.pan * 0.6 && R.t < backAt; Boss.claw += clamp((Boss.raised ? 1 : 0) - Boss.claw, -dt * 6, dt * 6);
    if (R.t < C.pan) Camera.x = R.x0 + (R.xb - R.x0) * ease(R.t / C.pan);
    else if (R.t < backAt) Camera.x = R.xb;
    else Camera.x = R.xb + (R.x0 - R.xb) * ease((R.t - backAt) / R.back);
    if (R.t >= backAt + R.back) {
      this.reveal = null;
      Camera.snap(Player, this.level);
      Boss.raised = false; Boss.claw = 0; Boss.toIdle();
    }
  },

  updateWorld(dt) {
    const L = this.level;
    this.levelTime += dt;
    Fans.update(dt);
    if (this.lockedMsgT > 0) this.lockedMsgT -= dt;
    if (this.hurtFlash > 0) this.hurtFlash = Math.max(0, this.hurtFlash - dt);
    Player.update(dt, L);
    if (this.state !== STATE.PLAY && this.state !== STATE.BOSS) return;   // death -> game over
    updateHeroShots(dt, L);
    updateEnemies(dt, L);
    if (Boss.active) Boss.update(dt, L);
    updateEnemyShots(dt, L);
    for (const p of this.pickups) p.t += dt;
    // boss arena: the Mega Cutter pickup comes back while Buck lacks the upgrade
    if (this.arenaUpgradeSpot && Player.weapon !== "megacutter" && this.upgradeT > 0) {
      this.upgradeT -= dt;
      if (this.upgradeT <= 0 && !this.pickups.some(function (p) { return p.type === "w"; })) {
        this.addPickup("w", this.arenaUpgradeSpot.x, this.arenaUpgradeSpot.y);
        FX.spark(this.arenaUpgradeSpot.x, this.arenaUpgradeSpot.y - 8, "#ffb040", 12, 70, 0.5);
      }
    }
    if (!Player.dead) {
      for (let i = this.pickups.length - 1; i >= 0; i--) {
        if (overlap(this.pickups[i], Player)) { this.collectPickup(this.pickups[i]); this.pickups.splice(i, 1); }
      }
      for (const c of this.checkpoints) {
        if (!c.on && overlap(c, Player)) {
          c.on = true;
          Player.setCheckpoint(c.x + c.w / 2 - Player.w / 2, c.y + c.h - STAND_H);
          FX.text(c.x + 4, c.y - 6, "CHECKPOINT", "#ffffff");
          Sound.play("checkpoint");
          Fans.react(c.x + c.w / 2, c.y + c.h / 2, "checkpoint");
        }
      }
      if (this.exit && overlap(this.exit, Player)) { this.completeLevel(); return; }
    }
    FX.update(dt);
    if (!Player.dead) Camera.follow(Player, L);
  },

  // ---------------- render ----------------
  render() {
    switch (this.state) {
      case STATE.TITLE: Screens.title(); break;
      case STATE.LEVEL_INTRO: Screens.levelIntro(); break;
      case STATE.PLAY: case STATE.BOSS: this.renderWorld(); break;
      case STATE.PAUSE: this.renderWorld(); Screens.pause(); break;
      case STATE.LEVEL_COMPLETE: Screens.levelComplete(); break;
      case STATE.GAME_OVER: Screens.gameOver(); break;
      case STATE.VICTORY: Screens.victory(); break;
    }
    if (Fullscreen.noteT > 0) {                          // fullscreen / Windows-key status note
      const n = Fullscreen.note, w = n.length * 6 + 8;
      fillRect(Math.round(W / 2 - w / 2), HUD_H + 14, w, 12, "rgba(0,0,0,0.7)");
      drawText(n, W / 2, HUD_H + 16, "#ffe860", { align: "center", shadow: "#000" });
    }
    if (this.showDebug) {
      fillRect(W - 92, H - 12, 92, 12, "rgba(0,0,0,0.7)");
      drawText("UPS " + this.ups + " FPS " + this.fps, W - 2, H - 10, "#40ff40", { align: "right" });
    }
  },

  renderWorld() {
    const L = this.level;
    const sh = FX.shakeOffset();
    const camX = Math.round(Camera.x + sh.x), camY = Math.round(Camera.y + sh.y);
    L.drawBackground(camX, camY);
    L.drawTiles(camX, camY, this.time, "back");
    this.drawObjects(camX, camY);
    L.drawTiles(camX, camY, this.time, "main");
    Fans.draw(camX, camY);                               // background fans, behind everything that moves
    FX.drawStains(camX, camY - HUD_H);
    for (const p of this.pickups) {
      const bob = Math.round(Math.sin(p.t * 4) * 1.5);
      ctx.drawImage(p.img, Math.round(p.x - camX), Math.round(p.y - camY + HUD_H + bob));
    }
    Boss.draw(camX, camY);
    drawEnemies(camX, camY);
    Player.draw(camX, camY);
    for (const s of this.shots) {
      ctx.globalAlpha = s.deflected ? 0.6 : 1;
      const img = s.spin ? (s.mega ? SPR.megaBlade : SPR.sawBlade)[Math.floor(this.time * 24) % 4] : s.img;   // saw blades spin
      ctx.drawImage(s.face > 0 ? img : mirrorCache(img), Math.round(s.x - camX), Math.round(s.y - camY + HUD_H));
      ctx.globalAlpha = 1;
    }
    drawEnemyShots(camX, camY);
    FX.draw(camX, camY - HUD_H);
    Fans.drawHearts(camX, camY);                         // hearts under the bubbles: text stays readable
    Fans.drawBubble(camX, camY);
    L.drawTiles(camX, camY, this.time, "water");
    if (this.hurtFlash > 0) {
      ctx.globalAlpha = Math.min(1, this.hurtFlash / 0.25) * 0.75;
      ctx.drawImage(hurtVignette(), 0, HUD_H);
      ctx.globalAlpha = 1;
    }
    drawHud();
  },

  drawObjects(camX, camY) {
    for (const c of this.checkpoints) {
      const x = Math.round(c.x - camX), y = Math.round(c.y - camY + HUD_H);
      fillRect(x + 1, y, 2, 24, "#c0c4cc");
      const wave = Math.round(Math.sin(this.time * 6) * 1);
      if (c.on) {
        fillRect(x + 3, y + 1 + wave, 11, 9, "#e02020");          // Swiss flag
        fillRect(x + 7, y + 2 + wave, 3, 7, "#ffffff"); fillRect(x + 5, y + 4 + wave, 7, 3, "#ffffff");
      } else fillRect(x + 3, y + 1, 9, 7, "#6a6a74");
    }
    if (this.exit) {
      const e = this.exit, x = Math.round(e.x - camX), y = Math.round(e.y - camY + HUD_H);
      fillRect(x - 2, y - 2, 20, 34, "#30343c");
      fillRect(x, y + 8, 16, 24, "#101018");
      fillRect(x + 2, y + 10, 12, 22, Math.floor(this.time * 3) % 2 ? "#1a6a2a" : "#228a34");
      fillRect(x - 4, y - 10, 24, 9, "#1a8a2a");
      drawText("EXIT", x + 8, y - 9, "#ffffff", { align: "center" });
    }
  },
};

// Pre-rendered red edge vignette for the damage flash.
const hurtVignette = (function () {
  let c = null;
  return function () {
    if (c) return c;
    c = makeCanvas(W, VIEW_H);
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(W / 2, VIEW_H / 2, VIEW_H * 0.35, W / 2, VIEW_H / 2, W * 0.62);
    grad.addColorStop(0, "rgba(200,0,0,0)");
    grad.addColorStop(1, "rgba(220,10,10,0.95)");
    g.fillStyle = grad; g.fillRect(0, 0, W, VIEW_H);
    return c;
  };
})();

const mirrorCache = (function () {
  const m = new Map();
  return function (img) { if (!m.has(img)) m.set(img, mirror(img)); return m.get(img); };
})();

KEYMAP.F3 = "debug";

// ---------------- main loop (fixed 60 Hz timestep) ----------------
let lastTime = 0, acc = 0, upsCount = 0, fpsCount = 0, rateT = 0;
function frame(now) {
  let d = lastTime ? (now - lastTime) / 1000 : 0;
  lastTime = now;
  if (d > 0.25) d = 0.25;                 // avoid spiral after tab switch
  acc += d; rateT += d;
  while (acc >= DT) {
    Game.update(DT);
    Input.endStep();
    acc -= DT; upsCount++;
  }
  Game.render();
  present();
  fpsCount++;
  if (rateT >= 1) { Game.ups = upsCount; Game.fps = fpsCount; upsCount = fpsCount = 0; rateT -= 1; }
  if (!Game.headless) requestAnimationFrame(frame);
}

// Start level from the URL fragment: "level=N" (N = 1..number of levels, the reel number) as
// its own parameter, e.g. "#level=4" or "#debug&level=3". Returns the 0-based level index;
// 0 (level 1) when it is missing or invalid.
function startLevelFromHash(hash) {
  const m = /(?:^#|[#&])level=(\d+)(?:&|$)/.exec(hash || "");
  const n = m ? parseInt(m[1], 10) : 0;
  return n >= 1 && n <= LEVEL_DATA.length ? n - 1 : 0;
}

function boot() {
  loadAssets(function () {
    buildSprites();
    booted = true;
    window.BUCK = { Game: Game, Player: Player, Boss: Boss, Input: Input, Sound: Sound, CONFIG: CONFIG, Camera: Camera, FX: FX };
    if (location.hash.indexOf("debug") >= 0) Game.showDebug = true;
    if (location.hash.indexOf("test") >= 0 && typeof runTests === "function") { runTests(); return; }
    const shot = location.hash.match(/shot=([\w.,]+)/);
    if (shot && typeof runShot === "function") { runShot(shot[1]); return; }
    requestAnimationFrame(frame);
  });
}
