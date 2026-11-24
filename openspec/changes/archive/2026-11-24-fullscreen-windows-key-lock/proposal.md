# Proposal

## Why

The "firing is blocked" problem is caused by the Windows key. Left Ctrl and Left Alt, two of the fire keys, sit right next to it; hitting it opens the Start menu, the game window loses focus, the game drops all held keys (it clears its input on `blur`), and Buck stops shooting until the player clicks back into the game. A web page cannot block the Windows key in a normal browser window, because Windows handles it before the browser does. Chrome and Edge do offer the Keyboard Lock API, which lets a page capture the Windows key while it is fullscreen.

## What Changes

- Pressing **F** toggles fullscreen (the game scales up to the largest integer multiple that fits the screen, as it already does for window size).
- While fullscreen, the game locks the left and right Windows keys with the Keyboard Lock API where the browser supports it (Chrome, Edge), so they no longer open the Start menu or take focus away. Esc is not locked, so a single Esc still leaves fullscreen as usual; the lock ends with fullscreen.
- A short on-screen note confirms the state when fullscreen starts: "WINDOWS KEY LOCKED", or "FULLSCREEN (WINDOWS KEY NOT LOCKABLE HERE)" in browsers without Keyboard Lock (e.g. Firefox), where fullscreen still works.
- The title screen's controls list and the README controls table gain "F – FULLSCREEN".

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `game/gameplay`: new requirement "Fullscreen with Windows key lock" (F toggles fullscreen, Windows keys locked while fullscreen where supported, Esc leaves, note shown).

## Impact

- `src/input.js`: `KeyF` → `"fullscreen"` action; fullscreen toggle and Keyboard Lock calls; `fullscreenchange` handling (lock on enter, unlock on exit); Meta key events ignored by the game.
- `src/main.js`: handle the `fullscreen` action in every state; a short fullscreen status note (drawn like the HUD text).
- `src/screens.js`: an 8th line "F FULLSCREEN" in the title controls box (box grows by one line).
- `src/test.js`: tests with stubbed `requestFullscreen`/`exitFullscreen`/`navigator.keyboard`.
- `README.md`: controls table.
- No new dependencies; no change to gameplay or levels. In a normal (non-fullscreen) window the Windows key still behaves as Windows decides; that is a browser limit.
