// Grindhouse-styled screens: exploitation-poster title, film-reel intro cards (countdown
// leader, "REEL n", "MISSING REEL"), level complete, pause and "THE END" cards.
const TITLE_CONTROLS = [
  ["ARROWS/WASD", "MOVE"], ["UP/DOWN", "CLIMB/KNEEL"], ["SPACE", "JUMP"],
  ["X/CTRL/ALT", "FIRE"], ["P/ENTER", "PAUSE"], ["M", "MUTE"], ["G", "FILM FILTER"], ["F", "FULLSCREEN"],
];
const TAGLINE = ["HE CAME FOR THE TENNIS.", "HE STAYED FOR THE CARNAGE."];

// Records every string drawn while active (used by the tests to check screen content).
const TEXT_LOG = { active: false, items: [] };
const _drawText = drawText;
drawText = function (str, x, y, color, opts) {
  if (TEXT_LOG.active) TEXT_LOG.items.push(String(str).toUpperCase());
  _drawText(str, x, y, color, opts);
};

function drawFramedPortrait(x, y) {
  fillRect(x - 3, y - 3, 102, 102, "#e8d8a8");
  fillRect(x - 1, y - 1, 98, 98, "#101018");
  ctx.drawImage(IMG.portrait, x, y);
}

function blink(rate) { return Math.floor(Game.time * (rate || 2)) % 2 === 0; }

// Big distressed, outlined poster lettering; cached per text/scale/colour.
const logoCache = {};
function posterLogo(text, scale, top, bottom) {
  const key = text + scale + top + bottom;
  if (logoCache[key]) return logoCache[key];
  const tw = textWidth(text, scale), th = 7 * scale;
  const c = makeCanvas(tw + 6, th + 6);
  const g = c.getContext("2d");
  // glyphs into a temp canvas, then outline by stamping black at 8 offsets
  const glyph = makeCanvas(tw, th), gg = glyph.getContext("2d");
  const atlas = fontAtlas("#ffffff");
  for (let i = 0; i < text.length; i++) {
    const idx = FONT_CHARS.indexOf(text[i]);
    if (idx >= 0) gg.drawImage(atlas, idx * 6, 0, 5, 7, i * 6 * scale, 0, 5 * scale, 7 * scale);
  }
  const black = makeCanvas(tw, th), bg = black.getContext("2d");
  bg.drawImage(glyph, 0, 0); bg.globalCompositeOperation = "source-in"; bg.fillStyle = "#0a0608"; bg.fillRect(0, 0, tw, th);
  for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) if (dx || dy) g.drawImage(black, 3 + dx, 3 + dy);
  g.drawImage(black, 5, 6);                                  // drop shadow
  // two-tone fill: top colour above the middle, bottom colour below
  const fill = makeCanvas(tw, th), fg = fill.getContext("2d");
  fg.fillStyle = bottom; fg.fillRect(0, 0, tw, th);
  fg.fillStyle = top; fg.fillRect(0, 0, tw, Math.floor(th * 0.5));
  fg.fillStyle = "rgba(255,255,255,0.35)"; fg.fillRect(0, 0, tw, scale);
  fg.globalCompositeOperation = "destination-in"; fg.drawImage(glyph, 0, 0);
  g.drawImage(fill, 3, 3);
  // distress: punch small holes and scrapes
  const rng = makeRng(text.length * 131 + scale);
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < tw * th * 0.012; i++) {
    const x = 3 + rng() * tw, y = 3 + rng() * th, s = 1 + (rng() < 0.3 ? 1 : 0);
    g.fillRect(Math.floor(x), Math.floor(y), s, s);
  }
  for (let i = 0; i < 3; i++) g.fillRect(Math.floor(rng() * tw), Math.floor(3 + rng() * th), Math.floor(4 + rng() * 10), 1);
  c.text = text;
  logoCache[key] = c;
  return c;
}
function drawLogo(text, cx, y, scale, top, bottom) {
  const c = posterLogo(text, scale, top || "#ffd840", bottom || "#e8401a");
  if (TEXT_LOG.active) TEXT_LOG.items.push(text);
  ctx.drawImage(c, Math.round(cx - c.width / 2), y);
}

