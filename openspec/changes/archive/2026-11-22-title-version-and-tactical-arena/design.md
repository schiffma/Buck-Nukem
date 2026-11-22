# Design

## Context

- **Build:** `tools/build.py` assembles `dist/buck_nukem.html` from `src/`. It already passes build-time data to the game through `{{META}}` → `ASSETS_META` (the hero palette). `dist/buck_nukem.html` is committed, and GitHub Pages serves it from `gh-pages`.
- **Boss map:** `src/levels/4_boss.txt` is 20 × 15. It has two short `=` ledges, two `h` health spots and fans at (4,13) and (9,10).
- **Boss:** `Boss` (`src/boss.js`) works in world coordinates.
  - Its idle position stays near the start: `homeX` −50 to +10 px.
  - It draws relative to `camX`, so scrolling already works.
  - `summon` spawns minions at `rnd(40, ox-60)`, which on a 640 px wide map can be off-screen.
- **Shockwave:** it is an `enemyShots` entry of kind `"shockwave"`. It ignores tiles completely and only dies after 3 s or at the map edge. Bubbles already burst on solid tiles.
- **Tiles:**
  - Solid tiles are `SOLID_CH = "#BRUG"`.
  - Doors show how a tile can change at run time: `level.openDoor` rewrites the map cell, and respawning doesn't reload the level.
  - Hero shots are removed on solid tiles in `updateShots` (`src/enemies.js`).
- **Hero heights:** the standing hero is 28 px tall and shoots from y+14. Kneeling, he is 16 px and shoots from y+h−6.

## Goals / Non-Goals

**Goals:**
- The version is visible on the title and stable across "tag → build → commit dist".
- A two-screen arena where position matters: height avoids the shockwave, crates give cover, and breakable cover wears down.
- The promo agent still wins the boss fight.

**Non-Goals:**
- No new boss attacks and no change to boss health, damage or the face/shell rules.
- No crates in the regular levels. The tiles exist globally, but only the arena uses them.
- No version in the HUD, the end screens or the page `<title>`.

## Decisions

1. **How the version is worked out:** the build runs `git describe --tags --match "v*" --abbrev=0` to get the latest tag *T*.
   - It counts the commits since *T* that touch anything outside `dist/`: `git rev-list --count T..HEAD -- . ":(exclude)dist"`.
   - It looks for uncommitted changes outside `dist/`: `git status --porcelain -- . ":(exclude)dist"`.
   - The version is *T* if both are zero. Otherwise it is `T-N-g<short HEAD>`, plus `-dirty` when there are uncommitted changes.
   - Any git failure falls back to `"v" + VERSION`.

   *Why:* plain `git describe --dirty` would always say "dirty" or "+1 commit" for the release build, because the release build itself changes `dist/`. *Alternative:* a `--version` flag on the build. It is rejected because it's easy to forget.

   The build sends the text through `ASSETS_META.version`, and the console log prints it. Reproducibility holds: with no source changes, git's answer stays the same.
2. **Version on the title:** drawn with the game font in the bottom-right corner, right-aligned at about x=314, y=230, muted beige with a shadow. The font is upper case, so the text appears as "V1.0.2". That corner sits beside "SOUND ON (M)" and below the rating badge, and a layout test checks that they don't overlap.
3. **Arena layout (40 × 15):**
   - Floor in row 14, walls at columns 0 and 39.
   - Buck `P` starts at (2,13); the boss `X` is at column 31, so `homeX` (−50…+10 px) keeps it on the right screen.
   - Platforms on rows 11, 8 and 5, three rows apart, because the jump rises only about 3.4 tiles (rows 10/7/4 would be out of reach):
     - row 11: columns 4–7 and 21–24
     - row 8: columns 8–12 and 16–19
     - row 5: columns 12–16
   - Ladders `H` at columns 10 and 18 run from the floor to row 8.
   - The row-11 span at columns 21–24 ends about 5 tiles in front of the boss's face. A blade fired from there (gun height 162 px) hits the face (158–220 px) while the claws are up.
   - Health `h` at (14,4), (6,10) and (21,10); 5 fans `F` on the floor and the platforms, away from the boss.
   - Crates:
     - sturdy `D` at columns 14 and 20
     - breakable `d` at column 9, a stack of two at column 16, and column 22
     - none within 3 tiles of the start or under a ladder foot
     - none in columns ≥ 23, because the claw-slam shockwave spawns at 400–460 px, and a crate there would cancel every slam

   The level checker proves the boss and every pickup are reachable with all crates treated as solid.
