# Proposal

## Why

Buck says a line after a kill only on the mofa ride. On reels 2–5 he says nothing, because those levels have no quote pack. The user wants him to comment on his kills in every level, in Thurgau dialect, in the spirit of a cocky Swiss agglo macho in the style of Harry Hasler: swaggering, flirty and pleased with himself.

## What Changes

- **A new quote pack `thurgau`** (`src/quotes/thurgau.txt`) for the levels on foot: a general `[kill]` section and one section per enemy type on foot (`[kill:lawyer]`, `[kill:cray]`, `[kill:punk]`). Each section has at least 12 lines in Thurgau dialect, in the Hasler-style macho tone. Each type section mixes lines about that enemy (legal jokes, crayfish soup, lawn mowers) with general boasts.
- **Levels 2–5** (courts, creek, clubhouse, boss arena) name the pack in their header (`quotes: thurgau`). In the boss arena, the crayfish the boss summons get lines like any other crayfish.
- **The ride gets more lines:** about 12 Thurgau/Hasler lines about cars and the mofa are added to the `[kill]` section of `src/quotes/ride.txt`. The existing 14 lines and the `[finale]` section stay as they are.
- No code change: the quote-pack system (`buck-quote-packs`) already handles events, the 3 s cooldown, bubble placement and the build checks.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `game/presentation`: new requirement "Buck's Thurgau kill lines". Buck comments on kills in every level, and the lines on foot match the enemy type.

## Impact

- `src/quotes/thurgau.txt` (new), `src/quotes/ride.txt` (more `[kill]` lines).
- `src/levels/2_courts.txt`, `3_creek.txt`, `4_clubhouse.txt`, `5_boss.txt`: `quotes: thurgau` in the header.
- `src/test.js`: content checks for the new pack (levels name it, section sizes, line length and font glyphs) and a lawyer kill on the courts that draws a `[kill:lawyer]` line.
- `README.md`: Buck's lines on foot, and the ride's line description.
- `dist/buck_nukem.html`: rebuilt.
- Depends on the unarchived `buck-quote-packs` change, which is already implemented in the working tree.
