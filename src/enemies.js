// Lawyers, mutant crayfish and gardener-punks with lawn mowers, plus enemy projectiles.

function isActive(e) {
  // Enemies only think/move when within one screen of the visible area.
  return e.x + e.w > Camera.x - CONFIG.activateMarginX && e.x < Camera.x + W + CONFIG.activateMarginX &&
         e.y + e.h > Camera.y - CONFIG.activateMarginY && e.y < Camera.y + VIEW_H + CONFIG.activateMarginY;
}

// Is there floor in front of the enemy's leading foot?
function groundAhead(e, level) {
  const fx = e.vx >= 0 ? e.x + e.w + 1 : e.x - 1;
  return level.isFloor(Math.floor(fx / TILE), Math.floor((e.y + e.h + 2) / TILE));
}

function heroInFront(e, range, dyMax) {
  const dx = Player.cx() - (e.x + e.w / 2);
  const dy = Math.abs(Player.cy() - (e.y + e.h / 2));
  return !Player.dead && Math.sign(dx) === e.face && Math.abs(dx) < range && dy < dyMax;
}

function spawnEnemyShot(s) { Game.enemyShots.push(s); }

// Legal one-liners the lawyers call out when throwing (at most 20 characters, game font).
const LAWYER_LINES = ["ART. 41 OR!", "OBJECTION!", "SEE YOU IN BERN!", "YOU'RE SUED!", "TERMS APPLY!", "SIGN HERE!",
  "ZGB SAYS NO!", "SCHKG FOR YOU!", "OVERRULED!", "BILLABLE HOURS!", "ART. 8 ZGB, BUCK!", "STGB ART. 139!"];
// Speech bubbles of enemies (lawyers' legal lines, posh drivers in src/cars.js): a shuffled deck
// per line pool, one bubble on screen at a time.
const Talk = {
  decks: new Map(),
  line(pool) {
    let deck = this.decks.get(pool);
    if (!deck || !deck.length) {
      deck = pool.slice();
      for (let i = deck.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); const t = deck[i]; deck[i] = deck[k]; deck[k] = t; }
      this.decks.set(pool, deck);
    }
    return deck.pop();
  },
  // shows a line over e (dx: the speaker's x inside e, default its centre); returns true when it spoke.
  // Elsewhere one bubble at a time; on the ride up to CONFIG.rideBubbles car bubbles, and a new one
  // only where it overlaps no other car bubble and no fan bubble.
  say(e, pool, secs, dx) {
    const others = Game.enemies.filter(function (o) { return o !== e && o.bubble && !o.dead; });
    const ride = Game.level && Game.level.isRide && e.T && e.T.car;
    if (!ride && others.length) return false;
    if (ride && others.length >= CONFIG.rideBubbles) return false;
    const bubble = { text: this.line(pool), t: secs, dx: dx };
    if (ride) {
      const r = this.rect(e, bubble, Camera.x, Camera.y);
      const busy = others.map(function (o) { return Talk.rect(o, o.bubble, Camera.x, Camera.y); }).concat(Fans.shown || []);
      if (busy.some(function (q) { return rectsTouch(r, q, 3); })) return false;
    }
    e.bubble = bubble;
    return true;
  },
  // the bubble's box on screen (as drawn): {x, y, w, h, tx}
  rect(e, bubble, camX, camY) {
    const w = textWidth(bubble.text) + 6, h = 11;
    const cx = Math.round(e.x + (bubble.dx !== undefined ? bubble.dx : e.w / 2) - camX), top = Math.round(e.y - camY + HUD_H) - h - 3;
    return { x: clamp(cx - Math.floor(w / 2), 2, W - w - 2), y: Math.max(HUD_H + 2, top), w: w, h: h, tx: cx };
  },
  // the car bubbles currently up (screen boxes), for the fans to keep clear of
  rects(camX, camY) {
    return Game.enemies.filter(function (e) { return e.bubble && !e.dead; }).map(function (e) { return Talk.rect(e, e.bubble, camX, camY); });
  },
  // a lawyer's throw may come with a line: once per lawyerTalkCd per lawyer
  maybe(e) {
    if (e.talkCd > 0 || Math.random() >= CONFIG.lawyerTalkChance) return;
    if (this.say(e, LAWYER_LINES, CONFIG.lawyerTalkT)) e.talkCd = CONFIG.lawyerTalkCd;
  },
  draw(camX, camY) {
    for (const e of Game.enemies) {
      if (!e.bubble || e.dead) continue;
      const r = this.rect(e, e.bubble, camX, camY);
      drawSpeechBubble(e.bubble.text, r.x, r.y, r.w, r.h, r.tx);
    }
  },
};

