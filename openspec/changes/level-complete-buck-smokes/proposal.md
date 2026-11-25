# Proposal

## Why

The level-complete screen is only a bonus table over a backdrop, and Buck isn't on it. The user wants Buck there to celebrate: his photo portrait with a cigarette, saying a cocky Thurgau line about winning, like his kill lines.

## What Changes

- **Buck's portrait on the level-complete screen:** the framed pixel portrait (the same one as on the title and victory screens) sits at the lower left, with a lit cigarette between his lips, under the moustache. A thin wisp of smoke curls up from the ember. Every few seconds he takes a drag: the ember glows brighter, then he blows a cloud of smoke from his mouth.
- **A winning line:** once the bonus count finishes, Buck says one line in a speech bubble above the portrait, for example "GWUNNE, WIE IMMER." or "ZIIT FÜR EN MOST.". He gets a new line each time the screen shows.
- **The lines come from the quote packs:** a new `[complete]` section in `thurgau.txt` (courts, creek, clubhouse) and in `ride.txt` (the mofa ride), with about 14 Thurgau winning lines in the cocky agglo-macho tone. A level without `[complete]` lines shows the smoking portrait without a bubble.
- **Layout:** the bonus table, the score and the prompt move to the right to make room. The title and the level name stay centred at the top.
- The boss arena ends on the victory screen ("THE END"), not on level complete, so it is unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `game/presentation`: new requirement "Buck on the level-complete screen", covering the portrait, the cigarette and smoke, and the winning line from the pack's `[complete]` section.

## Impact

- `src/screens.js`: `levelComplete()` gets the new layout, the portrait, the cigarette and smoke, and the bubble.
- `src/main.js`: `completeLevel()` picks the line and resets the smoke.
- `src/enemies.js`: `Quotes.completeLine()`.
- `tools/build.py`: accept the `[complete]` section. `tools/test_build.py` gets a parser test for it.
- `src/quotes/thurgau.txt` and `src/quotes/ride.txt`: the `[complete]` lines.
- `src/test.js`: tests for the screen (portrait drawn, the line shown after the tally and taken from the pack, no bubble without lines, the layout fits).
- `README.md`: the screen and the new pack section.
- `dist/buck_nukem.html`: rebuilt.
