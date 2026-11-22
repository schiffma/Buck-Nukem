# Tasks

## 1. Benchmark scenes and baseline

- [x] 1.1 Add a `benchmark scenes` helper and test in `src/test.js`: render the six fixed scenes (title, L1 courts, L2 creek bank, L3 clubhouse, L3 hall, boss arena) with the film filter on, average 4 frames, and report luma, chroma and clipped-white share per scene. Add the checks from the spec (luma ≥ 70, chroma ≥ 0.25, clipped white ≤ 3%). Verify with `python tools/run_tests.py` that the new checks run and fail against the current look, recording the baseline values in the test output.
- [x] 1.2 Save a "before" image of the same six scenes with `tools/screenshot.py` (into the scratchpad, not the repo) for the side-by-side comparison in 4.1. Verify the image exists and shows all six scenes.

## 2. Background grade

- [x] 2.1 In `tools/build.py`, change `GRADE` and the per-background brightness values to the colour-print grade (saturation up, little or no sepia, mild contrast, warm cast, brightness ≈ source), and invert the build-time grade check to: saturation up, brightness ≥ 90% of the source, warm shift. Verify `python tools/build.py` passes its check and prints higher saturation/brightness for every background; inspect `python tools/build.py --debug` previews.

## 3. Film filter and palettes

- [x] 3.1 Retune `FILM` and `Film.init()/apply()` in `src/film.js`: no desaturation (small saturation boost in the same per-pixel expression), contrast ≈ 1.1, crush ≈ 4, warm highlights / teal-lifted shadows, vignette ≈ 0.3, grain ≈ ±10. Add the spec tests "grade keeps colour" (uniform saturated frame keeps or gains chroma) and "light vignette" (corners darker but ≥ 70% of centre), and adjust the existing vignette check accordingly. Verify with `python tools/run_tests.py` (filter tests and the 8 ms performance test pass).
- [x] 3.2 Brighten and saturate the `THEMES` palettes and interior tile colours in `src/level.js` (and dark hard-coded colours in `src/props.js` where they read as black on the new backgrounds), keeping crack/stain grime overlays and the red toxic water. Verify the existing worn-tile, toxic-water and props tests still pass.
- [x] 3.3 Lighten the title and end-card overlays in `src/screens.js` so the colour-graded title photo shows through, keeping the poster layout. Verify the title/poster/end-card tests pass.
- [x] 3.4 Tune the values from 2.1 and 3.1–3.3 until every benchmark scene passes the luma, chroma and clipped-white checks from 1.1. Verify `python tools/run_tests.py` and `--browser edge` both pass in full.

## 4. Review and docs

- [x] 4.1 Produce an "after" image of the six scenes with `tools/screenshot.py` and a side-by-side before/after comparison; check by eye that the grindhouse character (grain, scratches, warm print colours, poster title, reel cards, gore) is intact and sprites/pickups read clearly. Show the comparison to the user for approval.
- [x] 4.2 Update the README "Look" section (colour-print grade instead of sepia-graded photos, lighter vignette). Verify it matches the built game.
- [x] 4.3 Run `python tools/build.py` (deterministic, under 2 MB), `python tools/run_tests.py`, `python tools/run_tests.py --browser edge`, `python tools/check_levels.py` and `openspec validate brighten-grindhouse-colors --strict`; all pass.
