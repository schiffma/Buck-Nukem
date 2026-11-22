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

const Input = {
  held: {},
  edge: {},
  anyKeyListeners: [],
  down(a) { return !!this.held[a]; },
  pressed(a) { return !!this.edge[a]; },
  endStep() { this.edge = {}; },
  // used by the automated test harness
  simulate(action, isDown) {
    if (isDown && !this.held[action]) this.edge[action] = true;
    this.held[action] = isDown;
  },
  reset() { this.held = {}; this.edge = {}; },
};

window.addEventListener("keydown", function (e) {
  if (e.code === "MetaLeft" || e.code === "MetaRight") { e.preventDefault(); return; }   // ignored by the game
  Input.anyKeyListeners.forEach(function (f) { f(e); });
  const a = KEYMAP[e.code];
  if (!a) return;
  if (a === "fullscreen" && !e.repeat) Fullscreen.toggle();   // inside the key event: browsers require a user gesture
  e.preventDefault();              // no page scroll on Space/arrows, no browser menu on Alt
  if (!Input.held[a]) Input.edge[a] = true;
  Input.held[a] = true;
});
window.addEventListener("keyup", function (e) {
  if (e.code === "MetaLeft" || e.code === "MetaRight") { e.preventDefault(); return; }
  const a = KEYMAP[e.code];
  if (!a) return;
  e.preventDefault();              // Alt keyup would otherwise focus the browser menu
  Input.held[a] = false;
});
window.addEventListener("blur", function () { Input.held = {}; });
