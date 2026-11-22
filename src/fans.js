// Cheering tennis fans: TC Wollerau players in 1970s tennis whites cheering Buck from the
// background. Purely decorative: no collisions, no effect on gameplay. Placed with the map
// character F; each fan in a level gets a different look (hair, skin, accent, accessory).
const FAN_SKIN = { light: "#f0c8a8", tan: "#d8a070", brown: "#a86a40", dark: "#6e4428" };
const FAN_HAIR = { blonde: "#f0d060", brown: "#7a4a22", black: "#201814", red: "#c84a20", ash: "#d8c8a0", auburn: "#8a3018" };
const FAN_ACCENT = { red: "#d02020", blue: "#2060d0", green: "#20a040", orange: "#f08020", purple: "#8040c0", pink: "#e05090",
  teal: "#109890", yellow: "#e8c010" };
const FAN_VARIANTS = [
  { hair: "ponytail", hairCol: "blonde", skin: "light", accent: "red", item: "racket" },
  { hair: "afro", hairCol: "black", skin: "dark", accent: "orange", item: "headband" },
  { hair: "bob", hairCol: "red", skin: "light", accent: "green", item: "towel" },
  { hair: "bun", hairCol: "brown", skin: "tan", accent: "blue", item: "visor" },
  { hair: "long", hairCol: "black", skin: "brown", accent: "pink", item: "racket" },
  { hair: "ponytail", hairCol: "auburn", skin: "tan", accent: "purple", item: "towel" },
  { hair: "bob", hairCol: "ash", skin: "light", accent: "blue", item: "headband" },
  { hair: "afro", hairCol: "brown", skin: "brown", accent: "green", item: "racket" },
  { hair: "pigtails", hairCol: "blonde", skin: "tan", accent: "pink", item: "sunglasses" },
  { hair: "curly", hairCol: "red", skin: "light", accent: "teal", item: "cap" },
  { hair: "long", hairCol: "auburn", skin: "light", accent: "yellow", item: "sunglasses" },
  { hair: "pigtails", hairCol: "black", skin: "dark", accent: "yellow", item: "racket" },
  { hair: "curly", hairCol: "brown", skin: "tan", accent: "red", item: "headband" },
  { hair: "bun", hairCol: "ash", skin: "brown", accent: "teal", item: "cap" },
];
const FAN_FRAMES = ["idle", "wave", "jump", "kiss"];
const FAN_W = 20, FAN_H = 32;
// What the fans call out, by occasion: cheeky 70s-grindhouse flirting, never explicit.
// Each line fits a bubble (at most 20 characters) and uses only font glyphs (incl. the heart).
const FAN_LINES = {
  shout: ["HEY HANDSOME!", "NICE RACKET, BUCK!", "CALL ME, BIG GUY!", "HOT STUFF! ♥", "YOU MAKE ME SWEAT!",
    "OOH LA LA, BUCK!", "LOOKING GOOD, BUCK!", "WANNA PLAY DOUBLES?", "WHAT A HUNK! ♥", "HELLO, TIGER!",
    "NICE MOUSTACHE! ♥", "I LOVE A BAD BOY!", "SERVE IT TO ME! ♥", "MEET ME AT THE BAR!"],
  kill: ["OOH, DANGEROUS!", "MY HERO! ♥", "DO THAT AGAIN!", "SO STRONG! ♥", "WHAT A SHOT, BABY!",
    "YOU'RE ON FIRE!", "TAKE ME WITH YOU!", "BAD BOY BUCK! ♥"],
  trophy: ["WHAT A TROPHY! ♥", "BIG CUP, BIG MAN!", "CHAMPION OF MY HEART", "GAME, SET, MATCH! ♥", "WIN ME NEXT, BUCK!"],
  checkpoint: ["SAVE ME TOO, BUCK!", "DON'T GO FAR! ♥", "COME BACK SOON!", "I'LL WAIT FOR YOU!", "KEEP IT UP, TIGER!"],
};
const FAN_BUBBLE_T = 1.5, FAN_MAX_BUBBLES = 3;
const FAN_SHOUT_RANGE = 4 * TILE, FAN_SHOUT_COOLDOWN = 8, FAN_WHISTLE_GAP = 4, FAN_KISS_T = 0.6;

