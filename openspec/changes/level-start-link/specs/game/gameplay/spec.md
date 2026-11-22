# Spec Delta

## ADDED Requirements

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
