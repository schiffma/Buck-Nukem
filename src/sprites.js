// Procedural pixel art. Sprites are rows of palette characters, turned into canvases
// once at startup (plus mirrored and white-flash variants).
const PAL = {
  k: "#101018", w: "#f0f0f0", W: "#c0c4cc",
  J: "#1c2848", j: "#34487c",                   // hero jacket
  s: "#e8a880", S: "#c07858",                   // skin
  P: "#3858a8", p: "#243c78",                   // jeans
  b: "#4a3020", B: "#7a5232",                   // boots / leather
  g: "#8890a0", G: "#50545e", v: "#b8c0cc", V: "#6c7484", // metal
  y: "#ffd840", o: "#e08a1c", r: "#d02020", R: "#ff5050",
  n: "#5a6272", N: "#3a404e", h: "#3a2818", t: "#c01818", // lawyer
  c: "#c84828", C: "#7e2614", e: "#f4e090",     // crayfish / sausage
  a: "#8c2c1c", A: "#561810", x: "#b84a32", i: "#e0806a", E: "#e8c8b0",   // crayfish (red only)
  m: "#1e9a1e", M: "#22602a", l: "#40e040",     // green (punk mohawk)
  z: "#ecd070", Z: "#a88a3c",                   // straw hat
  u: "#40a8ff", U: "#2060c0",
  q: "#d8f040", Q: "#98b020",                   // tennis ball
  X: "#ff00ff",                                 // placeholder (key colour)
};

