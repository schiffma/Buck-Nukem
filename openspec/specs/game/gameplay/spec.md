# game/gameplay Specification

## Purpose

Defines how the player controls Buck Nukem, fights, takes damage, scores, and progresses through the levels to win or lose the game.

## Requirements

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

### Requirement: Climbable ladders
Levels SHALL contain ladders that the hero can climb up and down with Up/Down while overlapping them.

#### Scenario: Climbing a ladder
- **WHEN** the hero overlaps a ladder and the player holds Up
- **THEN** the hero moves upward without gravity until leaving the ladder's top

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

### Requirement: Weapon power-up
Levels SHALL contain a weapon pickup that increases the hero's firepower (faster shots that deal more damage) until the hero loses a life.

#### Scenario: Collecting the power-up
- **WHEN** the hero touches the weapon pickup
- **THEN** subsequent shots use the upgraded weapon and the HUD shows the upgraded weapon

### Requirement: Health and lives
The hero SHALL have 8 health points and start with 3 lives. Contact with an enemy or an enemy projectile SHALL cost health, followed by a short invulnerability period with the hero blinking. Reaching 0 health or falling out of the level SHALL cost a life and restart the hero at the last checkpoint with full health.

#### Scenario: Taking damage
- **WHEN** an enemy projectile hits the hero while not invulnerable
- **THEN** the hero loses health, blinks, and cannot be damaged again for about one second

#### Scenario: Losing a life
- **WHEN** the hero's health reaches 0 and lives remain
- **THEN** one life is removed and the hero respawns at the last checkpoint with full health

### Requirement: Game over
When the hero loses their last life, the game SHALL show a game-over screen with the final score and return to the title screen on a key press.

#### Scenario: Last life lost
- **WHEN** the hero's health reaches 0 with no lives remaining
- **THEN** the game-over screen with the final score appears

### Requirement: Pickups and score
Levels SHALL contain collectibles that award points (tennis balls, trophies), health pickups (e.g. Rivella bottles, Cervelat sausages) that restore health up to the maximum, and extra-life pickups. Defeating an enemy SHALL award points.

#### Scenario: Health pickup at full health
- **WHEN** the hero touches a health pickup with full health
- **THEN** health stays at the maximum and the pickup is consumed

#### Scenario: Defeating an enemy awards points
- **WHEN** an enemy's health reaches 0
- **THEN** the enemy is removed with an explosion effect and the score increases

### Requirement: Keys, doors and level exit
Each level SHALL have an exit that ends the level. Levels MAY contain locked doors that open only when the hero carries the matching coloured key card.

#### Scenario: Locked door without key
- **WHEN** the hero touches a locked door without the matching key
- **THEN** the door stays closed and blocks the hero

#### Scenario: Reaching the exit
- **WHEN** the hero touches the level exit
- **THEN** a level-complete screen shows the score bonus and the next level starts

### Requirement: Level sequence
The game SHALL contain three levels followed by a boss arena, played in order: TC Wollerau clay courts, Krebsbach creek and sports fields, the clubhouse/indoor hall, then the boss arena.

#### Scenario: Progressing to the boss
- **WHEN** the hero exits the third level
- **THEN** the boss arena starts

### Requirement: Checkpoints
Each level SHALL contain at least one checkpoint in addition to the level start. Touching a checkpoint SHALL make it the respawn point for that level.

#### Scenario: Respawn at checkpoint
- **WHEN** the hero has touched a checkpoint and then loses a life
- **THEN** the hero respawns at that checkpoint

### Requirement: Victory
Defeating the giant mutant crayfish SHALL end the game with a victory screen showing the final score.

#### Scenario: Boss defeated
- **WHEN** the boss's health reaches 0
- **THEN** a boss explosion plays and the victory screen with the final score appears

### Requirement: Pause
The player SHALL be able to pause and resume the game with P or Enter during play. While paused, nothing in the game world SHALL move.

#### Scenario: Pausing
- **WHEN** the player presses P during play
- **THEN** the game freezes and shows "PAUSED" until P is pressed again

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

### Requirement: Disc cutter in the boss arena
When the boss arena starts, the hero SHALL switch to a giant disc cutter and keep it for the whole arena, including after respawning there. It fires spinning saw blades with the normal fire keys: bigger and slower than blaster shots, at most 3 per second, 3 damage each. Blades disappear on solid tiles and enemies, and follow the boss's face/shell rules.

#### Scenario: Weapon switch on arena start
- **WHEN** the boss arena's intro card ends and play begins
- **THEN** the hero's weapon is the disc cutter and the HUD shows "DISC CUTTER" with its icon

#### Scenario: Saw blade fire rate and damage
- **WHEN** the player holds Fire for one second in the boss arena
- **THEN** at most 3 saw blades are fired, each at least 12 pixels in diameter and spinning, and a blade hitting the boss's exposed face removes 3 boss health

#### Scenario: Blades deflect off the shell
- **WHEN** a saw blade hits the boss's shell or closed claws
- **THEN** the boss takes no damage, the blade is deflected and sparks fly

#### Scenario: Blades cut small crayfish
- **WHEN** a saw blade flies at a small crayfish on the ground in the arena
- **THEN** the blade hits it, because the blade is tall enough to reach ground level

#### Scenario: Kept after respawn
- **WHEN** the hero loses a life in the boss arena and respawns there
- **THEN** the weapon is still the disc cutter

#### Scenario: Normal levels unchanged
- **WHEN** a regular level (1–3) starts
- **THEN** the hero has the blaster, and the Mega Blaster power-up works as before

#### Scenario: Grinder sound
- **WHEN** the hero fires a saw blade
- **THEN** a high-pitched grinder whine plays instead of the blaster sound
