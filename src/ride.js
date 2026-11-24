// The mofa ride (reel 1): Buck on a Sachs mofa with a machine gun on the handlebars. Riding is
// a mode of Player: Player.update/draw/fire hand over to Mofa on ride levels; health, damage,
// lives, checkpoints and respawn stay Player's. Only the horizontal speed model is the mofa's:
// Right accelerates to the top speed, Left brakes and then rolls back slowly, nothing coasts.
// Roadside props per stretch (index from Level.stretchAt): [the ( prop, the ) prop].
const PROP_KINDS = [["railing", "bench"], ["flowers", "swissflag"], ["vines", "stonewall"], ["hedge", "clubflag"]];

const Mofa = {
  // Puts the (standing-size) player box on the mofa: wider and a bit taller, feet and centre kept.
  mount(P) {
    const feet = P.y + P.h, cx = P.x + P.w / 2;
    P.w = CONFIG.mofaW; P.h = CONFIG.mofaH;
    P.x = cx - P.w / 2; P.y = feet - P.h;
    P.vx = 0; P.face = 1; P.kneeling = false; P.climbing = false; P.jumping = false;
    P.wheelT = 0;
    const L = Game.level;
    if (L && L.isRide && L.roadTop) {                   // wheels on the road (on the climb too)
      P.y = Math.min(L.roadTop(P.x + 4), L.roadTop(P.x + P.w - 4)) - P.h; P.vy = 0; P.onGround = true;
    }
  },

  // Uphill grade under the mofa (rise per px ahead; 0 on the flat or downhill).
  grade(P, level) {
    const cx = P.x + P.w / 2;
    return Math.max(0, (level.roadTop(cx) - level.roadTop(cx + TILE)) / TILE);
  },
  // Engine load 0..1 for the sound: the speed, or full throttle when climbing with the gas open.
  load(P) {
    const s = this.speed01(P);
    return Input.down("right") && P.onGround && this.grade(P, Game.level) > 0.02 ? 1 : s;
  },
  // ---------------- the limo finale ----------------
  // When the limo is destroyed: play pauses (no gas, fire or jump; Buck can't be hurt) while the
  // mofa rolls to a stop, the two posh ladies crawl out of the wreck one after the other with a
  // line each, Buck answers "YOU HAVE NO CLUE" and lights a cigarette; Fire or Jump skips it.
  finale: null,
  startFinale(limo) {
    const lines = shuffle(LIMO_FINALE_LINES.slice());
    const floor = limo.y + limo.h;
    this.finale = { t: 0, ladies: [limoX(37), limoX(107)].map(function (dx, i) {
      return { x: limo.x + dx - 6, y: floor - 7, dir: i ? 1 : -1, style: i, out: false, line: lines[i], bubble: null, anim: 0 };
    }) };
    Cars.pending = []; Cars.triggers = []; Game.enemyShots = [];
  },
  updateFinale(P, dt) {
    const F = this.finale, T = CONFIG.finale;
    if (!F) return;
    const t0 = F.t; F.t += dt;
    const at = function (k) { return t0 < T[k] && F.t >= T[k]; };
    const ladies = F.ladies;
    if (at("lady1")) ladies[0].out = true;
    if (at("lady2")) ladies[1].out = true;
    if (at("say1")) ladies[0].bubble = { text: ladies[0].line, t: 1.6 };
    if (at("say2")) ladies[1].bubble = { text: ladies[1].line, t: 1.6 };
    if (at("buck")) { P.bubble = { text: "YOU HAVE NO CLUE", t: 1.8 }; P.talkCd = CONFIG.buckTalkCd; }
    if (at("light")) P.lighterT = T.lit - T.light;
    if (at("lit")) { P.cigarette = true; P.puffT = 0; }
    ladies.forEach(function (l) {
      if (l.out) { l.x += l.dir * T.crawl * dt; l.anim += dt * 4; }
      if (l.bubble && (l.bubble.t -= dt) <= 0) l.bubble = null;
    });
    if (P.lighterT > 0) P.lighterT -= dt;
    const skip = F.t > T.skipAfter && (Input.pressed("fire") || Input.pressed("jump"));
    if (F.t >= T.end || skip) this.endFinale(P);
  },
  endFinale(P) {
    const F = this.finale;
    if (!F) return;
    F.ladies.forEach(function (l) {                      // they get up and run off in their dresses
      Cars.runners.push({ x: l.x + 6, y: l.y - 7, vx: l.dir * 95, t: 3, anim: 0, lady: l.style });
    });
    if (!P.cigarette) { P.cigarette = true; P.puffT = 0; }
    P.lighterT = 0;
    this.finale = null;
  },
  // a lit cigarette at Buck's mouth puffs a little smoke about every 1.1 s
  updateCigarette(P, dt) {
    if (!P.cigarette) return;
    if ((P.puffT -= dt) > 0) return;
    P.puffT = 1.1;
    const m = this.mouth(P);
    FX.parts.push({ x: m.x + 4, y: m.y - 1, vx: rnd(-6, 6) + P.vx * 0.3, vy: rnd(-22, -14), life: 1.2, max: 1.2, color: "rgba(200,200,205,0.6)", grav: -6, size: 2, smoke: true, cig: true });
  },
  mouth(P) {                                             // world position of Buck's mouth on the mofa
    const mx = P.x + P.w / 2 - MOFA_SPR_W / 2, my = P.y + P.h - MOFA_SPR_H;
    return { x: mx + MOFA_RIDER_X + 11, y: my + MOFA_SEAT_Y - MOFA_HIP_ROW + 7 };
  },
  drawFinale(camX, camY) {
    const F = this.finale;
    if (!F) return;
    const oy = HUD_H - camY;
    F.ladies.forEach(function (l) {
      if (!l.out) return;
      const S = SPR.ladyCrawl[l.style][Math.floor(l.anim) % 2];
      ctx.drawImage(l.dir > 0 ? S.r : S.l, Math.round(l.x - camX) - S.pad, Math.round(l.y + oy) - S.pad);
    });
  },
  update(P, dt, level) {
    const grade = this.grade(P, level);
    const climbF = Math.max(0.4, 1 - CONFIG.mofaClimbK * grade), top = CONFIG.mofaTop * climbF, locked = !!this.finale, gas = !locked && Input.down("right"), brake = locked || Input.down("left");
    P.face = 1;                                          // rolling back still faces right
    if (P.onGround && P.hurtT <= 0) {
      if (gas && !brake) P.vx = P.vx > top ? Math.max(top, P.vx - 90 * dt) : Math.min(top, P.vx + (P.vx < 0 ? CONFIG.mofaBrake : CONFIG.mofaAccel * climbF) * dt);
      else if (brake && !gas) {
        if (P.vx > 0) P.vx = Math.max(0, P.vx - CONFIG.mofaBrake * dt);
        else if (locked) P.vx = Math.min(0, P.vx + CONFIG.mofaBrake * dt);   // the finale: stop, don't roll back
        else P.vx = Math.max(-top * CONFIG.mofaReverse, P.vx - CONFIG.mofaAccel * dt);
      } else {                                           // coasting
        const c = (CONFIG.mofaCoast + 600 * grade) * dt;     // rolls out faster uphill
        P.vx = P.vx > 0 ? Math.max(0, P.vx - c) : Math.min(0, P.vx + c);
      }
      if (!locked && Input.pressed("jump")) {            // a fixed hop (no jump cut on the mofa)
        P.vy = CONFIG.mofaHopVel; P.onGround = false;
        Sound.play("jump");
      }
    }
    P.vy = Math.min(CONFIG.maxFall, P.vy + CONFIG.gravity * (P.rampFlight ? CONFIG.mofaRampGrav : 1) * dt);
    // the road profile is the floor (smooth on the climb): the higher of the two wheels' road
    P.x = clamp(P.x + P.vx * dt, 0, level.pxW - P.w);
    if (P.x <= 0 || P.x >= level.pxW - P.w) P.vx = 0;
    P.y += P.vy * dt;
    const ground = Math.min(level.roadTop(P.x + 4), level.roadTop(P.x + P.w - 4));
    if (P.vy >= 0 && P.y + P.h >= ground - (P.onGround ? 4 : 0)) { P.y = ground - P.h; P.vy = 0; P.onGround = true; }
    else P.onGround = false;
    if (P.onGround) P.rampFlight = false;
    this.hazards(P, dt);
    this.smoke(P, dt);
    P.wheelT += dt * P.vx / 10;                          // spoke frame per 10 px travelled (~15 frames/s at top speed)
  },

  // ---------------- ramps ----------------
  // The road has no obstacles of its own (the cars are the danger); / is a wooden ramp, 2 tiles
  // wide and rising to the right, that launches a long jump at speed.
  makeHazard(ch, tx, ty) {
    const floor = (ty + 1) * TILE;                       // the road surface below the cell
    return { type: "ramp", x: tx * TILE, y: floor - 12, w: 2 * TILE, h: 12 };
  },
  rampTop(r, x) { return r.y + r.h - r.h * clamp((x - r.x) / r.w, 0, 1); },   // surface height at x
  hazards(P, dt) {
    const feet = P.y + P.h, fw = P.x + P.w - 4, bw = P.x + 4;   // front and back wheel
    for (const z of Game.hazards) {
      if (z.type === "ramp") {
        const cx = (fw + bw) / 2;
        if (cx >= z.x && cx <= z.x + z.w && P.vy >= 0 && feet >= this.rampTop(z, cx) - 2) {
          P.y = this.rampTop(z, cx) - P.h; P.vy = 0; P.onGround = true; P.onRamp = z;   // riding up the ramp
        } else if (P.onRamp === z && cx > z.x + z.w) {    // off the end: launch, more the faster
          P.onRamp = null;
          P.vy = CONFIG.mofaRampVel * this.speed01(P); P.onGround = false; P.rampFlight = true;
          Sound.play("jump");
        } else if (P.onRamp === z && cx < z.x) P.onRamp = null;
      }
    }
  },
  // ---------------- road signs and the club gate (decoration only) ----------------
  // S: yellow "WOLLERAU" place sign; >: brown "TC WOLLERAU" direction sign with the distance to
  // the gate (from its own position); }: the club gate, 4 x 4 tiles from its top-left cell.
  signText(s) {
    if (s.ch === "S") return "WOLLERAU";
    const ex = Game.exit ? Game.exit.x : s.tx * TILE;
    const m = Math.max(50, Math.round((ex - s.tx * TILE) / TILE * 4 / 50) * 50);   // 1 tile ~ 4 m, in steps of 50 m
    return m >= 1000 ? (m / 1000).toFixed(1) + " KM" : m + " M";
  },
  drawSigns(camX, camY) {
    const oy = HUD_H - camY;
    for (const s of Game.signs) {
      const x = Math.round(s.tx * TILE - camX), y = Math.round(s.ty * TILE + (s.dy || 0) + oy);
      if (x < -80 || x > W + 80) continue;
      if (s.ch === "(" || s.ch === ")") { this.drawProp(s.ch, Game.level.stretchAt(s.tx * TILE), x, y + TILE); continue; }
      if (s.ch === "}") {                                   // club gate: two stone pillars and a sign board
        const bottom = y + 4 * TILE;
        [0, 3 * TILE + 4].forEach(function (px) { fillRect(x + px, y + 14, 12, bottom - y - 14, "#0a0608"); fillRect(x + px + 1, y + 15, 10, bottom - y - 15, "#b8b0a0"); fillRect(x + px + 1, y + 15, 10, 2, "#d8d0c0"); });
        const locked = Game.gateLocked();
        fillRect(x - 2, y, 4 * TILE + 4, 14, "#0a0608"); fillRect(x - 1, y + 1, 4 * TILE + 2, 12, locked ? "#8a1a1a" : "#1e5a2e");
        if (locked) for (let i = 0; i < 6; i++) fillRect(x + 12 + i * 7, bottom - 18, 7, 4, i % 2 ? "#f4f0e0" : "#d01818");   // closed barrier
        drawText("TC WOLLERAU", x + 2 * TILE, y + 4, "#f4f0e0", { align: "center" });
        continue;
      }
      const text = this.signText(s), w = textWidth(text) + 8, place = s.ch === "S";
      const post = y + TILE, top = post - 30;                 // the post stands on the road (the row below the cell)
      fillRect(x + 7, top + 12, 2, post - top - 12, "#0a0608"); fillRect(x + 7, top + 12, 1, post - top - 12, "#8a8e92");
      fillRect(x + 8 - Math.floor(w / 2) - 1, top - 1, w + 2, 13, "#0a0608");
      fillRect(x + 8 - Math.floor(w / 2), top, w, 11, place ? "#f0c418" : "#7a4a28");     // Swiss place sign yellow; brown tourist sign
      fillRect(x + 8 - Math.floor(w / 2) + 1, top + 1, w - 2, 9, place ? "#f0c418" : "#7a4a28");
      ctx.strokeStyle = place ? "#202020" : "#f0ece0"; ctx.strokeRect(x + 8 - Math.floor(w / 2) + 1.5, top + 1.5, w - 3, 8);
      drawText(text, x + 8, top + 2, place ? "#202020" : "#f0ece0", { align: "center" });
      if (!place) drawText("TC WOLLERAU", x + 8, top - 10, "#f0ece0", { align: "center", shadow: "#000" });
    }
  },

  // Roadside props, standing on the road's far edge (base = road top). Their look follows the
  // stretch: ( a low row 2 tiles wide, ) a single feature.
  //   lake: railing / bench   village: flower boxes / Swiss flag   climb: vine row / dry-stone wall
  //   club: hedge / club flag
  drawProp(ch, stretch, x, base) {
    const K = "#0a0608", P = PROP_KINDS[stretch % 4][ch === "(" ? 0 : 1];
    if (P === "railing") {
      for (let i = 0; i <= 32; i += 8) { fillRect(x + i, base - 12, 2, 12, K); fillRect(x + i, base - 11, 1, 11, "#e8ecf0"); }
      [12, 6].forEach(function (h) { fillRect(x, base - h - 1, 34, 3, K); fillRect(x, base - h, 34, 1, "#3a6ab0"); });
    } else if (P === "bench") {
      fillRect(x + 4, base - 8, 24, 3, K); fillRect(x + 5, base - 7, 22, 1, "#a06a3a");           // seat
      fillRect(x + 4, base - 16, 24, 6, K); fillRect(x + 5, base - 15, 22, 1, "#a06a3a"); fillRect(x + 5, base - 12, 22, 1, "#a06a3a");   // back rest
      [6, 24].forEach(function (i) { fillRect(x + i, base - 16, 2, 16, K); fillRect(x + i, base - 15, 1, 15, "#4a4e56"); });
    } else if (P === "flowers") {
      fillRect(x, base - 7, 32, 7, K); fillRect(x + 1, base - 6, 30, 5, "#8a5228"); fillRect(x + 1, base - 6, 30, 1, "#b0703a");
      for (let i = 0; i < 15; i++) {
        const fx = x + 2 + i * 2, h = 3 + (i * 7) % 4;
        fillRect(fx, base - 7 - h, 1, h, "#2a8a2a");
        fillRect(fx, base - 8 - h, 2, 2, ["#e02030", "#f070b0", "#f0d020", "#ffffff"][i % 4]);
      }
    } else if (P === "swissflag") {
      fillRect(x + 7, base - 34, 2, 34, K); fillRect(x + 7, base - 34, 1, 34, "#d0d4d8");
      fillRect(x + 9, base - 34, 15, 15, K); fillRect(x + 10, base - 33, 13, 13, "#e01818");
      fillRect(x + 15, base - 31, 3, 9, "#ffffff"); fillRect(x + 12, base - 28, 9, 3, "#ffffff");
    } else if (P === "vines") {
      for (let i = 0; i < 4; i++) {
        const vx = x + i * 8;
        fillRect(vx + 3, base - 18, 2, 18, K); fillRect(vx + 3, base - 18, 1, 18, "#8a6a40");     // stake
        fillRect(vx, base - 16, 8, 9, K); fillRect(vx + 1, base - 15, 6, 7, "#3a8a28"); fillRect(vx + 2, base - 14, 2, 2, "#6ab838");
        fillRect(vx + 4, base - 10, 2, 3, "#5a2a6a");                                             // grapes
      }
    } else if (P === "stonewall") {
      fillRect(x, base - 10, 34, 10, K);
      for (let r = 0; r < 3; r++) for (let i = 0; i < 5; i++) {
        const sx = x + 1 + i * 7 - (r % 2) * 3, w = 6;
        if (sx < x + 1) continue;
        fillRect(sx, base - 9 + r * 3, Math.min(w, x + 33 - sx), 2, ["#a8a090", "#8a8478", "#c0b8a8"][(r + i) % 3]);
      }
    } else if (P === "hedge") {
      fillRect(x, base - 14, 32, 14, K); fillRect(x + 1, base - 13, 30, 13, "#1e5a24");
      for (let i = 0; i < 12; i++) fillRect(x + 2 + (i * 11) % 28, base - 12 + (i * 5) % 11, 2, 2, "#3a8a3a");
    } else {                                                // club flag: green with a white TC stripe
      fillRect(x + 7, base - 36, 2, 36, K); fillRect(x + 7, base - 36, 1, 36, "#d0d4d8");
      fillRect(x + 9, base - 36, 20, 12, K); fillRect(x + 10, base - 35, 18, 10, "#1e5a2e"); fillRect(x + 10, base - 31, 18, 2, "#f4f0e0");
    }
  },

  drawHazards(camX, camY) {
    const oy = HUD_H - camY;
    for (const z of Game.hazards) {
      const x = Math.round(z.x - camX), y = Math.round(z.y + oy);
      if (x < -40 || x > W + 40) continue;
      {                                                  // a wooden ramp
        for (let i = 0; i < z.w; i++) { const hh = Math.round(z.h * i / z.w); if (hh > 0) { fillRect(x + i, y + z.h - hh, 1, hh, i % 4 === 0 ? "#6a4a2a" : "#a07040"); fillRect(x + i, y + z.h - hh, 1, 1, "#0a0608"); } }
      }
    }
  },

  // Twin machine gun: each volley fires one shot forward from the handlebars (Up angles it up by
  // mofaAim) and one level shot backward from the gun on the luggage rack; 1 damage each,
  // mofaRate volleys per second, one machine-gun report per volley.
  fire(P) {
    P.fireCd = 1 / CONFIG.mofaRate;
    P.shootT = 0.08;
    const up = Input.down("up"), img = SPR.shot, v = CONFIG.mofaShotSpeed, a = CONFIG.mofaAim * Math.PI / 180;
    // from the barrels: the mofa sprite stands on the road, centred on the player box
    const left = P.x + P.w / 2 - MOFA_SPR_W / 2, top = P.y + P.h - MOFA_SPR_H, hy = Math.floor(img.height / 2);
    Game.stats.shots += 2;
    Sound.play("mg");                                    // a machine-gun report (the blaster keeps "shot")
    Game.shots.push({ x: left + MOFA_GUN_X + MOFA_GUN_W, y: top + MOFA_GUN_Y + MOFA_BARREL_ROW - hy, w: img.width, h: img.height,
      vx: up ? v * Math.cos(a) : v, vy: up ? -v * Math.sin(a) : 0, dmg: 1, img: img, face: 1, mg: true });
    Game.shots.push({ x: left + MOFA_REAR_X - img.width, y: top + MOFA_REAR_Y + MOFA_BARREL_ROW - hy, w: img.width, h: img.height,
      vx: -v, vy: 0, dmg: 1, img: img, face: -1, mg: true, rear: true });
  },
  // Two-stroke exhaust: blue-grey puffs from the pipe behind the rear wheel; a few at idle, a
  // thick, darker trail with the throttle open. Each puff (two offset blobs) drifts back and up
  // and is gone after 1.2 s.
  SMOKE: {
    idle: { every: 0.25, size: [2, 3], color: "rgba(205,212,226,0.55)" },
    ride: { every: 0.12, size: [3, 3], color: "rgba(172,184,204,0.62)" },
    gas:  { every: 0.05, size: [3, 5], color: "rgba(118,132,158,0.72)" },
  },
  smokeState(P) {
    if (Input.down("right") && P.onGround && P.hurtT <= 0) return "gas";
    return Math.abs(P.vx) > 10 ? "ride" : "idle";
  },
  smoke(P, dt) {
    if (P.dead) return;
    const S = this.SMOKE[this.smokeState(P)];
    P.smokeT = (P.smokeT === undefined ? 0 : P.smokeT) - dt;
    if (P.smokeT > 0) return;
    P.smokeT = S.every;
    const left = P.x + P.w / 2 - MOFA_SPR_W / 2, y = P.y + P.h - MOFA_SPR_H + MOFA_EXHAUST_Y;
    const size = Math.round(rnd(S.size[0], S.size[1]));
    for (let k = 0; k < 2; k++)
      FX.parts.push({ x: left - 1 - k * 2, y: y - k, vx: -rnd(12, 30), vy: -rnd(10, 24), life: 1.2, max: 1.2,
        color: S.color, grav: -6, size: size, smoke: true, mofaSmoke: true });
  },

  // Speed as a fraction of the top speed (engine sound, wheel animation).
  speed01(P) { return clamp(Math.abs(P.vx) / CONFIG.mofaTop, 0, 1); },

  // The mofa (wheel frame by distance travelled) with Buck seated on it, the rear gun on the luggage
  // rack behind him and the front gun on the handlebars; muzzle flashes at both barrels.
  draw(P, camX, camY) {
    const M = SPR.mofa, S = M.frames[((Math.floor(P.wheelT) % 4) + 4) % 4], H = M.rider;
    const mx = Math.round(P.x + P.w / 2 - MOFA_SPR_W / 2 - camX), my = Math.round(P.y + P.h - MOFA_SPR_H - camY + HUD_H);
    ctx.drawImage(S.r, mx - S.pad, my - S.pad);
    const G = M.gun;
    ctx.drawImage(G.l, mx + MOFA_REAR_X - G.pad, my + MOFA_REAR_Y - G.pad);   // rear gun, barrel pointing back
    ctx.drawImage(H.r, mx + MOFA_RIDER_X - H.pad, my + MOFA_SEAT_Y - MOFA_HIP_ROW - H.pad);
    ctx.drawImage(G.r, mx + MOFA_GUN_X - G.pad, my + MOFA_GUN_Y - G.pad);     // front gun on the handlebars
    if (P.cigarette || P.lighterT > 0) {                 // the cigarette (and the lighter while lighting it)
      const m = this.mouth(P), cx = Math.round(m.x - camX), cy = Math.round(m.y - camY + HUD_H);
      fillRect(cx, cy, 3, 1, "#f4f0e8");
      if (P.cigarette) fillRect(cx + 3, cy, 1, 1, Math.floor(Game.time * 6) % 2 ? "#ff7020" : "#ffb040");
      if (P.lighterT > 0) { fillRect(cx + 3, cy + 1, 2, 3, "#c03020"); fillRect(cx + 3, cy - 2, 1, 2, Math.floor(Game.time * 20) % 2 ? "#ffe060" : "#ff9020"); }
    }
    if (P.shootT > 0.03) {                               // big star-shaped muzzle flashes at both barrels
      const up = Input.down("up");
      [[mx + MOFA_GUN_X + MOFA_GUN_W, my + MOFA_GUN_Y + MOFA_BARREL_ROW - 3 - (up ? 2 : 0)], [mx + MOFA_REAR_X - 7, my + MOFA_REAR_Y + MOFA_BARREL_ROW - 3]].forEach(function (f) {
        fillRect(f[0], f[1] + 2, 7, 3, "rgba(255,150,30,0.7)"); fillRect(f[0] + 2, f[1], 3, 7, "rgba(255,150,30,0.7)");
        fillRect(f[0] + 1, f[1] + 1, 5, 5, "rgba(255,200,60,0.6)");
        fillRect(f[0] + 2, f[1] + 2, 3, 3, "#fff6c0");
      });
    }
  },
};

