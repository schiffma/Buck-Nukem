# Tasks

## 1. Multi-track scheduler

- [x] 1.1 In `src/audio.js`, add the `SONGS` table (`valkyries` = existing `SONG` with its own `sixteenth: 0.1`; keep the `SONG` global), `Sound.track` (default `"title"`) and `Sound.setTrack(name)` that restarts at step 0 only when the track changes; make `schedule()` read the current song and its `sixteenth`. Verify `python tools/build.py` succeeds and `python tools/run_tests.py` still passes all existing music tests (Valkyries shape, seamless loop, boss tempo).
- [x] 1.2 In `src/main.js`, call `Sound.setTrack(...)` from `Game.setState` (title → `"title"` with tempo 1, every other state → `"valkyries"`). Add tests in `src/test.js`: title selects the title track; Enter on the title switches to the Valkyries at step 0; pause/resume and level complete → next level do not restart the Valkyries; game over → title and victory → title switch back to the title track at tempo 1. Verify with `python tools/run_tests.py`.

## 2. Rock title theme

- [x] 2.1 Add the distortion chain to `Sound`: a soft-clip `WaveShaperNode` curve created in `unlock()`, and the voices `gtr` (with palm-mute flag), `pow`, `rbass`, `crash` and `tom` in `playEvent`, using volumes other than 0.22. Verify by building and running `python tools/run_tests.py` (no regressions) and by an F3 check that the title still runs at 60 fps.
- [x] 2.2 Compose the original 16-bar 4/4 rock song (about 132 bpm, E minor: riff bars 1–8, power-chord bars 9–14, fill/turnaround bars 15–16, crashes on bars 1 and 9) as `SONGS.title` in the same event-list format. Check the riff by ear and against the rule that it quotes no known riff. Add tests: 16 × 16 steps; the loop contains `gtr`, `pow`, `rbass`, `kick` and `snare` events; with a stubbed clock the scheduler loops the title song without gaps, using the title song's sixteenth. Verify with `python tools/run_tests.py` (Chrome) and `--browser edge`.
- [ ] 2.3 Add a mute test on the title screen (M while the title theme plays silences the master gain and M again restores it) and listen in Chrome: any key starts the rock theme, Enter cuts to the Valkyries on the reel intro, returning to the title brings the rock back. Balance the rock music level against the Valkyries by ear.

## 3. Promo video and docs

- [x] 3.1 In `tools/promo/recorder.js`, log `Sound.setTrack` calls with their frame times, make `renderAudio()` switch songs (step 0, per-song sixteenth) at those times alongside the tempo log, and add `createWaveShaper` to the offline proxy. Verify that a recording (`python tools/promo/record_promo.py`; the script has no length option, so it records a full run) opens with the rock theme on the title and cuts to the Valkyries at the first reel intro.
- [x] 3.3 Render the promo audio in 30 s chunks (one `OfflineAudioContext` per chunk with a 3 s tail, mixed by sample offset) and post a log line per chunk. Verify render time grows linearly (a 600 s render finishes well under 120 s) and a full `python tools/promo/record_promo.py` run completes.
- [x] 3.2 Update `README.md`: the `audio.js` line in the source layout and the Credits ("original 70s-style rock title theme, synthesized live; no recordings"), and the title-screen note that any key starts the music. Verify the README matches the behaviour in the built `dist/buck_nukem.html`.

## 4. Integration check

- [x] 4.1 Run `python tools/build.py` (deterministic, under 2 MB), `python tools/run_tests.py`, `python tools/run_tests.py --browser edge` and `python tools/check_levels.py`; all pass, and `openspec validate add-title-rock-music --strict` passes.

## 5. Reliable title music

- [x] 5.1 Start audio on the first key, mouse click or touch (`pointerdown`/`touchstart` in `src/input.js` feed the same unlock path) and update the title hint text (design §8). Add a test that a simulated click on the title unlocks audio and starts the title theme. Verify with `python tools/run_tests.py`.
- [x] 5.2 Try to start audio on page load (create and `resume()` the context; start the music if it runs) and resume a suspended context on `visibilitychange` and on every interaction. Add tests with a stubbed context: autoplay allowed → music starts without input; suspended → resumed on interaction. Verify with `python tools/run_tests.py` and by opening `dist/buck_nukem.html` in Chrome.
- [x] 5.3 Resync the scheduler after stalls (skip missed sixteenths, keep the song position in time). Add a test: with a fake clock jumped 10 s ahead, no event is scheduled in the past and the step matches the elapsed time. Verify with `python tools/run_tests.py`.
- [x] 5.5 Sound first on the title (design §8): `Sound.ready()`; while not ready the first Enter, Space, click or tap only starts the title theme and the title stays; the hints "PRESS ANY KEY FOR SOUND" / "TAP FOR SOUND", then "PRESS ENTER" / "TAP TO START"; the promo recorder's browser started with the autoplay flag (or the bridge unlocking first). Add tests with a stubbed context: suspended → the first Enter keeps the title, starts the theme, and the next Enter starts the game; running → Enter starts the game; no Web Audio → Enter starts the game; the same with a tap in touch mode. Update the README title note. Verify with `python tools/run_tests.py`, `--hash touch` and `python tools/promo/record_promo.py --dry all`.
- [x] 5.4 Add route tests: first start, game over → title, victory → title, and M twice on the title all leave the title track active, at tempo 1 and playing. Verify with `python tools/run_tests.py` and `--browser edge`, then rebuild and re-run the full checks (build, tests, level checker, `openspec validate add-title-rock-music --strict`).

