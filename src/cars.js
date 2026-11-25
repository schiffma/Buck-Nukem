// Posh drivers in their cars (the mofa ride), drawn after the photos in assets/img: a BMW X7
// (type "suv": the big SUV blocking the road ahead), a Tesla Model 3 and a Ferrari. Cars are
// enemies (ENEMY_TYPES, flag `car`) driving along the road of the ride level. They hurt Buck on
// contact (2 health and a hard knockback), take several hits, explode when destroyed (the driver
// bails out and runs off) and their drivers call out arrogant one-liners. Map: `1` places an X7
// on the road; `3` Tesla and `4` Ferrari are triggers: when Buck passes the column, the car
// comes from behind him (Tesla) or from ahead (Ferrari).

// At most 20 characters, game font only; arrogance, not explicit.
const PRESIDENT_LINES = ["MEMBERS ONLY!", "GATE CLOSED, PEASANT", "CHAMPAGNE? CATCH!", "DRESS CODE IS WHITE", "NO MOFAS ALLOWED!", "I AM THE PRESIDENT!"];
// The posh ladies at the limo's side windows.
const LIMO_LADY_LINES = ["IS THAT A MOFA? EW.", "RUN HIM OVER, DEAR", "HOW VERY RURAL!", "NO PEASANTS, PLEASE", "GSTAAD WAS NICER",
  "MY HUSBAND OWNS YOU", "IT SMELLS OF PETROL", "SUCH A TINY ENGINE", "CALL SECURITY, DEAR", "IS HE... WORKING?",
  "MORE CHAMPAGNE!", "NOT IN MY CANTON", "POOR LITTLE MOFA", "HE HAS NO YACHT?"];
// Who speaks from the limo: px from its left edge (bubble anchor) and the lines.
// (positions in the limo's 160-wide layout grid, scaled to its real width by limoX)
const LIMO_SPEAKERS = [{ bx: 61, lines: PRESIDENT_LINES }, { bx: 37, lines: LIMO_LADY_LINES }, { bx: 107, lines: LIMO_LADY_LINES }];
// The posh ladies complaining at Buck by the limo's wreck (the finale and after), at most 20 characters each.
const LIMO_FINALE_LINES = ["MY DRESS! IT'S DIOR!", "CALL MY HUSBAND!", "MY NAILS! MY NAILS!", "THIS IS AN OUTRAGE!", "WHO IS YOUR LAWYER?",
  "I'LL HAVE YOU FIRED!", "YOU RUINED MY DAY!", "I'LL SUE YOU, MOFA!", "THAT WAS A BENTLEY!", "MY HUSBAND'S A JUDGE", "DO YOU KNOW MY NAME?",
  "CALL SECURITY!", "YOU SMELL OF PETROL!", "MY CHAMPAGNE! SPILT!"];
const POSH_LINES = ["DO YOU KNOW MY DAD?", "NICE BIKE, GRANDPA!", "GET OFF MY ROAD!", "I PAY YOUR SALARY!",
  "DADDY'S CAR!", "MY LAWYER WILL CALL", "ZERO EMISSIONS, LOL", "0 TO 100 IN 2.9!", "PARKING IS FOR POOR",
  "TRUST FUND, BABY!", "ROSE O'CLOCK!", "MOVE IT, PEASANT!"];

const CAR_INFO = {
  // sizes at the mofa sprite's scale (42 px for a 1.7 m mofa, so ~25 px per metre)
  suv:     { w: 129, h: 45, hp: () => CONFIG.suvHp, points: () => CONFIG.suvPoints },          // BMW X7: 5.15 x 1.8 m
  tesla:   { w: 118, h: 36, hp: () => CONFIG.teslaHp, points: () => CONFIG.teslaPoints },      // Tesla Model 3: 4.7 x 1.44 m
  ferrari: { w: 114, h: 30, hp: () => CONFIG.ferrariHp, points: () => CONFIG.ferrariPoints },  // Ferrari: 4.57 x 1.21 m
  limo: { w: 300, h: 56, hp: () => CONFIG.limoHp, points: () => CONFIG.limoPoints },          // the president's super-stretch: ~12 x 2.2 m
};
// Trigger characters: when Buck passes the column, these cars come, each after `delay` seconds;
// `offset` puts an X7 that much further ahead (it then keeps that much more distance).
//   3 a Tesla from behind, 4 a Ferrari from ahead,
//   5 X7 convoy (two ahead, 160 px apart), 6 two Teslas from behind (0.8 s apart),
//   7 a Ferrari pair from ahead (0.6 s apart), 8 an X7 ahead and a Tesla from behind.
const CAR_TRIGGERS = {
  "3": [{ kind: "tesla" }],
  "4": [{ kind: "ferrari" }],
  "5": [{ kind: "suv" }, { kind: "suv", offset: 160 }],
  "6": [{ kind: "tesla" }, { kind: "tesla", delay: 0.8 }],
  "7": [{ kind: "ferrari" }, { kind: "ferrari", delay: 0.6 }],
  "8": [{ kind: "suv" }, { kind: "tesla", delay: 0.3 }],
};