const ENEMY_TYPES = {
  lawyer: {
    w: 12, h: 30, hp: CONFIG.lawyerHp, points: CONFIG.lawyerPoints, contact: 1,
    init(e) { e.vx = CONFIG.lawyerSpeed * e.face; e.cd = 0.8 + Math.random(); e.throwT = 0; },
    update(e, dt, level) {
      e.cd -= dt;
      if (e.talkCd > 0) e.talkCd -= dt;
      if (e.bubble && (e.bubble.t -= dt) <= 0) e.bubble = null;
      if (e.throwT > 0) {
        e.throwT -= dt; e.vx = 0;
        if (e.throwT <= 0.2 && !e.thrown) {
          e.thrown = true;
          spawnEnemyShot({ kind: "lawbook", code: Math.floor(Math.random() * LAWBOOK_CODES.length),   // a Swiss law book
            x: e.x + (e.face > 0 ? e.w : -10), y: e.y + 10, w: 10, h: 8, vx: 125 * e.face, vy: -70, grav: 160, dmg: 1, t: 0 });
          Sound.play("throw");
        }
        if (e.throwT <= 0) e.vx = CONFIG.lawyerSpeed * e.face;
      } else {
        e.vx = CONFIG.lawyerSpeed * e.face;
        if (e.cd <= 0 && heroInFront(e, CONFIG.lawyerRange, 20)) {
          e.throwT = 0.6; e.thrown = false; e.cd = CONFIG.lawyerCooldown;
          Talk.maybe(e);
        }
      }
      e.vy = Math.min(CONFIG.maxFall, e.vy + CONFIG.gravity * dt);
      if (e.onGround && e.vx !== 0 && !groundAhead(e, level)) { e.face = -e.face; e.vx = -e.vx; e.turned = (e.turned || 0) + 1; }
      const res = moveBody(e, dt, level, { platforms: true });
      e.onGround = res.ground;
      if (res.wallL || res.wallR) { e.face = res.wallL ? 1 : -1; }
      e.anim += dt * (e.vx ? 4 : 0);
    },
    sprite(e) { return e.throwT > 0 ? SPR.lawyerThrow : SPR.lawyer[Math.floor(e.anim) % 2]; },
  },

  cray: {
    w: 20, h: 10, hp: CONFIG.crayHp, points: CONFIG.crayPoints, contact: 1,
    init(e, level) {
      e.vx = CONFIG.craySpeed * e.face; e.cd = 0.5;
      e.submerged = level.isWater(Math.floor((e.x + e.w / 2) / TILE), Math.floor((e.y + e.h - 1) / TILE));
      e.subT = 0;
    },
    update(e, dt, level) {
      const dx = Player.cx() - (e.x + e.w / 2), dy = Player.cy() - (e.y + e.h / 2);
      if (e.submerged) {
        e.vx = 0; e.vy = 0; e.subT -= dt;
        if (e.subT <= 0 && !Player.dead && Math.abs(dx) < 110 && Math.abs(dy) < 90) {
          // emerge: leap out of the water toward the hero
          e.submerged = false; e.leaping = true; e.face = Math.sign(dx) || 1;
          e.vy = -340; e.vx = clamp(dx / 0.7, -130, 130);
          FX.spark(e.x + e.w / 2, e.y, level.waterPalette.splash, 14, 100, 0.5);
          Sound.play("leap");
        }
        return;
      }
      e.cd -= dt;
      if (e.onGround && !e.leaping) {
        e.vx = CONFIG.craySpeed * e.face;
        if (e.cd <= 0 && !Player.dead && Math.abs(dx) < CONFIG.crayLeapRange && Math.abs(dy) < 60) {
          // leap in an arc toward the hero's position
          e.face = Math.sign(dx) || e.face;
          e.vy = -260; e.vx = clamp(dx / 0.52, -120, 120);
          e.leaping = true; e.cd = CONFIG.crayCooldown; e.leaps = (e.leaps || 0) + 1;
          Sound.play("leap");
        } else if (!groundAhead(e, level)) { e.face = -e.face; e.vx = -e.vx; }
      }
      e.vy = Math.min(CONFIG.maxFall, e.vy + CONFIG.gravity * dt);
      const res = moveBody(e, dt, level, { platforms: true });
      if (res.ground && e.leaping) e.leaping = false;
      e.onGround = res.ground;
      if ((res.wallL || res.wallR) && !e.leaping) e.face = res.wallL ? 1 : -1;
      // falling back into the water: dive and re-emerge later
      if (e.vy > 0 && level.isWater(Math.floor((e.x + e.w / 2) / TILE), Math.floor((e.y + e.h - 2) / TILE))) {
        e.submerged = true; e.subT = 1.5; e.leaping = false;
        e.y = Math.floor((e.y + e.h - 2) / TILE) * TILE + TILE - e.h;
      }
      e.anim += dt * 8;
    },
    sprite(e) { return SPR.cray[Math.floor(e.anim) % 2]; },
    hidden(e) { return e.submerged; },
  },

  // Gardener-punk pushing a lawn mower: patrol -> rev (wind-up) -> charge -> cooldown.
  punk: {
    w: 24, h: 28, hp: CONFIG.punkHp, points: CONFIG.punkPoints, contact: 2,
    init(e) { e.state = "patrol"; e.vx = CONFIG.punkSpeed * e.face; e.cd = 0.8; e.smokeT = Math.random(); e.puffs = 0; e.turned = 0; },
    update(e, dt, level) {
      e.cd -= dt;
      // the blunt: a smoke puff about once per second (cosmetic)
      e.smokeT -= dt;
      if (e.smokeT <= 0) {
        e.smokeT = rnd(0.85, 1.15); e.puffs++;
        const bx = e.face > 0 ? e.x + e.w / 2 - 5 : e.x + e.w / 2 + 4;
        FX.parts.push({ x: bx, y: e.y + e.h - 23, vx: rnd(-4, 4), vy: rnd(-16, -10), life: 1.3, max: 1.3,
          color: Math.random() < 0.5 ? "rgba(200,200,190,0.55)" : "rgba(150,160,140,0.5)", grav: -4, size: 2, smoke: true });
      }
      punkExhaust(e, dt);
      const front = e.face > 0 ? e.x + e.w : e.x;
      switch (e.state) {
        case "patrol":
          e.vx = CONFIG.punkSpeed * e.face;
          if (e.cd <= 0 && heroInFront(e, CONFIG.punkRange, 24)) {
            e.state = "rev"; e.t = CONFIG.punkRev; e.vx = 0; Sound.play("rev");
          }
          break;
        case "rev":
          e.vx = 0; e.t -= dt;
          if (e.t <= 0) { e.state = "charge"; e.dist = 0; e.clipT = 0; e.charges = (e.charges || 0) + 1; Sound.play("mower"); }
          break;
        case "charge":
          e.vx = CONFIG.punkChargeSpeed * e.face;
          e.clipT -= dt;
          if (e.clipT <= 0) {
            e.clipT = 0.08;
            const stone = Math.random() < 0.3;
            spawnEnemyShot({ kind: "clipping", stone: stone, x: front - (e.face > 0 ? 0 : 3), y: e.y + e.h - 8 + rnd(-2, 2),
              w: stone ? 3 : 2, h: stone ? 3 : 2, vx: e.face * rnd(140, 200) + e.vx * 0.3, vy: rnd(-80, -20), grav: 300, dmg: 1, life: 0.35 });
          }
          break;
      }
      e.vy = Math.min(CONFIG.maxFall, e.vy + CONFIG.gravity * dt);
      if (e.onGround && e.vx !== 0 && !groundAhead(e, level)) {
        if (e.state === "charge") { e.state = "patrol"; e.cd = CONFIG.punkCooldown; }
        e.face = -e.face; e.vx = CONFIG.punkSpeed * e.face; e.turned++;
      }
      const res = moveBody(e, dt, level, { platforms: true });
      e.onGround = res.ground;
      if (e.state === "charge") e.dist += Math.abs(e.vx) * dt;
      if (res.wallL || res.wallR) {
        e.face = res.wallL ? 1 : -1;
        if (e.state === "charge") { e.state = "patrol"; e.cd = CONFIG.punkCooldown; }
      }
      if (e.state === "charge" && e.dist >= CONFIG.punkChargeMax) { e.state = "patrol"; e.cd = CONFIG.punkCooldown; }
      e.anim += dt * (e.state === "charge" ? 14 : 6);
    },
    sprite(e) {
      if (e.state === "rev") return Math.floor(e.anim * 2 + e.t * 30) % 2 ? SPR.punk.rev : SPR.punk.walk[0];
      return SPR.punk.walk[Math.floor(e.anim) % 2];
    },
  },
};