function spriteFromRows(rows, pal) {
  pal = pal || PAL;
  const h = rows.length, w = rows[0].length;
  const c = makeCanvas(w, h);
  const g = c.getContext("2d");
  for (let y = 0; y < h; y++) {
    if (rows[y].length !== w) console.warn("sprite row width mismatch", rows[y]);
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (ch === "." || ch === " ") continue;
      const col = pal[ch];
      if (!col) continue;
      g.fillStyle = col;
      g.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

function mirror(c) {
  const m = makeCanvas(c.width, c.height);
  const g = m.getContext("2d");
  g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0);
  return m;
}

function silhouette(c, color) {
  const s = makeCanvas(c.width, c.height);
  const g = s.getContext("2d");
  g.drawImage(c, 0, 0);
  g.globalCompositeOperation = "source-in";
  g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  return s;
}

// Grindhouse treatment: 3-tone shading (highlight where the upper/left neighbour is
// empty, shadow where the lower/right neighbour is empty) plus a 1-px dark outline.
// The result is padded by OUTLINE_PAD on every side.
const OUTLINE_COLOR = [10, 6, 8];
const OUTLINE_PAD = 1;
function shadeAndOutline(c) {
  const w = c.width, h = c.height, P = OUTLINE_PAD, w2 = w + 2 * P, h2 = h + 2 * P;
  const src = c.getContext("2d").getImageData(0, 0, w, h).data;
  const out = makeCanvas(w2, h2);
  const g = out.getContext("2d");
  const img = g.createImageData(w2, h2), d = img.data;
  function A(x, y) { return x < 0 || y < 0 || x >= w || y >= h ? 0 : src[(y * w + x) * 4 + 3]; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (!src[i + 3]) continue;
    let r = src[i], gg = src[i + 1], b = src[i + 2];
    if (!A(x, y - 1) || !A(x - 1, y)) { r = Math.min(255, r * 1.25 + 18); gg = Math.min(255, gg * 1.25 + 18); b = Math.min(255, b * 1.2 + 14); }
    else if (!A(x, y + 1) || !A(x + 1, y)) { r *= 0.68; gg *= 0.68; b *= 0.72; }
    const o = ((y + P) * w2 + x + P) * 4;
    d[o] = r; d[o + 1] = gg; d[o + 2] = b; d[o + 3] = 255;
  }
  for (let y = 0; y < h2; y++) for (let x = 0; x < w2; x++) {
    const o = (y * w2 + x) * 4;
    if (d[o + 3]) continue;
    const sx = x - P, sy = y - P;
    if (A(sx - 1, sy) || A(sx + 1, sy) || A(sx, sy - 1) || A(sx, sy + 1)) {
      d[o] = OUTLINE_COLOR[0]; d[o + 1] = OUTLINE_COLOR[1]; d[o + 2] = OUTLINE_COLOR[2]; d[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return out;
}

// A sprite set: {r: right-facing, l: left-facing, fr/fl: white flash variants,
// w/h: logical size (without padding), pad: outline padding to subtract when drawing}
function makeSet(c) {
  const o = shadeAndOutline(c);
  const l = mirror(o);
  return { r: o, l: l, fr: silhouette(o, "#fff"), fl: silhouette(l, "#fff"), w: c.width, h: c.height, pad: OUTLINE_PAD };
}

const SPR = {};

// ---------------- hero ----------------
// Frame layout 23x32: head (10x12 incl. shoulder hair) at (HEAD_X, 0), rows 0-8 are the
// head; body = 13 torso rows (with a beer belly) + 10 leg rows starting at BODY_Y. Torso
// centre is column 8 (HERO_W - 9 when mirrored); the gun barrel stays on frame row 18
// (torso row 9). Palette: J/j jacket, w/W shirt, s skin, P/p jeans, F/f/D/d black clogs.
const HERO_W = 23, HERO_H = 32, HEAD_X = 3, BODY_Y = 9;
const HERO_TORSO = [
  "......JwwJ", "....JJJwwJJJ", "....JjJwwwJJJ", "...JJjJwwwwJJ", "...JJjJwwwwJJ", "...JJjJwwwwwJ",
  "...JJjJwwwwwJ", "...JJjJwwwwwJ", "...JJjJwwwwWJ", "...JJjJwwwwWJjsVvvvvvvv", "...JJjJwwwWJJ...gGgggk",
  "...sJJJwwWJJ.....Gg.G", "....JJJJJJJJ",
];
const HERO_TORSO_SHOOT = HERO_TORSO.slice();
HERO_TORSO_SHOOT[9] = "...JJjJwwwwWjjjsVvvvvvv";
HERO_TORSO_SHOOT[10] = "...JJjJwwwWJJ....gGgggk";
HERO_TORSO_SHOOT[11] = "...sJJJwwWJJ......Gg.G";
// Holding the disc cutter (boss arena): motor + handle, 7 px steel disc under an orange guard.
const HERO_TORSO_CUTTER = [
  "......JwwJ",
  "....JJJwwJJJ",
  "....JjJwwwJJJ..ooooooo",
  "...JJjJwwwwJJ.o.VVVVV.o",
  "...JJjJwwwwJJ..VvvvvvV",
  "...JJjJwwwwwJ.VvvvWvvvV",
  "...JJjJwwwwwJ.VvvWvWvvV",
  "...JJjJwwwwwJsVvWvkvWvV",
  "...JJjJwwwwWJjVvvWvWvvV",
  "...JJjJwwwwWJ.VvvvWvvvV",
  "...JJjJwwwWJJ..VvvvvvV",
  "...sJJJwwWJJ....VVVVV",
  "....JJJJJJJJ",
];
const HERO_TORSO_HURT = [
  "..s...JwwJ...s", "..J.JJJwwJJJ.J", "..JJJjJwwwJJJJ", "....JjJwwwwJJ", "....JjJwwwwJJ", "....JjJwwwwwJ",
  "....JjJwwwwwJ", "....JjJwwwwwJ", "....JjJwwwwWJ", "....JjJwwwwWJ", "....JjJwwwWJJ", "....JJJwwWJJ",
  "....JJJJJJJJ",
];
const HERO_TORSO_CLIMB = [
  ["..s...JJJJ", "..J.JJJJJJJJ.s", "..JJJJJJJJJJJJ"],
  ["......JJJJ...s", "..s.JJJJJJJJ.J", "..JJJJJJJJJJJJ"],
].map(function (top) {
  return top.concat(["....JjJJJJjJ", "....JjJJJJjJJ", "....JjJJJJjJJ", "....JjJJJJjJJ", "....JjJJJJjJJ",
    "....JjJJJJjJ", "....JjJJJJjJ", "....JJJJJJJJ", "....JJJJJJJJ", "....JJJJJJJJ"]);
});
// Legs: 7 rows of jeans + 3 rows of black clogs (upper F/f, sole D/d,
// toe to the right). Lifted feet use a tilted clog.
const LEGS = {
  idle: ["....PPPPPPPP", "....PPPPpPPP", "....PPP..PPP", "....PPP..PPP", "....PPp..PPp", "....PPP..PPP",
    "....PpP..PpP", "...FFf...FFf", "...FFFFf.FFFFf", "...dDDDD.dDDDD"],
  run1: ["....PPPPPPPP", "...PPPP.PPPP", "..PPPP...PPPP", "..PPP.....PPPP", ".PPp.......PPP", ".PPp........PPp",
    "FFf.........PPP", "dFFF........FFf", ".dDD.......FFFFf", "...........dDDDD"],
  run2: ["....PPPPPPPP", "....PPPPPPPP", ".....PPPPPP", ".....PPPPP", ".....PPpPP", "......PPPP",
    "......PPpP", "......FFFf", ".....FFFFFf", ".....dDDDDD"],
  run3: ["....PPPPPPPP", "...PPPP.PPPP", "...PPP...PPP", "..PPP.....PPP", "..PPp......PPp", ".PPP........PPP",
    ".PpP........FFf", ".FFf.......dFFFF", "FFFFf.......dDD", "dDDDD"],
  jump: ["....PPPPPPPP", "....PPPPPPPPP", "....PPPPPPPPPP", ".....PPp..PPPP", ".....PPP...FFf", ".....FFf..FFFFf",
    "....FFFFf.dDDDD", "....dDDDD", "", ""],
  climb1: ["....PPPPPPPP", "....PPPP.PPP", "....PPP..PPP", "....PPP..PPP", "....PPP..FFF", "....PPP..dDD",
    "....PPP", "....FFF", "....FFF", "....dDD"],
  climb2: ["....PPPPPPPP", "....PPP.PPPP", "....PPP..PPP", "....PPP..PPP", "....FFF..PPP", "....dDD..PPP",
    ".........PPP", ".........FFF", ".........FFF", ".........dDD"],
};

// Kneeling (hitbox 16 px): head and torso drawn KNEEL_DROP px lower, two belly rows and the
// waist row taken out so the gun row lands 6 px above the feet (the kneeling shot height),
// and 3 rows of legs: the back knee and clog on the ground, the front leg bent forward.
const KNEEL_DROP = 10;
function kneelTorso(t) { return t.filter(function (r, i) { return i !== 4 && i !== 5 && i !== 12; }); }
const LEGS_KNEEL = ["....PPPPPPPPPPPp", "..FPPPPp.....PPP", "dDDDPPP.....FFFFf"];

function padRows(rows, w) { return rows.map(function (r) { return r.length < w ? r + ".".repeat(w - r.length) : r; }); }
function setCh(rows, y, x, ch) { rows[y] = rows[y].slice(0, x) + ch + rows[y].slice(x + 1); }

function rgbHex(c, k) {
  k = k || 1;
  return "#" + c.map(function (v) { return Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, "0"); }).join("");
}
// Hero palette: jacket and shirt sampled from the photo by the build (ASSETS_META).
function heroPalette() {
  const hp = (typeof ASSETS_META !== "undefined" && ASSETS_META.heroPalette) || {};
  return Object.assign({}, PAL, {
    J: hp.jacket ? rgbHex(hp.jacket) : PAL.J, j: hp.jacket ? rgbHex(hp.jacket, 1.4) : PAL.j,
    w: hp.shirt ? rgbHex(hp.shirt) : PAL.w,
    F: "#141414", f: "#2e2e2e", D: "#3c3c3c", d: "#262626",   // black clogs
  });
}

function buildHeroFrame(torso, legs, back, drop) {
  drop = drop || 0;
  const c = makeCanvas(HERO_W, HERO_H);
  const g = c.getContext("2d");
  g.drawImage(spriteFromRows(padRows(torso.concat(legs), HERO_W), heroPalette()), 0, BODY_Y + drop);
  g.drawImage(back ? SPR.headBack : IMG.head, HEAD_X, drop);
  return makeSet(c);
}

// Draws the in-game head centred in a 16x16 box (HUD lives, extra life, reel card).
function drawHead(g, x, y) {
  g.drawImage(IMG.head, x + Math.floor((16 - IMG.head.width) / 2), y + Math.max(0, Math.floor((16 - IMG.head.height) / 2)));
}

function buildHeadBack() {
  // back of the head: same silhouette, all hair (used while climbing)
  const w = IMG.head.width, h = IMG.head.height;
  const c = makeCanvas(w, h);
  const g = c.getContext("2d");
  g.drawImage(IMG.head, 0, 0);
  const data = g.getImageData(0, 0, w, h);
  const hairA = data.data.slice((5 * w + 1) * 4, (5 * w + 1) * 4 + 3);   // template 'H'
  const hairB = data.data.slice((5 * w + 2) * 4, (5 * w + 2) * 4 + 3);   // template 'h'
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (data.data[i + 3] === 0) continue;
    const src = (x + (y >> 2)) % 3 === 0 ? hairB : hairA;
    data.data[i] = src[0]; data.data[i + 1] = src[1]; data.data[i + 2] = src[2];
  }
  g.putImageData(data, 0, 0);
  return c;
}

// ---------------- enemies ----------------
const LAWYER_TOP = [
  ".....hhhhh......", "....hhhhhhh.....", "....hhkkskk.....", "....hsSSkSSk....",
  "....ssssssss....", "....sskwwwwk....", ".....skkkks.....", "......sSs.......",
  "...nnnwtwnnn....", "..nnnnwtwnnnn...", "..nnnnwtwnnnn...", "..nnnnwttnnnn...",
  "..nNnnwttnnnNn..", "..nNnnntnnnnNn..", "..nNnnnnnnnnNn..", ".BBBBnnnnnnnNs..",
  ".BbbBnnnnnnnn...", ".BbbBNNNNNNNN...",
];
const LAWYER_THROW_TOP = LAWYER_TOP.slice();
LAWYER_THROW_TOP[12] = "..nNnnwttnnnnnss";
LAWYER_THROW_TOP[13] = "..nNnnntnnnnn...";
LAWYER_THROW_TOP[14] = "..nNnnnnnnnnn...";
LAWYER_THROW_TOP[15] = ".BBBBnnnnnnnn...";
const LAWYER_LEGS1 = [
  ".BBBBnnnn.nnnn..", ".....nnnn.nnnn..", ".....nnnn.nnnn..", ".....nnnn.nnnn..",
  ".....nnnn.nnnn..", ".....nnnn.nnnn..", ".....NnnN.NnnN..", ".....nnnn.nnnn..",
  ".....nnnn.nnnn..", ".....nnnn.nnnn..", ".....kkkk.kkkk..", "....kkkkk.kkkkk.",
];
const LAWYER_LEGS2 = [
  ".BBBBnnnn.nnnn..", "....nnnn...nnnn.", "....nnnn...nnnn.", "...nnnn.....nnnn",
  "...nnnn.....nnnn", "...nnnn.....nnnn", "...NnnN.....NnnN", "...nnnn.....nnnn",
  "...nnnn.....nnnn", "...nnnn.....nnnn", "...kkkk.....kkkk", "..kkkkk.....kkkk",
];
const BRIEFCASE = [
  "...kkkk...", "..k....k..", "BBBBBBBBBB", "BbbbbbbbbB",
  "BbbbybbbbB", "BbbbbbbbbB", "BbbbbbbbbB", "BBBBBBBBBB",
];
// Crayfish, 32x14, side view facing right, after the reference photo: red only - glossy
// red-brown armour (a base, A shadow, x lit edges, i sheen), overlapping tail plates and a
// tail fan, carapace with cervical groove, eye, antennae, heavy claw with pale tips (E).
const CRAY1 = [
  "............................AAAA", ".........................AAA....", "......................AAA...AA..",
  "............xxxxx...AA..AAAA....", "A.........xxiiaiixxkkxAA........", "AA..xxxxxxiaaaAaaaaxxxx.........",
  "AxxxaAiAaAaaaaAaaaaaaxxxxxxE....", "AaaAaAaAaAaaaaAaaaaaaaiaaaaE....", "AaaAaAaAaAaaaaAaaaaAAaai........",
  "AaAAaAaAaAaaaaaaaAA.AaaaaaEE....", "AA..AAAAAAAAAAAAA....AAAAAA.....", "A......A..A..A..A.A.............",
  "......A....AA....A..............", "......A....AA....A..............",
];
const CRAY2 = [
  "............................AAAA", ".........................AAA....", "......................AAA...AA..",
  "............xxxxx...AA..AAAA....", "A.........xxiiaiixxkkxAA........", "AA..xxxxxxiaaaAaaaaxxxx.........",
  "AxxxaAiAaAaaaaAaaaaaaxxxxxxE....", "AaaAaAaAaAaaaaAaaaaaaaiaaaaE....", "AaaAaAaAaAaaaaAaaaaAAaai........",
  "AaAAaAaAaAaaaaaaaAA.AaaaaaEE....", "AA..AAAAAAAAAAAAA....AAAAAA.....", "A......A..A..A..A.A.............",
  "........AA....AA...A............", "........AA....AA...A............",
];
// Gardener-punk with lawn mower: 30x30 frame, punk on the left (facing right), mower in
// front joined by the handle. Mohawk, studded leather vest, ripped jeans, blunt (B + ember o).
const PUNK_TOP = [
  "......l", ".....lll", ".....lml", "....lmmml", "...Sssss", "...sssks", "...ssssss", "...ssskkBBo",
  "....sssss", ".....ss", "...kkkkkk", "..kkvkkvkk", "..skkkkkkss", "..sskvkkkss", "...kkkkkkk..gg",
  "...kkvkkvk...gg", "...PPPPPPP....gg", "...PPsPPPP.....gg", "...PPPPPPP......gg",
];
const PUNK_LEGS = [
  ["...PPPPPPP.....", "...PPP.PPP.....", "...PsP.PPP.....", "...PPP.PsP.....", "...PPP.PPP.....", "...PPP.PPP.....",
   "...PPP.PPP.....", "...PPP.PPP.....", "..kkkk.kkkk....", "..kkkk.kkkk....", "..bbbbb.bbbbb.."],
  ["...PPPPPPP.....", "..PPP...PPP....", "..PsP...PPP....", "..PPP....PsP...", ".PPP.....PPP...", ".PPP......PPP..",
   ".PPP......PPP..", ".PPP......PPP..", "kkkk.....kkkk..", "kkkk.....kkkk..", "bbbbb....bbbbb."],
];
// Petrol lawn mower (15x11, in front of the punk): pull-start grip (k) on the push bar,
// red fuel tank with black cap, finned engine block (G/v), black muffler with a rusty
// exhaust opening (O) at the back, red deck, spoked wheels.
const MOWER = [
  "..gk...........",
  "...g..RRRk.....",
  "....gGRrrRG....",
  ".kk.GvGvGvGvG..",
  ".kOkGvGvGvGvGG.",
  "..RRRRRRRRRRRR.",
  ".RrrrrrOrrrrrrR",
  "..kkk.....kkk..",
  ".kkvkk...kkvkk.",
  ".kkkkk...kkkkk.",
  "..kkk.....kkk..",
];
const MOWER2 = MOWER.slice();
MOWER2[8] = ".kvkkk...kvkkk.";
// exhaust opening in punk-frame coordinates (frame 30x30, mower rows start at x 15, y 19)
const MOWER_EXHAUST = { x: 15 + 2, y: 19 + 4 };
function punkFrame(legs, mower) {
  const top = padRows(PUNK_TOP, 30);
  return top.concat(legs.map(function (l, i) { return l + mower[i]; }));
}
const PUNK_WALK1 = punkFrame(PUNK_LEGS[0], MOWER);
const PUNK_WALK2 = punkFrame(PUNK_LEGS[1], MOWER2);
// rev: mower body lifted 1 px (shaking), wheels stay down
const PUNK_REV = punkFrame(PUNK_LEGS[0], MOWER.slice(1, 7).concat([MOWER[6]], MOWER.slice(7)).slice(0, 11));

// ---------------- pickups ----------------
const TENNIS_BALL = ["..qqqq..", ".qqqqqq.", "qwqqqqqq", "qqwwqqqq", "qqqqwwqq", "qqqqqqwq", ".QqqqqQ.", "..QQQQ.."];
const TROPHY = [
  "..yyyyyyyy..", "yyyyyyyyyyyy", "y.yyyyyyyy.y", "y.yyyyyyyy.y", ".yyyyyyyyyy.", "..yyyyyyyy..",
  "...oyyyyo...", ".....yy.....", ".....yy.....", "....oyyo....", "...yyyyyy...", "..oooooooo..",
  "..okkkkkko..", "..oooooooo..",
];
const RIVELLA = [
  "..rr..", "..vv..", "..vo..", ".vooo.", "vooooo", "vooooo", "rrrrrr",
  "rwwwwr", "rrrrrr", "vooooo", "vooooo", "vooooo", "vooooo", ".vvvv.",
];
const CERVELAT = [
  "...CCCCCCCC...", ".CCccccccccCC.", "ecccwccccwccce", "ecccccccccccce", ".CCccccccccCC.", "...CCCCCCCC...",
];
const KEYCARD = [
  "kkkkkkkkkk", "kXXXXXXXXk", "kXwwXXXXXk", "kXwwXXkkXk", "kXXXXXkkXk", "kXXXXXXXXk", "kXXXXXXXXk", "kkkkkkkkkk",
];
const MEGAGUN = [
  "................", "..vvvvvvvvvvvv..", ".vuuuuuuuuuuuuvy", ".vvvvvvvvvvvvvv.",
  "..VVk...........", "..VVk...........", "..VV............", "................",
];
const BLASTER_ICON = ["..........", ".vvvvvvvy.", ".vggggggk.", "..Gk......", "..Gk......"];
const CUTTER_ICON = ["...ooo....", "..oVVVV...", "ggVvWvvV..", "GgVWkWvV..", "..VvvvV..."];
const MEGA_ICON = ["..........", "vvvvvvvvvy", "vuuuuuuuuv", "vvvvvvvvv.", ".VVk......"];
const KEY_COLORS = { R: "#e02828", U: "#2878f0", G: "#28c040" };

// grindhouse details on enemies
PAL.Y = "#a8e050";   // crayfish slime
PAL.O = "#8a4a1a";   // rust
// punk: rust on the mower deck, grass stains on the blades
PUNK_WALK1[24] = PUNK_WALK1[24].slice(0, 18) + "O" + PUNK_WALK1[24].slice(19);
PUNK_WALK2[24] = PUNK_WALK2[24].slice(0, 24) + "O" + PUNK_WALK2[24].slice(25);

// Spinning saw blade for the disc cutter: 14x14 steel disc with 8 hooked teeth, hub and
// a rust stain; frame f rotates the teeth by f * 1/32 turn (4 frames = one tooth step).
function buildSawBlade(f) {
  const c = makeCanvas(14, 14), g = c.getContext("2d");
  const rot = f * Math.PI / 16;
  for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) {
    const dx = x + 0.5 - 7, dy = y + 0.5 - 7, r = Math.sqrt(dx * dx + dy * dy);
    let a = Math.atan2(dy, dx) - rot; a = ((a % (Math.PI / 4)) + Math.PI / 4) % (Math.PI / 4);   // angle within a tooth
    const tooth = a < Math.PI / 10;
    let col = null;
    if (r <= 1.6) col = "#3a404e";                                  // hub
    else if (r <= 4.6) col = (Math.floor((Math.atan2(dy, dx) - rot) * 2) % 2) ? "#b8c0cc" : "#8890a0";   // brushed steel
    else if (r <= 5.6) col = "#e8ecf4";                             // bright rim
    else if (r <= 7 && tooth) col = "#f4f4f8";                      // teeth
    else if (r <= 6.2) col = "#6c7484";
    if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
  }
  g.fillStyle = "#8a4a1a"; g.fillRect(9, 4, 1, 1); g.fillRect(4, 9, 1, 1);   // rust
  g.fillStyle = "#101018"; g.fillRect(6, 6, 2, 2);                          // arbor hole
  return c;
}

function buildSprites() {
  SPR.headBack = buildHeadBack();
  SPR.hero = {
    idle: buildHeroFrame(HERO_TORSO, LEGS.idle),
    run: [LEGS.run1, LEGS.run2, LEGS.run3, LEGS.run2].map(function (l) { return buildHeroFrame(HERO_TORSO, l); }),
    jump: buildHeroFrame(HERO_TORSO, LEGS.jump),
    shoot: buildHeroFrame(HERO_TORSO_SHOOT, LEGS.idle),
    shootRun: [LEGS.run1, LEGS.run2, LEGS.run3, LEGS.run2].map(function (l) { return buildHeroFrame(HERO_TORSO_SHOOT, l); }),
    shootJump: buildHeroFrame(HERO_TORSO_SHOOT, LEGS.jump),
    hurt: buildHeroFrame(HERO_TORSO_HURT, LEGS.jump),
    climb: [buildHeroFrame(HERO_TORSO_CLIMB[0], LEGS.climb1, true), buildHeroFrame(HERO_TORSO_CLIMB[1], LEGS.climb2, true)],
    kneel: buildHeroFrame(kneelTorso(HERO_TORSO), LEGS_KNEEL, false, KNEEL_DROP),
    kneelShoot: buildHeroFrame(kneelTorso(HERO_TORSO_SHOOT), LEGS_KNEEL, false, KNEEL_DROP),
  };
  SPR.heroCutter = Object.assign({}, SPR.hero, {
    idle: buildHeroFrame(HERO_TORSO_CUTTER, LEGS.idle),
    run: [LEGS.run1, LEGS.run2, LEGS.run3, LEGS.run2].map(function (l) { return buildHeroFrame(HERO_TORSO_CUTTER, l); }),
    jump: buildHeroFrame(HERO_TORSO_CUTTER, LEGS.jump),
    kneel: buildHeroFrame(kneelTorso(HERO_TORSO_CUTTER), LEGS_KNEEL, false, KNEEL_DROP),
  });
  SPR.heroCutter.kneelShoot = SPR.heroCutter.kneel;
  SPR.heroCutter.shoot = SPR.heroCutter.idle; SPR.heroCutter.shootRun = SPR.heroCutter.run; SPR.heroCutter.shootJump = SPR.heroCutter.jump;
  SPR.cutterIcon = spriteFromRows(CUTTER_ICON);
  SPR.lawyer = [makeSet(spriteFromRows(LAWYER_TOP.concat(LAWYER_LEGS1))), makeSet(spriteFromRows(LAWYER_TOP.concat(LAWYER_LEGS2)))];
  SPR.lawyerThrow = makeSet(spriteFromRows(LAWYER_THROW_TOP.concat(LAWYER_LEGS1)));
  SPR.briefcase = makeSet(spriteFromRows(BRIEFCASE));
  SPR.cray = [makeSet(spriteFromRows(CRAY1)), makeSet(spriteFromRows(CRAY2))];
  SPR.punk = { walk: [makeSet(spriteFromRows(PUNK_WALK1)), makeSet(spriteFromRows(PUNK_WALK2))], rev: makeSet(spriteFromRows(PUNK_REV)) };
  SPR.ball = shadeAndOutline(spriteFromRows(TENNIS_BALL));
  SPR.trophy = shadeAndOutline(spriteFromRows(TROPHY));
  SPR.rivella = shadeAndOutline(spriteFromRows(RIVELLA));
  SPR.cervelat = shadeAndOutline(spriteFromRows(CERVELAT));
  SPR.megagun = shadeAndOutline(spriteFromRows(MEGAGUN));
  SPR.blasterIcon = spriteFromRows(BLASTER_ICON);
  SPR.megaIcon = spriteFromRows(MEGA_ICON);
  SPR.keys = {}; SPR.keysHud = {};
  Object.keys(KEY_COLORS).forEach(function (k) {
    const pal = Object.assign({}, PAL, { X: KEY_COLORS[k] });
    SPR.keysHud[k] = spriteFromRows(KEYCARD, pal);
    SPR.keys[k] = shadeAndOutline(SPR.keysHud[k]);
  });
  // extra life: hero head with a gold frame
  const life = makeCanvas(18, 18);
  const lg = life.getContext("2d");
  lg.fillStyle = PAL.y; lg.fillRect(0, 0, 18, 18);
  lg.fillStyle = PAL.k; lg.fillRect(1, 1, 16, 16);
  drawHead(lg, 1, 1);
  SPR.life = life;
  // hero shots
  SPR.shot = spriteFromRows(["..yyyy", "wwwwyy", "..yyyy"], Object.assign({}, PAL, { y: "#ffe860" }));
  SPR.shotUp = spriteFromRows(["..uuuuu.", ".uwwwwuu", "uwwwwwwu", ".uuuuuu."]);
  SPR.sawBlade = [0, 1, 2, 3].map(buildSawBlade);
  if (typeof buildFanSprites === "function") buildFanSprites();
  SPR.bubble = spriteFromRows(["..uuuu..", ".u....u.", "u.ww...u", "u.w....u", "u......u", "u......u", ".u....u.", "..uuuu.."],
    Object.assign({}, PAL, { u: "#9ad0ff", w: "#ffffff" }));
}
