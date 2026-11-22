# Proposal

## Why

To play the boss arena or the clubhouse, a player or tester has to work through every level before it. That's slow when practising a level, checking a change, or sending someone a link to the playable GitHub Pages copy. A URL that starts the game at any level makes each level one click away.

## What Changes

- The game reads `#level=N` from the URL, where N is 1 to 4. Numbering is 1-based like the reel cards: 1 courts, 2 creek, 3 clubhouse, 4 boss arena. An example link is `buck_nukem.html#level=4`. The parameter can be combined with the existing `#debug`, for example `#debug&level=3`.
- The title poster still comes first, so the "any key starts the music" step is kept. It shows a small "STARTS AT REEL N" note ("STARTS AT FINAL REEL" for the boss arena), and Enter starts a fresh game there: score 0, full health, 3 lives. Starting a later level works as if the earlier ones were skipped: the normal weapon, and the disc cutter in the arena.
- While the URL contains the parameter, every new game starts at that level, including after game over or victory. The game reads the parameter again each time a game starts, so editing the address bar takes effect on the next start.
- Invalid values are ignored and the game starts at level 1 as before: missing, 0, 5, non-numeric. `#test` and `#shot=` keep their behaviour.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `game/gameplay`: a new requirement, "Start level from the URL".
- `game/presentation`: the title screen shows the start reel when the link selects one.

## Impact

- `src/main.js`: parse the start level from `location.hash`; `newGame()` loads that level instead of 0.
- `src/screens.js`: the start-reel note on the title.
- `src/test.js`: tests for parsing, start, restart, invalid values and the title note.
- `README.md`: document the link, including the GitHub Pages form.
- No changes to the build, the level files or the promo tooling. The promo bridge has its own dev start.
