# Design

## Context

- **Hero body:** `Player` is a 10×28 px body moved by `moveBody` (`src/level.js`). The sprite is drawn feet-aligned from a 23×32 frame (`py = y + h - HERO_H`).
- **Down key today** (`src/player.js`):
  - On a ladder top (`ladderBelow`), Down enters the ladder.
  - Elsewhere, `drop = Input.down("down") && !ladderBelow` is passed as `dropThrough` while Buck is on the ground, so holding Down on a one-way platform drops him through.
- **Shot heights:**
  - Blaster: centred on `y + 14`, which is 14 px above the floor when standing.
  - Disc cutter: spans `y + 12 … y + 26`.
  - A crayfish is 10 px high (floor − 10 … floor), so a standing blaster shot passes 4 px above it.
- **Enemy projectiles:**
  - Briefcase: leaves at lawyer `y + 10`, 8 px high (floor − 20 … floor − 12 at launch). It arcs up about 15 px, then falls.
  - Mower clippings: near the floor (floor − 8 ± 2).
  - Boss shockwave: floor − 12 … floor.
  - Bubbles: fall from above.
- **Camera:** it follows the body's centre with a vertical dead zone (70–140 px), so a few pixels of centre shift do not move it.
- **Promo tooling:** `bridge.js` (`hittableInLine`) and `agent/world.py` (`hittable`) treat a crayfish on the ground as unhittable with the blaster. The agent never holds Down except to climb down ladders, and the nav graph has no drop-through edges.

## Goals / Non-Goals

**Goals:**
- One kneel state, used by input, physics, collision, shooting and drawing, with feet staying where they are.
- A low shot that reliably hits a ground crayfish. A ducking hitbox that clears briefcases in mid-flight.
- Drop-through on Down + Jump, with no change to level geometry.
- The promo agent and its metrics stay correct, and the agent uses the low shot on crayfish.

**Non-Goals:**
- Crawling while kneeling, shooting diagonally, or kneeling in mid-air or on ladders.
- Changing crayfish health, AI or leap behaviour.
- Giving the agent drop-through moves (the nav graph keeps none).

## Decisions

1. **Kneel changes the real body height (28 → 16 px), feet fixed.**
   - Entering: `y += 12, h = 16`. Standing up: `y -= 12, h = 28`, but only when the tiles covering the 12 px above are not solid. Otherwise he stays kneeling.
   - Collision with walls, enemies and projectiles, the water check and the camera then all follow automatically. Ducking is just the smaller box: projectiles whose bottom is above floor − 16 pass over him.
   - *Alternative:* keep `h = 28` and add a separate hurtbox for projectiles only. Rejected: every overlap site (enemy contact, shots, boss boxes, water) would need to pick the right box, and a kneeling hero must not hang half inside walls.
   - The checkpoint/respawn paths (`placeAt`, `Player.h` users in `main.js`) reset the kneel state first, so spawn positions keep using the standing height.

2. **Kneel conditions.**
   - Kneel = Down held && `onGround` && not climbing && no `ladderBelow` && `hurtT <= 0`. A ladder top keeps priority for climbing down.
   - While kneeling, the horizontal target speed is 0 (normal deceleration). Left/Right set `face` only.
   - Jump while kneeling:
     - on a one-way tile under the feet: drop through
     - otherwise: stand up (if there's room) and do a normal jump
   - Leaving the ground (walking off is impossible while kneeling, but knockback can lift him) ends the kneel.

3. **Low muzzle: kneeling shots are centred 6 px above the floor.**
   - With the 16 px body that is `y + 10`. The blaster and Mega shots spawn there: a 3–4 px shot spans floor − 8 … floor − 4, inside a crayfish (floor − 10 … floor).
   - The disc-cutter blade spawns at `y + 2` (floor − 14 … floor).
   - `muzzleBlocked` gets the same muzzle row.
   - *Alternative:* aim shots downward. Rejected: it changes shot travel and wall rules, and a flat knee-height shot is the genre convention.

4. **Drop-through becomes Down + Jump, with a short drop timer.**
   - Pressing Jump while kneeling on a one-way tile (`isPlatform` under the feet) sets `dropT = 0.2 s` and gives no jump impulse.
   - While `dropT > 0`, `moveBody` gets `dropThrough: true`, so Buck falls clear of the platform, as he did with Down held.
   - The kneel ends when the drop starts.

5. **Sprites: kneeling frames built from the existing rows.**
   - The head and a shortened torso (belly rows removed, gun row kept) are drawn 10 px lower in the same 23×32 frame. Kneeling legs (thigh forward, knee and clog on the ground) take at most 4 rows.
   - The gun barrel row lands about 6 px above the frame bottom, matching the muzzle height.
   - Frames: `kneel` and `kneelShoot` for the blaster, plus a `kneel` frame with the disc cutter. The muzzle flash and cutter sparks in `Player.draw` use the kneel muzzle offset.

6. **Promo tooling follows the game's rules.**
   - The bridge snapshot adds `hero.kneeling`.
   - `hittableInLine` (`bridge.js`) and `World.hittable` use the current pose's muzzle band: standing y + 8 … y + 22, kneeling about y + 4 … y + 16. A kneeling shot counts a ground crayfish as hittable.
   - A new py_trees leaf `Kneel`, placed before `Vault`:
     - trigger: a crayfish on the ground, on Buck's floor, in front, 40–9 tiles away, with a clear line, on or near the route
     - action: turn to face it if needed, then hold Down (`why: "kneel"`); Fire does the rest
     - limits: a time budget per crayfish (4 s), and Kneel stops when the crayfish leaps (the Cray leaf takes over)
   - The controller passes `down` for this leaf as for climbs. The follower still aligns within 6 px of a ladder column before pressing Down, so a ladder top is entered rather than knelt on.

## Risks / Trade-offs

- [Players used to Down dropping through platforms] → The README controls table and the title screen show Down + Jump. Tests cover both behaviours.
- [A kneeling hero stuck under a low ceiling] → He stays kneeling and can't walk, but he can turn and jump (if there's room) or release Down once he's no longer under the tile. Knockback still moves him. Test: kneel under a 1-tile gap, release Down, and he stays kneeling without clipping into the tile.
- [Ducking makes lawyers too easy] → Briefcases launched point-blank or falling at the end of their arc still hit (their bottom is below floor − 16). Clippings and shockwaves stay unaffected.
- [Changing `h` breaks code that assumes 28] → The test "hero: shot height unchanged" checks standing only. A grep for `Player.h`/`P.h` users (`main.js` spawn and checkpoint) is part of the tasks; those run with the standing height after `placeAt` resets the kneel.
- [Promo agent kneels where it should climb] → Kneel triggers only on the ground away from ladder tops. The climb alignment rule stays, and the dry-run report shows any stuck events.

## Migration Plan

Single release: rebuild `dist/buck_nukem.html`, run the in-game tests (`tools/run_tests.py`), the level check, the promo agent's unit tests and a `--dry all` run. Rollback is reverting the commit; no saved data is involved.
