# Spec Delta

## MODIFIED Requirements

### Requirement: Level sequence
The game SHALL contain five reels played in order: the mofa ride up the road to TC Wollerau, the TC Wollerau clay courts, the Krebsbach creek and sports fields, the clubhouse/indoor hall, then the boss arena.

#### Scenario: Progressing to the boss
- **WHEN** the hero exits the clubhouse level (reel 4)
- **THEN** the boss arena starts

#### Scenario: From the road to the courts
- **WHEN** the mofa reaches the club gate at the end of reel 1
- **THEN** the clay courts (reel 2) follow

### Requirement: Start level from the URL
The game SHALL accept a URL fragment parameter `level=N` (N = 1..5, the reel number: 1 mofa ride, 2 courts, 3 creek, 4 clubhouse, 5 boss arena), also next to other fragment flags such as `debug`. While it is present and valid, every new game started from the title SHALL begin at that level with score 0, full health and 3 lives, with the weapon that level normally starts with. Missing or invalid values SHALL leave the normal start at reel 1.

#### Scenario: Starting at the boss arena
- **WHEN** the game is opened with `#level=5` and the player presses Enter on the title screen
- **THEN** the "MISSING REEL" and "FINAL REEL" cards play and the boss arena starts with score 0, full health, 3 lives and the disc cutter

#### Scenario: Starting at a middle level
- **WHEN** the game is opened with `#level=2` and the player presses Enter on the title screen
- **THEN** the "REEL 2" card plays and the clay courts start with score 0, full health, 3 lives and the standard blaster

#### Scenario: Next game starts there again
- **WHEN** a game started via `#level=3` ends in game over or victory and the player starts a new game from the title
- **THEN** the new game starts at reel 3 again

#### Scenario: Combined with other flags
- **WHEN** the game is opened with `#debug&level=3`
- **THEN** the debug overlay is on and new games start at reel 3

#### Scenario: Invalid values ignored
- **WHEN** the fragment holds `level=0`, `level=6`, `level=x` or no level parameter
- **THEN** new games start at reel 1, the mofa ride

#### Scenario: Progress continues normally
- **WHEN** a game started at reel 3 completes that level
- **THEN** reel 4 follows, and after reel 4 the boss arena

#### Scenario: Old boss links
- **WHEN** the game is opened with `#level=4`
- **THEN** new games start at the clubhouse (reel 4), not at the boss arena

### Requirement: Clubhouse furniture platforms
Restaurant tables and the bar counter in the clubhouse SHALL behave as one-way platforms: the hero and enemies can stand on their tops, jump up through them from below and walk past them at floor level. Chairs, stools and other decoration SHALL NOT block movement. The clubhouse level SHALL remain completable.

#### Scenario: Standing on a table
- **WHEN** the hero jumps onto a restaurant table from the floor
- **THEN** the hero lands and stands on the tabletop

#### Scenario: Walking past furniture
- **WHEN** the hero walks along the floor past chairs, stools, tables and the bar counter
- **THEN** none of them block horizontal movement

#### Scenario: Level 3 completable
- **WHEN** the level reachability check runs on the refurnished clubhouse level
- **THEN** the exit, both keys and all pickups are reachable from the start

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
- **WHEN** the hero walks through the clay courts, the creek or the clubhouse
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
- **WHEN** the hero touches a weapon pickup on the clay courts, at the creek or in the clubhouse
- **THEN** he gets the Mega Blaster as before
