# Design

## Context

Findings from probing the built game in headless Chrome (real `keydown` events and the game's own update loop):

| Situation | Result |
|---|---|
| X, Left/Right Ctrl, Left/Right Alt | fire (3 shots in 0.5 s each) |
| standing, running left/right, jump + run, after being hit, next to a fan, next to a door/block | fire |
| each level's start (incl. disc cutter in the boss arena) | fire |
| on a ladder (climbing, stopped halfway, after a 5-frame Up tap at the ladder foot) | **no shots** |
| pressed against a 1-tile wall | shot spawns **behind** the wall and keeps flying |

Code: `Player.update` fires only when `!this.climbing` (`src/player.js`); entering a ladder needs only `Input.down("up")` while overlapping one, and in the ladder state `vx = 0` and the facing changes only when jumping off with a direction. `Player.fire()` spawns the shot at the muzzle (`x + w + 9` or `x − 9 − width`), and `updateHeroShots` checks only the tile at the shot's front edge, so a muzzle already past a thin wall never meets it.

## Goals / Non-Goals

**Goals:**
- Fire works in every situation the player can be in, including ladders.
- Shots never tunnel through walls.
- A regression test that covers the probed situations, so "fire blocked" cannot come back silently.

**Non-Goals:**
- No change to fire rates, damage, weapons or the ladder entry rule (a brief Up still grabs the ladder; that is how players climb).
- No new climb-shooting sprites; the existing shoot frames are reused.

## Decisions

### 1. Fire from ladders
Remove the `!this.climbing` condition from the fire check. While climbing, Left/Right set `face` (without moving: `vx` stays 0 and the ladder state is kept unless Jump is pressed, as now). The shot uses the same muzzle position as standing; `shootT` makes `draw()` show the `shoot` frame (or the cutter frame) facing `face` instead of the back-view climb frame for 0.15 s, then the climb frame returns.
*Alternative:* auto-dismount the ladder when Fire is pressed. Rejected: it would drop Buck down the shaft, which is worse than not shooting.

### 2. No shots through walls
In `fire()`/`fireBlade()`, scan the tiles from the hero's centre to the far edge of the spawn box along the shot's row; if any is solid (or a closed door), spawn sparks at that tile's face, play the deflect tick, count the shot for the fire rate, and do not create the projectile.
*Alternative:* move the spawn point back to the hero's centre. Rejected: shots would start inside Buck's body and could hit enemies behind him.

### 3. Regression tests
A `firing everywhere` test runs the probed situations on small test maps (open floor, running, jump + run, ladder climbing, ladder after a 5-frame Up tap, stopped halfway, after hurt, next to a fan) and checks that holding Fire for 0.5 s creates shots each time; a ladder-turn test (Left/Right on a ladder flips `face`, position and climbing state unchanged); and a wall test (touching a 1-tile wall: no shot exists on the far side after 10 frames, sparks were created).

## Risks / Trade-offs

- [Shooting from ladders makes ladder fights easier] → enemies keep their behaviour; the fire rate is unchanged. Acceptable and expected by players.
- [Turning on a ladder could be mistaken for leaving it] → the ladder state is kept; only Jump leaves sideways, as before; covered by the turning test.
- [Wall check costs per shot] → at most 2–3 tile lookups per shot, negligible.
