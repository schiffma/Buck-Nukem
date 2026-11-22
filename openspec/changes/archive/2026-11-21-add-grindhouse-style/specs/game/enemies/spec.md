# Spec Delta

## MODIFIED Requirements

### Requirement: Enemy hit feedback
An enemy hit by a projectile SHALL flash briefly and spill a few drops of blood (oil and sparks for robots). A defeated enemy SHALL burst into a cartoon pixel splatter with a few gibs, leave temporary stains on nearby tiles, and award points by type.

#### Scenario: Hit flash
- **WHEN** a projectile hits an enemy that survives
- **THEN** the enemy flashes white for a few frames and a few blood droplets fly from the hit point

#### Scenario: Lawyer or crayfish defeated
- **WHEN** a lawyer's or crayfish's health reaches 0
- **THEN** red blood particles and several gib pieces fly out, fall with gravity, and red stains appear on solid tiles within a short radius

#### Scenario: Robot defeated
- **WHEN** a gardener robot's health reaches 0
- **THEN** it bursts into black oil, sparks and metal debris instead of blood

#### Scenario: Stains fade
- **WHEN** 20 seconds have passed since a stain was created, or more than 64 stains exist
- **THEN** the oldest stains disappear so stains never accumulate without limit
