// Keyboard state with pressed-edge detection. Actions map to several keys.
const KEYMAP = {
  ArrowLeft: "left", KeyA: "left",
  ArrowRight: "right", KeyD: "right",
  ArrowUp: "up", KeyW: "up",
  ArrowDown: "down", KeyS: "down",
  Space: "jump",
  KeyX: "fire", ControlLeft: "fire", ControlRight: "fire", AltLeft: "fire", AltRight: "fire",
  KeyP: "pause", Enter: "enter", NumpadEnter: "enter",
  KeyM: "mute", KeyG: "film", KeyF: "fullscreen",
};

// F toggles fullscreen. While fullscreen, Chrome/Edge let the page lock the Windows keys
// (Keyboard Lock API), so they no longer open the Start menu and steal focus (which drops
// held keys and stops firing). Esc is not locked: one press still leaves fullscreen.
const LOCK_KEYS = ["MetaLeft", "MetaRight"];
const Fullscreen = {
  note: "", noteT: 0,
  isFull() { return !!document.fullscreenElement; },
  show(text) { this.note = text; this.noteT = 2; },
  toggle() {
    const self = this;
    try {
      if (this.isFull()) {
        const p = document.exitFullscreen && document.exitFullscreen();
        if (p && p.catch) p.catch(function () {});
        return;
      }
      const el = document.documentElement;
      if (!el.requestFullscreen) { this.show("FULLSCREEN NOT AVAILABLE"); return; }
      const p = el.requestFullscreen({ navigationUI: "hide" });
      if (p && p.catch) p.catch(function () { self.show("FULLSCREEN NOT AVAILABLE"); });
    } catch (e) { this.show("FULLSCREEN NOT AVAILABLE"); }
  },
  onChange() {
    const self = this, kb = navigator.keyboard;
    if (Touch.on) {
      // phones: no Windows key to lock (and no note about it); keep the picture in landscape
      const o = screen.orientation;
      if (this.isFull() && o && o.lock) {
        try { const p = o.lock("landscape"); if (p && p.catch) p.catch(function () {}); } catch (e) { /* not allowed here */ }
      }
      return;
    }
    if (this.isFull()) {
      const notLockable = function () { self.show("FULLSCREEN (WINDOWS KEY NOT LOCKABLE HERE)"); };
      if (kb && kb.lock) {
        try { kb.lock(LOCK_KEYS).then(function () { self.locked = true; self.show("WINDOWS KEY LOCKED"); }, notLockable); }
        catch (e) { notLockable(); }
      } else notLockable();
    } else {
      if (kb && kb.unlock) kb.unlock();
      this.locked = false;
    }
  },
};
document.addEventListener("fullscreenchange", function () { Fullscreen.onChange(); });

// Every action can be held by several sources at once: "kb" (keyboard), "sim" (Input.simulate:
// test harness, promo bridge) and "t<pointerId>" (one per finger, src/touch.js). An action is
// held while any source holds it; its press edge fires when the first source takes it.
const Input = {
  held: {},
  edge: {},
  src: {},              // action -> { source: true }
  anyKeyListeners: [],
  down(a) { return !!this.held[a]; },
  pressed(a) { return !!this.edge[a]; },
  endStep() { this.edge = {}; },
  set(action, source, isDown) {
    const s = this.src[action] || (this.src[action] = {});
    if (isDown) {
      if (!this.held[action]) this.edge[action] = true;
      s[source] = true;
    } else delete s[source];
    this.held[action] = Object.keys(s).length > 0;
  },
  // releases every action the source holds (keyboard on blur, a lifted finger)
  releaseSource(source) {
    for (const a in this.src) if (this.src[a][source]) this.set(a, source, false);
  },
  // used by the automated test harness and the promo bridge
  simulate(action, isDown) { this.set(action, "sim", isDown); },
  reset() { this.held = {}; this.edge = {}; this.src = {}; },
};

window.addEventListener("keydown", function (e) {
  if (e.code === "MetaLeft" || e.code === "MetaRight") { e.preventDefault(); return; }   // ignored by the game
  Input.anyKeyListeners.forEach(function (f) { f(e); });
  const a = KEYMAP[e.code];
  if (!a) return;
  if (a === "fullscreen" && !e.repeat) Fullscreen.toggle();   // inside the key event: browsers require a user gesture
  e.preventDefault();              // no page scroll on Space/arrows, no browser menu on Alt
  Input.set(a, "kb", true);
});
window.addEventListener("keyup", function (e) {
  if (e.code === "MetaLeft" || e.code === "MetaRight") { e.preventDefault(); return; }
  const a = KEYMAP[e.code];
  if (!a) return;
  e.preventDefault();              // Alt keyup would otherwise focus the browser menu
  Input.set(a, "kb", false);
});
window.addEventListener("blur", function () { Input.releaseSource("kb"); });