// ---------------- art ----------------
// Side view facing right (rear at the left), drawn after assets/img/sachs-mofa.jpg: luggage rack,
// black seat, chrome tank over the red frame, aluminium engine, chrome fork and headlight,
// spoked wheels; a machine gun clamped on the handlebars. Colours: ASSETS_META.mofaPalette.
// The mofa is drawn on a 42 x 26 grid and scaled to MOFA_K (75%) when the sprites are built, so a
// full-size Buck sits on a small moped; the positions below are in the scaled sprite.
const MOFA_BASE_W = 42, MOFA_BASE_H = 26, MOFA_BASE_SEAT_Y = 10, MOFA_K = 0.75;
const MOFA_SPR_W = Math.round(MOFA_BASE_W * MOFA_K), MOFA_SPR_H = Math.round(MOFA_BASE_H * MOFA_K);   // 32 x 20
const MOFA_SEAT_Y = Math.round(MOFA_BASE_SEAT_Y * MOFA_K), MOFA_RIDER_X = Math.round(8 * MOFA_K), MOFA_HIP_ROW = BODY_Y + 13;
// heavy WW2 machine guns (17 x 7, barrel on row 2): the front one on the handlebars, the rear one
// (mirrored) on the luggage rack; MOFA_GUN_X/Y is the front gun's top-left, MOFA_REAR_X/Y the rear gun's
const MOFA_GUN_W = 17, MOFA_GUN_H = 7, MOFA_BARREL_ROW = 2;
const MOFA_GUN_X = Math.round(26 * MOFA_K), MOFA_GUN_Y = Math.round(4 * MOFA_K) - 2;
const MOFA_REAR_X = Math.round(9 * MOFA_K) - MOFA_GUN_W, MOFA_REAR_Y = Math.round(6 * MOFA_K) - 1;
const MOFA_EXHAUST_Y = Math.round(20 * MOFA_K);
function mofaPalette() {
  const m = (typeof ASSETS_META !== "undefined" && ASSETS_META.mofaPalette) || {};
  return { frame: m.frame || "#991115", chrome: m.chrome || "#edf1ee", seat: m.seat || "#2e363e", engine: m.engine || "#a7a8a2" };
}
function drawMofa(frame) {
  const C = mofaPalette(), c = makeCanvas(MOFA_BASE_W, MOFA_BASE_H), g = c.getContext("2d");
  function r(x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); }
  // wheels: black tyre, thin chrome rim, dark inside, two crossed spokes turning 22.5 degrees per frame
  [[8, 19], [34, 19]].forEach(function (w) {
    pxEllipse(g, w[0], w[1], 6, 6, "#141414");
    pxEllipse(g, w[0], w[1], 4, 4, C.chrome);
    pxEllipse(g, w[0], w[1], 3, 3, "#2a2a2a");
    g.fillStyle = "#b8bcbc";
    [0, Math.PI / 2].forEach(function (a0) {
      const a = a0 + frame * Math.PI / 8;
      for (let k = -3; k <= 3; k++) g.fillRect(w[0] + Math.round(Math.cos(a) * k), w[1] + Math.round(Math.sin(a) * k), 1, 1);
    });
    r(w[0], w[1], 1, 1, "#141414");                      // axle
  });
  r(1, 12, 14, 1, C.chrome); r(2, 11, 12, 1, C.chrome);  // rear fender
  r(0, 9, 13, 1, C.chrome); r(1, 9, 1, 3, C.chrome); r(11, 9, 1, 3, C.chrome);   // luggage rack
  r(0, 11, 2, 2, "#e02010");                             // tail light
  r(8, MOFA_BASE_SEAT_Y, 13, 3, C.seat); r(9, MOFA_BASE_SEAT_Y - 1, 11, 1, C.seat);        // seat
  r(12, 13, 17, 3, C.frame); r(14, 16, 4, 2, C.frame);   // red frame panel under the seat
  r(20, 8, 10, 5, C.frame);                              // tank underside
  r(20, 6, 10, 4, C.chrome); r(21, 5, 8, 1, C.chrome);   // chrome tank
  r(15, 15, 10, 5, C.engine); r(16, 16, 1, 3, "#606060"); r(19, 16, 1, 3, "#606060"); r(22, 16, 1, 3, "#606060");   // engine, fins
  r(4, 21, 14, 1, C.chrome);                              // exhaust
  for (let k = 0; k < 11; k++) r(30 + Math.round(k * 0.36), 8 + k, 2, 1, C.chrome);   // front fork
  r(33, 7, 4, 4, C.chrome); r(36, 8, 1, 2, "#fff8c0");    // headlight
  r(28, 2, 6, 1, "#202020"); r(27, 3, 2, 1, "#202020");   // handlebars
  return c;                                            // the gun is its own sprite (drawMofaGun), so it can swivel
}
// Heavy WW2 machine gun, facing right (17 x 7): receiver with a feed box below, a barrel inside a
// perforated cooling jacket, a wide flash hider at the muzzle.
function drawMofaGun() {
  const c = makeCanvas(MOFA_GUN_W, MOFA_GUN_H), g = c.getContext("2d");
  function r(x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); }
  r(0, 0, 7, 4, "#3a3e38"); r(0, 0, 7, 1, "#5a605a"); r(5, 1, 1, 1, "#20221f");        // receiver, top cover, sight
  r(1, 4, 4, 3, "#5a5a30"); r(1, 4, 4, 1, "#6e6e3a");                                  // feed box
  r(7, 1, 8, 3, "#2a2c2a");                                                            // cooling jacket
  for (let x = 8; x < 15; x += 2) r(x, 2, 1, 1, "#7a807a");                            // its holes
  r(15, 0, 2, 5, "#20221f"); r(16, 1, 1, 3, "#3a3e38");                                // flash hider
  return c;
}
// Scale a canvas by k with nearest-neighbour sampling (the outline is added afterwards by makeSet).
function scaleCanvas(c, k) {
  const o = makeCanvas(Math.round(c.width * k), Math.round(c.height * k)), g = o.getContext("2d");
  g.imageSmoothingEnabled = false;
  g.drawImage(c, 0, 0, o.width, o.height);
  return o;
}
// Buck seated: usual head and torso, arms forward to the handlebars, legs bent onto the footpegs.
const HERO_TORSO_RIDE = HERO_TORSO.slice(0, 9).concat(["...JJjJwwwwWJJJJs", "...JJjJwwwWJJ", "...sJJJwwWJJ", "....JJJJJJJJ"]);
const LEGS_RIDE = ["....PPPPPPPPPPPP", "....PPPPPPPPPPPPP", "...........PPPp", "............PPP", "............FFFf", "...........dDDDD"];
function buildMofaSprites() {
  SPR.mofa = { frames: [0, 1, 2, 3].map(function (f) { return makeSet(scaleCanvas(drawMofa(f), MOFA_K)); }),
    rider: buildHeroFrame(HERO_TORSO_RIDE, LEGS_RIDE), gun: makeSet(drawMofaGun()) };
}
