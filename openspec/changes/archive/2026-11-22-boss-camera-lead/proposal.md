# Proposal

## Why

In the two-screen boss arena the camera keeps Buck in the middle of the screen, as in the regular levels. The boss always sits to the right, so half the view shows the empty area behind Buck and the boss is often cut off or off-screen. Keeping Buck near the left edge shows much more of the arena ahead, the boss, its attacks and the platforms in front of it.

## What Changes

- **In the boss arena only**, the camera keeps Buck about a quarter of the way in from the left edge of the screen (screen x ≈ 80 of 320), with a small dead zone so small steps don't jiggle the view. The view shows about three quarters of the screen ahead of him, towards the boss. At the right end of the arena the camera stops at the map edge as before, so Buck moves further right on the screen there.
- Vertical camera behaviour is unchanged.
- Respawning in the arena, and the end of the boss reveal pan, place the camera with the same left-anchored framing.
- Levels 1–3 keep the centred camera.
- Assumption: the anchor is about 80 px and doesn't flip when Buck turns to face left, which is what "Buck always left" asks for. Facing the start of the arena shows only a little behind him, which is fine because the threats are to the right.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `game/gameplay`: the requirement "Wide tactical boss arena" says the camera keeps the hero near the left edge.

## Impact

- `src/level.js`: `Camera.follow` and `Camera.snap` take a horizontal anchor (the centre by default; about 80 px in the arena).
- `src/main.js`: the arena sets the anchor when the level loads, and resets it for other levels.
- `src/test.js`: new camera framing tests. The reveal's "back on Buck" check and the scrolling check use the anchored position.
- `tools/promo`: no logic change. Shots are removed when they leave the screen, so more of the screen ahead keeps blades alive longer. A dry run confirms the limits.
- **Ordering:** `mega-cutter-and-boss-reveal` (still active) ends its pan with `Camera.snap`, which picks up the anchor automatically. Archive that change first.