// Petrol-mower exhaust from the muffler, following the engine: light blue-grey puffs while
// patrolling, thick black clouds while revving, a dark trail while charging. Cosmetic.
const EXHAUST = {
  patrol: { every: [0.2, 0.28], color: "rgba(215,220,228,0.8)", size: [2, 3], vy: [-24, -16], back: [1, 5], life: 1.1 },
  rev:    { every: [0.035, 0.05], color: "rgba(36,36,36,0.85)", size: [3, 4], vy: [-34, -20], back: [2, 8], life: 0.9 },
  charge: { every: [0.05, 0.05], color: "rgba(28,28,28,0.8)", size: [3, 4], vy: [-16, -8], back: [30, 50], life: 0.7 },
};
function punkExhaust(e, dt) {
  const X = EXHAUST[e.state] || EXHAUST.patrol;
  e.exhaustT = (e.exhaustT === undefined ? Math.random() * 0.2 : e.exhaustT) - dt;
  if (e.exhaustT > 0) return;
  e.exhaustT = rnd(X.every[0], X.every[1]);
  const fx = e.x + e.w / 2 - 15 + (e.face > 0 ? MOWER_EXHAUST.x : 29 - MOWER_EXHAUST.x);
  const fy = e.y + e.h - 30 + MOWER_EXHAUST.y - 2;
  FX.parts.push({ x: fx, y: fy, vx: -e.face * rnd(X.back[0], X.back[1]), vy: rnd(X.vy[0], X.vy[1]), life: X.life, max: X.life,
    color: X.color, grav: -6, size: Math.round(rnd(X.size[0], X.size[1])), smoke: true, exhaust: e.state });
  e.exhaust = e.exhaust || { patrol: 0, rev: 0, charge: 0 };
  e.exhaust[e.state] = (e.exhaust[e.state] || 0) + 1;
}

