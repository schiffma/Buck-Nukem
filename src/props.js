// Clubhouse interior props (bar, restaurant, club decoration). Each prop is a small
// procedural canvas anchored at the top-left tile of its map character. Sizes in tiles.
const PROP_DEFS = {
  c: { w: 1, h: 1, name: "chair" },
  i: { w: 1, h: 1, name: "bar stool" },
  q: { w: 1, h: 1, name: "bottle shelf" },
  N: { w: 2, h: 1, name: "neon sign", anim: true },
  $: { w: 1, h: 1, name: "cash register" },
  Z: { w: 2, h: 2, name: "trophy cabinet" },
  m: { w: 6, h: 2, name: "menu board" },
  k: { w: 3, h: 2, name: "kitchen pass" },
  p: { w: 1, h: 1, name: "picture" },
  x: { w: 1, h: 1, name: "tennis rackets" },
  j: { w: 1, h: 1, name: "hanging lamp" },
  y: { w: 1, h: 2, name: "potted plant" },
  Y: { w: 4, h: 2, name: "club plaque" },
  // tennis court equipment (level 1)
  Q: { w: 2, h: 3, name: "umpire chair" },
  "@": { w: 2, h: 1, name: "ball machine" },
  "%": { w: 1, h: 1, name: "ball basket" },
  V: { w: 2, h: 1, name: "racket bag" },
  z: { w: 2, h: 1, name: "player bench" },
  "[": { w: 5, h: 2, name: "scoreboard" },
  J: { w: 2, h: 1, name: "court drag brush" },
  "&": { w: 1, h: 2, name: "water cooler" },
  // toxic creek (level 2)
  "*": { w: 1, h: 1, name: "toxic drum" },
  "^": { w: 2, h: 2, name: "toxic warning sign" },
};
const SCORE_LINES = ["TC WOLLERAU", "6:4 3:6 7:5"];
const MENU_LINES = ["CERVELAT  8.50", "RIVELLA   4.50", "FONDUE   25.-"];
const PLAQUE_LINES = ["TC", "WOLLERAU", "CLUBHOUSE"];

// Text onto any canvas context, from the pixel-font atlas (logged for the tests).
function drawTextTo(g, str, x, y, color) {
  str = String(str).toUpperCase();
  if (typeof TEXT_LOG !== "undefined" && TEXT_LOG.active) TEXT_LOG.items.push(str);
  const atlas = fontAtlas(color);
  for (let i = 0; i < str.length; i++) {
    const idx = FONT_CHARS.indexOf(str[i]);
    if (idx >= 0) g.drawImage(atlas, idx * 6, 0, 5, 7, x + i * 6, y, 5, 7);
  }
}

function r(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }

