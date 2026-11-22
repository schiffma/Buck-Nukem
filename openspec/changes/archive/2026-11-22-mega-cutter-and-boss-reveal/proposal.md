# Proposal

## Why

The wide boss arena has a top platform (row 5) that is hard to reach and gives nothing worth the climb, and the fight with the plain disc cutter (3 damage per blade against 50 health) is long. Since the arena became two screens wide, the player also starts with the boss off-screen and may not know where it is or how big it is.

## What Changes

- **Mega Cutter upgrade:** a weapon pickup on the arena's top platform. Touching it turns the disc cutter into the **MEGA CUTTER**:
  - Each shot fires **two blades**, one level and one angled slightly upward.
  - Each blade deals **5 damage** instead of 3.
  - The blades glow orange and are larger.
  - The HUD shows "MEGA CUTTER".

  The upgrade lasts **until Buck loses a life**; after respawning he has the plain disc cutter again. While Buck doesn't have the upgrade, the pickup **reappears 20 seconds** after it was taken. In the boss arena, the existing `w` map tile places this upgrade; in other levels `w` stays the Mega Blaster.
- **Boss reveal:** when the boss arena starts, after its reel intro card, the camera pans across to the boss, holds on it for a moment while it raises its claws, and pans back to Buck, about 3 seconds in all. During the pan Buck can't move and the boss doesn't attack. Jump or Fire skip it. The pan only plays when the arena is entered, not when Buck respawns there.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `game/gameplay`: new requirements "Mega Cutter upgrade" and "Boss reveal at arena start".
- `game/presentation`: the HUD shows the upgraded weapon name; the Mega Cutter blades look different.

## Impact

- `src/levels/4_boss.txt`: one `w` on the top platform.
- `src/main.js`:
  - the `w` pickup gives `"megacutter"` in the boss arena, with its own sprite
  - the pickup reappears in the arena
  - the reveal pan is started on LEVEL_INTRO → BOSS
- `src/player.js`: `fireBlade` handles the twin and stronger blades; respawn resets the weapon to the plain cutter (already the case).
- `src/boss.js`: the boss stays idle while the reveal runs (it already has an "intro" state).
- `src/level.js` (Camera), `src/hud.js`, `src/sprites.js`, `src/config.js`: the pan, the HUD label, the glowing blade and pickup sprites, and the constants.
- `src/test.js`: upgrade, respawn of the pickup, losing the upgrade on death, the reveal pan and skipping it, plus a check that existing boss tests still pass.
- `tools/promo`: the agent waits through the pan and collects the upgrade, which is a planned pickup; a dry run confirms the spec limits.
- `README.md`: the boss arena paragraph.
