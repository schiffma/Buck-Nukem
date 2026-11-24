# Design

## Context

- `src/input.js` maps `e.code` to actions in `KEYMAP` (fire: `KeyX`, `ControlLeft/Right`, `AltLeft/Right`), calls `preventDefault()` for mapped keys and clears all held keys on `window` `blur`. The Windows key (`MetaLeft`/`MetaRight`) is not mapped; in a normal window Windows opens the Start menu on its key-up and the page loses focus, which clears `Input.held` and stops firing.
- `src/render.js` scales the 320×240 canvas to the largest integer multiple of the window on every `resize`, so fullscreen is picked up automatically.
- Browser APIs: `element.requestFullscreen()` / `document.exitFullscreen()` (need a user gesture: a key press counts); `fullscreenchange` event; `navigator.keyboard.lock(codes)` / `unlock()` (Chrome, Edge; only effective while fullscreen; `file://` pages count as secure contexts in Chromium). If `Escape` is not in the locked list, a single Esc exits fullscreen as usual.
- Title controls: `TITLE_CONTROLS` (7 lines, `src/screens.js`) in a 96 px box; lines are 11 px apart, so one more line needs about 8 px more box height (still above "PRESS ENTER").

## Goals / Non-Goals

**Goals:**
- One key (F) to play fullscreen with the Windows key captured where the browser allows it.
- Clear feedback whether the lock is active.
- Fully testable without a real fullscreen (stubbed APIs).

**Non-Goals:**
- Blocking the Windows key in a normal window (impossible for a web page).
- Locking Esc, Alt+Tab, Ctrl+Alt+Del or other system shortcuts.
- Auto-pause on focus loss or changing fire keys (not chosen).

## Decisions

### 1. F toggles fullscreen
`KEYMAP.KeyF = "fullscreen"`; `Game.update` (all states) calls `Screen.toggleFullscreen()` on `Input.pressed("fullscreen")`: `document.documentElement.requestFullscreen({ navigationUI: "hide" })` when not fullscreen, otherwise `document.exitFullscreen()`. Errors (denied, unsupported) are caught and shown as a short note.
*Alternative:* fullscreen automatically on Enter. Not chosen by the user.

### 2. Lock only the Windows keys
On `fullscreenchange` → fullscreen: `navigator.keyboard.lock(["MetaLeft", "MetaRight"])`; on success show "WINDOWS KEY LOCKED", if the API is missing or the promise rejects show "FULLSCREEN (WINDOWS KEY NOT LOCKABLE HERE)". On leaving fullscreen: `navigator.keyboard.unlock()` (if present). Meta key events that reach the page are ignored by the game (no action, held keys untouched).
*Alternative:* `keyboard.lock()` with no argument (all keys). Rejected: it also captures Esc, which then needs a long-press to leave fullscreen; players expect a single Esc.

### 3. Status note
`Game.noteT`/`Game.noteText`: drawn centred under the HUD in the pixel font with a shadow for about 2 s, in any state (title included).

### 4. Tests
Stub `document.documentElement.requestFullscreen`, `document.exitFullscreen`, `document.fullscreenElement` and `navigator.keyboard` (`Object.defineProperty`, restored afterwards); dispatch `fullscreenchange` manually. Check: F requests fullscreen; on change the lock is called with exactly `["MetaLeft", "MetaRight"]` and the locked note appears; F again exits; leaving fullscreen unlocks; without `navigator.keyboard` the "not lockable" note appears; a Meta keydown/keyup does not clear held fire; the title controls list contains "F" / "FULLSCREEN".

## Risks / Trade-offs

- [Keyboard Lock unsupported (Firefox, Safari)] → fullscreen still works and the note says the key can't be locked; README states it.
- [Browser shows its own "press Esc to exit" banner] → expected browser behaviour; not suppressible.
- [Fullscreen request denied without a user gesture] → only called from a key handler path (the F press); a denied request shows the note and leaves the game windowed.
- [Headless tests can't enter real fullscreen] → the API is stubbed; a manual check in Chrome/Edge is part of the final task.
