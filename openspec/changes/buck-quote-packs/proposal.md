# Proposal

## Why

Buck's dry one-liners exist only on the mofa ride, as one fixed list in the code, and only for car kills. The user wants them modular: every level can give Buck its own quotes, written in plain files, without touching the code.

## What Changes

- **Quote packs:** Buck's quotes live in plain text files `src/quotes/<pack>.txt`, one quote per line, grouped in sections per event. A level names its pack in its header (`quotes: ride`); a level without a pack keeps Buck silent.
- **Events:** `[start]` (a line shortly after the level begins, once per level start), `[kill]` (after Buck finishes off an enemy) and `[kill:<enemy type>]` (for one enemy type, e.g. `[kill:suv]`, used instead of `[kill]` for that type). Each section is optional.
- **Same rules everywhere:** kill quotes at most every 3 seconds; bubbles above Buck (on foot or on the mofa) that never overlap other speech bubbles; quotes at most 20 characters and drawable with the game font (including Ä, Ö, Ü).
- **The build checks the packs:** an unknown pack name in a level header, an unknown section or enemy type, a too-long line or a character the font cannot draw fail the build with the file and line.
- **Content now:** the ride's current Swiss German lines move into `src/quotes/ride.txt` (`[kill]`); the other levels get no pack yet (silent), ready to be filled. The limo finale's "YOU HAVE NO CLUE" stays part of the finale.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `game/presentation`: new requirement "Buck's quote packs" (files, events, per-level packs, the rules for showing quotes, build checks).
- `game/ride`: "Buck's one-liners on the ride" now draws its lines from the ride's quote pack.

## Impact

- `src/quotes/*.txt` (new; `ride.txt` with the current lines), `src/levels/1_road.txt` (`quotes: ride`).
- `tools/build.py`: parses the packs, embeds them (`QUOTE_PACKS`), checks them; `tools/test_build.py`: parser and check tests.
- `src/index.template.html`: the `QUOTE_PACKS` placeholder.
- `src/enemies.js` / `src/cars.js`: a `Quotes` module (pick a line per event and enemy type, cooldown, bubble placement on foot and on the mofa) replacing `Talk.buckKill` and `BUCK_LINES`; the kill hook moves from the cars' death to the general enemy death.
- `src/main.js`: the start event after a level's intro.
- `src/test.js`: tests for packs, events, per-type sections, silence without a pack, bubble placement on foot.
- `README.md`: how to write a quote pack.
