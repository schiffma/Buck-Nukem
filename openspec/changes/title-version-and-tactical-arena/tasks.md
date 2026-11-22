# Tasks

## 1. Build version

- [x] 1.1 In `tools/build.py`, add a `build_version()` function. It returns the latest `v*` tag if nothing outside `dist/` changed since that tag (no commits, no uncommitted changes). Otherwise it returns `tag-N-g<hash>`, with `-dirty` appended when there are uncommitted changes outside `dist/`. If git fails, it falls back to `"v" + VERSION`. Pass the result as `ASSETS_META.version` and print it during the build. Verify:
  - On the clean v1.0.2 checkout, the build prints `v1.0.2`.
  - After touching `src/`, it prints `…-dirty`.
  - With `PATH` lacking git, it prints `v` plus the `VERSION` file contents.
  - Running the build twice gives byte-identical output.
- [x] 1.2 In `src/screens.js`, draw the version in the bottom-right corner of the title, right-aligned at about (314, 230). Add a test: the text is non-empty, starts with "V", fits inside the screen and doesn't overlap the "SOUND ON"/"PRESS ENTER"/badge boxes. Check by eye in the `title` screenshot.

## 2. Crate tiles

- [x] 2.1 In `src/level.js`, add `D` (sturdy) and `d` (breakable) to `SOLID_CH` and to the legend comment. Store breakable strength per tile (6 each, reset when the level is loaded). Add `hitCrate(tx, ty, dmg)`: it lowers the strength, and at 0 writes `.`, plays the splinter FX and the crate sound. Tests:
  - A `d` tile breaks after exactly 6 blaster hits or 2 blades.
  - A `D` tile survives 50 blades.
  - The hero can walk through a broken `d` spot.
  - Breaking survives a respawn, and reloading the level restores the crate.
- [x] 2.2 In `src/enemies.js` `updateShots`, make hero shots that hit a `d` tile call `hitCrate` (blaster 1, blade 3). Test: a shot hitting a `D` or `d` tile disappears, and only `d` loses strength.
- [x] 2.3 Draw the crate tiles in `buildTileset`:
  - wooden planks with a dark outline
  - `D` with metal bands and rivets
  - a cracked `d` variant, used at strength ≤ 3
  - a `crate` break sound in `src/audio.js` (add it to the sound list test)
  - splinter particles

  Tests: the `D`, `d` and cracked `d` tiles differ pixel-wise; every opaque edge pixel is outlined. Add crates to the sprite-sheet screenshot and check by eye.

## 3. Boss attacks and cover

- [x] 3.1 In `src/enemies.js`, remove a shockwave when the tile at its leading edge at floor height is solid, with a dust burst; a `d` tile also takes 3 damage. Tests:
  - A shockwave stops at a `D` crate, and a hero standing behind it isn't hurt.
  - A shockwave takes 3 strength from a `d` crate.
  - A hero standing on a platform isn't hit.
  - The existing "kneel: the boss shockwave still hits a kneeling hero" test still passes on open floor.
- [x] 3.2 In `src/boss.js` `summon`, spawn minions within the camera view, left of the boss: `[max(Camera.x+24, 40), min(ox−60, Camera.x+W−24)]`, clamped. Test: with the camera on the left screen, every summoned crayfish starts inside the view and left of the boss.

## 4. Wide arena map

- [x] 4.1 Rewrite `src/levels/4_boss.txt` as 40 × 15:
  - floor in row 14, walls at columns 0 and 39
  - `P` at about column 2, `X` at about column 33
  - one-way platforms on rows 10, 7 and 4, plus 2 ladders
  - `h` on the floor and on the upper tiers
  - 4–5 `F`
  - 2 `D` and 3–4 `d` placed as in design Decision 3

  Verify: `python tools/check_levels.py` reports the boss reachable, and the build passes its prop/overlap checks.
- [x] 4.2 Update `src/test.js` for the new arena:
  - The size check becomes "boss 40x15".
  - New arena checks: at least 3 platform rows; at least 2 `D` and 3 `d`; 4–5 fans.
  - The hero starts in the left screen and the boss in the right one.
  - The camera scrolls when the hero walks right.
  - A blade fired from the end of the row-10 platform hits the raised face.

  Fix any existing boss/fan/kneel tests that assumed the 20-wide map. Verify: `python tools/run_tests.py` passes everything.
- [x] 4.3 Update `tools/check_levels.py` so `D`/`d` count as solid (if it doesn't already read `SOLID_CH` from the game). Verify the checker's output for all 4 levels is unchanged apart from the arena.

## 5. Promo agent

- [x] 5.1 Update `tools/promo/bridge.js` and the agent for the new arena:
  - Crates go into the snapshot.
  - The boss leaf's firing spots become the row-10 platform end and the floor behind the nearest crate.
  - It climbs or jumps up when a slam starts.
  - It breaks a `d` crate only when it blocks the line of fire.

  Update `tools/promo/tests/test_behaviour.py`. Verify: `python tools/promo/record_promo.py --dry` wins the boss fight with all spec limits met.

## 6. Docs and release check

- [x] 6.1 Update `README.md`:
  - legend: `D` sturdy crate, `d` breakable crate
  - the boss arena description (two screens, platforms, crates)
  - version on the title
  - the release flow: bump `VERSION` → commit → tag → build → commit `dist/` → push `main`, tags and `main:gh-pages`

  Rebuild `dist/buck_nukem.html`. Verify: the README renders, the build succeeds, and `python tools/run_tests.py` passes.
- [ ] 6.2 Play-check the boss arena once by hand (or via the `boss` screenshot): the camera scrolls, platforms and crates are readable, the version shows on the title, and the fight is winnable with the disc cutter.

## Workflow follow-up

- Archive the change after review.
- Release as the next version (bump `VERSION`, tag, build, push incl. `gh-pages`) and optionally re-record the promo video.