// Gap between the car and the mofa along the road: > 0 when the car is ahead.
function carGapAhead(e) { return e.x - (Player.x + Player.w); }
function carGapBehind(e) { return Player.x - (e.x + e.w); }

const CAR_AI = {
  // The BMW X7: huge and slow, ahead of Buck: keeps 70-150 px in front, waits when he stops, the
  // driver tosses latte cups and golf balls back over the roof and honks at a mofa close behind.
  suv(e, dt) {
    const gap = carGapAhead(e) - (e.lead || 0), top = CONFIG.mofaTop;      // lead: a convoy's second car keeps further ahead
    e.hornT -= dt;
    if (carGapAhead(e) >= 0 && carGapAhead(e) <= 40 && e.hornT <= 0) { e.hornT = 1; Sound.play("horn"); }
    const want = gap < 70 ? CONFIG.suvSpeed : gap > 150 ? Math.max(0, Player.vx * 0.5) : Math.min(CONFIG.suvSpeed, Math.max(0, Player.vx));
    e.vx += clamp(want - e.vx, -200 * dt, 200 * dt);
    e.vx = Math.min(e.vx, top * 0.6);
    e.throwT -= dt;
    if (e.throwT <= 0 && gap > -e.w && gap < W) {
      e.throwT = rnd(CONFIG.suvThrowEvery[0], CONFIG.suvThrowEvery[1]);
      const kind = Math.random() < 0.5 ? "latte" : "golfball", T = 1.0, g = 420;
      const sx = e.x + 8, sy = e.y - 4, tx = Player.cx(), ty = Player.y + 6;
      Game.enemyShots.push({ kind: kind, x: sx, y: sy, w: 6, h: kind === "latte" ? 8 : 5, vx: (tx - sx) / T + Player.vx * 0.5,
        vy: (ty - sy - 0.5 * g * T * T) / T, grav: g, dmg: 1, t: 0, shootable: true });
      Sound.play("throw");
    }
  },
  // Creeps up from behind almost silently (driver on the phone), then rams.
  tesla(e, dt) {
    const P = Player;
    if (e.state === "cruise") {
      e.vx = P.vx + 20;
      if (carGapBehind(e) < W / 2) e.state = "ram";
    } else if (e.state === "ram") {
      e.vx = P.vx + 120;
      if (e.x > P.x + P.w) e.state = "leave";
    } else {
      e.vx = 260;
      if (e.x > Camera.x + W + 160) e.dead = true;
    }
  },
  // The club president's white stretch limo: parked before the gate, it blocks the road (the mofa
  // can't get past it, not even with a hop or a ramp) while the president pops champagne corks
  // at Buck from the sunroof.
  limo(e, dt) {
    e.vx = 0;
    const P = Player, dx = P.cx() - (e.x + e.w / 2);
    if (!P.dead && P.x + P.w > e.x + 2 && P.x < e.x + e.w) { P.x = e.x + 2 - P.w; if (P.vx > 0) P.vx = 0; }   // the wall (2 px overlap: contact still hurts)
    e.corkT -= dt;
    if (e.corkT <= 0 && Math.abs(dx) < W) {
      e.corkT = rnd(CONFIG.corkEvery[0], CONFIG.corkEvery[1]);
      const T = 0.9, g = 420, sx = e.x + limoX(LIMO_SUNROOF_BX), sy = e.y - 6, tx = P.cx() + P.vx * 0.4, ty = P.y + 6;
      Game.enemyShots.push({ kind: "cork", x: sx, y: sy, w: 5, h: 4, vx: (tx - sx) / T, vy: (ty - sy - 0.5 * g * T * T) / T,
        grav: g, dmg: 1, t: 0, shootable: true });
      FX.spark(sx + 2, sy, "#f8f0c0", 5, 60, 0.4, 80);                                   // the foam
      Sound.play("pop");
    }
  },
  // Low and very fast, from ahead; its roar is heard about a second before it shows up.
  ferrari(e) {
    e.vx = -CONFIG.ferrariSpeed;
    if (e.x + e.w < Camera.x - 80) e.dead = true;
  },
};