const PROP_DRAW = {
  c(g) {   // wooden chair, side view
    r(g, 3, 1, 2, 10, "#9a6430"); r(g, 3, 8, 10, 2, "#c08040"); r(g, 3, 10, 2, 6, "#8a5a2a"); r(g, 11, 10, 2, 6, "#8a5a2a");
    r(g, 3, 1, 2, 1, "#d8a060");
  },
  i(g) {   // chrome bar stool with red leather seat
    pxEllipse(g, 8, 5, 6, 2, "#8a1414"); r(g, 3, 4, 10, 1, "#c03030");
    r(g, 7, 7, 2, 8, "#b8bcc4"); r(g, 4, 11, 8, 1, "#9a9ea8"); r(g, 4, 15, 8, 1, "#70747c");
  },
  q(g) {   // back-bar shelf with bottles
    const cols = ["#2a6a2a", "#8a5a1a", "#d8d0b0", "#5a1a1a", "#2a4a8a", "#c8a030", "#3a7a5a"];
    for (let s = 0; s < 2; s++) {
      const base = s ? 15 : 7;
      r(g, 0, base, 16, 1, "#6a4020");
      for (let b = 0; b < 4; b++) {
        const h = 4 + ((b * 3 + s * 5) % 3), x = 1 + b * 4;
        r(g, x, base - h, 3, h, cols[(b + s * 3) % cols.length]); r(g, x + 1, base - h - 2, 1, 2, "#202020");
        r(g, x, base - h + 1, 1, 1, "rgba(255,255,255,0.4)");
      }
    }
  },
  N(g, on) {   // neon "BIER" sign
    r(g, 0, 1, 32, 14, "#140a10");
    const c = on ? "#ff4aa0" : "#5a2a40";
    if (on) { g.fillStyle = "rgba(255,74,160,0.25)"; g.fillRect(1, 2, 30, 12); }
    drawTextTo(g, "BIER", 5, 4, c);
    g.strokeStyle = on ? "#ffd040" : "#5a4a20"; g.lineWidth = 1; g.strokeRect(1.5, 2.5, 29, 11);
  },
  $(g) {   // cash register (stands on the counter)
    r(g, 2, 6, 12, 10, "#6a6e78"); r(g, 3, 7, 10, 3, "#2a2e34"); r(g, 4, 8, 6, 1, "#40ff70");
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r(g, 4 + i * 3, 11 + j * 2, 2, 1, "#c8ccd4");
    r(g, 4, 3, 8, 3, "#8a8e98"); r(g, 5, 4, 6, 1, "#ffe860");
  },
  Z(g) {   // trophy cabinet
    r(g, 1, 0, 30, 32, "#4a2a12"); r(g, 3, 2, 26, 28, "rgba(150,190,220,0.25)");
    for (let s = 0; s < 3; s++) r(g, 3, 9 + s * 10, 26, 1, "#6a4020");
    [[6, 8], [14, 8], [22, 8], [9, 18], [19, 18], [12, 28], [22, 28]].forEach(function (p, i) {
      const gold = i % 3 === 2 ? "#c0c0c8" : "#e8c040";
      r(g, p[0] - 2, p[1] - 6, 5, 3, gold); r(g, p[0], p[1] - 3, 1, 2, gold); r(g, p[0] - 1, p[1] - 1, 3, 1, gold);
    });
    r(g, 3, 2, 1, 28, "rgba(255,255,255,0.3)");
  },
  m(g) {   // chalkboard menu
    r(g, 0, 0, 96, 32, "#6a4020"); r(g, 2, 2, 92, 28, "#1c2620");
    drawTextTo(g, "MENU", 36, 3, "#f0e8d0");
    MENU_LINES.forEach(function (l, i) { drawTextTo(g, l, 6, 11 + i * 7 - (i ? 0 : 0), ["#ffe0a0", "#ffc8b8", "#a8e0ff"][i]); });
    g.fillStyle = "rgba(255,255,255,0.08)"; g.fillRect(4, 26, 30, 2);   // chalk smudge
  },
  k(g) {   // kitchen pass-through with sign and steaming pot
    r(g, 0, 0, 48, 9, "#2a2a30"); drawTextTo(g, "KITCHEN", 3, 1, "#ffd040");
    r(g, 2, 10, 44, 16, "#14100c");                                   // opening
    r(g, 0, 26, 48, 4, "#b8bcc4"); r(g, 0, 26, 48, 1, "#e0e4ec");      // stainless shelf
    r(g, 30, 12, 8, 6, "#f0f0f0"); r(g, 31, 10, 6, 2, "#f0f0f0");      // chef hat glimpse
    pxEllipse(g, 14, 22, 7, 4, "#70747c"); r(g, 7, 18, 14, 2, "#9a9ea8");  // pot
    r(g, 10, 12, 1, 4, "rgba(230,230,230,0.5)"); r(g, 14, 11, 1, 5, "rgba(230,230,230,0.5)"); r(g, 18, 13, 1, 3, "rgba(230,230,230,0.5)");
    r(g, 0, 30, 48, 2, "#4a2a12");
  },
  p(g) {   // framed photo (the hero, of course)
    r(g, 1, 2, 14, 12, "#c8a040"); r(g, 2, 3, 12, 10, "#101010");
    g.imageSmoothingEnabled = false;
    if (IMG.portrait) g.drawImage(IMG.portrait, 12, 6, 72, 60, 2, 3, 12, 10);
  },
  x(g) {   // crossed tennis rackets
    g.strokeStyle = "#d8d0c0"; g.lineWidth = 1;
    [[5, 5], [11, 5]].forEach(function (c) { g.beginPath(); g.ellipse(c[0] + 0.5, c[1] + 0.5, 4, 5, 0, 0, Math.PI * 2); g.stroke(); });
    r(g, 5, 9, 1, 6, "#5a3418"); r(g, 11, 9, 1, 6, "#5a3418");
    g.fillStyle = "rgba(216,208,192,0.5)"; for (let i = 2; i < 9; i += 2) { g.fillRect(2, i, 7, 1); g.fillRect(8, i, 7, 1); }
  },
  j(g) {   // hanging lamp with warm glow
    r(g, 7, 0, 1, 7, "#202020");
    g.fillStyle = "#1e5a2a"; g.beginPath(); g.moveTo(3, 12); g.lineTo(5, 7); g.lineTo(10, 7); g.lineTo(12, 12); g.closePath(); g.fill();
    r(g, 6, 12, 3, 2, "#fff0b0"); g.fillStyle = "rgba(255,220,120,0.25)"; g.fillRect(2, 13, 11, 3);
  },
  y(g) {   // potted plant (1x2)
    r(g, 4, 24, 8, 8, "#a8502a"); r(g, 3, 23, 10, 2, "#c06838");
    [[8, 10, 5, 7], [5, 15, 4, 5], [11, 16, 4, 5], [8, 19, 5, 4]].forEach(function (e) { pxEllipse(g, e[0], e[1], e[2], e[3], "#2e6a2a"); });
    pxEllipse(g, 6, 9, 2, 3, "#46a03a"); pxEllipse(g, 11, 14, 2, 2, "#46a03a");
  },
  Q(g) {   // umpire chair (2x3): tall green chair with ladder and sunshade
    r(g, 4, 0, 24, 3, "#e8e8e0"); r(g, 4, 3, 24, 1, "#2a7240"); r(g, 15, 3, 2, 6, "#c0c4cc");   // sunshade
    r(g, 8, 9, 16, 12, "#2a7240"); r(g, 8, 9, 16, 2, "#3e9a58");                               // backrest
    r(g, 6, 21, 22, 3, "#246236"); r(g, 6, 21, 22, 1, "#4ab068");                              // seat
    r(g, 7, 24, 2, 24, "#c8ccd4"); r(g, 23, 24, 2, 24, "#c8ccd4");                             // legs
    for (let y = 28; y < 48; y += 5) r(g, 9, y, 14, 1, "#9a9ea8");                              // ladder rungs
    r(g, 5, 46, 6, 2, "#70747c"); r(g, 21, 46, 6, 2, "#70747c");
  },
  "@"(g) {   // ball machine
    r(g, 6, 1, 18, 5, "#3a3e46"); for (let x = 8; x < 22; x += 3) pxEllipse(g, x + 1, 3, 1, 1, "#d8f040");   // hopper with balls
    r(g, 4, 6, 22, 7, "#70747c"); r(g, 4, 6, 22, 1, "#a0a4ac"); r(g, 26, 8, 5, 3, "#2a2e34");               // body + nozzle
    pxEllipse(g, 8, 14, 2, 2, "#101010"); pxEllipse(g, 22, 14, 2, 2, "#101010");
  },
  "%"(g) {   // ball basket
    r(g, 2, 6, 12, 9, "#9a9ea8"); for (let x = 3; x < 14; x += 3) r(g, x, 6, 1, 9, "#5a5e66"); r(g, 2, 10, 12, 1, "#5a5e66");
    for (let i = 0; i < 4; i++) pxEllipse(g, 4 + i * 3, 5, 1, 1, "#d8f040");
    r(g, 4, 1, 1, 5, "#5a5e66"); r(g, 11, 1, 1, 5, "#5a5e66"); r(g, 4, 1, 8, 1, "#5a5e66");
  },
  V(g) {   // racket bag with two handles
    r(g, 2, 8, 26, 7, "#a81818"); r(g, 2, 8, 26, 1, "#d84040"); r(g, 2, 11, 26, 1, "#101010");
    r(g, 1, 9, 1, 5, "#801010"); r(g, 28, 9, 1, 5, "#801010");
    r(g, 22, 3, 3, 5, "#202020"); r(g, 26, 4, 3, 4, "#e8e0d0");                                // racket handles
  },
  z(g) {   // player bench with towel
    r(g, 2, 2, 28, 2, "#2a7240"); r(g, 2, 5, 28, 2, "#2a7240");                                // backrest slats
    r(g, 1, 8, 30, 3, "#3e9a58"); r(g, 1, 8, 30, 1, "#5ac07a");                                // seat
    r(g, 3, 11, 2, 5, "#e0e0e0"); r(g, 27, 11, 2, 5, "#e0e0e0"); r(g, 4, 2, 1, 6, "#e0e0e0"); r(g, 27, 2, 1, 6, "#e0e0e0");
    r(g, 18, 6, 6, 7, "#f0f0f0"); r(g, 18, 9, 6, 1, "#3a7ad8");                                // towel
  },
  "["(g) {   // scoreboard (5x2)
    r(g, 1, 0, 78, 23, "#1e4a2a"); r(g, 2, 1, 76, 21, "#14351e");
    drawTextTo(g, SCORE_LINES[0], 8, 3, "#f0e8d0");
    drawTextTo(g, SCORE_LINES[1], 8, 13, "#ffd040");
    r(g, 10, 23, 3, 9, "#70747c"); r(g, 66, 23, 3, 9, "#70747c");
  },
  J(g) {   // court drag brush leaning against the fence
    r(g, 1, 12, 26, 3, "#6a4020"); for (let x = 2; x < 26; x += 2) r(g, x, 15, 1, 1, "#3a2410");  // brush bar + bristles
    for (let i = 0; i < 12; i++) r(g, 14 + i, 12 - i, 1, 1, "#c8ccd4");                         // handle
    r(g, 24, 0, 6, 1, "#c8ccd4");                                                               // T-grip
  },
  "&"(g) {   // water cooler on a stand
    pxEllipse(g, 8, 10, 6, 7, "rgba(90,170,255,0.75)"); r(g, 6, 1, 4, 3, "#2a60c0"); r(g, 5, 12, 1, 3, "rgba(255,255,255,0.6)");
    r(g, 3, 17, 10, 4, "#e0e0e8"); r(g, 11, 18, 2, 2, "#2a60c0");                               // dispenser + tap
    r(g, 4, 21, 2, 11, "#9a9ea8"); r(g, 10, 21, 2, 11, "#9a9ea8"); r(g, 4, 26, 8, 1, "#9a9ea8");
    r(g, 13, 24, 3, 4, "#f0f0f0");                                                             // cups
  },
  "*"(g) {   // rusty toxic waste drum, oozing red
    r(g, 3, 2, 10, 14, "#c8a020"); r(g, 3, 2, 10, 1, "#e8c840"); r(g, 3, 6, 10, 1, "#7a5a10"); r(g, 3, 11, 10, 1, "#7a5a10");
    r(g, 3, 2, 1, 14, "#8a6a18"); r(g, 12, 2, 1, 14, "#8a6a18");
    r(g, 7, 7, 2, 2, "#101010"); r(g, 5, 9, 2, 1, "#101010"); r(g, 9, 9, 2, 1, "#101010");    // trefoil
    r(g, 4, 1, 5, 2, "#d02010"); r(g, 4, 3, 1, 5, "#d02010"); r(g, 11, 13, 1, 3, "#ff4020");  // ooze
    r(g, 5, 4, 2, 1, "rgba(120,60,20,0.8)"); r(g, 9, 13, 2, 1, "rgba(120,60,20,0.8)");         // rust
  },
  "^"(g) {   // skull "TOXIC" warning sign (2x2)
    r(g, 15, 18, 2, 14, "#70747c");                                                             // post
    r(g, 0, 0, 32, 18, "#101010"); r(g, 1, 1, 30, 16, "#ffd020");
    pxEllipse(g, 16, 5, 3, 3, "#101010"); r(g, 15, 5, 1, 1, "#ffd020"); r(g, 17, 5, 1, 1, "#ffd020");   // skull
    r(g, 14, 8, 5, 1, "#101010"); r(g, 12, 3, 1, 1, "#101010"); r(g, 20, 7, 1, 1, "#101010");
    drawTextTo(g, "TOXIC", 2, 10, "#101010");
  },
  Y(g) {   // brass club plaque (4x2)
    r(g, 2, 2, 60, 28, "#8a6a2a"); r(g, 4, 4, 56, 24, "#c8a040"); r(g, 4, 4, 56, 1, "#e8d080");
    PLAQUE_LINES.forEach(function (l, i) { drawTextTo(g, l, 32 - Math.floor((l.length * 6 - 1) / 2), 6 + i * 8, "#3a2a0a"); });
  },
};

const propCache = {};
function buildProp(ch, variant) {
  const d = PROP_DEFS[ch];
  const c = makeCanvas(d.w * TILE, d.h * TILE);
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  PROP_DRAW[ch](g, variant);
  return c;
}
// Returns the (cached) canvas for a prop; animated props pick a frame from time.
function propCanvas(ch, time) {
  const d = PROP_DEFS[ch];
  let variant = true;
  if (d.anim) {   // neon flicker: mostly on, occasional quick blinks
    const t = (time * 10) | 0;
    variant = !(t % 37 === 0 || t % 37 === 2 || t % 53 === 5);
  }
  const key = ch + (variant ? 1 : 0);
  if (!propCache[key]) propCache[key] = buildProp(ch, variant);
  return propCache[key];
}
