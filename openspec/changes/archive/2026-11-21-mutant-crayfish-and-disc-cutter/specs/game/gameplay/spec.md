# Spec Delta

## ADDED Requirements

### Requirement: Disc cutter in the boss arena
When the boss arena starts, the hero SHALL switch to a giant disc cutter and keep it for the whole arena, including after respawning there. It fires spinning saw blades with the normal fire keys: bigger and slower than blaster shots, at most 3 per second, 3 damage each. Blades disappear on solid tiles and enemies, and follow the boss's face/shell rules.

#### Scenario: Weapon switch on arena start
- **WHEN** the boss arena's intro card ends and play begins
- **THEN** the hero's weapon is the disc cutter and the HUD shows "DISC CUTTER" with its icon

#### Scenario: Saw blade fire rate and damage
- **WHEN** the player holds Fire for one second in the boss arena
- **THEN** at most 3 saw blades are fired, each at least 12 pixels in diameter and spinning, and a blade hitting the boss's exposed face removes 3 boss health

#### Scenario: Blades deflect off the shell
- **WHEN** a saw blade hits the boss's shell or closed claws
- **THEN** the boss takes no damage, the blade is deflected and sparks fly

#### Scenario: Blades cut small crayfish
- **WHEN** a saw blade flies at a small crayfish on the ground in the arena
- **THEN** the blade hits it, because the blade is tall enough to reach ground level

#### Scenario: Kept after respawn
- **WHEN** the hero loses a life in the boss arena and respawns there
- **THEN** the weapon is still the disc cutter

#### Scenario: Normal levels unchanged
- **WHEN** a regular level (1–3) starts
- **THEN** the hero has the blaster, and the Mega Blaster power-up works as before

#### Scenario: Grinder sound
- **WHEN** the hero fires a saw blade
- **THEN** a high-pitched grinder whine plays instead of the blaster sound
