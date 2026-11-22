// Cheering tennis fans: TC Wollerau players in 1970s tennis whites cheering Buck from the
// background. Purely decorative: no collisions, no effect on gameplay. Placed with the map
// character F; each fan in a level gets a different look (hair, skin, accent, accessory).
const FAN_SKIN = { light: "#f0c8a8", tan: "#d8a070", brown: "#a86a40", dark: "#6e4428" };
const FAN_HAIR = { blonde: "#f0d060", brown: "#7a4a22", black: "#201814", red: "#c84a20", ash: "#d8c8a0", auburn: "#8a3018" };
const FAN_ACCENT = { red: "#d02020", blue: "#2060d0", green: "#20a040", orange: "#f08020", purple: "#8040c0", pink: "#e05090" };
const FAN_VARIANTS = [
  { hair: "ponytail", hairCol: "blonde", skin: "light", accent: "red", item: "racket" },
  { hair: "afro", hairCol: "black", skin: "dark", accent: "orange", item: "headband" },
  { hair: "bob", hairCol: "red", skin: "light", accent: "green", item: "towel" },
  { hair: "bun", hairCol: "brown", skin: "tan", accent: "blue", item: "visor" },
  { hair: "long", hairCol: "black", skin: "brown", accent: "pink", item: "racket" },
  { hair: "ponytail", hairCol: "auburn", skin: "tan", accent: "purple", item: "towel" },
  { hair: "bob", hairCol: "ash", skin: "light", accent: "blue", item: "headband" },
  { hair: "afro", hairCol: "brown", skin: "brown", accent: "green", item: "racket" },
];
const FAN_FRAMES = ["idle", "wave", "jump"];
const FAN_W = 20, FAN_H = 32;
const FAN_LINES = ["GO BUCK!", "YEAH BUCK!", "WOOO!", "MY HERO!", "BUCK! BUCK!"];

