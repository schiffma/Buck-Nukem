# Spec Delta

## ADDED Requirements

### Requirement: Petrol lawn mower
The gardener-punk's mower SHALL be drawn as a petrol lawn mower with an engine block, a fuel tank, a pull-start handle, an exhaust muffler, a deck and wheels. Exhaust smoke SHALL come from the muffler and follow the engine: light puffs while patrolling, thick dark clouds while revving, a dark trail while charging, none after death. Hitbox and behaviour stay unchanged.

#### Scenario: Petrol mower parts
- **WHEN** a gardener-punk sprite frame is built
- **THEN** the mower shows an engine block, a fuel tank, an exhaust muffler and wheels, and every opaque edge pixel borders a dark outline pixel

#### Scenario: Idle exhaust
- **WHEN** a patrolling punk is on screen for one second
- **THEN** at least three exhaust smoke puffs rise from the muffler position, separate from the blunt smoke

#### Scenario: Revving smoke
- **WHEN** a punk revs before a charge
- **THEN** exhaust smoke is emitted at least three times as often as while patrolling, and it is darker

#### Scenario: Charging trail
- **WHEN** a punk is charging
- **THEN** dark exhaust smoke is emitted behind the mower throughout the charge

#### Scenario: Engine dies with the punk
- **WHEN** a punk is killed
- **THEN** no further exhaust smoke is emitted for him

#### Scenario: Gameplay unchanged
- **WHEN** a gardener-punk is created
- **THEN** his hitbox, health, speeds, rev time, charge distance and contact damage are the same as before the redesign
