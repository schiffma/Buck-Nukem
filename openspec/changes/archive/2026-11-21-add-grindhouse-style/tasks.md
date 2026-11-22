# Tasks

## 1. Controls

- [x] 1.1 Map ControlLeft/ControlRight to `fire` in `src/input.js`, so jump is Space only. Update the input tests in `src/test.js`: Ctrl fires a shot, Ctrl does not jump, Ctrl's default action is prevented. Verify with `python tools/run_tests.py`.
- [x] 1.2 Update the title-screen controls list ("SPACE: JUMP", "X/CTRL/ALT: FIRE", "G: FILM FILTER") and the README controls table. Add a test that checks the title's controls lines. Verify the README matches.

## 2. Film post-processing

- [x] 2.1 Add `filmCanvas` and a `Film` module (in `src/render.js` or a new `src/film.js` added to `JS_ORDER` in `tools/build.py`). Precompute the tone tables (8 flicker levels), the vignette multipliers and 4 grain frames. Apply the grade, desaturation, grain and vignette in one pass from `buffer` to `filmCanvas`. Verify with a test: corners are darker than the centre, and two consecutive frames of a static scene differ.
- [x] 2.2 Add scratches (persistent for a few frames) and dust specks, plus a 0–1 px jitter in `present()`. Verify with a screenshot via `tools/screenshot.py`, and with a test that jitter offsets stay within 0–1 px.
- [x] 2.3 Add the G toggle (`KeyG` → `film`, on by default). With the filter off, `present()` draws `buffer` directly. Verify with a test: after G, the screen output equals the unfiltered buffer scaled; after G again, the filter is back on.
- [x] 2.4 Extend the performance test to run with the filter on. Verify the average update+render+film is under 8 ms per frame in headless Chrome and Edge.

## 3. Sprite outlines, shading and details

- [x] 3.1 Implement auto-shading (highlight / base / shadow) and a 1-px dark outline with padding in `makeSet()`. Record `pad` on each set. Update every draw site (hero, enemies, briefcase, pickups where they use sets) to subtract `pad`. Verify with a test that every opaque edge pixel of hero and enemy sprites borders an outline pixel, and confirm via the existing movement and collision tests that anchors are unchanged.
- [x] 3.2 Hand-edit the sprite details: hero bigger gun, boot cuffs and belt buckle; lawyer eye shadows and grin; crayfish slime highlights; robot rust and stained blade. Verify on the `#shot=sprites` sheet.
- [x] 3.3 Extend `FACE_FEATURES` in `tools/build.py` with stubble and a cigar with an ember pixel. Add idle cigar smoke particles in `src/player.js`. Verify with `python tools/build.py --debug` (`dist/debug_head.png`) and an in-play screenshot.

## 4. Worn tiles and gritty backgrounds

- [x] 4.1 Generate 3 worn variants (clean, cracked, grimy or rusty) for `solid`, `solidTop`, `alt` and `plat` per theme, and pick a variant by a stable hash of (tx, ty). Tone down the base colours. Verify with a test that a row of 10 identical solid tiles uses at least 2 variants, and check the look with level screenshots.
- [x] 4.2 Apply the gritty grade to backgrounds in `tools/build.py` (desaturate, sepia blend, contrast, darken). Make the build print mean saturation, brightness and red−blue for each background against its source crop, and fail if they don't move in the required direction. Verify from the build output and with `dist/debug_bg_*.png`.

## 5. Gore and damage flash

- [x] 5.1 Add `FX.blood`, `FX.gibs` and stains to `src/fx.js`: particles turn into stains on solid tiles, with at most 64 stains and a 20 s life that fades over the last 3 s. Draw stains after the main tile layer. Verify with tests for stain creation, the cap at 64 and expiry after 20 s.
- [x] 5.2 Wire up per-type gore in `damageEnemy()` and `src/boss.js`: blood drops on surviving hits; on defeat, blood and gibs for lawyers and crayfish, oil, sparks and debris for robots, and a big shower for the boss. Verify with tests that a lawyer death produces red particles and stains, and a robot death produces dark/oil particles and no red ones.
- [x] 5.3 Add the damage flash: `Game.hurtFlash` is set in `Player.hurt()` and the red vignette is drawn in `renderWorld()`. Verify with a test that after a hit the edge pixels of `buffer` are redder than without the flash, and that the flash is gone after 0.3 s.

## 6. Grindhouse screens

- [x] 6.1 Build the poster title screen: halftone over the darkened photo, torn border, distressed outlined "BUCK NUKEM" logo, tagline, "RATED W - WOLLERAU" badge, portrait and controls. Verify with a screenshot and the existing test that Enter starts level 1.
- [x] 6.2 Turn `LEVEL_INTRO` into reel cards: a "MISSING REEL" phase for the boss only, then the countdown leader 3-2-1, then "REEL n" / "FINAL REEL" with the level name. Enter or Space skips to play. Update the flow tests for the longer intro. Add tests: the phase order for level 2, MISSING REEL appearing only before the boss, and skipping with Enter.
- [x] 6.3 Style game over and victory as "THE END" cards. Verify with screenshots and the existing game-over and victory flow tests.

## 7. Integration checks

- [x] 7.1 Rebuild, then run `python tools/run_tests.py` (Chrome) and `python tools/run_tests.py --browser edge`. Verify all tests pass, there are no console errors, the output is ≤ 2 MB, and `python tools/check_levels.py` still passes.
- [x] 7.2 Take a screenshot set of title, each level, boss, reel cards, THE END cards and the sprite sheet with `tools/screenshot.py`. Review it for readability (HUD legible, hero and enemies distinguishable from the backgrounds) and tune the `FILM` constants if needed.
- [x] 7.3 Run `openspec validate add-grindhouse-style --strict` and verify it passes.

## Workflow follow-up

- Archive `add-retro-sidescroller-game` first so `game/gameplay`, `game/enemies` and `game/presentation` exist in `openspec/specs/`, then archive this change.