// Halftone dots + torn paper border for the poster look (pre-rendered).
let posterOverlay = null;
function getPosterOverlay() {
  if (posterOverlay) return posterOverlay;
  const c = makeCanvas(W, H), g = c.getContext("2d");
  g.fillStyle = "rgba(10,4,2,0.35)";
  for (let y = 0; y < H; y += 3) for (let x = (y / 3) % 2 ? 1 : 0; x < W; x += 3) g.fillRect(x, y, 1, 1);
  const rng = makeRng(7);
  g.fillStyle = "#d8c8a0";
  for (let x = 0; x < W; x += 2) {
    g.fillRect(x, 0, 2, 3 + Math.floor(rng() * 4));
    const b = 3 + Math.floor(rng() * 4); g.fillRect(x, H - b, 2, b);
  }
  for (let y = 0; y < H; y += 2) {
    g.fillRect(0, y, 3 + Math.floor(rng() * 4), 2);
    const r = 3 + Math.floor(rng() * 4); g.fillRect(W - r, y, r, 2);
  }
  g.fillStyle = "rgba(120,90,40,0.5)";                       // stains on the paper
  for (let i = 0; i < 30; i++) g.fillRect(Math.floor(rng() * W), rng() < 0.5 ? Math.floor(rng() * 6) : H - 6 + Math.floor(rng() * 6), 2, 2);
  posterOverlay = c;
  return c;
}

function drawBadge(x, y) {
  fillRect(x, y, 58, 30, "#f0e8d0");
  fillRect(x + 2, y + 2, 54, 26, "#0a0608");
  drawText("RATED W", x + 29, y + 4, "#ff3a2a", { align: "center" });
  drawText("WOLLERAU", x + 29, y + 13, "#f0e8d0", { align: "center" });
  drawText("XTREME", x + 29, y + 21, "#c8b890", { align: "center" });
}

// Phases of the film-reel level intro. Durations in seconds.
const INTRO = { missing: 1.6, leaderStep: 0.4, leaderSteps: 3, card: 1.4 };
function introPhases(isBoss) {
  const ph = [];
  if (isBoss) ph.push({ name: "missing", d: INTRO.missing });
  for (let i = 0; i < INTRO.leaderSteps; i++) ph.push({ name: "leader", d: INTRO.leaderStep, n: INTRO.leaderSteps - i });
  ph.push({ name: "card", d: INTRO.card });
  return ph;
}
function introTotal(isBoss) { return introPhases(isBoss).reduce(function (a, p) { return a + p.d; }, 0); }
function introPhaseAt(isBoss, t) {
  let acc = 0;
  for (const p of introPhases(isBoss)) { if (t < acc + p.d) return { name: p.name, n: p.n, t: (t - acc) / p.d }; acc += p.d; }
  return { name: "done" };
}