function makeEnemy(type, px, py, level, face) {
  const T = ENEMY_TYPES[type];
  const e = { type: type, T: T, x: px, y: py, w: T.w, h: T.h, vx: 0, vy: 0, hp: T.hp, face: face || -1,
              flash: 0, anim: 0, onGround: false, dead: false };
  e.x -= e.w / 2; e.y -= e.h;           // px,py = bottom centre
  T.init(e, level);
  return e;
}

// Per-type gore. dir: direction of the killing/hitting shot (-1, 0, 1).
const GORE_BY_TYPE = {
  lawyer: {
    hit(e, x, y, dir) { FX.blood(x, y, dir, 4); },
    die(e, x, y, dir) {
      FX.blood(x, y, dir, 40); FX.gibs(x, y, GORE.blood.concat(GORE.suit), 6);
      // the subpoenas go flying
      for (let i = 0; i < 6; i++) FX.parts.push({ x: x, y: y - 6, vx: rnd(-60, 60), vy: rnd(-120, -40), life: 1.6, max: 1.6, color: "#f0ecd8", grav: 60, size: 2 });
    },
  },
  cray: {
    hit(e, x, y, dir) { FX.blood(x, y, dir, 3); },
    die(e, x, y, dir) { FX.blood(x, y, dir, 30); FX.gibs(x, y, GORE.shell, 5); },
  },
  // punk: a shot against his facing hits the mower (oil, sparks); otherwise it hits him (blood)
  punk: {
    hit(e, x, y, dir) {
      if (dir === -e.face) { FX.blood(x, y + 6, dir, 3, GORE.oil); FX.spark(x, y + 6, pick(GORE.spark), 4, 90, 0.3, 200); }
      else FX.blood(x, y, dir, 4);
    },
    die(e, x, y, dir) {
      Sound.play("choke");                             // the engine sputters and dies with him
      FX.blood(x, y - 4, dir, 35); FX.gibs(x, y - 4, GORE.blood.concat(GORE.punk), 6);
      const mx = x + e.face * 8, my = y + 8;
      FX.blood(mx, my, dir, 20, GORE.oil);
      for (let i = 0; i < 3; i++) FX.spark(mx, my, GORE.spark[i], 7, 140, 0.5, 250);
      FX.gibs(mx, my, GORE.metal.concat(["#c82020"]), 5, false);
      FX.parts.push({ x: mx, y: my, vx: 0, vy: 0, life: 0.15, max: 0.15, ring: 10, color: "#fff4a0", grav: 0 });
    },
  },
};

