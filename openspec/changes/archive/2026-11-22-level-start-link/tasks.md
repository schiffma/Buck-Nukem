# Tasks

## 1. Start level from the URL

- [x] 1.1 In `src/main.js`, add `startLevelFromHash(hash)`. It uses an anchored `level=N` regex with N in 1..`LEVEL_DATA.length` and returns a 0-based index, or 0 when the parameter is missing or invalid. Also add `Game.startHash` (null), and make `newGame()` load `startLevelFromHash(Game.startHash ?? location.hash)`, written as an explicit null check. Tests in `src/test.js` for the parser:
  - `#level=1`→0, `#level=4`→3, `#debug&level=3`→2, `#level=2&debug`→1
  - `#level=0`, `#level=5`, `#level=x`, `#xlevel=3`, `#level=3x`, `""` and `#test` all →0
- [x] 1.2 Add game-flow tests using `Game.startHash`:
  - `#level=4` + Enter on the title → the intro shows MISSING REEL then FINAL REEL, and the boss arena starts with score 0, full health, 3 lives and the disc cutter.
  - `#level=2` → REEL 2 starts with the blaster.
  - Game over, then back to the title, then Enter → level 3 again (`#level=3`).
  - Completing level 2 leads to level 3.
  - Without a hash, level 1 starts.

  Reset `Game.startHash` to null at the end. Verify: `python tools/run_tests.py` passes everything.

## 2. Title note

- [x] 2.1 In `src/screens.js`, draw "STARTS AT REEL N" or "STARTS AT FINAL REEL" at (6, 230), left-aligned, small beige with a shadow, only when the start index is > 0. Tests:
  - `#level=3` shows "STARTS AT REEL 3" and `#level=4` shows "STARTS AT FINAL REEL"; no note without a level, with `level=1` or with invalid values.
  - The note sits inside the screen and doesn't overlap the version text, "PRESS ENTER", the badge or the bottom lines.

  Check by eye with `python tools/screenshot.py` (add a `title` screenshot variant that takes a level, e.g. `#shot=title&level=4`, if the shot mode needs it).

## 3. Docs and build

- [x] 3.1 Add a short "Direct level links" note to `README.md`, with `buck_nukem.html#level=1..4` and the GitHub Pages form `https://schiffma.github.io/Buck-Nukem/dist/buck_nukem.html#level=4`. Rebuild `dist/buck_nukem.html`. Verify: the build succeeds, `python tools/run_tests.py` passes, and opening `dist/buck_nukem.html#level=4` locally shows the note and starts the boss arena on Enter.

## Workflow follow-up

- Archive after review.
- Ship with the next release (tag, build, push incl. `gh-pages`).
