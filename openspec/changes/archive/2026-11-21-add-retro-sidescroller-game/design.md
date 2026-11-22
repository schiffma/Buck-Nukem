# Design

## Context

The project contains only `assets/img/` (six JPEGs, 640×480 up to 1920×1343, ~2.5 MB total) and no code, no git, no Node.js. Python 3.11 with Pillow is available. The deliverable must be one HTML file at 320×240 (see proposal.md and `specs/game/distribution`). Images:

| File | Content | Planned use |
|---|---|---|
| `buck_nukem.jpg` | Hero photo (sunglasses, long hair, moustache, navy jacket, white shirt) | Head sprite source + title portrait |
| `tc_wollerau.jpg`, `tc_wollerau_02.jpg` | Aerial views of clay courts, hall, lake | Level 1 background, title/victory screen |
| `krebsbach_02.jpg` | Creek, meadow, mountains | Level 2 + boss arena background |
| `krebsbach_05.jpg`, `krebsbach_06.jpg` | Top-down/aerial courts and fields | Level 3 background, level-complete screen |

## Goals / Non-Goals

**Goals:**
- Plain JavaScript, no runtime libraries, readable source split into modules during development.
- Assets preprocessed at build time to small, palette-reduced PNGs so the output stays well under 2 MB.
- Level data that is easy to edit by hand.

**Non-Goals:**
- Gamepad/touch input, save games, high-score persistence, level editor, localisation.
- Mobile performance tuning.
- Pixel-perfect likeness: the hero head is a stylised 12–14 px wide caricature.

## Decisions

**1. Source layout and build: `src/*.js` concatenated by `tools/build.py`.**
Files: `main.js` (loop, states), `input.js`, `render.js`, `level.js` + `levels/*.js` (ASCII tile maps), `player.js`, `enemies.js`, `boss.js`, `fx.js` (particles, screen shake), `audio.js` (synth + score), `hud.js`, `font.js`. The build script processes the images, writes them into an `ASSETS` object of base64 PNG data URIs, concatenates the JS in a fixed order inside one IIFE, and fills `src/index.template.html`.
*Alternative:* ES modules with a bundler. Rejected because Node isn't installed and bundling isn't needed for about 3k lines. Plain concatenation with one shared namespace also stays debuggable: `tools/build.py --dev` writes the same file with unminified code.

**2. Image processing with Pillow at build time.**
- Backgrounds: crop to the relevant area, resize to 480×240 (wider than the screen to allow parallax), quantise to 32 colours with ordered dithering for a VGA-era look, export PNG (~30–60 KB each).
- Hero head: crop the face box from `buck_nukem.jpg` by fixed coordinates (approximately x 430–760, y 200–560), resize to 14×14, quantise to 12 colours, cut out the background with a hand-made mask set in the script (hair and face kept), then emit the result. Body poses are drawn in code as pixel arrays (palette: navy jacket, white shirt, blue jeans, boots), with the head drawn on top each frame.
- Title portrait: same crop at 96×96, 16 colours.
*Alternative:* Hand-pixel the whole hero. Rejected because the request explicitly wants the hero from the photo. Using the full photo as a sprite was also rejected, because it doesn't read at 32 px.

**3. Enemies, tiles and pickups as procedural pixel art.**
Sprites are defined as small strings of palette indices in `sprites.js` and rendered once into offscreen canvases (and mirrored copies) at startup. This keeps the size tiny and the look consistent. Lawyer: suit, tie, briefcase. Crayfish: red-brown with claws and antennae. Gardener robot: green boxy body, straw hat, hedge-trimmer arm. Boss: about 96×64, assembled from parts (shell, two claws, eye stalks, tail) so claws can animate independently.

**4. Fixed-timestep loop at 60 Hz.**
`requestAnimationFrame` with an accumulator that runs `update(1/60)` 0–N times per frame, then renders. This meets the refresh-rate independence requirement and keeps physics deterministic.

**5. Tile world.**
16×16 tiles; levels are ASCII maps (for example `#` solid, `=` platform (one-way), `H` ladder, `~` water/kill, `D`/`d` door/key by colour letter, `C` checkpoint, `E` exit, enemy and pickup letters). Levels are about 150–250 tiles wide and 15–40 tall, so they scroll vertically too. AABB-vs-tile collision is resolved one axis at a time. The camera follows the hero with a dead zone and is clamped to the level bounds. The boss arena is a fixed 20×15 room.

**6. Audio: Web Audio API synth sequencer.**
`audio.js` holds the "Ride of the Valkyries" main theme (the famous dotted 9/8 motif, B minor → D major statement, about 16 bars) transcribed as note/duration arrays for 3 voices: square lead, triangle bass, noise percussion. A look-ahead scheduler (25 ms timer, 100 ms horizon) schedules oscillator notes. Tempo multiplier: 1.0 in levels, 1.25 in the boss arena. Sound effects are short parameterised oscillator/noise envelopes. `AudioContext` is created/resumed on the first keydown. The composition is in the public domain; no recordings are used.
*Alternative:* Embed an MP3/OGG. Rejected because of file size (several MB for a loop), recording copyright, and the chiptune fitting the retro style better.

**7. Rendering.**
A 320×240 back-buffer canvas with `imageSmoothingEnabled = false`. The visible canvas is CSS-sized to an integer scale with `image-rendering: pixelated`, recomputed on resize. The HUD sits in a 16 px bar at the top. The pixel font is a built-in 5×7 bitmap glyph table.

**8. Game state machine.**
`TITLE → LEVEL_INTRO → PLAY ⇄ PAUSE → LEVEL_COMPLETE → … → BOSS → VICTORY`, with `GAME_OVER` reachable from PLAY/BOSS. Each state has `update/render`.

## Risks / Trade-offs

- [The face crop at 14 px may not look like the person] → Hard-code crop coordinates in the build script and tune them by previewing `dist/debug_head.png`. The title portrait gives the recognisable likeness.
- [Large JPEGs make the build slow or the output big] → Resize before quantising; the build fails above 2 MB and prints sizes for each asset.
- [Audio autoplay restrictions] → Start/resume on the first keydown and show "PRESS ANY KEY" first.
- [Hand-written melody accuracy] → Keep to the main motif. Test by ear.
- [Gameplay balance] → Central `CONFIG` object (speeds, HP, damage, fire rates) for tuning.
- [Real people/places] → The hero photo and club photos are the user's own material. Enemies are generic caricatures (lawyers, robots) and represent no real persons.

## Migration Plan

New project, nothing to migrate. Rollback = delete `src/`, `tools/`, `dist/`.

## Open Questions

- Exact level layouts and enemy placement are to be tuned during play-testing (doesn't change specs or tasks).