4. **Crate tiles:**
   - `D` and `d` are added to `SOLID_CH`, so collision, the hero's shots, bubbles, the checker and the AI see them as walls without special cases.
   - Breakable strength lives in a `Map` on the level, keyed `tx,ty` and starting at 6, so it resets when the level is reloaded.
   - `level.hitCrate(tx, ty, dmg)`:
     - lowers the strength
     - marks the tile dirty for redrawing
     - at 0, writes `.` like `openDoor` does, then plays the splinter FX and the `crate` sound
   - `updateShots` calls it when a hero shot hits a `d` tile. Blaster shots do 1 damage, blades 3.

   Tile art is drawn procedurally in `buildTileset`: planks with a dark outline. `D` gets grey metal bands and rivets. `d` has a cracked variant, used at strength ≤ 3. *Alternative:* making crates entities. It is rejected because every collision path would need a second case.
5. **Shockwave meets tiles:** each step, the shockwave looks at the tile at its leading edge, at floor height (`s.y + s.h - 1`). If that tile is solid, the shockwave is removed with a dust burst, and a `d` tile also takes 3 damage. This applies everywhere, but only the arena has shockwaves. The hero standing on a platform is already safe, because the wave is 12 px high and runs along the floor.
6. **Summoning on screen:** minions spawn at `x ∈ [max(Camera.x + 24, 40), min(ox − 60, Camera.x + W − 24)]` and drop from y=40 as before. If that range is empty, they spawn at its clamped edge. That keeps them visible and active (`isActive` margins) and stops off-screen minions piling up.
7. **Promo agent:**
   - The bridge snapshot already carries the live map, so it includes crates. The agent treats `D` and `d` as walls.
   - **Firing spot:** the boss leaf picks the furthest stand node whose gun height matches the boss's face, with a clear line (no crate in between) and outside the claws' reach.
     - Platform nodes are preferred over the floor; tops of breakable crates are excluded.
     - In the arena that is the row-11 ledge (columns 19–24), and any tile of that ledge counts.
   - **Dodging on the ledge:**
     - Buck kneels under bubbles that would hit him standing but not kneeling: no step, no turn.
     - Otherwise he makes a soft *sidestep*: same side for a whole volley, never off the ledge, and the 1 s settle rule applies, so no ping-pong.
     - The shockwave hop is only used on the floor.
   - **Firing checks:** no boss shots in the last 0.12 s of an attack's raise phase. Leaping minions must still be in line 2 frames ahead.
   - **Metric fix:** a shot that hits something in the same step counts as having had a target. Point-blank kills used to count as "no target".
   - Results on full dry runs:

     | Seed | Turns/min | No-target shots | Boss level |
     |---|---|---|---|
     | 1977 | 16.0 | 0.0% | 49 s |
     | 7 | 17.7 | 0.0% | 65 s |

     All limits are met on both. Each seed loses 2 lives in the boss fight.

## Risks / Trade-offs

- **A breakable crate stack could trap minions or block a ladder foot** → crates are kept off ladder feet and the start area, and the checker treats them as solid.
- **Crate spots may block Buck's own line of fire**, since standing he shoots from y+14 (`floor − 14`), inside a 1-tile crate → this is the intended trade-off: cover or shooting. The platform at row 10 gives a clear line, and a test covers a blade from there hitting the raised face.
- **The 40-tile arena makes the boss fight longer, which could break the promo time limits** → the dry-run limits are checked in task 6. Boss HP and attacks are unchanged.
- **`git` is missing on a builder's machine** → the build falls back to `VERSION` and prints a notice, but doesn't fail.
- **Version text and Pages:** the Pages copy shows whatever `dist/` was built from, so a release should be built after tagging (see the README release steps).

## Migration Plan

Release flow, which goes in the README:
1. Bump `VERSION`.
2. Commit.
3. `git tag -a vX.Y.Z`.
4. Run `python tools/build.py`.
5. Commit `dist/`, which still shows `vX.Y.Z` thanks to Decision 1.
6. Push `main`, the tags and `main:gh-pages`.

Rollback: revert the commit; the old 20 × 15 map has no other dependants.
