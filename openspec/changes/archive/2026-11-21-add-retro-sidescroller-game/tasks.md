# Tasks

## 1. Project scaffold and build pipeline

- [x] 1.1 Create `src/`, `src/levels/`, `tools/`, `dist/` and `src/index.template.html` (black page, centred canvas, `image-rendering: pixelated`, `{{ASSETS}}`/`{{SCRIPT}}` placeholders); verify the folders and template exist
- [x] 1.2 Write `tools/build.py`: check that the required images exist (error naming the missing file), concatenate `src/*.js` in a fixed order inside one IIFE, inline it into the template, write `dist/buck_nukem.html`, print the size of each asset and the total, and exit non-zero above 2 MB; verify with a stub `main.js` that the page opens and a missing-image rename makes the build fail with the file name
- [x] 1.3 Make builds deterministic (sorted inputs, no timestamps); verify two consecutive builds produce identical SHA-256 hashes
- [x] 1.4 Add `README.md` with build command (`python tools/build.py`), controls and file layout; verify the documented command runs as written

## 2. Asset processing

- [x] 2.1 In `build.py`, process backgrounds (crop, resize to 480×240, 32-colour ordered-dither quantise, PNG → base64) for TC Wollerau (level 1), Krebsbach creek (level 2 + boss), Krebsbach courts (level 3) and the title backdrop; verify via saved previews in `dist/debug_*.png` and the per-asset sizes printed
- [x] 2.2 Extract the hero head (face crop of `buck_nukem.jpg` → 14×14, 12 colours, background mask) and the 96×96 title portrait; verify `dist/debug_head.png` (8× enlarged) is recognisable (sunglasses, hair, moustache)
- [x] 2.3 Emit `window.ASSETS = {...}` with data URIs plus an async image loader in `src/assets.js`; verify all images load in the browser console with no network requests (DevTools Network tab is empty apart from the file itself)

## 3. Engine core

- [x] 3.1 `render.js`: 320×240 back-buffer, integer scaling on resize, smoothing off; verify that at 1280×1000 the canvas is 1280×960 and that below 640×480 it is shown at 1×
- [x] 3.2 `main.js`: fixed 60 Hz timestep loop and state machine (TITLE, LEVEL_INTRO, PLAY, PAUSE, LEVEL_COMPLETE, BOSS, GAME_OVER, VICTORY); verify with an on-screen debug counter that updates/second stays ~60 on 60 Hz and 144 Hz displays (or with rAF throttled in DevTools)
- [x] 3.3 `input.js`: key state with pressed/released edges for arrows/WASD, Space/Ctrl, X/Alt, P/Enter, M, with `preventDefault` on game keys; verify that Space doesn't scroll the page and Alt doesn't focus the browser menu
- [x] 3.4 `font.js`: 5×7 bitmap font with `drawText`; verify the full character set renders on a test screen
- [x] 3.5 `sprites.js`: palette-index sprite definitions → cached canvases with mirrored variants; verify on a sprite-sheet debug screen

## 4. World and player

- [x] 4.1 `level.js`: parse ASCII maps (solid, one-way platform, ladder, water/kill, doors/keys, checkpoint, exit, enemy/pickup spawns), tile rendering per theme, animated water, camera with dead zone and clamping, parallax background; verify with a test map that the camera stays in bounds and the background moves slower than the tiles
- [x] 4.2 `player.js`: run, variable-height jump (Space/Ctrl), gravity, axis-separated tile collision, one-way platforms, ladders (Up/Down), facing; verify the spec scenarios: blocked by walls, no mid-air jump, short vs full jump, ladder climbing
- [x] 4.3 Hero sprite: procedural body poses (idle, run ×4, jump, climb ×2, shoot, hurt) composited with the photo head, mirrored when facing left; verify visually on the sprite debug screen and in play
- [x] 4.4 Shooting: projectiles with a fire-rate cap, removal on wall/enemy/off-screen, and a weapon power-up (faster shots, double damage, lost on death); verify that holding Fire for 1 s yields ≤ the configured shot count and that the power-up changes damage and the HUD icon
- [x] 4.5 Health (8), lives (3), invulnerability blink, death by 0 HP or falling, respawn at the last checkpoint; verify each scenario from `specs/game/gameplay` by hand
- [x] 4.6 Pickups (tennis balls, trophies, Rivella/Cervelat health capped at max, extra life, key cards), locked doors, exit; verify that a door blocks without its key, opens with it, and that the exit triggers level-complete with a bonus

