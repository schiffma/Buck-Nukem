# Proposal

## Why

The crayfish are the game's signature enemy, but before this change both the small crayfish (a plain 24×12 sprite) and the giant boss looked crude. A first attempt in this change gave them a red/blue "mutant" shell with a blue DNA glow; that look was rejected. The crayfish should instead look like a real crayfish, as in the reference photo ([crayfish_reference.png](crayfish_reference.png)), and be red only: dark red-brown glossy armour, a smooth carapace with a pointed rostrum, a clearly segmented tail ending in a fan, two big heavy claws with pale tips, thin walking legs and long antennae. The boss fight is also played with the same blaster as every other level; a giant disc cutter firing spinning saw blades gives the finale a memorable, trashy grindhouse weapon.

## What Changes

- Redraw the small crayfish in side view after the reference photo's anatomy and colours: red only (dark red-brown with a glossy red sheen, darker joints, pale claw tips), smooth carapace and rostrum, segmented tail with a tail fan, two large claws held forward, thin legs, long antennae; two walk frames and the existing dark outlines. Hitboxes and behaviour stay as they are.
- Redraw the giant boss in the same realistic red style (glossy red-brown carapace with a cervical groove, segmented tail and fan, heavy claws with pale tips, long antennae, eye stalks), keeping its face/shell/claw hitboxes and attack animations.
- Remove the blue mutant elements added earlier in this change: the red/blue split, blue spikes, the blue glow motes on small crayfish and the DNA helix/molecule glow around the boss.
- Add a giant disc cutter weapon (unchanged from the earlier plan, already implemented): when the boss arena starts, Buck switches to it automatically and keeps it in the arena, also after respawning there. It fires large spinning saw blades (slower fire rate, more damage than the blaster) with a grinder whine. The boss rules stay: only the face takes damage while the claws are raised; blades striking the shell or closed claws are deflected with sparks.
- The HUD shows "DISC CUTTER" with its own icon while it is equipped; the hero sprite holds the cutter instead of the gun.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `game/gameplay`: new requirement "Disc cutter in the boss arena" (weapon switch, saw-blade projectiles, damage, persistence on respawn in the arena).
- `game/presentation`: new requirement "Realistic red crayfish" (both crayfish, after the reference photo, red only, no glow effects).

The existing boss requirement in `game/enemies` ("only the face takes damage while the claws are raised; shell and closed claws deflect hero projectiles") already covers saw blades as hero projectiles and stays unchanged.

## Impact

- `src/sprites.js`: new crayfish pixel rows (replacing the red/blue rows) and palette entries; the blue palette keys are removed. Hero frames holding the disc cutter, saw-blade and cutter icon sprites stay.
- `src/boss.js`: boss body redrawn in red (procedural drawing); `drawGlow` and `splitEllipse` removed.
- `src/fx.js`, `src/enemies.js`: the `glow` particle kind and its emission removed; the gore palette loses its blue entry.
- `src/player.js`, `src/main.js`, `src/config.js`, `src/hud.js`, `src/audio.js`: disc cutter (already implemented, unchanged).
- `src/test.js`: the blue split, glow and DNA tests are replaced by red-only and anatomy tests; disc cutter tests stay.
- README game rules and credits are updated to describe the realistic red crayfish.
- No new dependencies; file size about the same.
