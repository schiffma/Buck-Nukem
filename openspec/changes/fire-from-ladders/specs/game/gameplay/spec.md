# Spec Delta

## MODIFIED Requirements

### Requirement: Climbable ladders
Levels SHALL contain ladders that the hero can climb up and down with Up/Down while overlapping them. While on a ladder, Left/Right SHALL turn the hero to face that side without leaving the ladder.

#### Scenario: Climbing a ladder
- **WHEN** the hero overlaps a ladder and the player holds Up
- **THEN** the hero moves upward without gravity until leaving the ladder's top

#### Scenario: Turning on a ladder
- **WHEN** the hero is on a ladder and the player presses Left or Right
- **THEN** the hero faces that side and stays on the ladder at the same position

### Requirement: Shooting
The hero SHALL fire a projectile in the facing direction when the player presses X, Ctrl (left or right) or Alt, limited to a fixed fire rate, whether standing, running, jumping or on a ladder. Projectiles SHALL disappear when they hit a solid tile, hit an enemy, or leave the screen, and SHALL never appear on the far side of a wall the hero is touching.

#### Scenario: Shot damages an enemy
- **WHEN** a hero projectile overlaps an enemy
- **THEN** the projectile disappears and the enemy loses health

#### Scenario: Fire rate limit
- **WHEN** the player holds Fire continuously for one second
- **THEN** no more than the configured number of shots per second are fired

#### Scenario: Firing with Ctrl
- **WHEN** the player presses Left Ctrl or Right Ctrl during play
- **THEN** the hero fires a shot in the facing direction and the browser performs no default action for the key

#### Scenario: Firing on a ladder
- **WHEN** the hero is on a ladder (also right after a brief tap of Up at its foot) and the player presses Fire
- **THEN** a shot is fired in the facing direction at the normal fire rate and the hero stays on the ladder

#### Scenario: Touching a wall
- **WHEN** the hero stands pressed against a wall one tile thick and fires toward it
- **THEN** sparks appear at the wall and no projectile appears or travels on the far side of the wall

#### Scenario: Firing works in every situation
- **WHEN** the player holds Fire while standing, running, jumping, on a ladder, right after being hit, or next to a cheering fan
- **THEN** shots are fired in every case
