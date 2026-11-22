# Spec Delta

## MODIFIED Requirements

### Requirement: Keyboard movement and jumping
The game SHALL let the player move the hero left and right with the arrow keys or A/D, and jump with Space (Up/W and Down/S are reserved for ladders; Ctrl fires). Gravity SHALL apply, and solid tiles SHALL block the hero from all sides.

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

### Requirement: Shooting
The hero SHALL fire a projectile in the facing direction when the player presses X, Ctrl (left or right) or Alt, limited to a fixed fire rate. Projectiles SHALL disappear when they hit a solid tile, hit an enemy, or leave the screen.

#### Scenario: Shot damages an enemy
- **WHEN** a hero projectile overlaps an enemy
- **THEN** the projectile disappears and the enemy loses health

#### Scenario: Fire rate limit
- **WHEN** the player holds Fire continuously for one second
- **THEN** no more than the configured number of shots per second are fired

#### Scenario: Firing with Ctrl
- **WHEN** the player presses Left Ctrl or Right Ctrl during play
- **THEN** the hero fires a shot in the facing direction and the browser performs no default action for the key
