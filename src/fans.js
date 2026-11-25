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
// The mofa ride's two groups (map e: environmental activists, ]: rocker chicks), 6 looks each.
const FAN_VARIANTS_ACTIVIST = [
  { style: "activist", hair: "long", hairCol: "brown", skin: "light", accent: "yellow", top: "parka", item: "flower", sign: "nocar" },
  { style: "activist", hair: "afro", hairCol: "black", skin: "dark", accent: "orange", top: "poncho", item: "headband", sign: "leaf" },
  { style: "activist", hair: "pigtails", hairCol: "blonde", skin: "light", accent: "pink", top: "parka", item: "headband", sign: "globe" },
  { style: "activist", hair: "curly", hairCol: "red", skin: "tan", accent: "purple", top: "poncho", item: "flower", sign: "nocar" },
  { style: "activist", hair: "bob", hairCol: "auburn", skin: "brown", accent: "teal", top: "parka", item: "flower", sign: "leaf" },
  { style: "activist", hair: "bun", hairCol: "ash", skin: "light", accent: "red", top: "poncho", item: "headband", sign: "globe" },
];
const FAN_VARIANTS_ROCKER = [
  { style: "rocker", hair: "teased", hairCol: "black", skin: "light", accent: "red", item: "sunglasses" },
  { style: "rocker", hair: "teased", hairCol: "blonde", skin: "tan", accent: "purple", item: "bandana" },
  { style: "rocker", hair: "long", hairCol: "red", skin: "light", accent: "yellow", item: "choker" },
  { style: "rocker", hair: "curly", hairCol: "black", skin: "dark", accent: "pink", item: "sunglasses" },
  { style: "rocker", hair: "teased", hairCol: "auburn", skin: "brown", accent: "green", item: "choker" },
  { style: "rocker", hair: "bob", hairCol: "ash", skin: "tan", accent: "blue", item: "bandana" },
];
// The president's posh lady friends (the limo finale on the ride; never among the background fans):
// big hats, sunglasses, pearls, dresses; frames stand, climb (half out of the car door), scold (finger wagging).
const FAN_VARIANTS_POSH = [
  { style: "posh", hair: "bob", hairCol: "blonde", skin: "light", accent: "pink", item: "sunglasses",
    hat: "#e070a0", band: "#c04080", dress: "#e070a0", dress2: "#c04080", belt: "#f8f8f0", bag: "#f8f8f0" },
  { style: "posh", hair: "long", hairCol: "black", skin: "light", accent: "pink", item: "sunglasses",
    hat: "#f4f0e8", band: "#101010", dress: "#f4f0e8", dress2: "#c8c4bc", belt: "#2a2a40", bag: "#2a2a40" },
];
const POSH_FRAMES = ["stand", "climb", "scold"];
const FAN_VARIANTS_BY_STYLE = { tennis: FAN_VARIANTS, activist: FAN_VARIANTS_ACTIVIST, rocker: FAN_VARIANTS_ROCKER };
const FAN_STYLE_BY_CH = { F: "tennis", e: "activist", "]": "rocker" };
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
// The ride's groups: activists cheer every posh car that goes up in smoke, rockers the ride.
const FAN_LINES_ACTIVIST = {
  shout: ["BIKES NOT SUVS!", "SAVE THE LAKE! ♥", "PEDAL POWER, BUCK!", "CLIMATE HERO? ♥", "SMASH THE SUVS!", "PLANET B? NOPE!",
    "GREEN IS SEXY! ♥", "STOP THE DIESEL!"],
  kill: ["ONE SUV LESS! ♥", "EMISSIONS DOWN!", "THAT'S ACTIVISM!", "CO2 GOES BOOM!"],
  trophy: ["ECO CHAMPION! ♥", "RECYCLE THAT CUP!", "GREEN GOLD, BUCK!"],
  checkpoint: ["STAY GREEN, BUCK!", "SAVE ME TOO! ♥", "PROTEST ON!"],
};
const FAN_LINES_ROCKER = {
  shout: ["BORN TO RIDE! ♥", "NICE WHEELS, BABY!", "ROCK 'N' ROLL!", "HELL YEAH, BUCK!", "TAKE ME FOR A RIDE", "LOUD AND PROUD! ♥",
    "RIDE IT, TIGER!"],
  kill: ["BURN, BABY, BURN!", "HELL YEAH! ♥", "WRECK 'EM, BUCK!", "HEAVY METAL!"],
  trophy: ["ROCK STAR! ♥", "SHINY! GIMME!", "ENCORE, BUCK!"],
  checkpoint: ["KEEP ROLLING! ♥", "SEE YA AT THE BAR!", "DON'T STOP NOW!"],
};
const FAN_LINES_BY_STYLE = { tennis: FAN_LINES, activist: FAN_LINES_ACTIVIST, rocker: FAN_LINES_ROCKER };
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
  const WHITE = "#f4f4f0", SHADE = "#d4d4d0", cheer = frame === "wave" || frame === "jump" || frame === "scold", kiss = frame === "kiss";
  const style = v.style || "tennis";
  const lg = frame === "jump" ? 1 : 0;              // legs tucked a little when jumping
  let sleeve = skin, cuff = acc;                    // arm colour, wristband / cuff
  if (style === "activist") {                       // 70s protest: parka or poncho, flared jeans, sandals
    const DENIM = "#3a5a9a", DENIM2 = "#2a4278";
    const TOP = v.top === "poncho" ? "#b0783a" : "#5a7a32", TOP2 = v.top === "poncho" ? "#8a5a28" : "#425a24";
    P(DENIM, 4, 15, 8, 3); P(DENIM, 4, 18, 3, 6 - lg); P(DENIM, 9, 18, 3, 6 - lg);
    P(DENIM, 3, 23 - lg, 4, 2); P(DENIM, 9, 23 - lg, 4, 2); P(DENIM2, 6, 18, 1, 5 - lg); P(DENIM2, 9, 18, 1, 5 - lg);   // bell-bottoms
    P("#6a4a2a", 4, 25 - lg, 3, 1); P("#6a4a2a", 9, 25 - lg, 3, 1); P(skin, 4, 26 - lg, 3, 1); P(skin, 9, 26 - lg, 3, 1);   // sandals
    if (v.top === "poncho") { P(TOP, 2, 10, 12, 4); P(TOP, 3, 14, 10, 2); for (let x = 2; x < 14; x += 3) P(TOP2, x, 12, 1, 3); P(acc, 2, 13, 12, 1); }
    else { P(TOP, 3, 10, 10, 6); P(TOP2, 7, 10, 1, 6); P(TOP2, 4, 9, 8, 1); P("#c8c0a0", 4, 12, 2, 1); }      // parka: zip, hood, badge
    sleeve = TOP; cuff = TOP2;
  } else if (style === "rocker") {                  // leather jacket over a band tee, leather mini, fishnets, boots
    const LEATHER = "#1c1a20", STUD = "#d8d8d0", BOOT = "#0e0c10";
    P(LEATHER, 4, 15, 8, 3); P(STUD, 5, 15); P(STUD, 10, 15);
    P(skin, 5, 18, 2, 4 - lg); P(skin, 9, 18, 2, 4 - lg);
    P("#3a2a2a", 5, 19); P("#3a2a2a", 6, 20); P("#3a2a2a", 9, 19); P("#3a2a2a", 10, 20);                    // fishnets
    P(BOOT, 4, 22 - lg, 3, 5); P(BOOT, 9, 22 - lg, 3, 5); P(STUD, 5, 23 - lg); P(STUD, 10, 23 - lg);
    P(LEATHER, 3, 10, 10, 5); P(acc, 6, 10, 4, 5); P(WHITE, 7, 12, 2, 1); P("#101010", 7, 13, 2, 1);          // band tee with a skull
    P(STUD, 3, 10); P(STUD, 12, 10); P(STUD, 3, 12); P(STUD, 12, 12);
    sleeve = LEATHER; cuff = STUD;
  } else if (style === "posh") {                    // knee-length dress with a belt, bare legs, high heels
    const HEEL = "#101010";
    P(v.dress, 4, 10, 8, 5); P(v.dress2, 4, 14, 8, 1); P(v.belt, 4, 15, 8, 1);
    P(v.dress, 3, 16, 10, 6); P(v.dress2, 3, 21, 10, 1); for (let x = 4; x < 13; x += 3) P(v.dress2, x, 17, 1, 4);
    P(skin, 5, 22, 2, 3); P(skin, 9, 22, 2, 3);                               // legs
    P(HEEL, 4, 25, 3, 1); P(HEEL, 9, 25, 3, 1); P(HEEL, 4, 26); P(HEEL, 9, 26);
    sleeve = v.dress; cuff = v.dress2;
  } else {
    // legs, socks with a stripe, sneakers
    P(skin, 5, 19, 2, 5 - lg); P(skin, 9, 19, 2, 5 - lg);
    P(WHITE, 5, 23 - lg, 2, 2); P(WHITE, 9, 23 - lg, 2, 2); P(acc, 5, 23 - lg, 2, 1); P(acc, 9, 23 - lg, 2, 1);
    P(WHITE, 4, 25 - lg, 3, 2); P(WHITE, 9, 25 - lg, 3, 2); P("#9aa0a8", 4, 26 - lg, 3, 1); P("#9aa0a8", 9, 26 - lg, 3, 1);
    // tennis dress: top with a coloured collar, pleated skirt with a waist stripe
    P(WHITE, 4, 10, 8, 5); P(acc, 6, 10, 4, 1); P(SHADE, 4, 14, 8, 1);
    P(WHITE, 3, 15, 10, 4); P(acc, 3, 15, 10, 1); P(SHADE, 3, 18, 10, 1);
    for (let x = 4; x < 13; x += 2) P(SHADE, x, 16, 1, 2);
  }
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
    case "teased": P(hair, 3, 0, 9, 1); P(hair, 2, 1, 11, 3); P(hair, 1, 3, 4, 7); P(hair, 11, 3, 2, 3); P(hair, 2, 10, 2, 1); break;   // big rock hair
  }
  if (style === "posh") {                           // a big wide-brimmed hat with a band, pearls at the neck
    P(v.hat, 1, 2, 14, 1); P(v.hat, 4, 0, 8, 2); P(v.band, 4, 1, 8, 1);
    P("#f8f8f0", 6, 9, 4, 1); P("#d8d8d0", 7, 9);
  }
  if (v.item === "flower") { P(acc, 4, 2, 2, 2); P("#f0e040", 4, 2); }
  if (v.item === "bandana") { P(acc, 4, 2, 7, 1); P(acc, 3, 3, 2, 2); }
  if (v.item === "choker") P("#101010", 7, 9, 2, 1);
  if (v.item === "headband") P(acc, 5, 3, 6, 1);
  if (v.item === "visor") { P(acc, 5, 3, 6, 1); P(acc, 11, 3, 2, 1); }
  if (v.item === "cap") { P(acc, 4, 1, 7, 2); P(acc, 11, 2, 3, 1); }
  if (v.item === "sunglasses" && !kiss) P("#101018", 8, 5, 3, 1);
  // arms (2 px wide) with wristbands: down at the sides, or raised up and out in a V
  function armDown(x) { P(sleeve, x, 10, 1, 6); P(cuff, x, 14); return { x: x, y: 16 }; }
  function armUp(dir) {            // dir 1 = front (right), -1 = back (left)
    const pts = dir > 0 ? [[12, 10], [13, 9], [13, 8], [14, 7], [14, 6], [15, 5]] : [[3, 10], [2, 9], [2, 8], [1, 7], [1, 6], [0, 5]];
    pts.forEach(function (q) { P(sleeve, q[0], q[1], 1, 1); P(sleeve, q[0] - dir, q[1], 1, 1); });
    P(cuff, pts[3][0], pts[3][1]); P(cuff, pts[3][0] - dir, pts[3][1]);
    return { x: pts[5][0], y: pts[5][1] - 1 };
  }
  function armToLips() {           // front arm bent up, hand at the mouth
    [[12, 10], [12, 9], [12, 8], [11, 7]].forEach(function (q) { P(sleeve, q[0], q[1], 1, 1); });
    P(cuff, 12, 9);
    return { x: 11, y: 6 };
  }
  const posh = style === "posh";
  function armScold() {            // front forearm raised, index finger up, wagging at Buck
    [[12, 10], [13, 9], [13, 8], [13, 7]].forEach(function (q) { P(sleeve, q[0], q[1], 1, 1); });
    P(cuff, 13, 7); P(skin, 13, 5, 1, 1);
    return { x: 13, y: 6 };
  }
  const hand = posh && frame === "scold" ? armScold() : frame === "idle" || posh ? armDown(12) : kiss ? armToLips() : armUp(1);
  const backHand = frame === "jump" ? armUp(-1) : armDown(3);
  P(skin, hand.x, hand.y); P(skin, backHand.x, backHand.y);
  if (posh && frame !== "climb") P(v.bag, backHand.x - 1, backHand.y + 1, 3, 2);   // a little handbag
  if (posh && frame === "climb") g.clearRect(0, FAN_H - 10, FAN_W, 10);           // the legs are still in the car
  const up = cheer;
  if (style === "activist" && !kiss) {                 // protest sign on a stick, beside her face: crossed-out car, leaf or globe
    const bx = 12, by = up ? Math.max(-oy, hand.y - 7) : 1;
    P("#8a6a3a", 14, by + 6, 1, Math.max(1, hand.y - by - 6));
    P("#efe4c0", bx, by, 6, 6);
    if (v.sign === "nocar") {
      P("#303030", bx + 1, by + 3, 4, 1); P("#303030", bx + 2, by + 2, 2, 1);
      for (let k = 0; k < 6; k++) P("#d02020", bx + k, by + k);
    } else if (v.sign === "leaf") { P("#30a030", bx + 2, by + 1, 3, 4); P("#30a030", bx + 1, by + 2, 1, 2); P("#1e6e1e", bx + 3, by + 1, 1, 4); }
    else { P("#2a6ad0", bx + 1, by + 1, 4, 4); P("#40b040", bx + 2, by + 2, 2, 2); P("#40b040", bx + 4, by + 1, 1, 1); }
  }
  if (style === "rocker" && up) {                      // devil horns: index and little finger up
    P(skin, hand.x - 1, hand.y - 2, 1, 2); P(skin, hand.x + 1, hand.y - 2, 1, 2);
  }
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
  function sets(list) {
    return list.map(function (v) {
      const set = {};
      FAN_FRAMES.forEach(function (f) { set[f] = makeSet(buildFanFrame(v, f)); });
      return set;
    });
  }
  SPR.fans = sets(FAN_VARIANTS);                     // tennis fans (every level except the ride)
  SPR.fansBy = { tennis: SPR.fans, activist: sets(FAN_VARIANTS_ACTIVIST), rocker: sets(FAN_VARIANTS_ROCKER) };
  SPR.fansBy.posh = FAN_VARIANTS_POSH.map(function (v) {             // the limo finale's ladies (src/ride.js)
    const set = {};
    POSH_FRAMES.forEach(function (f) { set[f] = makeSet(buildFanFrame(v, f)); });
    return set;
  });
}

