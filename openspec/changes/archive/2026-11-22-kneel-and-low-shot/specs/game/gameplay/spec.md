# Spec Delta

## MODIFIED Requirements

### Requirement: Keyboard movement and jumping
The game SHALL let the player move the hero left and right with the arrow keys or A/D, and jump with Space. Up/W climbs ladders; Down/S climbs down ladders and otherwise makes the hero kneel; Ctrl fires. Gravity SHALL apply, and solid tiles SHALL block the hero from all sides.

#### Scenario: Walking stops at a wall
- **WHEN** the player holds Right while the hero stands next to a solid tile on the right
- **THEN** the hero does not move into the tile

#### Scenario: Jump from ground only
- **WHEN** the player presses Jump while the hero is in mid-air
- **THEN** no additional jump is performed

#### Scenario: Variable jump height
- **WHEN** the player releases Jump early during the rise
- **THEN** the jump is lower than when Jump is held to the apex

#### Scenario: Ctrl does not jump
- **WHEN** the player presses Ctrl while the hero stands on the ground
- **THEN** the hero does not jump

## ADDED Requirements

### Requirement: Kneeling and low shots
While the player holds Down and the hero stands on the ground (not on a ladder top), the hero SHALL kneel: he does not walk, Left/Right only turn him, his shots leave at knee height (low enough to hit a crayfish on the ground) and only his lower body can be hit. Releasing Down SHALL make him stand up when there is room above him. Jump while kneeling on solid ground SHALL be a normal jump.

#### Scenario: Kneel stops the hero
- **WHEN** the hero runs right and the player presses and holds Down
- **THEN** the hero kneels and comes to a stop, and holding Left turns him to face left without moving him

#### Scenario: Low shot kills a ground crayfish
- **WHEN** a crayfish stands on the ground within range in front of the kneeling hero and the player holds Fire
- **THEN** the shots hit the crayfish and it is defeated after the usual 2 standard hits

#### Scenario: Standing shot still misses a ground crayfish
- **WHEN** the hero stands (not kneeling) and fires at a crayfish on the ground
- **THEN** the shot flies over the crayfish

#### Scenario: Ducking under a briefcase
- **WHEN** a projectile flies at the hero's chest height while he kneels
- **THEN** it passes over him and he takes no damage

#### Scenario: Still hurt by contact
- **WHEN** a crayfish walks into the kneeling hero
- **THEN** the hero takes damage as usual

#### Scenario: Low ceiling
- **WHEN** the hero kneels under a solid tile that leaves no room to stand and the player releases Down
- **THEN** the hero stays kneeling until he is no longer under the tile

#### Scenario: Ladder top keeps climbing down
- **WHEN** the hero stands on a ladder top and the player holds Down
- **THEN** the hero climbs down the ladder instead of kneeling

### Requirement: Dropping through one-way platforms
The hero SHALL drop through a one-way platform (clubhouse tables and bar counter, ledges) when the player presses Jump while holding Down on it. Holding Down alone SHALL make the hero kneel on the platform without dropping. All levels SHALL remain completable.

#### Scenario: Down plus Jump drops through
- **WHEN** the hero kneels on a one-way platform and the player presses Jump
- **THEN** the hero falls through the platform to the floor below

#### Scenario: Down alone does not drop
- **WHEN** the hero stands on a one-way platform and the player holds Down for one second
- **THEN** the hero kneels and stays on the platform

#### Scenario: Levels stay completable
- **WHEN** the level reachability check runs
- **THEN** every level's exit, keys and pickups are reachable as before
