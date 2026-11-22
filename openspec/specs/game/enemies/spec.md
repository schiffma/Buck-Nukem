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
Lawyers SHALL be women in skirt suits with short hair. They SHALL walk back and forth on their platform without walking off edges. When the hero is on roughly the same height and in front of them, they SHALL stop and throw a Swiss law book toward the hero, sometimes calling out a short legal line. A lawyer SHALL take 3 standard hits.

#### Scenario: Lawyer turns at a ledge
- **WHEN** a walking lawyer reaches the edge of its platform
- **THEN** it turns around instead of falling

#### Scenario: Lawyer attacks
- **WHEN** the hero is in front of a lawyer at a similar height within attack range
- **THEN** the lawyer throws a law book toward the hero (same arc, speed and 1 damage as the former briefcase)

#### Scenario: Book bursts with an article
- **WHEN** a law book hits the hero or a solid tile
- **THEN** it disappears in a burst of fluttering pages and a short floating label names an article of that book's code (for example "ART. 41 OR")

#### Scenario: Legal one-liners
- **WHEN** a lawyer throws
- **THEN** she may show a speech bubble with a line from a pool of at least 8 legal lines (each at most 20 characters, drawable with the game font, at least half of them naming a Swiss code or article); each lawyer speaks at most once per 4 seconds, at most one lawyer bubble shows at a time, and a bubble disappears after about 1.5 seconds

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
The boss SHALL cycle through a claw slam with a floor shockwave, a bubble spray in an arc, and summoning small mutant crayfish on screen left of it, but SHALL summon at most 3 times per boss fight and then alternate slam and bubbles. Below half health it SHALL attack faster. The shockwave SHALL stop at the first solid tile or crate and damage breakable crates; bubbles SHALL burst on solid tiles and crates.

#### Scenario: Enraged phase
- **WHEN** the boss's health drops below 50 %
- **THEN** pauses between its attacks become shorter

#### Scenario: Boss summons minions
- **WHEN** the boss performs its summon attack
- **THEN** small mutant crayfish appear in the arena, each within the current camera view and left of the boss

#### Scenario: Only three summons
- **WHEN** the boss fight runs through at least 6 full attack cycles
- **THEN** the boss has summoned exactly 3 times, and every later cycle consists of a claw slam and a bubble spray only

#### Scenario: Respawn does not reset the summons
- **WHEN** the hero loses a life in the boss arena after the boss has summoned 3 times, and respawns there
- **THEN** the boss still does not summon again

#### Scenario: New game resets the summons
- **WHEN** a new game reaches the boss arena (or the arena is loaded again)
- **THEN** the boss can summon 3 times again

#### Scenario: Shockwave stopped by cover
- **WHEN** the shockwave reaches a crate or a solid tile on the floor
- **THEN** it disappears there, with a dust burst, and a breakable crate it hit loses 3 strength

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