function carType(kind) {
  const I = CAR_INFO[kind];
  return {
    w: I.w, h: I.h, hp: I.hp(), points: I.points(), contact: CONFIG.carContact, car: kind,
    init(e) {
      e.face = kind === "ferrari" ? -1 : 1;
      e.state = kind === "tesla" ? "cruise" : "drive";
      e.t = 0; e.hornT = 0; e.throwT = rnd(0.8, 1.6); e.talkCd = rnd(0.5, 2); e.wheel = 0; e.awake = kind !== "suv" && kind !== "limo";
      e.corkT = 1;
    },
    update(e, dt) {
      CAR_AI[kind](e, dt);
      e.x += e.vx * dt;
      if (Game.level && Game.level.isRide) e.y = Game.level.roadTop(e.x + e.w / 2) - e.h;   // on the road profile
      e.wheel += Math.abs(e.vx) * dt / 30;
      // the driver's mouth (on screen only, one bubble at a time)
      if (e.bubble && (e.bubble.t -= dt) <= 0) e.bubble = null;
      const visible = e.x + e.w > Camera.x && e.x < Camera.x + W;
      if (visible && !e.seen) { e.seen = true; e.talkCd = rnd(0, 0.5); }   // a line as soon as the car shows up
      if (e.talkCd > 0) e.talkCd -= dt;
      if (visible && e.talkCd <= 0 && !e.bubble) {
        if (kind === "limo") {                            // the president or one of the ladies, every 2-3 s
          if (!e.speakers || !e.speakers.length) e.speakers = shuffle(LIMO_SPEAKERS.slice());   // everyone gets a turn
          const sp = e.speakers[e.speakers.length - 1], dx = limoX(sp.bx);
          if (Talk.say(e, sp.lines, CONFIG.driverTalkT, dx)) { e.speakers.pop(); e.talkCd = rnd(CONFIG.limoTalkEvery[0], CONFIG.limoTalkEvery[1]); }
          else e.talkCd = 0.3;
        } else {                                          // the driver, every 2.5-3.5 s; 0.3 s retry when there's no room
          e.talkCd = Talk.say(e, POSH_LINES, CONFIG.driverTalkT) ? rnd(CONFIG.driverTalkEvery[0], CONFIG.driverTalkEvery[1]) : 0.3;
        }
      }
    },
    sprite(e) { return SPR.cars[kind].frames[Math.floor(e.wheel) % 2]; },
  };
}
["suv", "tesla", "ferrari", "limo"].forEach(function (k) {
  ENEMY_TYPES[k] = carType(k);
  GORE_BY_TYPE[k] = {
    hit(e, x, y, dir) { FX.spark(x, y, pick(GORE.spark), 3, 80, 0.25, 200); },
    die(e, x, y) {
      Sound.play("bigexplode");
      FX.explode(x, y, false);
      FX.blood(x, y + 4, 0, 25, GORE.oil);
      for (let i = 0; i < 3; i++) FX.spark(x, y, GORE.spark[i], 9, 160, 0.6, 250);
      FX.gibs(x, y, GORE.metal.concat([CAR_COLORS[k].body]), 7, false);
      for (let i = 0; i < 10; i++) FX.parts.push({ x: x + rnd(-e.w / 3, e.w / 3), y: y - 4, vx: rnd(-20, 20), vy: rnd(-50, -20), life: 2, max: 2,
        color: "rgba(30,30,30,0.7)", grav: -8, size: 4, smoke: true });
      FX.shake(4, 0.3);
      if (k === "limo") {                                 // bigger: a chain of blasts along the whole car
        for (let i = 0; i < 4; i++) FX.explode(e.x + e.w * (i + 0.5) / 4, y - 4 + rnd(-6, 6), false);
        FX.shake(8, 0.6);
        Mofa.startFinale(e);                                                                       // the ladies climb out: the finale
      }
      Cars.wreck(e);
    },
  };
});

