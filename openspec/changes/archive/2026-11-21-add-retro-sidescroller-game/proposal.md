# Proposal

## Why

The project has the raw material for a game (a hero photo, `assets/img/buck_nukem.jpg`, and photos of the TC Wollerau tennis club and the Krebsbach sports grounds) but no game yet. The goal is "Buck Nukem": an original, retro 1990s-style run-and-gun side-scroller set around TC Wollerau that can be shared and played as one HTML file with no install and no server.

## What Changes

- New browser game rendered at a native **320×240** resolution, scaled up with crisp, nearest-neighbour pixels.
- Original gameplay in the genre of early-90s DOS action platformers: run, jump, shoot, health pickups, score, keys/exits, levels that scroll horizontally and vertically. It is an original game: no characters, names, levels, art or music from any existing commercial game.
- The hero, **Buck Nukem**, uses the face from `assets/img/buck_nukem.jpg` (sunglasses, long hair, moustache), reduced to a pixel-art head on a drawn pixel body, plus a larger portrait on the title and game-over screens.
- Level backdrops built from the TC Wollerau and Krebsbach photos (downscaled and colour-reduced for a retro look, used as parallax backgrounds).
- Three enemy types: **lawyers** (walk, throw briefcases/subpoenas), **mutant crayfish** (scuttle and leap from the creek), **crazy gardener robots** (patrol with hedge-trimmers, spray weedkiller).
- Final boss: a **giant mutant crayfish** with several attack patterns and a visible health bar.
- Music: a chiptune arrangement of Wagner's *Ride of the Valkyries* (public-domain composition), synthesized live with the Web Audio API, plus synthesized sound effects. No recorded audio is embedded, so no recording copyright applies.
- A Python build script that combines source JS/CSS and the processed images (as base64 data URIs) into **one self-contained `.html` file**.

## Capabilities

### New Capabilities
- `game/gameplay`: player control, combat, health, scoring, pickups, level progression, win/lose flow.
- `game/enemies`: behaviour of lawyers, mutant crayfish, gardener robots and the giant crayfish boss.
- `game/presentation`: 320×240 rendering, scaling, hero sprite and photo-derived backgrounds, HUD, title/game-over screens, music and sound effects.
- `game/distribution`: building and delivering the game as a single self-contained HTML file.

### Modified Capabilities
- None (no existing specs).

## Impact

- New source tree `src/` (JS modules, level data, styles) and `tools/build.py`.
- New output `dist/buck_nukem.html` (the deliverable; hard limit 2 MB).
- Build-time dependency: Python 3 with Pillow (already installed). Runtime: any modern desktop browser; no network access or external files.
- `assets/img/*` is read but not modified.

## Assumptions (to confirm or adjust)

- Scope: 3 levels plus a boss arena: (1) TC Wollerau clay courts, (2) Krebsbach creek and sports fields, (3) clubhouse/indoor hall, then the boss arena at the creek.
- Controls: keyboard only (arrows/WASD move, Up/Down climb ladders, Space/Ctrl jump, X/Alt fire, Enter/P pause, M mute). No gamepad or touch in this change.
- Language of in-game text: English.