## 5. Enemies and boss

- [x] 5.1 Enemy base: activation within one screen of the view, HP, hit flash, explosion particles, points; verify that a distant enemy doesn't move and a hit enemy flashes
- [x] 5.2 Lawyer: patrol, turn at ledges, briefcase throw when the hero is at a similar height in front; 3 HP; verify the ledge-turn and attack scenarios
- [x] 5.3 Mutant crayfish: scuttle, arc leap toward the hero, emerge from water tiles; 2 HP; verify the leap scenario
- [x] 5.4 Crazy gardener robot: patrol, hedge-trimmer contact damage, short-range weedkiller spray; 5 HP; verify the spray damages the hero only in front at short range
- [x] 5.5 Giant crayfish boss: multi-part sprite (about 96×64), vulnerable only at face/eye stalks while claws are raised, deflects shots elsewhere, on-screen health bar; verify deflection (spark, no HP loss) and damage on the weak spot
- [x] 5.6 Boss attack cycle: claw slam with screen shake, arc of bubble projectiles, summoning small crayfish; shorter pauses below 50 % HP; death explosion → VICTORY; verify each attack appears and the enrage phase speeds the cycle up

## 6. Levels

- [x] 6.1 Level 1, TC Wollerau clay courts (nets, fences, clubhouse roofs; lawyers and a few robots; key card + door; checkpoint); verify it is completable start to exit
- [x] 6.2 Level 2, Krebsbach creek and sports fields (water hazards, crayfish emerging, robots; vertical section with ladders; checkpoint); verify it is completable
- [x] 6.3 Level 3, clubhouse/indoor hall (mixed enemies, two key colours, weapon power-up; checkpoint); verify it is completable
- [x] 6.4 Boss arena at the creek (fixed 20×15 room, health pickups that respawn periodically); verify the boss can be beaten with the standard weapon

## 7. Presentation: HUD, screens, audio

- [x] 7.1 `hud.js`: score, segmented health bar, lives, weapon icon, keys in a 16 px top bar; verify health updates in the same frame it changes and the HUD never hides the hero
- [x] 7.2 Screens: title (BUCK NUKEM, portrait, Wollerau backdrop, controls, PRESS ENTER), level intro, level complete (bonus tally), PAUSED overlay, game over, victory; verify Enter on the title starts level 1 with score 0, 8 HP, 3 lives, and that pause freezes everything
- [x] 7.3 `audio.js`: Web Audio context started on the first keydown, look-ahead scheduler, 3-voice chiptune arrangement of the "Ride of the Valkyries" main theme looping, tempo ×1.25 in the boss arena; verify by ear that the motif is recognisable, loops without gaps and speeds up at the boss
- [x] 7.4 Sound effects (shot, jump, hit, explosion, pickup, hurt, door, claw slam) and the M mute toggle; verify each effect plays at its trigger and M silences everything

## 8. Integration checks

- [ ] 8.1 Full playthrough from title to victory and a game-over run in Chrome, Firefox and Edge; verify no console errors and steady ~60 fps
- [x] 8.2 Copy `dist/buck_nukem.html` alone to an empty folder, disconnect the network and play; verify all images and sound work and the file is ≤ 2 MB
- [x] 8.3 Run `openspec validate add-retro-sidescroller-game --strict` and verify it passes
