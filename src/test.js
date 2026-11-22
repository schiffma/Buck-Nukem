// Automated scenario tests, run in the real game code. Open dist/buck_nukem.html#test
// (or run tools/run_tests.py, which does this in headless Chrome/Edge). Results are
// written into <pre id="test-out"> and the page title ("TESTS PASS n/n").
const TEST = { results: [], warns: [], errors: [] };
(function hookConsole() {
  const w = console.warn, e = console.error;
  console.warn = function () { TEST.warns.push(Array.prototype.join.call(arguments, " ")); w.apply(console, arguments); };
  console.error = function () { TEST.errors.push(Array.prototype.join.call(arguments, " ")); e.apply(console, arguments); };
  window.addEventListener("error", function (ev) { TEST.errors.push(ev.message); });
})();

function runTests() {
  const R = TEST.results;
  function check(name, cond, info) { R.push({ name: name, ok: !!cond, info: info === undefined ? "" : String(info) }); }
  function steps(n, each) { for (let i = 0; i < n; i++) { Game.update(DT); Input.endStep(); if (each) each(i); } }
  function press(a) { Input.simulate(a, true); }
  function release(a) { Input.simulate(a, false); }
  function tap(a) { press(a); steps(1); release(a); }
  function grid(w, h, items) {
    const g = [];
    for (let y = 0; y < h; y++) g.push(new Array(w).fill("."));
    for (let x = 0; x < w; x++) { g[h - 2][x] = "#"; g[h - 1][x] = "#"; }
    (items || []).forEach(function (it) { g[it[1]][it[0]] = it[2]; });
    return g.map(function (r) { return r.join(""); });
  }
  function load(rows, extra) {
    Input.reset();
    Game.godMode = false;
    Game.score = 0;
    Player.resetForGame();
    Game.loadLevel(0, Object.assign({ name: "TEST", theme: "court", bg: "bg_court", map: rows }, extra || {}));
    Game.setState(Game.level.isBoss ? STATE.BOSS : STATE.PLAY);
    steps(20);                      // settle on the ground
  }
  const sounds = [], allSounds = {};
  Sound.onPlay = function (n) { sounds.push(n); allSounds[n] = true; };
  function safe(name, fn) {
    try { fn(); } catch (ex) { check(name + " (exception)", false, ex.stack || ex); }
  }

  // ---------------- rendering / engine ----------------
  safe("display", function () {
    const s = Math.max(1, Math.floor(Math.min(window.innerWidth / W, window.innerHeight / H)));
    check("display: integer scale fits window", screenCanvas.width === W * s && screenCanvas.height === H * s,
      "window " + window.innerWidth + "x" + window.innerHeight + " -> canvas " + screenCanvas.width + "x" + screenCanvas.height);
    check("display: back buffer is 320x240", buffer.width === 320 && buffer.height === 240);
    check("display: smoothing disabled", ctx.imageSmoothingEnabled === false && screenCtx.imageSmoothingEnabled === false);
  });

  safe("timestep", function () {
    function simulate(hz) {
      const real = Game.update.bind(Game);
      let n = 0;
      Game.update = function (dt) { n++; real(dt); };
      Game.headless = true; Game.setState(STATE.TITLE);
      lastTime = 0; acc = 0;
      for (let i = 0; i <= hz; i++) frame(1000 + i * 1000 / hz);
      Game.update = real;
      return n;
    }
    const n60 = simulate(60), n144 = simulate(144), n30 = simulate(30);
    check("timestep: 60 updates/s at 60, 144 and 30 Hz", Math.abs(n60 - 60) <= 1 && Math.abs(n144 - 60) <= 1 && Math.abs(n30 - 60) <= 1,
      "60Hz:" + n60 + " 144Hz:" + n144 + " 30Hz:" + n30);
  });

  safe("input", function () {
    const ev1 = new KeyboardEvent("keydown", { code: "Space", key: " ", cancelable: true });
    window.dispatchEvent(ev1);
    const ev2 = new KeyboardEvent("keyup", { code: "AltLeft", key: "Alt", cancelable: true });
    window.dispatchEvent(ev2);
    const ev3 = new KeyboardEvent("keydown", { code: "ArrowDown", key: "ArrowDown", cancelable: true });
    window.dispatchEvent(ev3);
    check("input: Space/Alt/arrows have default action prevented", ev1.defaultPrevented && ev2.defaultPrevented && ev3.defaultPrevented);
    window.dispatchEvent(new KeyboardEvent("keyup", { code: "Space", cancelable: true }));
    window.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowDown", cancelable: true }));
    Input.reset();
  });

  safe("font", function () {
    ctx.clearRect(0, 0, W, H);
    drawText(FONT_CHARS, 0, 0, "#fff");
    const d = ctx.getImageData(0, 0, W, 8).data;
    let lit = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) lit++;
    check("font: full character set renders", FONT_CHARS.length >= 50 && lit > 300, FONT_CHARS.length + " glyphs, " + lit + " px");
  });

  safe("outlines", function () {
    function edgesOutlined(c) {
      const w = c.width, h = c.height, d = c.getContext("2d").getImageData(0, 0, w, h).data;
      function a(x, y) { return x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3]; }
      function isOutline(i) { return d[i] === OUTLINE_COLOR[0] && d[i + 1] === OUTLINE_COLOR[1] && d[i + 2] === OUTLINE_COLOR[2]; }
      let bad = 0, outl = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (!d[i + 3]) continue;
        if (isOutline(i)) { outl++; continue; }
        if (!a(x - 1, y) || !a(x + 1, y) || !a(x, y - 1) || !a(x, y + 1)) bad++;
      }
      return bad === 0 && outl > 10;
    }
    const sets = [SPR.hero.idle, SPR.hero.run[1], SPR.hero.climb[0], SPR.hero.hurt, SPR.lawyer[0], SPR.lawyerThrow, SPR.cray[0], SPR.cray[1], SPR.heroCutter.idle, SPR.heroCutter.run[1], SPR.heroCutter.jump].concat(
      SPR.fans.reduce(function (a, f) { return a.concat([f.idle, f.wave, f.jump]); }, [])).concat([SPR.punk.walk[0], SPR.punk.walk[1], SPR.punk.rev, SPR.briefcase]);
    check("sprites: hero and enemy edge pixels all border a dark outline", sets.every(function (s) { return edgesOutlined(s.r) && edgesOutlined(s.l); }));
    // 3 tones: the lawyer's suit colour appears as base, highlight and shadow
    (function () {
      const d = SPR.lawyer[0].r.getContext("2d").getImageData(0, 0, SPR.lawyer[0].r.width, SPR.lawyer[0].r.height).data;
      const base = [0x5a, 0x62, 0x72];
      const hi = base.map(function (c, i) { return Math.round(Math.min(255, c * (i === 2 ? 1.2 : 1.25) + (i === 2 ? 14 : 18))); });
      const sh = base.map(function (c, i) { return Math.round(c * (i === 2 ? 0.72 : 0.68)); });
      function has(col) { for (let i = 0; i < d.length; i += 4) if (d[i + 3] && Math.abs(d[i] - col[0]) <= 1 && Math.abs(d[i + 1] - col[1]) <= 1 && Math.abs(d[i + 2] - col[2]) <= 1) return true; return false; }
      check("sprites: 3-tone shading (base, highlight, shadow)", has(base) && has(hi) && has(sh), [has(base), has(hi), has(sh)].join(","));
    })();
    check("sprites: padded by 1 px with logical size kept", SPR.lawyer[0].pad === 1 && SPR.lawyer[0].r.width === SPR.lawyer[0].w + 2);
  });

  safe("crayfish look", function () {
    // red only: no blue-dominant pixel in either frame
    function blueish(set) {
      const img = set.r, d = img.getContext("2d").getImageData(0, 0, img.width, img.height).data;
      let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 3] && d[i + 2] > d[i] + 20) n++;
      return n;
    }
    const b0 = blueish(SPR.cray[0]), b1 = blueish(SPR.cray[1]);
    check("crayfish: red only (no blue pixels)", b0 === 0 && b1 === 0, b0 + "/" + b1);
    // anatomy, read from the pixel rows (facing right; the head is at the right)
    const R = CRAY1, at = function (x, y) { return (R[y] || "")[x] || "."; };
    let bodyMin = 99, bodyMax = -1;
    for (let x = 0; x < R[0].length; x++) for (let y = 4; y <= 10; y++) if (at(x, y) !== ".") { bodyMin = Math.min(bodyMin, x); bodyMax = Math.max(bodyMax, x); }
    let headX = -1; for (let x = 0; x < R[0].length; x++) for (let y = 0; y < R.length; y++) if (at(x, y) === "k") headX = Math.max(headX, x);
    const bodyLen = headX - bodyMin + 1;
    let seams = 0;                      // dark plate seams across the tail (columns left of the carapace)
    for (let x = 2; x < Math.floor(bodyLen / 2); x++) { let dark = 0; for (let y = 6; y <= 9; y++) if (at(x, y) === "A") dark++; if (dark >= 3) seams++; }
    let fan = 0; for (let y = 0; y < R.length; y++) if (at(0, y) !== ".") fan++;
    let clawLen = 0; for (let x = headX + 1; x < R[0].length; x++) { let c = 0; for (let y = 6; y <= 10; y++) if (at(x, y) !== ".") c++; if (c >= 2) clawLen++; }
    let tips = 0; R.forEach(function (r) { tips += (r.match(/E/g) || []).length; });
    let legs = 0; for (let x = 0; x < R[0].length; x++) if (at(x, 12) !== "." || at(x, 13) !== ".") legs++;
    let antMaxX = -1; for (let x = headX; x < R[0].length; x++) for (let y = 0; y <= 3; y++) if (at(x, y) === "A") antMaxX = Math.max(antMaxX, x);
    check("crayfish: segmented tail with a tail fan", seams >= 3 && fan >= 6, "seams " + seams + ", fan " + fan);
    check("crayfish: big front claw with pale tips", clawLen >= bodyLen / 4 && tips >= 2, "claw " + clawLen + "/" + bodyLen + ", tips " + tips);
    check("crayfish: thin legs below the body", legs >= 4 && legs <= 12, legs);
    check("crayfish: antennae reach forward at least half the body length", antMaxX - headX >= bodyLen / 2, "reach " + (antMaxX - headX) + ", body " + bodyLen);
    // no glow: a crayfish on screen for 1 s emits no glow particles
    load(grid(40, 12, [[2, 9, "P"], [20, 9, "K"]]));
    FX.clear(); Game.godMode = true;
    let glowSeen = false;
    steps(60, function () { if (FX.parts.some(function (p) { return p.glow; })) glowSeen = true; });
    Game.godMode = false;
    check("crayfish: no glow particles (realistic, no mutant effects)", !glowSeen && typeof FX.glow === "undefined");
    check("crayfish: hitbox, health and speed unchanged", ENEMY_TYPES.cray.w === 20 && ENEMY_TYPES.cray.h === 10 && CONFIG.crayHp === 2 && CONFIG.craySpeed === 40);
  });

  safe("boss look", function () {
    Player.resetForGame(); Game.loadLevel(3); Game.setState(STATE.BOSS);
    steps(30); Boss.flash = 0; Game.render();
    const L = bossLayers();
    const d = L.g.getImageData(0, 0, W, H).data;
    let bossPx = 0, blue = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i + 3]) { bossPx++; if (d[i + 2] > d[i] + 20) blue++; }
    // no glow effects: drawn alone on magenta, every pixel the boss touches is its outlined
    // body (the outline test below checks the edges), and no glow drawing remains
    check("boss: no helix or molecule glow around the boss", typeof Boss.drawGlow === "undefined" && !FX.parts.some(function (p) { return p.glow; }));
    check("boss: red only (no blue pixels on the body)", bossPx > 3000 && blue === 0, "body px " + bossPx + ", blue " + blue);
  });

  safe("petrol mower look", function () {
    const rows = MOWER.join("");
    const has = function (re) { return re.test(rows); };
    check("mower: petrol engine block, fuel tank with cap, muffler and wheels",
      has(/GvGvG/) && /RRR/.test(MOWER[1]) && MOWER[1].indexOf("k") > MOWER[1].indexOf("R") && MOWER[4].charAt(MOWER_EXHAUST.x - 15) === "O" &&
      /kk/.test(MOWER[3].slice(0, 4)) && MOWER.slice(7).every(function (r) { return /k/.test(r); }), MOWER.join("|"));
    const T = ENEMY_TYPES.punk;
    check("mower: punk gameplay values unchanged", T.w === 24 && T.h === 28 && T.contact === 2 && CONFIG.punkHp === 5 && CONFIG.punkSpeed === 24 &&
      CONFIG.punkChargeSpeed === 110 && CONFIG.punkRange === 96 && CONFIG.punkChargeMax === 128 && CONFIG.punkRev === 0.5 && CONFIG.punkCooldown === 2.0);
  });

  safe("fan sprites", function () {
    const keys = FAN_VARIANTS.map(function (v) { return [v.hair, v.hairCol, v.skin, v.accent, v.item].join("/"); });
    const distinct = keys.filter(function (k, i) { return keys.indexOf(k) === i; }).length;
    check("fans: at least 6 distinct looks", distinct >= 6 && SPR.fans.length === FAN_VARIANTS.length, distinct + " looks");
    let framesDiffer = true;
    SPR.fans.forEach(function (f) {
      const a = f.idle.r.getContext("2d").getImageData(0, 0, f.idle.r.width, f.idle.r.height).data;
      const b = f.wave.r.getContext("2d").getImageData(0, 0, f.wave.r.width, f.wave.r.height).data;
      let d = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
      if (d < 20) framesDiffer = false;
    });
    check("fans: idle and wave frames differ for every look", framesDiffer);
  });

  safe("worn tiles", function () {
    const ts = buildTileset("court");
    const rows = [];
    for (let ty = 0; ty < 40; ty++) rows.push(ty);
    rows.forEach(function (ty, i) {
      rows[i] = (function () {
      const seen = {}; for (let tx = 0; tx < 10; tx++) seen[tileVariant(tx, ty)] = true; return Object.keys(seen).length;
      })();
    });
    function differ(a, b) {
      const da = a.getContext("2d").getImageData(0, 0, 16, 16).data, db = b.getContext("2d").getImageData(0, 0, 16, 16).data;
      let n = 0; for (let i = 0; i < da.length; i += 4) if (da[i] !== db[i]) n++; return n;
    }
    check("tiles: a row of 10 identical solid tiles uses at least 2 worn variants", rows.every(function (n) { return n >= 2; }), rows.join(","));
    check("tiles: worn variants look different", differ(ts.solid[0], ts.solid[1]) > 4 && differ(ts.solid[0], ts.solid[2]) > 4 && ts.alt.length === 3 && ts.plat.length === 3);
  });

  safe("hero sprite", function () {
    // proportions: head rows 0..heroHeadRows-1 above the body, body >= 20 rows
    const headRows = ASSETS_META.heroHeadRows;
    check("hero: head at most 9 of 32 rows, body at least 23 rows",
      headRows <= 9 && BODY_Y <= headRows && HERO_H - BODY_Y >= 23 && IMG.head.height <= 12,
      "head " + headRows + " rows, body " + (HERO_H - BODY_Y) + " rows");
    // every frame: no pixel of the head layer below the head (other than shoulder hair at the sides)
    // -> checked on the frame canvases: the torso starts at BODY_Y in all pose definitions
    const torsos = [HERO_TORSO, HERO_TORSO_SHOOT, HERO_TORSO_HURT, HERO_TORSO_CLIMB[0], HERO_TORSO_CLIMB[1]];
    const legSets = Object.keys(LEGS).map(function (k) { return LEGS[k]; });
    check("hero: every pose has a 13-row torso and 10-row legs (body fills rows 9-31)",
      torsos.every(function (t) { return t.length === 13; }) && legSets.every(function (l) { return l.length === 10; }) && BODY_Y + 23 === HERO_H);
    // belly: torso at least 3 px wider at belly height than at the shoulders
    function width(r) { const m = r.slice(0, 15).replace(/\.+$/, ""); return m.length - (m.length - m.replace(/^\.+/, "").length); }
    const shoulders = width(HERO_TORSO[1]), belly = Math.max.apply(null, HERO_TORSO.slice(4, 9).map(width));
    check("hero: slight belly, 1-2 px wider than the shoulders", belly - shoulders >= 1 && belly - shoulders <= 2, "shoulders " + shoulders + ", belly " + belly);
    // clogs: wood (D/d) and leather (F/f) in the bottom 3 non-empty rows of every pose with feet
    const noClogs = Object.keys(LEGS).filter(function (k) {
      const rows = LEGS[k].filter(function (r) { return r.replace(/\./g, "").length; });
      const bottom = rows.slice(-3).join("");
      return !(/[Dd]/.test(bottom) && /[Ff]/.test(bottom));
    });
    const hpal = heroPalette();
    const lumHex = function (h) { return (parseInt(h.slice(1, 3), 16) + parseInt(h.slice(3, 5), 16) + parseInt(h.slice(5, 7), 16)) / 3; };
    const black = ["F", "f", "D", "d"].every(function (k) { return lumHex(hpal[k]) < 70; });
    check("hero: black clogs (upper + sole) in every pose", noClogs.length === 0 && black, noClogs.join(",") + " black " + black);
    // face colours: every head pixel is a sampled photo colour or a fixed feature colour
    const hp = ASSETS_META.heroPalette, fixed = ASSETS_META.heroFixed;
    const allowed = ["hair_light", "hair_dark", "skin_light", "skin_shadow", "lens", "moustache", "stubble"]
      .map(function (k) { return hp[k]; }).concat(Object.keys(fixed).map(function (k) { return fixed[k]; }));
    const c = makeCanvas(IMG.head.width, IMG.head.height); c.getContext("2d").drawImage(IMG.head, 0, 0);
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    let bad = 0, used = {};
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const k = allowed.findIndex(function (a) { return a[0] === d[i] && a[1] === d[i + 1] && a[2] === d[i + 2]; });
      if (k < 0) bad++; else used[k] = true;
    }
    check("hero: every head pixel uses a colour sampled from the photo or a fixed feature colour",
      bad === 0 && Object.keys(used).length >= 9, bad + " foreign pixels, " + Object.keys(used).length + " colours used");
    function lum(c) { return (c[0] + c[1] + c[2]) / 3; }
    check("hero: photo palette relations (hair lighter than jacket, skin warmer than lens, moustache lighter than skin)",
      lum(hp.hair_light) > lum(hp.jacket) + 40 && (hp.skin_light[0] - hp.skin_light[2]) > (hp.lens[0] - hp.lens[2]) + 30 &&
      lum(hp.moustache) > lum(hp.skin_light));
    // features present in the head: lens, moustache, both hair tones, cigar ember
    const need = ["lens", "moustache", "hair_light", "hair_dark"].map(function (k) { return hp[k]; }).concat([fixed.o, fixed.L]);
    const missing = need.filter(function (a) {
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] && a[0] === d[i] && a[1] === d[i + 1] && a[2] === d[i + 2]) return false;
      return true;
    });
    check("hero: shades, glint, moustache, long hair and cigar ember visible", missing.length === 0, missing.length + " missing");
    // long hair reaches the shoulders: hair pixels below the head rows
    let shoulderHair = 0;
    for (let y = ASSETS_META.heroHeadRows; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      if (d[i + 3]) shoulderHair++;
    }
    check("hero: long hair falls onto the shoulders", shoulderHair >= 6, shoulderHair + " px");
    // jacket colour from the photo is used on the body
    const jx = SPR.hero.idle.r.getContext("2d").getImageData(0, 0, SPR.hero.idle.r.width, SPR.hero.idle.r.height).data;
    let jacket = 0;
    for (let i = 0; i < jx.length; i += 4) if (jx[i] === hp.jacket[0] && jx[i + 1] === hp.jacket[1] && jx[i + 2] === hp.jacket[2]) jacket++;
    check("hero: jacket uses the photo's jacket colour", jacket > 20, jacket + " px");
    // gameplay unchanged: shots still spawn at gun height (14 px below the hitbox top)
    load(grid(40, 12, [[2, 9, "P"]]));
    Player.face = 1; Game.shots = []; Player.fire();
    const sh = Game.shots[0];
    check("hero: shot height unchanged (hitbox top + 14)", Math.abs(sh.y + sh.h / 2 - (Player.y + 14)) <= 1 && Player.w === 10 && Player.h === 28);
    // title portrait unchanged
    check("hero: title/end screens still use the 96x96 photo portrait", IMG.portrait.width === 96 && IMG.portrait.height === 96);
  });

  safe("sprites", function () {
    check("sprites: all sprite rows have consistent width", TEST.warns.filter(function (w) { return w.indexOf("sprite row") >= 0; }).length === 0,
      TEST.warns.join(" | "));
    check("sprites: hero frames 23x32 (big gun) with mirrored variant", SPR.hero.idle.w === HERO_W && HERO_W === 23 && SPR.hero.idle.h === 32 && SPR.hero.idle.r.width === 25 && SPR.hero.run.length === 4);
    check("sprites: photo assets decoded", IMG.head && IMG.head.width === 10 && IMG.head.height === 12 && IMG.portrait.width === 96 && IMG.bg_court.width === 480);
  });

  // ---------------- camera / parallax ----------------
  safe("camera", function () {
    load(grid(60, 30, [[2, 27, "P"]]));
    Camera.x = -500; Camera.y = -500; Camera.clamp(Game.level);
    const okLow = Camera.x === 0 && Camera.y === 0;
    Camera.x = 99999; Camera.y = 99999; Camera.clamp(Game.level);
    const okHigh = Camera.x === 60 * 16 - W && Camera.y === 30 * 16 - VIEW_H;
    check("camera: clamped to level bounds", okLow && okHigh);
    // parallax: background moves slower than the camera
    const strip = Game.level.bgStrip.width;
    const bgShift = (100 * 0.3) % strip;
    check("parallax: 100px camera scroll moves background < 100px", bgShift < 100 && bgShift > 0, bgShift);
  });

  // ---------------- player movement ----------------
  safe("walls", function () {
    load(grid(30, 12, [[10, 9, "#"], [10, 8, "#"], [2, 9, "P"]]));
    press("right"); steps(120); release("right");
    check("movement: walking stops at a wall", Player.x + Player.w <= 160.01, "x+w=" + (Player.x + Player.w));
  });

  safe("jump", function () {
    load(grid(30, 12, [[2, 9, "P"]]));
    sounds.length = 0;
    press("jump"); steps(1); release("jump");
    steps(8);
    tap("jump"); steps(5);
    check("jump: no additional jump in mid-air", sounds.filter(function (s) { return s === "jump"; }).length === 1, sounds.join(","));
    steps(60);
    // full vs short jump
    function apex(holdSteps) {
      steps(30);
      const y0 = Player.y; let minY = y0;
      press("jump");
      for (let i = 0; i < 80; i++) {
        if (i === holdSteps) release("jump");
        steps(1); minY = Math.min(minY, Player.y);
      }
      release("jump");
      return y0 - minY;
    }
    const full = apex(80), short = apex(4);
    check("jump: releasing early gives a lower jump", short < full * 0.7 && full > 40, "full=" + full.toFixed(1) + " short=" + short.toFixed(1));
  });

  safe("ctrl fires", function () {
    ["ControlLeft", "ControlRight"].forEach(function (code) {
      load(grid(60, 12, [[2, 9, "P"]]));
      Game.stats.shots = 0; sounds.length = 0;
      const y0 = Player.y;
      const ev = new KeyboardEvent("keydown", { code: code, key: "Control", ctrlKey: true, cancelable: true });
      window.dispatchEvent(ev);
      let minY = Player.y;
      steps(20, function () { minY = Math.min(minY, Player.y); });
      window.dispatchEvent(new KeyboardEvent("keyup", { code: code, key: "Control", cancelable: true }));
      check("controls: " + code + " fires (default prevented)", Game.stats.shots >= 1 && ev.defaultPrevented, "shots " + Game.stats.shots);
      check("controls: " + code + " does not jump", minY === y0 && sounds.indexOf("jump") < 0, "y0 " + y0 + " minY " + minY);
      Input.reset();
    });
  });

  safe("title controls", function () {
    const txt = TITLE_CONTROLS.map(function (l) { return l.join(" "); }).join("|");
    check("title: controls list shows SPACE jump and X/CTRL/ALT fire",
      txt.indexOf("SPACE JUMP") >= 0 && txt.indexOf("X/CTRL/ALT FIRE") >= 0 && txt.indexOf("CTRL JUMP") < 0, txt);
    check("title: controls list shows F fullscreen", txt.indexOf("F FULLSCREEN") >= 0, txt);
  });

  safe("ladder", function () {
    const items = [[2, 9, "P"]];
    for (let y = 4; y <= 9; y++) items.push([5, y, "H"]);
    for (let x = 6; x < 12; x++) items.push([x, 4, "="]);
    load(grid(30, 12, items));
    Player.x = 5 * 16 + 3;
    steps(5);
    press("up"); steps(150); release("up");
    const top = Player.y + Player.h;
    steps(30);
    check("ladder: climbing up reaches the ladder top", Math.abs(top - 64) < 2, "feet at " + top);
    check("ladder: hero stands on top after climbing", Math.abs(Player.y + Player.h - 64) < 2 && !Player.climbing,
      "feet " + (Player.y + Player.h) + " climbing " + Player.climbing + " onGround " + Player.onGround);
    press("down"); steps(60); release("down");
    check("ladder: climbing down works", Player.y + Player.h > 100, "feet at " + (Player.y + Player.h));
  });

  // ---------------- shooting ----------------
  safe("ladder firing", function () {
    // a ladder from the floor up through a ledge; Buck starts at its foot
    const items = [[3, 9, "P"]]; for (let y = 3; y < 10; y++) items.push([10, y, "H"]);
    for (let x = 6; x < 16; x++) if (x !== 10) items.push([x, 3, "#"]);
    function atLadder(seq) {
      load(grid(40, 12, items)); Game.godMode = true;
      Player.x = 10 * 16 + 3; steps(5);
      seq.forEach(function (st) { st[0].forEach(press); steps(st[1]); st[0].forEach(release); });
    }
    atLadder([[["up"], 30]]);
    const y0 = Player.y, x0 = Player.x, on0 = Player.climbing;
    tap("left"); steps(2); const faceL = Player.face;
    tap("right"); steps(2); const faceR = Player.face;
    check("ladder: Left/Right turn Buck without leaving the ladder", on0 && Player.climbing && faceL === -1 && faceR === 1 && Player.y === y0 && Player.x === x0,
      "climbing " + Player.climbing + " face " + faceL + "/" + faceR + " dy " + (Player.y - y0));
    const cases = { "climbing up": [[["up", "fire"], 30]], "stopped halfway": [[["up"], 30], [["fire"], 30]], "after a short Up tap": [[["up"], 5], [["fire"], 30]] };
    const res = [];
    Object.keys(cases).forEach(function (k) {
      atLadder([]); Game.stats.shots = 0; Player.fireCd = 0;
      cases[k].forEach(function (st) { st[0].forEach(press); steps(st[1]); st[0].forEach(release); });
      res.push(k + ": " + Game.stats.shots + " shots, climbing " + Player.climbing);
      if (!(Game.stats.shots >= 2 && Player.climbing)) res.ok = false;
    });
    check("ladder: Buck fires on a ladder (climbing, stopped, after a short Up tap) and stays on it", res.ok !== false, res.join("; "));
    atLadder([[["up"], 20]]); tap("left"); Game.shots.length = 0; press("fire"); steps(3); release("fire");
    check("ladder: shots go the way Buck faces on the ladder", Game.shots.length > 0 && Game.shots[0].vx < 0);
    // pressed against a 1-tile wall: the shot hits the wall, nothing flies on behind it
    const wall = [[5, 9, "P"]]; for (let y = 0; y < 10; y++) wall.push([8, y, "B"]);
    load(grid(40, 12, wall)); Game.godMode = true; Player.face = 1; Player.x = 8 * 16 - Player.w - 0.5; steps(2);
    Game.shots.length = 0; FX.parts.length = 0; Player.fireCd = 0; Player.fire(); steps(10);
    const behind = Game.shots.some(function (sh) { return sh.x > 9 * 16; });
    check("shooting: pressed against a wall, the shot hits it (sparks) and never appears behind it", !behind && Game.shots.length === 0 && FX.parts.length > 0,
      "shots " + Game.shots.length + ", sparks " + FX.parts.length);
    Player.x = 8 * 16 - Player.w - 34; steps(2); Game.shots.length = 0; Player.fireCd = 0; Player.fire();
    const made = Game.shots.length === 1; steps(20);
    check("shooting: 2 tiles from a wall a shot is fired and stops at the wall", made && Game.shots.length === 0);
    Game.godMode = false; Input.reset();
  });

  safe("firing everywhere", function () {
    // regression: holding Fire for 0.5 s must create shots in every situation
    const lad = [[5, 9, "P"]]; for (let y = 4; y < 10; y++) lad.push([8, y, "H"]);
    const cases = {
      "standing": { map: [[5, 9, "P"]] },
      "running": { map: [[5, 9, "P"]], hold: ["right"] },
      "jump + run": { map: [[5, 9, "P"]], hold: ["jump", "right"] },
      "on a ladder": { map: lad, setup: function () { Player.x = 8 * 16 + 3; }, hold: ["up"] },
      "after being hit": { map: [[5, 9, "P"]], setup: function () { Game.godMode = false; Player.invuln = 0; Player.hurt(1); Game.godMode = true; } },
      "next to a fan": { map: [[5, 9, "P"], [7, 9, "F"]] },
    };
    const res = []; let ok = true;
    Object.keys(cases).forEach(function (k) {
      const c = cases[k];
      load(grid(60, 12, c.map)); Game.godMode = true; Game.stats.shots = 0;
      if (c.setup) c.setup();
      (c.hold || []).forEach(press); press("fire"); steps(30); Input.reset();
      res.push(k + " " + Game.stats.shots); if (Game.stats.shots < 2) ok = false;
    });
    Player.resetForGame(); Game.loadLevel(3); Game.setState(STATE.BOSS); Game.godMode = true; Game.stats.shots = 0;
    press("fire"); steps(30); Input.reset();
    res.push("disc cutter " + Game.stats.shots); if (Game.stats.shots < 1) ok = false;
    Game.godMode = false;
    check("firing: shots are fired in every situation (standing, running, jumping, ladder, hurt, fan, cutter)", ok, res.join(", "));
  });

  safe("fullscreen", function () {
    // stub the Fullscreen and Keyboard Lock APIs (headless Chrome can't really go fullscreen)
    const de = document.documentElement, calls = [];
    let fsEl = null;
    const realReq = de.requestFullscreen, realExit = document.exitFullscreen;
    const fsDesc = Object.getOwnPropertyDescriptor(Document.prototype, "fullscreenElement");
    const kbDesc = Object.getOwnPropertyDescriptor(Navigator.prototype, "keyboard");
    Object.defineProperty(document, "fullscreenElement", { configurable: true, get: function () { return fsEl; } });
    de.requestFullscreen = function () { calls.push("request"); fsEl = de; document.dispatchEvent(new Event("fullscreenchange")); return Promise.resolve(); };
    document.exitFullscreen = function () { calls.push("exit"); fsEl = null; document.dispatchEvent(new Event("fullscreenchange")); return Promise.resolve(); };
    const sync = { then: function (ok) { ok(); } };       // resolves at once, so the test stays synchronous
    function setKeyboard(kb) { Object.defineProperty(navigator, "keyboard", { configurable: true, get: function () { return kb; } }); }
    setKeyboard({ lock: function (codes) { calls.push("lock:" + codes.join("+")); return sync; }, unlock: function () { calls.push("unlock"); } });
    function key(code, type) { window.dispatchEvent(new KeyboardEvent(type || "keydown", { code: code, key: code })); }
    try {
      Fullscreen.noteT = 0;
      key("KeyF"); key("KeyF", "keyup");
      check("fullscreen: F requests fullscreen and locks exactly the Windows keys", calls[0] === "request" && calls[1] === "lock:MetaLeft+MetaRight" && Fullscreen.isFull(), calls.join(","));
      check("fullscreen: note says the Windows key is locked", Fullscreen.noteT > 0 && Fullscreen.note === "WINDOWS KEY LOCKED", Fullscreen.note);
      // Windows key while locked: held fire stays held, the game keeps firing
      load(grid(40, 12, [[5, 9, "P"]])); Game.godMode = true;
      key("KeyX"); Game.stats.shots = 0;
      key("MetaLeft"); steps(10); key("MetaLeft", "keyup"); steps(20);
      const held = Input.down("fire"), shots = Game.stats.shots;
      key("KeyX", "keyup"); Game.godMode = false;
      check("fullscreen: the Windows key leaves held fire alone and firing continues", held && shots >= 2, "held " + held + ", shots " + shots);
      calls.length = 0;
      key("KeyF"); key("KeyF", "keyup");
      check("fullscreen: F again leaves fullscreen and unlocks the keys", calls[0] === "exit" && calls[1] === "unlock" && !Fullscreen.isFull(), calls.join(","));
      // a browser without Keyboard Lock: fullscreen still works, the note says so
      setKeyboard(undefined); calls.length = 0;
      key("KeyF"); key("KeyF", "keyup");
      check("fullscreen: without Keyboard Lock it still goes fullscreen and says the key can't be locked",
        calls[0] === "request" && Fullscreen.note === "FULLSCREEN (WINDOWS KEY NOT LOCKABLE HERE)", Fullscreen.note);
      document.exitFullscreen();
      Game.render();                     // note drawing smoke test
    } finally {
      delete document.fullscreenElement; if (fsDesc) Object.defineProperty(Document.prototype, "fullscreenElement", fsDesc);
      delete navigator.keyboard; if (kbDesc) Object.defineProperty(Navigator.prototype, "keyboard", kbDesc);
      de.requestFullscreen = realReq; document.exitFullscreen = realExit;
      Fullscreen.noteT = 0; Input.reset();
    }
  });

  safe("firerate", function () {
    load(grid(100, 12, [[2, 9, "P"]]));
    Game.stats.shots = 0; sounds.length = 0;
    press("fire"); steps(60); release("fire");
    check("shooting: fire rate limited to " + CONFIG.fireRate + "/s", Game.stats.shots <= CONFIG.fireRate && Game.stats.shots >= CONFIG.fireRate - 1, Game.stats.shots);
    check("sound: shot sound plays when firing", sounds.indexOf("shot") >= 0);
    steps(120);
    check("shooting: projectiles removed after leaving the screen", Game.shots.length === 0, Game.shots.length);
  });

  safe("shot hits enemy", function () {
    load(grid(40, 12, [[2, 9, "P"], [9, 9, "L"]]));
    Game.godMode = true;
    const e = Game.enemies[0];
    Player.face = 1;
    tap("fire");
    let flashed = false;
    steps(40, function () { if (e.flash > 0) flashed = true; });
    check("shooting: shot damages enemy and disappears", e.hp === CONFIG.lawyerHp - 1 && flashed, "hp=" + e.hp);
  });

  safe("powerup", function () {
    load(grid(40, 12, [[2, 9, "P"], [4, 9, "w"]]));
    press("right"); steps(40); release("right");
    check("power-up: collected, weapon upgraded", Player.weapon === "mega");
    Player.fire();
    const s = Game.shots[Game.shots.length - 1];
    check("power-up: upgraded shots deal more damage and are faster", s.dmg === CONFIG.shotDmgUp && Math.abs(s.vx) > CONFIG.shotSpeed);
    Player.hp = 0; Player.die(); steps(100);
    check("power-up: lost when losing a life", Player.weapon === "blaster" && Player.lives === CONFIG.startLives - 1);
  });

  // ---------------- health / lives ----------------
  safe("damage", function () {
    load(grid(40, 12, [[2, 9, "P"]]));
    function hitShot() { Game.enemyShots.push({ kind: "briefcase", x: Player.x, y: Player.y + 5, w: 10, h: 8, vx: 0, vy: 0, grav: 0, dmg: 1 }); }
    hitShot(); steps(1);
    const hp1 = Player.hp, inv = Player.invuln;
    Game.enemyShots = []; hitShot(); steps(1);
    const hp2 = Player.hp;
    Game.enemyShots = []; steps(62); hitShot(); steps(1);
    check("damage: hit costs health and starts ~1s invulnerability", hp1 === 7 && inv > 0.9 && hp2 === 7 && Player.hp === 6,
      [hp1, inv.toFixed(2), hp2, Player.hp].join(","));
    // HUD health updates in the same frame
    Game.renderWorld();
    const seg = ctx.getImageData(66 + 6 * 6 + 2, 8, 1, 1).data;
    const seg2 = ctx.getImageData(66 + 5 * 6 + 2, 9, 1, 1).data;
    check("hud: health bar shows one segment fewer", seg[0] === 0x3a && seg[1] === 0x22 && seg2[1] > 150, Array.from(seg).join(",") + " / " + Array.from(seg2).join(","));
  });

  safe("lives", function () {
    load(grid(40, 12, [[2, 9, "P"], [12, 9, "C"]]));
    press("right"); steps(130); release("right");
    const cp = Game.checkpoints[0];
    check("checkpoint: touching activates it", cp.on);
    Player.x = 25 * 16; steps(5);
    Player.invuln = 0; Player.hp = 1; Player.hurt(1);
    steps(100);
    check("lives: losing a life removes one and refills health", Player.lives === CONFIG.startLives - 1 && Player.hp === CONFIG.maxHp, Player.lives + " lives, hp " + Player.hp);
    check("checkpoint: respawn at last checkpoint", Math.abs(Player.cx() - (cp.x + cp.w / 2)) < 2, Player.cx() + " vs " + (cp.x + cp.w / 2));
  });

  safe("pit", function () {
    const items = [[2, 9, "P"]];
    load(grid(40, 12, items));
    for (let x = 8; x < 14; x++) { Game.level.rows[10][x] = "."; Game.level.rows[11][x] = "."; }
    press("right"); steps(200); release("right");
    check("lives: falling out of the level costs a life", Player.lives === CONFIG.startLives - 1, Player.lives);
  });

  safe("gameover", function () {
    load(grid(40, 12, [[2, 9, "P"]]));
    Player.lives = 1; Player.hp = 1; Player.invuln = 0; Player.hurt(1);
    steps(100);
    check("game over: last life lost shows game-over screen", Game.state === STATE.GAME_OVER, Game.state);
    Game.render();
    steps(70); tap("enter");
    check("game over: key press returns to title", Game.state === STATE.TITLE, Game.state);
  });

  safe("pickups", function () {
    load(grid(40, 12, [[2, 9, "P"], [4, 9, "h"], [7, 9, "o"], [9, 9, "t"], [11, 9, "+"], [13, 9, "r"]]));
    const s0 = Game.score, l0 = Player.lives;
    press("right"); steps(130); release("right");
    check("pickup: health at full health stays at max and is consumed", Player.hp === CONFIG.maxHp && !Game.pickups.some(function (p) { return p.type === "h"; }));
    check("pickup: tennis ball + trophy award points", Game.score - s0 === CONFIG.ballPoints + CONFIG.trophyPoints, Game.score - s0);
    check("pickup: extra life", Player.lives === l0 + 1);
    check("pickup: key card collected and shown in HUD state", Player.keys.R === true);
    Player.hp = 3; Game.addPickup("s", Player.cx(), Player.y + Player.h); steps(2);
    check("pickup: Cervelat restores health", Player.hp === 6, Player.hp);
  });

  safe("enemy kill", function () {
    load(grid(40, 12, [[2, 9, "P"], [12, 9, "L"]]));
    const e = Game.enemies[0], s0 = Game.score;
    damageEnemy(e, 99); steps(1);
    check("enemies: defeat awards points, enemy removed", Game.score - s0 === CONFIG.lawyerPoints && Game.enemies.length === 0 && FX.parts.length > 10);
  });

  safe("doors", function () {
    load(grid(30, 12, [[2, 9, "P"], [10, 9, "R"], [10, 8, "R"], [10, 7, "#"]]));
    press("right"); steps(120);
    const blocked = Player.x + Player.w <= 160.01;
    Player.keys.R = true; steps(60); release("right");
    check("door: locked door blocks without key", blocked);
    check("door: opens with matching key", Player.x > 160 && Game.level.at(10, 9) === ".", "x=" + Player.x);
  });

  safe("exit", function () {
    load(grid(30, 12, [[2, 9, "P"], [7, 9, "E"]]));
    const s0 = Game.score;
    press("right"); steps(60); release("right");
    check("exit: reaching the exit shows level complete", Game.state === STATE.LEVEL_COMPLETE);
    const total = Game.tally.total;
    Game.render();
    tap("enter"); steps(2); tap("enter");
    check("exit: bonus added and next level starts", Game.score - s0 === total && total >= CONFIG.levelBonus && Game.levelIndex === 1 && Game.state === STATE.LEVEL_INTRO,
      "bonus " + total + " level " + Game.levelIndex);
  });

  safe("level sequence", function () {
    check("levels: 3 levels + boss arena", LEVEL_DATA.length === 4 && LEVEL_DATA[3].boss === "1", LEVEL_DATA.map(function (l) { return l.name; }).join(" / "));
    check("levels: order courts, creek, clubhouse, boss",
      /WOLLERAU/.test(LEVEL_DATA[0].name) && /KREBSBACH/.test(LEVEL_DATA[1].name) && /CLUBHOUSE|HALL/.test(LEVEL_DATA[2].name));
    const types = {};
    LEVEL_DATA.forEach(function (d, i) {
      const s = d.map.join("\n");
      check("level " + (i + 1) + ": has start" + (d.boss ? " and boss" : ", exit and checkpoint"),
        s.indexOf("P") >= 0 && (d.boss ? s.indexOf("X") >= 0 : s.indexOf("E") >= 0 && s.indexOf("C") >= 0));
      check("level " + (i + 1) + ": size within 150-250 x 15-40 tiles (boss 20x15)",
        d.boss ? d.map[0].length === 20 && d.map.length === 15 : d.map[0].length >= 150 && d.map[0].length <= 250 && d.map.length >= 15 && d.map.length <= 40,
        d.map[0].length + "x" + d.map.length);
      "LKM".split("").forEach(function (c) { if (s.indexOf(c) >= 0) types[c] = true; });
    });
    check("levels: all three enemy types appear", types.L && types.K && types.M);
    check("levels: creek level has water", LEVEL_DATA[1].map.join("").indexOf("~") >= 0);
    Player.resetForGame(); Game.score = 0;
    Game.loadLevel(2); Game.setState(STATE.PLAY); Game.completeLevel(); Game.tally.done = true; Game.nextLevel();
    check("levels: exiting level 3 starts the boss arena", Game.level.isBoss && Game.levelIndex === 3);
    // render every level once (no exceptions)
    for (let i = 0; i < LEVEL_DATA.length; i++) { Game.loadLevel(i); Game.setState(STATE.PLAY); steps(5); Game.render(); }
    check("levels: every level renders", true);
  });

  safe("gore", function () {
    load(grid(40, 12, [[2, 9, "P"]]));
    Game.godMode = true;
    FX.clear();
    FX.blood(200, 120, 0, 20);
    steps(90);
    const onFloor = FX.stains.filter(function (st) { return Math.abs(st.y - 160) <= 2; }).length;
    check("gore: blood drops leave stains on the solid tiles they hit", FX.stains.length > 5 && onFloor > 5, FX.stains.length + " stains, " + onFloor + " on floor");
    for (let i = 0; i < 100; i++) FX.addStain(100 + i, 160, "#a81010");
    check("gore: at most 64 stains", FX.stains.length === 64);
    FX.stains.length = 0; FX.addStain(100, 160, "#a81010");
    steps(60 * 16);
    const alive16 = FX.stains.length === 1;
    steps(60 * 4 + 10);
    check("gore: stains disappear after 20 s", alive16 && FX.stains.length === 0);
    // lawyer: blood + gibs + red stains
    load(grid(40, 12, [[2, 9, "P"], [12, 9, "L"], [20, 9, "M"]]));
    Game.godMode = true;
    FX.clear();
    const law = Game.enemies[0], rob = Game.enemies[1];   // rob: the punk
    damageEnemy(law, 99, 1);
    const red = FX.parts.filter(function (p) { return GORE.blood.indexOf(p.color) >= 0; }).length;
    const gibs = FX.parts.filter(function (p) { return p.gib; }).length;
    steps(90);
    const redStains = FX.stains.filter(function (st) { return GORE.blood.indexOf(st.color) >= 0; }).length;
    check("gore: defeated lawyer bursts into blood and gibs and stains the floor", red > 20 && gibs >= 4 && redStains > 3, red + " drops, " + gibs + " gibs, " + redStains + " stains");
    function count(pal) { return FX.parts.filter(function (p) { return pal.indexOf(p.color) >= 0; }).length; }
    FX.clear();
    damageEnemy(rob, 99, -1);
    check("gore: defeated punk bleeds and his mower explodes into oil, sparks and debris",
      count(GORE.blood) > 10 && count(GORE.oil) > 10 && count(GORE.spark) > 5 && FX.parts.some(function (p) { return p.gib; }),
      count(GORE.blood) + " blood, " + count(GORE.oil) + " oil, " + count(GORE.spark) + " sparks");
    load(grid(40, 12, [[2, 9, "P"], [20, 9, "M"]]));
    const pk = Game.enemies[0]; pk.face = -1;
    FX.clear(); damageEnemy(pk, 1, 1);          // shot travels right, punk faces left: hits the mower
    const frontOil = count(GORE.oil), frontBlood = count(GORE.blood);
    FX.clear(); damageEnemy(pk, 1, -1);         // shot from behind: hits the punk
    const backOil = count(GORE.oil), backBlood = count(GORE.blood);
    check("gore: shot into the mower gives oil, shot into the punk gives blood",
      frontOil > 0 && frontBlood === 0 && backBlood > 0 && backOil === 0, [frontOil, frontBlood, backOil, backBlood].join(","));
    // surviving hit spills a few drops
    load(grid(40, 12, [[2, 9, "P"], [12, 9, "L"]]));
    FX.clear();
    damageEnemy(Game.enemies[0], 1, 1);
    check("gore: surviving hit spills a few drops", FX.parts.filter(function (p) { return GORE.blood.indexOf(p.color) >= 0; }).length >= 3 && Game.enemies[0].flash > 0);
    Game.godMode = false;
  });

  safe("damage flash", function () {
    load(grid(40, 12, [[2, 9, "P"]]));
    Game.renderWorld();
    const before = ctx.getImageData(2, 120, 1, 1).data.slice();
    Player.invuln = 0; Player.hurt(1);
    Game.renderWorld();
    const during = ctx.getImageData(2, 120, 1, 1).data;
    const redder = (during[0] - during[1]) > (before[0] - before[1]) + 40;
    steps(19);
    const flashGone = Game.hurtFlash === 0;
    check("damage flash: screen edges flash red and fade within ~0.3 s", redder && flashGone,
      Array.from(before).join(",") + " -> " + Array.from(during).join(","));
  });

  safe("interior", function () {
    // same map with and without the interior header; compare rendered pixels
    const items = [[2, 9, "P"], [6, 5, "v"]];
    function px(extra, tx, ty) {
      load(grid(40, 12, items), Object.assign({ theme: "hall", bg: "bg_hall" }, extra));
      Camera.x = 0; Camera.y = 0;
      Game.renderWorld();
      return ctx.getImageData(tx * TILE + 8, ty * TILE + 8 - Camera.y + HUD_H, 1, 1).data.slice();
    }
    const ts = buildTileset("hall");
    const wp = ts.wallpaper[(10 + 4) % 2].getContext("2d").getImageData(8, 8, 1, 1).data;
    const inPhoto = px({}, 10, 4), inInt = px({ interior: "0-19" }, 10, 4);
    check("interior: empty clubhouse cell shows the wall backdrop, not the photo",
      inInt[0] === wp[0] && inInt[1] === wp[1] && inInt[2] === wp[2] && (inPhoto[0] !== wp[0] || inPhoto[1] !== wp[1]),
      Array.from(inInt).join(",") + " vs photo " + Array.from(inPhoto).join(","));
    const winPhoto = px({}, 6, 5), winInt = px({ interior: "0-19" }, 6, 5);
    check("interior: window cells still show the photo", winPhoto[0] === winInt[0] && winPhoto[1] === winInt[1] && winPhoto[2] === winInt[2]);
    const hallPhoto = px({}, 25, 4), hallInt = px({ interior: "0-19" }, 25, 4);
    check("interior: outside the range the darkened photo is used as before", hallPhoto[0] === hallInt[0] && hallPhoto[1] === hallInt[1]);
    const ws = ts.wainscot.getContext("2d").getImageData(8, 2, 1, 1).data;
    load(grid(40, 12, items), { theme: "hall", bg: "bg_hall", interior: "0-19" }); Camera.x = 0; Camera.y = 0; Game.renderWorld();
    const above = ctx.getImageData(12 * TILE + 8, 9 * TILE + 2 + HUD_H - Camera.y, 1, 1).data;
    check("interior: wainscot panelling directly above the floor", above[0] === ws[0] && above[1] === ws[1] && above[2] === ws[2]);
  });

  safe("furniture", function () {
    load(grid(40, 12, [[2, 9, "P"], [6, 9, "a"], [7, 9, "A"], [8, 9, "T"], [9, 9, "c"], [10, 9, "i"], [14, 9, "T"]]));
    press("right"); steps(110); release("right");
    check("furniture: walking along the floor past counter, table, chair and stool is not blocked",
      Player.x > 12 * 16 && Math.abs(Player.y + Player.h - 160) < 1, "x " + Player.x.toFixed(0));
    Player.x = 14 * 16 + 3; Player.vx = 0; steps(5);
    press("jump"); steps(30); release("jump"); steps(40);
    check("furniture: hero can jump onto a table and stand on it", Player.onGround && Math.abs(Player.y + Player.h - 144) < 1,
      "feet " + (Player.y + Player.h).toFixed(1));
    Player.x = 6 * 16 + 3; Player.y = 160 - Player.h; Player.vy = 0; steps(3);
    press("jump"); steps(30); release("jump"); steps(40);
    check("furniture: the bar counter is a platform too", Player.onGround && Math.abs(Player.y + Player.h - 144) < 1);
  });

  safe("props", function () {
    let allVisible = true, missing = [];
    Object.keys(PROP_DEFS).forEach(function (ch) {
      const c = buildProp(ch, true), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++;
      if (n < 20 || c.width !== PROP_DEFS[ch].w * TILE || c.height !== PROP_DEFS[ch].h * TILE) { allVisible = false; missing.push(ch); }
    });
    check("props: every clubhouse prop renders visible pixels at its footprint size", allVisible, missing.join(","));
    TEXT_LOG.active = true; TEXT_LOG.items = [];
    buildProp("m", true);
    TEXT_LOG.active = false;
    const menu = TEXT_LOG.items.join("|");
    check("props: menu board lists CERVELAT, RIVELLA and FONDUE with prices",
      /CERVELAT +\d/.test(menu) && /RIVELLA +\d/.test(menu) && /FONDUE +\d/.test(menu), menu);
    const on = propCanvas("N", 0.35), offs = [];
    for (let t = 0; t < 60; t += 0.1) offs.push(propCanvas("N", t) !== on);
    check("props: neon sign flickers", offs.some(function (x) { return x; }) && offs.filter(function (x) { return x; }).length < offs.length * 0.15,
      offs.filter(function (x) { return x; }).length + "/" + offs.length + " frames off");
  });

  safe("toxic creek", function () {
    const ts = buildTileset("creek");
    function pixels(c) { return c.getContext("2d").getImageData(0, 0, c.width, c.height).data; }
    let bad = 0, n = 0;
    ts.water.concat(ts.waterTop).forEach(function (c) {
      const d = pixels(c);
      for (let i = 0; i < d.length; i += 4) {
        if (!d[i + 3]) continue; n++;
        if (!(d[i] > d[i + 1] + 60 && d[i] > d[i + 2] + 60)) bad++;
      }
    });
    check("toxic creek: water tiles are dominantly red, no blue left", n > 500 && bad === 0, bad + "/" + n + " non-red pixels");
    function differ(a, b) { const x = pixels(a), y = pixels(b); let k = 0; for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) k++; return k; }
    const f0 = Math.floor(1.0 * 6) % 4, f1 = Math.floor(1.25 * 6) % 4;
    check("toxic creek: surface bubbles animate (frames 0.25 s apart differ)", f0 !== f1 && differ(ts.waterTop[f0], ts.waterTop[f1]) > 4);
    const blue = pixels(buildTileset("court").water[0]);
    check("toxic creek: other themes keep blue water", blue[2] > blue[0] + 60);
    // splash + damage in a creek-themed map
    const items = [[2, 9, "P"]];
    for (let x = 8; x <= 12; x++) { items.push([x, 10, "~"]); items.push([x, 11, "~"]); }
    load(grid(40, 12, items), { theme: "creek", bg: "bg_creek" });
    check("toxic creek: level exposes the toxic water palette", Game.level.waterPalette.splash === "#ff4020");
    Player.x = 10 * 16; Player.y = 9 * 16; Player.vy = 0; Player.invuln = 0; FX.clear();
    let splashRed = false, minVy = 0;
    steps(20, function () {
      if (FX.parts.some(function (p) { return p.color === "#ff4020"; })) splashRed = true;
      minVy = Math.min(minVy, Player.vy);
    });
    check("toxic creek: red splash, 2 damage and a bounce as before", splashRed && Player.hp === CONFIG.maxHp - 2 && minVy < -200,
      "hp " + Player.hp + " vy " + minVy.toFixed(0));
  });

  safe("court equipment and toxic props", function () {
    const l1 = LEVEL_DATA[0].map.join(""), l2 = LEVEL_DATA[1].map.join("");
    const equip = ["Q", "@", "%", "V", "z", "[", "J", "&"];
    const missing = equip.filter(function (c) { return l1.indexOf(c) < 0; });
    check("courts: every tennis equipment type appears in level 1", missing.length === 0, "missing " + missing.join(""));
    function count(str, c) { return str.split(c).length - 1; }
    check("creek: at least 2 toxic drums and 2 skull warning signs in level 2", count(l2, "*") >= 2 && count(l2, "^") >= 2,
      count(l2, "*") + " drums, " + count(l2, "^") + " signs");
    TEXT_LOG.active = true; TEXT_LOG.items = [];
    buildProp("[", true); buildProp("^", true);
    TEXT_LOG.active = false;
    const txt = TEXT_LOG.items.join("|");
    check("props: scoreboard shows TC WOLLERAU and a score, sign reads TOXIC",
      txt.indexOf("TC WOLLERAU") >= 0 && /\d:\d/.test(txt) && txt.indexOf("TOXIC") >= 0, txt);
    // walking along the ground past every equipment type is not blocked
    const items = [[1, 9, "P"]];
    let x = 4;
    equip.concat(["*"]).forEach(function (c) { const w = (PROP_DEFS[c] || { w: 1 }).w, h = PROP_DEFS[c].h; items.push([x, 10 - h, c]); x += w + 1; });
    load(grid(60, 12, items));
    press("right"); steps(400); release("right");
    check("courts: walking along the ground past the equipment is not blocked", Player.x > (x + 1) * 16, "x " + Player.x.toFixed(0) + " needed " + (x + 1) * 16);
  });

  safe("pause", function () {
    load(grid(40, 12, [[2, 9, "P"], [12, 9, "L"]]));
    tap("pause");
    check("pause: P pauses", Game.state === STATE.PAUSE);
    const e = Game.enemies[0], ex = e.x, px = Player.x;
    press("right"); steps(60); release("right");
    check("pause: nothing moves while paused", e.x === ex && Player.x === px);
    Game.render();
    tap("pause");
    check("pause: P resumes", Game.state === STATE.PLAY);
  });

  // ---------------- enemies ----------------
  safe("activation", function () {
    load(grid(100, 12, [[2, 9, "P"], [90, 9, "L"]]));
    const e = Game.enemies[0], x0 = e.x;
    steps(60);
    check("enemies: distant enemy stays idle", e.x === x0 && Game.enemyShots.length === 0);
  });

  safe("lawyer ledge", function () {
    const items = [[2, 9, "P"], [22, 5, "L"]];
    for (let x = 20; x < 26; x++) items.push([x, 6, "#"]);
    load(grid(40, 12, items));
    Game.godMode = true;
    const e = Game.enemies[0], y0 = e.y;
    let minX = e.x, maxX = e.x;
    steps(600, function () { minX = Math.min(minX, e.x); maxX = Math.max(maxX, e.x + e.w); });
    check("lawyer: turns at a ledge instead of falling", e.y === y0 && minX >= 20 * 16 - 1 && maxX <= 26 * 16 + 1 && e.turned > 0,
      "x " + minX.toFixed(0) + ".." + maxX.toFixed(0) + " turned " + e.turned);
  });

  safe("lawyer attack", function () {
    load(grid(40, 12, [[2, 9, "P"], [9, 9, "L"]]));
    Game.godMode = true; sounds.length = 0;
    let thrown = false;
    steps(150, function () { if (Game.enemyShots.some(function (s) { return s.kind === "briefcase" && s.vx < 0; })) thrown = true; });
    check("lawyer: throws a briefcase toward the hero", thrown && sounds.indexOf("throw") >= 0);
  });

  safe("crayfish", function () {
    load(grid(40, 12, [[2, 9, "P"], [7, 9, "K"]]));
    Game.godMode = true;
    const e = Game.enemies[0];
    let leapVx = 0;
    steps(90, function () { if (e.leaping && !leapVx) leapVx = e.vx; });
    check("crayfish: leaps in an arc toward the hero", e.leaps >= 1 && leapVx < 0, "leaps " + e.leaps + " vx " + leapVx);
    // emerging from water
    const items = [[2, 9, "P"]];
    for (let x = 8; x <= 12; x++) { items.push([x, 10, "~"]); items.push([x, 11, "~"]); }
    items.push([10, 10, "K"]);
    load(grid(40, 12, items));
    Game.godMode = true;
    const c = Game.enemies[0];
    const sub0 = c.submerged;
    steps(30);
    const stillSub = c.submerged;
    Player.x = 5 * 16; steps(20);
    check("crayfish: hides in the creek and emerges near the hero", sub0 && stillSub && !c.submerged, [sub0, stillSub, c.submerged].join(","));
  });

  safe("punk", function () {
    // turns at a ledge (platform island), never falls
    const isl = [[2, 9, "P"], [22, 5, "M"]];
    for (let x = 20; x < 26; x++) isl.push([x, 6, "#"]);
    load(grid(40, 12, isl));
    Game.godMode = true;
    let e = Game.enemies[0];
    const y0 = e.y; let minX = e.x, maxX = e.x;
    steps(600, function () { minX = Math.min(minX, e.x); maxX = Math.max(maxX, e.x + e.w); });
    check("punk: turns at a ledge instead of falling", e.y === y0 && minX >= 20 * 16 - 1 && maxX <= 26 * 16 + 1 && e.turned > 0,
      "x " + minX.toFixed(0) + ".." + maxX.toFixed(0) + " turned " + e.turned);
    check("punk: blunt smoke puffs about once per second", e.puffs >= 8 && e.puffs <= 12, e.puffs + " puffs in 10 s");
    (function () {   // petrol exhaust tied to the engine state
      e.exhaust = { patrol: 0, rev: 0, charge: 0 }; e.state = "patrol"; e.cd = 99;
      steps(120);
      const patrol1s = e.exhaust.patrol / 2;
      const idle = FX.parts.filter(function (p) { return p.exhaust === "patrol"; })[0];
      check("mower: at least 3 exhaust puffs per second while patrolling", patrol1s >= 3, patrol1s + " puffs");
      e.state = "rev"; e.t = 99; const r0 = e.exhaust.rev;
      steps(60);
      const revRate = e.exhaust.rev - r0, dark = FX.parts.filter(function (p) { return p.exhaust === "rev"; })[0];
      const alpha = function (p) { return p ? +p.color.split(",")[3].replace(")", "") : 0; };
      const shade = function (p) { return p ? +p.color.split("(")[1].split(",")[0] : 255; };
      check("mower: revving smoke at least 3x as often and darker", revRate >= patrol1s * 3 && shade(dark) < shade(idle) && alpha(dark) > alpha(idle),
        "rev " + revRate + "/s vs patrol " + patrol1s + "/s");
      e.x = 20 * 16 + 1; e.face = 1;                 // charge the whole length of the platform
      e.state = "charge"; e.dist = 0; e.clipT = 0; let gaps = 0, lastN = e.exhaust.charge;
      for (let i = 0; i < 6; i++) { steps(6); if (e.state !== "charge") break; if (e.exhaust.charge === lastN) gaps++; lastN = e.exhaust.charge; }
      check("mower: dark exhaust trail throughout the charge", e.exhaust.charge >= 4 && gaps === 0, e.exhaust.charge + " puffs, gaps " + gaps);
      e.state = "patrol"; e.cd = CONFIG.punkCooldown;
      const before = JSON.stringify(e.exhaust);
      damageEnemy(e, 99); steps(60);
      check("mower: no exhaust after the punk is killed", e.dead && JSON.stringify(e.exhaust) === before && Game.enemies.indexOf(e) < 0);
      load(grid(40, 12, isl)); Game.godMode = true; e = Game.enemies[0];
    })();
    // mower contact costs 2 health
    load(grid(40, 12, [[2, 9, "P"], [20, 9, "M"]]));
    e = Game.enemies[0];
    Player.x = e.x + 4; Player.y = e.y; Player.invuln = 0;
    steps(1);
    check("punk: mower contact costs 2 health", Player.hp === CONFIG.maxHp - 2, "hp " + Player.hp);
    // wind-up then charge toward the hero in front
    load(grid(40, 12, [[2, 9, "P"], [8, 9, "M"]]));
    Game.godMode = true;
    e = Game.enemies[0];
    let tRev = -1, tCharge = -1, maxV = 0, t = 0, sawClip = false, clipForward = true, clipMaxLife = 0;
    const clipBorn = new Map();
    steps(120, function () {
      t += DT;
      if (e.state === "rev" && tRev < 0) tRev = t;
      if (e.state === "charge" && tCharge < 0) tCharge = t;
      if (e.state === "charge") maxV = Math.max(maxV, -e.vx);
      Game.enemyShots.forEach(function (s) {
        if (s.kind !== "clipping") return;
        sawClip = true; if (s.vx >= 0) clipForward = false;
        if (!clipBorn.has(s)) clipBorn.set(s, t);
        clipMaxLife = Math.max(clipMaxLife, t - clipBorn.get(s));
      });
    });
    const revLen = tCharge - tRev;
    check("punk: revs ~0.5 s before charging", tRev >= 0 && tCharge > 0 && Math.abs(revLen - CONFIG.punkRev) < 0.05, "rev " + revLen.toFixed(2) + " s");
    check("punk: charges toward the hero at >= 3x patrol speed", maxV >= 3 * CONFIG.punkSpeed, "speed " + maxV.toFixed(0));
    check("punk: charge throws clippings and stones forward that expire within ~0.4 s",
      sawClip && clipForward && clipMaxLife <= 0.4, "max life " + clipMaxLife.toFixed(2));
    // clipping damage
    load(grid(40, 12, [[2, 9, "P"]]));
    Player.invuln = 0;
    Game.enemyShots.push({ kind: "clipping", x: Player.x + 2, y: Player.y + 10, w: 3, h: 3, vx: 0, vy: 0, grav: 0, dmg: 1, life: 0.3 });
    steps(1);
    check("punk: a clipping costs 1 health", Player.hp === CONFIG.maxHp - 1, "hp " + Player.hp);
    // charge stops at a ledge: punk island, gap, hero island in range
    const two = [[2, 9, "P"], [15, 5, "M"]];
    for (let x = 10; x < 18; x++) two.push([x, 6, "#"]);
    for (let x = 20; x < 25; x++) two.push([x, 6, "#"]);
    load(grid(40, 12, two));
    Game.godMode = true;
    e = Game.enemies[0]; e.face = 1;
    Player.x = 21 * 16; Player.y = 6 * 16 - Player.h; Player.vy = 0;
    const py0 = e.y; let charged = false;
    steps(240, function () { if (e.state === "charge") charged = true; Player.x = 21 * 16; Player.y = 6 * 16 - Player.h; Player.vy = 0; });
    check("punk: charge ends at a ledge without falling", charged && e.y === py0 && e.x + e.w <= 18 * 16 + 2 && e.state !== "charge",
      "charged " + charged + " x+w " + (e.x + e.w).toFixed(0));
    // no charge from behind
    load(grid(40, 12, [[10, 9, "P"], [7, 9, "M"]]));
    Game.godMode = true;
    e = Game.enemies[0];
    let revved = false;
    steps(120, function () { if (e.state !== "patrol") revved = true; });
    check("punk: no charge when the hero is behind him", !revved);
    damageEnemy(e, 1, 1);
    check("enemies: hit flash on a surviving enemy", e.flash > 0 && e.hp === CONFIG.punkHp - 1);
    Game.godMode = false;
  });

  // ---------------- boss ----------------
  safe("boss", function () {
    Player.resetForGame(); Game.score = 0;
    Game.loadLevel(3); Game.setState(STATE.BOSS);
    check("boss: arena starts with the boss and its health bar", Boss.active && Game.boss === Boss && Boss.hp === CONFIG.bossHp);
    (function () {   // boss drawn with the dark sprite outline
      fillRect(0, 0, W, H, "#ff00ff");
      Boss.draw(Camera.x, Camera.y);
      const d = ctx.getImageData(0, 0, W, H).data;
      function mag(x, y) { if (x < 0 || y < 0 || x >= W || y >= H) return false; /* screen border is not background */ const i = (y * W + x) * 4; return d[i] === 255 && d[i + 1] === 0 && d[i + 2] === 255; }
      let edge = 0, outlined = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (mag(x, y)) continue;
        if (mag(x - 1, y) || mag(x + 1, y) || mag(x, y - 1) || mag(x, y + 1)) {
          edge++; const i = (y * W + x) * 4;
          if (d[i] === OUTLINE_COLOR[0] && d[i + 1] === OUTLINE_COLOR[1] && d[i + 2] === OUTLINE_COLOR[2]) outlined++;
        }
      }
      check("boss: drawn with a dark outline on every edge", edge > 100 && outlined === edge, outlined + "/" + edge);
    })();
    check("boss: music plays faster in the arena", Sound.tempo === 1.25);
    steps(100);
    const sh = Boss.shell();
    const hp0 = Boss.hp;
    const s1 = { x: sh.x + 20, y: sh.y + 10, w: 6, h: 3, vx: 260, dmg: 1 };
    check("boss: shell deflects shots", Boss.hitByShot(s1) && s1.deflected && Boss.hp === hp0 && s1.vx < 0);
    Boss.raised = false; Boss.claw = 0;
    const f = Boss.face();
    const s2 = { x: f.x + 5, y: f.y + 40, w: 6, h: 3, vx: 260, dmg: 1 };
    check("boss: face protected while claws are down", Boss.hitByShot(s2) && s2.deflected && Boss.hp === hp0);
    Boss.raised = true; Boss.claw = 1;
    const s3 = { x: f.x + 5, y: f.y + 40, w: 6, h: 3, vx: 260, dmg: 1 };
    check("boss: face takes damage while claws are raised", Boss.hitByShot(s3) && !s3.deflected && Boss.hp === hp0 - 1);
    Boss.raised = false;
    // a hero standing on the floor shooting at the closed claws gets deflected
    Player.x = 60; Player.face = 1; Game.shots = []; Boss.toIdle(); Boss.t = 99; Boss.claw = 0;
    Player.fire(); const hpB = Boss.hp; steps(60);
    check("boss: floor shot hits closed claws (deflect)", Boss.deflects > 0 && Boss.hp === hpB);
    // attack cycle
    Game.godMode = true; Boss.log = []; Boss.toIdle();
    let maxShake = 0, sawBubble = false, sawWave = false;
    steps(60 * 14, function () {
      maxShake = Math.max(maxShake, FX.shakeAmp);
      Game.enemyShots.forEach(function (s) { if (s.kind === "bubble") sawBubble = true; if (s.kind === "shockwave") sawWave = true; });
    });
    check("boss: claw slam shakes the screen and sends a shockwave", Boss.log.indexOf("slam") >= 0 && maxShake >= 5 && sawWave);
    check("boss: bubble arc attack", Boss.log.indexOf("bubbles") >= 0 && sawBubble);
    check("boss: summons small crayfish", Boss.log.indexOf("summon") >= 0 && Game.enemies.some(function (e) { return e.type === "cray"; }));
    const normalIdle = Boss.idleTime();
    Boss.hp = Math.floor(Boss.maxHp * 0.45);
    check("boss: shorter pauses below 50% health", Boss.idleTime() < normalIdle && Boss.enraged());
    Game.render();
    // victory
    Boss.hp = 1; Boss.raised = true; Boss.claw = 1; Boss.state = "idle";
    Boss.hitByShot({ x: Boss.face().x + 5, y: Boss.face().y + 40, w: 6, h: 3, vx: 260, dmg: 1 });
    check("boss: explosion sequence when defeated", Boss.state === "dying");
    steps(200);
    check("victory: victory screen after the boss dies", Game.state === STATE.VICTORY);
    Game.render();
    Game.godMode = false;
  });

  safe("arena health", function () {
    Player.resetForGame(); Game.loadLevel(3); Game.setState(STATE.BOSS);
    Game.godMode = true;
    Game.pickups = []; Boss.healthTimer = 0.05; steps(5);
    check("boss arena: health pickups respawn", Game.pickups.some(function (p) { return p.type === "h"; }) && Game.arenaHealthSpots.length > 0);
    Game.godMode = false;
  });

  // ---------------- flow / audio ----------------
  safe("title", function () {
    Game.setState(STATE.TITLE); Game.render();
    Game.score = 1234; Player.lives = 1; Player.hp = 2;
    tap("enter");
    check("title: Enter starts level 1 with score 0, full health, 3 lives",
      Game.state === STATE.LEVEL_INTRO && Game.levelIndex === 0 && Game.score === 0 && Player.hp === CONFIG.maxHp && Player.lives === 3);
    Game.render();
    steps(Math.round(introTotal(Game.level.isBoss) * 60) + 5);
    check("title: level intro leads into play", Game.state === STATE.PLAY);
  });

  safe("reel cards", function () {
    function phaseSeq(levelIdx) {
      Player.resetForGame(); Game.loadLevel(levelIdx);
      const seq = [], digits = [];
      TEXT_LOG.active = true;
      while (Game.state === STATE.LEVEL_INTRO) {
        const ph = introPhaseAt(Game.level.isBoss, Game.stateT);
        if (seq[seq.length - 1] !== ph.name) seq.push(ph.name);
        if (ph.name === "leader" && digits[digits.length - 1] !== ph.n) digits.push(ph.n);
        Game.render(); steps(1);
      }
      TEXT_LOG.active = false;
      const texts = TEXT_LOG.items.join("|"); TEXT_LOG.items = [];
      return { seq: seq.join(","), digits: digits.join(""), texts: texts, state: Game.state };
    }
    const l2 = phaseSeq(1);
    check("reel cards: level 2 shows countdown 3-2-1 then REEL 2 with the level name, then play",
      l2.seq === "leader,card" && l2.digits === "321" && l2.texts.indexOf("REEL 2") >= 0 && l2.texts.indexOf("KREBSBACH") >= 0 && l2.state === STATE.PLAY,
      l2.seq + " " + l2.digits);
    check("reel cards: no MISSING REEL before a normal level", l2.texts.indexOf("MISSING REEL") < 0);
    const boss = phaseSeq(3);
    check("reel cards: MISSING REEL card before the boss arena's intro", boss.seq === "missing,leader,card" &&
      boss.texts.indexOf("MISSING REEL") >= 0 && boss.texts.indexOf("FINAL REEL") >= 0 && boss.state === STATE.BOSS, boss.seq);
    Player.resetForGame(); Game.loadLevel(0); steps(20); tap("enter");
    check("reel cards: Enter skips straight to play", Game.state === STATE.PLAY && Game.stateT < 0.1);
    Game.loadLevel(0); steps(20); tap("jump");
    check("reel cards: Space skips straight to play", Game.state === STATE.PLAY);
  });

  safe("poster and end cards", function () {
    function textsOf(state, setup) {
      if (setup) setup();
      Game.setState(state); Game.stateT = 3; Game.time = 0.1;   // blink phase: visible
      TEXT_LOG.active = true; TEXT_LOG.items = []; Game.render(); TEXT_LOG.active = false;
      return TEXT_LOG.items.join("|");
    }
    const t = textsOf(STATE.TITLE);
    check("title: exploitation poster with logo, tagline, rating badge, controls and PRESS ENTER",
      t.indexOf("BUCK NUKEM") >= 0 && t.indexOf(TAGLINE[0]) >= 0 && t.indexOf(TAGLINE[1]) >= 0 && t.indexOf("RATED") >= 0 &&
      t.indexOf("WOLLERAU") >= 0 && t.indexOf("X/CTRL/ALT") >= 0 && t.indexOf("PRESS ENTER") >= 0, t);
    const go = textsOf(STATE.GAME_OVER), vi = textsOf(STATE.VICTORY);
    check("end cards: game over is a THE END card with the final score", go.indexOf("THE END") >= 0 && go.indexOf("FINAL SCORE") >= 0, go);
    check("end cards: victory is a THE END card with the final score", vi.indexOf("THE END") >= 0 && vi.indexOf("FINAL SCORE") >= 0, vi);
    FX.clear();
  });

  safe("audio", function () {
    check("music: Ride of the Valkyries loop has 16 bars of 9/8", SONG.steps === 16 * 18);
    const leadNotes = SONG.events.reduce(function (n, ev) { return n + ev.filter(function (e) { return e.v === "lead"; }).length; }, 0);
    check("music: lead melody, bass and percussion voices", leadNotes === 16 * 4 + 12 && SONG.events[0].some(function (e) { return e.v === "bass"; }));
    const m0 = Sound.muted;
    Sound.toggleMute(); const m1 = Sound.muted; Sound.toggleMute();
    check("audio: M toggles mute", m1 !== m0 && Sound.muted === m0);
    Input.reset(); sounds.length = 0;
    load(grid(40, 12, [[2, 9, "P"]]));
    tap("jump"); steps(40); tap("mute");
    check("audio: jump sound and mute key", sounds.indexOf("jump") >= 0 && Sound.muted === !m0);
    tap("mute");
  });

  safe("music scheduler", function () {
    // Drive the real scheduler with a fake clock and record the lead-voice note onsets.
    const realAc = Sound.ac, realTone = Sound.tone, realSweep = Sound.sweep, realNoise = Sound.noise;
    const clock = { currentTime: 0 };
    const lead = [];
    Sound.ac = clock;
    Sound.tone = function (type, f, t, dur, vol, dest) { if (vol === 0.22) lead.push({ t: t, f: f, d: dur }); };
    Sound.sweep = function () {}; Sound.noise = function () {};
    const realTrack = Sound.track;
    Sound.track = "valkyries";
    Sound.playing = true; Sound.step = 0; Sound.nextTime = 0; Sound.setTempo(1);
    function run(seconds) { for (let t = 0; t < seconds; t += 0.025) { clock.currentTime += 0.025; Sound.schedule(); } }
    const loopLen = SONG.steps * Sound.sixteenth;
    run(loopLen * 2 + 1);
    // expected opening (B minor Valkyrie figure): B4 F#4 B4 D5 B4 | D5 B4 D5 F#5 D5
    const want = ["B4", "F#4", "B4", "D5", "B4", "D5", "B4", "D5", "F#5", "D5"].map(function (n) { return midiHz(NOTE[n]); });
    const got = lead.slice(0, 10).map(function (n) { return n.f; });
    check("music: melody opens with the Valkyrie figure (B4 F#4 B4 D5 ...)", want.every(function (f, i) { return Math.abs(f - got[i]) < 0.01; }));
    const second = lead.filter(function (n) { return n.t >= loopLen - 1e-6; });
    const seamless = Math.abs(second[0].t - loopLen) < 1e-6 && Math.abs(second[0].f - got[0]) < 0.01;
    // no gaps: each note starts exactly where the previous one ended (in sixteenths)
    let gaps = 0;
    for (let i = 1; i < 76 * 2; i++) {
      const prev = lead[i - 1], cur = lead[i];
      const expected = prev.t + Math.round(prev.d / 0.92 / Sound.sixteenth) * Sound.sixteenth;
      if (Math.abs(cur.t - expected) > 1e-6) gaps++;
    }
    check("music: loops seamlessly without gaps", seamless && gaps === 0, "seamless " + seamless + ", gaps " + gaps);
    lead.length = 0; Sound.step = 0; Sound.nextTime = clock.currentTime; Sound.setTempo(1.25);
    run(5);
    const dt = lead[1].t - lead[0].t;
    check("music: boss tempo is 1.25x faster", Math.abs(dt - 3 * Sound.sixteenth / 1.25) < 1e-6, dt.toFixed(4));
    Sound.setTempo(1); Sound.playing = false; Sound.track = realTrack;
    Sound.ac = realAc; Sound.tone = realTone; Sound.sweep = realSweep; Sound.noise = realNoise;
  });

  safe("rock title theme", function () {
    const R = SONGS.title;
    check("title theme: 16 bars of 4/4 (256 sixteenths) at 132 bpm", R.steps === 16 * 16 && Math.abs(R.sixteenth - 60 / 132 / 4) < 1e-9, R.steps);
    const voices = {};
    R.events.forEach(function (ev) { ev.forEach(function (e) { voices[e.v] = (voices[e.v] || 0) + 1; }); });
    check("title theme: guitar riff, power chords, bass, kick and snare", ["gtr", "pow", "rbass", "kick", "snare"].every(function (v) { return voices[v] > 0; }) && voices.gtr > 40,
      JSON.stringify(voices));
    check("title theme: palm-muted chugs and crashes on bars 1 and 9",
      R.events.some(function (ev) { return ev.some(function (e) { return e.v === "gtr" && e.pm; }); }) &&
      R.events[0].some(function (e) { return e.v === "crash"; }) && R.events[8 * 16].some(function (e) { return e.v === "crash"; }));
    check("title theme: opens on a low E", R.events[0].some(function (e) { return e.v === "gtr" && e.m === NOTE.E2; }));
    // Drive the real scheduler with a fake clock and record every event onset.
    const realAc = Sound.ac, realPlay = Sound.playEvent, realTrack = Sound.track;
    const clock = { currentTime: 0 }, log = [];
    Sound.ac = clock;
    Sound.playEvent = function (e, t, len) { log.push({ v: e.v, m: e.m, t: t, len: len }); };
    Sound.track = "title"; Sound.playing = true; Sound.step = 0; Sound.nextTime = 0; Sound.setTempo(1);
    const loopLen = R.steps * R.sixteenth;
    for (let t = 0; t < loopLen * 2 + 0.5; t += 0.025) { clock.currentTime += 0.025; Sound.schedule(); }
    const first = log.filter(function (e) { return e.t < loopLen - 1e-6; });
    const second = log.filter(function (e) { return e.t >= loopLen - 1e-6 && e.t < 2 * loopLen - 1e-6; });
    const same = first.length === second.length && first.every(function (e, i) {
      return e.v === second[i].v && e.m === second[i].m && Math.abs(second[i].t - e.t - loopLen) < 1e-6;
    });
    const usesOwnSixteenth = log.every(function (e) { return Math.abs(e.len - R.sixteenth) < 1e-9; });
    // no gap: every eighth-note position of the loop has at least one event
    let gaps = 0;
    for (let s = 0; s < R.steps; s += 2) if (!first.some(function (e) { return Math.abs(e.t - s * R.sixteenth) < 1e-6; })) gaps++;
    check("title theme: loops seamlessly without gaps at its own tempo", same && usesOwnSixteenth && gaps === 0 && Math.abs(second[0].t - loopLen) < 1e-6,
      "events " + first.length + "/" + second.length + ", gaps " + gaps);
    Sound.playing = false; Sound.track = realTrack; Sound.ac = realAc; Sound.playEvent = realPlay;
  });

  safe("fans", function () {
    load(grid(40, 12, [[2, 9, "P"], [10, 9, "F"], [20, 9, "F"]]));
    check("fans: spawned from F with different looks, tile cleared", Fans.list.length === 2 && Fans.list[0].variant !== Fans.list[1].variant &&
      Game.level.at(10, 9) === "." && Game.fans === Fans.list);
    const f = Fans.list[0], seen = {};
    steps(60, function () { seen[Fans.frame(f)] = true; });
    check("fans: idle cheer animates (2+ frames within 1 s)", Object.keys(seen).length >= 2, Object.keys(seen).join(","));
    Player.x = 2 * 16; steps(2); const faceL = f.face;
    Player.x = 16 * 16; steps(2); const faceR = f.face;
    check("fans: she faces Buck on either side", faceL === -1 && faceR === 1, faceL + "/" + faceR);
    // Buck and his shots pass straight through a fan's cell
    Player.x = 7 * 16; Player.face = 1; Player.vx = 0; steps(5);
    press("right"); steps(60); release("right");
    const passed = Player.x > 12 * 16;
    Player.x = 6 * 16; Player.face = 1; Game.shots.length = 0; Player.fire();
    const shot = Game.shots[0]; steps(20);
    check("fans: Buck and his shots pass through her", passed && Game.shots.indexOf(shot) >= 0 && shot.x > 10 * 16, "shot x " + Math.round(shot.x));
    load(grid(40, 12, [[30, 9, "P"], [6, 9, "L"], [10, 9, "F"]]));
    Game.godMode = true; const law = Game.enemies[0]; law.face = 1; law.vx = Math.abs(law.vx); law.throwT = 0; law.cd = 99;
    let maxX = law.x; steps(240, function () { maxX = Math.max(maxX, law.x); });
    Game.godMode = false;
    check("fans: enemies walk through her", maxX > 11 * 16, "lawyer max x " + Math.round(maxX));
    // reactions: a kill within 12 tiles -> cheer + one bubble + one sound; rate-limited; far fans stay calm
    sounds.length = 0;
    load(grid(60, 12, [[2, 9, "P"], [8, 9, "F"], [40, 9, "F"], [12, 9, "L"], [14, 9, "L"]]));
    Game.godMode = true; steps(10);
    const nearF = Fans.list[0], farF = Fans.list[1];
    damageEnemy(Game.enemies[0], 99); steps(1);
    const b1 = Fans.bubble && Fans.bubble.fan === nearF && /BUCK|WOO|HERO/.test(Fans.bubble.text);
    check("fans: a kill nearby makes her cheer with a speech bubble and a cheer sound", nearF.cheerT > 0 && b1 && sounds.filter(function (n) { return n === "cheer"; }).length === 1,
      (Fans.bubble ? Fans.bubble.text : "no bubble") + " " + sounds.join(","));
    check("fans: fans more than 12 tiles away do not react", farF.cheerT === 0);
    const firstText = Fans.bubble && Fans.bubble.text;
    steps(30); damageEnemy(Game.enemies[Game.enemies.length - 1], 99); steps(1);
    check("fans: at most one bubble and cheer sound per 1.5 s", sounds.filter(function (n) { return n === "cheer"; }).length === 1 && Fans.bubble && Fans.bubble.text === firstText && nearF.cheerT > 0.9);
    Game.render();                       // bubble drawing smoke test
    steps(120);
    check("fans: the bubble disappears after about a second", Fans.bubble === null);
    Game.godMode = false;
    Input.reset();
  });

  safe("fans in the levels", function () {
    let ok = true; const info = [];
    for (let i = 0; i < LEVEL_DATA.length; i++) {
      Player.resetForGame(); Game.loadLevel(i);
      const L = Game.level, fs = Fans.list, n = fs.length;
      const countOk = L.isBoss ? n >= 2 && n <= 3 : n >= 3 && n <= 5;
      const floorOk = fs.every(function (f) { return L.isSolid(f.tx, f.ty + 1) || L.isPlatform(f.tx, f.ty + 1); });
      const looks = fs.map(function (f) { return f.variant; });
      const distinct = looks.every(function (v, k) { return looks.indexOf(v) === k; });
      if (!(countOk && floorOk && distinct)) ok = false;
      info.push("L" + (i + 1) + ": " + n + (floorOk ? "" : " floor!") + (distinct ? "" : " same-look!"));
    }
    check("fans: 3-5 per level (2-3 in the boss arena), all on floor or platforms, all different", ok, info.join(", "));
  });

  safe("sound coverage", function () {
    const needed = ["shot", "shotUp", "jump", "hit", "explode", "pickup", "health", "hurt", "door", "locked", "slam", "bubble",
      "deflect", "bosshurt", "die", "key", "powerup", "oneup", "checkpoint", "throw", "rev", "mower", "leap", "bigexplode", "grinder", "pullstart", "choke", "cheer"];
    const missing = needed.filter(function (n) { return !allSounds[n]; });
    check("sound: every effect was triggered by its game event", missing.length === 0, "missing: " + missing.join(","));
  });

  safe("flow", function () {
    // Title -> 3 levels -> boss -> victory, using the real game flow (hero teleported to each exit).
    Game.setState(STATE.TITLE); Input.reset();
    tap("enter");
    let ok = true;
    for (let lv = 0; lv < 3; lv++) {
      steps(Math.round(introTotal(Game.level.isBoss) * 60) + 5);
      ok = ok && Game.state === STATE.PLAY && Game.levelIndex === lv;
      const ex = Game.exit;
      Player.x = ex.x + 3; Player.y = ex.y + 4; steps(2);
      ok = ok && Game.state === STATE.LEVEL_COMPLETE;
      tap("enter"); steps(2); tap("enter");
    }
    steps(Math.round(introTotal(Game.level.isBoss) * 60) + 5);
    ok = ok && Game.state === STATE.BOSS;
    Game.godMode = true;
    Player.face = 1;
    let guard = 0;
    while (Game.state === STATE.BOSS && guard++ < 60 * 300) {
      Player.x = 40; Player.y = Game.level.pxH - 2 * TILE - Player.h;
      press("fire"); steps(1);
    }
    release("fire"); Game.godMode = false;
    check("flow: title -> 3 levels -> boss defeated by shooting -> victory", ok && Game.state === STATE.VICTORY,
      "state " + Game.state + " after " + (guard / 60).toFixed(0) + "s of boss fight");
    steps(150); tap("enter");
    check("flow: victory returns to title", Game.state === STATE.TITLE);
  });

  safe("music tracks", function () {
    // Track selection follows the game state: rock on the title, Valkyries everywhere else.
    Input.reset(); FX.clear();
    Game.setState(STATE.TITLE);
    check("tracks: title screen selects the rock title theme", Sound.track === "title" && Sound.tempo === 1, Sound.track);
    Sound.step = 37;
    tap("enter");
    check("tracks: Enter on the title switches to the Valkyries from their start",
      Game.state === STATE.LEVEL_INTRO && Sound.track === "valkyries" && Sound.step === 0, Sound.track + " step " + Sound.step);
    steps(Math.round(introTotal(Game.level.isBoss) * 60) + 5);
    Sound.step = 41; tap("pause"); tap("pause");
    check("tracks: pause and resume keep the Valkyries running", Game.state === STATE.PLAY && Sound.track === "valkyries" && Sound.step === 41, Sound.step);
    Game.completeLevel(); Game.tally.done = true; Game.nextLevel();
    check("tracks: level complete -> next level keeps the Valkyries running",
      Game.state === STATE.LEVEL_INTRO && Sound.track === "valkyries" && Sound.step === 41, Sound.step);
    Game.loadLevel(3); Game.setState(STATE.BOSS);
    Game.setState(STATE.GAME_OVER); Game.stateT = 0; steps(70); tap("enter");
    check("tracks: game over -> title brings back the title theme at normal tempo",
      Game.state === STATE.TITLE && Sound.track === "title" && Sound.tempo === 1 && Sound.step === 0, Sound.track + " tempo " + Sound.tempo);
    tap("enter"); Game.loadLevel(3); Game.setState(STATE.VICTORY); FX.clear(); steps(150); tap("enter");
    check("tracks: victory -> title brings back the title theme at normal tempo",
      Game.state === STATE.TITLE && Sound.track === "title" && Sound.tempo === 1, Sound.track + " tempo " + Sound.tempo);
    Input.reset();
  });

  safe("title mute", function () {
    Input.reset();
    Game.setState(STATE.TITLE);
    Sound.unlock();
    const wasPlaying = Sound.playing;
    if (!wasPlaying) Sound.startMusic();
    const m0 = Sound.muted;
    if (m0) Sound.toggleMute();
    tap("mute");
    const silenced = Sound.muted && Sound.master && Sound.master.gain.value === 0;
    tap("mute");
    const restored = !Sound.muted && Sound.master && Sound.master.gain.value === 1;
    check("title: M silences the title theme and M again brings it back", Game.state === STATE.TITLE && Sound.track === "title" && Sound.playing && silenced && restored,
      "silenced " + silenced + ", restored " + restored);
    if (m0) Sound.toggleMute();
    if (!wasPlaying) Sound.stopMusic();
  });

  safe("benchmark scenes", function () {
    // Brightness / colourfulness of the final (film-filtered) frame on fixed scenes.
    // Each scene is averaged over 4 frames to smooth out grain and flicker.
    const filmWas = Film.enabled, godWas = Game.godMode;
    Film.enabled = true;
    BENCH_SCENES.forEach(function (sc) {
      runShot(sc.spec);
      let luma = 0, chroma = 0, white = 0;
      const frames = 4, N = W * H;
      for (let f = 0; f < frames; f++) {
        Game.render(); present();
        const d = filmCtx.getImageData(0, 0, W, H).data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          luma += 0.299 * r + 0.587 * g + 0.114 * b;
          chroma += Math.max(r, g, b) - Math.min(r, g, b);
          if (r >= 250 && g >= 250 && b >= 250) white++;
        }
      }
      luma /= frames * N; chroma /= frames * N * 255; white /= frames * N;
      const info = "luma " + luma.toFixed(1) + " chroma " + chroma.toFixed(3) + " white " + (white * 100).toFixed(2) + "%";
      check("look: " + sc.name + " is bright (mean luma >= 70)", luma >= 70, info);
      check("look: " + sc.name + " is colourful (mean chroma >= 0.25)", chroma >= 0.25, info);
      check("look: " + sc.name + " has no blown-out highlights (<= 3% white)", white <= 0.03, info);
    });
    Film.enabled = filmWas; Game.godMode = godWas; Input.reset(); FX.clear();
  });

  safe("disc cutter", function () {
    // regular levels keep the blaster
    Player.resetForGame(); Game.loadLevel(0); Game.setState(STATE.PLAY);
    check("cutter: levels 1-3 start with the blaster", Player.weapon === "blaster");
    // the boss arena switches to the disc cutter
    Player.resetForGame(); Game.loadLevel(2); Game.setState(STATE.PLAY); Player.weapon = "mega";
    Game.completeLevel(); Game.tally.done = true; Game.nextLevel();
    check("cutter: the boss arena switches to the disc cutter", Game.level.isBoss && Player.weapon === "cutter", Player.weapon);
    steps(Math.round(introTotal(true) * 60) + 5);
    check("cutter: still the disc cutter when play begins", Game.state === STATE.BOSS && Player.weapon === "cutter");
    (function () {   // HUD shows DISC CUTTER
      TEXT_LOG.active = true; TEXT_LOG.items = []; drawHud(); TEXT_LOG.active = false;
      const texts = TEXT_LOG.items;
      check("cutter: HUD shows DISC CUTTER", texts.indexOf("DISC CUTTER") >= 0, texts.join("|"));
    })();
    // fire rate, size, spin, sound
    Game.godMode = true; Game.shots.length = 0; Game.stats.shots = 0; sounds.length = 0;
    press("fire"); steps(60); release("fire");
    const fired = Game.stats.shots;
    check("cutter: at most 3 saw blades per second", fired >= 2 && fired <= 3, fired + " blades");
    const b = Game.shots.filter(function (s) { return s.spin; })[0] || {};
    check("cutter: blades are at least 12 px and deal 3 damage", b.w >= 12 && b.h >= 12 && b.dmg === 3, b.w + "x" + b.h + " dmg " + b.dmg);
    const f0 = SPR.sawBlade[0].getContext("2d").getImageData(0, 0, 14, 14).data, f1 = SPR.sawBlade[1].getContext("2d").getImageData(0, 0, 14, 14).data;
    let fd = 0; for (let i = 0; i < f0.length; i++) if (f0[i] !== f1[i]) fd++;
    check("cutter: saw blade spins (frames differ)", SPR.sawBlade.length === 4 && fd > 8, fd);
    check("cutter: grinder sound instead of the blaster sound", sounds.indexOf("grinder") >= 0 && sounds.indexOf("shot") < 0);
    // face hit = 3 damage; shell hit = 0 damage, deflected with sparks
    Game.shots.length = 0;
    Boss.raised = true; Boss.claw = 1; Boss.state = "idle"; Boss.t = 5;
    const hp0 = Boss.hp, fb = Boss.face();
    Game.shots.push({ x: fb.x + 2, y: fb.y + 20, w: 14, h: 14, vx: 190, dmg: CONFIG.cutterDmg, img: SPR.sawBlade[0], face: 1, spin: true });
    updateHeroShots(DT, Game.level);
    check("cutter: a blade on the exposed face removes 3 boss health", Boss.hp === hp0 - 3, hp0 + " -> " + Boss.hp);
    Boss.raised = false; Boss.claw = 0;
    const sb = Boss.shell(), hp1 = Boss.hp, sparks0 = FX.parts.length;
    Game.shots.push({ x: sb.x + 30, y: sb.y + 10, w: 14, h: 14, vx: -190, dmg: CONFIG.cutterDmg, img: SPR.sawBlade[0], face: -1, spin: true });
    updateHeroShots(DT, Game.level);
    check("cutter: blades bounce off the shell with sparks and do no damage", Boss.hp === hp1 && Game.shots.some(function (s) { return s.deflected; }) && FX.parts.length - sparks0 >= 15,
      "hp " + hp1 + " -> " + Boss.hp + ", sparks " + (FX.parts.length - sparks0));
    // the blade reaches crayfish on the ground
    Game.godMode = false;
    load(grid(40, 12, [[2, 9, "P"], [9, 9, "K"]]));
    Player.weapon = "cutter"; Player.face = 1; Game.godMode = true;
    const cr = Game.enemies[0]; cr.cd = 99; const crHp = cr.hp;
    Player.fireBlade(); steps(20);
    check("cutter: a blade hits a crayfish on the ground", cr.hp < crHp || cr.dead, "hp " + crHp + " -> " + cr.hp);
    // kept after respawn in the arena; blaster after respawn in a regular level
    Game.godMode = false;
    Player.resetForGame(); Game.loadLevel(3); Game.setState(STATE.BOSS); Player.respawn();
    const inArena = Player.weapon;
    Player.resetForGame(); Game.loadLevel(0); Game.setState(STATE.PLAY); Player.weapon = "mega"; Player.respawn();
    check("cutter: kept after respawning in the arena, Mega Blaster still lost in regular levels", inArena === "cutter" && Player.weapon === "blaster", inArena + "/" + Player.weapon);
    Input.reset();
  });

  safe("petrol engines", function () {
    // three punks on screen at different distances: only the 2 nearest get an engine voice
    load(grid(40, 12, [[2, 9, "P"], [7, 9, "M"], [11, 9, "M"], [16, 9, "M"]]));
    Game.godMode = true;
    Game.enemies.forEach(function (e) { e.cd = 99; });
    steps(2);
    const near = Game.enemies.slice().sort(function (a, b) { return a.x - b.x; });
    const slots = Sound.engines.filter(function (s) { return s.id; });
    const ids = slots.map(function (s) { return s.id; });
    const g = function (e) { const s = Sound.engines.find(function (x) { return x.id === e; }); return s ? s.gain : 0; };
    check("engine: only the 2 nearest mowers have an engine sound", slots.length === 2 && ids.indexOf(near[0]) >= 0 && ids.indexOf(near[1]) >= 0 && ids.indexOf(near[2]) < 0,
      slots.length + " voices");
    check("engine: the nearer mower is louder", g(near[0]) > g(near[1]) && g(near[1]) > 0, g(near[0]).toFixed(3) + " > " + g(near[1]).toFixed(3));
    // pitch rises patrol < rev < charge
    const tp = Sound.engineTargets({ state: "patrol", dist: 50 }), tr = Sound.engineTargets({ state: "rev", throttle: 0.6, dist: 50 }),
      tc = Sound.engineTargets({ state: "charge", dist: 50 });
    check("engine: pitch and pulse rate rise from patrol to rev to charge", tp.freq < tr.freq && tr.freq < tc.freq && tp.rate < tr.rate && tr.rate < tc.rate,
      tp.freq + " < " + tr.freq.toFixed(0) + " < " + tc.freq);
    // pause, level end and off-screen release the voices
    tap("pause");
    const paused = Sound.engines.every(function (s) { return !s.id && s.gain === 0; });
    tap("pause"); steps(2);
    const resumed = Sound.engines.filter(function (s) { return s.id; }).length === 2;
    Game.completeLevel(); steps(2);
    const ended = Sound.engines.every(function (s) { return !s.id && s.gain === 0; });
    load(grid(80, 12, [[2, 9, "P"], [70, 9, "M"]])); Game.enemies[0].cd = 99; steps(2);
    const offscreen = Sound.engines.every(function (s) { return !s.id; });
    check("engine: silent while paused, after the level ends and for off-screen mowers", paused && resumed && ended && offscreen,
      [paused, resumed, ended, offscreen].join(","));
    // pull-start when an engine first runs; choke on death, after which his engine stops
    sounds.length = 0; load(grid(40, 12, [[2, 9, "P"], [9, 9, "M"]])); Game.enemies[0].cd = 99;
    steps(2);
    const pm = Game.enemies[0], started = sounds.indexOf("pullstart") >= 0 && Sound.engines.some(function (s) { return s.id === pm; });
    steps(30); const once = sounds.filter(function (n) { return n === "pullstart"; }).length === 1;
    damageEnemy(pm, 99); steps(2);
    check("engine: pull-start when it first runs, choke on death and the engine stops", started && once && sounds.indexOf("choke") >= 0 &&
      Sound.engines.every(function (s) { return s.id !== pm; }), sounds.join(","));
    // mute: engines play through the sfx bus under the master gain
    Sound.unlock();
    load(grid(40, 12, [[2, 9, "P"], [9, 9, "M"]])); Game.enemies[0].cd = 99; steps(2);
    const v = Sound.engineVoices && Sound.engineVoices[0];
    const m0 = Sound.muted; if (m0) Sound.toggleMute();
    tap("mute"); const silent = Sound.muted && Sound.master.gain.value === 0; tap("mute");
    check("engine: M mutes the engines (voices on the sfx bus)", !!v && v.bus === Sound.sfx && silent && !Sound.muted);
    if (m0) Sound.toggleMute();
    Game.godMode = false; Sound.setEngines([]); Input.reset();
  });

  safe("film", function () {
    Film.enabled = true;
    // uniform mid-grey frame: corners must come out darker than the centre (vignette)
    function lum(c2d, x, y, w, h) {
      const d = c2d.getImageData(x, y, w, h).data; let s = 0;
      for (let i = 0; i < d.length; i += 4) s += d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
      return s / (d.length / 4);
    }
    fillRect(0, 0, W, H, "#808080");
    Film.apply();
    const centre = lum(filmCtx, 150, 110, 20, 20), corner = lum(filmCtx, 0, 0, 12, 12);
    check("film: corners darker than centre (vignette)", corner < centre, "corner " + corner.toFixed(0) + " centre " + centre.toFixed(0));
    check("film: light vignette (corners at least 70% of the centre)", corner >= centre * 0.7, "corner " + corner.toFixed(0) + " centre " + centre.toFixed(0));
    // the grade keeps colour: a uniform saturated clay-court orange keeps or gains chroma
    function chromaOf(c2d) {
      const d = c2d.getImageData(40, 40, 240, 160).data; let s = 0;
      for (let i = 0; i < d.length; i += 4) s += Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]);
      return s / (d.length / 4) / 255;
    }
    fillRect(0, 0, W, H, "#c4643a");
    const cin = chromaOf(ctx); Film.apply(); const cout = chromaOf(filmCtx);
    check("film: grade keeps colour (saturated frame keeps its chroma)", cout >= cin, "in " + cin.toFixed(3) + " out " + cout.toFixed(3));
    fillRect(0, 0, W, H, "#808080"); Film.apply();
    // graded: warm shift on neutral grey
    const px = filmCtx.getImageData(160, 120, 1, 1).data;
    check("film: warm colour grade", px[0] > px[2] + 10, Array.from(px).join(","));
    // two consecutive frames of a static scene differ (grain/flicker)
    Game.setState(STATE.TITLE); Game.render(); Film.apply();
    const a = filmCtx.getImageData(0, 0, W, H).data.slice();
    Game.render(); Film.apply();
    const b = filmCtx.getImageData(0, 0, W, H).data;
    let diff = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i]) diff++;
    check("film: consecutive frames of a static scene differ", diff > 1000, diff + " px differ");
    // jitter stays within 0..1 px and does happen
    let okJ = true, moved = 0;
    for (let i = 0; i < 300; i++) { Film.apply(); if (Film.jx < 0 || Film.jx > 1 || Film.jy < 0 || Film.jy > 1) okJ = false; if (Film.jx || Film.jy) moved++; }
    check("film: gate-weave jitter within 0-1 px", okJ && moved > 0 && moved < 150, moved + "/300 frames jittered");
    let scratched = 0;
    for (let i = 0; i < 300; i++) { Film.apply(); if (Film.scratches.length) scratched++; }
    check("film: scratches appear on some frames", scratched > 10 && scratched < 300, scratched + "/300");
    // G toggle
    Input.reset();
    Game.setState(STATE.TITLE);
    tap("film");
    const offAfterG = !Film.enabled;
    Game.render(); present();
    const sx = 100, sy = 100, sc = displayScale;
    const raw = ctx.getImageData(sx, sy, 1, 1).data, shown = screenCtx.getImageData(sx * sc, sy * sc, 1, 1).data;
    check("film: G turns the filter off (screen shows the raw frame)", offAfterG && raw[0] === shown[0] && raw[1] === shown[1] && raw[2] === shown[2],
      Array.from(raw).join(",") + " vs " + Array.from(shown).join(","));
    tap("film");
    check("film: G again turns it back on", Film.enabled);
  });

  safe("performance", function () {
    Player.resetForGame(); Game.loadLevel(0); Game.setState(STATE.PLAY);
    const t0 = performance.now();
    for (let i = 0; i < 300; i++) { Game.update(DT); Game.render(); present(); }
    const ms = (performance.now() - t0) / 300;
    check("performance: update+render+film filter under 8 ms per frame", Film.enabled && ms < 8, ms.toFixed(2) + " ms/frame, film " + Film.enabled);
    Player.resetForGame(); Game.loadLevel(3); Game.setState(STATE.BOSS); Game.godMode = true;
    const t1 = performance.now();
    for (let i = 0; i < 300; i++) { Game.update(DT); Game.render(); present(); }
    const ms2 = (performance.now() - t1) / 300; Game.godMode = false;
    check("performance: boss arena under 8 ms per frame", Film.enabled && ms2 < 8, ms2.toFixed(2) + " ms/frame");
  });

  // ---------------- report ----------------
  check("no console errors", TEST.errors.length === 0, TEST.errors.join(" | "));
  const pass = R.filter(function (r) { return r.ok; }).length;
  const lines = R.map(function (r) { return (r.ok ? "PASS " : "FAIL ") + r.name + (r.info && !r.ok ? "   [" + r.info + "]" : (r.info ? "   (" + r.info + ")" : "")); });
  lines.push("", (pass === R.length ? "TESTS PASS " : "TESTS FAIL ") + pass + "/" + R.length);
  const out = document.getElementById("test-out");
  out.textContent = lines.join("\n");
  out.style.display = "block";
  document.title = (pass === R.length ? "TESTS PASS " : "TESTS FAIL ") + pass + "/" + R.length;
}

