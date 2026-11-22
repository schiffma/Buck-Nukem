# Design

## Context

This builds on the game after `add-grindhouse-style` (implemented, not yet archived; 128 in-game tests).

- **Gardener robot.**
  - `ENEMY_TYPES.robot` in `src/enemies.js` has a 14×24 hitbox, 5 HP, contact damage 2 and speed 24. It triggers a `spray` hazard box (`spawnEnemyShot({kind: "spray"})`) when the hero is in front within `robotSprayRange`.
  - Sprites `ROBOT1`/`ROBOT2` (18×26) are in `src/sprites.js`. Gore is `GORE_BY_TYPE.robot` (oil, sparks, metal gibs). Config keys are `robot*` in `src/config.js`. The map letter is `M`, spawned in `Game.loadLevel()` (`src/main.js`).
  - Tests that refer to the robot: the robot spray tests, the gore robot test, the sound-coverage list (`spray`) and the sprite sheet.
- **Level 3.**
  - `src/levels/3_clubhouse.txt`, theme `hall`, background `bg_hall` darkened by a 0.35 overlay in `Level.drawBackground()`.
  - Segments 1–2 (columns 0–63) are the clubhouse: ceiling rows 0–1, upper storey rows 2–10, slab row 11 with a ladder at column 28 and a hole at columns 42–44, lower storey rows 12–18, floor rows 19–21. Red door at column 52, red key upstairs at column 56.
  - Their only decoration is `v` windows. Segment 3 onward is the gym hall.
- **Tiles.** `src/level.js` draws `back` (decoration, ladders), `main` (solids, platforms, doors) and `water` layers. One-way platforms are `=` (`Level.isPlatform`).
- **Level checker.** `tools/check_levels.py` treats `=` as a one-way platform.

## Goals / Non-Goals

**Goals:**
- A punk enemy whose charge is readable: a clear wind-up, then a dangerous dash. Dodge it by jumping or by shooting him first.
- A dense, recognisable clubhouse interior made from small reusable procedural props, using the existing ASCII map format.
- Keep level 3's geometry, routes, doors and keys, so completability and existing tests hold.

**Non-Goals:**
- New enemy count or placement, NPCs, interactive furniture beyond standing on it, or destructible props.
- Changing other levels or the gym hall look.
- Gameplay effects from the blunt.

## Decisions

**1. Rename the enemy type to `punk` (map letter stays `M`).**
`ENEMY_TYPES.punk`, `GORE_BY_TYPE.punk`, `SPR.punk` and `CONFIG.punk*` replace the robot entries, and the `M` spawn uses `"punk"`.
- Hitbox: 24×28, covering body plus mower, so shots and contact hit either.
- Contact damage: 2, applied to the whole hitbox.
- HP: 5. Points: 500.

*Alternative:* keep the `robot` type id. Rejected: misleading names in code and tests.

**2. Punk behaviour as a small state machine.**
- `patrol`: speed 24; turns at ledges and walls, like the lawyer.
- `rev`: 0.5 s with `vx = 0`. The sprite shakes, smoke puffs come from the mower exhaust, and the `rev` sound plays.
- `charge`: speed 110 (≥ 3× patrol). Stops at a ledge (`groundAhead`), a wall, or after 128 px. Every 0.08 s it spawns a `clipping` projectile: green 2×2 grass or grey 3×3 stone. Each one has `vx = face × rnd(140, 200)`, `vy = rnd(-80, -20)`, gravity 300, a 0.35 s life (about 60 px range) and 1 damage. Clippings are removed on hitting a solid tile, like other projectiles.
- `cooldown`: 2.0 s of patrol before the next charge can trigger.

The trigger reuses `heroInFront(e, 96, 24)`, so the hero must be in front, within 6 tiles and at roughly the same height. Blunt smoke is a cosmetic particle every ~1 s at the mouth position (mirrored with facing).
*Alternative:* keep the weedkiller spray. Rejected: the user asked for a mower, and a charge makes the mower the threat.

**3. Punk and mower sprite.**
- One 30×30 frame: punk on the back half, mower in front, joined by the handle bar.
- Frames: `walk1`, `walk2` (legs and mower wheels), `rev` (mower 1 px up, exhaust).
- Palette:
  - mohawk: `#40e040` / `#1e9a1e`
  - vest: black leather `#1a1414` with studs `#c8ccd4`
  - arms: bare (skin)
  - jeans: ripped, blue with skin patches
  - boots: black
  - blunt: brown, with an orange ember pixel
  - mower: red `#c82020` / `#7a1010`, with black wheels and a grey handle

It goes through `makeSet()`, so it gets the grindhouse outline and shading automatically.

