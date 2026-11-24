# Design

## Context

- **Main loop** (`src/main.js`, `frame()`): runs the fixed 60 Hz updates the elapsed time calls for (0, 1 or more), then *always* calls `Game.render()` and `present()`. At 120 or 144 Hz most refreshes have no update, but they still draw and filter the same state again.
- **Film filter** (`src/film.js`): `Film.apply()` does the following on the CPU:
  - reads the 320×240 scene buffer back (`ctx.getImageData`), which also forces the scene to be rasterized in software (`willReadFrequently: true` in `src/render.js`)
  - runs a per-pixel pass: luma-based saturation boost, a colour-curve lookup table per flicker level, grain from 4 precomputed noise frames at a random row offset, and the vignette
  - `putImageData` into the 320×240 `filmCanvas`
  - draws scratches and dust on it with the 2D context

  `present()` then draws `filmCanvas` scaled, with the jitter offset.
- **Who reads the film output:** the tests (`src/test.js`) and the promo bridge (`tools/promo/bridge.js`) read it through `filmCtx.getImageData`. The bridge sets `FILM.grain` before the first apply.
- **Promo runs are seeded:** they replay from a seeded `Math.random`, so the number and order of `Math.random()` calls per frame must not change.
- **Measured** (phone emulation 987×444, device pixel ratio 2.75, CPU 4× slower): recording 1.75 ms, software rasterization 2.6 ms, film pass 4.7 ms (readback 1.4, loop 2.8, put 0.1), damage 0.05 ms.

See proposal.md for the motivation, and the specs for the requirements.

## Goals / Non-Goals

**Goals:**
- Never draw two frames of the same game state.
- Take the film grade and the frame readback off the CPU wherever WebGL exists, with no visible change.
- Keep one look, one output canvas (`filmCanvas`) and one random sequence, whichever path runs.

**Non-Goals:**
- Interpolating between updates to smooth motion at 120/144 Hz. The 60 Hz look stays.
- Moving the scene drawing itself to WebGL (sprites and tiles keep using the 2D canvas).
- Changing the filter's look, its parameters or the G/Film toggles. No automatic filter-off.

## Decisions

### 1. Draw only after an update
`frame()` counts the updates it ran. It calls `Game.render()` and `present()` only when that count is above 0. The FPS counter counts drawn frames, so the debug overlay shows at most about 60.

`Touch.tick()` still runs on every refresh (it only compares a state signature). `resizeScreen()` still calls `present()` itself, because resizing clears the canvas.

The accumulator may run an update up to a quarter step early (`acc >= 0.75·DT`; `acc` keeps the difference, so the average stays exactly 60 updates a second). Found while implementing: refresh timestamps jitter around 1/60 s, so a strict `acc >= DT` alternates 0 and 2 updates per refresh on a 60 Hz display. With drawing tied to updates, that would show only about 40 frames a second. It was also an uneven-motion problem before, hidden because every refresh redrew.

*Alternative:* cap with a timestamp (draw when ≥ 16.6 ms have passed). Rejected: it drifts against the update clock and can show the same state twice or skip one.

### 2. WebGL grade, then the existing 2D damage pass
`Film.apply()` keeps its signature and its output, `filmCanvas` with scratches and dust. It gets two grade paths behind `Film.mode` (`"gl"` or `"cpu"`):

- **`gl`:**
  1. upload the scene buffer as a texture (`texImage2D` from the canvas, a GPU-to-GPU copy when the buffer is accelerated)
  2. draw one full-screen triangle with the grade shader into a 320×240 WebGL canvas
  3. `filmCtx.drawImage(glCanvas, 0, 0)`
  4. run the existing `drawDamage()` on `filmCtx`

  `present()` is unchanged.
- **`cpu`:** today's code, unchanged.

Both paths take their random values in the same order and count (flicker step, grain frame, grain row offset, then damage and jitter). They go through one shared `Film.grade(flick, grainIndex, rowOffset)`, so a seeded run replays the same on either path, and the tests can grade one frame on both paths with fixed inputs.

*Alternative:* `ctx.filter` CSS filters on the 2D canvas. Rejected: it can't reproduce the colour curve, the grain or the flicker. Support differs (older Safari), and the look would change.