// Wrecks and the drivers running off after a car is destroyed; triggers for cars from behind/ahead.
const Cars = {
  wrecks: [], triggers: [], pending: [],
  reset() { this.wrecks = []; this.triggers = []; this.pending = []; },
  addTrigger(ch, tx, ty) { this.triggers.push({ ch: ch, cars: CAR_TRIGGERS[ch], tx: tx, floor: (ty + 1) * TILE }); },
  wreck(e) { this.wrecks.push({ kind: e.T.car, x: e.x, y: e.y, w: e.w, h: e.h, t: CONFIG.wreckLife }); },
  spawn(kind, floor, offset) {
    const I = CAR_INFO[kind];
    let x;
    if (kind === "ferrari") x = Camera.x + W + CONFIG.ferrariSpeed + Math.max(0, Player.vx);   // ~1 s off screen
    else if (kind === "suv") x = Camera.x + W + 16 + (offset || 0);                              // just off the right edge, driving
    else x = Camera.x - I.w - 40;                                                                // from behind
    const e = makeEnemy(kind, x + I.w / 2, floor, Game.level, kind === "ferrari" ? -1 : 1);
    if (kind === "suv") { e.awake = true; e.lead = offset || 0; e.vx = Math.max(0, Player.vx) * 0.6; }
    if (Game.level && Game.level.isRide) e.y = Game.level.roadTop(e.x + e.w / 2) - e.h;
    Game.enemies.push(e);
    return e;
  },
  update(dt) {
    for (let i = this.triggers.length - 1; i >= 0; i--) {
      const tr = this.triggers[i];
      if (Player.cx() >= tr.tx * TILE) {
        tr.cars.forEach(function (c) { this.pending.push({ kind: c.kind, offset: c.offset || 0, t: c.delay || 0, floor: tr.floor }); }, this);
        this.triggers.splice(i, 1);
      }
    }
    for (let i = this.pending.length - 1; i >= 0; i--) {
      const p = this.pending[i];
      if ((p.t -= dt) <= 0) { this.spawn(p.kind, p.floor, p.offset); this.pending.splice(i, 1); }
    }
    for (let i = this.wrecks.length - 1; i >= 0; i--) {
      const w = this.wrecks[i];
      w.t -= dt;
      if (w.t > CONFIG.wreckLife - 8 && Math.random() < 0.5)                // burning for the first seconds
        FX.parts.push({ x: w.x + rnd(6, w.w - 6), y: w.y + rnd(0, w.h / 2), vx: rnd(-10, 10), vy: rnd(-60, -30), life: 0.6, max: 0.6,
          color: pick(["#ff8020", "#ffd040", "#e04010"]), grav: -20, size: 2 });
      if (w.t <= 0) this.wrecks.splice(i, 1);
    }
  },
  draw(camX, camY) {
    const oy = HUD_H - camY;
    for (const w of this.wrecks) {
      ctx.globalAlpha = clamp(w.t / 3, 0, 1);
      const S = SPR.cars[w.kind].wreck;
      ctx.drawImage(S.r, Math.round(w.x - camX) - S.pad, Math.round(w.y + w.h - S.h + oy) - S.pad);
      ctx.globalAlpha = 1;
    }
    Mofa.drawFinale(camX, camY);
  },
};

