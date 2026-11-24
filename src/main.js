// Game state machine, fixed-timestep loop, pickups, checkpoints and level flow.
const PICKUP_INFO = {
  o: { img: function () { return SPR.ball; } },
  t: { img: function () { return SPR.trophy; } },
  h: { img: function () { return SPR.rivella; } },
  s: { img: function () { return SPR.cervelat; } },
  "{": { img: function () { return SPR.wd40; } },                    // WD-40 can (ride)
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
    // title: the rock theme; every other state: the level's own track (its "music:" header:
    // the ride's biker song, the courts' funk, the clubhouse polka; the Valkyries by default)
    if (s === STATE.TITLE) { Sound.setTrack("title"); Sound.setTempo(1); }
    else Sound.setTrack(this.level ? this.level.music : "valkyries");
  },

  startHash: null,           // tests: stands in for location.hash when set
  soundWasReady: true,       // Sound.ready() at the end of the previous update (the title's sound-first gate)
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
    // boss arena: Buck on the left, the boss ahead; ride: Buck at a third, the traffic ahead
    Camera.anchorX = L.isBoss ? CONFIG.bossCamX : L.isRide ? CONFIG.rideCamX : W / 2;
    this.fans = Fans.spawn(L, i);
    Bar.spawn(L);
    this.enemies = []; this.shots = []; this.enemyShots = []; this.pickups = []; this.checkpoints = []; this.hazards = []; this.signs = [];
    this.reveal = null;
    Cars.reset();
    this.exit = null; this.boss = null; Boss.active = false; this.arenaHealthSpots = []; this.arenaUpgradeSpot = null; this.upgradeT = 0;
    this.stats = { shots: 0, kills: 0 }; this.levelTime = 0; this.hurtFlash = 0;
    FX.clear();
    Player.keys = {};
    let start = null;
    const self = this;
    L.spawns.forEach(function (s) {
      const bx = s.tx * TILE + TILE / 2, by = (s.ty + 1) * TILE;
      switch (s.ch) {
        case "P": start = { x: bx - STAND_W / 2, y: by - STAND_H }; break;
        case "L": self.enemies.push(makeEnemy("lawyer", bx, by, L, -1)); break;
        case "K": self.enemies.push(makeEnemy("cray", bx, by, L, -1)); break;
        case "M": self.enemies.push(makeEnemy("punk", bx, by, L, -1)); break;
        case "X": Boss.init(s.tx * TILE, by); break;
        case "C": self.checkpoints.push({ x: bx - 4, y: by - 24, w: 8, h: 24, on: false }); break;
        case "E": self.exit = { x: s.tx * TILE, y: by - 32, w: 16, h: 32 }; break;
        case "F": case "e": case "]": break;               // cheering fans (tennis; ride: activists, rockers): see Fans.spawn
        case "/": self.hazards.push(Mofa.makeHazard(s.ch, s.tx, s.ty)); break;          // ramps (ride)
        case "1": self.enemies.push(makeEnemy("suv", bx, by, L, 1)); break;            // posh drivers (src/cars.js): the BMW X7
        case "3": case "4": case "5": case "6": case "7": case "8":
          Cars.addTrigger(s.ch, s.tx, s.ty); break;                                     // single cars and traffic waves (CAR_TRIGGERS)
        case "9": self.enemies.push(makeEnemy("limo", bx, by, L, -1)); break;          // the president's limo (ride mini-boss)
        case "S": case ">": case "}": case "(": case ")": self.signs.push({ ch: s.ch, tx: s.tx, ty: s.ty }); break;   // road signs, club gate, roadside props (ride)
        case "O": case "W": break;                         // bar regulars and waitress: see Bar.spawn
        case "h": if (L.isBoss) self.arenaHealthSpots.push({ x: bx, y: by }); self.addPickup(s.ch, bx, by); break;
        case "w": if (L.isBoss) self.arenaUpgradeSpot = { x: bx, y: by }; self.addPickup(s.ch, bx, by); break;
        default: self.addPickup(s.ch, bx, by);
      }
    });
    if (L.isRide) {                                       // on the climb: things sit on the smooth road, not the steps
      this.pickups.forEach(function (p) { p.y += L.slopeShift(p.x + p.w / 2); });
      this.checkpoints.forEach(function (c) { c.y += L.slopeShift(c.x + c.w / 2); });
      if (this.exit) this.exit.y += L.slopeShift(this.exit.x + 8);
      this.signs.forEach(function (s) { s.dy = L.slopeShift(s.tx * TILE + 8); });
      this.fans.forEach(function (f) { f.y += L.slopeShift(f.x + FAN_W / 2); });
      const gate = this.signs.filter(function (g) { return g.ch === "}"; })[0];
      this.enemies.forEach(function (e) {
        if (e.type === "limo" && gate) e.x = gate.tx * TILE - CONFIG.limoGateGap - e.w;   // parked before the gate
        if (e.T.car) e.y = L.roadTop(e.x + e.w / 2) - e.h;
      });
      this.hazards.forEach(function (z) { z.y += L.slopeShift(z.x + z.w / 2); });
    }
    if (!start) start = { x: 32, y: 32 };
    Player.placeAt(start.x, start.y);
    Player.setCheckpoint(start.x, start.y);
    if (L.isRide) Mofa.mount(Player);
    Player.hp = CONFIG.maxHp;
    Player.invuln = 0;
    Player.bubble = null; Player.talkCd = 0; Player.cigarette = false; Player.lighterT = 0; Mofa.finale = null;
    Camera.snap(Player, L);
    Sound.setTempo(L.isBoss ? 1.25 : 1);
    if (L.isBoss) Player.weapon = "cutter";             // the finale is fought with the disc cutter
    else if (L.isRide) Player.weapon = "mofamg";       // the ride: the machine gun on the handlebars
    else if (Player.weapon === "mofamg") Player.weapon = "blaster";   // off the mofa: the standard blaster
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
      case "{":                                          // WD-40 for the mofa: a spray puff
        P.heal(CONFIG.wd40Heal); FX.text(cx, p.y, "WD-40 +2", "#ffe040"); Sound.play("health");
        for (let i = 0; i < 12; i++) FX.parts.push({ x: cx, y: p.y + 2, vx: rnd(30, 90), vy: rnd(-40, 10), life: 0.6, max: 0.6,
          color: i % 2 ? "rgba(255,255,255,0.8)" : "rgba(170,210,255,0.8)", grav: -10, size: 2, smoke: true, wd40: true });
        break;
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
      if (this.level.isRide) {                           // a safe respawn: the cars on screen are gone (the limo stays, with its damage)
        this.enemies = this.enemies.filter(function (e) {
          return !(e.T.car && e.type !== "limo" && e.x + e.w > Camera.x - 32 && e.x < Camera.x + W + 32);
        });
        Cars.pending = [];
      }
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
  // Cars (ride) are heard from further away: a Ferrari's roar about a second before it shows up.
  // the ride's club gate stays closed while the president's limo is still there
  gateLocked() { return this.enemies.some(function (e) { return e.type === "limo" && !e.dead; }); },
  limoOnScreen() {
    return this.enemies.filter(function (e) { return e.type === "limo" && !e.dead && e.x < Camera.x + W && e.x + e.w > Camera.x; })[0] || null;
  },
  engineList() {
    const pcx = Player.cx(), pcy = Player.cy(), x0 = Camera.x - 16, x1 = Camera.x + W + 16;
    return this.enemies.filter(function (e) {
      if (e.dead) return false;
      if (e.T.car) return e.awake && Math.abs(e.x + e.w / 2 - pcx) < 800;
      return e.type === "punk" && e.active && e.x + e.w > x0 && e.x < x1;
    }).map(function (e) {
      const dx = e.x + e.w / 2 - pcx, dy = e.y + e.h / 2 - pcy;
      return { id: e, kind: e.T.car || "mower", state: e.state, throttle: e.state === "rev" ? 1 - e.t / CONFIG.punkRev : 0, dist: Math.sqrt(dx * dx + dy * dy) };
    }).sort(function (a, b) { return a.dist - b.dist; }).slice(0, 2);
  },
  updateEngines() {
    const playing = this.state === STATE.PLAY || this.state === STATE.BOSS;
    const list = playing && this.level ? this.engineList() : [];
    list.forEach(function (m) {                        // pull-start when a mower's engine first runs
      if (m.kind === "mower" && !m.id.engineStarted) { m.id.engineStarted = true; Sound.play("pullstart"); }
    });
    Sound.setEngines(list);
    Sound.setMofa(playing && this.level && this.level.isRide && !Player.dead ? Mofa.load(Player) : null);   // the mofa's two-stroke (strains uphill)
  },

  update(dt) {
    this.time += dt; this.stateT += dt;
    if (Input.pressed("mute")) Sound.toggleMute();
    if (Input.pressed("debug")) this.showDebug = !this.showDebug;
    if (Input.pressed("film")) Film.enabled = !Film.enabled;
    if (Fullscreen.noteT > 0) Fullscreen.noteT = Math.max(0, Fullscreen.noteT - dt);
    switch (this.state) {
      case STATE.TITLE:
        // sound first: an Enter (or tap) that is turning the sound on only starts the title theme;
        // once the sound was on before this input, Enter starts the game
        if (Input.pressed("enter") && this.soundWasReady) { Sound.play("select"); this.newGame(); }
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
    Talk.update(dt);
    this.updateEngines();
    this.soundWasReady = Sound.ready();
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
    Fans.update(dt);
    Bar.update(dt); FX.update(dt);
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
    Bar.update(dt);
    if (this.lockedMsgT > 0) this.lockedMsgT -= dt;
    if (this.hurtFlash > 0) this.hurtFlash = Math.max(0, this.hurtFlash - dt);
    Player.update(dt, L);
    if (L.isRide) Cars.update(dt);
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
          Player.setCheckpoint(c.x + c.w / 2 - STAND_W / 2, c.y + c.h - STAND_H);
          FX.text(c.x + 4, c.y - 6, "CHECKPOINT", "#ffffff");
          Sound.play("checkpoint");
          Fans.react(c.x + c.w / 2, c.y + c.h / 2, "checkpoint");
        }
      }
      if (this.exit && overlap(this.exit, Player) && !this.gateLocked()) { this.completeLevel(); return; }
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
    Bar.drawBack(camX, camY);                            // the waitress: the counter tiles hide her legs
    L.drawTiles(camX, camY, this.time, "main");
    Fans.draw(camX, camY);                               // background fans, behind everything that moves
    Bar.drawFront(camX, camY);
    if (L.isRide) { Mofa.drawSigns(camX, camY); Mofa.drawHazards(camX, camY); }
    FX.drawStains(camX, camY - HUD_H);
    for (const p of this.pickups) {
      const bob = Math.round(Math.sin(p.t * 4) * 1.5);
      ctx.drawImage(p.img, Math.round(p.x - camX), Math.round(p.y - camY + HUD_H + bob));
    }
    Boss.draw(camX, camY);
    if (L.isRide) Cars.draw(camX, camY);
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
    Talk.draw(camX, camY);
    Bar.drawBubble(camX, camY);
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
  // An update may run up to a quarter step early (acc carries the difference, so the
  // average stays exactly 60/s): refresh timestamps jitter around 1/60 s, and without
  // this slack a 60 Hz display alternates 0 and 2 updates per refresh.
  let stepped = 0;
  while (acc >= DT * 0.75) {
    Game.update(DT);
    Input.endStep();
    acc -= DT; upsCount++; stepped++;
  }
  // draw only when the state changed: a 120/144 Hz display would otherwise draw (and
  // film-filter) the same state 2-3 times
  if (stepped > 0) {
    Game.render();
    present();
    fpsCount++;
  }
  if (Touch.on) Touch.tick();
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
  Touch.init();             // touch mode on phones / #touch (src/touch.js)
  Sound.tryAutoplay();      // the title music right away where the browser allows it
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
