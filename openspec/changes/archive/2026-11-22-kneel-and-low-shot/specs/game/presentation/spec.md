# Spec Delta

## MODIFIED Requirements

### Requirement: Title and end screens
The game SHALL show a title screen styled as a 1970s exploitation-movie poster: the game name "BUCK NUKEM" in large distressed, outlined lettering, a tagline, a fake rating badge, the pixelated portrait from the hero photo, a controls summary and "PRESS ENTER". It SHALL also have level-complete, game-over and victory screens; game over and victory SHALL be styled as "THE END" film cards.

#### Scenario: Starting the game
- **WHEN** the player presses Enter on the title screen
- **THEN** level 1 starts with score 0, full health and 3 lives

#### Scenario: Controls summary
- **WHEN** the title screen is shown
- **THEN** the controls list shows Space for jump, X/Ctrl/Alt for fire and Up/Down for climbing and kneeling

## ADDED Requirements

### Requirement: Kneeling pose
While kneeling, the hero SHALL be drawn in a kneeling pose: one knee on the ground, the other leg bent forward, the torso and head lowered accordingly, and the gun held level at knee height. The pose SHALL have a shooting variant with the muzzle flash at the lowered gun, and a disc-cutter variant in the boss arena. The pose SHALL keep the hero's palette, outline style and facing direction.

#### Scenario: Kneeling sprite
- **WHEN** the hero kneels facing right
- **THEN** the kneeling frame is drawn, its feet on the hero's floor and its top about one third lower than the standing frame's top

#### Scenario: Muzzle flash at knee height
- **WHEN** the kneeling hero fires the blaster
- **THEN** the muzzle flash appears at the lowered gun, at the height where the shot leaves

#### Scenario: Disc cutter while kneeling
- **WHEN** the hero kneels in the boss arena
- **THEN** he holds the disc cutter in the kneeling pose
