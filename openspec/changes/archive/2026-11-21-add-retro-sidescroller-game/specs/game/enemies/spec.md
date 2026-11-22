# Spec Delta

## Purpose

Defines the enemies the hero fights (lawyers, mutant crayfish, crazy gardener robots) and the giant mutant crayfish final boss, including how each moves, attacks and is defeated.

## ADDED Requirements

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

### Requirement: Crazy gardener robot enemy
Gardener robots SHALL patrol with hedge-trimmers that damage on contact and SHALL periodically spray a short-range weedkiller cloud in the facing direction. A robot SHALL take 5 standard hits.

#### Scenario: Weedkiller spray
- **WHEN** the hero is within short range in front of a gardener robot
- **THEN** the robot emits a spray cloud that damages the hero on contact

### Requirement: Enemy hit feedback
An enemy hit by a projectile SHALL flash briefly. A defeated enemy SHALL explode into particles and award points by type.

#### Scenario: Hit flash
- **WHEN** a projectile hits an enemy that survives
- **THEN** the enemy flashes white for a few frames

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
