# Design

## Context

- **Hero torso.** `src/sprites.js` defines `HERO_TORSO`, `HERO_TORSO_SHOOT`, `HERO_TORSO_HURT` and `HERO_TORSO_CLIMB` as 13 rows from `BODY_Y = 9`. The belly rows (torso rows 4–10) widen the shirt to 12 px against 8 px shoulders. The gun barrel is on frame row 18 (torso row 9). The test "beer belly bulges at least 3 px wider than the shoulders" in `src/test.js` measures widths from the row strings.
- **Water.** `buildTileset()` in `src/level.js` draws `ts.water` and `ts.waterTop` (4 animation frames each) in fixed blue (`rgba(40,110,200,0.88)`, surface `#cfe8ff`) for every theme.
  - Only `src/levels/2_creek.txt` (theme `creek`) contains `~`. The boss arena (also theme `creek`) has none.
  - Blue is also hard-coded in the splash sparks (`#9fd0ff`, `src/player.js:117`, `src/enemies.js:69`) and in the submerged-crayfish bubbles (`#cfe8ff`, `src/enemies.js:291`).
- **Props.** `src/props.js` (`PROP_DEFS`, `PROP_DRAW`, `propCanvas`) draws decoration anchored at the top-left cell in the `back` layer of any level. `tools/build.py` `PROP_SIZES` drives the overlap warning, and `tools/check_levels.py` treats unknown characters as empty.
- **Level 1.** `src/levels/1_courts.txt` is 192×18, ground at rows 15–17, made of six 32-column segments. Its only decoration is nets (`n`), fences (`f`), lamps (`l`) and bushes (`b`).

## Goals / Non-Goals

**Goals:** a slimmer belly, an unmistakably toxic creek, and a busy tennis club. All visual: no gameplay or layout changes.

**Non-Goals:** new hazards or damage values, interactive equipment (no standing on chairs or benches), changing the boss arena, re-grading the photo background (its natural creek stays as the backdrop).

## Decisions

**1. Slimmer belly.** Torso rows 4–10 widen the shirt by at most 2 px beyond the 8-px shoulder line, for example `"...JJjJwwwwwJJ"`. The same applies in the hurt and climb sets. The gun rows (torso 9–11) keep the barrel at column 16+. The belly test changes to "1 ≤ belly − shoulders ≤ 2".

**2. Water palette per theme.**
- `THEMES.<name>.water` holds `{ deep, mid, glint, surface, splash, bubble }`. The creek gets the toxic set:
  - deep `rgba(120,8,8,0.92)`, mid `#b81c10`, glint `#ff6a30`, surface `#ffb060`
  - splash `#ff4020`, bubble `#ffd070`
- Other themes keep the blue set.
- `buildTileset()` builds the 4-frame water and water-top tiles from that palette. The creek adds 2–3 bubble pixels per frame at frame-dependent positions (seeded) on the top tile and 1–2 inside deep tiles, so the frames differ.
- A red glow is a pre-rendered 16×6 gradient strip drawn above every water-top tile in the `water` layer, at alpha 0.25.
- `Level.waterPalette` exposes the active palette. Splash sparks and crayfish bubbles use `Game.level.waterPalette.splash` / `.bubble` instead of the hard-coded blues.

*Alternative:* a full-screen red tint. Rejected because it would also tint the hero and the HUD.

**3. New props** in `PROP_DEFS` and `PROP_DRAW`, drawn procedurally:

| Char | Prop | Size (tiles) |
|---|---|---|
| `Q` | umpire chair (green tall chair, ladder, seat, small sunshade) | 2×3 |
| `@` | ball machine (grey body, wheels, hopper of yellow balls) | 2×1 |
| `%` | ball basket (wire basket full of balls) | 1×1 |
| `V` | racket bag (long bag with two racket handles sticking out) | 2×1 |
| `z` | player bench (green slats, white legs, towel) | 2×1 |
| `[` | scoreboard ("TC WOLLERAU", "6:4 3:6 7:5", green board, posts) | 5×2 (wide enough for the text) |
| `J` | court drag brush (wide brush on a T-handle leaning) | 2×1 |
| `&` | water cooler (blue jug on a stand, cups) | 1×2 |
| `*` | toxic waste drum (rusty yellow drum, black trefoil, oozing red) | 1×1 |
| `^` | warning sign (post plus sign with skull and "TOXIC") | 2×2 (wide enough for "TOXIC") |

`PROP_SIZES` in `tools/build.py` gets the multi-tile entries (`Q`, `@`, `V`, `z`, `[`, `J`, `&`, `^`). Text uses `drawTextTo`; the scoreboard and warning-sign text is logged for tests.

**4. Level furnishing.**
- *Level 1:* the umpire chair and a scoreboard by the court net (segment 2), a ball machine and ball baskets on court 1 (segment 1), a bench, racket bags and the water cooler at the courtside (segments 2 and 4), drag brushes leaning on the fence and the roof building (segments 2 and 5). Only `.` cells change, so routes are untouched; `check_levels.py` must still pass.
- *Level 2:* at least 2 `*` drums and 2 `^` signs next to the 3 pools (segments 1 and 4), placed on ground rows above solid cells.

A furnishing script asserts that every structural, entity and pickup cell is unchanged (same guard as the clubhouse refurnish).

## Risks / Trade-offs

- [The red water reads as lava or blood rather than toxic] → Add bubbles plus drums and signs to establish "toxic". Tune the palette with screenshots.
- [Busy court props hurt readability of enemies and pickups] → Muted prop colours, with yellow ball accents kept small. Review with screenshots, film filter on and off.
- [Symbol characters in maps (`@ % [ & * ^`)] → The build passes them through unchanged. `ENTITY_CH` and `SOLID_CH` don't include them, and the checker treats them as empty.

## Migration Plan

Rebuild. Rollback: revert sources and level files.
