# game/enemies Specification

## Purpose

Defines the enemies the hero fights (lawyers, mutant crayfish, crazy gardener robots) and the giant mutant crayfish final boss, including how each moves, attacks and is defeated.

## Requirements

### Requirement: Enemy activation
Enemies SHALL stay inactive until they are within about one screen width of the visible area, so off-screen enemies do not attack the hero.

#### Scenario: Distant enemy is idle
- **WHEN** an enemy is more than one screen width beyond the visible area
- **THEN** it does not move or fire

### Requirement: Lawyer enemy
Lawyers SHALL walk back and forth on their platform without walking off edges. When the hero is on roughly the same height and in front of them, they SHALL stop and throw a briefcase projectile toward the hero. A lawyer SHALL take 3 standard hits.

#### Scenario: Lawyer turns at a ledge
- **WHEN** a walking lawyer reaches the edge of its platform
- **THEN** it turns around instead of falling

#### Scenario: Lawyer attacks
- **WHEN** the hero is in front of a lawyer at a similar height within attack range
- **THEN** the lawyer throws a briefcase toward the hero

### Requirement: Mutant crayfish enemy
Mutant crayfish SHALL scuttle along the ground and periodically leap toward the hero; in creek areas they SHALL emerge from the water. Touching one SHALL damage the hero. A crayfish SHALL take 2 standard hits.

#### Scenario: Crayfish leap
- **WHEN** the hero is within leaping range of a crayfish
- **THEN** the crayfish jumps in an arc toward the hero's position

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

### Requirement: Giant mutant crayfish boss
The boss arena SHALL contain a giant mutant crayfish, several times the hero's size, with a health bar shown on screen. It SHALL take damage only on its face/eye stalks, which are exposed while its claws are raised; shots hitting its shell or closed claws SHALL be deflected.

#### Scenario: Boss health bar
- **WHEN** the boss arena starts
- **THEN** a boss health bar appears and shrinks as the boss takes damage

#### Scenario: Shell deflects shots
- **WHEN** a hero projectile hits the boss's shell
- **THEN** the projectile is deflected and the boss takes no damage

### Requirement: Boss attack patterns
The boss SHALL cycle through at least three attacks: a claw slam that shakes the screen, a spray of bubble projectiles in an arc, and summoning small mutant crayfish. Below half health it SHALL attack faster.

#### Scenario: Enraged phase
- **WHEN** the boss's health drops below 50 %
- **THEN** pauses between its attacks become shorter

#### Scenario: Boss summons minions
- **WHEN** the boss performs its summon attack
- **THEN** small mutant crayfish appear in the arena

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