// One 20x32 frame, facing right. frame: idle (arms down), wave (front arm up), jump (both
// arms up in a V, body lifted 2 px). The body is 16 px wide at an x offset of 2 so raised
// arms, rackets and towels fit inside the canvas.
function buildFanFrame(v, frame) {
  const c = makeCanvas(FAN_W, FAN_H), g = c.getContext("2d");
  const skin = FAN_SKIN[v.skin], hair = FAN_HAIR[v.hairCol], acc = FAN_ACCENT[v.accent];
  const ox = 2, oy = frame === "jump" ? 2 : 4;
  const P = function (col, x, y, w, h) { g.fillStyle = col; g.fillRect(ox + x, oy + y, w || 1, h || 1); };
  const WHITE = "#f4f4f0", SHADE = "#d4d4d0", cheer = frame !== "idle";
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
  P("#101018", 9, 5);
  if (cheer) { P("#801818", 9, 7, 2, 1); P("#f0f0f0", 9, 7); } else P("#a04030", 9, 7, 2, 1);
  // hair
  switch (v.hair) {
    case "ponytail": P(hair, 5, 2, 6, 2); P(hair, 4, 3, 2, 4); P(hair, 2, 4, 2, 2); P(hair, 1, 6, 2, 3); P(acc, 4, 3); break;
    case "bob": P(hair, 4, 2, 7, 2); P(hair, 3, 3, 3, 5); P(hair, 10, 3, 1, 1); break;
    case "afro": P(hair, 4, 0, 7, 1); P(hair, 2, 1, 10, 3); P(hair, 2, 4, 4, 4); P(hair, 10, 2, 2, 2); break;
    case "bun": P(hair, 5, 2, 6, 2); P(hair, 4, 3, 2, 3); P(hair, 4, 0, 3, 2); break;
    case "long": P(hair, 5, 2, 6, 2); P(hair, 3, 3, 3, 8); P(hair, 10, 3, 1, 1); break;
  }
  if (v.item === "headband") P(acc, 5, 3, 6, 1);
  if (v.item === "visor") { P(acc, 5, 3, 6, 1); P(acc, 11, 3, 2, 1); }
  // arms (2 px wide) with wristbands: down at the sides, or raised up and out in a V
  function armDown(x) { P(skin, x, 10, 1, 6); P(acc, x, 14); return { x: x, y: 16 }; }
  function armUp(dir) {            // dir 1 = front (right), -1 = back (left)
    const pts = dir > 0 ? [[12, 10], [13, 9], [13, 8], [14, 7], [14, 6], [15, 5]] : [[3, 10], [2, 9], [2, 8], [1, 7], [1, 6], [0, 5]];
    pts.forEach(function (q) { P(skin, q[0], q[1], 1, 1); P(skin, q[0] - dir, q[1], 1, 1); });
    P(acc, pts[3][0], pts[3][1]); P(acc, pts[3][0] - dir, pts[3][1]);
    return { x: pts[5][0], y: pts[5][1] - 1 };
  }
  const hand = frame === "idle" ? armDown(12) : armUp(1);
  const backHand = frame === "jump" ? armUp(-1) : armDown(3);
  P(skin, hand.x, hand.y); P(skin, backHand.x, backHand.y);
  const up = frame !== "idle";
  if (v.item === "racket") {              // wooden grip, black frame, light strings
    if (up) { P("#5a3a1a", hand.x, hand.y - 2, 1, 2); P("#202020", hand.x - 1, hand.y - 7, 3, 5); P("#e8e8d8", hand.x, hand.y - 6, 1, 3); }
    else { P("#5a3a1a", hand.x, hand.y + 1, 1, 2); P("#202020", hand.x - 1, hand.y + 3, 3, 5); P("#e8e8d8", hand.x, hand.y + 4, 1, 3); }
  } else if (v.item === "towel") {        // white towel with a coloured stripe, swung overhead
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
  list: [], bubble: null, lastCheer: -99, lineIdx: 0, time: 0,
  spawn(level, levelIndex) {
    this.list = []; this.bubble = null; this.lastCheer = -99; this.time = 0;
    const self = this;
    level.spawns.filter(function (s) { return s.ch === "F"; }).forEach(function (s, i) {
      self.list.push({ tx: s.tx, ty: s.ty, x: s.tx * TILE + TILE / 2 - FAN_W / 2, y: (s.ty + 1) * TILE - (FAN_H - 1),
        variant: (levelIndex * 3 + i) % FAN_VARIANTS.length, face: -1, phase: i * 0.37, cheerT: 0 });
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
    }
    if (this.bubble && (this.bubble.t -= dt) <= 0) this.bubble = null;
  },
  frame(f) {
    if (f.cheerT > 0) return Math.floor(f.cheerT / 0.15) % 2 ? "jump" : "wave";
    return ((this.time + f.phase) % 0.9) < 0.35 ? "wave" : "idle";   // idle cheer loop
  },
  // Buck scored near (x, y): fans within 12 tiles cheer; the nearest one gets a speech
  // bubble and a cheer sound plays, at most once per 1.5 s.
  react(x, y, kind) {
    let nearest = null, nd = Infinity;
    for (const f of this.list) {
      const d = Math.hypot(f.x + FAN_W / 2 - x, f.y + FAN_H / 2 - y);
      if (d > 12 * TILE) continue;
      f.cheerT = 1.0;
      if (d < nd) { nd = d; nearest = f; }
    }
    if (!nearest || this.time - this.lastCheer < 1.5) return false;
    this.lastCheer = this.time;
    this.bubble = { fan: nearest, text: FAN_LINES[this.lineIdx++ % FAN_LINES.length], t: 1.2, kind: kind };
    Sound.play("cheer");
    return true;
  },
  drawBubble(camX, camY) {
    const b = this.bubble;
    if (!b) return;
    const w = b.text.length * 6 + 5, h = 11;
    let x = Math.round(b.fan.x + FAN_W / 2 - camX - w / 2), y = Math.round(b.fan.y - camY + HUD_H) - h - 2;
    x = clamp(x, 2, W - w - 2); y = Math.max(HUD_H + 2, y);
    fillRect(x - 1, y - 1, w + 2, h + 2, "#101018");                 // outline
    fillRect(x, y, w, h, "#fffbe8");
    const tx = clamp(Math.round(b.fan.x + FAN_W / 2 - camX), x + 3, x + w - 4);
    fillRect(tx - 1, y + h, 3, 1, "#fffbe8"); fillRect(tx, y + h + 1, 1, 1, "#fffbe8");   // tail
    fillRect(tx - 2, y + h, 1, 1, "#101018"); fillRect(tx + 2, y + h, 1, 1, "#101018"); fillRect(tx - 1, y + h + 1, 1, 1, "#101018"); fillRect(tx + 1, y + h + 1, 1, 1, "#101018"); fillRect(tx, y + h + 2, 1, 1, "#101018");
    drawText(b.text, x + 3, y + 2, "#c01818");
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