// ---- behaviour: idle cheer, face Buck, react to his successes ----
// Comic speech bubble (fans and lawyers): cream box with a dark outline at (x, y), w x h, red
// text, and a tail pointing down at screen x tx.
function drawSpeechBubble(text, x, y, w, h, tx) {
  fillRect(x - 1, y - 1, w + 2, h + 2, "#101018");                 // outline
  fillRect(x, y, w, h, "#fffbe8");
  tx = clamp(tx, x + 3, x + w - 4);
  fillRect(tx - 1, y + h, 3, 1, "#fffbe8"); fillRect(tx, y + h + 1, 1, 1, "#fffbe8");   // tail
  fillRect(tx - 2, y + h, 1, 1, "#101018"); fillRect(tx + 2, y + h, 1, 1, "#101018"); fillRect(tx - 1, y + h + 1, 1, 1, "#101018"); fillRect(tx + 1, y + h + 1, 1, 1, "#101018"); fillRect(tx, y + h + 2, 1, 1, "#101018");
  drawText(text, x + 3, y + 2, "#c01818");
}

const Fans = {
  list: [], lastCheer: -99, lastWhistle: -99, time: 0, hearts: [], decks: {}, shown: [],
  spawn(level, levelIndex) {
    this.list = []; this.lastCheer = -99; this.lastWhistle = -99; this.time = 0; this.hearts = []; this.decks = {}; this.shown = [];
    const self = this;
    const count = { tennis: 0, activist: 0, rocker: 0 };
    level.spawns.filter(function (s) { return FAN_STYLE_BY_CH[s.ch]; }).forEach(function (s, i) {
      const style = FAN_STYLE_BY_CH[s.ch], n = count[style]++;
      const variant = style === "tennis" ? (levelIndex * 5 + n) % FAN_VARIANTS.length : n % FAN_VARIANTS_BY_STYLE[style].length;
      self.list.push({ tx: s.tx, ty: s.ty, x: s.tx * TILE + TILE / 2 - FAN_W / 2, y: (s.ty + 1) * TILE - (FAN_H - 1), style: style,
        variant: variant, face: -1, phase: i * 0.37, cheerT: 0, bubble: null, shoutT: 0, kissT: 0 });
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
  pickLine(kind, style) {
    const lines = FAN_LINES_BY_STYLE[style || "tennis"] || FAN_LINES;
    const pool = lines[kind] || lines.kill;
    kind = (style || "tennis") + ":" + kind;             // one deck per group and occasion
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
  say(f, kind) { f.bubble = { text: this.pickLine(kind, f.style), t: FAN_BUBBLE_T, kind: kind }; },
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
    const out = [], cars = typeof Talk !== "undefined" ? Talk.rects(camX, camY) : [];   // keep clear of the drivers' bubbles
    for (const f of talk) {
      if (out.length >= FAN_MAX_BUBBLES) break;
      const w = textWidth(f.bubble.text) + 6, h = 11;
      const fx = Math.round(f.x + FAN_W / 2 - camX);
      const y0 = Math.round(f.y - camY + HUD_H) - h - 2;
      const free = function (x, y) {
        return x >= 2 && x + w <= W - 2 && out.concat(cars).every(function (r) { return x + w + 2 <= r.x || r.x + r.w + 2 <= x || y + h + 3 <= r.y || r.y + r.h + 3 <= y; });
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
    for (const b of this.layoutBubbles(camX, camY)) drawSpeechBubble(b.text, b.x, b.y, b.w, b.h, b.tx);
  },
  draw(camX, camY) {
    for (const f of this.list) {
      const set = (SPR.fansBy ? SPR.fansBy[f.style || "tennis"] : SPR.fans)[f.variant][this.frame(f)];
      const hop = f.cheerT > 0 ? Math.round(Math.abs(Math.sin(f.cheerT * Math.PI * 3)) * 3) : 0;
      const px = Math.round(f.x - camX) - set.pad, py = Math.round(f.y - camY + HUD_H - hop) - set.pad;
      if (px < -FAN_W - 4 || px > W + 4) continue;
      ctx.drawImage(f.face > 0 ? set.r : set.l, px, py);
    }
  },
};

