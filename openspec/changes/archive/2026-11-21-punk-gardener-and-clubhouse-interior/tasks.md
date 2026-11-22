# Tasks

## 1. Gardener-punk enemy

- [x] 1.1 Replace the robot with the punk in code: `CONFIG.punk*` (HP 5, points 500, patrol 24, charge 110, range 96, max charge 128 px, rev 0.5 s, cooldown 2 s), `ENEMY_TYPES.punk` (24×28 hitbox, contact 2), the `M` spawn in `src/main.js`, and the comments and legend in `src/level.js`. Verify no `robot` identifiers remain (`grep -n robot src/*.js` finds only historical comments, if any) and the build succeeds.
- [x] 1.2 Draw the punk and mower sprite set (30×30: `walk1`, `walk2`, `rev`) in `src/sprites.js` with the specified palette, built through `makeSet()`. Verify on the `#shot=sprites,nofilm` sheet, and with the existing outline test extended to `SPR.punk`.
- [x] 1.3 Implement the patrol → rev → charge → cooldown state machine with ledge and wall stops, and blunt smoke puffs. Replace the robot tests in `src/test.js` with punk tests: turns at a ledge; mower contact costs 2 health; a hero in front within 6 tiles triggers a ~0.5 s rev, then a charge at ≥ 3× patrol speed; the charge stops at a ledge without falling; no charge when the hero is behind; smoke puffs appear about once per second. Verify with `python tools/run_tests.py`.
- [x] 1.4 Add the `clipping` projectile (grass or stone, short range, 1 damage, removed on walls) spawned while charging, plus its drawing. Test that projectiles appear during a charge, fly forward, expire within about 0.4 s and cost the hero 1 health on contact.
- [x] 1.5 Add sounds `rev` and `mower` in `src/audio.js` and remove `spray`. Update the sound-coverage test list. Verify all effects trigger.

## 2. Punk gore

- [x] 2.1 Add `GORE_BY_TYPE.punk`: blood on a back hit, oil and sparks on a mower hit (shot against his facing). On death: blood and gibs plus mower oil, sparks, metal gibs and a ring flash. Replace the robot gore test with tests for a death (red and oil particles both present) and for a front hit (oil, no blood) versus a back hit (blood).

## 3. Clubhouse interior rendering

- [x] 3.1 Parse the `interior: x0-x1` header (build passes it through; `Level` stores the range). Draw the backdrop (wallpaper, plus wainscot above floors) for non-solid, non-window cells in range, and skip the hall overlay there. Test that a sampled empty interior cell shows backdrop colours rather than photo pixels, a window cell still shows the photo, and a gym-hall cell (column ≥ 64) still shows the darkened photo.
- [x] 3.2 Add the furniture platform characters `a`, `A`, `T` to `Level.isPlatform()` and `tools/check_levels.py`, with procedural tiles (counter, counter with taps, table with a checked cloth). Test that the hero can jump onto a table and stand on it, and that walking along the floor past `a`, `A`, `T`, `c` and `i` is not blocked.
- [x] 3.3 Add the prop renderers for `c`, `i`, `q`, `N` (flickering neon), `$`, `Z`, `m` (menu text via `drawTextTo`), `k`, `p`, `x`, `j`, `y` and `Y`, pre-rendered per level and drawn in the `back` layer anchored top-left. Expose `MENU_LINES` and test that the menu canvas contains CERVELAT, RIVELLA and FONDUE with prices (via the text log of `drawTextTo`) and that every prop canvas has visible pixels. Verify on a prop sheet in `#shot=sprites`.
- [x] 3.4 Make the build warn when a multi-tile prop's footprint overlaps a non-empty cell. Verify with a temporary test map that triggers the warning, and confirm the real levels build without warnings.

## 4. Refurnish level 3

- [x] 4.1 Furnish segments 1–2 of `src/levels/3_clubhouse.txt` as described in design §7 (restaurant downstairs in segment 1, bar downstairs in segment 2, club lounge upstairs), only in empty cells, and add `interior: 0-63`. Verify that `python tools/check_levels.py` reports level 3 completable with keys `g` and `r` and no unreachable pickups, and that the map contains every new prop character.
- [x] 4.2 Review screenshots of the restaurant, bar and lounge (with and without the film filter). Check the hero, enemies and pickups stand out from the furniture, then tune colours. Update `README.md` with the punk and the new map legend characters.

## 5. Integration checks

- [x] 5.1 Rebuild, then run `python tools/run_tests.py` and `python tools/run_tests.py --browser edge`. Verify all tests pass, there are no console errors, performance is under 8 ms per frame, and the output is ≤ 2 MB.
- [x] 5.2 Run `openspec validate punk-gardener-and-clubhouse-interior --strict` and verify it passes.

## Workflow follow-up

- Archive `add-grindhouse-style` first, then this change, so the modified requirements apply on top of the grindhouse versions.
