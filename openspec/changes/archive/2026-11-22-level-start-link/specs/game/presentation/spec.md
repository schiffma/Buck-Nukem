# Spec Delta

## ADDED Requirements

### Requirement: Start reel note on the title
When the URL selects a start level other than level 1, the title screen SHALL show a small note naming it: "STARTS AT REEL N" for levels 2 and 3, "STARTS AT FINAL REEL" for the boss arena. Without a valid level parameter, or with `level=1`, no note SHALL be shown.

#### Scenario: Note shown
- **WHEN** the title screen is shown with `#level=3`
- **THEN** the text "STARTS AT REEL 3" is drawn in small print, fully inside the screen, readable on the poster tint and not overlapping the other title elements (including the version text)

#### Scenario: Boss arena note
- **WHEN** the title screen is shown with `#level=4`
- **THEN** the text "STARTS AT FINAL REEL" is drawn

#### Scenario: No note by default
- **WHEN** the title screen is shown without a level parameter, with `level=1` or with an invalid value
- **THEN** no start-reel note is drawn
