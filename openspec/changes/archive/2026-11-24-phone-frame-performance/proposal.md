# Proposal

## Why

On a Xiaomi 13T Pro in Chrome, v1.0.6 feels laggy and sluggish. Profiling the game in phone emulation (987×444 at device pixel ratio 2.75, CPU slowed 4×) shows two causes:

- **Drawing on every refresh.** The game draws and runs the film filter on every display refresh. The game logic only advances 60 times a second. On a 120/144 Hz phone that is 2–2.4 times the needed work, with a 7–8 ms budget per frame.
- **An expensive CPU film filter.** One frame costs about 9 ms at 4× slowdown:
  - 1.75 ms to record the drawing
  - 2.6 ms to rasterize the scene in software, which is only needed because the filter reads the pixels back
  - 4.7 ms for the filter's per-pixel pass

## What Changes

- **At most one drawn frame per game update.** The main loop draws (and runs the film filter) only after at least one 60 Hz update happened since the last drawn frame. A 120/144 Hz display then shows 60 drawn frames a second and does about 58% less work. Game speed and input handling stay unchanged.
- **Film filter on the GPU.** The colour-print grade runs as a WebGL shader with the same parameters as the CPU path: saturation boost, colour curve with flicker levels, warm cast, teal shadow lift, grain and vignette. The frame is no longer read back to the CPU, so the scene can be drawn on the GPU too. Scratches, dust and the gate-weave jitter stay as they are. The grade's output still lands in the same 320×240 film canvas, so the screen output, screenshots, tests and the promo recorder keep working.
- **CPU fallback.** Without WebGL, or if the shader fails to build, or if the GPU context is lost (for example when an app is switched on a phone), the current CPU filter is used. Both paths produce the same look. Adding `#film=cpu` to the URL forces the CPU filter, for comparisons on a device.
- **Tooling.** A phone performance check (Playwright, phone emulation with CPU throttling) prints the frame cost per stage, so the gain can be measured and kept.

No breaking changes, and no visible change to the look.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `game/presentation`: adds "Film filter on the GPU" (GPU path with CPU fallback, same look, lower CPU cost per frame).
- `game/distribution`: "Browser support". On high-refresh displays the game draws at most one frame per 60 Hz game update.

## Impact

- **Code:**
  - `src/main.js`: draw only after an update in `frame()`
  - `src/film.js`: the WebGL pass, CPU fallback, context-loss handling and mode switch
  - `src/render.js`: the scene buffer is created without `willReadFrequently` when WebGL is available, so the scene is drawn on the GPU
- **Tests:** `src/test.js` runs the existing film and benchmark-scene tests on both paths and adds:
  - both paths match (≤ 2 levels)
  - no readback during a GPU-path frame
  - CPU fallback and context loss
  - the GPU path is available in the test browser
  - frames are capped on 120/144 Hz loops
- **Tools:** new `tools/perf_phone.py`, using Playwright, which the promo recorder already depends on. It checks the speed targets (GPU path at most 60% of the CPU path's cost; under 5 ms per frame at 4× CPU slowdown). README notes.
- **Unchanged:** gameplay, levels, the look, touch mode, the single-file build (no new assets beyond inline shader text), the promo recorder.
- **Risks:**
  - GPU readbacks are slower: the tests and the promo recorder read pixels back from the scene buffer, which now lives on the GPU.
  - Small rounding differences between the GPU and CPU grades.
