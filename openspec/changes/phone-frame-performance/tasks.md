# Tasks

## 1. Draw at most once per update

- [x] 1.1 In `frame()` (`src/main.js`), count the updates per refresh. Call `Game.render()`/`present()` and the FPS count only when it is above 0, and keep `Touch.tick()` on every refresh. Extend the "timestep" test: fake 144 Hz and 120 Hz timestamps draw at most 61 frames a second with 60 updates, a fake 60 Hz loop draws a frame on every update, the drawn frame shows the state after the latest update, and the FPS counter behind the debug overlay (`Game.fps`) is at most 61 at 144 Hz. Verify with `python tools/run_tests.py` and `python tools/run_tests.py --hash touch`.

## 2. GPU film pass

- [x] 2.1 Probe WebGL in `src/render.js` before the scene buffer's context is created, and create the buffer without `willReadFrequently` when a context is available (design §4). Add `--enable-unsafe-swiftshader` to `tools/run_tests.py` and `tools/screenshot.py`. Add the check "film: GPU path available in the test browser". Verify with `python tools/run_tests.py`: the new check passes, and the whole suite is still green on the CPU path (`Film.mode` still `"cpu"` at this point).
- [x] 2.2 Refactor `Film.apply()` in `src/film.js` around a shared `Film.grade(flick, grainIndex, rowOffset)`, keeping the same `Math.random()` order and count (design §2), and add the test-only `Film.setMode()`. Add a test that the number of `Math.random()` calls per `apply()` is unchanged. Verify with `python tools/run_tests.py`, and with `python tools/promo/record_promo.py --dry 0`: same level 1 report as before the change (score, items, kills, time).
- [x] 2.3 Implement the WebGL grade (design §3): shader with highp integer maths, the curve, grain and vignette data, the uniforms, `drawImage` into `filmCtx`, then `drawDamage()`. Use it when available. Handle `webglcontextlost` → `"cpu"`, and add the `#film=cpu` URL parameter. Add tests:
  - same look: `Film.grade()` with fixed inputs on both paths; per-channel maximum difference ≤ 2
  - no `ctx.getImageData` call during a GPU-path drawn frame
  - a simulated context loss switches to `"cpu"` and frames keep coming
  - `#film=cpu` parsing

  Verify with `python tools/run_tests.py`.
- [x] 2.4 Run the existing film and benchmark-scene checks on both paths (loop over `Film.setMode()`). On software GL, run the desktop "performance" check on the CPU path (design §5). Verify with:
  - `python tools/run_tests.py`
  - `python tools/run_tests.py --browser edge`
  - `python tools/run_tests.py --size 844,390 --hash touch`
  - a desktop `screenshot.py` sheet (title, level 1, boss), checked by eye against the CPU path

## 3. Phone performance check and docs

- [x] 3.1 Write `tools/perf_phone.py` (design §6): per-stage times on both paths at 1× and 4× CPU, the WebGL renderer, and exit code 1 when the budgets are missed (GPU ≤ 60% of CPU; < 5 ms per drawn frame at 4×). Verify by running it: it prints the table and exits 0.
- [x] 3.2 Update `README.md`:
  - the Look section: film filter on the GPU, CPU fallback, `#film=cpu`
  - the Tests section: `tools/perf_phone.py`
  - the source layout line for `film.js`

  Verify that the documented commands run as written.

## 4. Integration

- [x] 4.1 Run `python tools/build.py`, the three `run_tests.py` variants from 2.4, `python tools/check_levels.py`, `python tools/promo/record_promo.py --dry all` (victory, limits met), `python tools/perf_phone.py` and `openspec validate phone-frame-performance --strict`; all pass.
- [ ] 4.2 The user checks on the Xiaomi 13T Pro (Chrome, landscape), via a LAN server or GitHub Pages after release:
  - with `#debug`: FPS stays at about 60 and play feels smooth with the film filter on
  - with `#film=cpu`, for comparison
  - the look is unchanged

## Workflow follow-up

- Release as 1.0.7 following the README release steps after 4.2, then archive the change.
