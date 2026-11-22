# Spec Delta

## MODIFIED Requirements

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
