# Tasks

## 1. Head from template and photo palette

- [x] 1.1 In `tools/build.py`, replace the downscale-based `make_head()`:
  - Add `SAMPLE_BOXES` and palette sampling (median plus light contrast) for hair light/dark, skin light/shadow, lens, moustache, jacket and shirt.
  - Add a sanity check that fails the build if hair isn't lighter than jacket, skin isn't warmer than lens, or moustache isn't lighter than skin.
  - Add a 12×12 `HEAD_TEMPLATE` plus 3 rows of shoulder hair (a 12×15 head) with the features: centre-parted long hair, tinted shades with a glint, white horseshoe moustache, stubble, cigar with ember.
  - Remove `FACE_CROP`, `FACE_FEATURES`, `HEAD_MASK` and `HEAD_EXTRAS`.

  Verify with `python tools/build.py`.
- [x] 1.2 Embed the sampled palette as `ASSETS_META.heroPalette` in the HTML (template placeholder plus JSON), and write `dist/debug_hero_compare.png` (photo face crop | head at 8× | swatches) with `--debug`. Verify the compare image visually: the head must read as the photo's person (long grey hair, tinted shades, white horseshoe moustache), and the template is adjusted until it does.

## 2. Body with new proportions and clogs

- [x] 2.1 Redraw the torso rows in `src/sprites.js` (11 rows, narrower shoulders, longer jacket, colours from `ASSETS_META.heroPalette`) for the normal, shoot, hurt and climb poses. Keep the gun barrel at frame row 18. Place the 12×15 head at (2, 0) in `buildHeroFrame`. Verify on the `#shot=sprites,nofilm` sheet, and confirm with a test that a hero shot still spawns 14 px below the hitbox top.
- [x] 2.2 Redraw the leg sets (idle, run1–3, jump, climb1–2; 10 rows) with jeans and wooden clogs: leather upper and a light-wood sole, a tilted clog on lifted feet, clogs from behind when climbing. Verify on the sprite sheet at 1× and 4×.
- [x] 2.3 Regenerate `buildHeadBack()` for the new head size, and add a `drawHead(g, x, y)` helper that centres the head in a 16×16 box. Use it for `SPR.life`, the HUD lives icon and the reel-card lives icon. Move the cigar smoke in `src/player.js` to the new mouth position. Verify with screenshots of the HUD, the reel card and an idle hero emitting smoke from the cigar tip.

## 3. Tests

- [x] 3.1 Add tests to `src/test.js`:
  - Proportion: head ≤ 12 rows, body ≥ 20 rows, in every hero frame.
  - Clogs: wood and leather colours in the bottom 3 rows of every grounded pose.
  - Face palette: every head pixel comes from the sampled palette or the fixed feature colours, and the palette relations hold.
  - Shot spawn height unchanged.

  Update the existing sprite-size expectations if needed. Verify with `python tools/run_tests.py`.

## 4. Revision: smaller head, belly, black clogs

- [x] 4.1 Shrink `HEAD_TEMPLATE` in `tools/build.py` to a 10×9 head plus 3 rows of shoulder hair (`HEAD_ROWS = 9`) while keeping the shades, glint, horseshoe moustache, stubble, long hair and cigar. Verify with `debug_hero_compare.png` and the face-palette and feature tests.
- [x] 4.2 Redraw the torso sets in `src/sprites.js` as 13 rows from `BODY_Y = 9` with a beer belly (shirt bulging forward) and the head at `HEAD_X = 3`. Keep the gun barrel on frame row 18. Make the clogs black. Update the tests: head ≤ 9 rows, body ≥ 23 rows, belly at least 3 px wider than the shoulders, black clogs in every pose, shot height unchanged. Update the cigar smoke position. Verify with `python tools/run_tests.py` and an enlarged sprite sheet.

## 5. Integration checks

- [x] 5.1 Rebuild, then run `python tools/run_tests.py` and `python tools/run_tests.py --browser edge` (all pass, no console errors) and `python tools/check_levels.py`. Review in-game screenshots of each level and the boss with the film filter on and off: the hero must read clearly at 1× and match the photo. Confirm the title portrait is unchanged.
- [x] 5.2 Run `openspec validate refine-hero-sprite --strict` and verify it passes.
