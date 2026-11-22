# Spec Delta

## ADDED Requirements

### Requirement: Gardener-punk enemy
Gardener-punks SHALL patrol their platform pushing a lawn mower without walking off edges, and the running mower SHALL cost the hero 2 health on contact. A punk SHALL take 5 standard hits. He SHALL be drawn with a mohawk, a leather vest and a smoking blunt; the blunt is cosmetic only.

#### Scenario: Punk turns at a ledge
- **WHEN** a patrolling punk reaches the edge of its platform
- **THEN** it turns around instead of falling

#### Scenario: Mower contact
- **WHEN** the hero touches a punk's mower and is not invulnerable
- **THEN** the hero loses 2 health

#### Scenario: Blunt smoke
- **WHEN** a punk is on screen
- **THEN** small grey smoke puffs rise from his blunt every second or so, without affecting gameplay

### Requirement: Mower charge
When the hero is in front of a gardener-punk at roughly the same height and within about 6 tiles, the punk SHALL rev the mower for a short wind-up and then charge forward at high speed. The charge SHALL end at a ledge, a wall or after about 8 tiles, followed by a cooldown. While charging, the mower SHALL throw grass clippings and small stones forward as short-range projectiles that each cost 1 health.

#### Scenario: Wind-up before charging
- **WHEN** the hero stands in front of a punk within charge range
- **THEN** the punk stops, revs for about half a second with smoke puffs, and then moves toward the hero at least three times faster than his patrol speed

#### Scenario: Charge stops at a ledge
- **WHEN** a charging punk reaches the edge of his platform
- **THEN** the charge ends and the punk does not fall off

#### Scenario: Clippings and stones
- **WHEN** a punk is charging
- **THEN** grass and stone projectiles fly forward from the mower and disappear after a short distance or on hitting a wall

#### Scenario: No charge from behind
- **WHEN** the hero is behind a punk
- **THEN** the punk does not start a charge

## MODIFIED Requirements

### Requirement: Enemy hit feedback
An enemy hit by a projectile SHALL flash briefly and spill a few drops of blood (oil and sparks when a gardener-punk's mower is hit). A defeated enemy SHALL burst into a cartoon pixel splatter with a few gibs, leave temporary stains on nearby tiles, and award points by type.

#### Scenario: Hit flash
- **WHEN** a projectile hits an enemy that survives
- **THEN** the enemy flashes white for a few frames and a few blood droplets fly from the hit point

#### Scenario: Lawyer or crayfish defeated
- **WHEN** a lawyer's or crayfish's health reaches 0
- **THEN** red blood particles and several gib pieces fly out, fall with gravity, and red stains appear on solid tiles within a short radius

#### Scenario: Gardener-punk defeated
- **WHEN** a gardener-punk's health reaches 0
- **THEN** he bursts into red blood and gibs, and his mower explodes into black oil, sparks and metal debris

#### Scenario: Stains fade
- **WHEN** 20 seconds have passed since a stain was created, or more than 64 stains exist
- **THEN** the oldest stains disappear so stains never accumulate without limit

## REMOVED Requirements

### Requirement: Crazy gardener robot enemy
**Reason**: The gardener robot is replaced by the human gardener-punk with a lawn mower, which fits the grindhouse tone better.
**Migration**: Level maps keep the `M` letter; it now spawns a gardener-punk. See "Gardener-punk enemy" and "Mower charge".
