# game/gameplay Specification

## Purpose

Defines how the player controls Buck Nukem, fights, takes damage, scores, and progresses through the levels to win or lose the game.

## Requirements

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
- **WHEN** a projectile such as a thrown law book flies at the hero's chest height while he kneels
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

### Requirement: Wide tactical boss arena
The boss arena SHALL be 40 x 15 tiles (two screens wide), with the hero starting at the left end and the boss holding the right part. The camera SHALL scroll with the hero and keep him near the left edge of the screen, so the view shows mostly the arena towards the boss. The arena SHALL offer one-way platforms on at least three heights, reachable by jumping or ladders, from which the boss's face can be hit, plus health spots on more than one height and 4–5 fans.

#### Scenario: Arena size and scrolling
- **WHEN** the boss arena starts
- **THEN** its map is 40 x 15 tiles, the hero starts in the left screen, the boss starts in the right screen, and the camera follows the hero across both screens

#### Scenario: Hero kept on the left
- **WHEN** the hero walks right through the middle of the arena (away from both map edges)
- **THEN** his centre stays between 60 and 100 pixels from the left edge of the screen, whichever way he faces

#### Scenario: Same framing after respawn
- **WHEN** the hero respawns in the boss arena
- **THEN** the camera is placed with the hero at that left position (or as far as the map edge allows)

#### Scenario: Map edge
- **WHEN** the hero is near the right end of the arena
- **THEN** the camera stops at the map edge and the hero moves further right on the screen

#### Scenario: Other levels unchanged
- **WHEN** the hero walks through levels 1 to 3
- **THEN** the camera keeps him near the middle of the screen as before

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

### Requirement: Start level from the URL
The game SHALL accept a URL fragment parameter `level=N` (N = 1..4, the reel number: 1 courts, 2 creek, 3 clubhouse, 4 boss arena), also next to other fragment flags such as `debug`. While it is present and valid, every new game started from the title SHALL begin at that level with score 0, full health and 3 lives, with the weapon that level normally starts with. Missing or invalid values SHALL leave the normal start at level 1.

#### Scenario: Starting at the boss arena
- **WHEN** the game is opened with `#level=4` and the player presses Enter on the title screen
- **THEN** the "MISSING REEL" and "FINAL REEL" cards play and the boss arena starts with score 0, full health, 3 lives and the disc cutter

#### Scenario: Starting at a middle level
- **WHEN** the game is opened with `#level=2` and the player presses Enter on the title screen
- **THEN** the "REEL 2" card plays and level 2 starts with score 0, full health, 3 lives and the standard blaster

#### Scenario: Next game starts there again
- **WHEN** a game started via `#level=3` ends in game over or victory and the player starts a new game from the title
- **THEN** the new game starts at level 3 again

#### Scenario: Combined with other flags
- **WHEN** the game is opened with `#debug&level=3`
- **THEN** the debug overlay is on and new games start at level 3

#### Scenario: Invalid values ignored
- **WHEN** the fragment holds `level=0`, `level=5`, `level=x` or no level parameter
- **THEN** new games start at level 1 as before

#### Scenario: Progress continues normally
- **WHEN** a game started at level 2 completes that level
- **THEN** level 3 follows, and after level 3 the boss arena

### Requirement: Mega Cutter upgrade
The boss arena SHALL contain a disc-cutter upgrade on its highest platform. Touching it SHALL turn the disc cutter into the Mega Cutter until the hero loses a life: each shot fires two blades (one level, one angled slightly upward) dealing 5 damage each, at the normal cutter fire rate. While the hero lacks the upgrade, the pickup SHALL reappear at its spot 20 seconds after it was taken.

#### Scenario: Collecting the upgrade
- **WHEN** the hero touches the upgrade pickup on the top platform of the boss arena
- **THEN** the HUD shows "MEGA CUTTER" and every following shot fires two blades of 5 damage each

#### Scenario: Stronger against the boss
- **WHEN** a Mega Cutter blade hits the boss's exposed face
- **THEN** the boss loses 5 health; blades hitting the shell or closed claws are still deflected and do no damage

#### Scenario: Lost with a life
- **WHEN** the hero with the Mega Cutter loses a life in the boss arena and respawns
- **THEN** he has the plain disc cutter again

#### Scenario: Pickup comes back
- **WHEN** 20 seconds have passed since the upgrade was taken and the hero does not have the Mega Cutter
- **THEN** the upgrade pickup is back at its spot on the top platform

#### Scenario: Other levels unchanged
- **WHEN** the hero touches a weapon pickup in levels 1 to 3
- **THEN** he gets the Mega Blaster as before

### Requirement: Boss reveal at arena start
When the boss arena starts after its reel intro card, the camera SHALL pan from the hero to the boss, hold on the boss while it raises its claws, and pan back, taking about 3 seconds. During the reveal the hero SHALL not move or shoot and the boss SHALL not attack. Pressing Jump or Fire SHALL skip the rest of the reveal. The reveal SHALL not play when the hero respawns in the arena.

#### Scenario: Boss shown at the start
- **WHEN** the boss arena's intro card ends
- **THEN** within the next 1.5 seconds the whole boss is inside the camera view, and after about 3 seconds the camera is back on the hero and play begins

#### Scenario: No attacks during the reveal
- **WHEN** the reveal is running
- **THEN** the boss makes no attack, the hero does not move although movement keys are held, and no shots are fired

#### Scenario: Skipping the reveal
- **WHEN** the player presses Jump or Fire during the reveal
- **THEN** the camera returns to the hero and play begins within half a second

#### Scenario: Not on respawn
- **WHEN** the hero loses a life in the boss arena and respawns
- **THEN** play continues at once without a reveal
