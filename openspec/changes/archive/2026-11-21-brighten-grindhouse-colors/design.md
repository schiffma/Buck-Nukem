# Design

## Context

Three layers darken and desaturate every frame today (see proposal.md for the measured values):

1. **Build-time background grade** (`tools/build.py`): `GRADE = {color: 0.4, sepia: 0.25, contrast: 1.35, warm: (1.08, 1.0, 0.86)}`, then `ImageEnhance.Brightness` with 0.65–0.75 per background (`BACKGROUNDS[...][4]`), then 32-colour ordered dither. A build check (`gritty grade must lower saturation and brightness...`) fails the build unless saturation and brightness drop.
2. **Runtime film filter** (`src/film.js`): `FILM.desat` 77/256 (≈30% luma mix), `contrast` 1.3, `crush` 22, `warm` (1.10, 1.0, 0.80), `lift` (10, 4, 0), `vignette` 0.6, grain ±14, flicker ±7%. Precomputed per-channel lookup tables (8 flicker levels) plus a per-pixel luma mix, grain and vignette multiply.
3. **Palettes** (`src/level.js` `THEMES`, interior tiles; `src/props.js`; `src/screens.js`): mid-to-dark browns (creek earth `#5a3e24`, hall wall `#5c3226`), and the title/end screens draw dark overlays (`rgba(0,0,0,0.5–0.6)`) and a 35%-alpha portrait.

Baseline (current build, filter on, `tools/screenshot.py` scenes): title luma 46.5 / chroma 0.125; L1 39.3 / 0.183; L2 32.8 / 0.183; L3 clubhouse 42.3 / 0.222; L3 hall 30.9 / 0.114; boss 61.6 / 0.218. Targets from the spec: luma ≥ 70, chroma ≥ 0.25, ≤ 3% clipped white.

## Goals / Non-Goals

**Goals:**
- A "lurid 70s exploitation print" look: saturated warm reds/oranges/greens, creamy highlights, slightly teal-lifted shadows, visible grain and print damage.
- Every benchmark scene meets the spec thresholds; the result is verified by tests, not only by eye.
- Keep the performance budget (< 8 ms per frame) and the existing filter structure (lookup tables, one pass).

**Non-Goals:**
- No new sprites, tiles, props or layout changes; only colour values and grade parameters.
- No change to the gore colours, HUD layout or fonts.
- No colour-grading options in the game (G stays a plain on/off toggle).

## Decisions

### 1. Fix the darkness at all three layers, not only in the film filter
Brightening only the film filter would lift muddy, sepia backgrounds into flat grey-orange and blow out the already-bright sprites. Instead: grade the backgrounds to be colourful at build time, make the film filter roughly brightness-neutral, and lift the tile palettes.
*Alternative:* a global brightness/saturation boost in `Film.apply`. Rejected for the reason above and because it would push sprite highlights into clipping (the 3% white limit).

### 2. Background grade: "colour print" instead of "sepia"
New `GRADE` roughly: `color` 1.35 (saturation up), `sepia` 0.0–0.05, `contrast` 1.1, `warm` (1.06, 1.0, 0.92), brightness per background 0.95–1.05. Optionally a mild S-curve so skies do not clip. The build check is inverted to match the spec: saturation up, brightness ≥ 90% of the source, warm shift (mean R − B grows). The 32-colour ordered dither stays (retro look, file size).
*Alternative:* keep the sepia blend at a lower amount. Rejected: any sepia blend pulls greens and blues toward brown, which is the main "muddy" impression on the courts and creek.

### 3. Film filter: split-tone print grade
`FILM` changes roughly: `desat` → 0 and a small saturation boost (mix away from luma, e.g. −40/256, done in the same per-pixel expression with clamping), `contrast` 1.3 → 1.1, `crush` 22 → 4, `lift` → slightly teal in shadows (e.g. (0, 6, 10)) with warm highlights through `warm` (1.06, 1.0, 0.90), `vignette` 0.6 → 0.3, grain ±14 → ±10, flicker and scratches unchanged. The lookup-table approach stays, so the cost per pixel does not change. Values are tuned against the benchmark scenes with the new tests.
*Alternative:* add a separate saturation pass. Rejected: a second per-pixel loop risks the 8 ms budget for no gain.

### 4. Palettes: lift values, keep the grime
Raise lightness of the theme `solid/solid2/top/plat` colours by about 25–40% and increase saturation (e.g. creek earth `#5a3e24` → a warm ochre-brown around `#8a5a2e`, grass top brighter green, hall walls a brick red). Grime overlays (`rgba(0,0,0,0.35)` cracks/stains) stay so tiles remain worn. Interior wallpaper/panelling get the same lift. Toxic creek water stays red (spec), just more vivid.

### 5. Title and end cards
Reduce the dark overlays on the title/end screens (e.g. `0.5–0.6` → `0.25–0.3`), keep the distressed logo, and let the re-graded title photo show through. The portrait keeps its 96×96 photo (spec).

### 6. Benchmark scenes and tests
Add a `benchmark scenes` test in `src/test.js` that renders six fixed scenes (title; L1 at the screenshot position; L2 on the creek bank rather than inside the earth; L3 clubhouse; L3 hall; boss arena) with the filter on, averages over a few frames to smooth grain/flicker, and checks luma ≥ 70, chroma ≥ 0.25, clipped-white ≤ 3%. Add the uniform-colour chroma test and the light-vignette test (corners ≥ 70% of centre, still darker). The existing "corners darker than centre" check (`corner < centre * 0.8`) is loosened to `corner < centre` together with the new ≥ 70% bound. The same scene list is used with `tools/screenshot.py` for the before/after comparison image.

## Risks / Trade-offs

- [Too bright loses the trashy mood] → keep grain, scratches, dust, gate weave and flicker at nearly current strength; target the lower half of the allowed range (luma 70–110) rather than maximum brightness; compare before/after screenshots side by side.
- [Sprites and pickups clip or lose contrast on brighter backgrounds] → sprites already have dark 1-px outlines (spec); check the clipped-white limit and eyeball pickups on each benchmark scene.
- [Promo video bitrate: brighter, more colourful frames with grain compress worse] → the recorder already lowers grain; check the next promo video still fits 16 MB, otherwise lower the recorder's grain further.
- [Re-graded backgrounds change the embedded file size] → the build fails above 2 MB; the dither palette size (32 colours) is unchanged, so size should stay similar.
