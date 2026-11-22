# Design

## Context

- **Level 3 bar today** (row 18, the stand row above the floor):
  - `aaAAaa` counter at columns 40–45; `A` is the counter with taps, a one-way platform drawn in the "main" tile layer
  - a trophy `t` at 46
  - stools `i` at 47 and 49
  - a lawyer `L` at 38
  - the bottle shelf `qqqqqq` (rows 14–15, columns 40–45), the neon `N` at (41,13) and the cash register `$` at (44,17)
- **Rendering order** in `renderWorld`:
  1. background
  2. "back" tiles and props
  3. objects
  4. "main" tiles (the counter)
  5. `Fans.draw`
  6. pickups
  7. enemies
  8. the player
  9. FX
  10. bubbles
- **Fans** (`src/fans.js`) are the model for decoration actors: spawned from `F` in `loadLevel`, updated in `updateWorld`, drawn after the main tiles, and they never collide. `drawSpeechBubble` is shared.
- **Free map characters:** `I`, `O`, `S` and `W` are unused in the map bodies.

## Goals / Non-Goals

**Goals:**
- A bar that reads well at 320 × 240: chunky taps, a legible sign and lively regulars.
- Zero gameplay impact: hitboxes, routes and the checker results stay the same.

**Non-Goals:**
- No beer pickups and no interaction with Buck (the waitress is decoration only, by choice).
- No bar in other levels.
- No new sounds beyond optional existing ones; the bar stays quiet, and the music carries the scene.

## Decisions

1. **The `Bar` module** (`src/bar.js`) mirrors `Fans`:
   - `Bar.spawn(level)` collects `O` (guys) and `W` (waitress) spawns, which `ENTITY_CH` turns into empty cells.
   - `Bar.update(dt)` and `Bar.drawBack(camX, camY)` draw the waitress *before* the main tiles, so the counter tile covers her lower body naturally.
   - `Bar.drawFront(camX, camY)` draws the guys after the main tiles, in front of the counter, beside the fans.
   - `Bar.drawBubble` draws "PROST!" through `drawSpeechBubble`.
2. **Bar guys:**
   - 3 looks, chosen by their order in the map:
     - guy 0: mustache, a red cap, a TC Wollerau white tennis shirt
     - guy 1: bald, a grey work jacket
     - guy 2: a brown mullet, a blue tennis shirt
   - Each frame is 16 × 24: a seated figure on a stool, facing the counter (right or left by which side of the counter's centre he sits).
   - Frames: `idle` (glass on his knee) and `drink` (glass raised to his mouth).
   - Each guy has his own timer and lifts the glass for 0.8 s every 3–6 s (seeded per guy).
   - **PROST:** a bar-wide timer (6 s minimum). With chance 0.25 at each check after that, two neighbouring guys switch to a `clink` pose (glass raised towards each other) for 0.6 s, and one shows "PROST!" for 1.5 s.
3. **Waitress:** 16 × 30 frames: blonde hair `z`/`Z` (straw-yellow palette), a white blouse, a dark apron. Frames are `walk1`, `walk2` and `pour` (the arm up at the tap with a glass filling).
   - She patrols between the counter's first and last column at 14 px/s, turning at the ends.
   - She stops at a tap column every 4–8 s for a 2 s pour. The foam animation is a small glass sprite whose fill level rises (3 frames).
   - Her y puts her feet on the counter row's floor, so the 16 px counter tile hides her from the waist down.
4. **Taps and counter:**
   - `ts.counterTaps` is redrawn as a 16 × 28 canvas: a chrome tower (light and dark grey with a highlight) about 12 px tall above the counter, 3 tap handles 6 px tall in red and white stripes with a 2 × 2 red shield, and a drip tray.
   - The plain `a` counter gets 3 variants by `tileVariant`: a glass of beer (amber with white foam) and a round beer mat, two mats, or empty.
   - The canvas is cached as before.
5. **Einsiedler sign:** prop `I` (4 × 1): a dark wood board with a gold frame and "EINSIEDLER" in the game font, cream on dark red. "EINSIEDLER" is 10 × 6 − 1 = 59 px wide, which fits 64. The build adds `PROP_SIZES["I"] = (4, 1)` and the overlap check covers it.
6. **Layout as built (level 3):**
   - The counter stays at columns 40–45 (row 18).
   - The sign `I` is at (43,13), beside the neon BIER sign above the shelf. Row 12 has hanging lamps at 36, 43 and 49, so it can't go there.
   - Regulars `O` are at (39,18), (47,18) and (49,18), replacing the old stools.
   - The waitress `W` is at (42,17), in the cell *above* the counter. A spawn cell is cleared to `.`, so putting her in the counter row would cut a hole in the counter. `Bar` finds the counter one row below her.
   - She stands on a raised 8 px step behind the bar, so she's visible from the chest up. Standing on the floor, the counter and the 12 px tap towers would hide all but her hair.
   - The lawyer moved from 38 to 35.

   `check_levels.py` is unchanged: level 3 is completable, with 296 reachable positions.

## Risks / Trade-offs

- **The bar gets busy, with fans, lawyer books and PROST bubbles all at once** → PROST is limited to once per 6 s and the fans keep their 3-bubble limit. The lawyer moves a few tiles left.
- **The waitress drawn before the main tiles is hidden by any tile in front** → that's intended: only the counter tile is in front of her columns.
- **Brand name in the game** → it's the user's request: a local brewery shown as clubhouse decoration, the same as Rivella and Cervelat already are.
