// Touch mode for phones held in landscape. The 320x240 picture keeps its 4:3 frame between two
// side bars that hold on-screen controls (D-pad left; Jump and Fire right; Pause, Mute, Film and
// Fullscreen at the top). Every control drives the same Input actions as the keyboard, each
// finger as its own Input source ("t<pointerId>"), so the game never knows which input was used.
// The controls are drawn on a second full-window canvas (#pad) that also receives all pointer
// events, including taps on the picture (Enter on menus).

const TOUCH_BAR_MIN = 120;           // CSS px per side bar, inside the safe area
const PAD_SECTORS = [["right"], ["down", "right"], ["down"], ["down", "left"], ["left"], ["up", "left"], ["up"], ["up", "right"]];
const PAD_DIRS = ["left", "right", "up", "down"];

// "touch" as its own URL fragment parameter: #touch, #debug&touch, #level=3&touch
function touchHashFlag(hash) { return /(?:^#|[#&])touch(?:&|$)/.test(hash || ""); }

// Pure layout in CSS px for a viewport and its safe-area insets {l, r, t, b}.
function touchLayout(vw, vh, ins) {
  ins = ins || { l: 0, r: 0, t: 0, b: 0 };
  const sx = ins.l, sy = ins.t;
  const sw = Math.max(1, vw - ins.l - ins.r), sh = Math.max(1, vh - ins.t - ins.b);
  const s = Math.max(0.25, Math.min(sh / H, (sw - 2 * TOUCH_BAR_MIN) / W));
  const pw = W * s, ph = H * s;
  const pic = { x: sx + (sw - pw) / 2, y: sy + (sh - ph) / 2, w: pw, h: ph };
  const barW = (sw - pw) / 2;
  const left = { x: sx, y: sy, w: barW, h: sh }, right = { x: pic.x + pw, y: sy, w: barW, h: sh };
  const padR = Math.min(0.42 * barW, 0.24 * sh);
  const pad = { x: left.x + barW / 2, y: Math.min(sy + sh * 0.62, sy + sh - padR - 8), r: padR };
  const br = Math.max(28, Math.min(0.27 * barW, 0.13 * sh));
  const fire = { x: right.x + barW - br - 6, y: sy + sh - br - Math.max(8, 0.08 * sh), r: br };
  const jump = { x: fire.x - br * 1.1, y: fire.y - br * 2.3, r: br };
  const u = Math.round(Math.max(34, Math.min(44, barW * 0.32))), gap = 8;
  function ux(bar) { return bar.x + (bar.w - 2 * u - gap) / 2; }
  const uy = sy + 10;
  const util = {
    pause: { x: ux(left), y: uy, w: u, h: u }, mute: { x: ux(left) + u + gap, y: uy, w: u, h: u },
    film: { x: ux(right), y: uy, w: u, h: u }, fullscreen: { x: ux(right) + u + gap, y: uy, w: u, h: u },
  };
  return { vw: vw, vh: vh, s: s, pic: pic, left: left, right: right, pad: pad, fire: fire, jump: jump, util: util, portrait: vh > vw };
}

const Touch = {
  on: false,
  layout: null,
  fingers: {},             // pointerId -> { kind: "pad"|"act"|"util"|"pic", name, held: [actions] }
  canvas: null, g: null, probe: null,
  sig: "",                 // last drawn state; redraw only on change
  inited: false,

  init() {
    if (this.inited) return;
    this.inited = true;
    const self = this;
    this.canvas = document.getElementById("pad");
    this.g = this.canvas.getContext("2d");
    const p = document.createElement("div");
    p.style.cssText = "position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;" +
      "padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)";
    document.body.appendChild(p);
    this.probe = p;
    const c = this.canvas;
    c.addEventListener("pointerdown", function (e) { self.onDown(e); });
    c.addEventListener("pointermove", function (e) { self.onMove(e); });
    c.addEventListener("pointerup", function (e) { self.onUp(e, true); });
    c.addEventListener("pointercancel", function (e) { self.onUp(e, false); });
    c.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    // the first real touch turns touch mode on (touchscreen laptops); every touch-mode pointer
    // press and release also unlocks audio, as a key press does
    window.addEventListener("pointerdown", function (e) {
      if (!self.on && e.pointerType === "touch") self.enable();
      if (self.on) self.unlockAudio(e);
    }, true);
    window.addEventListener("pointerup", function (e) { if (self.on) self.unlockAudio(e); }, true);
    window.addEventListener("resize", function () { self.relayout(); });
    if (window.visualViewport) window.visualViewport.addEventListener("resize", function () { self.relayout(); });
    window.addEventListener("blur", function () { self.releaseAll(); });
    document.addEventListener("visibilitychange", function () { self.onVisibility(); });
    document.addEventListener("contextmenu", function (e) { if (self.on) e.preventDefault(); });
    const mq = window.matchMedia && window.matchMedia("(hover: none) and (pointer: coarse)");
    if ((mq && mq.matches) || touchHashFlag(location.hash)) this.enable();
  },

  enable() {
    if (this.on) return;
    this.on = true;
    document.documentElement.classList.add("touch");
    if (this.canvas) this.canvas.style.display = "block";
    displayLayout = function () { return Touch.computeLayout(); };
    this.relayout();
  },
  // tests only: back to desktop mode
  disable() {
    this.releaseAll();
    this.on = false;
    document.documentElement.classList.remove("touch");
    if (this.canvas) this.canvas.style.display = "none";
    displayLayout = null;
    this.layout = null;
    resizeScreen();
  },

  insets() {
    if (!this.probe) return { l: 0, r: 0, t: 0, b: 0 };
    const cs = getComputedStyle(this.probe);
    return { l: parseFloat(cs.paddingLeft) || 0, r: parseFloat(cs.paddingRight) || 0, t: parseFloat(cs.paddingTop) || 0, b: parseFloat(cs.paddingBottom) || 0 };
  },
  computeLayout() { return touchLayout(window.innerWidth, window.innerHeight, this.insets()); },

  relayout() {
    if (!this.on) return;
    const was = this.layout && this.layout.portrait;
    this.layout = this.computeLayout();
    resizeScreen();
    const dpr = window.devicePixelRatio || 1, c = this.canvas;
    if (c) {
      c.width = Math.round(this.layout.vw * dpr); c.height = Math.round(this.layout.vh * dpr);
      c.style.width = this.layout.vw + "px"; c.style.height = this.layout.vh + "px";
    }
    this.sig = "";
    if (this.layout.portrait && !was) this.releaseAll();
    this.checkPause();
    this.draw();
  },

  // ---------------- auto-pause ----------------
  playing() { return Game.state === STATE.PLAY || Game.state === STATE.BOSS; },
  checkPause() {
    if (this.on && this.layout && this.layout.portrait && this.playing()) Game.setState(STATE.PAUSE);
  },
  onVisibility() {
    if (!document.hidden) return;
    this.releaseAll();
    if (this.on && this.playing()) Game.setState(STATE.PAUSE);
  },

  // called once per displayed frame (main.js)
  tick() {
    this.checkPause();
    this.draw();
  },

  unlockAudio(e) { Input.anyKeyListeners.forEach(function (f) { f(e); }); },

  // ---------------- fingers ----------------
  canFullscreen() {
    const de = document.documentElement;
    return !!(document.fullscreenEnabled && de.requestFullscreen);
  },
  hit(x, y) {
    const L = this.layout;
    if (!L || L.portrait) return null;
    for (const k in L.util) {
      const r = L.util[k];
      if (k === "fullscreen" && !this.canFullscreen()) continue;
      if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return { kind: "util", name: k };
    }
    if (Math.hypot(x - L.pad.x, y - L.pad.y) <= L.pad.r * 1.3) return { kind: "pad" };
    if (Math.hypot(x - L.fire.x, y - L.fire.y) <= L.fire.r * 1.3 || Math.hypot(x - L.jump.x, y - L.jump.y) <= L.jump.r * 1.3) return { kind: "act" };
    const p = L.pic;
    if (x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h) return { kind: "pic" };
    return null;
  },
  padDirs(x, y, last) {
    const P = this.layout.pad, dx = x - P.x, dy = y - P.y, d = Math.hypot(dx, dy);
    if (d > P.r * 1.3) return last;                       // slid off the pad: keep the last direction
    if (d < P.r * 0.25) return [];                        // dead zone
    const k = ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8;
    return PAD_SECTORS[k];
  },
  actAt(x, y) {
    const L = this.layout;
    return Math.hypot(x - L.fire.x, y - L.fire.y) <= Math.hypot(x - L.jump.x, y - L.jump.y) ? "fire" : "jump";
  },
  setHeld(id, f, actions) {
    const src = "t" + id;
    f.held.forEach(function (a) { if (actions.indexOf(a) < 0) Input.set(a, src, false); });
    actions.forEach(function (a) { if (f.held.indexOf(a) < 0) Input.set(a, src, true); });
    f.held = actions.slice();
  },
  onDown(e) {
    e.preventDefault();
    if (!this.on) return;
    const h = this.hit(e.clientX, e.clientY);
    if (!h) return;
    try { this.canvas.setPointerCapture(e.pointerId); } catch (ex) { /* synthetic events */ }
    const f = { kind: h.kind, name: h.name, held: [] };
    this.fingers[e.pointerId] = f;
    if (f.kind === "pad") this.setHeld(e.pointerId, f, this.padDirs(e.clientX, e.clientY, []));
    else if (f.kind === "act") this.setHeld(e.pointerId, f, [this.actAt(e.clientX, e.clientY)]);
    else if (f.kind === "pic" && !this.playing()) this.setHeld(e.pointerId, f, ["enter"]);   // during play a tap does nothing
    this.draw();
  },
  onMove(e) {
    const f = this.fingers[e.pointerId];
    if (!f) return;
    e.preventDefault();
    if (f.kind === "pad") this.setHeld(e.pointerId, f, this.padDirs(e.clientX, e.clientY, f.held));
    else if (f.kind === "act") this.setHeld(e.pointerId, f, [this.actAt(e.clientX, e.clientY)]);
    this.draw();
  },
  onUp(e, normal) {
    const f = this.fingers[e.pointerId];
    if (!f) return;
    e.preventDefault();
    this.setHeld(e.pointerId, f, []);
    delete this.fingers[e.pointerId];
    if (normal && f.kind === "util") {
      const h = this.hit(e.clientX, e.clientY);
      if (h && h.kind === "util" && h.name === f.name) this.trigger(f.name);
    }
    this.draw();
  },
  trigger(name) {
    if (name === "fullscreen") { Fullscreen.toggle(); return; }    // inside the gesture, as the F key
    Input.set(name, "tu", true);                                    // one press edge, like a key tap
    Input.set(name, "tu", false);
  },
  releaseAll() {
    for (const id in this.fingers) this.setHeld(id, this.fingers[id], []);
    this.fingers = {};
    this.sig = "";
  },
  // what the fingers hold right now (for the pressed looks)
  heldSet() {
    const s = {};
    for (const id in this.fingers) {
      const f = this.fingers[id];
      f.held.forEach(function (a) { s[a] = true; });
      if (f.kind === "util") s["u:" + f.name] = true;
    }
    return s;
  },

  // ---------------- drawing ----------------
  draw() {
    if (!this.on || !this.layout || !this.g) return;
    const L = this.layout, held = this.heldSet();
    const anim = L.portrait ? Math.floor(performance.now() / 700) % 2 : 0;
    const sig = [L.vw, L.vh, window.devicePixelRatio, L.portrait, anim, Sound.muted, Film.enabled, this.canFullscreen(),
      Fullscreen.isFull(), Object.keys(held).sort().join("+")].join("|");
    if (sig === this.sig) return;
    this.sig = sig;
    const g = this.g, dpr = window.devicePixelRatio || 1;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const u = Math.max(2, Math.round(L.s * dpr));               // device px per control pixel (about one game pixel)
    if (L.portrait) { this.drawPortrait(g, L, dpr, u, anim); return; }
    const self = this;
    function put(c, cx, cy) {                                     // low-res canvas centred at CSS (cx, cy)
      g.drawImage(c, Math.round(cx * dpr - c.width * u / 2), Math.round(cy * dpr - c.height * u / 2), c.width * u, c.height * u);
    }
    put(this.padSprite(Math.round(L.pad.r * dpr / u), held), L.pad.x, L.pad.y);
    put(this.buttonSprite(Math.round(L.jump.r * dpr / u), "JUMP", held.jump), L.jump.x, L.jump.y);
    put(this.buttonSprite(Math.round(L.fire.r * dpr / u), "FIRE", held.fire), L.fire.x, L.fire.y);
    Object.keys(L.util).forEach(function (k) {
      if (k === "fullscreen" && !self.canFullscreen()) return;
      const r = L.util[k];
      put(self.utilSprite(Math.round(r.w * dpr / u), k, held["u:" + k]), r.x + r.w / 2, r.y + r.h / 2);
    });
  },

  colors(pressed) {
    return pressed ? { ring: "#ffd840", fill: "#7a2a18", ink: "#ffffff", alpha: 1 }
                   : { ring: "#8a7a68", fill: "#2a2228", ink: "#c8b890", alpha: 0.6 };
  },
  padSprite(R, held) {
    const n = 2 * R + 3, c = makeCanvas(n, n), g = c.getContext("2d"), m = R + 1;
    const any = PAD_DIRS.some(function (a) { return held[a]; });
    const col = this.colors(false);
    g.globalAlpha = any ? 0.85 : col.alpha;
    pxEllipse(g, m, m, R + 1, R + 1, "#0a0608");
    pxEllipse(g, m, m, R, R, col.ring);
    pxEllipse(g, m, m, R - 1, R - 1, col.fill);
    g.globalAlpha = 1;
    const k = Math.max(3, Math.round(R * 0.28)), off = Math.round(R * 0.58);
    const dirs = { right: [1, 0], left: [-1, 0], down: [0, 1], up: [0, -1] };
    for (const a in dirs) {
      const on = !!held[a], d = dirs[a];
      g.globalAlpha = on ? 1 : 0.7;
      pxArrow(g, m + d[0] * off, m + d[1] * off, d[0], d[1], k, on ? "#ffd840" : "#c8b890");
    }
    g.globalAlpha = 1;
    g.fillStyle = "#0a0608"; g.fillRect(m - 1, m - 1, 3, 3);
    return c;
  },
  buttonSprite(R, label, pressed) {
    const n = 2 * R + 3, c = makeCanvas(n, n), g = c.getContext("2d"), m = R + 1, col = this.colors(pressed);
    g.globalAlpha = col.alpha;
    pxEllipse(g, m, m, R + 1, R + 1, "#0a0608");
    pxEllipse(g, m, m, R, R, col.ring);
    pxEllipse(g, m, m, R - 1, R - 1, col.fill);
    g.globalAlpha = 1;
    padText(g, label, m - Math.floor(textWidth(label, 1) / 2), m - 3, col.ink);
    return c;
  },
  utilSprite(n, name, pressed) {
    n = Math.max(12, n);
    const c = makeCanvas(n, n), g = c.getContext("2d"), col = this.colors(pressed);
    g.globalAlpha = col.alpha;
    g.fillStyle = "#0a0608"; g.fillRect(0, 0, n, n);
    g.fillStyle = col.ring; g.fillRect(1, 1, n - 2, n - 2);
    g.fillStyle = col.fill; g.fillRect(2, 2, n - 4, n - 4);
    g.globalAlpha = 1;
    const m = Math.floor(n / 2), ink = col.ink, off = "#ff3a2a";
    g.fillStyle = ink;
    if (name === "pause") {
      g.fillRect(m - 4, m - 4, 3, 9); g.fillRect(m + 2, m - 4, 3, 9);
    } else if (name === "mute") {                                   // speaker; waves when on, red X when muted
      g.fillRect(m - 6, m - 2, 3, 5);
      for (let i = 0; i < 4; i++) g.fillRect(m - 3 + i, m - 2 - i, 1, 5 + 2 * i);
      if (Sound.muted) {
        g.fillStyle = off;
        for (let i = 0; i < 5; i++) { g.fillRect(m + 2 + i, m - 2 + i, 1, 1); g.fillRect(m + 6 - i, m - 2 + i, 1, 1); }
      } else { g.fillRect(m + 3, m - 1, 1, 3); g.fillRect(m + 5, m - 3, 1, 7); }
    } else if (name === "film") {                                   // film frame with sprocket holes; red slash when off
      g.fillRect(m - 6, m - 5, 13, 11);
      g.fillStyle = col.fill; g.fillRect(m - 3, m - 3, 7, 7);
      for (let i = 0; i < 3; i++) { g.fillRect(m - 5, m - 4 + i * 4, 1, 1); g.fillRect(m + 5, m - 4 + i * 4, 1, 1); }
      if (!Film.enabled) { g.fillStyle = off; for (let i = 0; i < 13; i++) g.fillRect(m - 6 + i, m + 5 - Math.round(i * 10 / 12), 1, 1); }
    } else if (name === "fullscreen") {                             // four corners (inward while fullscreen)
      const full = Fullscreen.isFull(), a = 5, e = 6;
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (s) {
        const cx = m + s[0] * e, cy = m + s[1] * e, dx = full ? s[0] : -s[0], dy = full ? s[1] : -s[1];
        for (let i = 0; i < a; i++) { g.fillRect(cx + dx * i, cy, 1, 1); g.fillRect(cx, cy + dy * i, 1, 1); }
      });
    }
    return c;
  },
  drawPortrait(g, L, dpr, u, anim) {
    g.fillStyle = "#0c0806"; g.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const scale = Math.max(2, Math.floor(Math.min(L.vw * dpr / 120, L.vh * dpr / 160)));
    const n = 110, c = makeCanvas(n, 80), cg = c.getContext("2d");
    // phone outline: upright, then turned on its side
    const pw = anim ? 26 : 14, ph = anim ? 14 : 26, px = Math.floor((n - pw) / 2), py = 4 + Math.floor((26 - ph) / 2);
    cg.fillStyle = "#c8b890"; cg.fillRect(px, py, pw, ph);
    cg.fillStyle = "#2a2228"; cg.fillRect(px + 2, py + 2, pw - 4, ph - 4);
    cg.fillStyle = "#ff3a2a"; cg.fillRect(px + 4, py + 4, Math.max(2, pw - 8), Math.max(2, ph - 8));
    padText(cg, "TURN YOUR PHONE", Math.floor((n - textWidth("TURN YOUR PHONE", 1)) / 2), 40, "#ffd840");
    padText(cg, "SIDEWAYS TO PLAY", Math.floor((n - textWidth("SIDEWAYS TO PLAY", 1)) / 2), 52, "#f0e8d0");
    g.drawImage(c, Math.round((this.canvas.width - n * scale) / 2), Math.round((this.canvas.height - 80 * scale) / 2), n * scale, 80 * scale);
  },
};

// Text into any 2D context with the game font (drawText only targets the game buffer).
function padText(g, str, x, y, color) {
  const atlas = fontAtlas(color);
  str = String(str).toUpperCase();
  for (let i = 0; i < str.length; i++) {
    const idx = FONT_CHARS.indexOf(str[i]);
    if (idx >= 0) g.drawImage(atlas, idx * 6, 0, 5, 7, x + i * 6, y, 5, 7);
  }
}

// Pixel arrow head pointing (dx, dy) with its tip k pixels from (cx, cy) along that direction.
function pxArrow(g, cx, cy, dx, dy, k, color) {
  g.fillStyle = color;
  for (let i = 0; i < k; i++) {
    const w = 2 * (k - 1 - i) + 1, along = i - Math.floor(k / 2);
    if (dx) g.fillRect(cx + dx * along, cy - (w - 1) / 2, 1, w);
    else g.fillRect(cx - (w - 1) / 2, cy + dy * along, w, 1);
  }
}
