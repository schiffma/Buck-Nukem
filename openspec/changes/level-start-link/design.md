# Design

## Context

- `boot()` in `src/main.js` already reads flags from `location.hash` with substring checks: `debug`, `test`, and `shot=` with a regex.
- A game starts in `Game.newGame()`: it sets the score to 0, calls `Player.resetForGame()`, then `loadLevel(0)`.
- `loadLevel` handles everything level-specific: the boss arena's disc cutter and tempo, and the reel intro card. The intro phases already add "MISSING REEL" before the boss.
- The title layout leaves the bottom-left corner free. The version text sits bottom-right at (314, 230), right-aligned.

## Goals / Non-Goals

**Goals:**
- One small, testable parsing function, and a start level that holds for every new game.
- A visible hint on the title, so a shared link isn't confusing.

**Non-Goals:**
- No in-game level-select menu, no unlocks and no saved progress.
- No query-string (`?level=`) support.
- No change to scoring, so a run started at level 3 simply has a lower total.

## Decisions

1. **Parsing:** add `function startLevelFromHash(hash)`. It returns a 0-based index, or 0 for anything missing or invalid, using the regex `/(?:^#|[#&])level=(\d+)(?:&|$)/` and the range 1..`LEVEL_DATA.length`.
   - It takes the hash as an argument, so tests can call it directly.
   - The anchors `#`/`&` and `&`/end reject things like `xlevel=3` and `level=3x`. `#shot=` specs never contain `level=`.
   - The range comes from `LEVEL_DATA`, so a future fifth level works without code changes.
2. **When it is read:** `newGame()` calls `this.loadLevel(startLevelFromHash(location.hash))`. Reading the hash every time a game starts, instead of once in `boot()`, means editing the address bar takes effect on the next start, and game over and victory restart at the same level with no extra state.

   The test harness calls `newGame()` in places, but the tests run under `#test`, which has no `level=`, so their behaviour stays the same. The new tests call the parser directly, plus a `newGame` override hook (see Decision 4).
3. **Title note:** `Screens.title()` draws "STARTS AT REEL N" or "STARTS AT FINAL REEL" at (6, 230), left-aligned, in the same small beige as the version text. It is only drawn when the start index is > 0, using `LEVEL_DATA[i].boss` for the boss wording.

   Width check: "STARTS AT FINAL REEL" is 20 × 6 − 1 = 119 px wide, so it ends at x=125. "(ANY KEY STARTS THE MUSIC)" runs from about x 52 to 208 at y 218. The rows don't touch (218+7 < 229), and the version text starts at ≥ 177. A layout test checks for overlaps, as the version-text test does.
4. **Testability:** add a `Game.startHash` property, `null` by default. When set, `newGame()` uses it instead of `location.hash`. Tests set it to `"#level=4"` and so on, then reset it to `null`. Only tests set it, and it keeps the real path one line.

## Risks / Trade-offs

- **A substring flag elsewhere accidentally contains `level=`** → the anchored regex only matches `level=` as its own parameter.
- **A player shares a `#level=4` link without realising** → the title note makes the start visible before Enter is pressed.
- **The `#debug` check is a substring test, so `#level=4&debug` also enables debug** → that's the existing behaviour and is acceptable.
