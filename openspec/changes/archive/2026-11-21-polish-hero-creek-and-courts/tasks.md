# Tasks

## 1. Slimmer belly

- [x] 1.1 Reduce the belly in `HERO_TORSO`, `HERO_TORSO_SHOOT`, `HERO_TORSO_HURT` and `HERO_TORSO_CLIMB` (`src/sprites.js`) to 1–2 px wider than the shoulders, keeping the gun barrel on frame row 18. Change the belly test in `src/test.js` to `1 ≤ belly − shoulders ≤ 2`. Verify with `python tools/run_tests.py` and an enlarged `#shot=sprites,nofilm` view.

## 2. Toxic red creek

- [x] 2.1 Add per-theme water palettes to `THEMES` in `src/level.js`: toxic red for `creek`, blue for the others. Build the water and water-top tiles from them, with animated bubbles, and draw a red glow strip above surface tiles. Expose `Level.waterPalette`. Test: creek water tiles are dominantly red (R > G + 60, R > B + 60) with no blue pixels, two frames 0.25 s apart differ, and court water (if built) stays blue.
- [x] 2.2 Replace the hard-coded splash and bubble blues in `src/player.js` and `src/enemies.js` with `Game.level.waterPalette.splash` / `.bubble`. Test: touching creek water produces red splash particles and still costs 2 health with a bounce.
- [x] 2.3 Add the `*` toxic drum and `^` warning-sign props (skull plus "TOXIC") to `src/props.js` and `PROP_SIZES`. Place at least 2 of each next to the pools in `src/levels/2_creek.txt`, changing only empty cells. Test that the level contains ≥ 2 of each and that the sign text logs "TOXIC". Verify `python tools/check_levels.py` still passes level 2.

## 3. Tennis court equipment

- [x] 3.1 Add the props `Q` umpire chair, `@` ball machine, `%` ball basket, `V` racket bag, `z` bench, `[` scoreboard ("TC WOLLERAU", "6:4 3:6 7:5"), `J` drag brush and `&` water cooler to `src/props.js` and `PROP_SIZES`. Extend the props test so every new prop renders visible pixels at its footprint size and the scoreboard text logs "TC WOLLERAU".
- [x] 3.2 Furnish `src/levels/1_courts.txt` with every equipment type, changing only empty cells (guarded by a script assertion). Verify that the build shows no prop-overlap warnings, `python tools/check_levels.py` passes level 1 with all pickups reachable, and a test confirms that every equipment character appears in level 1 and that walking along the ground past the equipment isn't blocked.

## 4. Integration checks

- [x] 4.1 Rebuild, then run `python tools/run_tests.py` and `python tools/run_tests.py --browser edge` (all pass, no console errors). Review screenshots of level 1 (courts) and level 2 (pools, drums, signs) with the film filter on and off, plus the enlarged hero sprite. Update the `README.md` map legend.
- [x] 4.2 Run `openspec validate polish-hero-creek-and-courts --strict` and verify it passes.
