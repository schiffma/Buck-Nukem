# Proposal

## Why

Players report that "firing is blocked". Testing the real game with the real input path shows that X, Ctrl and Alt fire everywhere (standing, running, jumping, after being hit, next to doors, blocks and fans, in every level), with one exception: while Buck is on a ladder, fire does nothing at all. A brief tap of Up (W or ↑) in front of a ladder is enough to grab it, after which Buck hangs on the ladder unable to shoot or even turn until he climbs or jumps off. In the clubhouse level, where enemies wait at both ends of the ladder, this feels like a broken fire button. The same test also found a bug: pressed right against a one-tile-thick wall, Buck's shot appears on the far side of the wall and flies on behind it.

## What Changes

- Buck can fire while on a ladder: Left/Right turn him to face that side without leaving the ladder, and fire shoots in the facing direction at the normal fire rate (blaster, Mega Blaster and disc cutter). He shows his shooting pose for the moment of the shot.
- Jumping off a ladder with a direction still works as before; Up/Down climbing is unchanged.
- Shots never appear beyond a wall: when the muzzle would be inside or past a solid tile, the shot hits that wall right away (sparks, no projectile behind the wall).
- A regression test covers every firing situation that was checked (standing, running, jumping, on a ladder, after a brief Up tap at a ladder foot, touching a wall, after being hit, next to a fan).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `game/gameplay`: "Shooting" (firing also while climbing; shots never pass through a wall the hero is touching) and "Climbable ladders" (Left/Right turn the hero on a ladder without leaving it).

## Impact

- `src/player.js`: ladder update (facing with Left/Right), the fire condition, the shot spawn check, the shoot pose while climbing.
- `src/sprites.js`: none expected (the existing shoot frames are reused while on a ladder).
- `src/test.js`: firing regression tests; existing ladder and shooting tests keep passing.
- The promo autopilot does not fire from ladders today; nothing breaks for it.
