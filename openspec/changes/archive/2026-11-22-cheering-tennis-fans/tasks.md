# Tasks

## 1. Fan sprites

- [x] 1.1 Create the fan sprites (new `src/fans.js`, added to the build script list in `tools/build.py`): a 20×32 frame (16 px wide figure) with idle, wave and jump frames, and a variant table of at least 6 looks (hair shape and colour, skin tone, outfit accent, accessory), built with `makeSet`. Add tests: all variant frames pass the outline check, at least 6 distinct variants. Verify with `python tools/run_tests.py` and a sprite-sheet screenshot of all variants.

## 2. Behaviour and placement

- [x] 2.1 Add `F` to `ENTITY_CH`, create `Game.fans` in `loadLevel` (distinct variants per level), update them each frame (idle/wave loop with own phase, face Buck with a dead zone, hop while cheering) and draw them after the main tiles and before enemies. Add tests: frames change within 1 s, faces Buck on either side, Buck/shots/enemies pass through a fan cell. Verify with `python tools/run_tests.py`.
- [x] 2.2 Add `Fans.react(x, y, kind)` called from enemy kills, trophy pickups and checkpoints: fans within 12 tiles cheer for about 1 s; the nearest gets a speech bubble ("GO BUCK!" etc.) and `"cheer"` plays, at most once per 1.5 s; bubbles drawn above the hero layer. Add the `"cheer"` sound in `src/audio.js` and to the sound-coverage test. Add tests: reaction within 12 tiles, no reaction at 20 tiles, rate limit. Verify with `python tools/run_tests.py`.
- [x] 2.3 Place `F` in all four maps (3–5 per regular level, 2–3 in the boss arena; boss fans on an arena platform and the open floor left of the boss), add a build warning for an `F` without floor below, and update the README level-format table. Add tests: fan counts per level, each fan on floor or a platform, distinct looks per level; `python tools/check_levels.py` results unchanged. Verify with the tests, the level checker and screenshots of each level.

## 3. Integration

- [x] 3.1 Check the promo autopilot still completes every level (`python tools/promo/record_promo.py --dry all`), and run `python tools/build.py` (deterministic, under 2 MB), `python tools/run_tests.py`, `--browser edge`, `python tools/check_levels.py` and `openspec validate cheering-tennis-fans --strict`; all pass. Show screenshots of fans cheering in each level for review.

## 4. Messages from every fan

Superseded by the change `flirty-fan-crowd` (per-fan bubbles, shout-outs and flirty lines are implemented there); not tracked here. Original task 4.1: Give each fan her own speech bubble: on a reaction every fan within 12 tiles shows a bubble (different lines on screen at the same time), and each fan calls out to Buck with a greeting when he comes within 4 tiles (at most once per 8 s per fan, silent); the cheer sound stays limited to once per 1.5 s. Update the reaction and rate-limit tests and add shout-out tests (in range, not in range, 8 s cooldown, distinct lines). Verify with `python tools/run_tests.py`, `--browser edge` and a `cheer` screenshot where several fans show bubbles; re-run `openspec validate cheering-tennis-fans --strict`.

