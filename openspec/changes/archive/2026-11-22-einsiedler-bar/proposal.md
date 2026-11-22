# Proposal

## Why

The clubhouse "BIER" bar is a plain counter with one small three-handle tap tile, a bottle shelf and two empty stools. It reads more like a placeholder than a lived-in Swiss clubhouse bar. Local Einsiedler beer on tap, regulars at the counter and a waitress pulling pints would make the bar the warm, funny set piece of level 3, in the same spirit as the cheering fans.

## What Changes

- **Einsiedler taps:** the counter-with-taps tile becomes a chrome tap tower with 3 tall tap handles in Einsiedler colours (red and white, with a tiny shield), a drip tray, and a small foam drip animation.
- **Back-bar sign:** a new back-bar sign reading "EINSIEDLER" (prop `I`, 4 × 1 tiles) sits above the bottle shelf, next to the neon BIER sign.
- **Counter details:** the counter tiles get glasses and beer mats (Bierdeckel), varying per tile.
- **Three bar guys:** they sit on stools at the counter (map character `O`), each with a different look: mustache, cap, bald head, and a TC Wollerau tennis shirt or a work jacket. They idle with a beer, lift their glass now and then, and occasionally clink glasses with a "PROST!" speech bubble. That happens at most once per 6 s per bar, and the bubble shows for about 1.5 s. They are pure decoration, like the fans: nothing collides with them and they can't be shot.
- **The waitress:** a blonde waitress (map character `W`) stands behind the counter. The counter hides her below the waist. She walks back and forth between the taps, stops to pull a beer (a foam animation in the glass) and sets it down for a guy. She is decoration only, with no gameplay effect.
- **Layout:** the level-3 bar is rearranged around these: the counter, 3 `O` in front of it, the `W` behind it and the sign above the shelf. The two empty stools `i` become the guys' stools. Bar access, the lawyer and every route stay as they are; the level checker confirms this.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `game/presentation`: the requirement "Clubhouse bar" gets Einsiedler taps, the sign, counter details, three bar guys with "PROST!" and the waitress.

## Impact

- `src/level.js`: the new counter-with-taps tile, and counter tile variants with glasses and beer mats.
- `src/props.js`: the `I` Einsiedler sign prop.
- `tools/build.py`: `PROP_SIZES["I"] = (4, 1)`.
- `src/sprites.js`: bar-guy sprites (3 looks × idle/drink frames) and waitress sprites (walk, pour), all outlined.
- A new `src/bar.js`, added to `JS_ORDER` after `fans.js`: the bar scene with spawning from `O`/`W`, the idle and drink animation, waitress patrol and pouring, "PROST!" bubbles through the shared `drawSpeechBubble`, and drawing (the waitress before the counter tiles, the guys after them).
- `src/main.js`: map characters `O` and `W` as entities, plus the update and draw hooks.
- `src/levels/3_clubhouse.txt`: the bar rearrangement.
- `src/test.js`: tests for the looks, decoration-only behaviour, the PROST rate, the waitress staying behind the counter, and the sprite outlines.
- `README.md`: the map legend (`O`, `W`, `I`) and the clubhouse description.