// One 20x32 frame, facing right. frame: idle (arms down), wave (front arm up), jump (both
// arms up in a V, body lifted 2 px), kiss (front hand at the lips, winking: blows Buck a kiss). The body is 16 px wide at an x offset of 2 so raised
// arms, rackets and towels fit inside the canvas.
function buildFanFrame(v, frame) {
  const c = makeCanvas(FAN_W, FAN_H), g = c.getContext("2d");
  const skin = FAN_SKIN[v.skin], hair = FAN_HAIR[v.hairCol], acc = FAN_ACCENT[v.accent];
  const ox = 2, oy = frame === "jump" ? 2 : 4;
  const P = function (col, x, y, w, h) { g.fillStyle = col; g.fillRect(ox + x, oy + y, w || 1, h || 1); };
  const WHITE = "#f4f4f0", SHADE = "#d4d4d0", cheer = frame === "wave" || frame === "jump", kiss = frame === "kiss";
  // legs (tucked a little when jumping), socks with a stripe, sneakers
  const lg = frame === "jump" ? 1 : 0;
  P(skin, 5, 19, 2, 5 - lg); P(skin, 9, 19, 2, 5 - lg);
  P(WHITE, 5, 23 - lg, 2, 2); P(WHITE, 9, 23 - lg, 2, 2); P(acc, 5, 23 - lg, 2, 1); P(acc, 9, 23 - lg, 2, 1);
  P(WHITE, 4, 25 - lg, 3, 2); P(WHITE, 9, 25 - lg, 3, 2); P("#9aa0a8", 4, 26 - lg, 3, 1); P("#9aa0a8", 9, 26 - lg, 3, 1);
  // tennis dress: top with a coloured collar, pleated skirt with a waist stripe
  P(WHITE, 4, 10, 8, 5); P(acc, 6, 10, 4, 1); P(SHADE, 4, 14, 8, 1);
  P(WHITE, 3, 15, 10, 4); P(acc, 3, 15, 10, 1); P(SHADE, 3, 18, 10, 1);
  for (let x = 4; x < 13; x += 2) P(SHADE, x, 16, 1, 2);
  // neck and face (three-quarter view facing right): eye, mouth (open when cheering)
  P(skin, 7, 9, 2, 1);
  P(skin, 5, 3, 6, 6); P(skin, 11, 5, 1, 2);
  if (kiss) { P("#101018", 8, 5, 2, 1); P("#d02040", 10, 7); P("#d02040", 10, 8); }   // wink, puckered lips
  else {
    P("#101018", 9, 5);
    if (cheer) { P("#801818", 9, 7, 2, 1); P("#f0f0f0", 9, 7); } else P("#a04030", 9, 7, 2, 1);
  }
  // hair
  switch (v.hair) {
    case "ponytail": P(hair, 5, 2, 6, 2); P(hair, 4, 3, 2, 4); P(hair, 2, 4, 2, 2); P(hair, 1, 6, 2, 3); P(acc, 4, 3); break;
    case "bob": P(hair, 4, 2, 7, 2); P(hair, 3, 3, 3, 5); P(hair, 10, 3, 1, 1); break;
    case "afro": P(hair, 4, 0, 7, 1); P(hair, 2, 1, 10, 3); P(hair, 2, 4, 4, 4); P(hair, 10, 2, 2, 2); break;
    case "bun": P(hair, 5, 2, 6, 2); P(hair, 4, 3, 2, 3); P(hair, 4, 0, 3, 2); break;
    case "long": P(hair, 5, 2, 6, 2); P(hair, 3, 3, 3, 8); P(hair, 10, 3, 1, 1); break;
    case "pigtails": P(hair, 5, 2, 6, 2); P(hair, 4, 3, 2, 3); P(hair, 2, 4, 2, 4); P(hair, 12, 3, 1, 4); P(acc, 3, 4); P(acc, 12, 3); break;
    case "curly": P(hair, 4, 1, 7, 2); P(hair, 3, 2, 3, 6); P(hair, 2, 4, 1, 3); P(hair, 10, 2, 2, 1); P(hair, 4, 8, 1, 2); break;
  }
  if (v.item === "headband") P(acc, 5, 3, 6, 1);
  if (v.item === "visor") { P(acc, 5, 3, 6, 1); P(acc, 11, 3, 2, 1); }
  if (v.item === "cap") { P(acc, 4, 1, 7, 2); P(acc, 11, 2, 3, 1); }
  if (v.item === "sunglasses" && !kiss) P("#101018", 8, 5, 3, 1);
  // arms (2 px wide) with wristbands: down at the sides, or raised up and out in a V
  function armDown(x) { P(skin, x, 10, 1, 6); P(acc, x, 14); return { x: x, y: 16 }; }
  function armUp(dir) {            // dir 1 = front (right), -1 = back (left)
    const pts = dir > 0 ? [[12, 10], [13, 9], [13, 8], [14, 7], [14, 6], [15, 5]] : [[3, 10], [2, 9], [2, 8], [1, 7], [1, 6], [0, 5]];
    pts.forEach(function (q) { P(skin, q[0], q[1], 1, 1); P(skin, q[0] - dir, q[1], 1, 1); });
    P(acc, pts[3][0], pts[3][1]); P(acc, pts[3][0] - dir, pts[3][1]);
    return { x: pts[5][0], y: pts[5][1] - 1 };
  }
  function armToLips() {           // front arm bent up, hand at the mouth
    [[12, 10], [12, 9], [12, 8], [11, 7]].forEach(function (q) { P(skin, q[0], q[1], 1, 1); });
    P(acc, 12, 9);
    return { x: 11, y: 6 };
  }
  const hand = frame === "idle" ? armDown(12) : kiss ? armToLips() : armUp(1);
  const backHand = frame === "jump" ? armUp(-1) : armDown(3);
  P(skin, hand.x, hand.y); P(skin, backHand.x, backHand.y);
  const up = cheer;
  if (v.item === "racket" && !kiss) {              // wooden grip, black frame, light strings
    if (up) { P("#5a3a1a", hand.x, hand.y - 2, 1, 2); P("#202020", hand.x - 1, hand.y - 7, 3, 5); P("#e8e8d8", hand.x, hand.y - 6, 1, 3); }
    else { P("#5a3a1a", hand.x, hand.y + 1, 1, 2); P("#202020", hand.x - 1, hand.y + 3, 3, 5); P("#e8e8d8", hand.x, hand.y + 4, 1, 3); }
  } else if (v.item === "towel" && !kiss) {        // white towel with a coloured stripe, swung overhead
    if (up) { P(WHITE, hand.x - 1, hand.y - 4, 3, 4); P(acc, hand.x - 1, hand.y - 2, 3, 1); }
    else { P(WHITE, hand.x, hand.y + 1, 2, 5); P(acc, hand.x, hand.y + 3, 2, 1); }
  }
  return c;
}

