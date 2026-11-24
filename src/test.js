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

// fixture: the former male lawyer (the female lawyer frames must differ from it)
const OLD_MALE_LAWYER_TOP = [
  ".....hhhhh......", "....hhhhhhh.....", "....hhkkskk.....", "....hsSSkSSk....",
  "....ssssssss....", "....sskwwwwk....", ".....skkkks.....", "......sSs.......",
  "...nnnwtwnnn....", "..nnnnwtwnnnn...", "..nnnnwtwnnnn...", "..nnnnwttnnnn...",
  "..nNnnwttnnnNn..", "..nNnnntnnnnNn..", "..nNnnnnnnnnNn..", ".BBBBnnnnnnnNs..",
  ".BbbBnnnnnnnn...", ".BbbBNNNNNNNN...",
];

function runTests() {
  const R = TEST.results;
  let checkSuffix = "";           // set by bothFilmPaths: " [gl film]" / " [cpu film]"
  function check(name, cond, info) { R.push({ name: name + checkSuffix, ok: !!cond, info: info === undefined ? "" : String(info) }); }
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
  // wide boss arena: put the hero on the floor in front of the boss and bring the camera along
  function nearBoss() {
    Player.x = 23 * TILE + 2; Player.y = Game.level.pxH - 2 * TILE - Player.h; Player.vx = 0; Player.vy = 0; Player.face = 1;
    Camera.snap(Player, Game.level);
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
  // runs a block of film checks once on the GPU grade and once on the CPU grade
  function bothFilmPaths(name, fn) {
    ["gl", "cpu"].forEach(function (m) {
      safe(name + " " + m, function () {
        const was = Film.mode;
        if (Film.setMode(m) !== m) { check(name + ": " + m + " film path available", false); return; }
        checkSuffix = " [" + m + " film]";
        try { fn(); } finally { checkSuffix = ""; Film.setMode(was); }
      });
    });
  }

  // ---------------- rendering / engine ----------------
  safe("display", function () {
    if (Touch.on) {
      const L = Touch.computeLayout(), dpr = window.devicePixelRatio || 1;
      check("display: touch mode fits the picture between the bars", screenCanvas.width === Math.round(W * L.s * dpr) && Math.abs(displayScale - L.s * dpr) < 1e-9,
        "window " + window.innerWidth + "x" + window.innerHeight + " -> canvas " + screenCanvas.width + "x" + screenCanvas.height);
    } else {
      const s = Math.max(1, Math.floor(Math.min(window.innerWidth / W, window.innerHeight / H)));
      check("display: integer scale fits window", screenCanvas.width === W * s && screenCanvas.height === H * s,
        "window " + window.innerWidth + "x" + window.innerHeight + " -> canvas " + screenCanvas.width + "x" + screenCanvas.height);
    }
    check("display: back buffer is 320x240", buffer.width === 320 && buffer.height === 240);
    check("film: GPU path available in the test browser", !!filmGL,
      filmGL ? filmGLRenderer() : "no WebGL (run_tests.py starts Chrome/Edge with --enable-unsafe-swiftshader for software WebGL)");
    check("display: smoothing disabled", ctx.imageSmoothingEnabled === false && screenCtx.imageSmoothingEnabled === false);
  });

  safe("timestep", function () {
    const draws = {};
    function simulate(hz) {
      const real = Game.update.bind(Game), realRender = Game.render.bind(Game);
      let n = 0, r = 0, stale = 0, lastUpdT = 0;
      Game.update = function (dt) { n++; real(dt); lastUpdT = Game.time; };
      Game.render = function () { r++; if (Game.time !== lastUpdT) stale++; realRender(); };
      Game.headless = true; Game.setState(STATE.TITLE);
      lastTime = 0; acc = 0; rateT = 0; fpsCount = 0; upsCount = 0;
      for (let i = 0; i <= hz; i++) frame(1000 + i * 1000 / hz);
      const upd = n, ren = r;
      for (let i = hz + 1; i <= hz + 3; i++) frame(1000 + i * 1000 / hz);   // complete the 1 s FPS window
      Game.update = real; Game.render = realRender;
      draws[hz] = { renders: ren, stale: stale, fps: Game.fps, updates: upd };
      return upd;
    }
    const n60 = simulate(60), n144 = simulate(144), n30 = simulate(30), n120 = simulate(120);
    check("timestep: 60 updates/s at 60, 120, 144 and 30 Hz", Math.abs(n60 - 60) <= 1 && Math.abs(n144 - 60) <= 1 && Math.abs(n30 - 60) <= 1 && Math.abs(n120 - 60) <= 1,
      "60Hz:" + n60 + " 120Hz:" + n120 + " 144Hz:" + n144 + " 30Hz:" + n30);
    check("timestep: at 120 and 144 Hz at most 61 frames drawn per second, debug FPS at most 61",
      draws[144].renders <= 61 && draws[120].renders <= 61 && draws[144].fps <= 61 && draws[120].fps <= 61, JSON.stringify(draws[144]) + " " + JSON.stringify(draws[120]));
    check("timestep: at 60 Hz a frame is drawn on (about) every update", draws[60].renders >= draws[60].updates - 2 && draws[60].renders >= 58, JSON.stringify(draws[60]));
    check("timestep: every drawn frame shows the state after the latest update",
      [60, 120, 144, 30].every(function (h) { return draws[h].stale === 0; }), JSON.stringify(draws));
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

  safe("input sources", function () {
    function key(code, type) { window.dispatchEvent(new KeyboardEvent(type || "keydown", { code: code, key: code, cancelable: true })); }
    Input.reset();
    // simulate keeps its edge semantics: edge on the first press only, cleared per step
    Input.simulate("jump", true);
    const e1 = Input.pressed("jump"); Input.endStep();
    Input.simulate("jump", true);
    const e2 = Input.pressed("jump");
    Input.simulate("jump", false);
    check("input: simulate press edge once, held until released", e1 && !e2 && !Input.down("jump"));
    // a key and a simulated hold of the same action: held until both let go, one edge only
    Input.reset();
    key("ArrowRight"); Input.endStep();
    Input.simulate("right", true);
    const noEdge = !Input.pressed("right");
    Input.simulate("right", false);
    const stillKb = Input.down("right");
    key("ArrowRight", "keyup");
    check("input: key and simulate hold one action; released only when both let go", noEdge && stillKb && !Input.down("right"));
    Input.reset();
    Input.simulate("right", true); key("ArrowRight"); key("ArrowRight", "keyup");
    const stillSim = Input.down("right"); Input.simulate("right", false);
    check("input: releasing the key leaves a simulated hold", stillSim && !Input.down("right"));
    // blur releases the keyboard only
    Input.reset();
    key("KeyX"); Input.simulate("jump", true);
    window.dispatchEvent(new Event("blur"));
    check("input: blur releases keys but not simulated holds", !Input.down("fire") && Input.down("jump"));
    Input.reset();
    check("input: reset clears every source", !Input.down("jump") && Object.keys(Input.src).length === 0);
  });

  // ---------------- touch mode (src/touch.js) ----------------
  // touch tests force the mode they need and restore the mode the suite runs in (#test&touch)
  const touchWasOn = Touch.on;
  // fake viewport size (window.innerWidth/innerHeight) plus a resize event; restoreViewport undoes it
  const vpDesc = { w: Object.getOwnPropertyDescriptor(window, "innerWidth"), h: Object.getOwnPropertyDescriptor(window, "innerHeight") };
  let vpFaked = false;
  function setViewport(w, h) {
    Object.defineProperty(window, "innerWidth", { configurable: true, get: function () { return w; } });
    Object.defineProperty(window, "innerHeight", { configurable: true, get: function () { return h; } });
    vpFaked = true;
    window.dispatchEvent(new Event("resize"));
  }
  function restoreViewport() {
    if (!vpFaked) return;
    if (vpDesc.w) Object.defineProperty(window, "innerWidth", vpDesc.w); else delete window.innerWidth;
    if (vpDesc.h) Object.defineProperty(window, "innerHeight", vpDesc.h); else delete window.innerHeight;
    vpFaked = false;
    window.dispatchEvent(new Event("resize"));
  }
  // touch tests force the mode they need (landscape when the runner window is portrait) and
  // restore the mode the suite runs in (#test&touch)
  function withTouch(on, fn) {
    const was = Touch.on;
    const fake = on && window.innerHeight > window.innerWidth && !vpFaked;
    if (fake) setViewport(844, 390);
    if (on && !was) Touch.enable(); else if (!on && was) Touch.disable();
    try { fn(); } finally {
      if (fake) restoreViewport();
      if (was && !Touch.on) Touch.enable(); else if (!was && Touch.on) Touch.disable();
    }
  }

  safe("touch mode", function () {
    check("touch: hash flag parsing", touchHashFlag("#touch") && touchHashFlag("#debug&touch") && touchHashFlag("#level=3&touch") && touchHashFlag("#test&touch") &&
      !touchHashFlag("#untouched") && !touchHashFlag("#touchy") && !touchHashFlag("") && !touchHashFlag("#level=3"));
    check("touch: mode matches the URL in the headless runner (no coarse pointer)", touchWasOn === touchHashFlag(location.hash), "on " + touchWasOn + ", hash " + location.hash);
    withTouch(true, function () {
      check("touch: enable shows the control canvas", document.getElementById("pad").style.display === "block" && document.documentElement.classList.contains("touch"));
    });
    withTouch(false, function () {
      check("touch: off hides the control canvas", document.getElementById("pad").style.display === "none" && !document.documentElement.classList.contains("touch"));
    });
  });

  safe("touch layout", function () {
    function rectOf(c) { return c.r !== undefined ? { x: c.x - c.r, y: c.y - c.r, w: 2 * c.r, h: 2 * c.r } : c; }
    function inside(a, b) { return a.x >= b.x - 0.01 && a.y >= b.y - 0.01 && a.x + a.w <= b.x + b.w + 0.01 && a.y + a.h <= b.y + b.h + 0.01; }
    function overlaps(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
    [[844, 390, { l: 47, r: 47, t: 0, b: 21 }], [844, 390, { l: 47, r: 47, t: 0, b: 0 }], [932, 430, null], [1024, 768, null], [667, 375, null], [2340, 1080, null]].forEach(function (v) {
      const L = touchLayout(v[0], v[1], v[2]), ins = v[2] || { l: 0, r: 0, t: 0, b: 0 };
      const safeBox = { x: ins.l, y: ins.t, w: v[0] - ins.l - ins.r, h: v[1] - ins.t - ins.b };
      const name = "touch layout " + v[0] + "x" + v[1] + (v[2] ? " insets" : "");
      const p = L.pic;
      check(name + ": picture 4:3, centred in the safe box", Math.abs(p.w / p.h - 4 / 3) < 1e-9 &&
        Math.abs(p.x + p.w / 2 - (safeBox.x + safeBox.w / 2)) < 0.01 && Math.abs(p.y + p.h / 2 - (safeBox.y + safeBox.h / 2)) < 0.01 && inside(p, safeBox), JSON.stringify(p));
      check(name + ": both bars at least 120 px", L.left.w >= 120 - 1e-9 && L.right.w >= 120 - 1e-9, L.left.w.toFixed(1));
      const ctrls = [L.pad, L.jump, L.fire, L.util.pause, L.util.mute, L.util.film, L.util.fullscreen].map(rectOf);
      check(name + ": every control inside a bar, none over the picture",
        ctrls.every(function (c) { return (inside(c, L.left) || inside(c, L.right)) && !overlaps(c, p); }));
      let clash = false;
      for (let i = 0; i < ctrls.length; i++) for (let j = i + 1; j < ctrls.length; j++) if (overlaps(ctrls[i], ctrls[j])) clash = true;
      check(name + ": controls don't overlap each other", !clash);
      check(name + ": Jump and Fire at least 56 px across", 2 * L.jump.r >= 56 && 2 * L.fire.r >= 56, (2 * L.fire.r).toFixed(1));
    });
    const tall = touchLayout(932, 430, null);
    check("touch layout 932x430: picture fills the height", Math.abs(tall.pic.h - 430) < 0.01 && Math.abs(tall.pic.w - 573.33) < 0.01, tall.pic.w + "x" + tall.pic.h);
    const tab = touchLayout(1024, 768, null);
    check("touch layout 1024x768: picture scaled below full height to keep 120 px bars", tab.pic.h < 768 && Math.abs(tab.left.w - 120) < 0.01, tab.pic.h);
    check("touch layout: portrait flagged", touchLayout(390, 844, null).portrait && !touchLayout(844, 390, null).portrait);
  });

  safe("touch display", function () {
    withTouch(true, function () {
      const L = Touch.layout, dpr = window.devicePixelRatio || 1, st = screenCanvas.style;
      check("touch display: canvas at the picture rect, fractional scale in device px",
        st.position === "fixed" && Math.abs(parseFloat(st.left) - L.pic.x) < 0.01 && Math.abs(parseFloat(st.top) - L.pic.y) < 0.01 && Math.abs(parseFloat(st.width) - L.pic.w) < 0.01 &&
        screenCanvas.width === Math.round(W * L.s * dpr) && displayScale === L.s * dpr, st.left + "," + st.top + " " + st.width + " s " + L.s);
      if (window.innerWidth <= 900 && window.innerHeight <= 430) check("touch display, phone-size window: scale above 1", L.s > 1, window.innerWidth + "x" + window.innerHeight + " s " + L.s);
      Game.setState(STATE.TITLE); Game.render(); present();
      check("touch display: smoothing off", screenCtx.imageSmoothingEnabled === false);
      // nearest neighbour: every device pixel shows a colour of the raw frame (no blended colours)
      const filmWas = Film.enabled; Film.enabled = false;
      Game.render(); present();
      const raw = ctx.getImageData(0, 0, W, H).data, cols = {};
      for (let i = 0; i < raw.length; i += 4) cols[(raw[i] << 16) | (raw[i + 1] << 8) | raw[i + 2]] = true;
      const shown = screenCtx.getImageData(0, 0, Math.min(400, screenCanvas.width), Math.min(300, screenCanvas.height)).data;
      let blended = 0;
      for (let i = 0; i < shown.length; i += 4) if (!cols[(shown[i] << 16) | (shown[i + 1] << 8) | shown[i + 2]]) blended++;
      Film.enabled = filmWas;
      check("touch display: no blended colours after scaling", blended === 0, blended + " px");
    });
    withTouch(false, function () {
      const s = Math.max(1, Math.floor(Math.min(window.innerWidth / W, window.innerHeight / H)));
      check("touch display: off again restores the integer desktop scale, centred by the page",
        screenCanvas.width === W * s && screenCanvas.style.position === "" && screenCanvas.style.left === "" && displayScale === s);
    });
  });

  // synthetic finger on the control canvas
  function ptr(type, id, x, y) {
    const e = new PointerEvent(type, { pointerId: id, pointerType: "touch", clientX: x, clientY: y, bubbles: true, cancelable: true });
    document.getElementById("pad").dispatchEvent(e);
    return e;
  }
  function padAt(deg, f) {
    const P = Touch.layout.pad, a = deg * Math.PI / 180, d = P.r * (f || 0.7);
    return [P.x + Math.cos(a) * d, P.y + Math.sin(a) * d];      // 0 = right, 90 = down (screen y)
  }
  function at(c) { return [c.x + (c.w ? c.w / 2 : 0), c.y + (c.h ? c.h / 2 : 0)]; }

  safe("touch controls", function () {
    withTouch(true, function () {
      const L = Touch.layout, R = padAt(0), Lf = padAt(180), DR = padAt(45), D = padAt(90), F = at(L.fire), J = at(L.jump);
      // pad right walks right
      load(grid(60, 12, [[5, 9, "P"]]));
      let x0 = Player.x;
      ptr("pointerdown", 11, R[0], R[1]); steps(30);
      check("touch: pad right holds 'right' and the hero walks right", Input.down("right") && Player.x > x0 + 20, (Player.x - x0).toFixed(1));
      // slide right -> left in one move
      ptr("pointermove", 11, Lf[0], Lf[1]);
      check("touch: sliding right -> left switches at once", Input.down("left") && !Input.down("right"));
      // slid off the pad: keeps the last direction
      ptr("pointermove", 11, L.pad.x, L.pad.y - L.pad.r * 3);
      check("touch: finger slid off the pad keeps its direction", Input.down("left") && !Input.down("up"));
      ptr("pointerup", 11, L.pad.x, L.pad.y - L.pad.r * 3);
      check("touch: lifting releases the pad", !Input.down("left") && !Input.down("right"));
      // dead zone
      ptr("pointerdown", 11, L.pad.x, L.pad.y);
      check("touch: pad centre is a dead zone", !PAD_DIRS.some(function (a) { return Input.down(a); }));
      ptr("pointerup", 11, L.pad.x, L.pad.y);
      // diagonal down-right: kneels facing right
      load(grid(60, 12, [[5, 9, "P"]])); Player.face = -1;
      ptr("pointerdown", 12, DR[0], DR[1]); steps(10);
      check("touch: pad down-right holds down and right, hero kneels facing right", Input.down("down") && Input.down("right") && Player.kneeling && Player.face === 1);
      ptr("pointerup", 12, DR[0], DR[1]); steps(2);
      // Fire held for 1 s: fire-rate shots
      load(grid(80, 12, [[5, 9, "P"]])); Game.stats.shots = 0;
      ptr("pointerdown", 13, F[0], F[1]); steps(60);
      const shots = Game.stats.shots;
      ptr("pointerup", 13, F[0], F[1]);
      check("touch: holding Fire for 1 s fires at the fire rate", shots >= CONFIG.fireRate - 1 && shots <= CONFIG.fireRate + 1, shots);
      // pressed look while held
      function goldPx(c) {
        const dpr = window.devicePixelRatio || 1, cv = document.getElementById("pad");
        const d = cv.getContext("2d").getImageData(Math.round((c.x - c.r) * dpr), Math.round((c.y - c.r) * dpr), Math.round(2 * c.r * dpr), Math.round(2 * c.r * dpr)).data;
        let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] === 255 && d[i + 1] === 216 && d[i + 2] === 64) n++;
        return n;
      }
      const restGold = goldPx(L.fire);
      ptr("pointerdown", 13, F[0], F[1]);
      const heldGold = goldPx(L.fire);
      ptr("pointerup", 13, F[0], F[1]);
      check("touch: Fire is drawn in its pressed look while held", restGold === 0 && heldGold > 20 && goldPx(L.fire) === 0, restGold + " -> " + heldGold);
      // short vs held Jump
      function apexTouch(holdSteps) {
        load(grid(30, 12, [[5, 9, "P"]]));
        const y0 = Player.y; let minY = y0;
        ptr("pointerdown", 14, J[0], J[1]);
        for (let i = 0; i < 80; i++) { if (i === holdSteps) ptr("pointerup", 14, J[0], J[1]); steps(1); minY = Math.min(minY, Player.y); }
        ptr("pointerup", 14, J[0], J[1]);
        return y0 - minY;
      }
      const full = apexTouch(80), short = apexTouch(4);
      check("touch: short Jump tap jumps lower than a held Jump", short < full * 0.7 && full > 40, full.toFixed(1) + " / " + short.toFixed(1));
      // slide Fire -> Jump
      load(grid(30, 12, [[5, 9, "P"]])); sounds.length = 0;
      ptr("pointerdown", 15, F[0], F[1]); steps(2);
      ptr("pointermove", 15, J[0], J[1]);
      const slid = Input.down("jump") && !Input.down("fire") && Input.pressed("jump");
      steps(3); ptr("pointerup", 15, J[0], J[1]);
      check("touch: sliding from Fire onto Jump releases fire and jumps", slid && sounds.indexOf("jump") >= 0);
      // three fingers: run, fire and jump together
      load(grid(80, 12, [[5, 9, "P"]])); Game.stats.shots = 0; x0 = Player.x; const y0 = Player.y;
      ptr("pointerdown", 21, R[0], R[1]); ptr("pointerdown", 22, F[0], F[1]); ptr("pointerdown", 23, J[0], J[1]);
      const all3 = Input.down("right") && Input.down("fire") && Input.down("jump");
      let minY = y0; for (let i = 0; i < 20; i++) { steps(1); minY = Math.min(minY, Player.y); }
      check("touch: three fingers run, fire and jump together", all3 && Player.x > x0 && Game.stats.shots >= 1 && minY < y0 - 20,
        "dx " + (Player.x - x0).toFixed(1) + " shots " + Game.stats.shots + " rise " + (y0 - minY).toFixed(1));
      // cancel releases only that finger
      ptr("pointercancel", 22, F[0], F[1]);
      check("touch: a cancelled touch releases only its own actions", !Input.down("fire") && Input.down("right") && Input.down("jump"));
      // blur releases every finger
      window.dispatchEvent(new Event("blur"));
      check("touch: losing focus releases all fingers", !Input.down("right") && !Input.down("jump") && Object.keys(Touch.fingers).length === 0);
      // key and finger hold the same action
      Input.reset();
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "ArrowRight", key: "ArrowRight" }));
      ptr("pointerdown", 24, R[0], R[1]); ptr("pointerup", 24, R[0], R[1]);
      const kbStill = Input.down("right");
      window.dispatchEvent(new KeyboardEvent("keyup", { code: "ArrowRight", key: "ArrowRight" }));
      check("touch: key and finger on Right: lifting the finger keeps walking until the key is up", kbStill && !Input.down("right"));
      // pad Down + Jump drops through a one-way ledge
      const items = [[3, 5, "P"]];
      for (let x = 1; x < 8; x++) items.push([x, 6, "="]);
      load(grid(30, 12, items));
      const top = Player.y + Player.h;
      ptr("pointerdown", 25, D[0], D[1]); steps(10);
      ptr("pointerdown", 26, J[0], J[1]); steps(2); ptr("pointerup", 26, J[0], J[1]); steps(60);
      ptr("pointerup", 25, D[0], D[1]);
      check("touch: pad Down + Jump drops through a one-way ledge", top === 96 && Player.onGround && Math.abs(Player.y + Player.h - 160) < 1, top + " -> " + (Player.y + Player.h));
      // utility buttons act like P, M and G (on release inside the button)
      load(grid(30, 12, [[5, 9, "P"]]));
      function tapUtil(name) { const p = at(L.util[name]); ptr("pointerdown", 30, p[0], p[1]); ptr("pointerup", 30, p[0], p[1]); steps(1); }
      tapUtil("pause");
      const paused = Game.state === STATE.PAUSE;
      tapUtil("pause");
      check("touch: Pause button pauses and resumes like P", paused && Game.state === STATE.PLAY, Game.state);
      const m0 = Sound.muted; tapUtil("mute"); const m1 = Sound.muted; tapUtil("mute");
      check("touch: Mute button toggles the sound like M", m1 === !m0 && Sound.muted === m0);
      const f0 = Film.enabled; tapUtil("film"); const f1 = Film.enabled; tapUtil("film");
      check("touch: Film button toggles the filter like G", f1 === !f0 && Film.enabled === f0);
      // a press that slides off the button before release does nothing
      const pp = at(L.util.pause);
      ptr("pointerdown", 31, pp[0], pp[1]); ptr("pointerup", 31, L.pic.x + 50, L.pic.y + 50); steps(1);
      check("touch: releasing outside a utility button does nothing", Game.state === STATE.PLAY);
      // no long-press menu
      const cm = new MouseEvent("contextmenu", { bubbles: true, cancelable: true });
      document.getElementById("pad").dispatchEvent(cm);
      check("touch: long press opens no context menu", cm.defaultPrevented);
      Input.reset();
    });
  });

  safe("title music start", function () {
    const keep = { ready: Sound.ready, startMusic: Sound.startMusic, unlock: Sound.unlock, ac: Sound.ac, playing: Sound.playing,
      playEvent: Sound.playEvent, step: Sound.step, nextTime: Sound.nextTime, track: Sound.track, timer: Sound.timer };
    const restore = function () {
      Sound.ready = keep.ready; Sound.startMusic = keep.startMusic; Sound.unlock = keep.unlock; Sound.playEvent = keep.playEvent;
    };
    try {
      // 5.5 sound first (keyboard): sound not on -> the first Enter keeps the title; the next Enter starts the game
      Input.reset(); Game.startHash = ""; Game.setState(STATE.TITLE);
      let ready = false;
      Sound.ready = function () { return ready; };
      steps(3);
      let hint = "";
      for (let i = 0; i < 90 && hint.indexOf(promptText("sound")) < 0; i++) {   // the prompt blinks: render until it shows
        TEXT_LOG.active = true; TEXT_LOG.items = []; Game.render(); TEXT_LOG.active = false;
        hint = TEXT_LOG.items.join("|"); TEXT_LOG.items = []; steps(1);
      }
      const want = Touch.on ? ["TAP FOR SOUND"] : ["PRESS ANY KEY", "FOR SOUND"];
      ready = true;                                          // this key turns the sound on
      tap("enter"); steps(1);
      const stayed = Game.state === STATE.TITLE;
      tap("enter"); steps(1);
      check("title sound first: before the sound is on the title says PRESS ANY KEY FOR SOUND; the first Enter only starts the sound, the next starts the game",
        want.every(function (w) { return hint.indexOf(w) >= 0; }) && hint.indexOf(promptText("start")) < 0 && stayed && Game.state === STATE.LEVEL_INTRO,
        "hint " + hint.slice(-80) + ", stayed " + stayed + ", state " + Game.state);
      // sound already running (autoplay) or no Web Audio at all: Enter starts at once
      Game.setState(STATE.TITLE); ready = true; steps(3); tap("enter"); steps(1);
      const runningStarts = Game.state === STATE.LEVEL_INTRO;
      Sound.ready = keep.ready;
      const realSupported = Sound.supported;
      Sound.supported = function () { return false; };
      Game.setState(STATE.TITLE); steps(3); tap("enter"); steps(1);
      const noAudioStarts = Game.state === STATE.LEVEL_INTRO;
      Sound.supported = realSupported;
      check("title sound first: with the sound running, or no Web Audio, Enter starts the game at once", runningStarts && noAudioStarts);
      // the same with taps in touch mode
      withTouch(true, function () {
        const P = Touch.layout.pic, c = [P.x + P.w / 2, P.y + P.h / 2];
        const tapPic = function () { ptr("pointerdown", 51, c[0], c[1]); ptr("pointerup", 51, c[0], c[1]); steps(1); };
        Input.reset(); Game.setState(STATE.TITLE);
        ready = false; Sound.ready = function () { return ready; };
        steps(3);
        ready = true; tapPic();
        const tStayed = Game.state === STATE.TITLE;
        tapPic();
        check("title sound first (touch): the first tap only starts the sound, the next tap starts the game", tStayed && Game.state === STATE.LEVEL_INTRO, "stayed " + tStayed + ", state " + Game.state);
        Sound.ready = keep.ready; Input.reset();
      });
      // 5.1 a mouse click on the title unlocks the audio and starts the title theme
      Game.setState(STATE.TITLE); steps(2);
      let unlocked = 0, started = 0;
      Sound.unlock = function () { unlocked++; };
      Sound.startMusic = function () { started++; };
      Sound.playing = false;
      window.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "mouse" }));
      check("title music: a mouse click unlocks the audio and starts the music on the title track", unlocked >= 1 && started >= 1 && Sound.track === "title", unlocked + "/" + started);
      // 5.2 autoplay where allowed: a running context starts the music without input; a suspended one waits
      Sound.unlock = keep.unlock;
      let resumes = 0;
      const fake = function (state) { return { state: state, currentTime: 0, resume: function () { resumes++; return { then: function () {} }; } }; };
      started = 0; Sound.ac = fake("running"); Sound.playing = false; Sound.tryAutoplay();
      const autoOk = started === 1;
      started = 0; Sound.ac = fake("suspended"); Sound.playing = false; Sound.tryAutoplay();
      const waitOk = started === 0;
      // suspended -> resumed on an interaction and when the tab shows again
      resumes = 0;
      window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyQ" }));
      const onKey = resumes;
      document.dispatchEvent(new Event("visibilitychange"));
      check("title music: autoplay allowed -> the music starts without input; suspended -> it waits, and is resumed on a key and when the tab shows",
        autoOk && waitOk && onKey >= 1 && resumes >= onKey + (document.hidden ? 0 : 1), [autoOk, waitOk, onKey, resumes].join(","));
      // 5.3 resync after a stall: a clock jumped 10 s ahead -> nothing scheduled in the past, the song in time
      const ac = { state: "running", currentTime: 1 }, times = [];
      Sound.ac = ac; Sound.playEvent = function (e, t) { times.push({ t: t, now: ac.currentTime }); };
      Sound.track = "title"; Sound.tempo = 1; Sound.step = 0; Sound.nextTime = 1.05; Sound.playing = true;
      const t0 = 1.05, len = SONGS.title.sixteenth;
      Sound.schedule();
      times.length = 0;
      ac.currentTime = 11.05;
      Sound.schedule();
      const past = times.filter(function (x) { return x.t < x.now - 0.001; }).length;
      const k = (Sound.nextTime - t0) / len;
      check("title music: after a 10 s stall nothing is scheduled in the past and the song position matches the elapsed time",
        past === 0 && times.length > 0 && Math.abs(k - Math.round(k)) < 1e-6 && Sound.step === Math.round(k) % SONGS.title.steps,
        "past " + past + ", events " + times.length + ", step " + Sound.step + " vs " + (Math.round(k) % SONGS.title.steps));
    } finally {
      restore();
      Sound.playing = false;
      Sound.ac = keep.ac; Sound.step = keep.step; Sound.nextTime = keep.nextTime; Sound.track = keep.track; Sound.timer = keep.timer;
      Sound.playing = keep.playing;
      Input.reset(); Game.startHash = null; Game.setState(STATE.TITLE); steps(2);
    }
  });

  safe("title music routes", function () {
    // every way back to the title leaves the title theme active, at tempo 1, playing
    const wasPlaying = Sound.playing, keepStart = Sound.startMusic;
    let starts = 0;
    Sound.startMusic = function () { starts++; Sound.playing = true; };   // no real voices needed here
    Sound.playing = true;
    const ok = [];
    const at = function (name) { ok.push(name + ":" + (Sound.track === "title" && Sound.tempo === 1 && Sound.playing ? "ok" : Sound.track + "/" + Sound.tempo + "/" + Sound.playing)); };
    try {
      Input.reset(); Game.startHash = ""; Game.setState(STATE.TITLE); steps(2); at("first start");
      Game.newGame(); steps(5); Game.setState(STATE.GAME_OVER); steps(80); tap("enter"); steps(2); at("game over");
      Game.newGame(); Game.loadLevel(4); Game.setState(STATE.BOSS); Sound.setTempo(1.25); Game.setState(STATE.VICTORY); steps(150); tap("enter"); steps(2); at("victory");
      tap("mute"); steps(1); tap("mute"); steps(1); at("M twice");
    } finally { Sound.startMusic = keepStart; Sound.playing = wasPlaying; if (Sound.muted) Sound.toggleMute(); Input.reset(); Game.startHash = null; }
    // M on the title silences the master gain, M again restores it (needs a live context)
    if (Sound.master) {
      Game.setState(STATE.TITLE); steps(1);
      tap("mute"); steps(1); const off = Sound.master.gain.value;
      tap("mute"); steps(1); const on = Sound.master.gain.value;
      check("title music: M on the title silences the master gain and M again restores it", off === 0 && on === 1 && !Sound.muted, off + " -> " + on);
    }
    check("title music routes: first start, game over -> title, victory -> title and M twice all keep the title theme active at tempo 1 and playing",
      ok.every(function (x) { return /:ok$/.test(x); }) && !Sound.muted, ok.join(", "));
  });

  safe("touch menus", function () {
    withTouch(true, function () {
      const P = Touch.layout.pic, c = [P.x + P.w / 2, P.y + P.h / 2];
      function tapPic() { ptr("pointerdown", 50, c[0], c[1]); ptr("pointerup", 50, c[0], c[1]); steps(1); }
      Input.reset(); Game.startHash = ""; Game.setState(STATE.TITLE); steps(5);
      tapPic();
      check("touch menus: tap on the title starts a new game", Game.state === STATE.LEVEL_INTRO && Game.levelIndex === 0 && Player.lives === CONFIG.startLives, Game.state);
      steps(30); tapPic();
      check("touch menus: tap skips the reel card", Game.state === STATE.PLAY, Game.state);
      // during play a tap does nothing
      steps(5); tapPic(); steps(2);
      check("touch menus: tap on the picture during play does not pause", Game.state === STATE.PLAY, Game.state);
      // paused: a tap resumes
      Game.setState(STATE.PAUSE); steps(1); tapPic();
      check("touch menus: tap while paused resumes", Game.state === STATE.PLAY, Game.state);
      // level tally: first tap fills it, the next continues
      Game.completeLevel(); steps(1);
      const inTally = Game.state === STATE.LEVEL_COMPLETE;
      tapPic(); const filled = Game.tally && Game.tally.done;
      tapPic();
      check("touch menus: taps fill and continue the level tally", inTally && filled && Game.state === STATE.LEVEL_INTRO && Game.levelIndex === 1, Game.state + " L" + Game.levelIndex);
      Game.setState(STATE.GAME_OVER); steps(70); tapPic();
      check("touch menus: tap leaves the game-over card", Game.state === STATE.TITLE, Game.state);
      Game.setState(STATE.VICTORY); steps(130); tapPic();
      check("touch menus: tap leaves the victory card", Game.state === STATE.TITLE, Game.state);
      Game.startHash = null; Input.reset(); FX.clear();
    });
  });

  safe("touch audio", function () {
    withTouch(true, function () {
      // fresh page state: no audio yet, music off (restored afterwards: unlock() builds a new node graph)
      const wasPlaying = Sound.playing;
      Sound.stopMusic();
      const snap = Object.assign({}, Sound);
      Sound.ac = null;
      Game.setState(STATE.TITLE);
      const P = Touch.layout.pic;
      try {
        ptr("pointerdown", 60, P.x + 10, P.y + 10);
        const created = !!Sound.ac, playing = Sound.playing, track = Sound.track;
        ptr("pointerup", 60, P.x + 10, P.y + 10);
        check("touch audio: the first touch creates the audio context and starts the title music", created && playing && track === "title",
          "ac " + created + " playing " + playing + " track " + track);
      } finally {
        Sound.stopMusic();
        if (Sound.ac && Sound.ac !== snap.ac && Sound.ac.close) Sound.ac.close();
        Object.keys(Sound).forEach(function (k) { if (!(k in snap)) delete Sound[k]; });
        Object.assign(Sound, snap);
        if (wasPlaying) Sound.startMusic();
        Input.reset(); steps(1);
      }
    });
  });

  safe("touch portrait", function () {
    const pad = document.getElementById("pad");
    function cardShown() {
      const dpr = window.devicePixelRatio || 1, d = pad.getContext("2d").getImageData(Math.round(pad.width / 2), Math.round(pad.height / 2), 1, 1).data;
      return pad.style.display === "block" && d[3] === 255 && Math.round(pad.width / dpr) === window.innerWidth;
    }
    function pauseText() { TEXT_LOG.active = true; TEXT_LOG.items = []; Game.render(); TEXT_LOG.active = false; return TEXT_LOG.items.join("|"); }
    withTouch(true, function () {
      try {
        load(grid(30, 12, [[5, 9, "P"]]));
        setViewport(390, 844);
        const L = Touch.layout;
        check("touch portrait: turning to portrait during play pauses and shows the card", L.portrait && Game.state === STATE.PAUSE && cardShown(), Game.state);
        check("touch portrait: controls hidden and inert in portrait", Touch.hit(L.pad.x, L.pad.y) === null && Touch.hit(L.fire.x, L.fire.y) === null);
        Game.setState(STATE.PLAY); Touch.tick();
        check("touch portrait: play that starts while in portrait is paused at once", Game.state === STATE.PAUSE, Game.state);
        setViewport(844, 390);
        const txt = pauseText();
        check("touch portrait: back to landscape the game stays paused and shows PAUSED", !Touch.layout.portrait && Game.state === STATE.PAUSE && txt.indexOf("PAUSED") >= 0, Game.state);
        // hidden page during play pauses and releases fingers
        Game.setState(STATE.PLAY);
        const R = padAt(0);
        ptr("pointerdown", 70, R[0], R[1]);
        Object.defineProperty(document, "hidden", { configurable: true, get: function () { return true; } });
        document.dispatchEvent(new Event("visibilitychange"));
        delete document.hidden;
        check("touch portrait: hidden page during play pauses and releases the fingers", Game.state === STATE.PAUSE && !Input.down("right"), Game.state);
      } finally { restoreViewport(); }
    });
    withTouch(false, function () {
      try {
        load(grid(30, 12, [[5, 9, "P"]]));
        setViewport(400, 900); steps(1);
        check("touch portrait: without touch mode a tall window shows no card and keeps playing", Game.state === STATE.PLAY && pad.style.display === "none", Game.state);
        Object.defineProperty(document, "hidden", { configurable: true, get: function () { return true; } });
        document.dispatchEvent(new Event("visibilitychange"));
        delete document.hidden;
        check("touch portrait: without touch mode a hidden page does not pause", Game.state === STATE.PLAY, Game.state);
      } finally { restoreViewport(); }
    });
    Input.reset(); Game.setState(STATE.TITLE);
  });

  safe("touch fullscreen", function () {
    const de = document.documentElement, calls = [];
    let fsEl = null, enabled = true;
    const realReq = de.requestFullscreen, realExit = document.exitFullscreen;
    const fsDesc = Object.getOwnPropertyDescriptor(Document.prototype, "fullscreenElement");
    const enDesc = Object.getOwnPropertyDescriptor(Document.prototype, "fullscreenEnabled");
    const orDesc = Object.getOwnPropertyDescriptor(Screen.prototype, "orientation");
    Object.defineProperty(document, "fullscreenElement", { configurable: true, get: function () { return fsEl; } });
    Object.defineProperty(document, "fullscreenEnabled", { configurable: true, get: function () { return enabled; } });
    Object.defineProperty(screen, "orientation", { configurable: true, get: function () {
      return { type: "landscape-primary", lock: function (o) { calls.push("orient:" + o); return Promise.resolve(); }, addEventListener: function () {} };
    } });
    de.requestFullscreen = function () { calls.push("request"); fsEl = de; document.dispatchEvent(new Event("fullscreenchange")); return Promise.resolve(); };
    document.exitFullscreen = function () { calls.push("exit"); fsEl = null; document.dispatchEvent(new Event("fullscreenchange")); return Promise.resolve(); };
    try {
      withTouch(true, function () {
        const L = Touch.layout, r = L.util.fullscreen, p = at(r);
        Fullscreen.noteT = 0; Touch.sig = ""; Touch.draw();
        ptr("pointerdown", 40, p[0], p[1]); ptr("pointerup", 40, p[0], p[1]);
        check("touch fullscreen: button goes fullscreen and locks landscape", calls[0] === "request" && calls[1] === "orient:landscape" && Fullscreen.isFull(), calls.join(","));
        check("touch fullscreen: no Windows-key note in touch mode", Fullscreen.noteT === 0 || Fullscreen.note.indexOf("WINDOWS") < 0, Fullscreen.note);
        ptr("pointerdown", 40, p[0], p[1]); ptr("pointerup", 40, p[0], p[1]);
        check("touch fullscreen: button again leaves fullscreen", calls.indexOf("exit") >= 0 && !Fullscreen.isFull(), calls.join(","));
        // browser without element fullscreen (iPhone Safari): button hidden and inert
        enabled = false; calls.length = 0; Touch.sig = ""; Touch.draw();
        const dpr = window.devicePixelRatio || 1;
        const d = document.getElementById("pad").getContext("2d").getImageData(Math.round(r.x * dpr), Math.round(r.y * dpr), Math.round(r.w * dpr), Math.round(r.h * dpr)).data;
        let opaque = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) opaque++;
        ptr("pointerdown", 41, p[0], p[1]); ptr("pointerup", 41, p[0], p[1]);
        check("touch fullscreen: without the API no button is drawn and tapping there does nothing", opaque === 0 && calls.length === 0, opaque + " px, " + calls.join(","));
      });
    } finally {
      delete document.fullscreenElement; if (fsDesc) Object.defineProperty(Document.prototype, "fullscreenElement", fsDesc);
      delete document.fullscreenEnabled; if (enDesc) Object.defineProperty(Document.prototype, "fullscreenEnabled", enDesc);
      delete screen.orientation; if (orDesc) Object.defineProperty(Screen.prototype, "orientation", orDesc);
      de.requestFullscreen = realReq; document.exitFullscreen = realExit;
      Fullscreen.noteT = 0; Input.reset(); Touch.sig = "";
    }
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
    const sets = [SPR.hero.idle, SPR.hero.run[1], SPR.hero.climb[0], SPR.hero.hurt, SPR.hero.kneel, SPR.hero.kneelShoot, SPR.heroCutter.kneel, SPR.lawyer[0], SPR.lawyerThrow, SPR.cray[0], SPR.cray[1], SPR.heroCutter.idle, SPR.heroCutter.run[1], SPR.heroCutter.jump].concat(
      SPR.fans.reduce(function (a, f) { return a.concat([f.idle, f.wave, f.jump, f.kiss]); }, [])).concat([SPR.punk.walk[0], SPR.punk.walk[1], SPR.punk.rev].concat(SPR.lawbook.reduce(function (a, b) { return a.concat(b); }, [])));
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
    Player.resetForGame(); Game.loadLevel(4); Game.setState(STATE.BOSS); nearBoss();
    steps(30); Boss.flash = 0; Camera.x = Game.level.pxW - W; Game.render();   // whole boss in view
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
    check("fans: at least 14 distinct looks", distinct >= 14 && SPR.fans.length === FAN_VARIANTS.length, distinct + " looks");
    let framesDiffer = true;
    SPR.fans.forEach(function (f) {
      const a = f.idle.r.getContext("2d").getImageData(0, 0, f.idle.r.width, f.idle.r.height).data;
      const b = f.wave.r.getContext("2d").getImageData(0, 0, f.wave.r.width, f.wave.r.height).data;
      let d = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
      if (d < 20) framesDiffer = false;
    });
    check("fans: idle and wave frames differ for every look", framesDiffer);
    let kissDiffers = true;
    SPR.fans.forEach(function (f) {
      const a = f.idle.r.getContext("2d").getImageData(0, 0, f.idle.r.width, f.idle.r.height).data;
      const b = f.kiss.r.getContext("2d").getImageData(0, 0, f.kiss.r.width, f.kiss.r.height).data;
      let d = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++;
      if (d < 20) kissDiffers = false;
    });
    check("fans: a blow-a-kiss frame, different from idle, for every look", kissDiffers && FAN_FRAMES.indexOf("kiss") >= 0);
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

  safe("title controls", function () { withTouch(false, function () {
    const txt = titleControls().map(function (l) { return l.join(" "); }).join("|");
    check("title: controls list shows SPACE jump and X/CTRL/ALT fire",
      txt.indexOf("SPACE JUMP") >= 0 && txt.indexOf("X/CTRL/ALT FIRE") >= 0 && txt.indexOf("CTRL JUMP") < 0, txt);
    check("title: controls list shows F fullscreen", txt.indexOf("F FULLSCREEN") >= 0, txt);
    check("title: controls list shows UP/DOWN climb and kneel", txt.indexOf("UP/DOWN CLIMB/KNEEL") >= 0, txt);
  }); });

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

  // ---------------- kneeling ----------------
  safe("kneel", function () {
    load(grid(40, 12, [[3, 9, "P"]]));
    const feet0 = Player.y + Player.h;
    press("right"); steps(30);
    press("down"); steps(40);
    const x0 = Player.x;
    check("kneel: Down makes a running hero kneel and stop", Player.kneeling && Math.abs(Player.vx) < 1, "kneeling " + Player.kneeling + " vx " + Player.vx.toFixed(1));
    release("right"); press("left"); steps(20);
    check("kneel: Left only turns the kneeling hero, he doesn't move", Player.face === -1 && Math.abs(Player.x - x0) < 0.5 && Player.kneeling,
      "face " + Player.face + " moved " + (Player.x - x0).toFixed(2));
    release("left");
    check("kneel: hitbox 16 px high, feet unchanged", Player.h === KNEEL_H && KNEEL_H === 16 && Math.abs(Player.y + Player.h - feet0) < 0.5,
      "h " + Player.h + " feet " + (Player.y + Player.h) + " vs " + feet0);
    release("down"); steps(5);
    check("kneel: releasing Down stands him up (28 px, feet unchanged)", !Player.kneeling && Player.h === 28 && Math.abs(Player.y + Player.h - feet0) < 0.5);
    // low ceiling: a block right above the kneeling body
    load(grid(40, 12, [[3, 9, "P"], [10, 8, "#"], [11, 8, "#"]]));
    press("down"); steps(10);
    Player.x = 10 * 16 + 8; steps(2);
    release("down"); steps(20);
    check("kneel: under a low ceiling he stays kneeling, not inside the tile", Player.kneeling && Player.y >= 9 * 16 - 0.01, "kneeling " + Player.kneeling + " y " + Player.y);
    press("jump"); steps(2); release("jump"); steps(10);
    check("kneel: no jump into a low ceiling", Player.kneeling && Player.onGround);
    Player.x = 14 * 16; steps(3);
    check("kneel: stands up once there is room again", !Player.kneeling && Player.h === 28);
    // Jump while kneeling on solid ground: a normal jump
    press("down"); steps(10); press("jump"); steps(8); release("jump");
    check("kneel: Jump while kneeling on solid ground jumps", !Player.onGround && Player.vy < 0 && !Player.kneeling);
    release("down"); steps(60);
    Input.reset();
  });

  safe("kneel shots", function () {
    function crayTest(kneel) {
      load(grid(40, 12, [[3, 9, "P"]]));
      Game.godMode = true;
      const e = makeEnemy("cray", 12 * 16 + 8, 10 * 16, Game.level, -1);
      e.active = true; e.cd = 99;                                  // stays on the ground (no leap)
      Game.enemies = [e];
      Player.face = 1;
      if (kneel) { press("down"); steps(5); }
      const hp0 = e.hp;
      press("fire"); steps(50, function () { e.cd = 99; e.vx = 0; }); release("fire");
      const res = { dead: e.dead, hits: hp0 - e.hp, shots: Game.stats.shots };
      release("down"); Game.godMode = false; Input.reset();
      return res;
    }
    const k = crayTest(true), s = crayTest(false);
    check("kneel: kneeling shots kill a crayfish on the ground (2 standard hits)", k.dead && CONFIG.crayHp === 2, JSON.stringify(k));
    check("kneel: standing shots still fly over a crayfish on the ground", !s.dead && s.hits === 0, JSON.stringify(s));
    load(grid(40, 12, [[3, 9, "P"]]));
    press("down"); steps(5); Game.shots = []; Player.fireCd = 0; Player.fire();
    const sh = Game.shots[0];
    check("kneel: the kneeling shot leaves 6 px above the floor", sh && Math.abs(sh.y + sh.h / 2 - (Player.y + Player.h - 6)) <= 1);
    release("down"); Input.reset();
  });

  safe("kneel pose", function () {
    function rowsOf(set) {
      const c = set.r, d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      let top = -1, bottom = -1;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3]) { if (top < 0) top = y; bottom = y; }
      return { top: top, bottom: bottom };
    }
    const st = rowsOf(SPR.hero.idle), kn = rowsOf(SPR.hero.kneel), kc = rowsOf(SPR.heroCutter.kneel);
    check("kneel pose: feet on the same row as standing, top at least 8 px lower", kn.bottom === st.bottom && kn.top - st.top >= 8 && kc.bottom === st.bottom,
      "standing " + JSON.stringify(st) + " kneeling " + JSON.stringify(kn) + " cutter " + JSON.stringify(kc));
    // the drawn kneeling gun row matches the shot: the barrel colour sits 6 px above the feet
    const c = SPR.hero.kneelShoot.r, d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data, pad = SPR.hero.kneelShoot.pad;
    const feetRow = kn.bottom;            // last opaque row (outline under the clogs)
    let barrelRow = -1;
    for (let y = 0; y < c.height; y++) { let n = 0; for (let x = c.width - 6; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3]) n++; if (n >= 3) { barrelRow = y; break; } }
    check("kneel pose: the gun barrel is about 6 px above the feet", barrelRow >= 0 && Math.abs((feetRow - pad) - barrelRow - 6) <= 2, "barrel row " + barrelRow + ", feet " + feetRow);
  });

  // ---------------- mofa ride (src/ride.js) ----------------
  function loadRide(items, w) { load(grid(w || 240, 12, [[3, 9, "P"]].concat(items || [])), { ride: "1", name: "TEST RIDE" }); }
  function holdFor(a, sec, each) { press(a); steps(Math.round(sec * 60), each); release(a); }

  // a ride test map with a climb: flat at row 19 up to column 39, eased up to row 11 by column 99, flat after
  function climbRows(items) {
    const w = 170, h = 22, g = [];
    for (let y = 0; y < h; y++) g.push(new Array(w).fill("."));
    for (let x = 0; x < w; x++) {
      const t = Math.min(1, Math.max(0, (x + 0.5 - 40) / 60)), top = Math.ceil(19 - 8 * t * t * (3 - 2 * t));
      for (let y = top; y < h; y++) g[y][x] = "#";
    }
    // items: [column, cells above the road, char]
    (items || []).forEach(function (it) { let top = 0; while (g[top][it[0]] !== "#") top++; g[top - it[1]][it[0]] = it[2]; });
    return g.map(function (r) { return r.join(""); });
  }
  function loadClimb(items) {
    load(climbRows([[3, 1, "P"]].concat(items || [])), { ride: "1", name: "TEST CLIMB", climb: "40-99 19-11" });
  }

  safe("ride climb", function () {
    loadClimb([[20, 3, "o"], [70, 3, "o"], [30, 1, "S"], [72, 1, "S"], [60, 1, "1"]]);
    const L = Game.level;
    let jump = 0;
    for (let x = 0; x < L.pxW - 1; x++) jump = Math.max(jump, Math.abs(L.roadTop(x + 1) - L.roadTop(x)));
    const rise = L.roadTop(10) - L.roadTop(L.pxW - 10);
    check("climb: the road profile is smooth (at most 1 px per px) and rises at least 6 tiles", jump <= 1 && rise >= 6 * TILE, "step " + jump.toFixed(2) + ", rise " + rise);
    // pickups and signs sit at the same height over the road on the flat and on the climb
    const ps = Game.pickups.filter(function (q) { return q.type === "o"; }).map(function (q) { return L.roadTop(q.x + q.w / 2) - (q.y + q.h); });
    const sg = Game.signs.map(function (q) { return L.roadTop(q.tx * TILE + 8) - (q.ty * TILE + q.dy); });
    check("climb: pickups and signs follow the road (same height above it on the flat and on the slope)",
      ps.length === 2 && Math.abs(ps[0] - ps[1]) <= 1 && sg.length === 2 && Math.abs(sg[0] - sg[1]) <= 1, "pickups " + ps.join(",") + " signs " + sg.join(","));
    // ride it: flat top speed, then the steepest part; the mofa stays on the road, the X7 too
    Game.godMode = true;
    const camY0 = Camera.y;
    let flatV = 0, steepV = 1e9, off = 0, carOff = 0, strained = 0, n = 0, steepN = 0;
    press("right");
    while (Player.x < 140 * TILE && n++ < 30 * 60) {
      steps(1);
      const cx = Player.x + Player.w / 2;
      if (cx > 30 * TILE && cx < 38 * TILE) flatV = Math.max(flatV, Player.vx);
      if (cx > 66 * TILE && cx < 74 * TILE) {
        steepV = Math.min(steepV, Player.vx); steepN++;
        if (Mofa.load(Player) === 1 && Mofa.speed01(Player) < 0.8) strained++;
      }
      const ground = Math.min(L.roadTop(Player.x + 4), L.roadTop(Player.x + Player.w - 4));
      if (Player.onGround && Math.abs(Player.y + Player.h - ground) > 1) off++;
      Game.enemies.forEach(function (e) { if (e.type === "suv" && !e.dead && e.active && Math.abs(e.y + e.h - L.roadTop(e.x + e.w / 2)) > 1) carOff++; });
    }
    release("right");
    check("climb: the mofa rides up the whole climb on the road surface", Player.x >= 140 * TILE && off === 0, "x " + Math.round(Player.x) + ", off-road steps " + off);
    check("climb: uphill top speed at least 25% lower on the steepest part", steepN > 0 && steepV <= 0.75 * flatV, "flat " + flatV.toFixed(0) + ", steep " + steepV.toFixed(0));
    check("climb: the engine strains (full-throttle load at a lower speed) uphill", strained > steepN / 2, strained + "/" + steepN);
    check("climb: cars drive on the road profile", carOff === 0 && Game.enemies.some(function (e) { return e.type === "suv"; }), "off " + carOff);
    const sy = Player.y - Camera.y;
    check("climb: the camera follows up (Buck stays in view)", Camera.y < camY0 - 2 * TILE && sy > 0 && sy + Player.h < VIEW_H, "cam y " + camY0.toFixed(0) + " -> " + Camera.y.toFixed(0) + ", Buck at " + sy.toFixed(0));
    Game.godMode = false;
  });

  safe("mofa controls", function () {
    loadRide();
    const top = CONFIG.mofaTop;
    check("mofa: Buck sits on the mofa (wide box, facing right) on a ride level", Game.level.isRide && Player.w === CONFIG.mofaW && Player.h === CONFIG.mofaH && Player.face === 1);
    holdFor("right", 3);
    const v3 = Player.vx;
    press("right"); steps(60); const v4 = Player.vx;
    check("mofa: Right reaches the top speed in 3 s and keeps it; top >= 1.5x running speed",
      v3 === top && v4 === top && top >= 1.5 * CONFIG.runSpeed, v3.toFixed(1) + " / " + top);
    release("right"); steps(60);
    check("mofa: released at top speed it coasts on for at least a second", Player.vx > 0 && Player.vx < top, Player.vx.toFixed(1));
    loadRide(); press("right"); steps(240); release("right");
    let t = 0; press("left");
    while (Player.vx > 0 && t < 180) { steps(1); t++; }
    check("mofa: Left brakes from top speed to a stop within about a second", t <= 66, (t / 60).toFixed(2) + " s");
    steps(180);
    const back = Player.vx; release("left");
    check("mofa: stopped, Left rolls back at most a quarter of the top speed, still facing right",
      back < 0 && back >= -top * CONFIG.mofaReverse && Player.face === 1, back.toFixed(1));
    // hop: high enough for a cone or a Ferrari (16 px), no second hop in the air
    loadRide(); press("right"); steps(120); release("right");
    const y0 = Player.y; let minY = y0, hops = 0;
    sounds.length = 0;
    tap("jump");
    for (let i = 0; i < 60; i++) { if (i === 12) tap("jump"); steps(1); minY = Math.min(minY, Player.y); }
    hops = sounds.filter(function (s) { return s === "jump"; }).length;
    check("mofa: Jump hops at least 45 px (over a cone or a Ferrari) and lands back on the road; Jump in mid-air does nothing",
      y0 - minY >= 45 && Player.onGround && Math.abs(Player.y - y0) < 1 && hops === 1, "rise " + (y0 - minY).toFixed(1) + ", hops " + hops);
  });

  safe("mofa gun", function () {
    loadRide([], 400);
    check("mofa gun: the ride's weapon is the mounted machine gun", Player.weapon === "mofamg");
    Game.stats.shots = 0; Game.shots = [];
    press("fire"); steps(60);
    const n = Game.stats.shots, s0 = Game.shots[0];
    release("fire");
    check("mofa gun: at least 8 shots per second, 1 damage each, flying forward",
      n >= 8 && s0 && s0.dmg === 1 && s0.vx > 0 && !s0.vy, n + " shots");
    Game.shots = []; press("up"); press("fire"); steps(10); release("fire"); release("up");
    const u = Game.shots[0], ang = u ? Math.atan2(-u.vy, u.vx) * 180 / Math.PI : 0;
    check("mofa gun: with Up held the shots fly forward and up at about 30 degrees", u && Math.abs(ang - 30) < 3, ang.toFixed(1) + " deg");
    TEXT_LOG.active = true; TEXT_LOG.items = []; Game.render(); TEXT_LOG.active = false;
    check("mofa gun: the HUD reads MOFA MG", TEXT_LOG.items.indexOf("MOFA MG") >= 0);
    // off the mofa: reel 2 starts with the standard blaster
    Player.resetForGame(); Game.loadLevel(0); Game.setState(STATE.PLAY);
    const rideW = Player.weapon;
    Game.completeLevel(); Game.tally.done = true; Game.nextLevel();
    check("mofa gun: after the gate, reel 2 starts on foot with the standard blaster",
      rideW === "mofamg" && Game.levelIndex === 1 && Player.weapon === "blaster" && Player.w === STAND_W, rideW + " -> " + Player.weapon);
    check("mofa gun: the ride map has no weapon pickups", LEVEL_DATA[0].map.join("").indexOf("w") < 0);
    Input.reset();
  });

  safe("road hazards", function () {
    const top = CONFIG.mofaTop;
    function atTop(items) { loadRide(items, 300); Player.x = 3 * TILE; Player.vx = top; press("right"); }
    // the clear road: no cones, potholes or speed bumps on the ride map; riding it without cars costs nothing
    const rm = LEVEL_DATA[0].map.join("");
    loadRide([], 300); Game.godMode = false;
    Player.x = 3 * TILE; press("right");
    const hpC = Player.hp;
    steps(120);
    release("right");
    check("hazards: the ride map has no cones, potholes or speed bumps, and riding a clear road costs no health",
      rm.indexOf("!") < 0 && rm.indexOf("_") < 0 && rm.indexOf(":") < 0 && Player.hp === hpC && Game.hazards.every(function (z) { return z.type === "ramp"; }));
    // ramp: at top speed at least twice as far as a normal hop
    function flight(trigger) {
      let t0x = null, land = null, air = false;
      steps(240, function () {
        if (t0x === null && trigger()) t0x = Player.x;
        if (t0x !== null && !Player.onGround) air = true;
        if (air && Player.onGround && land === null) land = Player.x;
      });
      return land !== null && t0x !== null ? land - t0x : 0;
    }
    atTop([]);
    let hopAt = false;
    const hopDist = flight(function () { if (!hopAt) { hopAt = true; Input.simulate("jump", true); return true; } Input.simulate("jump", false); return false; });
    release("right");
    atTop([[20, 9, "/"]]);
    const rampEnd = 22 * TILE;
    const rampDist = flight(function () { return Player.onRamp === null && Player.x + Player.w / 2 > rampEnd && !Player.onGround; });
    release("right");
    check("hazards: a ramp at top speed launches at least twice as far as a hop", hopDist > 40 && rampDist >= 2 * hopDist,
      "hop " + hopDist.toFixed(0) + " px, ramp " + rampDist.toFixed(0) + " px");
    Input.reset();
  });

  safe("cars", function () {
    const want = { suv: [12, 800], tesla: [8, 700], ferrari: [6, 1000] };
    loadRide([], 300);
    const got = Object.keys(want).map(function (k) { const e = makeEnemy(k, 100, 160, Game.level, 1); return k + ":" + e.hp + "/" + e.T.points + (e.T.car ? "" : " not a car"); });
    check("cars: BMW X7 12 hits/800, Tesla 8/700, Ferrari 6/1000; no BMW sedan", got.join(",") === "suv:12/800,tesla:8/700,ferrari:6/1000" && !ENEMY_TYPES.bmw, got.join(","));
    check("cars: Ferrari at most 32 px high, SUV the tallest", ENEMY_TYPES.ferrari.h <= 32 && ["tesla", "ferrari"].every(function (k) { return ENEMY_TYPES.suv.h > ENEMY_TYPES[k].h; }));
    // contact: 2 health and a hard knockback
    loadRide([], 300);
    const hp0 = Player.hp;
    const car = makeEnemy("tesla", Player.cx() + 20, Player.y + Player.h, Game.level, 1); car.state = "leave";
    Game.enemies.push(car);
    steps(1);
    check("cars: touching a car costs 2 health and knocks the mofa back", Player.hp === hp0 - 2 && Player.vx <= -100, "hp " + hp0 + " -> " + Player.hp + ", vx " + Player.vx.toFixed(0));
    // destroyed: explosion, wreck, driver bails out, points
    loadRide([], 300);
    const e = makeEnemy("tesla", Player.cx() + 200, Player.y + Player.h, Game.level, 1); e.state = "leave"; e.vx = 0;
    Game.enemies.push(e);
    const s0 = Game.score; sounds.length = 0;
    for (let i = 0; i < 20 && !e.dead; i++) damageEnemy(e, 1, 1);
    steps(1);
    check("cars: a destroyed car explodes, leaves a wreck, the driver runs off, and it scores its points",
      e.dead && Game.enemies.indexOf(e) < 0 && sounds.indexOf("bigexplode") >= 0 && Cars.wrecks.length === 1 && Cars.runners.length === 1 && Game.score - s0 === 700,
      "score +" + (Game.score - s0) + ", wrecks " + Cars.wrecks.length + ", runners " + Cars.runners.length);
    steps(60 * (CONFIG.wreckLife + 1));
    check("cars: the wreck fades away after a while", Cars.wrecks.length === 0);
  });

  safe("car behaviour", function () {
    const top = CONFIG.mofaTop;
    Game.godMode = false;
    // SUV: ahead, slower than the mofa, can't be passed, throws every 1.5-2.5 s
    loadRide([[16, 9, "1"]], 300);
    const suv = Game.enemies[0];
    let maxV = 0, passed = false, last = null, gaps = [], prevN = 0;
    Player.hp = 99; Player.invuln = 0;
    press("right");
    steps(60 * 8, function () {
      Player.hp = 99;
      if (suv.active) maxV = Math.max(maxV, suv.vx);
      if (Player.x > suv.x + suv.w) passed = true;
      const n = Game.enemyShots.filter(function (s) { return s.kind === "latte" || s.kind === "golfball"; }).length;
      if (n > prevN) { const now = Game.time; if (last !== null) gaps.push(now - last); last = now; }
      prevN = n;
    });
    release("right");
    check("cars: the SUV drives ahead slower than the mofa's top speed and can't be passed", suv.active && maxV <= top * 0.6 + 0.01 && !passed && !suv.dead,
      "max speed " + maxV.toFixed(1) + ", passed " + passed);
    check("cars: the SUV driver throws latte cups / golf balls every 1.5-2.5 s", gaps.length >= 2 && gaps.every(function (g) { return g >= 1.45 && g <= 2.6; }),
      gaps.map(function (g) { return g.toFixed(2); }).join(","));
    // a throw shot down with Up
    loadRide([], 300);
    Game.enemyShots = [{ kind: "latte", x: Player.x + Player.w + 40, y: Player.y - 20, w: 6, h: 8, vx: 0, vy: 0, grav: 0, dmg: 1, t: 0, shootable: true }];
    press("up"); press("fire"); steps(30); release("fire"); release("up");
    check("cars: a thrown latte cup can be shot down with Up held", Game.enemyShots.length === 0 && Player.hp === CONFIG.maxHp);
    // BMW X7: honks at a mofa riding close behind, at most once a second
    loadRide([[16, 9, "1"]], 300);
    const x7 = Game.enemies[0];
    let honks = 0;
    sounds.length = 0;
    steps(60 * 3, function () {
      x7.x = Player.x + Player.w + 20; x7.vx = 0; x7.throwT = 99; Player.vx = 0;   // the mofa 20 px behind the X7
      honks = sounds.filter(function (n) { return n === "horn"; }).length;
    });
    const closeHonks = honks;
    sounds.length = 0;
    steps(60, function () { x7.x = Player.x + Player.w + 120; x7.vx = 0; x7.throwT = 99; });
    check("cars: the BMW X7 honks at a mofa close behind it, at most once a second, and not from further back",
      closeHonks >= 2 && closeHonks <= 4 && sounds.indexOf("horn") < 0, closeHonks + " honks in 3 s");
    // Tesla: from behind, rams within half a screen
    loadRide([[2, 9, "3"]], 400);
    press("right"); steps(2);
    const tesla = Game.enemies.filter(function (e) { return e.type === "tesla"; })[0];
    if (tesla) tesla.hp = 999;                               // (rear turret, as above)
    let ramAt = null, hpLost = false; const hpT = Player.hp;
    steps(60 * 6, function () { if (tesla && tesla.state === "ram" && ramAt === null) ramAt = carGapBehind(tesla); if (Player.hp < hpT) hpLost = true; });
    release("right");
    check("cars: the Tesla creeps up from behind and rams when within half a screen", tesla && ramAt !== null && ramAt <= W / 2 && hpLost,
      "ram at " + ramAt + " px, hit " + hpLost);
    // Ferrari: from ahead, > 2x top speed, ~1 s off screen; a hop over it costs nothing
    loadRide([], 400);
    const fer = Cars.spawn("ferrari", Player.y + Player.h);       // what a "4" trigger does when Buck passes it
    const offAhead = fer ? (fer.x - (Camera.x + W)) / (CONFIG.ferrariSpeed) : 0;
    check("cars: the Ferrari comes from ahead, faster than twice the top speed, about a second before it is on screen",
      fer && fer.face === -1 && CONFIG.ferrariSpeed > 2 * top && offAhead >= 0.95, "off screen for " + offAhead.toFixed(2) + " s");
    const hpF = Player.hp; let hopped = false;
    steps(60 * 3, function () {
      if (!hopped && fer.x - (Player.x + Player.w) < 40) { hopped = true; tap("jump"); }
    });
    check("cars: hopping over the Ferrari costs nothing and it drives on off screen", hopped && Player.hp === hpF && (fer.dead || fer.x + fer.w < Player.x), "hp " + hpF + " -> " + Player.hp);
    Input.reset(); Game.enemies = []; Game.enemyShots = [];
  });

  safe("ride sound", function () {
    loadRide([], 400);
    steps(2);
    const idle = Sound.mofa.rate, idleF = Sound.mofa.freq, on = Sound.mofa.gain > 0;
    press("right"); steps(240);
    const fast = Sound.mofa.rate, fastF = Sound.mofa.freq;
    release("right"); press("left"); steps(120); release("left"); steps(30);
    check("ride sound: the mofa idles at a standstill and its pitch rises with speed", on && fast > idle * 2 && fastF > idleF && Math.abs(Sound.mofa.rate - idle) < 4,
      "rate " + idle.toFixed(1) + " -> " + fast.toFixed(1) + " -> " + Sound.mofa.rate.toFixed(1));
    const tes = Sound.engineTargets({ kind: "tesla", dist: 100 }).gain, x7 = Sound.engineTargets({ kind: "suv", dist: 100 }).gain;
    const others = ["suv", "ferrari"].map(function (k) { return Sound.engineTargets({ kind: k, dist: 100 }).gain; });
    check("ride sound: the Tesla is at most a third as loud as the X7 (and quieter than every other car)",
      tes <= x7 / 3 + 1e-9 && others.every(function (g) { return tes < g; }), tes.toFixed(3) + " vs " + x7.toFixed(3));
    // Ferrari: heard while still off screen ahead
    const fer = Cars.spawn("ferrari", Player.y + Player.h);
    steps(1);
    const heard = Sound.engines.some(function (sl) { return sl.id === fer && sl.gain > 0; }) && fer.x > Camera.x + W;
    check("ride sound: the Ferrari's roar is heard while it is still off screen", heard, "x " + Math.round(fer.x - Camera.x - W) + " px beyond the edge");
    // paused: mofa and car engines silent
    Game.setState(STATE.PAUSE); steps(1);
    const silent = Sound.mofa.gain === 0 && Sound.engines.every(function (sl) { return sl.gain === 0; });
    Game.state = Game.prevState; Game.prevState = STATE.PAUSE; steps(1);
    check("ride sound: pausing silences the mofa and the car engines, resuming brings them back", silent && Sound.mofa.gain > 0);
    // a destroyed car's engine stops
    for (let i = 0; i < 10 && !fer.dead; i++) damageEnemy(fer, 1, 1);
    steps(2);
    check("ride sound: a destroyed car's engine sound stops", fer.dead && !Sound.engines.some(function (sl) { return sl.id === fer && sl.gain > 0; }));
    // level over: silent
    Game.completeLevel(); steps(1);
    check("ride sound: at the level end the mofa falls silent", Sound.mofa.gain === 0);
    Input.reset(); Game.enemies = [];
  });

  safe("ride stretches", function () {
    Player.resetForGame(); Game.loadLevel(0); Game.setState(STATE.PLAY);
    const L = Game.level, st = L.stretches;
    const names = st.map(function (q) { return q.name; }).join(",");
    check("stretches: lake, village, climb, club in that order, each with its own backdrop",
      names === "bg_lake,bg_village,bg_climb,bg_club" && st.every(function (q, k) { return q.img && (k === 0 || q.x0 > st[k - 1].x0); }), names);
    // every stretch has both props, and the props look different in every stretch
    const props = st.map(function (q) { return Game.signs.filter(function (g) { return (g.ch === "(" || g.ch === ")") && L.stretchAt(g.tx * TILE) === st.indexOf(q); }).map(function (g) { return g.ch; }); });
    const kinds = {}; PROP_KINDS.forEach(function (k) { kinds[k[0]] = kinds[k[1]] = 1; });
    check("stretches: each stretch has its roadside props ( and ), 8 different looks in all",
      props.every(function (pp) { return pp.indexOf("(") >= 0 && pp.indexOf(")") >= 0; }) && Object.keys(kinds).length === 8, props.map(function (pp) { return pp.join(""); }).join(" | "));
    // the backdrop blends over a screen: crossing a border in 2-px steps, no frame jumps like a hard cut
    function bgAt(camX) { L.drawBackground(camX, Camera.y); return ctx.getImageData(0, HUD_H, W, VIEW_H).data; }
    function diff(a, b) { let d = 0; for (let i = 0; i < a.length; i += 16) d += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); return d / (a.length / 16); }
    // blend weight of each frame between the two stretches drawn at the same camera: it must rise
    // from 0 to 1 in small steps (the parallax pixel shift itself is not a cut)
    let worst = 0, w0 = 1, w1 = 0;
    for (let k = 1; k < st.length; k++) {
      const b = st[k].x0;
      let prevW = null;
      for (let x = b - W - 16; x <= b + 16; x += 4) {
        L.drawStretch(st[k - 1], x, Camera.y); const A = ctx.getImageData(0, HUD_H, W, VIEW_H).data;
        L.drawStretch(st[k], x, Camera.y); const B = ctx.getImageData(0, HUD_H, W, VIEW_H).data;
        const F = bgAt(x), dA = diff(F, A), dB = diff(F, B), w = dA / Math.max(1e-6, dA + dB);
        if (x < b - W) w0 = Math.min(w0, 1 - w); else if (x > b) w1 = Math.max(w1, 1 - w);
        if (prevW !== null) worst = Math.max(worst, Math.abs(w - prevW));
        prevW = w;
      }
    }
    check("stretches: no hard cut at a border (the blend moves at most 5% per 4 px over one screen)",
      worst <= 0.05 && w0 > 0.99 && w1 < 0.01, "largest step " + (worst * 100).toFixed(1) + "%");
  });

  safe("ride art", function () {
    function outlined(c) {
      const w = c.width, h = c.height, d = c.getContext("2d").getImageData(0, 0, w, h).data;
      function a(x, y) { return x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3]; }
      let bad = 0, outl = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (!d[i + 3]) continue;
        if (d[i] === OUTLINE_COLOR[0] && d[i + 1] === OUTLINE_COLOR[1] && d[i + 2] === OUTLINE_COLOR[2]) { outl++; continue; }
        if (!a(x - 1, y) || !a(x + 1, y) || !a(x, y - 1) || !a(x, y + 1)) bad++;
      }
      return bad === 0 && outl > 10;
    }
    const sets = SPR.mofa.frames.concat([SPR.mofa.rider], SPR.driverRun);
    Object.keys(SPR.cars).forEach(function (k) { const C = SPR.cars[k]; sets.push(C.frames[0], C.frames[1], C.wreck); });
    check("ride art: mofa, rider, cars, wrecks and runners have dark outlines on every edge", sets.every(function (s) { return outlined(s.r) && outlined(s.l); }), sets.length + " sets");
    const hs = {}; Object.keys(SPR.cars).forEach(function (k) { hs[k] = SPR.cars[k].frames[0].h; });
    check("ride art: the X7 the tallest car, Ferrari at most 32 px", hs.ferrari <= 32 && hs.suv > hs.tesla && hs.suv > hs.ferrari, JSON.stringify(hs));
    // at the mofa sprite's scale (~25 px per metre): 110-130 px long, X7 ~45, Tesla ~36, Ferrari ~30; driver heads >= 8 px
    const sizes = {}, heads = {};
    Object.keys(SPR.cars).forEach(function (k) {
      const S = SPR.cars[k].frames[0]; sizes[k] = S.w + "x" + S.h;
      const raw = drawCar(k, 0, false), d = raw.getContext("2d").getImageData(0, 0, raw.width, raw.height).data;
      let top = 99, bottom = -1;
      for (let y = 0; y < raw.height; y++) for (let x = 0; x < raw.width; x++) {
        const i = (y * raw.width + x) * 4;
        if (d[i] === 0xe8 && d[i + 1] === 0xb8 && d[i + 2] === 0x98) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
      }
      heads[k] = bottom - top + 1 + 2;                          // skin rows + the two hair rows above
    });
    const near = function (v, want) { return Math.abs(v - want) <= 2; };
    check("ride art: cars at the mofa's scale (110-130 px long, X7 ~45, Tesla ~36, Ferrari ~30 px tall)",
      ["suv", "tesla", "ferrari"].every(function (k) { const S = SPR.cars[k].frames[0]; return S.w >= 110 && S.w <= 130; }) &&
      near(hs.suv, 45) && near(hs.tesla, 36) && near(hs.ferrari, 30), JSON.stringify(sizes));
    check("ride art: every driver's head is at least 8 px high", Object.keys(heads).every(function (k) { return heads[k] >= 8; }), JSON.stringify(heads));
    const bodies = ["suv", "tesla", "ferrari"].map(function (k) { return CAR_COLORS[k].body; });
    check("ride art: the three road cars have distinct main colours (plus the white limo)", Object.keys(SPR.cars).length === 4 && CAR_COLORS.limo.body === "#f0eee6" && bodies.filter(function (c, i) { return bodies.indexOf(c) === i; }).length === 3, bodies.join(","));
    // like the photos: X7 dark grey with a chrome grille; Tesla deep red with a black roof; Ferrari bright red, black rear, yellow calipers
    function has(k, hex, x0, x1) {
      const c = drawCar(k, 0, false), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
      const t = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
      let n = 0;
      for (let y = 0; y < c.height; y++) for (let x = Math.round(x0 * c.width); x < Math.round(x1 * c.width); x++) {
        const i = (y * c.width + x) * 4;
        if (d[i] === t[0] && d[i + 1] === t[1] && d[i + 2] === t[2]) n++;
      }
      return n;
    }
    const lum = function (hex) { return (parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16)) / 3; };
    const x7c = CAR_COLORS.suv, tc = CAR_COLORS.tesla, fc = CAR_COLORS.ferrari;
    const photoInfo = { x7grille: has("suv", x7c.chrome, 0.9, 1), teslaRoof: has("tesla", "#15171a", 0.2, 0.75), ferrariRear: has("ferrari", "#15171a", 0, 0.15), calipers: has("ferrari", "#f0c010", 0, 1) };
    check("ride art: like the photos (grey X7 with a chrome grille at the front, deep-red Tesla with a black roof, bright-red Ferrari with a black rear and yellow calipers)",
      lum(x7c.body) < 90 && Math.abs(parseInt(x7c.body.slice(1, 3), 16) - parseInt(x7c.body.slice(5, 7), 16)) < 20 && photoInfo.x7grille > 20 &&
      parseInt(tc.body.slice(1, 3), 16) > 2 * parseInt(tc.body.slice(3, 5), 16) && lum(tc.body) < lum(fc.body) && photoInfo.teslaRoof > 20 &&
      parseInt(fc.body.slice(1, 3), 16) > 200 && photoInfo.ferrariRear > 20 && photoInfo.calipers >= 4, JSON.stringify(photoInfo));
    // wheel spokes turn with the speed
    function wheelChanges(speed) {
      loadRide([], 400); Player.vx = speed; let n = 0, prev = null;
      for (let i = 0; i < 60; i++) { Mofa.update(Player, DT, Game.level); Player.vx = speed; const f = Math.floor(Player.wheelT) % 4; if (prev !== null && f !== prev) n++; prev = f; }
      return n;
    }
    const slow = wheelChanges(30), fast = wheelChanges(CONFIG.mofaTop), still = wheelChanges(0);
    check("ride art: the wheels turn in step with the speed", still === 0 && fast > slow * 2 && slow > 0, "still " + still + ", slow " + slow + ", fast " + fast);
    // muzzle flash at the barrel when firing
    loadRide([], 300);
    Film.enabled = false;
    Player.shootT = 0.07; Game.render();
    const mx = Math.round(Player.x + Player.w / 2 - MOFA_SPR_W / 2 - Camera.x), my = Math.round(Player.y + Player.h - MOFA_SPR_H - Camera.y + HUD_H);
    const fp = ctx.getImageData(mx + MOFA_SPR_W + 2, my + MOFA_GUN_Y, 1, 1).data;
    Film.enabled = true;
    check("ride art: a muzzle flash shows at the end of the gun barrel when firing", fp[0] === 255 && fp[1] === 246 && fp[2] === 192, Array.from(fp).join(","));
    // colours sampled from the photo
    const pal = ASSETS_META.mofaPalette || {}, raw = drawMofa(0).getContext("2d");
    function hex(x, y) { const d = raw.getImageData(x, y, 1, 1).data; return "#" + [d[0], d[1], d[2]].map(function (v) { return v.toString(16).padStart(2, "0"); }).join(""); }
    check("ride art: the mofa's red frame, chrome tank, seat and engine colours come from sachs-mofa.jpg",
      pal.frame && hex(16, 13) === pal.frame && hex(24, 6) === pal.chrome && hex(12, MOFA_SEAT_Y + 1) === pal.seat && hex(17, 17) === pal.engine &&
      /^#[89a-f]/.test(pal.frame), JSON.stringify(pal) + " " + [hex(16, 13), hex(24, 6), hex(12, MOFA_SEAT_Y + 1), hex(17, 17)].join(","));
    Input.reset();
  });

  safe("ride map", function () {
    const d = LEVEL_DATA[0], m = d.map.join("|");
    Player.resetForGame(); Game.loadLevel(0); Game.setState(STATE.PLAY);
    const place = Game.signs.filter(function (s) { return s.ch === "S"; }), dir = Game.signs.filter(function (s) { return s.ch === ">"; }).sort(function (a, b) { return a.tx - b.tx; });
    const dists = dir.map(function (s) { return Mofa.signText(s); });
    const metres = dists.map(function (t) { return /KM/.test(t) ? parseFloat(t) * 1000 : parseFloat(t); });
    const gate = Game.signs.filter(function (s) { return s.ch === "}"; })[0];
    check("ride map: a WOLLERAU place sign, at least two TC WOLLERAU direction signs counting down, the club gate at the exit",
      place.length >= 1 && Mofa.signText(place[0]) === "WOLLERAU" && dir.length >= 2 && metres.every(function (v, i) { return i === 0 || v < metres[i - 1]; }) &&
      gate && Game.exit && Game.exit.x >= gate.tx * TILE && Game.exit.x < (gate.tx + 4) * TILE, dists.join(" > "));
    check("ride map: 640 x 22 tiles, theme road, four stretches, the climb in the last third, 3 checkpoints, 8-10 fans, no weapon pickups",
      d.map[0].length === 640 && d.map.length === 22 && d.theme === "road" && d.bg === "bg_lake" && (m.match(/C/g) || []).length === 3 &&
      /^0 bg_lake, 160 bg_village, 320 bg_climb, 480 bg_club$/.test(d.stretches) && +d.climb.split("-")[0] >= 640 * 2 / 3 - 8 &&
      (m.match(/[Fe\]]/g) || []).length >= 8 && (m.match(/[Fe\]]/g) || []).length <= 10 && m.indexOf("w") < 0, d.map[0].length + "x" + d.map.length);
    check("ride map: ramps, the BMW X7, Tesla and Ferrari triggers, every wave kind, the limo, WD-40 cans; no road obstacles, no BMW sedan trigger",
      ["/", "1", "3", "4", "5", "6", "7", "8", "9", "{"].every(function (c) { return m.indexOf(c) >= 0; }) && (m.match(/9/g) || []).length === 1 && ["!", "_", ":", "2"].every(function (c) { return m.indexOf(c) < 0; }));
    // decoration doesn't block: at top speed through the whole road (no cars, no hazards, god mode)
    Game.enemies = []; Game.hazards = []; Cars.triggers = [];
    Game.godMode = true; press("right");
    let stalls = 0, last = Player.x;
    for (let i = 0; i < 60 * 120 && Game.state === STATE.PLAY; i++) { steps(1); if (i > 200 && Player.x <= last) stalls++; last = Player.x; }
    release("right"); Game.godMode = false;
    check("ride map: signs, guard rails, lamps and the gate don't block the mofa; the gate ends the ride", stalls === 0 && Game.state === STATE.LEVEL_COMPLETE,
      "state " + Game.state + ", stalls " + stalls);
    Input.reset();
  });

  safe("traffic waves", function () {
    // ride past a trigger at column 12 and watch which cars come, where and when
    function wave(ch, sec) {
      loadRide([[12, 9, ch]], 300); Game.godMode = true;
      Player.x = 6 * TILE; Player.vx = CONFIG.mofaTop; Camera.snap(Player, Game.level);
      const seen = [];
      press("right");
      let t = 0;
      steps(Math.round(sec * 60), function () {
        t += DT;
        Game.enemies.forEach(function (e) {
          if (seen.indexOf(e) < 0) { seen.push(e); e._t = t; e._ahead = e.x > Player.x; e._x0 = e.x; }
        });
      });
      release("right"); Game.godMode = false;
      return seen;
    }
    const w5 = wave("5", 2.5), s5 = w5.filter(function (e) { return e.type === "suv"; });
    let gapOk = false;
    if (s5.length === 2) {
      const a = Math.min(s5[0].x, s5[1].x), b = Math.max(s5[0].x, s5[1].x);
      gapOk = b - a >= 120;
    }
    check("waves: 5 is an X7 convoy, two X7s ahead of Buck, the second further ahead",
      s5.length === 2 && s5.every(function (e) { return e._ahead && e.awake; }) && gapOk, s5.map(function (e) { return Math.round(e._x0 - Player.x); }).join(","));
    const w6 = wave("6", 2.5), s6 = w6.filter(function (e) { return e.type === "tesla"; });
    check("waves: 6 is two Teslas from behind, about 0.8 s apart",
      s6.length === 2 && s6.every(function (e) { return !e._ahead; }) && Math.abs(Math.abs(s6[1]._t - s6[0]._t) - 0.8) < 0.1, s6.map(function (e) { return e._t.toFixed(2); }).join(","));
    const w7 = wave("7", 2.5), s7 = w7.filter(function (e) { return e.type === "ferrari"; });
    check("waves: 7 is a Ferrari pair from ahead, about 0.6 s apart",
      s7.length === 2 && s7.every(function (e) { return e._ahead && e.face === -1; }) && Math.abs(Math.abs(s7[1]._t - s7[0]._t) - 0.6) < 0.1, s7.map(function (e) { return e._t.toFixed(2); }).join(","));
    const w8 = wave("8", 2.5);
    const x7 = w8.filter(function (e) { return e.type === "suv"; }), te = w8.filter(function (e) { return e.type === "tesla"; });
    check("waves: 8 is an X7 ahead and a Tesla from behind",
      x7.length === 1 && x7[0]._ahead && te.length === 1 && !te[0]._ahead, w8.map(function (e) { return e.type; }).join(","));
    Cars.reset(); Game.enemies = [];
  });

  safe("president's limo", function () {
    // a short road: the limo, the club gate (4x4 from row 6) and the exit behind it
    function loadGate() {
      loadRide([[30, 9, "9"], [60, 6, "}"], [62, 9, "E"]], 90);
      return Game.enemies.filter(function (e) { return e.type === "limo"; })[0];
    }
    let L = loadGate();
    check("limo: parked 60 px before the club gate, 300 x 56 (taller than the X7), 30 hits",
      L && Math.abs(60 * TILE - (L.x + L.w) - 60) <= 1 && L.w === 300 && L.h === 56 && L.h > CAR_INFO.suv.h && L.hp === 30, L ? Math.round(60 * TILE - (L.x + L.w)) + " px" : "no limo");
    // blocking: full throttle at it for 6 s, hop included; Buck never gets past, gets hurt, the level doesn't end
    Player.x = L.x - 200; Camera.snap(Player, Game.level); L.corkT = 1e9;     // contact only, no corks
    let maxRight = -1e9, hurt = false, deaths = 0;
    press("right");
    steps(360, function (i) {
      if (i > 180 && i % 50 === 0) press("jump"); else if (i % 50 === 2) release("jump");   // hops at the limo
      if (Player.hp < CONFIG.maxHp) hurt = true;
      if (Player.dead) deaths++;
      maxRight = Math.max(maxRight, Player.x + Player.w - L.x);
      Player.hp = CONFIG.maxHp;                              // keep him alive
    });
    release("right"); release("jump");
    check("limo: blocks the road (never passed, even with hops), contact hurts, the level doesn't end",
      maxRight >= 0 && maxRight <= 2.01 && hurt && deaths === 0 && Game.state === STATE.PLAY && Game.gateLocked(),
      "overlap " + maxRight.toFixed(1) + ", hurt " + hurt + ", deaths " + deaths + ", state " + Game.state);
    // corks: every 1-1.5 s while Buck is within a screen (god mode: count only)
    L = loadGate(); Game.godMode = true;
    Player.x = L.x - 150; Camera.snap(Player, Game.level);
    const pops = []; let t = 0, fromRoof = true;
    steps(600, function () {
      t += DT;
      Game.enemyShots.forEach(function (q) { if (q.kind === "cork" && !q._seen) { q._seen = true; pops.push(t); if (q.t === 0 || q.t <= DT) fromRoof = fromRoof && Math.abs(q.x - (L.x + limoX(LIMO_SUNROOF_BX))) < 12; } });
    });
    Game.godMode = false;
    const gaps = pops.slice(1).map(function (x, i) { return x - pops[i]; });
    check("limo: the corks come from the sunroof", pops.length >= 3 && fromRoof);
    check("limo: the president pops a champagne cork every 1-1.5 s", gaps.length >= 3 && gaps.every(function (g) { return g >= 0.98 && g <= 1.55; }),
      gaps.map(function (g) { return g.toFixed(2); }).join(","));
    // a cork costs 1 health; a cork can be shot down
    L = loadGate(); Player.x = L.x - 300; Camera.snap(Player, Game.level); Player.invuln = 0;
    Game.enemyShots = [{ kind: "cork", x: Player.x + 4, y: Player.y + 8, w: 5, h: 4, vx: 0, vy: 0, grav: 0, dmg: 1, t: 0, shootable: true }];
    const hpC = Player.hp; steps(2);
    check("limo: a cork hit costs 1 health", Player.hp === hpC - 1, hpC + " -> " + Player.hp);
    L = loadGate(); Player.x = L.x - 300; Camera.snap(Player, Game.level);
    L.corkT = 99; Game.enemyShots = [];
    press("fire"); steps(1);
    const sh = Game.shots[0];
    Game.enemyShots = [{ kind: "cork", x: sh.x + 50, y: sh.y + sh.h / 2 - 2, w: 5, h: 4, vx: 0, vy: 0, grav: 0, dmg: 1, t: 0, shootable: true }];
    steps(30); release("fire");
    check("limo: a cork can be shot down", Game.enemyShots.length === 0 && Player.hp === CONFIG.maxHp);
    // the bar: on screen only
    L = loadGate();
    Player.x = 4 * TILE; Camera.snap(Player, Game.level);
    const off = Game.limoOnScreen();
    Player.x = L.x - 120; Camera.snap(Player, Game.level);
    TEXT_LOG.active = true; TEXT_LOG.items = []; Game.render(); TEXT_LOG.active = false;
    const bar = TEXT_LOG.items.join("|"); TEXT_LOG.items = [];
    check("limo: the bar THE PRESIDENT'S LIMO shows while the limo is on screen", !off && Game.limoOnScreen() === L && bar.indexOf("THE PRESIDENT'S LIMO") >= 0);
    // destroyed: 3000 points, the gate opens, riding on ends the level
    const sc = Game.score;
    for (let i = 0; i < 30; i++) damageEnemy(L, 1, 1);
    steps(2);
    check("limo: destroyed by 30 hits -> 3000 points, the gate opens", L.dead && Game.score - sc === 3000 && !Game.gateLocked(), "score +" + (Game.score - sc));
    Game.godMode = true; press("right");
    for (let i = 0; i < 600 && Game.state === STATE.PLAY; i++) steps(1);
    release("right"); Game.godMode = false;
    check("limo: after it, the mofa rides through the gate and the level completes", Game.state === STATE.LEVEL_COMPLETE, "state " + Game.state);
    Input.reset();
  });

  safe("wd-40", function () {
    loadRide([[12, 9, "{"]], 120);
    const can = Game.pickups.filter(function (q) { return q.type === "{"; })[0];
    Player.hp = CONFIG.maxHp - 3; sounds.length = 0;
    TEXT_LOG.active = true; TEXT_LOG.items = [];
    press("right");
    let puff = false;
    for (let i = 0; i < 180 && Game.pickups.indexOf(can) >= 0; i++) steps(1);
    steps(2, function () { Game.render(); if (FX.parts.some(function (q) { return q.wd40; })) puff = true; });
    release("right");
    TEXT_LOG.active = false;
    const texts = TEXT_LOG.items.join("|"); TEXT_LOG.items = [];
    check("wd-40: a 10 x 14 can on the ride; riding through it heals 2, shows WD-40 +2, a spray puff and the health sound",
      can && can.img.width >= 10 && can.img.height >= 14 && Game.pickups.indexOf(can) < 0 && Player.hp === CONFIG.maxHp - 1 &&
      texts.indexOf("WD-40 +2") >= 0 && puff && sounds.indexOf("health") >= 0, "hp " + Player.hp + ", puff " + puff);
    const m = LEVEL_DATA[0].map.join("");
    check("wd-40: the ride map has WD-40 cans and no Rivella or Cervelat", m.indexOf("{") >= 0 && m.indexOf("h") < 0 && m.indexOf("s") < 0);
  });

  safe("ride play-through", function () {
    // the whole ride as the harness plays it: god mode, holding Right and Fire, until the tally
    Player.resetForGame(); Game.loadLevel(0); Game.setState(STATE.PLAY); Game.godMode = true; Input.reset();
    press("right"); press("fire");
    let t = 0, limoT = -1, maxCars = 0;
    while (Game.state === STATE.PLAY && t < 60 * 180) {
      steps(1); t++;
      if (limoT < 0 && !Game.gateLocked()) limoT = t;
      maxCars = Math.max(maxCars, Game.enemies.filter(function (e) { return e.T.car && e.awake && !e.dead; }).length);
    }
    release("right"); release("fire"); Game.godMode = false;
    check("ride play-through: holding Right and Fire (god mode) destroys the limo and reaches the tally",
      Game.state === STATE.LEVEL_COMPLETE && limoT > 0, "state " + Game.state + " after " + (t / 60).toFixed(0) + " s, limo down at " + (limoT / 60).toFixed(0) + " s, up to " + maxCars + " cars at once");
    check("ride play-through: the ride takes 70-150 s at full throttle", t >= 70 * 60 && t <= 150 * 60, (t / 60).toFixed(0) + " s");
    Input.reset();
  });

  safe("machine gun sound", function () {
    loadRide([], 300); sounds.length = 0;
    Game.shots = []; let n = 0;
    press("fire");
    steps(60, function () { Game.shots.forEach(function (q) { if (!q.c) { q.c = true; n++; } }); });
    release("fire");
    const mg = sounds.filter(function (x) { return x === "mg"; }).length;
    check("mg sound: holding Fire on the mofa plays a machine-gun report with every volley (>= 8/s), never the blaster's sound",
      n >= 16 && mg * 2 === n && sounds.indexOf("shot") < 0, n + " shots, " + mg + " mg");
    load(grid(40, 12, [[3, 9, "P"]])); sounds.length = 0;
    press("fire"); steps(30); release("fire");
    check("mg sound: the blaster on foot keeps its own sound", sounds.indexOf("shot") >= 0 && sounds.indexOf("mg") < 0, sounds.join(","));
  });

  safe("limo ladies", function () {
    // heads in proportion to Buck on the mofa: the ladies' and the president's heads at least 8 px,
    // measured like the drivers' (skin rows + the hair/hat rows above)
    (function () {
      const raw = drawCar("limo", 0, false), d = raw.getContext("2d").getImageData(0, 0, raw.width, raw.height).data, pad = 0, sizes = [];
      LIMO_SPEAKERS.forEach(function (q) {
        const cx = limoX(q.bx) + pad;
        let top = 1e9, bottom = -1;
        for (let y = 0; y < raw.height; y++) for (let x = cx - 8; x <= cx + 8; x++) {
          const i = (y * raw.width + x) * 4;
          if (d[i] === 0xe8 && d[i + 1] === 0xb8 && d[i + 2] === 0x98) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
        }
        sizes.push(bottom - top + 1 + 2);
      });
      check("limo ladies: the ladies' and the president's heads are at least 8 px, in proportion to Buck", sizes.every(function (h) { return h >= 8; }), sizes.join(","));
    })();
    const bad = /\b(FUCK|SHIT|SEX|BITCH|DICK|PUSSY|ASS|DAMN)\b/;
    const all = LIMO_LADY_LINES.concat(PRESIDENT_LINES);
    const long = all.filter(function (l) { return l.length > 20; });
    const glyph = all.filter(function (l) { return l.split("").some(function (c) { return FONT_CHARS.indexOf(c) < 0; }); });
    check("limo ladies: at least 12 lady lines; all limo lines at most 20 characters, drawable, not explicit",
      LIMO_LADY_LINES.length >= 12 && !long.length && !glyph.length && !all.some(function (l) { return bad.test(l); }),
      LIMO_LADY_LINES.length + " lines" + (long.length ? ", long: " + long.join("|") : "") + (glyph.length ? ", glyphs: " + glyph.join("|") : ""));
    // the ladies are drawn at the windows: their hat colours in the limo sprite, not in the wreck
    const has = function (img, rgb) {
      const c = makeCanvas(img.width, img.height), g = c.getContext("2d"); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, img.width, img.height).data;
      for (let i = 0; i < d.length; i += 4) if (d[i] === rgb[0] && d[i + 1] === rgb[1] && d[i + 2] === rgb[2] && d[i + 3] === 255) return true;
      return false;
    };
    check("limo ladies: two ladies at the side windows (pink hat, pearls), gone in the wreck",
      has(SPR.cars.limo.frames[0].r, [0xe0, 0x70, 0xa0]) && has(SPR.cars.limo.frames[0].r, [0xf8, 0xf8, 0xf0]) && !has(SPR.cars.limo.wreck.r, [0xe0, 0x70, 0xa0]));
    // speech on screen: 20 s with the limo in view, Buck kept back (god mode)
    loadRide([[30, 9, "9"], [60, 6, "}"], [62, 9, "E"]], 90); Game.godMode = true;
    const L = Game.enemies.filter(function (e) { return e.type === "limo"; })[0];
    Player.x = L.x - 150; Camera.snap(Player, Game.level);
    let prev = null, starts = [], speakers = {}, t = 0, twoAtOnce = false, anchorOk = true;
    steps(60 * 20, function () {
      t += DT; Player.x = L.x - 150; Player.vx = 0;
      const talking = Game.enemies.filter(function (e) { return e.bubble && !e.dead; });
      if (talking.length > 1) twoAtOnce = true;
      if (L.bubble && L.bubble !== prev) {
        starts.push(t); speakers[L.bubble.dx] = (speakers[L.bubble.dx] || 0) + 1;
        if (LIMO_SPEAKERS.map(function (q) { return limoX(q.bx); }).indexOf(L.bubble.dx) < 0) anchorOk = false;
        const pool = L.bubble.dx === limoX(LIMO_SUNROOF_BX) ? PRESIDENT_LINES : LIMO_LADY_LINES;
        if (pool.indexOf(L.bubble.text) < 0) anchorOk = false;
      }
      prev = L.bubble;
    });
    const gaps = starts.slice(1).map(function (x, i) { return x - starts[i]; });
    check("limo ladies: a lady or the president speaks every 2-3 s, above the speaker, one bubble at a time",
      gaps.length >= 5 && gaps.every(function (g) { return g >= 1.95 && g <= 3.1; }) && LIMO_SPEAKERS.every(function (q) { return speakers[limoX(q.bx)]; }) && anchorOk && !twoAtOnce,
      "gaps " + gaps.map(function (g) { return g.toFixed(1); }).join(",") + " speakers " + JSON.stringify(speakers));
    // destroyed: no bubble, the president and both ladies run off
    for (let i = 0; i < CONFIG.limoHp; i++) damageEnemy(L, 1, 1);
    steps(2);
    const ladies = Cars.runners.filter(function (r) { return r.lady !== undefined; }).length;
    TEXT_LOG.active = true; TEXT_LOG.items = []; Game.render(); TEXT_LOG.active = false;
    const shown = TEXT_LOG.items.join("|"); TEXT_LOG.items = [];
    check("limo ladies: once the limo is destroyed its bubbles are gone and the ladies run off with the president",
      L.dead && ladies === 2 && Cars.runners.length >= 4 && !LIMO_LADY_LINES.concat(PRESIDENT_LINES).some(function (l) { return shown.indexOf(l) >= 0; }),
      ladies + " ladies, " + Cars.runners.length + " runners");
    Game.godMode = false; Input.reset();
  });

  safe("mofa smoke", function () {
    function puffs(sec, gas) {
      loadRide([], 300); FX.clear(); Player.smokeT = 0;
      if (gas) press("right");
      const seen = new Set(); let sizes = 0, lum = 0, n = 0, startOk = true, left = 0;
      steps(Math.round(sec * 60), function () {
        left = Player.x + Player.w / 2 - MOFA_SPR_W / 2;
        FX.parts.forEach(function (p) {
          if (!p.mofaSmoke || seen.has(p)) return;
          seen.add(p); n++; sizes += p.size;
          const m = /rgba\((\d+),(\d+),(\d+)/.exec(p.color); lum += (+m[1] + +m[2] + +m[3]) / 3;
          if (p.x > left + 2) startOk = false;                // behind the rear wheel (its left edge is at x 2)
        });
      });
      release("right");
      return { puffs: n / 2, size: sizes / Math.max(1, n), lum: lum / Math.max(1, n), startOk: startOk };
    }
    const idle = puffs(1, false), gas = puffs(1, true);
    check("mofa smoke: at least 3 puffs a second at idle, at least 12 while accelerating, larger and darker",
      idle.puffs >= 3 && gas.puffs >= 12 && gas.size > idle.size && gas.lum < idle.lum, JSON.stringify({ idle: idle, gas: gas }));
    // a puff: from behind the rear wheel, rises and drifts back, gone within 1.5 s
    loadRide([], 300); FX.clear(); Player.smokeT = 0; steps(1);
    const p = FX.parts.filter(function (q) { return q.mofaSmoke; })[0], x0 = p.x, y0 = p.y;
    steps(30);
    const rose = p.y < y0, back = p.x < x0;
    Player.smokeT = 99;                                     // no new puffs
    steps(60);
    check("mofa smoke: a puff starts behind the rear wheel, rises, drifts back and fades within 1.5 s",
      idle.startOk && gas.startOk && rose && back && FX.parts.indexOf(p) < 0 && p.max <= 1.5);
    Input.reset();
  });

  safe("twin gun", function () {
    // a car kept at a fixed gap behind the mofa (its own AI overridden each step)
    function behind(gap, fire, up) {
      loadRide([], 300); Game.godMode = true;
      Player.x = 100 * TILE; Camera.snap(Player, Game.level);
      const e = makeEnemy("tesla", 0, Player.y + Player.h, Game.level, 1);
      e.awake = true; e.hp = 999; Game.enemies.push(e);
      const place = function () { e.x = Player.x - gap - e.w; e.vx = 0; e.state = "x"; };
      place();
      Game.shots = []; sounds.length = 0; let back = 0, fwd = 0, fwdUp = 0, backLevel = true; const hp0 = e.hp;
      if (fire) press("fire");
      if (up) press("up");
      steps(60, function () {
        place();
        Game.shots.forEach(function (q) {
          if (q.counted) return;
          q.counted = true;
          if (q.vx < 0) { back++; if (q.vy !== 0) backLevel = false; } else { fwd++; if (q.vy < 0) fwdUp++; }
        });
      });
      release("fire"); release("up"); Game.godMode = false;
      return { back: back, fwd: fwd, fwdUp: fwdUp, backLevel: backLevel, hit: hp0 - e.hp, mg: sounds.filter(function (x) { return x === "mg"; }).length };
    }
    const both = behind(30, true);
    check("twin gun: Fire held for 1 s fires at least 8 shots forward and 8 backward", both.fwd >= 8 && both.back >= 8 && both.fwd === both.back, JSON.stringify(both));
    check("twin gun: the rear gun hits a car behind", both.hit > 0, JSON.stringify(both));
    check("twin gun: one machine-gun report per volley", both.mg === both.fwd, JSON.stringify(both));
    const idle = behind(30, false);
    check("twin gun: no automatic fire (a car behind, Fire not held: no shots)", idle.fwd === 0 && idle.back === 0, JSON.stringify(idle));
    const up = behind(30, true, true);
    check("twin gun: Up angles the front gun only; the rear gun fires level", up.fwdUp === up.fwd && up.fwd >= 8 && up.backLevel && up.back >= 8, JSON.stringify(up));
    check("twin gun: no rear turret any more", typeof Mofa.rearThreat === "undefined" && typeof Mofa.rearTarget === "undefined" && !SPR.mofa.gunBack);
    Input.reset(); Game.enemies = [];
  });

  safe("posh lines", function () {
    const bad = /\b(FUCK|SHIT|SEX|BITCH|DICK|PUSSY|ASS|DAMN)\b/;
    const long = POSH_LINES.filter(function (l) { return l.length > 20; });
    const glyph = POSH_LINES.filter(function (l) { return l.split("").some(function (c) { return FONT_CHARS.indexOf(c) < 0; }); });
    check("posh lines: at least 12 lines, at most 20 characters, drawable, not explicit",
      POSH_LINES.length >= 12 && !long.length && !glyph.length && !POSH_LINES.some(function (l) { return bad.test(l); }),
      POSH_LINES.length + " lines" + (long.length ? ", long: " + long.join("|") : "") + (glyph.length ? ", glyphs: " + glyph.join("|") : ""));
    // a car coming on screen: its driver speaks within 0.5 s, then every 2.5-3.5 s (one car on screen)
    const firsts = [], gaps = [];
    ["suv", "tesla", "ferrari"].forEach(function (kind) {
      loadRide([], 300); Game.godMode = true;
      Player.x = 60 * TILE; Camera.snap(Player, Game.level);
      const d = makeEnemy(kind, Camera.x + W + 80, Player.y + Player.h, Game.level, 1);
      d.awake = true; d.throwT = 99; d.state = "x"; Game.enemies.push(d);
      let t = 0, seenT = -1, prevB = null, starts = [];
      steps(60 * 9, function () {
        t += DT;
        // drive into view, then stay on screen ahead of Buck
        d.x = Math.max(Camera.x + 160, Camera.x + W + 80 - t * 200); d.vx = 0; d.state = "x"; d.throwT = 99;
        if (seenT < 0 && d.x < Camera.x + W) seenT = t;
        if (d.bubble && d.bubble !== prevB) starts.push(t);
        prevB = d.bubble;
      });
      Game.godMode = false;
      firsts.push(starts.length ? starts[0] - seenT : 99);
      starts.slice(1).forEach(function (x, k) { gaps.push(x - starts[k]); });
    });
    check("posh lines: every car's driver speaks within 0.5 s of showing up",
      firsts.every(function (f) { return f >= 0 && f <= 0.52; }), firsts.map(function (f) { return f.toFixed(2); }).join(","));
    check("posh lines: then again every 2.5-3.5 s while on screen, each bubble about 1.5 s",
      gaps.length >= 6 && gaps.every(function (g) { return g >= 2.45 && g <= 3.55; }) && CONFIG.driverTalkT === 1.5, gaps.map(function (g) { return g.toFixed(2); }).join(","));
    // many cars on screen: at most two car bubbles, never overlapping each other or a fan bubble
    loadRide([[14, 9, "]"], [17, 9, "]"], [20, 9, "]"], [23, 9, "]"]], 300); Game.godMode = true;
    Player.x = 10 * TILE; Camera.snap(Player, Game.level);
    const crowd = ["suv", "tesla", "suv", "ferrari"].map(function (k, n) {
      const e = makeEnemy(k, 0, Player.y + Player.h, Game.level, 1); e.awake = true; Game.enemies.push(e); return e;
    });
    let most = 0, clash = 0, frames = 0, both = 0;
    steps(60 * 12, function (n) {
      crowd.forEach(function (e, k) { e.x = Camera.x + 30 + k * 70; e.vx = 0; e.state = "x"; e.throwT = 99; });
      if (n % 3) return;
      Game.render(); frames++;
      const cars = Talk.rects(Camera.x, Camera.y), fans = Fans.shown || [];
      most = Math.max(most, cars.length);
      if (cars.length === 2) both++;
      for (let a = 0; a < cars.length; a++) {
        for (let b = a + 1; b < cars.length; b++) if (rectsTouch(cars[a], cars[b], 0)) clash++;
        fans.forEach(function (f) { if (rectsTouch(cars[a], f, 0)) clash++; });
      }
    });
    Game.godMode = false;
    check("posh lines: at most 2 car bubbles at once on the ride, never overlapping each other or a fan's bubble",
      most === 2 && both > 0 && clash === 0, "most " + most + ", two at once in " + both + "/" + frames + " frames, overlaps " + clash);
    // other levels keep one bubble at a time (lawyers)
    load(grid(40, 12, [[3, 9, "P"], [12, 9, "L"], [20, 9, "L"]]));
    const l1 = Game.enemies[0], l2 = Game.enemies[1];
    const s1 = Talk.say(l1, LAWYER_LINES, 1.5), s2 = Talk.say(l2, LAWYER_LINES, 1.5);
    check("posh lines: off the ride, one speech bubble at a time (lawyers)", s1 && !s2 && !l2.bubble);
    Input.reset(); Game.enemies = [];
  });

  safe("mofa no climbing", function () {
    const items = [];
    for (let y = 4; y <= 9; y++) items.push([5, y, "H"]);
    loadRide(items);
    Player.x = 5 * TILE + 8 - Player.w / 2; steps(2);
    holdFor("up", 0.5);
    const climbed = Player.climbing;
    holdFor("down", 0.5);
    check("mofa: Up and Down neither climb ladders nor kneel", !climbed && !Player.climbing && !Player.kneeling && Player.h === CONFIG.mofaH);
  });

  safe("mofa respawn", function () {
    loadRide([[30, 9, "C"]]);
    press("right"); steps(400); release("right");
    const cp = Game.checkpoints[0];
    Player.lives = 3; Player.hp = 1; Player.invuln = 0; Player.hurt(5);
    steps(120);
    const cx = Player.x + Player.w / 2;
    check("mofa: after a lost life Buck respawns on the mofa at the checkpoint, at a standstill, full health",
      cp.on && !Player.dead && Player.w === CONFIG.mofaW && Math.abs(cx - (cp.x + cp.w / 2)) < 2 && Player.vx === 0 && Player.hp === CONFIG.maxHp,
      "cx " + cx.toFixed(1) + " cp " + (cp.x + cp.w / 2) + " vx " + Player.vx + " hp " + Player.hp);
  });

  safe("ride checkpoints", function () {
    // the real map: ride over each flag, then lose a life there
    const cps = LEVEL_DATA[0].map.join("|");
    let n = 0;
    for (let k = 0; k < 3; k++) {
      Player.resetForGame(); Game.loadLevel(0); Game.setState(STATE.PLAY); Input.reset();
      const L = Game.level, cp = Game.checkpoints.slice().sort(function (a, b) { return a.x - b.x; })[k];
      if (!cp) break;
      n++;
      Game.godMode = true;
      Player.x = cp.x - 80; Mofa.mount(Player); Camera.snap(Player, L);
      Game.enemies = Game.enemies.filter(function (e) { return e.type === "limo"; });
      Cars.triggers = Cars.triggers.filter(function (t) { return t.tx * TILE > cp.x + 2 * W; });   // no traffic near the test
      press("right"); steps(90); release("right");
      const flagUp = cp.on;
      steps(40);                                       // roll on a little
      // a car parked on the flag and the limo hurt a bit, then the life is lost
      const t = makeEnemy("tesla", cp.x + cp.w / 2, Player.y + Player.h, L, 1); t.awake = true; t.state = "x"; Game.enemies.push(t);
      const limo = Game.enemies.filter(function (e) { return e.type === "limo"; })[0], limoHp = limo ? (limo.hp -= 3) : 0;
      const trig = Cars.triggers.length;
      Game.godMode = false; Player.lives = 3; Player.hp = 1; Player.invuln = 0; Player.hurt(5);
      let respawned = false, hpLoss = false;
      for (let i = 0; i < 240; i++) {
        steps(1);
        if (!respawned && !Player.dead && Player.invuln > 0) respawned = true;
        if (respawned && Player.invuln > 0 && Player.hp < CONFIG.maxHp) hpLoss = true;
        if (respawned && i > 200) break;
      }
      const cx = Player.x + Player.w / 2, ground = Math.min(L.roadTop(Player.x + 4), L.roadTop(Player.x + Player.w - 4));
      const roadOnScreen = L.roadTop(cx) - Camera.y;
      const onClimb = L.climb && cx >= L.climb.x0 && cx <= L.climb.x1;
      check("checkpoints: flag " + (k + 1) + (onClimb ? " (on the climb)" : "") + " goes up when passed; after a lost life the mofa respawns there on the road, standing, full health, the camera on the road",
        flagUp && respawned && Player.lives === 2 && Math.abs(cx - (cp.x + cp.w / 2)) < 2 && Math.abs(Player.y + Player.h - ground) <= 1 &&
        Player.w === CONFIG.mofaW && Player.hp === CONFIG.maxHp && roadOnScreen > VIEW_H - 48 && roadOnScreen < VIEW_H,
        "flag " + flagUp + ", dx " + (cx - (cp.x + cp.w / 2)).toFixed(1) + ", feet-road " + (Player.y + Player.h - ground).toFixed(1) + ", hp " + Player.hp + ", road at " + roadOnScreen.toFixed(0));
      check("checkpoints: flag " + (k + 1) + ": a safe respawn (the car on the flag gone, no hit while blinking, triggers still used" + (limo ? ", the limo keeps its damage" : "") + ")",
        Game.enemies.indexOf(t) < 0 && !hpLoss && Cars.triggers.length === trig && (!limo || (Game.enemies.indexOf(limo) >= 0 && limo.hp === limoHp)),
        "hp loss " + hpLoss);
    }
    check("checkpoints: the ride has 3 flags", n === 3 && (cps.match(/C/g) || []).length === 3);
    // game over on the ride
    Player.resetForGame(); Game.loadLevel(0); Game.setState(STATE.PLAY); Input.reset();
    Player.lives = 1; Player.hp = 1; Player.invuln = 0; Player.hurt(5);
    steps(240);
    check("checkpoints: losing the last life on the ride shows the game-over screen", Game.state === STATE.GAME_OVER, "state " + Game.state);
    Input.reset();
  });

  safe("mofa touch", function () {
    withTouch(true, function () {
      const L = Touch.layout, P_ = L.pad;
      const R = [P_.x + P_.r * 0.7, P_.y], Lf = [P_.x - P_.r * 0.7, P_.y], J = [L.jump.x, L.jump.y];
      loadRide();
      ptr("pointerdown", 80, R[0], R[1]); steps(180);
      const fast = Player.vx;
      ptr("pointermove", 80, Lf[0], Lf[1]); steps(90);
      const stopped = Player.vx <= 0;
      ptr("pointerup", 80, Lf[0], Lf[1]);
      const y0 = Player.y; let minY = y0;
      ptr("pointerdown", 81, J[0], J[1]); steps(2); ptr("pointerup", 81, J[0], J[1]);
      for (let i = 0; i < 30; i++) { steps(1); minY = Math.min(minY, Player.y); }
      check("mofa: touch pad Right/Left and the Jump button ride the mofa", fast > CONFIG.mofaTop * 0.9 && stopped && y0 - minY >= 20,
        "vx " + fast.toFixed(1) + ", rise " + (y0 - minY).toFixed(1));
      Input.reset();
    });
  });

  safe("drop through", function () {
    // Buck stands on a one-way ledge (row 6) above the floor (row 10)
    function onLedge(ch) {
      const items = [[3, 5, "P"]];
      for (let x = 1; x < 8; x++) items.push([x, 6, ch]);
      load(grid(30, 12, items));
      return Player.y + Player.h;
    }
    [["=", "ledge"], ["T", "clubhouse table"], ["a", "bar counter"]].forEach(function (c) {
      const top = onLedge(c[0]);
      press("down"); steps(10); press("jump"); steps(2); release("jump"); steps(60);
      check("drop: Down + Jump drops through a " + c[1], top === 96 && Player.onGround && Math.abs(Player.y + Player.h - 160) < 1,
        "feet " + top + " -> " + (Player.y + Player.h));
      release("down"); Input.reset();
    });
    const top = onLedge("=");
    press("down"); steps(60);
    check("drop: holding Down alone keeps Buck kneeling on the ledge", Player.kneeling && Math.abs(Player.y + Player.h - top) < 1,
      "feet " + top + " -> " + (Player.y + Player.h) + " kneeling " + Player.kneeling);
    release("down"); Input.reset();
  });

  safe("kneel duck", function () {
    const FLOOR = 10 * 16;
    // a law book flying level at chest height (8-10 px above where a kneeling hero ends)
    function lawbook(kneel) {
      load(grid(40, 12, [[3, 9, "P"]]));
      Game.enemies = [];
      if (kneel) { press("down"); steps(5); }
      const hp0 = Player.hp;
      Game.enemyShots = [{ kind: "lawbook", code: 0, x: Player.x + 80, y: FLOOR - 26, w: 10, h: 8, vx: -125, vy: 0, grav: 0, dmg: 1, t: 0 }];
      steps(60);
      const hit = Player.hp < hp0;
      release("down"); Input.reset();
      return hit;
    }
    const kneelHit = lawbook(true), standHit = lawbook(false);
    check("kneel: a law book at chest height passes over a kneeling hero", !kneelHit && standHit, "kneeling hit " + kneelHit + ", standing hit " + standHit);
    // a crayfish walking into a kneeling hero still hurts
    load(grid(40, 12, [[3, 9, "P"]]));
    press("down"); steps(5);
    const c = makeEnemy("cray", Player.x + 40, FLOOR, Game.level, -1);
    c.active = true; Game.enemies = [c];
    const hp1 = Player.hp;
    steps(90, function () { c.cd = 99; c.vx = -CONFIG.craySpeed; c.face = -1; });
    check("kneel: a crayfish walking into a kneeling hero hurts him", Player.hp < hp1, "hp " + hp1 + " -> " + Player.hp);
    release("down"); Input.reset();
    // the boss shockwave (12 px high, along the floor) still hits
    load(grid(40, 12, [[3, 9, "P"]]));
    Game.enemies = [];
    press("down"); steps(5);
    const hp2 = Player.hp;
    Game.enemyShots = [{ kind: "shockwave", x: Player.x + 60, y: FLOOR - 12, w: 12, h: 12, vx: -150, life: 3, dmg: 2 }];
    steps(40);
    check("kneel: the boss shockwave still hits a kneeling hero", Player.hp < hp2, "hp " + hp2 + " -> " + Player.hp);
    release("down"); Input.reset();
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
    Player.resetForGame(); Game.loadLevel(4); Game.setState(STATE.BOSS); Game.godMode = true; Game.stats.shots = 0;
    press("fire"); steps(30); Input.reset();
    res.push("disc cutter " + Game.stats.shots); if (Game.stats.shots < 1) ok = false;
    Game.godMode = false;
    check("firing: shots are fired in every situation (standing, running, jumping, ladder, hurt, fan, cutter)", ok, res.join(", "));
  });

  safe("fullscreen", function () {
    // stub the Fullscreen and Keyboard Lock APIs (headless Chrome can't really go fullscreen)
    // desktop behaviour: touch mode skips the Windows-key lock, so these run with it off
    const touchOn = Touch.on; if (touchOn) Touch.disable();
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
      if (touchOn) Touch.enable();
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
    function hitShot() { Game.enemyShots.push({ kind: "lawbook", code: 0, x: Player.x, y: Player.y + 5, w: 10, h: 8, vx: 0, vy: 0, grav: 0, dmg: 1 }); }
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
    check("levels: mofa ride, 3 levels + boss arena (5 reels)", LEVEL_DATA.length === 5 && LEVEL_DATA[0].ride === "1" && LEVEL_DATA[4].boss === "1", LEVEL_DATA.map(function (l) { return l.name; }).join(" / "));
    check("levels: order ride, courts, creek, clubhouse, boss",
      /ROAD TO WOLLERAU/.test(LEVEL_DATA[0].name) && /CLAY COURTS/.test(LEVEL_DATA[1].name) && /KREBSBACH/.test(LEVEL_DATA[2].name) && /CLUBHOUSE|HALL/.test(LEVEL_DATA[3].name));
    const types = {};
    LEVEL_DATA.forEach(function (d, i) {
      const s = d.map.join("\n");
      check("level " + (i + 1) + ": has start" + (d.boss ? " and boss" : ", exit and checkpoint"),
        s.indexOf("P") >= 0 && (d.boss ? s.indexOf("X") >= 0 : s.indexOf("E") >= 0 && s.indexOf("C") >= 0));
      if (d.ride) return;                  // the ride's size and road are checked in "ride map"
      check("level " + (i + 1) + ": size within 150-250 x 15-40 tiles (boss 40x15)",
        d.boss ? d.map[0].length === 40 && d.map.length === 15 : d.map[0].length >= 150 && d.map[0].length <= 250 && d.map.length >= 15 && d.map.length <= 40,
        d.map[0].length + "x" + d.map.length);
      "LKM".split("").forEach(function (c) { if (s.indexOf(c) >= 0) types[c] = true; });
    });
    check("levels: all three enemy types appear", types.L && types.K && types.M);
    check("levels: creek level has water", LEVEL_DATA[2].map.join("").indexOf("~") >= 0);
    Player.resetForGame(); Game.score = 0;
    Game.loadLevel(3); Game.setState(STATE.PLAY); Game.completeLevel(); Game.tally.done = true; Game.nextLevel();
    check("levels: exiting the clubhouse (reel 4) starts the boss arena", Game.level.isBoss && Game.levelIndex === 4);
    Game.loadLevel(0); Game.setState(STATE.PLAY); Game.completeLevel(); Game.tally.done = true; Game.nextLevel();
    check("levels: the ride (reel 1) leads to the clay courts (reel 2)", Game.levelIndex === 1 && /CLAY COURTS/.test(Game.level.name));
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
    const l1 = LEVEL_DATA[1].map.join(""), l2 = LEVEL_DATA[2].map.join("");
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
    steps(150, function () { if (Game.enemyShots.some(function (s) { return s.kind === "lawbook" && s.vx < 0; })) thrown = true; });
    check("lawyer: throws a law book toward the hero", thrown && sounds.indexOf("throw") >= 0);
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
    Game.loadLevel(4); Game.setState(STATE.BOSS); nearBoss();
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
    nearBoss(); Game.shots = []; Boss.toIdle(); Boss.t = 99; Boss.claw = 0;
    Player.fire(); const hpB = Boss.hp; steps(60);
    check("boss: floor shot hits closed claws (deflect)", Boss.deflects > 0 && Boss.hp === hpB);
    // attack cycle
    Game.godMode = true; Boss.log = []; Boss.toIdle();
    let maxShake = 0, sawBubble = false, sawWave = false;
    steps(60 * 14, function () {
      maxShake = Math.max(maxShake, FX.shakeAmp);
      Game.enemyShots.forEach(function (s) { if (s.kind === "bubble") sawBubble = true; if (s.kind === "shockwave") sawWave = true; });
    });
    check("boss: claw slam shakes the screen and sends a shockwave", Boss.log.indexOf("slam") >= 0 && maxShake >= 5 && sawWave, Boss.log.join(",") + " shake " + maxShake + " wave " + sawWave + " state " + Boss.state + " game " + Game.state);
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
    Player.resetForGame(); Game.loadLevel(4); Game.setState(STATE.BOSS);
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
    check("reel cards: reel 2 shows countdown 3-2-1 then REEL 2 with the level name, then play",
      l2.seq === "leader,card" && l2.digits === "321" && l2.texts.indexOf("REEL 2") >= 0 && l2.texts.indexOf("CLAY COURTS") >= 0 && l2.state === STATE.PLAY,
      l2.seq + " " + l2.digits);
    check("reel cards: no MISSING REEL before a normal level", l2.texts.indexOf("MISSING REEL") < 0);
    const boss = phaseSeq(4);
    check("reel cards: MISSING REEL card before the boss arena's intro", boss.seq === "missing,leader,card" &&
      boss.texts.indexOf("MISSING REEL") >= 0 && boss.texts.indexOf("FINAL REEL") >= 0 && boss.state === STATE.BOSS, boss.seq);
    Player.resetForGame(); Game.loadLevel(1); steps(20); tap("enter");
    check("reel cards: Enter skips straight to play", Game.state === STATE.PLAY && Game.stateT < 0.1);
    Game.loadLevel(1); steps(20); tap("jump");
    check("reel cards: Space skips straight to play", Game.state === STATE.PLAY);
  });

  safe("poster and end cards", function () { withTouch(false, function () {
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
    // build version in small print, bottom right, inside the screen, clear of the other title boxes
    const vw = textWidth(BUILD_VERSION, 1), vx = TITLE_VERSION_POS.x - vw, vy = TITLE_VERSION_POS.y;
    const vbox = { x: vx - 1, y: vy - 1, w: vw + 2, h: 9 };
    const boxes = { badge: { x: 250, y: 186, w: 58, h: 30 }, pressEnter: { x: 130 - textWidth("PRESS ENTER", 2) / 2, y: 186, w: textWidth("PRESS ENTER", 2), h: 14 },
      sound: { x: 130 - textWidth("SOUND ON (M)", 1) / 2, y: 218, w: textWidth("SOUND ON (M)", 1), h: 8 },
      soundFirst: { x: 130 - textWidth("PRESS ANY KEY", 2) / 2, y: 186, w: textWidth("PRESS ANY KEY", 2), h: 14 },
      filmed: { x: 130 - textWidth("FILMED ON LOCATION IN WOLLERAU", 1) / 2, y: 206, w: textWidth("FILMED ON LOCATION IN WOLLERAU", 1), h: 8 } };
    const hitBox = Object.keys(boxes).filter(function (k) { return overlap(vbox, boxes[k]); });
    check("title: the sound-first prompt PRESS ANY KEY fits the screen, clear of the badge",
      boxes.soundFirst.x >= 0 && boxes.soundFirst.x + boxes.soundFirst.w <= W && !overlap(boxes.soundFirst, boxes.badge));
    const undrawable = BUILD_VERSION.split("").filter(function (c) { return FONT_CHARS.indexOf(c) < 0; });
    check("title: build version shown in small print, bottom right",
      /^V\d/.test(BUILD_VERSION) && t.indexOf(BUILD_VERSION) >= 0 && undrawable.length === 0, BUILD_VERSION + (undrawable.length ? " missing glyphs " + undrawable.join("") : ""));
    check("title: version inside the screen and clear of badge, PRESS ENTER and the bottom lines",
      vx >= 0 && vy + 8 <= H && hitBox.length === 0, "x " + vx + " y " + vy + " overlaps " + hitBox.join(","));
    // level links: start-reel note bottom left, only for levels 2-4
    const notes = ["#level=3", "#level=5", "", "#level=1", "#level=9"].map(function (h) { Game.startHash = h; return [h, titleStartNote(), textsOf(STATE.TITLE)]; });
    Game.startHash = null;
    check("title: a level link shows STARTS AT REEL 3 / STARTS AT FINAL REEL",
      notes[0][2].indexOf("STARTS AT REEL 3") >= 0 && notes[1][2].indexOf("STARTS AT FINAL REEL") >= 0, notes[0][1] + " / " + notes[1][1]);
    check("title: no start note without a link, with level=1 or an invalid value",
      notes.slice(2).every(function (n) { return n[1] === "" && n[2].indexOf("STARTS AT") < 0; }), notes.slice(2).map(function (n) { return n[0] + ":" + n[1]; }).join(" "));
    const nw = textWidth("STARTS AT FINAL REEL", 1);
    const nbox = { x: TITLE_START_POS.x - 1, y: TITLE_START_POS.y - 1, w: nw + 2, h: 9 };
    const nhit = Object.keys(boxes).filter(function (k) { return overlap(nbox, boxes[k]); });
    check("title: start note inside the screen, clear of the version text and the other title boxes",
      nbox.x >= 0 && nbox.y + nbox.h <= H && !overlap(nbox, vbox) && nhit.length === 0, "overlaps " + nhit.join(",") + (overlap(nbox, vbox) ? " version" : ""));
    const go = textsOf(STATE.GAME_OVER), vi = textsOf(STATE.VICTORY);
    check("end cards: game over is a THE END card with the final score", go.indexOf("THE END") >= 0 && go.indexOf("FINAL SCORE") >= 0, go);
    check("end cards: victory is a THE END card with the final score", vi.indexOf("THE END") >= 0 && vi.indexOf("FINAL SCORE") >= 0, vi);
    FX.clear();
  }); });

  safe("touch texts", function () {
    function textsOf(state, setup) {
      if (setup) setup();
      Game.setState(state); Game.stateT = 3; Game.time = 0.1;   // blink phase: visible
      TEXT_LOG.active = true; TEXT_LOG.items = []; Game.render(); TEXT_LOG.active = false;
      return TEXT_LOG.items;
    }
    const KEYS = ["SPACE", "CTRL", "ALT", "ENTER", "ARROWS", "WASD", "PRESS", "ANY KEY", "(M)", "P/", "UP/DOWN"];
    function noKeys(list) { return list.filter(function (t) { return KEYS.some(function (k) { return t.indexOf(k) >= 0; }); }); }
    // desktop texts are unchanged
    withTouch(false, function () {
      const t = textsOf(STATE.TITLE).join("|");
      check("touch texts: desktop title keeps PRESS ENTER and the key list", t.indexOf("PRESS ENTER") >= 0 && t.indexOf("TAP") < 0 && titleControls() === TITLE_CONTROLS);
    });
    withTouch(true, function () {
      const items = textsOf(STATE.TITLE), t = items.join("|");   // the sound on
      Game.soundWasReady = false;                            // before the first tap
      const items0 = textsOf(STATE.TITLE), t0 = items0.join("|");
      items.push.apply(items, items0);                      // no keyboard keys before or after the first tap
      Game.soundWasReady = true;
      const ctl = titleControls(), txt = ctl.map(function (l) { return l.join(" "); }).join("|");
      check("touch texts: title says TAP FOR SOUND before the first tap, then TAP TO START", t0.indexOf("TAP FOR SOUND") >= 0 && t0.indexOf("TAP TO START") < 0 &&
        t.indexOf("TAP TO START") >= 0 && t.indexOf("TAP FOR SOUND") < 0, t0 + " // " + t);
      check("touch texts: controls list names pad, Jump, Fire, Down+Jump, Pause, Mute, Film",
        txt.indexOf("PAD MOVE/CLIMB/KNEEL") >= 0 && txt.indexOf("JUMP JUMP") >= 0 && txt.indexOf("FIRE FIRE") >= 0 && txt.indexOf("DOWN+JUMP DROP THROUGH") >= 0 &&
        txt.indexOf("PAUSE") >= 0 && txt.indexOf("MUTE") >= 0 && txt.indexOf("FILM FILTER") >= 0, txt);
      check("touch texts: fullscreen line only where the button exists", (txt.indexOf("FULLSCREEN") >= 0) === Touch.canFullscreen(), txt);
      check("touch texts: no keyboard keys on the touch title", noKeys(items).length === 0, noKeys(items).join(","));
      check("touch texts: controls fit the panel columns (labels 12, values 18 characters)",
        ctl.length <= 8 && ctl.every(function (l) { return l[0].length <= 12 && l[1].length <= 18; }));
      const ts = textsOf(STATE.TITLE, function () { if (!Sound.muted) Sound.toggleMute(); }).join("|");
      Sound.toggleMute();
      check("touch texts: sound status without the M key", ts.indexOf("SOUND OFF") >= 0 && ts.indexOf("(M)") < 0, ts);
      // prompts on the other screens
      Player.resetForGame(); Game.loadLevel(1); Game.setState(STATE.PLAY);
      const pz = textsOf(STATE.PAUSE).join("|");
      check("touch texts: pause says TAP II TO CONTINUE", pz.indexOf("TAP II TO CONTINUE") >= 0 && pz.indexOf("PRESS") < 0, pz);
      Game.setState(STATE.PLAY); Game.completeLevel(); Game.tally.shown = Game.tally.total; Game.tally.done = true;
      const lc = textsOf(STATE.LEVEL_COMPLETE).join("|");
      const go = textsOf(STATE.GAME_OVER).join("|"), vi = textsOf(STATE.VICTORY).join("|");
      check("touch texts: tally, game over and victory say TAP TO CONTINUE",
        [lc, go, vi].every(function (x) { return x.indexOf("TAP TO CONTINUE") >= 0 && x.indexOf("PRESS") < 0; }), [lc, go, vi].join(" / "));
      // placement: the tap prompts fit the screen and stay clear of the other title elements
      const sw = textWidth("TAP TO START", 2), start = { x: 130 - sw / 2, y: 186, w: sw, h: 14 };
      const mw = textWidth("SOUND ON", 1), music = { x: 130 - mw / 2, y: 218, w: mw, h: 8 };
      const tw = textWidth("TAP FOR SOUND", 2), tapSound = { x: 130 - tw / 2, y: 186, w: tw, h: 14 };
      const vw = textWidth(BUILD_VERSION, 1), vbox = { x: TITLE_VERSION_POS.x - vw - 1, y: TITLE_VERSION_POS.y - 1, w: vw + 2, h: 9 };
      const nw = textWidth("STARTS AT FINAL REEL", 1), nbox = { x: TITLE_START_POS.x - 1, y: TITLE_START_POS.y - 1, w: nw + 2, h: 9 };
      const badge = { x: 250, y: 186, w: 58, h: 30 }, filmed = { x: 130 - textWidth("FILMED ON LOCATION IN WOLLERAU", 1) / 2, y: 206, w: textWidth("FILMED ON LOCATION IN WOLLERAU", 1), h: 8 };
      const portrait = { x: 14, y: 80, w: 100, h: 104 };
      const inScreen = [start, music, tapSound].every(function (b) { return b.x >= 0 && b.y >= 0 && b.x + b.w <= W && b.y + b.h <= H; });
      const clashes = [[start, badge], [start, vbox], [start, nbox], [start, filmed], [start, portrait], [music, vbox], [music, nbox], [music, badge], [music, filmed],
        [tapSound, badge], [tapSound, vbox], [tapSound, nbox], [tapSound, filmed], [tapSound, portrait]]
        .filter(function (pr) { return overlap(pr[0], pr[1]); }).length;
      check("touch texts: title tap prompts inside the screen and clear of the other title elements", inScreen && clashes === 0, clashes + " overlaps");
      ["TAP TO CONTINUE", "TAP II TO CONTINUE"].forEach(function (s) {
        const w = textWidth(s, 1);
        check("touch texts: '" + s + "' fits the screen", W / 2 - w / 2 >= 0 && W / 2 + w / 2 <= W);
      });
      Input.reset(); FX.clear(); Game.setState(STATE.TITLE);
    });
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
    // reactions: a kill within 12 tiles -> every fan nearby cheers with her own line; one sound per 1.5 s; far fans stay calm
    sounds.length = 0;
    load(grid(70, 12, [[2, 9, "P"], [8, 9, "F"], [10, 9, "F"], [12, 9, "F"], [50, 9, "F"], [14, 9, "L"], [16, 9, "L"]]));
    Game.godMode = true; steps(10);
    const near3 = Fans.list.slice(0, 3), farF = Fans.list[3];
    damageEnemy(Game.enemies[0], 99); steps(1);
    const texts = near3.map(function (f) { return f.bubble && f.bubble.text; });
    check("fans: a kill nearby: every fan in range cheers and says her own line, one cheer sound",
      near3.every(function (f) { return f.cheerT > 0 && f.bubble && FAN_LINES.kill.indexOf(f.bubble.text) >= 0; }) &&
      texts.filter(function (x, k) { return texts.indexOf(x) === k; }).length === 3 && sounds.filter(function (n) { return n === "cheer"; }).length === 1,
      texts.join(" | ") + " / " + sounds.join(","));
    check("fans: fans more than 12 tiles away do not react", farF.cheerT === 0 && !farF.bubble);
    steps(30); damageEnemy(Game.enemies[Game.enemies.length - 1], 99); steps(1);
    check("fans: the cheer sound plays at most once per 1.5 s, one bubble per fan",
      sounds.filter(function (n) { return n === "cheer"; }).length === 1 && near3.every(function (f, k) { return f.bubble && f.bubble.text === texts[k]; }));
    Game.render();
    const shown = Fans.shown;
    function overlaps(a, b) { return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y); }
    let anyOverlap = false;
    for (let a = 0; a < shown.length; a++) for (let b = a + 1; b < shown.length; b++) if (overlaps(shown[a], shown[b])) anyOverlap = true;
    check("fans: drawn bubbles don't overlap", shown.length === 3 && !anyOverlap, shown.map(function (r) { return r.x + "," + r.y + " " + r.w; }).join(" / "));
    steps(95);
    check("fans: bubbles disappear after about 1.5 s", Fans.list.every(function (f) { return !f.bubble; }));
    // 5 fans in range: at most 3 bubbles
    load(grid(70, 12, [[2, 9, "P"], [7, 9, "F"], [9, 9, "F"], [11, 9, "F"], [13, 9, "F"], [15, 9, "F"], [18, 9, "L"]]));
    Game.godMode = true; steps(10);
    damageEnemy(Game.enemies[0], 99); steps(1); Game.render();
    check("fans: with 5 fans in range at most 3 bubbles are shown", Fans.list.filter(function (f) { return f.bubble; }).length <= 3 && Fans.shown.length <= 3 &&
      Fans.list.every(function (f) { return f.cheerT > 0; }), Fans.shown.length + " shown");
    Game.godMode = false;
    Input.reset();
  });

  safe("fan lines", function () {
    const all = [].concat(FAN_LINES.shout, FAN_LINES.kill, FAN_LINES.trophy, FAN_LINES.checkpoint);
    const distinct = all.filter(function (l, i) { return all.indexOf(l) === i; });
    check("fan lines: at least 30 distinct lines, 12+ shout-outs, every occasion covered",
      distinct.length >= 30 && FAN_LINES.shout.length >= 12 && FAN_LINES.kill.length >= 5 && FAN_LINES.trophy.length >= 4 && FAN_LINES.checkpoint.length >= 4,
      distinct.length + " lines (" + ["shout", "kill", "trophy", "checkpoint"].map(function (k) { return k + " " + FAN_LINES[k].length; }).join(", ") + ")");
    const long = all.filter(function (l) { return l.length > 20; });
    check("fan lines: each at most 20 characters", long.length === 0, long.join(" | "));
    const bad = all.filter(function (l) { return l.split("").some(function (c) { return FONT_CHARS.indexOf(c) < 0; }); });
    check("fan lines: drawable with the game font", bad.length === 0, bad.join(" | "));
    // cheeky innuendo only: nothing explicit
    const BLOCK = ["SEX", "NUDE", "NAKED", "PORN", "FUCK", "BOOB", "TITS", "DICK", "COCK", "PUSSY", "ORGASM", "HORNY", "STRIP", "BED"];
    const explicit = all.filter(function (l) { return BLOCK.some(function (w) { return new RegExp("\\b" + w).test(l); }); });
    check("fan lines: flirty but not explicit (blocklist)", explicit.length === 0, explicit.join(" | "));
  });

  safe("fan shout-outs", function () {
    // two fans 2 tiles apart; Buck starts 10 tiles away and walks up to them
    sounds.length = 0;
    load(grid(60, 12, [[2, 9, "P"], [14, 9, "F"], [16, 9, "F"], [40, 9, "F"]]));
    Game.godMode = true;
    const a = Fans.list[0], b = Fans.list[1], far = Fans.list[2];
    steps(30);
    check("fans: no shout-out while Buck is far away", Fans.list.every(function (f) { return !f.bubble && f.shoutT <= 0; }));
    Fans.hearts.length = 0;
    Player.x = 13 * 16; steps(2);
    const shoutA = a.bubble && FAN_LINES.shout.indexOf(a.bubble.text) >= 0;
    check("fans: Buck within 4 tiles: she blows a kiss, a heart floats up and she calls out", shoutA && Fans.frame(a) === "kiss" && Fans.hearts.length >= 1 && a.shoutT > 7,
      (a.bubble ? a.bubble.text : "no bubble") + " frame " + Fans.frame(a) + " hearts " + Fans.hearts.length);
    check("fans: two fans shout out, the wolf whistle plays only once (4 s limit)", b.bubble && sounds.filter(function (n) { return n === "whistle"; }).length === 1,
      sounds.join(","));
    check("fans: a fan out of range stays quiet", !far.bubble);
    steps(120);                         // bubbles gone, still in range: cooldown (8 s) holds
    check("fans: no new shout-out from the same fan within 8 s", !a.bubble && a.shoutT > 0);
    Player.x = 30 * 16; steps(2); Player.x = 13 * 16;
    steps(6 * 60);
    check("fans: she calls out again after the 8 s cooldown", a.shoutT > 0 && (a.bubble !== null || a.shoutT > 7 - 6), "shoutT " + a.shoutT.toFixed(2));
    // nobody calls out to a dead hero
    load(grid(60, 12, [[2, 9, "P"], [14, 9, "F"]]));
    Player.dead = true; Player.deathT = 99; Player.x = 13 * 16; steps(5);
    check("fans: no shout-outs while Buck is dead", !Fans.list[0].bubble);
    Player.dead = false;
    Game.godMode = false;
    Input.reset();
  });

  safe("crates", function () {
    const FLOOR = 10 * 16;
    // fires one hero projectile at the crate at tile (tx, 9) and steps until it is gone
    function shoot(tx, dmg) {
      Game.shots.push({ x: (tx - 3) * 16, y: 9 * 16 + 6, w: 4, h: 4, vx: 320, dmg: dmg });
      steps(30);
    }
    load(grid(40, 12, [[2, 9, "P"], [10, 9, "d"], [14, 9, "D"]]));
    Game.enemies = [];
    const L = Game.level;
    check("crates: D and d are solid", L.isSolid(10, 9) && L.isSolid(14, 9) && L.isCrate(10, 9) && L.isCrate(14, 9));
    for (let i = 0; i < 5; i++) shoot(10, CONFIG.shotDmg);
    const after5 = L.at(10, 9), str5 = L.crateStrength(10, 9);
    check("crates: shots hitting a crate disappear", Game.shots.length === 0);
    sounds.length = 0;
    shoot(10, CONFIG.shotDmg);
    check("crates: a breakable crate breaks after exactly 6 blaster hits", after5 === "d" && str5 === 1 && L.at(10, 9) === ".", "after 5: " + after5 + " str " + str5 + ", after 6: " + L.at(10, 9));
    check("crates: breaking plays the crate sound and throws splinters", sounds.indexOf("crate") >= 0 && FX.parts.some(function (q) { return q.gib && GORE.wood.indexOf(q.color) >= 0; }), sounds.join(","));
    // the sturdy crate holds against 50 saw blades
    for (let i = 0; i < 50; i++) Game.shots.push({ x: 11 * 16, y: 9 * 16 + 4 - (i % 2), w: 8, h: 8, vx: 300, dmg: CONFIG.cutterDmg });
    steps(40);
    check("crates: a sturdy crate survives 50 saw blades", L.at(14, 9) === "D" && Game.shots.length === 0);
    // the hero walks through the spot of the broken crate (up to the sturdy one)
    press("right"); steps(200); release("right");
    check("crates: the hero walks through a broken crate's spot and is stopped by a sturdy one",
      Player.x > 11 * 16 && Player.x + Player.w <= 14 * 16 + 0.01, "x " + Player.x.toFixed(1));
    // blades: 2 break a crate; the cracked look from half strength on
    load(grid(40, 12, [[2, 9, "P"], [10, 9, "d"]]));
    Game.enemies = [];
    const L2 = Game.level;
    shoot(10, CONFIG.cutterDmg);
    check("crates: cracked from half strength on", L2.crateStrength(10, 9) === 3 && L2.crateStrength(10, 9) <= CRATE_HP / 2);
    shoot(10, CONFIG.cutterDmg);
    check("crates: two saw blades break a crate", L2.at(10, 9) === ".");
    // broken stays broken over a respawn; a fresh load restores it
    Game.onPlayerDeath();
    check("crates: a broken crate stays broken after a respawn", Game.level === L2 && L2.at(10, 9) === ".");
    load(grid(40, 12, [[2, 9, "P"], [10, 9, "d"]]));
    check("crates: loading the level again restores the crate", Game.level.at(10, 9) === "d" && Game.level.crateStrength(10, 9) === CRATE_HP);
    // looks: sturdy, intact and cracked differ; every edge pixel is the dark outline
    const ts = Game.level.tiles;
    function px(c) { return c.getContext("2d").getImageData(0, 0, 16, 16).data; }
    function same(a, b) { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; }
    const pS = px(ts.crateSturdy), pC = px(ts.crate), pK = px(ts.crateCracked);
    check("crates: sturdy, breakable and cracked tiles look different", !same(pS, pC) && !same(pC, pK) && !same(pS, pK));
    let edge = 0, outlined = 0;
    [pS, pC, pK].forEach(function (d) {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        if (x > 0 && x < 15 && y > 0 && y < 15) continue;
        const i = (y * 16 + x) * 4; edge++;
        if (d[i] === OUTLINE_COLOR[0] && d[i + 1] === OUTLINE_COLOR[1] && d[i + 2] === OUTLINE_COLOR[2] && d[i + 3] === 255) outlined++;
      }
    });
    check("crates: outlined like the other sprites", edge > 0 && outlined === edge, outlined + "/" + edge);
    let grey = 0;
    for (let i = 0; i < pS.length; i += 4) if (Math.abs(pS[i] - pS[i + 2]) <= 24 && pS[i + 1] > 120) grey++;
    check("crates: the sturdy crate shows metal bands", grey >= 30, grey + " grey px");
    Input.reset(); FX.clear();
  });

  safe("cover vs boss attacks", function () {
    const FLOOR = 10 * 16;
    function wave(x) { return { kind: "shockwave", x: x, y: FLOOR - 12, w: 12, h: 12, vx: -150, life: 3, dmg: 2 }; }
    // a sturdy crate stops the shockwave; the hero behind it is not hurt
    load(grid(40, 12, [[3, 9, "P"], [8, 9, "D"]]));
    Game.enemies = [];
    let hp = Player.hp;
    Game.enemyShots = [wave(20 * 16)];
    steps(150);
    check("cover: a shockwave stops at a sturdy crate and the hero behind it is not hurt",
      Game.enemyShots.length === 0 && Player.hp === hp && Game.level.at(8, 9) === "D", "hp " + hp + " -> " + Player.hp);
    // kneeling behind the crate: no taller than it, safe from the wave
    load(grid(40, 12, [[6, 9, "P"], [8, 9, "D"]]));
    Game.enemies = [];
    press("down"); steps(5);
    hp = Player.hp;
    check("cover: a kneeling hero is no taller than a crate", Player.h <= 16);
    Game.enemyShots = [wave(20 * 16)];
    steps(150);
    check("cover: kneeling behind a crate, the shockwave doesn't reach him", Player.hp === hp);
    release("down"); Input.reset();
    // a breakable crate loses 3 strength per shockwave and breaks after two
    load(grid(40, 12, [[3, 9, "P"], [8, 9, "d"]]));
    Game.enemies = []; Game.godMode = true;
    Game.enemyShots = [wave(20 * 16)];
    steps(150);
    const s1 = Game.level.crateStrength(8, 9);
    Game.enemyShots = [wave(20 * 16)];
    steps(150);
    check("cover: a shockwave takes 3 strength from a breakable crate (two break it)", s1 === CRATE_HP - 3 && Game.level.at(8, 9) === ".",
      "after one " + s1 + ", after two " + Game.level.at(8, 9));
    Game.godMode = false;
    // a hit on a ledge only staggers him: he stays on a 3-tile platform; on the floor the usual knockback
    function knock(onLedge) {
      load(onLedge ? grid(40, 12, [[5, 6, "P"], [4, 7, "="], [5, 7, "="], [6, 7, "="]]) : grid(40, 12, [[5, 9, "P"]]));
      Game.enemies = []; Player.face = 1;
      const x0 = Player.x, y0 = Player.y + Player.h;
      Player.hurt(1); steps(60);
      return { dx: x0 - Player.x, feet: Player.y + Player.h, y0: y0 };
    }
    const kl = knock(true), kf = knock(false);
    check("ledge: a hit on a platform only staggers the hero (stays on it, at most 1 tile back)",
      kl.feet === kl.y0 && kl.dx > 0 && kl.dx <= 16, "back " + kl.dx.toFixed(1) + " px, feet " + kl.feet + "/" + kl.y0);
    check("ledge: on the floor the usual knockback", kf.dx > kl.dx * 1.8, "floor " + kf.dx.toFixed(1) + " px vs ledge " + kl.dx.toFixed(1));
    // on a platform the shockwave passes below the hero
    load(grid(40, 12, [[3, 6, "P"], [2, 7, "="], [3, 7, "="], [4, 7, "="], [5, 7, "="]]));
    Game.enemies = [];
    hp = Player.hp;
    const onPlat = Player.onGround && Player.y + Player.h <= 7 * 16 + 0.5;
    Game.enemyShots = [wave(20 * 16)];
    steps(200);
    check("cover: a hero standing on a platform is not hit by the shockwave", onPlat && Player.hp === hp, "on platform " + onPlat + ", hp " + hp + " -> " + Player.hp);
    // summoned crayfish appear inside the camera view, left of the boss
    Player.resetForGame(); Game.loadLevel(4); Game.setState(STATE.BOSS); Game.godMode = true;
    Game.enemies = [];
    Camera.snap(Player, Game.level);
    let inView = true, n = 0;
    for (let k = 0; k < CONFIG.bossSummons; k++) {      // all of the fight's summons
      Game.enemies = [];
      Boss.startAttack("summon"); Boss.t = 0;
      steps(1);
      Game.enemies.forEach(function (e) {
        n++;
        if (!(e.x >= Camera.x && e.x + e.w <= Camera.x + W && e.x < Boss.ox)) inView = false;
      });
    }
    check("boss: summoned crayfish appear inside the camera view, left of the boss", n >= 4 && inView,
      n + " summoned, camera " + Math.round(Camera.x) + ", boss " + Math.round(Boss.ox));
    Game.godMode = false; Input.reset(); FX.clear();
  });

  safe("wide boss arena", function () {
    const d = LEVEL_DATA[4], m = d.map, Hh = m.length, Ww = m[0].length;
    const count = function (ch) { return m.join("").split(ch).length - 1; };
    const platRows = {};
    m.forEach(function (r, y) { if (y < Hh - 2 && r.indexOf("=") >= 0) platRows[y] = true; });
    check("arena: one-way platforms on at least 3 different rows above the floor", Object.keys(platRows).length >= 3, Object.keys(platRows).join(","));
    check("arena: at least 2 sturdy and 3 breakable crates", count("D") >= 2 && count("d") >= 3, "D " + count("D") + ", d " + count("d"));
    check("arena: 4-5 fans", count("F") >= 4 && count("F") <= 5, count("F"));
    const hRows = {}; m.forEach(function (r, y) { if (r.indexOf("h") >= 0) hRows[y] = true; });
    check("arena: health spots on more than one height", Object.keys(hRows).length >= 2, Object.keys(hRows).join(","));
    Player.resetForGame(); Game.loadLevel(4); Game.setState(STATE.BOSS); Game.godMode = true;
    Camera.snap(Player, Game.level);
    check("arena: hero starts in the left screen, boss in the right one", Player.x < W && Boss.ox >= W && Ww === 40,
      "hero " + Math.round(Player.x) + ", boss " + Math.round(Boss.ox));
    const cam0 = Camera.x;
    Player.x = 34 * TILE; Player.y = 13 * TILE - Player.h;     // jump the hero to the right end, then follow
    for (let i = 0; i < 30; i++) { Camera.follow(Player, Game.level); }
    check("arena: the camera scrolls across both screens", cam0 === 0 && Camera.x === Game.level.pxW - W, cam0 + " -> " + Camera.x);
    // a blade fired from the end of the row-11 platform hits the raised face
    Game.enemies = []; Game.enemyShots = []; Game.shots = [];
    const row = Object.keys(platRows).map(Number).sort(function (a, b) { return b - a; })[0];
    let endX = 0; for (let x = 0; x < 28; x++) if (m[row][x] === "=") endX = x;
    Player.x = endX * TILE + 2; Player.y = row * TILE - Player.h; Player.vy = 0; Player.face = 1;
    Camera.snap(Player, Game.level);
    Boss.state = "idle"; Boss.t = 99; Boss.raised = true; Boss.claw = 1; Boss.ox = Boss.homeX;
    const hp0 = Boss.hp;
    Player.fireCd = 0; Player.fire();
    for (let i = 0; i < 90 && Boss.hp === hp0; i++) { updateHeroShots(DT, Game.level); Boss.raised = true; Boss.claw = 1; }
    check("arena: a blade from the end of the lowest platform hits the raised face", Boss.hp === hp0 - CONFIG.cutterDmg,
      "platform row " + row + " end col " + endX + ", hp " + hp0 + " -> " + Boss.hp);
    Game.godMode = false; Input.reset(); FX.clear();
  });

  safe("level links", function () {
    // parser: "level=N" as its own fragment parameter, N = 1..5 (reel) -> 0-based index; anything else -> 0
    const cases = [["#level=1", 0], ["#level=5", 4], ["#level=4", 3], ["#debug&level=3", 2], ["#level=2&debug", 1], ["#level=0", 0], ["#level=6", 0],
      ["#level=x", 0], ["#xlevel=3", 0], ["#level=3x", 0], ["", 0], ["#test", 0], [null, 0]];
    const bad = cases.filter(function (c) { return startLevelFromHash(c[0]) !== c[1]; });
    check("level links: #level=N parsed (1..5), invalid values ignored", bad.length === 0,
      bad.map(function (c) { return c[0] + " -> " + startLevelFromHash(c[0]); }).join(", "));
    // starting a game from the title with a link
    function startFrom(hash) {
      Game.startHash = hash;
      Game.setState(STATE.TITLE); steps(2);
      Game.score = 999; Player.lives = 1;
      TEXT_LOG.items = []; TEXT_LOG.active = true;
      tap("enter");
      let guard = 0;
      while (Game.state === STATE.LEVEL_INTRO && guard++ < 600) { Game.render(); steps(1); }
      TEXT_LOG.active = false;
      const texts = TEXT_LOG.items.join("|"); TEXT_LOG.items = [];
      return { idx: Game.levelIndex, state: Game.state, texts: texts, score: Game.score, hp: Player.hp, lives: Player.lives, weapon: Player.weapon };
    }
    const boss = startFrom("#level=5");
    check("level links: #level=5 starts the boss arena (MISSING REEL, FINAL REEL) fresh, with the disc cutter",
      boss.idx === 4 && boss.state === STATE.BOSS && boss.texts.indexOf("MISSING REEL") >= 0 && boss.texts.indexOf("FINAL REEL") >= 0 &&
      boss.score === 0 && boss.hp === CONFIG.maxHp && boss.lives === 3 && boss.weapon === "cutter",
      JSON.stringify({ idx: boss.idx, state: boss.state, score: boss.score, hp: boss.hp, lives: boss.lives, weapon: boss.weapon }));
    const old4 = startFrom("#level=4");
    check("level links: old boss link #level=4 now starts the clubhouse (reel 4)", old4.idx === 3 && old4.state === STATE.PLAY && /CLUBHOUSE/.test(Game.level.name), old4.idx + " " + old4.state);
    const l2 = startFrom("#level=2");
    check("level links: #level=2 starts REEL 2 with the blaster", l2.idx === 1 && l2.state === STATE.PLAY && l2.texts.indexOf("REEL 2") >= 0 && l2.weapon === "blaster",
      l2.idx + " " + l2.state + " " + l2.weapon);
    // completing level 2 leads on to level 3
    Game.completeLevel(); Game.tally.done = true; Game.nextLevel();
    check("level links: completing the start level continues with the next one", Game.levelIndex === 2);
    // game over -> title -> Enter: the same level again
    startFrom("#level=3");
    Player.lives = 1; Game.onPlayerDeath();
    check("level links: game over after a linked start", Game.state === STATE.GAME_OVER, Game.state);
    steps(70); tap("enter");
    const again = startFrom("#level=3");
    check("level links: the next game starts at the linked level again", again.idx === 2 && again.state === STATE.PLAY, again.idx + " " + again.state);
    const plain = startFrom("");
    check("level links: without a link, reel 1 (the mofa ride) starts", plain.idx === 0 && plain.state === STATE.PLAY && Game.level.name === "THE ROAD TO WOLLERAU", plain.idx);
    Game.startHash = null; Input.reset(); FX.clear();
  });

  safe("boss summon limit", function () {
    Player.resetForGame(); Game.loadLevel(4); Game.setState(STATE.BOSS); Game.godMode = true;
    check("summons: a fresh boss fight starts with no summons used", Boss.summons === 0);
    Boss.log = []; Boss.state = "idle"; Boss.t = 0.01;
    // run at least 6 full attack cycles, health held up so the fight goes on
    let deathDone = false, summonsAtDeath = -1;
    for (let i = 0; i < 60 * 60 && Boss.log.length < 14; i++) {
      Boss.hp = Boss.maxHp; Game.enemies = [];          // minions cleared so each summon could spawn
      if (!deathDone && Boss.summons >= CONFIG.bossSummons) {
        // lose a life after the summons are used up: respawn must not reset the count
        deathDone = true; summonsAtDeath = Boss.summons;
        Game.godMode = false; Player.lives = 3; Game.onPlayerDeath(); Game.godMode = true;
      }
      steps(1);
    }
    const log = Boss.log.slice(), nSum = log.filter(function (a) { return a === "summon"; }).length;
    const third = log.reduce(function (acc, a, i) { return a === "summon" ? i : acc; }, -1);
    const after = log.slice(third + 1);
    check("summons: exactly 3 summons in 6+ attack cycles", nSum === CONFIG.bossSummons && log.length >= 14, log.join(","));
    check("summons: after the third, only claw slams and bubbles, alternating",
      after.length >= 4 && after.every(function (a, i) { return i === 0 || a !== after[i - 1]; }) && after.every(function (a) { return a === "slam" || a === "bubbles"; }), after.join(","));
    check("summons: a respawn in the arena does not reset the count", deathDone && Game.level.isBoss && Boss.summons === summonsAtDeath && nSum === CONFIG.bossSummons,
      "at death " + summonsAtDeath + ", now " + Boss.summons);
    Game.loadLevel(4); Game.setState(STATE.BOSS);
    check("summons: loading the arena again allows 3 summons again", Boss.summons === 0);
    Game.godMode = false; Input.reset(); FX.clear();
  });

  safe("mega cutter", function () {
    function arena() {
      Player.resetForGame(); Game.loadLevel(4); Game.setState(STATE.BOSS); Game.godMode = true;
      Game.enemies = []; Game.enemyShots = []; Boss.state = "idle"; Boss.t = 999;
    }
    function upgrade() { return Game.pickups.filter(function (q) { return q.type === "w"; })[0]; }
    function take() { const q = upgrade(); Game.collectPickup(q); Game.pickups.splice(Game.pickups.indexOf(q), 1); }
    arena();
    const up = upgrade();
    check("mega cutter: the upgrade sits on the arena's top platform", !!up && Math.floor((up.x + up.w / 2) / TILE) === 13 && up.y + up.h <= 5 * TILE + 0.5,
      up ? Math.floor((up.x + up.w / 2) / TILE) + "," + ((up.y + up.h) / TILE).toFixed(1) : "none");
    check("mega cutter: the arena pickup looks different from the Mega Blaster", PICKUP_INFO.w.img() === SPR.megaCutter && SPR.megaCutter !== SPR.megagun);
    take();
    TEXT_LOG.active = true; TEXT_LOG.items = []; drawHud(); TEXT_LOG.active = false;
    (function () {   // HUD label clear of the key-card slots
      const end = 171 + textWidth("MEGA CUTTER", 1);
      check("mega cutter: HUD label ends before the key-card slots", end < 240, "label ends at " + end);
    })();
    check("mega cutter: taking it gives the MEGA CUTTER (HUD)", Player.weapon === "megacutter" && TEXT_LOG.items.indexOf("MEGA CUTTER") >= 0, Player.weapon + " " + TEXT_LOG.items.join("|"));
    // one shot: two 16 px blades, 5 damage each, the second rising
    Game.shots.length = 0; Player.face = 1; Player.fireCd = 0; Player.fire();
    const b1 = Game.shots[0] || {}, b2 = Game.shots[1] || {};
    check("mega cutter: a shot fires two 16 px blades of 5 damage, the second angled upward",
      Game.shots.length === 2 && b1.w >= 16 && b2.w >= 16 && b1.dmg === 5 && b2.dmg === 5 && !b1.vy && b2.vy < 0 && b1.mega && b2.mega,
      Game.shots.length + " blades, dmg " + b1.dmg + "/" + b2.dmg + ", vy " + b1.vy + "/" + b2.vy);
    Game.shots.length = 0; Game.stats.shots = 0;
    press("fire"); steps(60); release("fire");
    check("mega cutter: normal fire rate (at most 3 shots per second)", Game.stats.shots >= 2 && Game.stats.shots <= 3, Game.stats.shots + " shots");
    // against the boss: 5 on the raised face, nothing on the shell
    Game.shots.length = 0; Camera.x = Game.level.pxW - W;
    Boss.raised = true; Boss.claw = 1;
    const hp0 = Boss.hp, fb = Boss.face();
    Game.shots.push({ x: fb.x + 2, y: fb.y + 20, w: 16, h: 16, vx: 190, dmg: CONFIG.megaCutterDmg, face: 1, spin: true, mega: true });
    updateHeroShots(DT, Game.level);
    check("mega cutter: a blade on the exposed face removes 5 boss health", Boss.hp === hp0 - 5, hp0 + " -> " + Boss.hp);
    Boss.raised = false; Boss.claw = 0;
    const sb = Boss.shell(), hp1 = Boss.hp;
    Game.shots.push({ x: sb.x + 30, y: sb.y + 10, w: 16, h: 16, vx: -190, dmg: CONFIG.megaCutterDmg, face: -1, spin: true, mega: true });
    updateHeroShots(DT, Game.level);
    check("mega cutter: shell hits are still deflected, no damage", Boss.hp === hp1 && Game.shots.some(function (q) { return q.deflected; }));
    // the pickup comes back after 20 s only while Buck lacks the upgrade
    Game.shots.length = 0; Boss.state = "idle"; Boss.t = 999;
    check("mega cutter: taken pickup is gone, its timer starts at 20 s", !upgrade() && Math.abs(Game.upgradeT - CONFIG.upgradeRespawn) < 0.5, Game.upgradeT);
    steps(25 * 60, function () { Boss.t = 999; Boss.hp = Boss.maxHp; });
    check("mega cutter: not back while Buck holds the Mega Cutter", !upgrade() && Player.weapon === "megacutter");
    // losing a life drops the upgrade; then it comes back 20 s after it was taken
    Game.godMode = false; Player.lives = 3; Game.onPlayerDeath(); Game.godMode = true;
    check("mega cutter: lost with a life (plain disc cutter after respawn)", Player.weapon === "cutter", Player.weapon);
    steps(19 * 60, function () { Boss.t = 999; Boss.hp = Boss.maxHp; });
    const early = !!upgrade();
    steps(2 * 60, function () { Boss.t = 999; Boss.hp = Boss.maxHp; });
    check("mega cutter: the pickup comes back 20 s after it was taken (counting while Buck lacks it)", !early && !!upgrade(), "early " + early + ", later " + !!upgrade());
    take();
    check("mega cutter: taking it again restarts the timer", Player.weapon === "megacutter" && Math.abs(Game.upgradeT - CONFIG.upgradeRespawn) < 0.01);
    // levels 1-3: the weapon pickup is still the Mega Blaster
    load(grid(40, 12, [[3, 9, "P"], [6, 9, "w"]]));
    Game.enemies = [];
    press("right"); steps(60); release("right");
    check("mega cutter: in levels 1-3 the weapon pickup stays the Mega Blaster", Player.weapon === "mega" && PICKUP_INFO.w.img() === SPR.megagun, Player.weapon);
    // looks: 16 px glowing blades, spinning, outlined
    function px(c) { return c.getContext("2d").getImageData(0, 0, c.width, c.height).data; }
    function differ(a, b2) { if (a.length !== b2.length) return true; for (let i = 0; i < a.length; i++) if (a[i] !== b2[i]) return true; return false; }
    const m0 = px(SPR.megaBlade[0]), m1 = px(SPR.megaBlade[1]);
    let orange = 0, edge = 0, outlined = 0;
    const w16 = SPR.megaBlade[0].width;
    for (let i = 0; i < m0.length; i += 4) if (m0[i + 3] && m0[i] > 220 && m0[i + 1] > 80 && m0[i + 1] < 200 && m0[i + 2] < 80) orange++;
    SPR.megaBlade.forEach(function (c) {
      const d = px(c), A = function (x, y) { return x >= 0 && y >= 0 && x < c.width && y < c.height && d[(y * c.width + x) * 4 + 3] > 0; };
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
        if (!A(x, y) || (A(x - 1, y) && A(x + 1, y) && A(x, y - 1) && A(x, y + 1))) continue;
        edge++; const i = (y * c.width + x) * 4;
        if (d[i] === OUTLINE_COLOR[0] && d[i + 1] === OUTLINE_COLOR[1] && d[i + 2] === OUTLINE_COLOR[2]) outlined++;
      }
    });
    check("mega cutter: blades are 16 px, glow orange, spin and differ from the plain blade",
      w16 >= 16 && orange >= 10 && differ(m0, m1) && differ(m0, px(SPR.sawBlade[0])), "w " + w16 + ", orange px " + orange);
    check("mega cutter: blades outlined like the sprites", edge > 0 && outlined === edge, outlined + "/" + edge);
    Game.godMode = false; Input.reset(); FX.clear();
  });

  safe("boss reveal", function () {
    // into the arena through its reel intro card, as in a real game
    function enterArena() {
      Player.resetForGame(); Game.loadLevel(4);
      let g = 0;
      while (Game.state === STATE.LEVEL_INTRO && g++ < 900) steps(1);
    }
    function bossInView() {
      const L = Boss.ox - 36, R = Boss.ox + 130;
      return L >= Camera.x - 0.5 && R <= Camera.x + W + 0.5;
    }
    enterArena();
    check("reveal: starts when the arena's intro card ends", Game.state === STATE.BOSS && !!Game.reveal, Game.state);
    const x0 = Player.x, hp0 = Boss.hp;
    Boss.log = []; Game.stats.shots = 0;
    press("right");                  // held movement must not move him (Fire would skip the reveal)
    let seen = -1, n = 0;
    while (Game.reveal && n < 6 * 60) { steps(1); n++; if (seen < 0 && bossInView()) seen = n; }
    release("right");
    check("reveal: the whole boss is in view within 1.5 s", seen >= 0 && seen <= 90, "after " + (seen / 60).toFixed(2) + " s");
    check("reveal: about 3 s in all, then the camera is back on Buck",
      n >= 2.6 * 60 && n <= 3.2 * 60 && Math.abs(Camera.x - clamp(Player.x + Player.w / 2 - Camera.anchorX, 0, Game.level.pxW - W)) < 2, (n / 60).toFixed(2) + " s, camera " + Math.round(Camera.x));
    check("reveal: no movement, no shots and no boss attacks during it", Player.x === x0 && Game.stats.shots === 0 && Boss.log.length === 0 && Boss.hp === hp0,
      "dx " + (Player.x - x0) + ", shots " + Game.stats.shots + ", attacks " + Boss.log.join(","));
    steps(3 * 60);
    check("reveal: normal play afterwards (the boss attacks)", !Game.reveal && Game.state === STATE.BOSS && Boss.log.length > 0, Boss.log.join(","));
    // skipping with Jump
    enterArena();
    steps(40);
    const tSkip = Game.reveal ? Game.reveal.t : -1;
    tap("jump");
    let m = 0;
    while (Game.reveal && m < 120) { steps(1); m++; }
    check("reveal: Jump skips it, play begins within 0.5 s", tSkip > 0 && !Game.reveal && m <= 30, "ended " + (m / 60).toFixed(2) + " s after the skip");
    // no reveal on respawn
    Game.godMode = false; Player.lives = 3; Game.onPlayerDeath();
    steps(2);
    check("reveal: not replayed when Buck respawns in the arena", !Game.reveal && Game.state === STATE.BOSS);
    Input.reset(); FX.clear();
  });

  safe("boss camera", function () {
    const sxOf = function () { return Player.x + Player.w / 2 - Camera.x; };
    Player.resetForGame(); Game.loadLevel(4); Game.setState(STATE.BOSS); Game.godMode = true;
    Game.enemies = []; Game.enemyShots = []; Boss.state = "idle"; Boss.t = 999;
    check("boss camera: the arena anchors Buck near the left edge", Camera.anchorX === CONFIG.bossCamX && CONFIG.bossCamX >= 60 && CONFIG.bossCamX <= 100);
    // walk right along the floor from column 8 to column 20 (crates are jumped over)
    Player.x = 8 * TILE; Player.y = 13 * TILE - Player.h; Player.vx = 0; Player.vy = 0;
    Camera.snap(Player, Game.level);
    let lo = 999, hi = -999, n = 0;
    press("right");
    while (Player.x < 20 * TILE && n++ < 8 * 60) {
      if (n % 20 === 0) press("jump"); else if (n % 20 === 6) release("jump");
      steps(1, function () { Boss.t = 999; });
      if (Camera.x > 0.5 && Camera.x < Game.level.pxW - W - 0.5) { lo = Math.min(lo, sxOf()); hi = Math.max(hi, sxOf()); }
    }
    release("right"); release("jump");
    check("boss camera: walking right, Buck stays 60-100 px from the left edge", Player.x >= 20 * TILE && lo >= 60 && hi <= 100,
      "screen x " + Math.round(lo) + ".." + Math.round(hi) + ", reached col " + Math.floor(Player.x / TILE));
    // turning to face left doesn't move the camera
    steps(30); const camA = Camera.x;
    tap("left"); steps(5);
    check("boss camera: turning around keeps the framing", Math.abs(Camera.x - camA) <= 1 && Player.face < 0, camA + " -> " + Camera.x);
    // respawn: same framing (or the camera at the map's left edge)
    Game.godMode = false; Player.lives = 3; Game.onPlayerDeath(); Game.godMode = true;
    check("boss camera: after a respawn Buck is framed on the left (or the camera is at 0)",
      Camera.x === 0 || (sxOf() >= 60 && sxOf() <= 100), "camera " + Camera.x + ", screen x " + Math.round(sxOf()));
    // right end: the camera stops at the map edge, Buck further right on the screen
    Player.x = 30 * TILE; Player.y = 13 * TILE - Player.h; Camera.snap(Player, Game.level);
    check("boss camera: at the right end the camera stops at the map edge", Camera.x === Game.level.pxW - W && sxOf() > 100, Camera.x + ", screen x " + Math.round(sxOf()));
    // level 1 keeps the centred camera
    Player.resetForGame(); Game.loadLevel(1); Game.setState(STATE.PLAY);
    Player.x = 40 * TILE; Camera.snap(Player, Game.level);
    let off = 0;
    press("right");
    for (let i = 0; i < 120; i++) { steps(1); if (Camera.x > 0.5) off = Math.max(off, Math.abs(sxOf() - W / 2)); }
    release("right");
    check("boss camera: level 1 keeps Buck near the middle of the screen", Camera.anchorX === W / 2 && off <= 24 + Player.w, "max offset " + Math.round(off));
    Game.godMode = false; Input.reset(); FX.clear();
  });

  safe("female lawyer", function () {
    check("lawyer look: new frames differ from the former male lawyer", LAWYER_TOP.join("") !== OLD_MALE_LAWYER_TOP.join(""));
    const chin = 6;
    const hairLow = LAWYER_TOP.slice(chin + 1).concat(LAWYER_THROW_TOP.slice(chin + 1)).some(function (r) { return r.indexOf("h") >= 0; });
    check("lawyer look: short hair (none below the chin row)", !hairLow && LAWYER_TOP.slice(0, chin + 1).some(function (r) { return r.indexOf("h") >= 0; }));
    const legRows = LAWYER_LEGS1.slice(4, 10).concat(LAWYER_LEGS2.slice(4, 10));
    check("lawyer look: skirt to the knee, then bare legs (skin, no suit) and heels",
      legRows.every(function (r) { return /[sS]/.test(r) && !/[nN]/.test(r); }) &&
      LAWYER_LEGS1.slice(0, 4).every(function (r) { return /n/.test(r); }) && /k/.test(LAWYER_LEGS1[10] + LAWYER_LEGS1[11]),
      legRows.join("|"));
    check("lawyer look: white blouse and lips", LAWYER_TOP.some(function (r) { return r.indexOf("w") >= 0; }) && LAWYER_TOP.some(function (r) { return r.indexOf("r") >= 0; }));
  });

  safe("law books", function () {
    function edgesOutlined(c) {      // every opaque pixel next to transparency is the outline colour
      const w = c.width, h = c.height, d = c.getContext("2d").getImageData(0, 0, w, h).data;
      const A = function (x, y) { return x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0; };
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (!A(x, y) || (A(x - 1, y) && A(x + 1, y) && A(x, y - 1) && A(x, y + 1))) continue;
        const i = (y * w + x) * 4;
        if (d[i] !== OUTLINE_COLOR[0] || d[i + 1] !== OUTLINE_COLOR[1] || d[i + 2] !== OUTLINE_COLOR[2]) return false;
      }
      return true;
    }
    // sprites: four cover colours, a white cross, outlined, tumbling frames
    const covers = {};
    let crossOk = true, outlinedOk = true, tumbleOk = true;
    SPR.lawbook.forEach(function (fr, i) {
      fr.forEach(function (set) {
        const c = set.r, d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
        let white = 0;
        for (let k = 0; k < d.length; k += 4) if (d[k + 3] && d[k] === 255 && d[k + 1] === 255 && d[k + 2] === 255) white++;
        if (white < 4) crossOk = false;
        if (!edgesOutlined(set.r) || !edgesOutlined(set.l)) outlinedOk = false;
      });
      covers[LAWBOOK_CODES[i].cover] = true;
      const a0 = fr[0].r.getContext("2d").getImageData(0, 0, fr[0].r.width, fr[0].r.height).data, a1 = fr[1].r.getContext("2d").getImageData(0, 0, fr[1].r.width, fr[1].r.height).data;
      let diff = 0; for (let k = 0; k < a0.length; k++) if (a0[k] !== a1[k]) diff++;
      if (!diff) tumbleOk = false;
    });
    check("law books: OR, ZGB, StGB and SchKG in four cover colours", SPR.lawbook.length === 4 && Object.keys(covers).length === 4 &&
      LAWBOOK_CODES.map(function (b) { return b.code; }).join(",") === "OR,ZGB,StGB,SchKG");
    check("law books: white Swiss cross on every cover, outlined, two tumbling frames", crossOk && outlinedOk && tumbleOk, [crossOk, outlinedOk, tumbleOk].join(","));
    // a book hitting a wall bursts into pages and names an article of its code
    load(grid(40, 12, [[2, 9, "P"], [14, 8, "B"], [14, 9, "B"]]));
    Game.enemies = []; FX.clear();
    Game.enemyShots = [{ kind: "lawbook", code: 1, x: 10 * 16, y: 8 * 16 + 4, w: 10, h: 8, vx: 125, vy: 0, grav: 0, dmg: 1, t: 0 }];
    // most pages in the air at once (they live a random ~1 s, so counting only at the end is flaky)
    let pages = 0;
    steps(60, function () { pages = Math.max(pages, FX.parts.filter(function (q) { return q.color === "#f4ecd0" || q.color === "#ffffff"; }).length); });
    const tWall = FX.texts.map(function (t) { return t.str; });
    check("law books: hitting a wall, a book bursts into pages with an article label", Game.enemyShots.length === 0 && pages >= 4 &&
      tWall.some(function (t) { return LAWBOOK_CODES[1].arts.indexOf(t) >= 0; }), tWall.join("|") + ", " + pages + " pages");
    // ... and when it hits Buck
    load(grid(40, 12, [[3, 9, "P"]]));
    Game.enemies = []; FX.clear();
    const hp = Player.hp;
    Game.enemyShots = [{ kind: "lawbook", code: 0, x: Player.x + 40, y: Player.y + 6, w: 10, h: 8, vx: -125, vy: 0, grav: 0, dmg: 1, t: 0 }];
    steps(40);
    const tHero = FX.texts.map(function (t) { return t.str; });
    check("law books: hitting Buck costs 1 health and names an OR article", Player.hp === hp - 1 && tHero.some(function (t) { return LAWBOOK_CODES[0].arts.indexOf(t) >= 0; }),
      "hp " + hp + " -> " + Player.hp + ", " + tHero.join("|"));
    Input.reset(); FX.clear();
  });

  safe("lawyer lines", function () {
    const swiss = LAWYER_LINES.filter(function (l) { return /(OR|ZGB|STGB|SCHKG|ART\.|BERN)/.test(l); });
    const long = LAWYER_LINES.filter(function (l) { return l.length > 20; });
    const glyph = LAWYER_LINES.filter(function (l) { return l.split("").some(function (c) { return FONT_CHARS.indexOf(c) < 0; }); });
    check("lawyer lines: 8+ lines, at most 20 chars, drawable, at least half Swiss-legal",
      LAWYER_LINES.length >= 8 && !long.length && !glyph.length && swiss.length * 2 >= LAWYER_LINES.length,
      LAWYER_LINES.length + " lines, swiss " + swiss.length + (long.length ? ", long: " + long.join("|") : "") + (glyph.length ? ", glyphs: " + glyph.join("|") : ""));
    const chance = CONFIG.lawyerTalkChance;
    CONFIG.lawyerTalkChance = 1;                       // always talk when allowed: tests the limits
    // one lawyer throwing for 30 s: bubbles at least 4 s apart, each about 1.5 s
    load(grid(60, 12, [[4, 9, "P"], [12, 9, "L"]]));
    Game.godMode = true;
    const e = Game.enemies[0];
    let starts = [], lens = [], cur = 0, prev = null;
    for (let i = 0; i < 30 * 60; i++) {
      Player.x = 4 * 16; e.x = Math.max(e.x, 10 * 16); e.hp = 99;
      steps(1);
      if (e.bubble && !prev) { starts.push(i); cur = 0; }
      if (e.bubble) cur++;
      if (!e.bubble && prev) lens.push(cur);
      prev = e.bubble;
    }
    const gaps = starts.slice(1).map(function (t, k) { return (t - starts[k]) / 60; });
    check("lawyer lines: a lawyer talks while throwing, at most once per 4 s", starts.length >= 3 && gaps.every(function (g) { return g >= 3.99; }),
      starts.length + " bubbles, gaps " + gaps.map(function (g) { return g.toFixed(1); }).join(","));
    check("lawyer lines: a bubble lasts about 1.5 s", lens.length >= 2 && lens.every(function (n) { return Math.abs(n / 60 - CONFIG.lawyerTalkT) < 0.1; }), lens.join(","));
    // two lawyers: never more than one lawyer bubble at a time
    load(grid(60, 12, [[4, 9, "P"], [11, 9, "L"], [16, 9, "L"]]));
    Game.godMode = true;
    let maxTalk = 0, anyTalk = 0;
    for (let i = 0; i < 20 * 60; i++) {
      Player.x = 4 * 16; Game.enemies.forEach(function (q) { q.hp = 99; q.x = Math.max(q.x, 9 * 16); });
      steps(1);
      const n = Game.enemies.filter(function (q) { return q.bubble; }).length;
      maxTalk = Math.max(maxTalk, n); if (n) anyTalk++;
    }
    check("lawyer lines: at most one lawyer bubble on screen at a time", maxTalk === 1 && anyTalk > 0, "max " + maxTalk);
    CONFIG.lawyerTalkChance = chance;
    Game.godMode = false; Input.reset(); FX.clear();
  });

  safe("einsiedler bar", function () {
    function px(c) { return c.getContext("2d").getImageData(0, 0, c.width, c.height).data; }
    function differ(a, b2) { if (a.length !== b2.length) return true; for (let i = 0; i < a.length; i++) if (a[i] !== b2[i]) return true; return false; }
    function edgesOutlined(c) {
      const w = c.width, h = c.height, d = px(c);
      const A = function (x, y) { return x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0; };
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (!A(x, y) || (A(x - 1, y) && A(x + 1, y) && A(x, y - 1) && A(x, y + 1))) continue;
        const i = (y * w + x) * 4;
        if (d[i] !== OUTLINE_COLOR[0] || d[i + 1] !== OUTLINE_COLOR[1] || d[i + 2] !== OUTLINE_COLOR[2]) return false;
      }
      return true;
    }
    // taps: a taller tower with red and white handle pixels above the counter top
    const ts = buildTileset("hall"), tap = ts.counterTaps, td = px(tap);
    let red = 0, white = 0;
    for (let y = 0; y < 12; y++) for (let x = 0; x < tap.width; x++) {
      const i = (y * tap.width + x) * 4;
      if (td[i] > 190 && td[i + 1] < 60 && td[i + 2] < 60) red++;
      if (td[i] > 230 && td[i + 1] > 225 && td[i + 2] > 210) white++;
    }
    check("bar: Einsiedler tap tower, 3 red/white handles above the counter", tap.height >= TILE + 12 && red >= 9 && white >= 6, "h " + tap.height + ", red " + red + ", white " + white);
    check("bar: counter variants with a beer and beer mats", differ(px(ts.counterGlass), px(ts.counter)) && differ(px(ts.counterMats), px(ts.counter)));
    // the sign
    TEXT_LOG.active = true; TEXT_LOG.items = []; const sign = buildProp("I", true); TEXT_LOG.active = false;
    check("bar: EINSIEDLER back-bar sign, 4 tiles wide, text fits", sign.width === 64 && TEXT_LOG.items.indexOf("EINSIEDLER") >= 0 && textWidth("EINSIEDLER", 1) <= 60, TEXT_LOG.items.join("|"));
    // sprites
    const guys = SPR.barGuys, all = [];
    guys.forEach(function (g) { all.push(g.idle, g.drink, g.clink); });
    all.push(SPR.waitress.walk[0], SPR.waitress.walk[1], SPR.waitress.pour);
    SPR.beerGlass.forEach(function (g) { all.push(g); });
    check("bar: regulars, waitress and glass outlined", all.every(function (set) { return edgesOutlined(set.r) && edgesOutlined(set.l); }));
    check("bar: three different regulars, drinking differs from idle",
      guys.length === 3 && differ(px(guys[0].idle.r), px(guys[1].idle.r)) && differ(px(guys[1].idle.r), px(guys[2].idle.r)) &&
      guys.every(function (g) { return differ(px(g.drink.r), px(g.idle.r)) && differ(px(g.clink.r), px(g.idle.r)); }));
    check("bar: the waitress is blonde", WAITRESS_TOP.slice(0, 7).join("").split("z").length > 20);
    // the scene: test map with a counter, 3 regulars, the waitress above the counter cell
    load(grid(40, 12, [[2, 9, "P"], [12, 9, "O"], [20, 9, "O"], [21, 9, "O"], [15, 8, "W"],
      [14, 9, "a"], [15, 9, "a"], [16, 9, "A"], [17, 9, "A"], [18, 9, "a"], [19, 9, "a"]]), { theme: "hall", bg: "bg_hall" });
    Game.enemies = []; Game.godMode = true;
    const L = Game.level;
    check("bar: 3 regulars and the waitress spawn, their cells cleared, the counter whole",
      Bar.guys.length === 3 && !!Bar.waitress && L.at(12, 9) === "." && L.at(15, 8) === "." && L.at(15, 9) === "a" &&
      Bar.waitress.minX === 14 * TILE && Bar.waitress.maxX === 19 * TILE, Bar.guys.length + " guys");
    check("bar: regulars face the counter", Bar.guys[0].face === 1 && Bar.guys[1].face === -1 && Bar.guys[2].face === -1);
    const frames = Bar.guys.map(function () { return {}; });
    let prostStarts = [], prev = null, wMin = 1e9, wMax = -1e9, pours = 0, wasPour = false;
    for (let i = 0; i < 40 * 60; i++) {
      steps(1);
      Bar.guys.forEach(function (g, k) { frames[k][Bar.frame(g)] = true; });
      if (Bar.bubble && !prev) prostStarts.push(i);
      prev = Bar.bubble;
      wMin = Math.min(wMin, Bar.waitress.x); wMax = Math.max(wMax, Bar.waitress.x);
      if (Bar.waitress.pourT > 0 && !wasPour) pours++;
      wasPour = Bar.waitress.pourT > 0;
    }
    check("bar: every regular lifts his glass (2+ frames)", frames.every(function (f) { return Object.keys(f).length >= 2; }), JSON.stringify(frames));
    const gaps = prostStarts.slice(1).map(function (t, k) { return (t - prostStarts[k]) / 60; });
    check("bar: PROST! now and then, at least 6 s apart", prostStarts.length >= 2 && gaps.every(function (g) { return g >= 5.99; }), prostStarts.length + " toasts, gaps " + gaps.map(function (g) { return g.toFixed(1); }).join(","));
    check("bar: the waitress stays behind the counter and walks along it", wMin >= 14 * TILE && wMax <= 19 * TILE && wMax - wMin >= 3 * TILE,
      (wMin / TILE).toFixed(1) + ".." + (wMax / TILE).toFixed(1));
    check("bar: she pulls beers", pours >= 2, pours + " pours");
    // decoration only: Buck and his shots pass the regulars
    Player.x = 11 * TILE; Player.y = 10 * TILE - Player.h; Player.face = 1; Player.vx = 0;
    Game.shots.length = 0; Player.fireCd = 0; Player.fire();
    const shot = Game.shots[0];
    press("right"); steps(40); release("right");
    check("bar: Buck walks through the regulars and his shots pass them", Player.x > 13 * TILE && (!Game.shots.length || Game.shots[0].x > 13 * TILE || !shot),
      "x " + Math.round(Player.x));
    Game.godMode = false; Input.reset(); FX.clear();
  });

  safe("hearts", function () {
    ctx.clearRect(0, 0, W, 8);
    drawText("♥", 0, 0, "#ff3070");
    const d = ctx.getImageData(0, 0, 6, 7).data;
    let lit = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) lit++;
    check("font: heart glyph in the font and drawn", FONT_CHARS.indexOf("♥") >= 0 && lit >= 12, lit + " px");
    load(grid(40, 12, [[3, 9, "P"], [10, 9, "F"]]));
    Fans.addHeart(Fans.list[0]);
    const made = Fans.hearts.length === 1, y0 = Fans.hearts[0].y;
    steps(20);
    const rose = Fans.hearts.length === 1 && Fans.hearts[0].y < y0 - 5;
    steps(45);
    check("fans: a floating heart rises and is gone after about 1 s", made && rose && Fans.hearts.length === 0);
  });

  safe("ride fan groups", function () {
    Player.resetForGame(); Game.loadLevel(0);
    const fs = Fans.list, by = { tennis: [], activist: [], rocker: [] };
    fs.forEach(function (f) { by[f.style].push(f); });
    const span = function (g) { const xs = g.map(function (f) { return f.tx; }); return Math.max.apply(null, xs) - Math.min.apply(null, xs); };
    check("ride fans: 4-5 environmental activists and 4-5 rocker chicks, each group together, no tennis players",
      by.tennis.length === 0 && by.activist.length >= 4 && by.activist.length <= 5 && by.rocker.length >= 4 && by.rocker.length <= 5 &&
      span(by.activist) <= 20 && span(by.rocker) <= 20, "activists " + by.activist.length + " (span " + span(by.activist) + "), rockers " + by.rocker.length + " (span " + span(by.rocker) + "), tennis " + by.tennis.length);
    const otherTennis = [1, 2, 3, 4].every(function (i) { Player.resetForGame(); Game.loadLevel(i); return Fans.list.every(function (f) { return f.style === "tennis"; }); });
    check("ride fans: the other levels keep their tennis fans", otherTennis);
    // distinct looks within a group, outlined frames (incl. the kiss)
    ["activist", "rocker"].forEach(function (st) {
      const vs = FAN_VARIANTS_BY_STYLE[st].map(function (v) { return JSON.stringify(v); });
      const distinct = vs.every(function (v, k) { return vs.indexOf(v) === k; }) && vs.length >= 6;
      let outlined = true;
      SPR.fansBy[st].forEach(function (set) {
        FAN_FRAMES.forEach(function (fr) {
          const c = set[fr].r, w = c.width, h = c.height, d = c.getContext("2d").getImageData(0, 0, w, h).data;
          const a = function (x, y) { return x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3]; };
          for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            if (!d[i + 3] || (d[i] === OUTLINE_COLOR[0] && d[i + 1] === OUTLINE_COLOR[1] && d[i + 2] === OUTLINE_COLOR[2])) continue;
            if (!a(x - 1, y) || !a(x + 1, y) || !a(x, y - 1) || !a(x, y + 1)) outlined = false;
          }
        });
      });
      check("ride fans: " + st + "s have 6 distinct looks and outlined frames (incl. the kiss)", distinct && outlined, vs.length + " looks");
    });
    // their own lines
    const bad = /\b(FUCK|SHIT|SEX|BITCH|DICK|PUSSY|ASS|DAMN)\b/;
    ["activist", "rocker"].forEach(function (st) {
      const L = FAN_LINES_BY_STYLE[st], all = [].concat(L.shout, L.kill, L.trophy, L.checkpoint);
      const sizes = L.shout.length >= 6 && L.kill.length >= 3 && L.trophy.length >= 3 && L.checkpoint.length >= 3;
      const okLines = all.every(function (l) { return l.length <= 20 && !bad.test(l) && l.split("").every(function (c) { return FONT_CHARS.indexOf(c) >= 0; }); });
      check("ride fans: " + st + " lines (>= 6 shout-outs, >= 3 per other occasion), <= 20 chars, drawable, not explicit", sizes && okLines,
        all.filter(function (l) { return l.length > 20; }).join("|"));
    });
    // a car destroyed near the activists: they cheer with an activist line
    Player.resetForGame(); Game.loadLevel(0); Game.setState(STATE.PLAY);
    const a0 = Fans.list.filter(function (f) { return f.style === "activist"; })[0];
    Fans.list.forEach(function (f) { f.bubble = null; });
    Fans.react(a0.x + FAN_W / 2 + 10, a0.y + 10, "kill");
    const said = Fans.list.filter(function (f) { return f.bubble && f.style === "activist"; }).map(function (f) { return f.bubble.text; });
    check("ride fans: a car destroyed near the activists gets an activist kill line",
      said.length > 0 && said.every(function (t) { return FAN_LINES_ACTIVIST.kill.indexOf(t) >= 0; }), said.join("|"));
    Game.setState(STATE.TITLE);
  });

  safe("fans in the levels", function () {
    let ok = true; const info = [];
    for (let i = 0; i < LEVEL_DATA.length; i++) {
      Player.resetForGame(); Game.loadLevel(i);
      const L = Game.level, fs = Fans.list, n = fs.length;
      const countOk = L.isBoss ? n >= 4 && n <= 5 : n >= 8 && n <= 10;
      const floorOk = fs.every(function (f) { return L.isSolid(f.tx, f.ty + 1) || L.isPlatform(f.tx, f.ty + 1); });
      const looks = fs.map(function (f) { return (f.style || "tennis") + ":" + f.variant; });   // a look = group + variant
      const distinct = looks.every(function (v, k) { return looks.indexOf(v) === k; });
      if (!(countOk && floorOk && distinct)) ok = false;
      info.push("L" + (i + 1) + ": " + n + (floorOk ? "" : " floor!") + (distinct ? "" : " same-look!"));
    }
    check("fans: 8-10 per level (4-5 in the boss arena), all on floor or platforms, all different", ok, info.join(", "));
  });

  safe("sound coverage", function () {
    const needed = ["shot", "shotUp", "jump", "hit", "explode", "pickup", "health", "hurt", "door", "locked", "slam", "bubble",
      "deflect", "bosshurt", "die", "key", "powerup", "oneup", "checkpoint", "throw", "rev", "mower", "leap", "bigexplode", "grinder", "pullstart", "choke", "cheer", "whistle", "crate", "horn", "mg", "pop"];
    const missing = needed.filter(function (n) { return !allSounds[n]; });
    check("sound: every effect was triggered by its game event", missing.length === 0, "missing: " + missing.join(","));
  });

  safe("flow", function () {
    // Title -> ride + 3 levels -> boss -> victory, using the real game flow (hero teleported to each exit).
    Game.setState(STATE.TITLE); Input.reset();
    tap("enter");
    let ok = true;
    for (let lv = 0; lv < 4; lv++) {
      steps(Math.round(introTotal(Game.level.isBoss) * 60) + 5);
      ok = ok && Game.state === STATE.PLAY && Game.levelIndex === lv;
      const ex = Game.exit;
      Game.enemies.slice().forEach(function (e) { if (e.type === "limo") damageEnemy(e, 999, 1); });   // the ride's gate opens
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
      nearBoss();
      press("fire"); steps(1);
    }
    release("fire"); Game.godMode = false;
    check("flow: title -> ride + 3 levels -> boss defeated by shooting -> victory", ok && Game.state === STATE.VICTORY,
      "state " + Game.state + " after " + (guard / 60).toFixed(0) + "s of boss fight");
    steps(150); tap("enter");
    check("flow: victory returns to title", Game.state === STATE.TITLE);
  });

  safe("music tracks", function () {
    // Track selection follows the game state: rock on the title, the biker song on the mofa ride,
    // Valkyries everywhere else.
    Input.reset(); FX.clear();
    Game.startHash = "";
    Game.setState(STATE.TITLE);
    check("tracks: title screen selects the rock title theme", Sound.track === "title" && Sound.tempo === 1, Sound.track);
    Sound.step = 37;
    tap("enter");
    check("tracks: Enter on the title starts the ride's biker rock song from its start on the REEL 1 card",
      Game.state === STATE.LEVEL_INTRO && Game.level.isRide && Sound.track === "biker" && Sound.step === 0, Sound.track + " step " + Sound.step);
    steps(Math.round(introTotal(Game.level.isBoss) * 60) + 5);
    Sound.step = 33; tap("pause"); tap("pause");
    check("tracks: pause and resume keep the biker song running", Game.state === STATE.PLAY && Sound.track === "biker" && Sound.step === 33, Sound.step);
    Player.lives = 3; Player.hp = 1; Player.invuln = 0; Player.hurt(2); steps(100);
    check("tracks: a lost life on the ride keeps the biker song running", !Player.dead && Sound.track === "biker" && Sound.step === 33, Sound.track + " step " + Sound.step);
    Game.completeLevel();
    check("tracks: the ride's tally keeps the biker song", Game.state === STATE.LEVEL_COMPLETE && Sound.track === "biker" && Sound.step === 33);
    Game.tally.done = true; Game.nextLevel();
    check("tracks: the REEL 2 card switches to the Valkyries from their start",
      Game.state === STATE.LEVEL_INTRO && Sound.track === "valkyries" && Sound.step === 0, Sound.track + " step " + Sound.step);
    steps(Math.round(introTotal(Game.level.isBoss) * 60) + 5);
    Sound.step = 41; tap("pause"); tap("pause");
    check("tracks: pause and resume keep the Valkyries running", Game.state === STATE.PLAY && Sound.track === "valkyries" && Sound.step === 41, Sound.step);
    Game.completeLevel(); Game.tally.done = true; Game.nextLevel();
    check("tracks: level complete -> next level keeps the Valkyries running",
      Game.state === STATE.LEVEL_INTRO && Sound.track === "valkyries" && Sound.step === 41, Sound.step);
    Game.loadLevel(4); Game.setState(STATE.BOSS);
    Game.setState(STATE.GAME_OVER); Game.stateT = 0; steps(70); tap("enter");
    check("tracks: game over -> title brings back the title theme at normal tempo",
      Game.state === STATE.TITLE && Sound.track === "title" && Sound.tempo === 1 && Sound.step === 0, Sound.track + " tempo " + Sound.tempo);
    tap("enter"); Game.loadLevel(4); Game.setState(STATE.VICTORY); FX.clear(); steps(150); tap("enter");
    check("tracks: victory -> title brings back the title theme at normal tempo",
      Game.state === STATE.TITLE && Sound.track === "title" && Sound.tempo === 1, Sound.track + " tempo " + Sound.tempo);
    Input.reset();
  });

  safe("biker song", function () {
    const song = SONGS.biker, kinds = {};
    song.events.forEach(function (ev) { ev.forEach(function (e) { kinds[e.v] = (kinds[e.v] || 0) + 1; }); });
    const bpm = 60 / (song.sixteenth * 4);
    check("biker song: one loop has shuffled guitar double stops, power chords, a slide, bass, kick and snare",
      kinds.dyad >= 32 && kinds.pow >= 8 && kinds.slide >= 2 && kinds.rbass >= 64 && kinds.kick >= 16 && kinds.snare >= 16, JSON.stringify(kinds));
    check("biker song: its own tempo (not the title's 132 bpm) and a 16-bar loop", Math.abs(bpm - 132) > 5 && song.steps === 16 * 16, bpm.toFixed(0) + " bpm");
    // swing: off-beat eighths play a third of a sixteenth late (fake clock, recorded event times)
    const realAc = Sound.ac, realPlay = Sound.playEvent, realTrack = Sound.track, realStep = Sound.step, realNext = Sound.nextTime, realPlaying = Sound.playing, realTempo = Sound.tempo;
    const clock = { currentTime: 0 }, times = {};
    try {
      Sound.ac = clock; Sound.playing = true; Sound.track = "biker"; Sound.step = 0; Sound.nextTime = 0; Sound.tempo = 1;
      let k = 0;
      Sound.playEvent = function (e, t) { const st = (Sound.step) % song.steps; if (!(st in times)) times[st] = t; };
      for (k = 0; k < 40; k++) { clock.currentTime = k * 0.1; Sound.schedule(); }
    } finally {
      Sound.ac = realAc; Sound.playEvent = realPlay; Sound.track = realTrack; Sound.step = realStep; Sound.nextTime = realNext; Sound.playing = realPlaying; Sound.tempo = realTempo;
    }
    const len = song.sixteenth, d2 = times[2] - 2 * len, d0 = times[0], d4 = times[4] - 4 * len;
    check("biker song: off-beat eighths are swung by a third of a sixteenth, on-beats stay on the grid",
      Math.abs(d2 - len / 3) < 1e-6 && Math.abs(d0) < 1e-6 && Math.abs(d4) < 1e-6, "offbeat +" + (d2 * 1000).toFixed(1) + " ms");
    // mute covers it
    Player.resetForGame(); Game.loadLevel(0); Game.setState(STATE.PLAY);
    const m0 = Sound.muted; tap("mute"); const muted = Sound.muted && (!Sound.master || Sound.master.gain.value === 0); tap("mute");
    check("biker song: M mutes the ride's music", Sound.track === "biker" && muted && Sound.muted === m0);
    // a game started with #level=2 never plays it
    Game.startHash = "#level=2"; Game.setState(STATE.TITLE); steps(2);
    let biker = false;
    tap("enter");
    for (let i = 0; i < 400; i++) { steps(1); if (Sound.track === "biker") biker = true; }
    Game.completeLevel(); Game.tally.done = true; Game.nextLevel(); steps(30); if (Sound.track === "biker") biker = true;
    check("biker song: a game started with #level=2 never plays the biker song", !biker && Sound.track === "valkyries", Sound.track);
    Game.startHash = null; Input.reset(); Game.setState(STATE.TITLE);
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

  bothFilmPaths("benchmark scenes", function () {
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
    Player.resetForGame(); Game.loadLevel(1); Game.setState(STATE.PLAY);
    check("cutter: levels 1-3 start with the blaster", Player.weapon === "blaster");
    // the boss arena switches to the disc cutter
    Player.resetForGame(); Game.loadLevel(3); Game.setState(STATE.PLAY); Player.weapon = "mega";
    Game.completeLevel(); Game.tally.done = true; Game.nextLevel();
    check("cutter: the boss arena switches to the disc cutter", Game.level.isBoss && Player.weapon === "cutter", Player.weapon);
    steps(Math.round(introTotal(true) * 60) + 5);
    check("cutter: still the disc cutter when play begins", Game.state === STATE.BOSS && Player.weapon === "cutter");
    nearBoss();
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
    Camera.x = Game.level.pxW - W;          // the whole boss in view (shots off screen are dropped)
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
    Player.resetForGame(); Game.loadLevel(4); Game.setState(STATE.BOSS); Player.respawn();
    const inArena = Player.weapon;
    Player.resetForGame(); Game.loadLevel(1); Game.setState(STATE.PLAY); Player.weapon = "mega"; Player.respawn();
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

  safe("film random order", function () {
    // seeded promo runs replay only if every film frame draws the same random numbers in the
    // same order on every grade path: 2 (flicker) + 1 (grain frame) + 1 (grain row) + 2 (jitter),
    // plus whatever the scratches and dust draw
    const realRandom = Math.random, realDamage = Film.drawDamage;
    const modeWas = Film.mode;
    const perMode = {};
    try {
      ["cpu", "gl"].forEach(function (m) {
        if (Film.setMode(m) !== m) return;
        let calls = 0, inDamage = 0, damaging = false;
        Math.random = function () { calls++; if (damaging) inDamage++; return realRandom(); };
        Film.drawDamage = function () { damaging = true; realDamage.call(Film); damaging = false; };
        const counts = [];
        for (let i = 0; i < 20; i++) { calls = 0; inDamage = 0; Film.apply(); counts.push(calls - inDamage); }
        perMode[m] = counts;
        Math.random = realRandom; Film.drawDamage = realDamage;
      });
    } finally { Math.random = realRandom; Film.drawDamage = realDamage; Film.setMode(modeWas); }
    const ok = Object.keys(perMode).length > 0 && Object.keys(perMode).every(function (m) { return perMode[m].every(function (c) { return c === 6; }); });
    check("film: 6 random draws per frame outside scratches and dust, on every grade path", ok, JSON.stringify(perMode));
  });

  safe("film gpu", function () {
    const modeWas = Film.setMode(Film.mode);
    check("film: GPU grade in use where WebGL works", Film.glReady && Film.setMode("gl") === "gl", filmGLRenderer());
    check("film: #film=cpu parsing", filmCpuForced("#film=cpu") && filmCpuForced("#level=2&film=cpu") && filmCpuForced("#film=cpu&touch") &&
      !filmCpuForced("#film=cpux") && !filmCpuForced("#film=gl") && !filmCpuForced(""));
    // same look: one frame, fixed inputs, both paths
    function graded(m, f, g, r) { Film.setMode(m); Film.grade(f, g, r); return filmCtx.getImageData(0, 0, W, H).data.slice(); }
    const scenes = [
      function () { Game.setState(STATE.TITLE); Game.stateT = 3; Game.render(); },
      function () { Player.resetForGame(); Game.loadLevel(2); Game.setState(STATE.PLAY); Game.godMode = true; Game.render(); },
      function () { fillRect(0, 0, W, H, "#808080"); },
      function () { for (let i = 0; i < 256; i++) fillRect(i % 32 * 10, Math.floor(i / 32) * 30, 10, 30, "rgb(" + i + "," + ((i * 7) & 255) + "," + (255 - i) + ")"); },
    ];
    let worst = 0, cases = 0;
    scenes.forEach(function (draw, si) {
      draw();
      [[0, 0, 0], [3, 1, 57], [7, 3, H - 1], [si % 8, 2, 120]].forEach(function (p) {
        const a = graded("cpu", p[0], p[1], p[2]), b = graded("gl", p[0], p[1], p[2]);
        for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - b[i]); if (d > worst) worst = d; }
        cases++;
      });
    });
    check("film: GPU and CPU grades match (every channel within 2 levels)", Film.glReady && worst <= 2, cases + " frames, max difference " + worst);
    // whole film frames (grade, scratches, dust, jitter) with the same seeded random numbers
    const realRandom = Math.random;
    function seededFrames(m) {
      Film.setMode(m);
      Math.random = makeRng(4242);
      Film.flick = 4; Film.scratches = [];
      Player.resetForGame(); Game.loadLevel(1); Game.setState(STATE.PLAY); Game.render();
      const out = [];
      for (let f = 0; f < 12; f++) { Film.apply(); out.push(filmCtx.getImageData(0, 0, W, H).data.slice(), [Film.jx, Film.jy, Film.flick]); }
      Math.random = realRandom;
      return out;
    }
    let fworst = 0, same = true;
    try {
      const a = seededFrames("cpu"), b = seededFrames("gl");
      for (let k = 0; k < a.length; k += 2) {
        for (let i = 0; i < a[k].length; i++) { const d = Math.abs(a[k][i] - b[k][i]); if (d > fworst) fworst = d; }
        if (a[k + 1].join() !== b[k + 1].join()) same = false;
      }
    } finally { Math.random = realRandom; }
    check("film: seeded film frames identical on both paths (grade, flicker, scratches, dust, jitter)", fworst <= 2 && same, "max difference " + fworst + ", jitter/flicker same " + same);
    // no readback of the scene during a GPU-path frame
    Film.setMode("gl");
    const realGet = ctx.getImageData;
    let reads = 0;
    ctx.getImageData = function () { reads++; return realGet.apply(ctx, arguments); };
    try { Game.render(); present(); } finally { ctx.getImageData = realGet; }
    check("film: no pixel readback of the scene during a GPU-path frame", reads === 0 && Film.mode === "gl", reads + " reads");
    Game.godMode = false; Film.setMode(modeWas); Game.setState(STATE.TITLE);
  });

  bothFilmPaths("film", function () {
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
    const raw = ctx.getImageData(sx, sy, 1, 1).data, shown = screenCtx.getImageData(Math.floor((sx + 0.5) * sc), Math.floor((sy + 0.5) * sc), 1, 1).data;
    check("film: G turns the filter off (screen shows the raw frame)", offAfterG && raw[0] === shown[0] && raw[1] === shown[1] && raw[2] === shown[2],
      Array.from(raw).join(",") + " vs " + Array.from(shown).join(","));
    tap("film");
    check("film: G again turns it back on", Film.enabled);
  });

  safe("performance", function () {
    // CPU timings mean nothing on software WebGL (headless SwiftShader): measure the CPU grade there
    const perfMode = Film.mode;
    if (/swiftshader/i.test(filmGLRenderer())) Film.setMode("cpu");
    Player.resetForGame(); Game.loadLevel(1); Game.setState(STATE.PLAY);
    const t0 = performance.now();
    for (let i = 0; i < 300; i++) { Game.update(DT); Game.render(); present(); }
    const ms = (performance.now() - t0) / 300;
    check("performance: update+render+film filter under 8 ms per frame", Film.enabled && ms < 8, ms.toFixed(2) + " ms/frame, film " + Film.enabled + " (" + Film.mode + ")");
    Player.resetForGame(); Game.loadLevel(4); Game.setState(STATE.BOSS); Game.godMode = true;
    const t1 = performance.now();
    for (let i = 0; i < 300; i++) { Game.update(DT); Game.render(); present(); }
    const ms2 = (performance.now() - t1) / 300; Game.godMode = false;
    check("performance: boss arena under 8 ms per frame", Film.enabled && ms2 < 8, ms2.toFixed(2) + " ms/frame, " + Film.mode + " film");
    Film.setMode(perfMode);
  });

  // last: it really loses the WebGL context, so no GPU test can follow
  safe("film context loss", function () {
    if (!Film.glReady) { check("film: context loss switches to the CPU grade", false, "no GPU grade to lose"); return; }
    Film.setMode("gl"); Film.enabled = true;
    const ext = filmGL.getExtension("WEBGL_lose_context");
    ext.loseContext();
    Player.resetForGame(); Game.loadLevel(1); Game.setState(STATE.PLAY);
    let frames = 0;
    for (let i = 0; i < 5; i++) { Game.update(DT); Input.endStep(); Game.render(); present(); frames++; }
    const d = filmCtx.getImageData(150, 110, 20, 20).data; let lit = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 0) lit++;
    check("film: context loss switches to the CPU grade and frames keep coming", Film.mode === "cpu" && !Film.glReady && frames === 5 && lit > 300, Film.mode + ", " + lit + " lit px");
    Game.setState(STATE.TITLE);
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
  { name: "ride lake", spec: "play,0,30,17,60" },          // one scene per ride stretch (src/levels/1_road.txt "stretches:")
  { name: "ride village", spec: "play,0,200,17,60" },
  { name: "ride climb", spec: "play,0,450,15,60" },
  { name: "ride club", spec: "play,0,600,10,60" },
  { name: "L1 courts", spec: "play,1,40,13,60" },
  { name: "L2 creek bank", spec: "play,2,12,26,60" },
  { name: "L3 clubhouse", spec: "play,3,30,12,60" },
  { name: "L3 hall", spec: "play,3,120,18,60" },
  { name: "boss arena", spec: "boss,4,3,12,200" },
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
    const frames = [H_.idle, H_.run[0], H_.run[1], H_.run[2], H_.jump, H_.shoot, H_.shootJump, H_.hurt, H_.climb[0], H_.climb[1], H_.kneel, H_.kneelShoot, SPR.heroCutter.kneel];
    frames.forEach(function (s, i) { ctx.drawImage(s.r, 4 + i * 24, 4); ctx.drawImage(s.l, 4 + i * 24, 40); });
    [SPR.lawyer[0], SPR.lawyer[1], SPR.lawyerThrow, SPR.cray[0], SPR.cray[1], SPR.punk.walk[0], SPR.punk.walk[1], SPR.punk.rev].forEach(function (s, i) {
      ctx.drawImage(s.r, 4 + i * 30, 80); ctx.drawImage(s.fl, 4 + i * 30, 116);
    });
    [SPR.ball, SPR.trophy, SPR.rivella, SPR.cervelat, SPR.life, SPR.megagun, SPR.keys.R, SPR.keys.U, SPR.keys.G, SPR.lawbook[0][0].r,
     SPR.bubble, SPR.shot, SPR.shotUp, SPR.blasterIcon, SPR.megaIcon, IMG.head, SPR.headBack].forEach(function (img, i) {
      ctx.drawImage(img, 4 + i * 18, 156);
    });
    // clubhouse props + furniture (right half of the sheet's lower area)
    let pxs = 4;
    ["c", "i", "q", "N", "$", "p", "x", "j"].forEach(function (ch) { const c = propCanvas(ch, 0); ctx.drawImage(c, 160 + (pxs - 4), 120); pxs += c.width + 2; });
    const tsI = buildTileset("hall");
    [tsI.wallpaper[0], tsI.wainscot, tsI.counter, tsI.table].forEach(function (img, i) { ctx.drawImage(img, 160 + i * 18, 138); });
    ctx.drawImage(tsI.counterTaps, 236, 130);
    [tsI.crateSturdy, tsI.crate, tsI.crateCracked].forEach(function (img, i) { ctx.drawImage(img, 262 + i * 18, 138); });   // cover crates
    SPR.barGuys.forEach(function (g, i) { ctx.drawImage(g.idle.r, 160 + i * 20, 92); ctx.drawImage(g.drink.r, 160 + i * 20, 60); });
    ctx.drawImage(SPR.waitress.walk[0].r, 222, 62); ctx.drawImage(SPR.waitress.pour.r, 240, 62);
    ctx.drawImage(SPR.megaCutter, 262, 100); ctx.drawImage(SPR.megaBlade[0], 284, 100); ctx.drawImage(SPR.megaBlade[2], 302, 100);   // Mega Cutter
    const ts = buildTileset("court"), ts2 = buildTileset("creek"), ts3 = buildTileset("hall");
    [ts, ts2, ts3].forEach(function (t, j) {
      [t.solidTop[0], t.solidTop[1], t.solidTop[2], t.solid[1], t.alt[2], t.plat[2], t.ladder, t.water[0], t.waterTop[0], t.door.R, t.door.U, t.door.G, t.deco.n, t.deco.f,
       t.deco.lTop, t.deco.b, t.deco.v].forEach(function (img, i) { ctx.drawImage(img, 4 + i * 20, 180 + j * 19); });
    });
    present();
    return;
  }
  if (what === "vehicles") {           // #shot=vehicles: the mofa (4 wheel frames, with Buck), the cars, wrecks, a runner
    fillRect(0, 0, W, H, "#7a8a96");
    fillRect(0, 200, W, 40, "#3a3a40");
    SPR.mofa.frames.forEach(function (S, i) {
      const x = 4 + i * 48, y = 4;
      ctx.drawImage(S.r, x - S.pad, y + 14 - S.pad);
      if (i === 0) { const R = SPR.mofa.rider; ctx.drawImage(R.r, x + MOFA_RIDER_X - R.pad, y + 14 + MOFA_SEAT_Y - MOFA_HIP_ROW - R.pad); }
    });
    ctx.drawImage(SPR.mofa.rider.r, 200, 4);
    ["suv", "tesla", "ferrari"].forEach(function (k, i) {
      const C = SPR.cars[k], base = 104 + i * 46;              // each row: car, Buck on the mofa (scale), wreck, mirrored
      ctx.drawImage(C.frames[0].r, 2 - C.frames[0].pad, base - C.frames[0].h - C.frames[0].pad);
      const M = SPR.mofa.frames[0], R = SPR.mofa.rider;
      ctx.drawImage(M.r, 94 - M.pad, base - MOFA_SPR_H - M.pad);
      ctx.drawImage(R.r, 94 + MOFA_RIDER_X - R.pad, base - MOFA_SPR_H + MOFA_SEAT_Y - MOFA_HIP_ROW - R.pad);
      ctx.drawImage(C.wreck.r, 140 - C.wreck.pad, base - C.wreck.h - C.wreck.pad);
      const L = C.frames[1].l;
      ctx.drawImage(L, 230 - C.frames[0].pad, base - C.frames[0].h - C.frames[0].pad);
    });
    SPR.driverRun.forEach(function (S, i) { ctx.drawImage(S.r, 300 + i * 9, 40); });
    Game.hazards = [Mofa.makeHazard("/", 7, 12)];
    Mofa.drawHazards(0, 0);
    present();
    return;
  }
  if (what === "climb") {              // #shot=climb,<column>: a test climb (rows 19 -> 11 over columns 40-99), Buck riding up, an X7 ahead
    const g = [];
    for (let y = 0; y < 22; y++) g.push(new Array(170).fill("."));
    for (let x = 0; x < 170; x++) {
      const t = Math.min(1, Math.max(0, (x + 0.5 - 40) / 60)), top = Math.ceil(19 - 8 * t * t * (3 - 2 * t));
      for (let y = top; y < 22; y++) g[y][x] = "#";
    }
    g[17][3] = "P";
    const data = Object.assign({}, LEVEL_DATA[0], { map: g.map(function (r) { return r.join(""); }), climb: "40-99 19-11" });
    Player.resetForGame(); Game.loadLevel(0, data); Game.setState(STATE.PLAY); Game.godMode = true;
    Player.x = (+p[1] || 62) * TILE; Player.y = Game.level.roadTop(Player.x + Player.w / 2) - Player.h; Player.vx = 60;
    const e = makeEnemy("suv", Player.x + 110, 0, Game.level, 1); e.y = Game.level.roadTop(e.x + e.w / 2) - e.h; Game.enemies.push(e);
    Camera.snap(Player, Game.level);
    for (let i = 0; i < 40; i++) { Input.simulate("right", true); Game.update(DT); Input.endStep(); }
    Game.render(); present();
    return;
  }
  if (what === "limo") {               // #shot=limo: the president's limo before the club gate, corks flying
    const g = [];
    for (let y = 0; y < 15; y++) g.push(new Array(90).fill("."));
    for (let x = 0; x < 90; x++) { g[13][x] = "#"; g[14][x] = "#"; }
    g[12][3] = "P"; g[12][30] = "9"; g[9][60] = "}"; g[12][62] = "E";
    const data = Object.assign({}, LEVEL_DATA[0], { map: g.map(function (r) { return r.join(""); }), climb: "", stretches: "0 bg_club" });
    Player.resetForGame(); Game.loadLevel(0, data); Game.setState(STATE.PLAY); Game.godMode = true;
    const L = Game.enemies.filter(function (e) { return e.type === "limo"; })[0];
    Player.x = L.x - 90; Camera.snap(Player, Game.level);
    L.corkT = 0.2;
    for (let i = 0; i < 50; i++) { Input.simulate("fire", true); Game.update(DT); Input.endStep(); }
    Game.render(); present();
    return;
  }
  if (what === "rearshot") {           // #shot=rearshot: the twin gun firing forward and backward, a Tesla behind
    Player.resetForGame(); Game.loadLevel(0); Game.setState(STATE.PLAY); Game.godMode = true;
    Player.x = 40 * TILE; Camera.snap(Player, Game.level);
    const e = makeEnemy("tesla", 0, Player.y + Player.h, Game.level, 1);
    e.awake = true; e.hp = 999; Game.enemies.push(e);
    const gap = +p[1] || 24;                                // #shot=rearshot,120: the car still off screen
    for (let i = 0; i < 14; i++) { e.x = Player.x - gap - e.w; e.state = "x"; Input.simulate("fire", true); Game.update(DT); Input.endStep(); }
    Game.render(); present();
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
  if (what === "fans") {               // all fan looks: idle, wave, jump, kiss (facing right), 4 looks per row
    fillRect(0, 0, W, H, "#5a8a40");
    (SPR.fansBy[p[1]] || SPR.fans).forEach(function (f, i) {            // #shot=fans[,activist|rocker]
      FAN_FRAMES.forEach(function (fr, j) {
        ctx.drawImage(f[fr].r, 2 + (i % 4) * 80 + j * 19, 2 + Math.floor(i / 4) * 36);
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
    if (what === "kneelfire") Input.simulate("down", true);
    for (let i = 0; i < n; i++) {
      if ((what === "fire" || what === "kneelfire") && i % 10 === 0) Player.fire();
      Game.update(DT); Input.endStep();
    }
    if (what === "complete") { Game.completeLevel(); for (let i = 0; i < 200; i++) Game.update(DT); }
    if (what === "pause") Game.setState(STATE.PAUSE);
  }
  Game.render();
  present();
}

boot();
