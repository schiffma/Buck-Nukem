# Proposal

## Why

Buck fights alone through empty courts, creek banks and club rooms. A few female tennis players from TC Wollerau cheering him on from the background would give the levels life, sell the "local hero" joke of the grindhouse setting, and reward the player when Buck kills an enemy, grabs a trophy or reaches a checkpoint.

## What Changes

- Add cheering female tennis players as background characters in all four levels: 3–5 in each regular level (courtside, creek bank, clubhouse and indoor hall) and 2–3 in the boss arena, placed in the level maps with a new map character `F`.
- Each one looks different: hair style and colour, skin tone, outfit colour accents and accessory (racket, towel, headband, visor) vary; outfits are sporty 1970s tennis whites in the game's pixel-art style. Every in-level fan differs from the others in the same level.
- They idle with a looping cheer (bouncing, waving rackets or towels) and turn to face Buck.
- They react when Buck kills an enemy, picks up a trophy or reaches a checkpoint near them: every fan in range does a short jump-and-wave cheer and shows her own speech bubble with a different message ("GO BUCK!", "MY HERO!" ...).
- Each fan also calls out to Buck when he walks past her ("HI BUCK!", "YOU ROCK!" ...), at most once every 8 seconds per fan.
- A short synthesized cheer (crowd "woo" with a whistle) plays when they react, quieter than the music and rate-limited.
- They are pure background: no collisions with Buck, shots or enemies, no effect on gameplay, the level checker or the promo autopilot.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `game/presentation`: new requirement "Cheering tennis fans" (placement, variety, idle animation, facing Buck, reactions with speech bubble and cheer sound, no gameplay effect).

## Impact

- `src/levels/*.txt`: `F` placements in all four levels; `README.md` level-format table gets `F`.
- `src/level.js`: `F` added to the entity characters (spawned, tile cleared).
- New `src/fans.js` (or a section in `src/props.js`): fan sprites (procedural, per-variant palettes, idle/cheer/jump frames), state, reactions, drawing behind enemies; `tools/build.py` script list.
- `src/main.js`: spawn fans in `loadLevel`, update and draw them, call `Fans.react()` from kills, trophy pickups and checkpoints.
- `src/audio.js`: `"cheer"` sound effect.
- `src/test.js`: placement, variety, non-collision, facing, reaction, sound and performance tests.
- No new dependencies; small file-size increase.