function damageEnemy(e, dmg, dir) {
  e.hp -= dmg; e.flash = 0.08;
  dir = dir || 0;
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
  const gore = GORE_BY_TYPE[e.type];
  if (e.hp <= 0) {
    e.dead = true;
    gore.die(e, cx, cy, dir);
    FX.text(e.x + e.w / 2, e.y - 4, e.T.points, "#ffe860");
    Game.addScore(e.T.points);
    Game.stats.kills++;
    Fans.react(e.x + e.w / 2, e.y + e.h / 2, "kill");
    Sound.play("explode");
  } else { gore.hit(e, cx - dir * e.w / 2, cy, dir); Sound.play("hit"); }
}

function updateEnemies(dt, level) {
  const list = Game.enemies;
  for (let i = list.length - 1; i >= 0; i--) {
    const e = list[i];
    if (e.dead) { list.splice(i, 1); continue; }
    if (!(e.T.car && e.awake) && !isActive(e)) { e.active = false; continue; }   // a car once on the road keeps driving
    e.active = true; e.awake = true;
    if (e.flash > 0) e.flash -= dt;
    e.T.update(e, dt, level);
    if (e.y > level.pxH + 32) { e.dead = true; continue; }
    const hidden = e.T.hidden && e.T.hidden(e);
    if (!hidden && overlap(e, Player) && Player.hurt(e.T.contact) && e.T.car) {
      Player.vx = (Player.cx() < e.x + e.w / 2 ? -1 : 1) * CONFIG.carKnockback; Player.vy = -200;   // cars throw the mofa back hard
    }
  }
}

