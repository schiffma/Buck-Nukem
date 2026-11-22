# Spec Delta

## MODIFIED Requirements

### Requirement: Boss attack patterns
The boss SHALL cycle through at least three attacks: a claw slam that shakes the screen and sends a shockwave along the floor, a spray of bubble projectiles in an arc, and summoning small mutant crayfish. Below half health it SHALL attack faster. The shockwave SHALL stop at the first solid tile or crate in its path and damage breakable crates it hits; bubbles SHALL burst on solid tiles and crates. Summoned crayfish SHALL appear inside the visible part of the arena, left of the boss.

#### Scenario: Enraged phase
- **WHEN** the boss's health drops below 50 %
- **THEN** pauses between its attacks become shorter

#### Scenario: Boss summons minions
- **WHEN** the boss performs its summon attack
- **THEN** small mutant crayfish appear in the arena, each within the current camera view and left of the boss

#### Scenario: Shockwave stopped by cover
- **WHEN** the shockwave reaches a crate or a solid tile on the floor
- **THEN** it disappears there, with a dust burst, and a breakable crate it hit loses 3 strength