**4. Punk gore depends on the hit side.**
`damageEnemy(e, dmg, dir)` already gets the shot direction.
- A shot travelling against the punk's facing (`dir === -e.face`) hits the mower: oil and sparks.
- Otherwise it hits the punk: blood.
- On death: blood and gibs from the body, plus oil, sparks, metal gibs and a small ring flash from the mower.

**5. Interior backdrop by column range.**
- New level header `interior: <x0>-<x1>` (level 3: `0-63`).
- `Level.drawBackground()` still draws the photo. A new `back`-layer pass fills every visible cell inside the range that is not solid, not water and not a window (`v`) with an interior backdrop tile:
  - wallpaper: a dark burgundy damask pattern
  - the cell row directly above a floor or slab: wood wainscot (vertical planks plus a dado rail)
- Window cells keep showing the photo, as a view outside.
- The hall overlay (0.35) is skipped inside the range.

*Alternative:* a separate backdrop map layer. Rejected: it doubles the authoring work, and a column range is enough for a rectangular building.

**6. New map characters.** Props are drawn in the `back` layer anchored at their top-left tile. Multi-tile props use one character in the top-left cell; the build pads nothing.

| Char | Meaning | Size (tiles) | Physics |
|---|---|---|---|
| `a` | bar counter | 1×1 | one-way platform |
| `A` | bar counter with beer taps | 1×1 | one-way platform |
| `T` | restaurant table, checked tablecloth | 1×1 | one-way platform |
| `c` | chair | 1×1 | none |
| `i` | bar stool | 1×1 | none |
| `q` | back-bar bottle shelf | 1×1 | none |
| `N` | neon beer sign "BIER" (flickers) | 2×1 | none |
| `$` | cash register | 1×1 | none |
| `Z` | trophy cabinet | 2×2 | none |
| `m` | menu chalkboard (CERVELAT 8.50 / RIVELLA 4.50 / FONDUE 25.-) | 6×2 (wide enough for the text) | none |
| `k` | kitchen pass-through, with a "KITCHEN" sign and a steaming pot | 3×2 | none |
| `p` | framed photo / poster | 1×1 | none |
| `x` | crossed tennis rackets | 1×1 | none |
| `j` | hanging lamp, with a cord to the ceiling | 1×1 | none |
| `y` | potted plant | 1×2 | none |
| `Y` | "TC / WOLLERAU / CLUBHOUSE" club plaque | 4×2 | none |

- `Level.isPlatform()` returns true for `=`, `a`, `A` and `T`, so enemies' ledge checks, `moveBody` and the checker treat them alike. Note: a lawyer or punk will walk onto a counter only by falling onto it; ledge logic treats the counter edge as a ledge.
- Props are pre-rendered once per level into a `Map(char → canvas)`. Text such as the menu and plaque is drawn with a `drawTextTo(g, ...)` helper that blits from the font atlas.
- `check_levels.py`: add `a`, `A`, `T` to the one-way set. The new decoration characters are treated as empty.

**7. Level 3 refurnishing (geometry unchanged).** Segments 1–2 keep every `#`, `B`, `H`, `R`, `=`, key, door, pickup and enemy cell. Only empty cells receive props, and the upper storey's existing `=` shelves stay.
- *Lower storey, segment 1 (start):* the restaurant. A menu board on the wall, 4 tables with chairs, the kitchen pass-through at the back, plants and hanging lamps.
- *Lower storey, segment 2 (before the red door):* the bar. Bottle shelves and a neon sign on the back wall, a counter run of `a`/`A` with `$`, stools in front.
- *Upper storey, segments 1–2:* the club lounge. Trophy cabinet, framed photos, crossed rackets, the club plaque, plants and lamps. Windows stay as views outside.

## Risks / Trade-offs

- [The charge feels unfair at close range] → The 0.5 s wind-up is visible and audible, the cooldown is 2 s, and the punk stops at ledges. Tune via `CONFIG.punk*`.
- [Furniture platforms change enemy patrols] → Placing furniture only in empty cells away from patrol paths avoids that. Tests cover the punk and lawyer ledge behaviour, and `check_levels.py` covers completability.
- [Busy interior hurts readability] → Props use darker, desaturated colours on the wall, and only gameplay objects (pickups, enemies, platforms) are bright. Review with `tools/screenshot.py`.
- [Prop characters in the wrong cell (multi-tile overlap)] → The build warns if a multi-tile prop's footprint overlaps a non-empty cell.
- [Archive order] → This change modifies `add-grindhouse-style` versions of "Enemy hit feedback" and "Themed foreground tiles". Archive that change first.

## Migration Plan

No saved data. Rebuild `dist/buck_nukem.html`. Rollback: revert the sources and rebuild.

## Open Questions

- Exact prop placement and colours will be tuned from screenshots during implementation. This doesn't change specs or tasks.
