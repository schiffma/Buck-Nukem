# Spec Delta

## ADDED Requirements

### Requirement: Petrol engine sound
Each gardener-punk's mower on screen SHALL make a continuous two-stroke engine sound, louder the closer it is to the hero, for at most the 2 nearest mowers at once. Pitch and loudness SHALL follow the engine state: idle putt-putt while patrolling, rising during the rev, full-throttle roar while charging. One-shot petrol sounds SHALL mark engine start, rev, charge start and death.

#### Scenario: Running engine
- **WHEN** a patrolling punk is on screen and audio is on
- **THEN** a continuous engine sound plays for his mower with a pulsing two-stroke rhythm

#### Scenario: Distance and voice limit
- **WHEN** three punks are on screen at different distances from the hero
- **THEN** only the 2 nearest have an engine sound, and the nearer one is louder

#### Scenario: State-dependent pitch
- **WHEN** a punk goes from patrolling to revving to charging
- **THEN** the engine pitch rises at each step and is highest while charging

#### Scenario: Engine start and death sounds
- **WHEN** a punk first comes on screen, and later when he is killed
- **THEN** a pull-start sputter plays when his engine starts, and a choke-and-die sputter plays when he dies, after which his engine sound stops

#### Scenario: Engine stops
- **WHEN** a punk's mower leaves the screen, the game is paused, the level ends or the game leaves play
- **THEN** its engine sound fades out within a quarter of a second

#### Scenario: Mute
- **WHEN** the player presses M while engines are running
- **THEN** the engine sounds are silent until M is pressed again