// Fixed benchmark scenes for the brightness/colour checks (runShot specs).
const BENCH_SCENES = [
  { name: "title", spec: "title" },
  { name: "L1 courts", spec: "play,0,40,13,60" },
  { name: "L2 creek bank", spec: "play,1,12,26,60" },
  { name: "L3 clubhouse", spec: "play,2,30,12,60" },
  { name: "L3 hall", spec: "play,2,120,18,60" },
  { name: "boss arena", spec: "boss,3,3,12,200" },
];

// Screenshot mode for visual checks: #shot=<state>,<level>,<tileX>,<tileY>,<steps>
// e.g. #shot=play,0,40,13,30  or  #shot=title  or  #shot=boss,3,5,12,400
function runShot(spec) {
  const p = spec.split(",");
  const what = p[0];
  if (spec.indexOf("nofilm") >= 0) Film.enabled = false;
  Game.headless = true;
  Input.reset();
  if (what === "sprites") {            // sprite sheet debug screen
    fillRect(0, 0, W, H, "#3a4a6a");
    const H_ = SPR.hero;
    const frames = [H_.idle, H_.run[0], H_.run[1], H_.run[2], H_.jump, H_.shoot, H_.shootJump, H_.hurt, H_.climb[0], H_.climb[1]];
    frames.forEach(function (s, i) { ctx.drawImage(s.r, 4 + i * 24, 4); ctx.drawImage(s.l, 4 + i * 24, 40); });
    [SPR.lawyer[0], SPR.lawyer[1], SPR.lawyerThrow, SPR.cray[0], SPR.cray[1], SPR.punk.walk[0], SPR.punk.walk[1], SPR.punk.rev].forEach(function (s, i) {
      ctx.drawImage(s.r, 4 + i * 30, 80); ctx.drawImage(s.fl, 4 + i * 30, 116);
    });
    [SPR.ball, SPR.trophy, SPR.rivella, SPR.cervelat, SPR.life, SPR.megagun, SPR.keys.R, SPR.keys.U, SPR.keys.G, SPR.briefcase.r,
     SPR.bubble, SPR.shot, SPR.shotUp, SPR.blasterIcon, SPR.megaIcon, IMG.head, SPR.headBack].forEach(function (img, i) {
      ctx.drawImage(img, 4 + i * 18, 156);
    });
    // clubhouse props + furniture (right half of the sheet's lower area)
    let pxs = 4;
    ["c", "i", "q", "N", "$", "p", "x", "j"].forEach(function (ch) { const c = propCanvas(ch, 0); ctx.drawImage(c, 160 + (pxs - 4), 120); pxs += c.width + 2; });
    const tsI = buildTileset("hall");
    [tsI.wallpaper[0], tsI.wainscot, tsI.counter, tsI.table].forEach(function (img, i) { ctx.drawImage(img, 160 + i * 18, 138); });
    ctx.drawImage(tsI.counterTaps, 236, 130);
    const ts = buildTileset("court"), ts2 = buildTileset("creek"), ts3 = buildTileset("hall");
    [ts, ts2, ts3].forEach(function (t, j) {
      [t.solidTop[0], t.solidTop[1], t.solidTop[2], t.solid[1], t.alt[2], t.plat[2], t.ladder, t.water[0], t.waterTop[0], t.door.R, t.door.U, t.door.G, t.deco.n, t.deco.f,
       t.deco.lTop, t.deco.b, t.deco.v].forEach(function (img, i) { ctx.drawImage(img, 4 + i * 20, 180 + j * 19); });
    });
    present();
    return;
  }
  if (what === "cheer") {              // #shot=cheer,<level>,<fan>: Buck next to a fan who is cheering him
    Player.resetForGame(); Game.score = 4200; Game.loadLevel(+p[1] || 0);
    Game.setState(Game.level.isBoss ? STATE.BOSS : STATE.PLAY); Game.godMode = true;
    const f = Fans.list[+p[2] || 0];
    Player.x = f.x - 40; Player.y = f.y + FAN_H - 1 - Player.h; Player.face = 1; Camera.snap(Player, Game.level);
    for (let i = 0; i < 20; i++) { Game.update(DT); Input.endStep(); }
    Fans.react(f.x + FAN_W / 2, f.y + 10, "kill");
    for (let i = 0; i < 12; i++) { Game.update(DT); Input.endStep(); }
    Game.render(); present();
    return;
  }
  if (what === "fans") {               // all fan looks: idle, wave, jump (2x, facing right and left)
    fillRect(0, 0, W, H, "#5a8a40");
    SPR.fans.forEach(function (f, i) {
      FAN_FRAMES.forEach(function (fr, j) {
        ctx.drawImage(f[fr].r, 6 + i * 39, 10 + j * 36); ctx.drawImage(f[fr].l, 6 + i * 39 + 18, 10 + j * 36);
      });
    });
    present();
    return;
  }
  if (what === "title" || what === "gameover" || what === "victory") {
    Game.setState(what === "title" ? STATE.TITLE : what === "gameover" ? STATE.GAME_OVER : STATE.VICTORY);
    Game.stateT = 3; Game.score = 123450;
    for (let i = 0; i < 30; i++) Game.update(DT);
  } else {
    Player.resetForGame(); Game.score = 4200;
    Game.loadLevel(+p[1] || 0);
    if (what === "intro") { Game.stateT = +p[2] || 0; Game.render(); present(); return; }
    Game.setState(Game.level.isBoss ? STATE.BOSS : STATE.PLAY);
    Game.godMode = true;
    if (p[2]) { Player.x = +p[2] * TILE; Player.y = +p[3] * TILE; Camera.snap(Player, Game.level); }
    const n = +p[4] || 30;
    for (let i = 0; i < n; i++) {
      if (what === "fire" && i % 10 === 0) Player.fire();
      Game.update(DT); Input.endStep();
    }
    if (what === "complete") { Game.completeLevel(); for (let i = 0; i < 200; i++) Game.update(DT); }
    if (what === "pause") Game.setState(STATE.PAUSE);
  }
  Game.render();
  present();
}

boot();
