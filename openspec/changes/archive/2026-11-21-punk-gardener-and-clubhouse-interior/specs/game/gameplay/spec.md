# Spec Delta

## ADDED Requirements

### Requirement: Clubhouse furniture platforms
Restaurant tables and the bar counter in the clubhouse SHALL behave as one-way platforms: the hero and enemies can stand on their tops, jump up through them from below and walk past them at floor level. Chairs, stools and other decoration SHALL NOT block movement. Level 3 SHALL remain completable.

#### Scenario: Standing on a table
- **WHEN** the hero jumps onto a restaurant table from the floor
- **THEN** the hero lands and stands on the tabletop

#### Scenario: Walking past furniture
- **WHEN** the hero walks along the floor past chairs, stools, tables and the bar counter
- **THEN** none of them block horizontal movement

#### Scenario: Level 3 completable
- **WHEN** the level reachability check runs on the refurnished level 3
- **THEN** the exit, both keys and all pickups are reachable from the start
