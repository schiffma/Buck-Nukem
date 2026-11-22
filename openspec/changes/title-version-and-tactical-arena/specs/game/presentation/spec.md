# Spec Delta

## MODIFIED Requirements

### Requirement: Title and end screens
The game SHALL show a title screen styled as a 1970s exploitation-movie poster: the game name "BUCK NUKEM" in large distressed, outlined lettering, a tagline, a fake rating badge, the pixelated portrait from the hero photo, a controls summary, "PRESS ENTER" and the build version in small print. It SHALL also have level-complete, game-over and victory screens; game over and victory SHALL be styled as "THE END" film cards.

#### Scenario: Starting the game
- **WHEN** the player presses Enter on the title screen
- **THEN** level 1 starts with score 0, full health and 3 lives

#### Scenario: Controls summary
- **WHEN** the title screen is shown
- **THEN** the controls list shows Space for jump, X/Ctrl/Alt for fire and Up/Down for climbing and kneeling

#### Scenario: Version shown
- **WHEN** the title screen is shown
- **THEN** the version text embedded by the build (for example "V1.0.2" or "V1.0.2-3-GAB12CD3") is drawn in small print in a corner of the poster, fully inside the screen, readable on the poster tint and not overlapping the other title elements

## ADDED Requirements

### Requirement: Cover crates look
Crates in the boss arena SHALL be drawn as outlined pixel-art wooden crates matching the creek theme. Sturdy crates SHALL look visibly reinforced (metal bands), so the player can tell them from breakable crates. A breakable crate SHALL show cracks as it takes damage and burst into wooden splinters with a crunch sound when it breaks.

#### Scenario: Two kinds distinguishable
- **WHEN** a sturdy and a breakable crate are drawn side by side
- **THEN** their tiles differ, and the sturdy one shows metal bands

#### Scenario: Damage and breaking visible
- **WHEN** a breakable crate has lost at least half its strength
- **THEN** it is drawn with cracks, and when it breaks splinter particles fly and a crate-break sound plays