// A law book bursts into fluttering pages and the floating label names one of its articles.
function burstBook(s) {
  const b = LAWBOOK_CODES[s.code || 0], cx = s.x + s.w / 2, cy = s.y + s.h / 2;
  FX.spark(cx, cy, "#f4ecd0", 5, 70, 0.9, 90);
  FX.spark(cx, cy, "#ffffff", 3, 60, 0.9, 90);
  FX.text(cx, cy - 8, b.arts[Math.floor(Math.random() * b.arts.length)], b.cover === "#2a4ca0" ? "#7fa0ff" : b.cover);
}

function updateEnemyShots(dt, level) {
  const list = Game.enemyShots;
  for (let i = list.length - 1; i >= 0; i--) {
    const s = list[i];
    let remove = false;
    if (s.kind === "shockwave") {
      s.x += s.vx * dt; s.life -= dt;
      if (Math.random() < 0.6) FX.parts.push({ x: s.x + s.w / 2, y: s.y + s.h, vx: rnd(-20, 20), vy: rnd(-80, -30), life: 0.3, max: 0.3, color: "#c8a070", grav: 300 });
      if (s.life <= 0 || s.x < -20 || s.x > level.pxW + 20) remove = true;
      // stopped by the first solid tile or crate at floor height; wears down breakable crates
      const lx = s.vx < 0 ? s.x : s.x + s.w, ltx = Math.floor(lx / TILE), lty = Math.floor((s.y + s.h - 1) / TILE);
      if (!remove && level.isSolid(ltx, lty)) {
        remove = true;
        FX.spark(lx, s.y + s.h - 2, "#c8a070", 14, 90, 0.5, 300);
        if (level.at(ltx, lty) === "d") level.hitCrate(ltx, lty, CONFIG.shockwaveCrateDmg);
      }
    } else {
      s.vy += (s.grav || 0) * dt;
      s.x += s.vx * dt; s.y += s.vy * dt; s.t = (s.t || 0) + dt;
      if (s.life !== undefined) { s.life -= dt; if (s.life <= 0) remove = true; }
      if (level.isSolid(Math.floor((s.x + s.w / 2) / TILE), Math.floor((s.y + s.h / 2) / TILE))) {
        remove = true; FX.spark(s.x + s.w / 2, s.y + s.h / 2, s.kind === "bubble" ? "#bfe6ff" : "#a07040", 6, 60, 0.3);
        if (s.kind === "lawbook") burstBook(s);
      }
      if (s.y > level.pxH + 20 || s.x < Camera.x - 40 || s.x > Camera.x + W + 40) remove = true;
    }
    if (!remove && overlap(s, Player)) {
      // projectiles vanish on a successful hit; spray clouds and shockwaves persist
      if (Player.hurt(s.dmg) && s.kind !== "shockwave") { remove = true; if (s.kind === "lawbook") burstBook(s); }
    }
    if (remove) list.splice(i, 1);
  }
}