// SPR.fans[variant][frame] = sprite set (outlined, mirrored, flash)
function buildFanSprites() {
  SPR.fans = FAN_VARIANTS.map(function (v) {
    const set = {};
    FAN_FRAMES.forEach(function (f) { set[f] = makeSet(buildFanFrame(v, f)); });
    return set;
  });
}

// ---- behaviour: idle cheer, face Buck, react to his successes ----
const Fans = {
  list: [], lastCheer: -99, lastWhistle: -99, time: 0, hearts: [], decks: {}, shown: [],
  spawn(level, levelIndex) {
    this.list = []; this.lastCheer = -99; this.lastWhistle = -99; this.time = 0; this.hearts = []; this.decks = {}; this.shown = [];
    const self = this;
    level.spawns.filter(function (s) { return s.ch === "F"; }).forEach(function (s, i) {
      self.list.push({ tx: s.tx, ty: s.ty, x: s.tx * TILE + TILE / 2 - FAN_W / 2, y: (s.ty + 1) * TILE - (FAN_H - 1),
        variant: (levelIndex * 5 + i) % FAN_VARIANTS.length, face: -1, phase: i * 0.37, cheerT: 0, bubble: null, shoutT: 0, kissT: 0 });
    });
    return this.list;
  },
  update(dt) {
    this.time += dt;
    const pcx = Player.cx();
    for (const f of this.list) {
      const d = pcx - (f.x + FAN_W / 2);
      if (Math.abs(d) > 6) f.face = d > 0 ? 1 : -1;     // dead zone: no flicker when Buck is right above her
      if (f.cheerT > 0) f.cheerT = Math.max(0, f.cheerT - dt);
      if (f.bubble && (f.bubble.t -= dt) <= 0) f.bubble = null;
      if (f.shoutT > 0) f.shoutT -= dt;
      if (f.kissT > 0) f.kissT = Math.max(0, f.kissT - dt);
    }
    // shout-outs: Buck walks past (within 4 tiles, about the same height) -> she blows him a
    // kiss, a heart floats up and she calls out; once per 8 s per fan; wolf whistle once per 4 s
    const live = !Player.dead && (Game.state === STATE.PLAY || Game.state === STATE.BOSS);
    if (live) {
      const pcy = Player.y + Player.h;
      let talking = this.list.filter(function (f) { return f.bubble; }).length;
      for (const f of this.list) {
        if (f.shoutT > 0 || f.bubble || talking >= FAN_MAX_BUBBLES) continue;
        if (Math.abs(pcx - (f.x + FAN_W / 2)) > FAN_SHOUT_RANGE || Math.abs(pcy - (f.y + FAN_H)) > 2 * TILE) continue;
        this.shout(f); talking++;
      }
    }
    for (let i = this.hearts.length - 1; i >= 0; i--) {
      const h = this.hearts[i];
      h.t -= dt; h.y -= 22 * dt; h.x += Math.sin((0.8 - h.t) * 9) * 8 * dt;     // drift up, sway
      if (h.t <= 0) this.hearts.splice(i, 1);
    }
  },
  // a small heart floats up from a fan (blowing Buck a kiss): rises and fades over 0.8 s
  addHeart(f) {
    this.hearts.push({ x: f.x + FAN_W / 2 + (f.face > 0 ? 3 : -3), y: f.y + 4, t: 0.8 });
  },
  drawHearts(camX, camY) {
    for (const h of this.hearts) {
      ctx.globalAlpha = Math.min(1, h.t / 0.4);
      drawText("♥", Math.round(h.x - camX - 2), Math.round(h.y - camY + HUD_H), "#ff3070");
    }
    ctx.globalAlpha = 1;
  },
  frame(f) {
    if (f.kissT > 0) return "kiss";
    if (f.cheerT > 0) return Math.floor(f.cheerT / 0.15) % 2 ? "jump" : "wave";
    return ((this.time + f.phase) % 0.9) < 0.35 ? "wave" : "idle";   // idle cheer loop
  },
  // Next line for an occasion: a shuffled deck per occasion, never a line already on screen.
  pickLine(kind) {
    const pool = FAN_LINES[kind] || FAN_LINES.kill;
    const onScreen = this.list.filter(function (f) { return f.bubble; }).map(function (f) { return f.bubble.text; });
    for (let tries = 0; tries < pool.length + 1; tries++) {
      let deck = this.decks[kind];
      if (!deck || !deck.length) {
        deck = this.decks[kind] = pool.slice();
        for (let i = deck.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); const t = deck[i]; deck[i] = deck[k]; deck[k] = t; }
      }
      const line = deck.pop();
      if (onScreen.indexOf(line) < 0) return line;
    }
    return pool[0];
  },
  say(f, kind) { f.bubble = { text: this.pickLine(kind), t: FAN_BUBBLE_T, kind: kind }; },
  shout(f) {
    this.say(f, "shout");
    f.shoutT = FAN_SHOUT_COOLDOWN; f.kissT = FAN_KISS_T;
    this.addHeart(f);
    if (this.time - this.lastWhistle >= FAN_WHISTLE_GAP) { this.lastWhistle = this.time; Sound.play("whistle"); }
  },
  // Buck scored near (x, y): every fan within 12 tiles cheers; the nearest ones (up to the
  // bubble limit) each say their own line for the occasion; the cheer sound plays at most
  // once per 1.5 s.
  react(x, y, kind) {
    const near = [];
    for (const f of this.list) {
      const d = Math.hypot(f.x + FAN_W / 2 - x, f.y + FAN_H / 2 - y);
      if (d > 12 * TILE) continue;
      f.cheerT = 1.0;
      near.push({ f: f, d: d });
    }
    if (!near.length) return false;
    near.sort(function (a, b) { return a.d - b.d; });
    let talking = this.list.filter(function (f) { return f.bubble; }).length;
    for (const n of near) {
      if (talking >= FAN_MAX_BUBBLES) break;
      if (n.f.bubble) continue;
      this.say(n.f, kind); talking++;
    }
    if (this.time - this.lastCheer >= 1.5) { this.lastCheer = this.time; Sound.play("cheer"); }
    return true;
  },
  // Lays out the speech bubbles: at most 3, fans nearest to Buck first. A bubble that would
  // overlap one already placed slides beside it, else moves up a row (at most twice); if it
  // still doesn't fit it waits (its timer runs on).
  layoutBubbles(camX, camY) {
    const pcx = Player.cx(), pcy = Player.cy();
    const talk = this.list.filter(function (f) { return f.bubble; }).sort(function (a, b) {
      return Math.hypot(a.x - pcx, a.y - pcy) - Math.hypot(b.x - pcx, b.y - pcy);
    });
    const out = [];
    for (const f of talk) {
      if (out.length >= FAN_MAX_BUBBLES) break;
      const w = textWidth(f.bubble.text) + 6, h = 11;
      const fx = Math.round(f.x + FAN_W / 2 - camX);
      const y0 = Math.round(f.y - camY + HUD_H) - h - 2;
      const free = function (x, y) {
        return x >= 2 && x + w <= W - 2 && out.every(function (r) { return x + w + 2 <= r.x || r.x + r.w + 2 <= x || y + h + 3 <= r.y || r.y + r.h + 3 <= y; });
      };
      let spot = null;
      for (let k = 0; k < 3 && !spot; k++) {
        const y = Math.max(HUD_H + 2, y0 - k * (h + 2));
        // centred over her, else right beside a placed bubble (the side nearer to her)
        const xs = [clamp(Math.round(fx - w / 2), 2, W - w - 2)];
        out.forEach(function (r) { xs.push(r.x + r.w + 3, r.x - w - 3); });
        xs.sort(function (a, b) { return Math.abs(a + w / 2 - fx) - Math.abs(b + w / 2 - fx); });
        for (const x of xs) if (free(x, y) && Math.abs(x + w / 2 - fx) < w / 2 + 40) { spot = { x: x, y: y }; break; }
      }
      if (spot) out.push({ fan: f, text: f.bubble.text, x: spot.x, y: spot.y, w: w, h: h, tx: fx });
    }
    this.shown = out;
    return out;
  },
  drawBubble(camX, camY) {
    for (const b of this.layoutBubbles(camX, camY)) {
      const x = b.x, y = b.y, w = b.w, h = b.h;
      fillRect(x - 1, y - 1, w + 2, h + 2, "#101018");                 // outline
      fillRect(x, y, w, h, "#fffbe8");
      const tx = clamp(b.tx, x + 3, x + w - 4);
      fillRect(tx - 1, y + h, 3, 1, "#fffbe8"); fillRect(tx, y + h + 1, 1, 1, "#fffbe8");   // tail
      fillRect(tx - 2, y + h, 1, 1, "#101018"); fillRect(tx + 2, y + h, 1, 1, "#101018"); fillRect(tx - 1, y + h + 1, 1, 1, "#101018"); fillRect(tx + 1, y + h + 1, 1, 1, "#101018"); fillRect(tx, y + h + 2, 1, 1, "#101018");
      drawText(b.text, x + 3, y + 2, "#c01818");
    }
  },
  draw(camX, camY) {
    for (const f of this.list) {
      const set = SPR.fans[f.variant][this.frame(f)];
      const hop = f.cheerT > 0 ? Math.round(Math.abs(Math.sin(f.cheerT * Math.PI * 3)) * 3) : 0;
      const px = Math.round(f.x - camX) - set.pad, py = Math.round(f.y - camY + HUD_H - hop) - set.pad;
      if (px < -FAN_W - 4 || px > W + 4) continue;
      ctx.drawImage(f.face > 0 ? set.r : set.l, px, py);
    }
  },
};

