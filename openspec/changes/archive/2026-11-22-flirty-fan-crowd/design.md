# Design

## Context

- **Fans today:** `src/fans.js` implements the fans of `cheering-tennis-fans`.
  - 8 looks (`FAN_VARIANTS`: hair style and colour, skin, accent, item) and 3 frames (idle, wave, jump), drawn into a 20×32 canvas and outlined with `makeSet`.
  - `Fans.spawn` turns `F` cells into fans; the look is `(levelIndex * 3 + i) % FAN_VARIANTS.length`.
  - `Fans.react(x, y, kind)` is called on kills (`enemies.js`), trophies and checkpoints (`main.js`). It makes fans within 12 tiles cheer and gives one global `Fans.bubble` to the nearest fan, with a 5-line pool and the `cheer` sound at most once per 1.5 s.
  - `Fans.drawBubble` draws one bubble above the hero layer.
- **Maps:** currently 4/4/5/2 `F` cells. A build warning fires for an `F` with no floor below. `tools/check_levels.py` ignores `F`.
- **Font (`src/font.js`):** 5×7 glyphs for A–Z, 0–9 and some punctuation (`! ? , ' : - * ( ) " / + = < > %`). There's no heart.
- **Performance:** the frame budget tests require under 8 ms per frame with the film filter.

## Goals / Non-Goals

**Goals:**
- Double the crowd with distinct looks per level.
- Every fan can talk, without a screen full of overlapping bubbles.
- Flirty lines that fit the grindhouse tone and the tiny font, and stay non-explicit.

**Non-Goals:**
- Fans interacting with gameplay (no buffs, no collisions, no blocking).
- Voice samples: sounds stay synthesized.
- Fans following Buck or walking around: they stay at their spots.

## Decisions

1. **Per-fan bubble state instead of one global bubble.**
   - Each fan gets `bubble: {text, t}` and `shoutT` (cooldown).
   - `react()`: every fan within 12 tiles gets `cheerT = 1`. The candidates are sorted by distance; the nearest ones without a bubble get lines from the occasion's pool.
   - A render-time limiter shows at most 3 bubbles (nearest to Buck first).
   - Lines are drawn from a per-occasion shuffled deck (seeded by `Math.random`, so the promo's seeded runs stay reproducible). A line is skipped if it's already on screen.
   - *Alternative:* keep one global bubble and rotate it. Rejected: the user wants every fan to talk.

2. **Shout-outs on proximity.**
   - In `Fans.update`, a fan with Buck within 4 tiles (horizontal distance, vertical within 2 tiles) and `shoutT <= 0` gets a shout-out: a bubble, the "kiss" frame for 0.6 s, a heart particle and `shoutT = 8 s`.
   - The `whistle` sound has its own 4 s global limit; `cheer` keeps 1.5 s.
   - Shout-outs don't fire while Buck is dead or during level intros.

3. **Bubble layout without overlaps.**
   - Bubbles are laid out at draw time, nearest fans first. A bubble that would overlap one already placed is moved up by its height plus 2 px, at most twice. If it still overlaps, it is skipped for that frame (its timer keeps running).
   - Bubbles are clamped to the screen below the HUD.
   - Bubble life is 1.5 s (was 1.2 s), so a line can be read.

4. **Line pools (`FAN_LINES = {shout, kill, trophy, checkpoint}`).**
   - At least 30 lines in total, each at most 20 characters (bubble width ≤ 125 px), in the existing font plus a heart glyph.
   - Tone: cheeky innuendo in 70s-grindhouse style, for example:
     - shout: "HEY HANDSOME!", "NICE RACKET, BUCK!", "CALL ME, BIG GUY!", "HOT STUFF! ♥", "YOU MAKE ME SWEAT!"
     - kill: "OOH, DANGEROUS!", "MY HERO! ♥", "DO THAT AGAIN!"
     - trophy: "WHAT A TROPHY! ♥", "BIG CUP, BIG MAN!"
     - checkpoint: "SAVE ME TOO, BUCK!"
   - No explicit sexual words, no nudity references. A unit test checks the length and the glyph set, and scans the pools against a small blocklist of explicit words.

5. **Looks: 14+ variants.**
   - New hair styles `pigtails` and `curly`, new items `sunglasses` and `cap`, and accent colours `teal` and `yellow`.
   - The assignment stays deterministic: `(levelIndex * 5 + i) % FAN_VARIANTS.length`. With at most 10 fans per level and at least 14 looks, all looks in a level are distinct.
   - The new `kiss` frame: the front hand at the mouth and the head tilted. It is built like the other frames and outlined by `makeSet`.

6. **Heart glyph.**
   - A 5×7 heart is added to `GLYPHS` under the key `♥`, so lines can use `♥` directly.
   - `drawText` already iterates characters, and `FONT_CHARS` picks the glyph up automatically.
   - Floating hearts are `FX` particles (a small 5×4 red heart drawn from the glyph, rising and fading over 0.8 s).

7. **Placement.**
   - New `F` cells on existing floors and platforms where the backdrop is open: court sides, benches, umpire chairs, creek banks, sports field, bar and restaurant, and arena platforms. Some fans stand in pairs or threes.
   - They are kept away from ladder columns, door cells and key pickups so sprites don't hide gameplay. The build's floor warning and a test check every fan stands on something.

## Risks / Trade-offs

- [Screen clutter from 10 fans and many bubbles] → The cap of 3 bubbles, overlap avoidance and the 8 s per-fan cooldown. Fans are drawn behind enemies and Buck.
- [Lines feel repetitive] → Shuffled decks per occasion with at least 30 lines, and no repeats on screen.
- [Tone overshoots] → The non-explicit rule is in the spec, plus a blocklist test. The user reviews the line list in a screenshot and the README note.
- [Performance with more sprites] → The fans are prebuilt canvases (`drawImage` only), with off-screen culling as now. The existing performance tests must pass.
- [Spec dependency on an unarchived change] → Task 1 archives `cheering-tennis-fans` first (its task 4.1 marked as superseded), so the requirement exists in the main spec before this change modifies it.

## Migration Plan

Archive `cheering-tennis-fans` first, then implement. Rebuild, run the tests in Chrome and Edge, run the level check, and do a promo dry run. Rollback is reverting the commit.

## Open Questions

- The exact wording of the final line list can be tuned after a review screenshot, within the spec's limits.