// Hero projectiles vs walls, enemies and the boss.
function updateHeroShots(dt, level) {
  const list = Game.shots;
  for (let i = list.length - 1; i >= 0; i--) {
    const s = list[i];
    s.x += s.vx * dt;
    if (s.vy) s.y += s.vy * dt;
    let remove = false;
    if (s.deflected) {
      s.life -= dt; if (s.life <= 0) remove = true;
    } else {
      const fx = s.vx > 0 ? s.x + s.w : s.x;
      const ttx = Math.floor(fx / TILE), tty = Math.floor((s.y + s.h / 2) / TILE), t = level.at(ttx, tty);
      if (SOLID_CH.indexOf(t) >= 0) {
        remove = true; FX.spark(fx, s.y + s.h / 2, "#ffe860", 5, 50, 0.25);
        if (t === "d") level.hitCrate(ttx, tty, s.dmg || 1);
      }
      if (!remove) {
        for (const e of Game.enemies) {
          if (e.dead || !e.active || (e.T.hidden && e.T.hidden(e))) continue;
          if (overlap(s, e)) { damageEnemy(e, s.dmg, Math.sign(s.vx)); remove = true; break; }
        }
      }
      if (!remove) {                                     // thrown latte cups and golf balls can be shot down
        for (let k = Game.enemyShots.length - 1; k >= 0; k--) {
          const t = Game.enemyShots[k];
          if (t.shootable && overlap(s, t)) {
            FX.spark(t.x + t.w / 2, t.y + t.h / 2, t.kind === "latte" ? "#f0e8d8" : "#ffffff", 6, 70, 0.3);
            Game.enemyShots.splice(k, 1); remove = true; Sound.play("hit"); break;
          }
        }
      }
      if (!remove && Game.boss && Boss.hitByShot(s)) remove = !s.deflected;
    }
    // leaves the screen
    if (s.x + s.w < Camera.x || s.x > Camera.x + W) remove = true;
    if (remove) list.splice(i, 1);
  }
}

function drawEnemies(camX, camY) {
  for (const e of Game.enemies) {
    if (e.T.hidden && e.T.hidden(e)) {
      // bubbles where a crayfish lurks
      if (Math.floor(Game.time * 3 + e.x) % 3 === 0)
        fillRect(e.x + e.w / 2 - camX + Math.sin(Game.time * 5 + e.x) * 3, e.y - 2 - camY + HUD_H, 2, 2, Game.level.waterPalette.bubble);
      continue;
    }
    const set = e.T.sprite(e);
    const right = e.face > 0;
    const img = e.flash > 0 ? (right ? set.fr : set.fl) : (right ? set.r : set.l);
    const px = Math.round(e.x + e.w / 2 - set.w / 2 - camX);
    const py = Math.round(e.y + e.h - set.h - camY + HUD_H);
    ctx.drawImage(img, px - set.pad, py - set.pad);
  }
}

function drawEnemyShots(camX, camY) {
  for (const s of Game.enemyShots) {
    const sx = Math.round(s.x - camX), sy = Math.round(s.y - camY + HUD_H);
    if (s.kind === "lawbook") {
      const set = SPR.lawbook[s.code || 0][Math.floor(s.t * 10) % 2];       // tumbling
      ctx.drawImage(s.vx < 0 ? set.l : set.r, sx - set.pad, sy - set.pad);
    } else if (s.kind === "bubble") {
      ctx.drawImage(SPR.bubble, sx, sy);
    } else if (s.kind === "shockwave") {
      fillRect(sx, sy + 4, s.w, s.h - 4, "rgba(200,160,112,0.8)");
      fillRect(sx + 2, sy, s.w - 4, 4, "rgba(240,220,180,0.8)");
    } else if (s.kind === "latte") {                    // take-away cup with lid
      fillRect(sx, sy, 6, 8, "#0a0608"); fillRect(sx + 1, sy + 2, 4, 5, "#f4f0e8"); fillRect(sx + 1, sy + 1, 4, 1, "#8a5a30"); fillRect(sx + 1, sy + 4, 4, 1, "#a06030");
    } else if (s.kind === "cork") {                      // champagne cork
      fillRect(sx, sy, 5, 4, "#0a0608"); fillRect(sx + 1, sy + 1, 3, 2, "#c8985a"); fillRect(sx + 1, sy + 1, 1, 2, "#e8c080");
    } else if (s.kind === "golfball") {
      pxEllipse(ctx, sx + 3, sy + 2, 3, 2, "#0a0608"); pxEllipse(ctx, sx + 3, sy + 2, 2, 1, "#ffffff");
    } else if (s.kind === "clipping") {
      fillRect(sx, sy, s.w, s.h, s.stone ? "#8a8680" : (Math.floor(s.x) % 2 ? "#5ab040" : "#3e8a2c"));
    }
  }
}
