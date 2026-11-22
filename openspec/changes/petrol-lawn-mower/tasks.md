# Tasks

## 1. Petrol mower look and exhaust

- [x] 1.1 Redraw `MOWER`, `MOWER2` and the rev rows in `src/sprites.js` as a petrol mower (engine block with fins, fuel tank with cap, pull-start grip, muffler with exhaust opening, deck, spoked wheels, rust) and export the exhaust position. Add a test that the mower rows contain engine, tank, muffler and wheel colours, keep the outline test on all punk frames, and add a "punk gameplay values unchanged" test. Verify with `python tools/run_tests.py` and the `sprites` screenshot.
- [x] 1.2 Replace the old rev puffs with state-driven exhaust smoke from the muffler (patrol light puffs, rev dark and ≥ 3× as often, charge dark trail, none after death); the blunt smoke stays. Add the four smoke tests from the spec. Verify with `python tools/run_tests.py` and a level 1 screenshot with a revving punk.

## 2. Engine sound

- [x] 2.1 Add the 2-voice engine manager to `src/audio.js` (`Sound.setEngines`, logical targets for rate, pitch and loudness, Web Audio voices with LFO amplitude modulation on the `sfx` bus, ¼ s fade) and `Game.updateEngines()` in `src/main.js` (nearest 2 on-screen punks; empty list when not playing, paused or tallying). Add tests: 2-voice cap with nearest louder, pitch patrol < rev < charge, voices released on pause/level end/off-screen, mute silences. Verify with `python tools/run_tests.py`.
- [ ] 2.2 Add `"pullstart"` (first engine start) and `"choke"` (death) and redesign `"rev"` and `"mower"` as petrol sounds; add them to the sound-coverage test. Verify with `python tools/run_tests.py`, then listen in Chrome on level 1 (engine approach, rev, charge, death) and balance the engine below the music.

## 3. Promo video and docs

- [x] 3.1 Log engine targets per frame in `tools/promo/recorder.js` and render the 2 voices in each offline audio chunk. Verify with a full `python tools/promo/record_promo.py` run into the scratchpad that the engine is audible around a punk and the video stays ≤ 16 MB.
- [x] 3.2 Update the README (gardener-punks with a smoking petrol mower and engine sound). Verify it matches the built game.
- [x] 3.3 Run `python tools/build.py` (deterministic, under 2 MB), `python tools/run_tests.py`, `--browser edge`, `python tools/check_levels.py` and `openspec validate petrol-lawn-mower --strict`; all pass.
