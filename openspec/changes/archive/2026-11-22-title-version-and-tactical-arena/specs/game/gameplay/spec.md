# Spec Delta

## ADDED Requirements

### Requirement: Wide tactical boss arena
The boss arena SHALL be 40 tiles wide and 15 tiles high (two screens wide) and the camera SHALL scroll with the hero. The hero SHALL start at the left end and the boss SHALL hold the right part of the arena. The arena SHALL offer one-way platforms on at least three different heights above the floor, reachable by jumping or by ladders, from which the boss's face can be hit, plus health spots on more than one height and 4–5 fans.

#### Scenario: Arena size and scrolling
- **WHEN** the boss arena starts
- **THEN** its map is 40 x 15 tiles, the hero starts in the left screen, the boss starts in the right screen, and the camera follows the hero across both screens

#### Scenario: Platforms on several heights
- **WHEN** the arena map is inspected
- **THEN** it has one-way platforms on at least three different rows above the floor, each reachable from the floor (checked by the level checker), and at least one platform tile within reach of a disc-cutter blade line that hits the boss's face

#### Scenario: Above the shockwave
- **WHEN** the boss's claw slam sends its shockwave while the hero stands on a platform
- **THEN** the shockwave passes below him and he takes no damage

#### Scenario: Still beatable
- **WHEN** the level checker runs
- **THEN** the boss is reachable from the start in the boss arena

### Requirement: Cover crates
The boss arena SHALL contain at least two sturdy and three breakable cover crates: solid one-tile blocks that stop movement, projectiles, shockwaves and minions, and that the hero can stand on. Sturdy crates can't be destroyed; breakable crates SHALL have 6 strength (blaster shot 1, saw blade 3, shockwave 3) and leave an empty tile when broken. The boss SHALL stay reachable even if no crate is ever broken.

#### Scenario: Cover against the shockwave
- **WHEN** the boss's shockwave runs into a crate
- **THEN** the shockwave stops there and the hero behind the crate takes no damage

#### Scenario: Kneeling behind a crate
- **WHEN** the hero kneels directly behind a crate on the side away from the boss
- **THEN** he is no taller than the crate, the shockwave stops at the crate, and his own low shots also hit the crate (to shoot past it he must stand on it or jump)

#### Scenario: Breaking a crate
- **WHEN** a breakable crate takes 6 damage in total from hero shots or shockwaves
- **THEN** it breaks, its tile becomes empty and the hero can walk and shoot through that spot

#### Scenario: Sturdy crate holds
- **WHEN** a sturdy crate is hit by any number of shots or shockwaves
- **THEN** it stays in place, and shots that hit it disappear

#### Scenario: Crates reset
- **WHEN** the hero loses a life in the boss arena and respawns
- **THEN** crates that were broken stay broken (the arena is not reloaded), and restarting the game restores them

### Requirement: Ledge stagger
When the hero takes a hit while standing on a one-way platform, he SHALL only stagger back a short way (at most one tile) instead of the full knockback, so hits don't throw him off ledges. On solid ground the full knockback stays.

#### Scenario: Hit on a ledge
- **WHEN** the hero is hit while standing on a 3-tile one-way platform
- **THEN** he is pushed back by at most 16 pixels and is still standing on the platform

#### Scenario: Hit on the floor
- **WHEN** the hero is hit while standing on solid ground
- **THEN** he is knocked back as before, clearly further than on a ledge
