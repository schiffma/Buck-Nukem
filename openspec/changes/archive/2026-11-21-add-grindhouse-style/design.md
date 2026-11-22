# Design

## Context

The game from `add-retro-sidescroller-game` is built and tested (95 in-game tests, see `src/test.js`). Relevant current state:

- `src/input.js`: `KEYMAP` maps ControlLeft/ControlRight to `jump`, and X/Alt to `fire`.
- `src/render.js`: scenes are drawn into a 320×240 `buffer` canvas. `present()` scales it onto the screen canvas. Tests read pixels from `buffer` (for example the HUD health-bar check).
- `src/sprites.js`: sprites are palette-character rows turned into canvases. `makeSet()` builds mirrored and white-flash variants. There are no outlines and only flat or 2-tone colours.
- `src/level.js`: `buildTileset()` draws one procedural canvas per tile type and theme, so every tile of a type looks identical.
- `src/fx.js`: generic particles, explosion rings and screen shake. Enemies die with `FX.explode()`.
- `src/screens.js`: plain title, intro, complete, game-over and victory screens. `LEVEL_INTRO` lasts 2 s.
- `tools/build.py`: backgrounds get colour ×1.25, contrast ×1.1 and brightness 0.62–0.8, then a 32-colour ordered dither. The hero head gets a feature overlay (`FACE_FEATURES`).
- Performance: update+render is about 0.5 ms per frame in headless Chrome and Edge.

## Goals / Non-Goals

**Goals:**
- A strong, consistent grindhouse look across all screens, mostly from cheap, generic passes (film filter, auto-outline, auto-shading, worn tile variants) plus targeted hand-drawn details.
- Stay inside the frame budget: update + render + film pass under 8 ms in headless Chrome.
- Keep existing tests meaningful. Scene pixels stay readable from `buffer`, before the film pass.

**Non-Goals:**
- WebGL shaders, a gore toggle, new enemy behaviour, new levels, or music changes.
- Realistic gore or dismemberment.
- Changes to the HUD layout (it only picks up the film filter).

## Decisions

**1. Ctrl → fire.** Map ControlLeft/ControlRight to `fire` in `KEYMAP`; `jump` keeps Space only. Ctrl+key browser shortcuts are not an issue because `preventDefault` already runs for mapped keys. Update the title controls list and the README.

**2. Film pass on a separate canvas.**
- `render.js` gains a `filmCanvas` (320×240).
- Each frame: the scene is drawn to `buffer` as now. `Film.apply()` reads `buffer` with `getImageData` and writes graded pixels into one reused `ImageData`, then `putImageData`s them to `filmCanvas`. It then draws scratches and dust as `fillRect`s on `filmCanvas`.
- `present()` draws `filmCanvas` (or `buffer` when the filter is off) with a 0–1 px jitter offset × display scale, over black.
- The per-pixel loop uses precomputed tables:
  - Luma-based desaturation: mix 70% colour with 30% luma.
  - Per-channel tone curves (`Uint8Array(256)` × 3) for the warm grade (lifted reds, slightly crushed blues), an S-curve contrast and crushed blacks. Flicker multiplies one shared brightness factor into the tables only when it changes (8 precomputed flicker levels, so no per-frame table rebuild).
  - Vignette: a `Uint16Array(76800)` of multipliers (×256).
  - Grain: 4 precomputed `Int8Array(76800)` noise frames (±12), picked at random each frame with a random row offset.

  That is about 10 integer ops per pixel, an estimated 1–2 ms.
- Scratches: 0–2 vertical 1-px lines (light or dark, 30–60% alpha) that persist for a few frames at random x.
- Dust: 0–6 specks of 1–3 px per frame.

*Alternative:* `ctx.filter = "sepia() contrast()"`. Rejected: it isn't supported in Safari, gives no grain or vignette control, and its output differs between browsers. *Alternative:* WebGL. Rejected as too heavy for this change.

**3. Toggle G.** `KeyG` maps to `film`. `Film.enabled` starts `true`. While it is off, `present()` draws `buffer` directly. Tests switch it off where they compare raw pixels on screen.

**4. Auto-outline and auto-shading in `sprites.js`.**
- `makeSet(c, {outline: true})` pads the canvas by 1 px on each side. Then:
  - Shading: pixels whose upper-left neighbour is transparent are lightened about 25% (highlight). Pixels whose lower or right neighbour is transparent are darkened about 30% (shadow). Together with the base colour this gives 3 tones.
  - Outline: transparent pixels that touch an opaque pixel (4-neighbourhood) are painted `#0a0608`.
- Sets record `pad = 1`. All draw sites subtract `pad` (hero: `ox`/`py`; enemies: centring and bottom alignment) so hitboxes and anchors stay unchanged. White-flash silhouettes are built from the outlined canvas.
- Hand edits:
  - Hero: bigger gun (barrel extended by 3 px), boot cuffs, belt buckle.
  - Lawyer: sunken eye shadows and a sharp grin (white teeth row).
  - Crayfish: slime highlight pixels.
  - Robot: rust pixels and a red-stained blade.