### 3. The shader reproduces the CPU integer maths
- **Pixel lookup:** each fragment reads its source pixel at exact texel centres. The row is computed from `gl_FragCoord` (`yTop = H − 1 − floor(fragCoord.y)`), so no flip is needed. The texture uses NEAREST filtering with clamp.
- **Integer ops:** each `>> 8` becomes `floor(x / 256.0)` on integer-valued floats, including negatives (`>>` floors), and the result is clamped exactly as the CPU code clamps it.
- **Precision:** this needs `highp` floats in the fragment shader, because intermediate values reach about 75,000. If `GL_FRAGMENT_PRECISION_HIGH` is missing, the GPU path is not used.
- **Data as textures**, all built once in `Film.init()`, after the bridge may have changed `FILM.grain`:
  - colour curves: an RGB texture 256 wide × flicker levels high
  - grain: the 4 noise frames (each W × 2H, stored as `value + 128`) stacked in one 320 × 1920 single-channel texture, within WebGL1's guaranteed 2048
  - vignette: the same formula computed in the shader, at most 1 level off the table
- **Uniforms:** flicker row, grain frame and row offset, the desaturation constants.
- **Result:** both paths match within the spec's 2 levels; in practice they should be identical.

### 4. Choosing the path once, at load
- `render.js` tries WebGL before creating the scene buffer's context (on a 320×240 canvas: `alpha: false, antialias: false, depth: false, premultipliedAlpha: false`). If it gets one, it creates the buffer **without** `willReadFrequently`, so the scene is drawn and kept on the GPU. Otherwise it keeps `willReadFrequently: true` as today.
- `Film.init()` builds the shader and textures. Any failure sets `Film.mode = "cpu"` (shader compile or link error, no highp, `MAX_TEXTURE_SIZE < 1920`).
- A `webglcontextlost` event switches to `"cpu"` for the rest of the session. The CPU path still works on a GPU buffer, just with a slower readback.
- A `#film=cpu` URL parameter forces the CPU path, for comparisons on real devices.

### 5. Tests on both paths
- `src/test.js` runs the existing "film" checks once per available mode (`Film.setMode()`, test-only). It also adds:
  - **Same look:** `Film.grade()` with fixed inputs on both paths; the per-channel maximum difference must be ≤ 2.
  - **No readback:** `ctx.getImageData` is wrapped with a counter, and one drawn frame on the GPU path must not call it.
  - **Fallback:** forcing `"cpu"` and a simulated context loss both keep frames coming.
  - **Frame cap:** `frame()` driven by fake 144 Hz and 120 Hz timestamps draws at most 61 frames a second; at 60 Hz it draws on every update.
- `run_tests.py` and `screenshot.py` add `--enable-unsafe-swiftshader`. Headless Chrome with `--disable-gpu` then still offers (software) WebGL, so the GPU path is tested in CI-like runs. If the GPU path isn't available, the suite reports one failing check ("film: GPU path available in the test browser"), so it can't silently stop being tested.
- Under software GL, CPU timings aren't meaningful. The existing desktop "performance" check therefore measures the CPU path when the WebGL renderer reports SwiftShader. The GPU-versus-CPU comparison and the phone budget live in `tools/perf_phone.py`.

### 6. Phone performance check
`tools/perf_phone.py` uses Playwright, which is already required for the promo recorder.
- It loads an in-memory copy of `dist/buck_nukem.html` with the internals exposed (the same injection point as the promo session).
- It emulates a 987×444 phone at device pixel ratio 2.75 with touch.
- It throttles the CPU through CDP (1× and 4×) and plays the clay-court level with the hero running and firing for 300 frames on each path.
- It prints the per-stage times and the WebGL renderer, and exits with 1 if the spec's budgets are missed (GPU ≤ 60% of CPU; < 5 ms per frame at 4×).

## Risks / Trade-offs

- **[GPU readbacks are slow]** The tests and the promo bridge read the GPU scene buffer and the film canvas back. That's correct but slower → the test suite and the promo dry run are timed before and after. If the promo capture becomes much slower, the bridge can force `#film=cpu`. Both paths produce the same frames, so the video won't change.
- **[Driver differences or bugs in the shader on some phones]** → the exactness design (integer maths, highp only) and the fallback rules. The "same look" test and the benchmark-scene brightness and colour checks run on the GPU path too. The manual phone check stays.
- **[SwiftShader not offered by the test browser]** → the explicit "GPU path available" check makes this visible instead of silently testing only the CPU path.
- **[Promo seeds replay differently]** → shared random order (Decision 2). The promo dry run must still reach victory with the limits met.
- **[Frame cap and judder]** 60 Hz content on a 144 Hz display still alternates 2- and 3-refresh frames. Accepted; that is a Non-Goal.

## Migration Plan

Ship as the next patch release (1.0.7) after the real-phone check on the Xiaomi 13T Pro: `#debug` FPS and smoothness with the filter on. Roll back by reverting the release commit. No stored data or URLs change, except the optional new `#film=cpu`.
