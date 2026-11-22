# Spec Delta

## MODIFIED Requirements

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
