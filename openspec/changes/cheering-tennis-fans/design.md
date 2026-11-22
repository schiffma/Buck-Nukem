# Design

## Context

- **Level maps** (`src/levels/*.txt`): characters in `ENTITY_CH` (`src/level.js`) are collected into `level.spawns` and their tile is cleared to `.`; `Game.loadLevel` turns spawns into objects. Static decoration goes through `PROP_DEFS` (`src/props.js`) and is drawn in the tile passes. Free map characters include `F`. `tools/check_levels.py` treats any character that is not solid, a door, a ladder, water or a one-way platform as empty, so an `F` cell is walkable for the checker without changes.
- **Draw order** (`Game.renderWorld`): background, back tiles, main tiles, … `drawEnemies`, hero, shots, FX, water. Fans must be drawn after the tiles and before enemies, so enemies and Buck pass in front of them.
- **Events**: kills in `damageEnemy` (`src/enemies.js`, `e.dead = true`, `Game.stats.kills++`), trophy pickup `case "t"` in `Game.collectPickup` (`src/main.js`), checkpoint activation (`Sound.play("checkpoint")` in `src/main.js`). Text above the world uses `FX.text` (floating, fading) and `drawText` with the pixel font.
- **Sprites**: `spriteFromRows` + `makeSet` (outline, mirror, flash); the hero is 23×32 with a 10×12 head. Outline test in `src/test.js` covers sprite sets.
- Candidate standing cells (ground below, two free cells, no neighbours) were found with a scan of the maps: level 1 around x 22/73/120/168 (row 14), level 2 around x 22/49/97/140 (row 26), level 3 around x 22/60/101/140, boss arena: the floor next to the boss is covered by its body, so its fans stand where the boss never covers them: on the upper-left platform (5,7) and on the floor left of the claws (6,13); the lower platform (9,10) was tried and is hidden behind the boss head.

## Goals / Non-Goals

**Goals:**
- Lively, varied background fans who clearly cheer for Buck and react to his successes.
- Zero gameplay impact; cheap to draw; deterministic enough to test.
- Tasteful, sporty pixel art in the game's style (1970s tennis whites, headbands, wristbands), not sexualised.

**Non-Goals:**
- No interaction (they cannot be hit, talked to or rescued), no pathing or walking around.
- No crowd-noise loop; only short reaction cheers.
- No change to the promo autopilot or level checker logic.

## Decisions

### 1. Fans as a lightweight entity list, map character `F`
Add `F` to `ENTITY_CH`; `Game.loadLevel` creates `Game.fans = [{ x, y, variant, face, t, cheerT, bubble }]` from the `F` spawns. Variant = index within the level (`0..n-1`) combined with the level index, mapping into a variant table so every fan in a level differs. Not in `Game.enemies`, so no collisions or targeting anywhere.
*Alternative:* a `PROP_DEFS` entry. Rejected: props are cached static canvases drawn in the tile pass and cannot face Buck or react.

### 2. Procedural sprites with palette variants
A 20×32 frame with a 16 px wide figure (room for arms raised up and out, rackets and towels overhead; head about 9 rows like the hero, ponytail/bob/afro/bun hair shapes, tennis dress or polo + pleated skirt, wristbands, sneakers) built from rows like the other sprites, in three frames: `idle` (racket/towel low), `wave` (arm up), `jump` (both arms up, 2 px off the ground). Variant table (at least 6 entries): hair shape × hair colour (blonde, brown, black, red, grey-blond), skin tone (light, tan, brown, dark), outfit accent (red, blue, green, orange stripe or collar), accessory (racket, towel, headband, visor). Sets are built once per variant with `makeSet` (outline + mirror).

### 3. Behaviour
- **Idle:** each fan loops idle ↔ wave with her own phase (frames change at least twice per second), and faces Buck (`face = sign(Buck.cx − fan.cx)`, with a small dead zone so she doesn't flicker when he's right above her).
- **Messages (revised):** each fan owns her own bubble (`f.bubble = { text, t }`), so several can show at once; lines are picked so that bubbles on screen at the same time differ. Reactions give every fan in range a bubble from the cheer lines; shout-outs give a fan a bubble from a separate greeting pool ("HI BUCK!", "YOU ROCK!", "GO GET 'EM!", "NICE MOVES!", "BUCK RULES!"; sporty fan cheers, nothing suggestive) when Buck comes within 4 tiles and she hasn't called out for 8 s. The cheer sound stays rate-limited to once per 1.5 s; shout-outs are silent.
- **React:** `Fans.react(x, y, kind)` is called from kills (enemy centre), trophy pickups and checkpoints. Every fan within 12 tiles gets `cheerT = 1.0` (jump frames, small hop). If the last bubble/sound was more than 1.5 s ago, the nearest reacting fan gets a speech bubble (a white rounded box with a tail and dark pixel-font text, about 1.2 s) with a line from `["GO BUCK!", "YEAH BUCK!", "WOOO!", "MY HERO!", "BUCK! BUCK!"]` chosen deterministically in rotation, and `Sound.play("cheer")` plays.
- **Draw:** after the main tiles, before enemies; bubbles drawn after the hero so they stay readable.

### 4. Cheer sound
`"cheer"`: a ~0.6 s band-passed noise swell (crowd "woo") plus a two-note whistle (square, 1.6 kHz → 2.1 kHz), at `sfx` levels well below the music. Rate-limited with the bubble (1.5 s).

### 5. Placement
Add `F` to the four maps at spread-out standing cells (3–5 per regular level, 2–3 in the boss arena), avoiding cells right next to spawns, props and the exit; `tools/build.py` warns if an `F` has no floor below. README level-format table gets `F`.

### 6. Tests
Counts per level; distinct variants per level; each fan stands on floor or platform; frames change within 1 s; faces Buck when he is left/right; a kill within 12 tiles triggers `cheerT > 0`, one bubble and one `"cheer"` (`onPlay`), a second kill 0.5 s later triggers no extra bubble/sound; a kill 20 tiles away triggers nothing; shots and Buck pass through a fan cell; `tools/check_levels.py` results unchanged; outline test includes all fan variants; the 8 ms performance test passes with fans on screen.

## Risks / Trade-offs

- [Fans clutter the screen or hide pickups/enemies] → background placement away from spawns, darker outline only, drawn behind enemies; check each level with screenshots.
- [Speech bubbles cover the action] → one bubble at a time, short duration, positioned above the fan, rate-limited.
- [Cheer sound becomes repetitive] → 1.5 s rate limit, slight random pitch variation, quieter than music.
- [Variant look-alikes at 16 px] → vary hair silhouette as well as colour; the variety test guarantees distinct combinations per level.