// ---------------- art ----------------
// Colours picked from the photos (assets/img/car-bmw-x7.webp, car_tesla.jpg, car_ferrari.avif).
const CAR_COLORS = {
  suv: { body: "#4a4e56", trim: "#30343a", glass: "#26303a", chrome: "#c8ccd0" },      // BMW X7: metallic dark grey
  tesla: { body: "#9a1420", trim: "#6a0c16", glass: "#1a1e24", chrome: "#a8acb0" },    // Tesla Model 3: deep metallic red
  ferrari: { body: "#d81a14", trim: "#9a0e0a", glass: "#202830", chrome: "#c0c4c8" },  // Ferrari: rosso
  limo: { body: "#f0eee6", trim: "#b8b6ae", glass: "#1a1e26", chrome: "#d0d4d8" },     // the president's limo: pearl white
};
// Side view, facing right (front at the right). wheelFrame 0/1: spokes; wreck: burnt out.
// The layouts are drawn in base boxes (CAR_BASE, ~18 px per metre) and scaled into the car's
// real box (CAR_INFO), so every rectangle, arch, wheel and head grows with the car.
const CAR_BASE = { suv: [93, 32], tesla: [85, 26], ferrari: [82, 21], limo: [160, 30] };
const LIMO_SUNROOF_BX = 61;                               // the president's sunroof in the limo's layout grid
function limoX(bx) { return Math.round(bx * CAR_INFO.limo.w / CAR_BASE.limo[0]); }   // grid x -> px from the limo's left edge
function drawCar(kind, wheelFrame, wreck) {
  const I = CAR_INFO[kind], C = CAR_COLORS[kind], c = makeCanvas(I.w, I.h), g = c.getContext("2d");
  const kx = I.w / CAR_BASE[kind][0], ky = I.h / CAR_BASE[kind][1];
  const X = function (v) { return Math.round(v * kx); }, Y = function (v) { return Math.round(v * ky); }, R = function (v) { return Math.max(1, Math.round(v * ky)); };
  function r(x, y, w, h, col) {
    const x0 = X(x), y0 = Y(y), x1 = Math.max(x0 + 1, X(x + w)), y1 = Math.max(y0 + 1, Y(y + h));
    g.fillStyle = col; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  }
  // rows y0..y1 filled between a left edge going la0 -> la1 and a right edge going rb0 -> rb1 (slopes)
  function slope(y0, y1, la0, la1, rb0, rb1, col) {
    for (let y = y0; y <= y1; y++) {
      const t = y1 === y0 ? 0 : (y - y0) / (y1 - y0);
      const a = la0 + (la1 - la0) * t, b = rb0 + (rb1 - rb0) * t;
      r(a, y, Math.max(1, b - a), 1, col);
    }
  }
  const body = wreck ? "#3a2a22" : C.body, trim = wreck ? "#2a1e18" : C.trim, glass = wreck ? "#1a1412" : C.glass;
  const chrome = wreck ? "#4a3a30" : C.chrome, dark = "#141418", black = wreck ? "#1a1412" : "#15171a";
  let wr, wy, wx, head;                                   // wheel radius / centre row / centres; driver head {x, y, h}
  if (kind === "suv") {                                   // BMW X7: tall, boxy, big chrome kidney grille
    wr = 7; wy = 24; wx = [19, 75];
    r(2, 14, 88, 11, body); r(8, 3, 66, 12, body); r(74, 7, 6, 8, body); r(78, 12, 12, 3, body);   // body, cabin, A-pillar, bonnet
    r(10, 1, 60, 2, chrome); r(12, 2, 2, 1, chrome); r(66, 2, 2, 1, chrome);           // roof rails
    r(10, 4, 63, 9, black);                                                           // dark window band
    r(11, 5, 17, 7, glass); r(30, 5, 18, 7, glass); r(50, 5, 21, 7, glass); r(75, 8, 4, 6, glass);
    r(30, 15, 1, 9, trim); r(50, 15, 1, 9, trim); r(34, 18, 4, 1, chrome); r(54, 18, 4, 1, chrome);   // door lines, handles
    r(87, 14, 5, 8, chrome); r(88, 15, 3, 1, dark); r(88, 17, 3, 1, dark); r(88, 19, 3, 1, dark);   // giant twin-kidney grille
    r(83, 14, 5, 1, "#e8f0ff");                                                       // slim LED headlight
    r(1, 15, 3, 3, "#c01010"); r(20, 22, 52, 1, chrome);                              // tail light, chrome sill strip
    r(86, 22, 6, 2, black); r(0, 23, 4, 2, black);                                    // bumpers
    head = { x: 60, y: 6, h: 6 };
  } else if (kind === "tesla") {                          // Tesla Model 3: smooth fastback, glass roof, no grille
    wr = 6; wy = 19; wx = [17, 68];
    r(2, 12, 80, 8, body);                                                            // lower body
    slope(9, 12, 6, 2, 78, 83, body);                                                 // shoulder line, rounded nose and tail
    slope(2, 10, 30, 12, 54, 72, body);                                               // fastback cabin: sloping roof and windscreen
    slope(3, 9, 31, 16, 52, 67, glass);                                               // glass
    r(31, 2, 22, 2, black);                                                           // black glass roof
    r(42, 3, 1, 7, black); r(42, 12, 1, 7, trim);                                     // B-pillar, door line
    r(30, 14, 4, 1, trim); r(52, 14, 4, 1, trim);                                     // flush handles
    r(77, 11, 5, 1, "#f0f4ff"); r(78, 17, 4, 2, black); r(1, 11, 3, 2, "#ff3030");     // slim headlight, lower intake, tail light
    head = { x: 47, y: 4, h: 6 };
  } else if (kind === "limo") {                          // stretch limo: long white body, black glass, chrome, president in the sunroof
    wr = 6; wy = 25; wx = [22, 140];
    r(2, 16, 156, 9, body);                                                           // long lower body
    r(24, 8, 112, 9, body); slope(8, 16, 136, 136, 140, 150, body); r(148, 13, 10, 4, body);   // cabin, windscreen, bonnet
    slope(9, 16, 24, 18, 26, 26, body);                                               // sloping boot
    r(26, 8, 108, 8, black);                                                          // tinted windows (a tall band: the ladies fit)
    [28, 46, 64, 98, 116].forEach(function (x) { r(x, 9, 15, 6, glass); });
    r(137, 10, 4, 5, glass);
    r(60, 7, 16, 1, chrome);                                                          // sunroof frame
    r(4, 20, 152, 1, chrome); r(26, 16, 108, 1, chrome);                              // chrome strips
    [44, 62, 80, 98, 116].forEach(function (x) { r(x, 17, 1, 7, trim); });            // door lines
    r(155, 15, 4, 7, chrome); r(156, 16, 2, 1, dark); r(156, 18, 2, 1, dark);         // grille
    r(152, 14, 4, 1, "#f8f8e0"); r(1, 16, 3, 3, "#c01010");                           // headlight, tail light
    r(154, 22, 6, 2, chrome); r(0, 22, 4, 2, chrome);                                 // chrome bumpers
    if (!wreck) {                                                                     // two small flags on the front wings
      r(146, 6, 1, 8, chrome); r(147, 6, 4, 3, "#e01818"); r(148, 7, 2, 1, "#ffffff");
      // the president in the sunroof: top hat, grey whiskers, cigar
      const px = LIMO_SUNROOF_BX;
      r(px - 3, 0, 7, 3, "#101010"); r(px - 5, 3, 11, 1, "#101010"); r(px - 3, 2, 7, 1, "#a01010");   // top hat with a red band
      r(px - 3, 4, 7, 4, "#e8b898"); r(px - 3, 4, 1, 3, "#c8c8c8"); r(px + 3, 4, 1, 3, "#c8c8c8");    // face, whiskers
      r(px - 1, 5, 1, 1, "#101010"); r(px + 1, 5, 1, 1, "#101010");                                  // eyes
      r(px + 3, 6, 4, 1, "#6a4020"); r(px + 7, 6, 1, 1, "#ff6020");                                  // cigar
      r(px - 4, 8, 9, 1, "#101010"); r(px - 1, 8, 3, 1, "#f8f8f8");                                  // tails, white shirt
    }
    if (!wreck) {                                                                     // two posh ladies at the side windows
      [[30, "#e070a0", "#e070a0"], [100, "#f4f0e8", "#101010"]].forEach(function (L) {
        const x = L[0];
        r(x + 3, 9, 8, 1, L[1]); r(x + 5, 7, 4, 2, L[1]); r(x + 5, 8, 4, 1, L[2]);    // big hat: brim, crown, band
        r(x + 5, 10, 4, 5, "#e8b898"); r(x + 5, 10, 1, 5, "#c89060");                   // face, hair
        r(x + 5, 11, 4, 1, "#101010");                                                // sunglasses
        r(x + 7, 14, 1, 1, "#c01030");                                                // red lips
        r(x + 4, 15, 6, 1, "#f8f8f0");                                                // pearls
        r(x + 10, 11, 1, 4, "#f0e8c0"); r(x + 10, 11, 1, 1, "#ffffff");              // a champagne glass
      });
    }
    head = { x: 137, y: 10, h: 5 };                                                   // the chauffeur
  } else {                                                // Ferrari: low mid-engine coupe, domed cabin, black rear
    wr = 6; wy = 14; wx = [17, 65];
    r(2, 10, 78, 5, body);                                                            // lower body
    slope(6, 10, 56, 54, 70, 81, body);                                               // long, low nose
    slope(1, 8, 34, 22, 48, 60, body);                                                // domed cabin
    slope(2, 7, 35, 26, 47, 56, glass);                                               // glass, steep windscreen
    slope(5, 10, 22, 2, 30, 30, body);                                                // engine deck sloping down to the tail
    r(10, 6, 10, 1, black); r(12, 7, 8, 1, black);                                    // engine-cover vents
    r(0, 10, 10, 4, black); r(0, 8, 4, 2, black);                                     // black rear section, spoiler lip
    r(22, 10, 9, 3, "#2a0a08"); r(22, 10, 9, 1, trim);                                // side air intake
    r(75, 8, 5, 1, "#f0e8c0"); r(1, 9, 2, 2, "#ff2010"); r(0, 14, 82, 1, dark);
    head = { x: 39, y: 1, h: 7 };
  }
  // wheel arches behind the wheels
  wx.forEach(function (x) { pxEllipse(g, X(x), Y(wy), R(wr + 2), R(wr + 1), wreck ? "#1a1412" : dark); });
  if (!wreck) {                                           // the posh driver in the front window: hair, face, sunglasses
    const h = head;
    r(h.x, h.y + 1, 5, h.h - 1, "#e8b898");
    r(h.x, h.y, 5, 2, kind === "ferrari" ? "#101010" : kind === "tesla" ? "#d8c060" : "#3a2414");   // slicked hair
    r(h.x - 1, h.y + 1, 1, 2, kind === "tesla" ? "#d8c060" : "#3a2414");
    r(h.x + 2, h.y + 2, 3, 1, "#101010");                                            // sunglasses
    r(h.x + 3, h.y + h.h - 2, 2, 1, "#a05040");                                      // sneer
    if (kind === "tesla") { r(h.x + 5, h.y + 2, 1, 3, "#60c0ff"); r(h.x + 4, h.y + 4, 1, 1, "#e8b898"); }   // phone in hand
    if (kind === "suv") { r(h.x, h.y + h.h, 5, 1, "#f8f8f0"); r(h.x + 1, h.y + h.h, 1, 1, "#c8c8c0"); }    // pearls
  }
  wx.forEach(function (x0) {
    const x = X(x0), y = Y(wy), w = R(wr), rim = Math.max(2, w - 3);
    pxEllipse(g, x, y, w, w, "#141414");
    pxEllipse(g, x, y, rim, rim, wreck ? "#302820" : kind === "tesla" ? "#7a7e84" : "#a8acb0");
    g.fillStyle = "#141414";
    if (kind === "tesla" && !wreck) {                     // aero wheel cover: a flat disc with a few slots
      pxEllipse(g, x, y, rim - 1, rim - 1, "#8a8e94");
      g.fillRect(x - 1, y - rim + 2 + (wheelFrame ? 1 : 0), 2, 1); g.fillRect(x - 1, y + rim - 3 - (wheelFrame ? 1 : 0), 2, 1);
    } else if (wheelFrame === 0) { g.fillRect(x - rim + 1, y, 2 * rim - 1, 1); g.fillRect(x, y - rim + 1, 1, 2 * rim - 1); }
    else for (let k = -rim + 2; k <= rim - 2; k++) { g.fillRect(x + k, y + k, 1, 1); g.fillRect(x + k, y - k, 1, 1); }
    if (kind === "ferrari" && !wreck) { g.fillStyle = "#f0c010"; g.fillRect(x + rim - 3, y - 2, 2, 4); }   // yellow brake caliper
    g.fillStyle = wreck ? "#302820" : "#d8dce0"; g.fillRect(x - 1, y - 1, 3, 3);   // hub cap
  });
  return c;
}
function buildCarSprites() {
  SPR.cars = {};
  Object.keys(CAR_INFO).forEach(function (k) {
    SPR.cars[k] = {
      frames: [makeSet(drawCar(k, 0)), makeSet(drawCar(k, 1))],
      wreck: makeSet(drawCar(k, 0, true)),
    };
  });
}
