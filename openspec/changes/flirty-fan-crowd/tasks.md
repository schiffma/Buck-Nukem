# Tasks

## 1. Hand-over from cheering-tennis-fans

- [x] 1.1 In `openspec/changes/cheering-tennis-fans/tasks.md`, mark task 4.1 as superseded by `flirty-fan-crowd`: change its checkbox to a plain note line, so the change has no open tasks. Then archive `cheering-tennis-fans` with spec sync (`/openspec-archive-change cheering-tennis-fans`).
  - Verify that `openspec/specs/game/presentation/spec.md` contains "Requirement: Cheering tennis fans".
  - Verify that `openspec validate flirty-fan-crowd --strict` passes.

## 2. Looks, kiss frame and heart

- [x] 2.1 In `src/fans.js`, extend `FAN_VARIANTS` to at least 14 looks:
  - new hair styles `pigtails` and `curly`
  - new items `sunglasses` and `cap`
  - new accent colours `teal` and `yellow`

  Add a `kiss` frame (front hand at the mouth, head tilted) to `FAN_FRAMES`. Change the look assignment to `(levelIndex * 5 + i) % FAN_VARIANTS.length`.
  - Update the tests:
    - at least 14 distinct looks
    - all frames, including `kiss`, pass the outline check
    - idle and kiss frames differ
  - Add the kiss frame to the `fans` screenshot mode.
  - Verify with `python tools/build.py`, `python tools/run_tests.py` and `python tools/screenshot.py <out>.png fans` (review all looks).
- [x] 2.2 Add a 5×7 heart glyph `♥` to `GLYPHS` in `src/font.js`, and a floating-heart particle (rises and fades over 0.8 s) in `src/fans.js` or `src/fx.js`.
  - Add tests: `FONT_CHARS` contains `♥` and it renders lit pixels; a heart particle is created and is gone after 1 s.
  - Verify with `python tools/run_tests.py`.

## 3. Every fan talks

- [x] 3.1 Replace the single global bubble with per-fan bubbles.
  - `react(x, y, kind)`: every fan within 12 tiles cheers (`cheerT = 1`). The nearest fans without a bubble get a line from the shuffled deck for `kind`, never a line already on screen. The bubble life is 1.5 s.
  - `cheer` plays at most once per 1.5 s.
  - `drawBubbles` lays out at most 3 bubbles, nearest to Buck first, moving a bubble up when it overlaps (at most twice), clamped below the HUD. Update the `main.js` draw call.
  - Update the old reaction, rate-limit and bubble tests. Add tests:
    - 3 fans in range → 3 different lines
    - 5 in range → at most 3 drawn
    - no two drawn bubble rectangles overlap
    - the bubble is gone after 1.5 s
    - a fan 20 tiles away stays calm
  - Verify with `python tools/run_tests.py`.
- [x] 3.2 Add shout-outs in `Fans.update`. When Buck is within 4 tiles horizontally and 2 vertically, isn't dead, the state is play or boss, and the fan's `shoutT <= 0`: show a shout-out line, play the kiss frame for 0.6 s, add a heart particle, set `shoutT = 8`, and play `whistle` (global limit 4 s).
  - Add the `whistle` sound (a rising-then-falling two-tone wolf whistle) to `src/audio.js` and to the sound-coverage test.
  - Add tests:
    - in range → shout-out, kiss frame and heart
    - out of range → none
    - 8 s cooldown per fan
    - the whistle plays at most once per 4 s with two fans in range
    - no shout-outs while Buck is dead
  - Verify with `python tools/run_tests.py`.
- [x] 3.3 Write the line pools `FAN_LINES = {shout, kill, trophy, checkpoint}` with at least 30 distinct cheeky, flirty, non-explicit lines (at least 12 shout-outs). Each line is at most 20 characters, uses only font glyphs, and may end in `♥`.
  - Add tests:
    - pool sizes and distinctness
    - length ≤ 20
    - every character in `FONT_CHARS`
    - no word from a small explicit-word blocklist
  - Verify with `python tools/run_tests.py`. Then take a `cheer` screenshot per level showing several bubbles and review it with the user.

## 4. The crowd in the levels

- [x] 4.1 Add `F` cells to all four maps: 8–10 per regular level and 4–5 in the boss arena.
  - Put them on floors and platforms by the courts, benches, creek banks, sports field, bar and restaurant, and arena platforms, some in groups of 2–3.
  - Keep them clear of ladder columns, doors and key pickups.
  - Update the "fans in the levels" test to the new counts (looks distinct, all on floor or platform) and the README (fans paragraph, `F` legend).
  - Verify with:
    - `python tools/build.py` (no floor warnings)
    - `python tools/run_tests.py`
    - `python tools/check_levels.py` (results unchanged)
    - a screenshot of each level with fans in view

## 5. Integration

- [x] 5.1 Full check:
  - `python tools/build.py` (under 2 MB)
  - `python tools/run_tests.py` and `--browser edge` (including the performance tests under 8 ms per frame)
  - `python tools/check_levels.py`
  - `python tools/promo/record_promo.py --dry all` (victory, play-quality limits still met)
  - `openspec validate flirty-fan-crowd --strict`

  Verify that all pass.
