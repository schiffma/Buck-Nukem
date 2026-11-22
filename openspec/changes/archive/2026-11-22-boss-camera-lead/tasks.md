# Tasks

## 1. Left-anchored camera in the boss arena

- [x] 1.1 Add `Camera.anchorX` (default `W / 2`) in `src/level.js`.
  - `follow` keeps the target's centre within `anchorX ± dz`, with `dz` 24 for the centre and 12 for the arena.
  - `snap` places the centre at `anchorX`.
  - Both still clamp to the map.

  In `Game.loadLevel` (`src/main.js`), set `Camera.anchorX = L.isBoss ? CONFIG.bossCamX : W / 2`, with `bossCamX: 80` in `src/config.js`.

  Tests in `src/test.js`:
  - In the arena, walking Right from column 8 to column 20 keeps the hero's screen centre within 60..100 px at every step; turning to face left doesn't move the camera.
  - After `Game.onPlayerDeath()` in the arena, the hero's screen centre is in 60..100 px (or the camera is at 0).
  - Near the right end, the camera is clamped to `pxW − W`.
  - Level 1 still keeps the hero within ±24 px of the screen centre.
- [x] 1.2 Update the existing tests that assume a centred camera in the arena: the reveal's "camera back on Buck" check and any `nearBoss`/scrolling checks. Verify: `python tools/run_tests.py` passes everything. Check `play,3,14,13,60` in a screenshot: Buck is on the left and the boss is visible on the right.

## 2. Docs and promo check

- [x] 2.1 Add a line to `README.md` in the boss paragraph saying the camera keeps Buck on the left. Rebuild `dist/buck_nukem.html`. Run `python tools/promo/record_promo.py --dry all` with seeds 1977 and 7 and confirm "Spec limits: all met". Verify: the build succeeds, the tests pass, and both dry runs meet the limits.

## Workflow follow-up

- Archive `mega-cutter-and-boss-reveal` first, then this change.
