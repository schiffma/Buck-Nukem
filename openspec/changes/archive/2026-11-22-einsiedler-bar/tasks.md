# Tasks

## 1. Taps, counter and sign

- [x] 1.1 Redraw `ts.counterTaps` in `src/level.js` as a chrome tower with 3 tall red/white Einsiedler tap handles with tiny shields and a drip tray. Give the plain counter `a` tile variants with a beer glass and beer mats.

  Tests:
  - The tap tile shows red and white handle pixels above the counter top, and is taller than before.
  - At least 2 counter variants differ.

  Check by eye in a level-3 bar screenshot.
- [x] 1.2 Add the prop `I` (Einsiedler sign, 4 × 1) to `src/props.js`, with "EINSIEDLER" in the game font on a framed board, and add `PROP_SIZES["I"] = (4, 1)` in `tools/build.py`.

  Tests: the prop canvas is 64 px wide and the text fits in it. Verify that the build's overlap check stays quiet for level 3.

## 2. Bar guys and waitress

- [x] 2.1 Add sprites in `src/sprites.js`:
  - 3 bar-guy looks (seated on a stool, 16 × 24), with `idle`, `drink` and `clink` frames
  - the blonde waitress (16 × 30), with `walk1`, `walk2` and `pour`
  - a filling beer glass, 3 frames

  Everything goes through `makeSet` (outlined, 3-tone).

  Tests:
  - Every frame is outlined.
  - The 3 looks differ.
  - The waitress's hair rows contain blonde pixels.
  - `drink` differs from `idle`.

  Add them to the `sprites` sheet.
- [x] 2.2 Create `src/bar.js` (add it to `JS_ORDER` after `fans.js`) with the `Bar` module:
  - `spawn` from `O`/`W` (added to `ENTITY_CH`, which clears the cells)
  - `update`: drink timers, the PROST timer, the waitress patrol and pours
  - `drawBack` for the waitress before the main tiles
  - `drawFront` for the guys after the main tiles
  - `drawBubble` for "PROST!"

  Hook it into `loadLevel`, `updateWorld` and `renderWorld` in `src/main.js`.

  Tests, with a test map:
  - 3 guys and 1 waitress spawn, and their cells are cleared.
  - Each guy shows at least 2 frames within 10 s.
  - "PROST!" appears, and its starts are at least 6 s apart over 40 s.
  - The waitress's x stays within the counter's columns.
  - She pours at least once within 15 s.
  - Buck, his shots and a lawyer pass through them, with no collision and no damage.

## 3. Level layout and docs

- [x] 3.1 Rearrange the level-3 bar in `src/levels/3_clubhouse.txt` as in design Decision 6:
  - the sign `I`
  - 3 `O`, with the old `i` stools removed
  - `W` behind the counter
  - the lawyer moved to 35

  Verify:
  - `python tools/check_levels.py` still reports the level completable with the same pickups.
  - The build shows no prop warnings.
  - A `play,2,41,17,120` screenshot shows the taps, the sign, the 3 guys and the waitress behind the counter.
- [x] 3.2 Add `O`, `W` and `I` to the `README.md` map legend and mention the Einsiedler bar in the clubhouse description. Rebuild `dist/buck_nukem.html`. Verify:
  - `python tools/run_tests.py` passes everything.
  - `python tools/promo/record_promo.py --dry all` reports "Spec limits: all met".

## Workflow follow-up

- Archive after review; release as the next version if wanted.