- Head (`build.py`): extend `FACE_FEATURES` with stubble dots on the chin and jaw and a 3-px cigar from the mouth corner with an ember pixel. In game, the cigar emits a slow grey smoke particle every ~0.6 s while idle.

**5. Worn tile variants.** `buildTileset()` produces 3 variants for `solid`, `solidTop`, `alt` and `plat`:
- variant 0: clean base
- variant 1: cracks (dark 1-px jagged lines)
- variant 2: grime or stains (dark translucent blotches; rust on hall metal)

Variants are chosen by a hash of (tx, ty), so the choice is stable per tile. Base colours are toned down and darkened slightly so the film grade doesn't oversaturate them.

**6. Gore in `fx.js`.**
- `FX.blood(x, y, dir, n, palette)` emits drops with gravity.
- `FX.gibs(x, y, palette)` emits 4–6 chunk particles (2–3 px) that bounce once and settle.
- Each particle can be `stains: true`. In `FX.update`, such a particle that enters a solid tile (`Game.level.isSolid`) is removed and adds a stain: a 1–3 px blotch stored as `{x, y, w, h, color, t}`.
- Stains: at most 64 (oldest dropped), fading out over their last 3 s of a 20 s life, drawn right after the main tile layer.
- Palettes:
  - Blood: `#8a0a0a`, `#c81818`, `#ff3a2a`
  - Oil/sparks for robots: `#141414`, `#3a3a3a`, `#ffd040`
  - Boss: red blood plus a big gib shower at death
- `damageEnemy()` calls a per-type `T.gore` (lawyer and cray: blood; robot: oil). On a surviving hit, 3–5 drops spray along the shot direction.

**7. Damage flash.** `Player.hurt()` sets `Game.hurtFlash = 0.25`. `renderWorld()` draws a pre-rendered red radial vignette canvas at `alpha = hurtFlash / 0.25 × 0.6`. This is drawn into `buffer` before the film pass, so the film grade applies to it too.

**8. Grindhouse screens.**
- *Poster title*:
  - Black/brown halftone background over the darkened title photo, plus a torn-paper border.
  - "BUCK NUKEM" at scale 4 with a 1-px black outline (text drawn at 8 offsets) and a yellow→red split. A static distress mask (random 1–2 px holes, punched with `destination-out` on a pre-rendered logo canvas) makes the lettering look worn.
  - Tagline: "HE CAME FOR THE TENNIS. HE STAYED FOR THE CARNAGE."
  - Rating badge: a box reading "RATED W - WOLLERAU".
  - The portrait keeps its frame; the controls list is updated.
- *Reel cards*: `LEVEL_INTRO` becomes phases:
  - `missing` (boss only): 1.5 s "MISSING REEL" / "WE REGRET THIS PORTION OF THE FILM IS MISSING"
  - `leader`: 3 × 0.4 s countdown, with a circle, a sweep line and big digits
  - `card`: 1.4 s "REEL n" plus level name ("FINAL REEL" for the boss)

  Enter or Space skips straight to play.
- *THE END cards*: game over shows "THE END" + "...OF BUCK NUKEM?" and the score. Victory shows "THE END" over the poster background, with the portrait, victory text and score.

**9. Background grade (`build.py`).** Apply the grade before dithering:
1. Colour ×0.55 (desaturate).
2. Blend 25% toward a sepia mapping of the luminance.
3. Contrast ×1.35.
4. Brightness ×0.55–0.65.

The build prints mean saturation, brightness and the red−blue difference against the source crop, and fails if the grade did not lower saturation and brightness or shift toward warm. This is the check for the "gritty grade" scenario.

## Risks / Trade-offs

- [The film pass costs more than estimated on slow machines] → Measure it in the performance test (< 8 ms with the filter on). G turns it off. Tables are precomputed and nothing is allocated per frame.
- [Outline padding breaks anchors or hitboxes] → Hitboxes don't depend on sprite size. Tests already check movement and collisions, and screenshots will confirm alignment.
- [Too dark or unreadable after both the build grade and the runtime grade] → Tune with `tools/screenshot.py`. HUD text keeps high-contrast colours. Brightness constants live in one `FILM` config block.
- [Gore taste] → Kept at cartoon level: no dismemberment, short-lived stains. The proposal records this as an assumption to confirm.
- [Tests reading screen pixels] → They keep reading `buffer` (pre-film). New film tests read `filmCanvas`.
- [Archive order] → This change modifies requirements from `add-retro-sidescroller-game`, which must be archived first.

## Migration Plan

This is a visual and control update with no saved data. Rebuild `dist/buck_nukem.html`. To roll back, revert the source files and rebuild.

## Open Questions

- Exact grade, grain and scratch constants will be tuned from screenshots during implementation. This doesn't change specs or tasks.