const Screens = {
  title() {
    ctx.drawImage(IMG.bg_title, 0, 0);
    fillRect(0, 0, W, H, "rgba(150,30,10,0.3)");               // lurid red poster tint
    ctx.drawImage(getPosterOverlay(), 0, 0);
    drawLogo("BUCK NUKEM", W / 2, 9, 4);
    fillRect(W / 2 - 104, 44, 208, 32, "rgba(46,6,14,0.74)");  // tagline panel (readable on the tint)
    drawText("IN THE WOLLERAU CRAYFISH CRISIS", W / 2, 47, "#f0e8d0", { align: "center", shadow: "#000" });
    drawText(TAGLINE[0], W / 2, 58, "#ffd840", { align: "center", shadow: "#000" });
    drawText(TAGLINE[1], W / 2, 67, "#ff5a3a", { align: "center", shadow: "#000" });
    drawFramedPortrait(14, 80);
    const x = 126;
    fillRect(x - 6, 78, 186, 104, "rgba(46,6,14,0.74)");
    drawText("CONTROLS", x, 82, "#ffd840");
    TITLE_CONTROLS.forEach(function (l, i) {
      drawText(l[0], x, 94 + i * 11, "#e8a860");
      drawText(l[1], x + 72, 94 + i * 11, "#f0e8d0");
    });
    drawBadge(250, 186);
    if (blink(2)) drawText("PRESS ENTER", 130, 186, "#ff3a2a", { scale: 2, align: "center", shadow: "#000" });
    drawText("FILMED ON LOCATION IN WOLLERAU", 130, 206, "#c8b890", { align: "center", shadow: "#000" });
    if (!Sound.ac) drawText("(ANY KEY STARTS THE MUSIC)", 130, 218, "#9a8a70", { align: "center", shadow: "#000" });
    else drawText(Sound.muted ? "SOUND OFF (M)" : "SOUND ON (M)", 130, 218, "#9a8a70", { align: "center", shadow: "#000" });
  },

  levelIntro() {
    const L = Game.level;
    const ph = introPhaseAt(L.isBoss, Game.stateT);
    if (ph.name === "missing") {
      fillRect(0, 0, W, H, "#0c0806");
      // film burn spreading from the centre
      const r = Math.round(10 + ph.t * 90);
      pxEllipse(ctx, W / 2 + 40, H / 2 + 30, r + 6, Math.round((r + 6) * 0.8), "rgba(255,120,20,0.5)");
      pxEllipse(ctx, W / 2 + 40, H / 2 + 30, r, Math.round(r * 0.8), "rgba(255,240,200,0.9)");
      drawLogo("MISSING REEL", W / 2, 70, 3, "#f0e8d0", "#c8b890");
      drawText("WE REGRET THAT THIS PORTION", W / 2, 110, "#f0e8d0", { align: "center", shadow: "#000" });
      drawText("OF THE FILM IS MISSING", W / 2, 120, "#f0e8d0", { align: "center", shadow: "#000" });
    } else if (ph.name === "leader") {
      // countdown leader: grey frame, circles, crosshair, sweeping wedge, big digit
      fillRect(0, 0, W, H, "#8a8478");
      ctx.fillStyle = "#5e584e";
      ctx.beginPath(); ctx.moveTo(W / 2, H / 2);
      ctx.arc(W / 2, H / 2, 140, -Math.PI / 2, -Math.PI / 2 + ph.t * Math.PI * 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#f0ece0"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(W / 2, H / 2, 86, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(W / 2, H / 2, 72, 0, Math.PI * 2); ctx.stroke();
      fillRect(0, H / 2 - 1, W, 2, "#2a2620"); fillRect(W / 2 - 1, 0, 2, H, "#2a2620");
      drawText(String(ph.n), W / 2, H / 2 - 28, "#0a0608", { scale: 8, align: "center" });
    } else {
      fillRect(0, 0, W, H, "#0c0806");
      ctx.drawImage(getPosterOverlay(), 0, 0);
      drawLogo(L.isBoss ? "FINAL REEL" : "REEL " + (Game.levelIndex + 1), W / 2, 60, 4);
      drawText(L.name, W / 2, 110, "#f0e8d0", { align: "center", shadow: "#000" });
      drawHead(ctx, W / 2 - 14, 134);
      drawText("X" + Player.lives, W / 2 + 6, 139, "#f0e8d0");
      if (blink(3)) drawText("GET READY!", W / 2, 176, "#ff5a3a", { scale: 2, align: "center", shadow: "#000" });
    }
  },

  levelComplete() {
    ctx.drawImage(IMG.bg_complete, 0, 0);
    fillRect(0, 0, W, H, "rgba(20,4,0,0.35)");
    const t = Game.tally;
    drawText("LEVEL COMPLETE!", W / 2, 30, "#ffe860", { scale: 2, align: "center", shadow: "#000" });
    drawText(Game.level.name, W / 2, 56, "#ffffff", { align: "center" });
    const rows = [
      ["LEVEL BONUS", t.level], ["HEALTH BONUS", t.health], ["TIME BONUS", t.time],
      ["ENEMIES", Game.stats.kills], ["TOTAL BONUS", t.shown],
    ];
    rows.forEach(function (r, i) {
      drawText(r[0], 60, 86 + i * 16, i === 4 ? "#ffe860" : "#c0c8d8");
      drawText(String(r[1]), 260, 86 + i * 16, i === 4 ? "#ffe860" : "#ffffff", { align: "right" });
    });
    drawText("SCORE " + Game.score, W / 2, 180, "#ffffff", { align: "center" });
    if (t.done && blink(2)) drawText("PRESS ENTER", W / 2, 210, "#ffffff", { align: "center" });
  },

  pause() {
    fillRect(0, HUD_H, W, VIEW_H, "rgba(0,0,0,0.5)");
    drawText("PAUSED", W / 2, 110, "#ffffff", { scale: 2, align: "center", shadow: "#000" });
    drawText("PRESS P TO CONTINUE", W / 2, 132, "#c0c0c0", { align: "center" });
  },

  gameOver() {
    fillRect(0, 0, W, H, "#0c0806");
    ctx.globalAlpha = 0.35; drawFramedPortrait(W / 2 - 48, 14); ctx.globalAlpha = 1;
    fillRect(0, 0, W, H, "rgba(90,0,0,0.3)");
    drawLogo("THE END", W / 2, 104, 5, "#f0e8d0", "#c8b890");
    drawText("...OF BUCK NUKEM?", W / 2, 152, "#ff3a2a", { align: "center", shadow: "#000" });
    drawText("FINAL SCORE " + Game.score, W / 2, 172, "#f0e8d0", { align: "center" });
    drawText("THE LAWYERS WIN THIS ROUND...", W / 2, 188, "#c0a080", { align: "center" });
    if (Game.stateT > 1 && blink(2)) drawText("PRESS ENTER", W / 2, 214, "#ffffff", { align: "center" });
  },

  victory() {
    ctx.drawImage(IMG.bg_title, 0, 0);
    fillRect(0, 0, W, H, "rgba(150,30,10,0.3)");               // lurid red poster tint
    ctx.drawImage(getPosterOverlay(), 0, 0);
    drawLogo("THE END", W / 2, 10, 5, "#f0e8d0", "#c8b890");
    drawFramedPortrait(20, 64);
    const x = 130;
    fillRect(x - 6, 62, 172, 88, "rgba(46,6,14,0.74)");
    fillRect(W / 2 - 112, 172, 224, 56, "rgba(46,6,14,0.74)");
    ["THE GIANT MUTANT CRAYFISH", "IS DEFEATED!", "", "TC WOLLERAU IS SAFE.", "THE COURTS ARE OPEN", "AGAIN. CERVELAT FOR",
     "EVERYONE!"].forEach(function (l, i) {
      drawText(l, x, 66 + i * 12, "#f0e8d0", { shadow: "#000" });
    });
    drawText("FINAL SCORE " + Game.score, W / 2, 176, "#ffd840", { scale: 2, align: "center", shadow: "#000" });
    drawText("BUCK NUKEM WILL RETURN", W / 2, 200, "#ff5a3a", { align: "center", shadow: "#000" });
    if (Game.stateT > 2 && blink(2)) drawText("PRESS ENTER", W / 2, 218, "#ffffff", { align: "center", shadow: "#000" });
    // fireworks
    if (Math.random() < 0.08) FX.explode(rnd(20, 300), rnd(20, 120), false);
    FX.draw(0, 0);
  },
};
