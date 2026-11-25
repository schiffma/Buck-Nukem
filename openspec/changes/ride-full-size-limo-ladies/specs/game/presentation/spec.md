# Spec Delta

## MODIFIED Requirements

### Requirement: Buck's quote packs
Buck's quotes SHALL come from quote packs: plain text files, one quote per line, grouped into sections per event: `start` (once, shortly after a level begins), `kill` (after Buck finishes off an enemy) `kill:<enemy type>` (instead of `kill`) and `finale` (Buck's reply in a level's closing scene). A level SHALL name its pack in its header; without a pack Buck stays silent in that level. Every section is optional.

#### Scenario: Level start
- **WHEN** a level whose pack has a `start` section begins and its intro card ends
- **THEN** within about a second Buck says one of its lines in a speech bubble above him, once per level start (again after a restart of the level, not after a respawn)

#### Scenario: Kill quote
- **WHEN** Buck finishes off an enemy in a level whose pack has a `kill` section, and he has not said a kill quote in the last 3 seconds
- **THEN** he says one of its lines in a bubble above him for about 1.5 seconds; on foot and on the mofa alike, the bubble overlaps no other speech bubble (if there is no room, he stays quiet)

#### Scenario: Per enemy type
- **WHEN** the pack has a `kill:<type>` section for the enemy Buck just finished off
- **THEN** the line comes from that section instead of `kill`

#### Scenario: No pack
- **WHEN** a level names no pack, or its pack lacks the section for an event
- **THEN** Buck says nothing for that event

#### Scenario: Pack checks
- **WHEN** the game is built with a pack that has a line longer than 20 characters, a character the game font cannot draw, an unknown section or enemy type, or a level names a pack that does not exist
- **THEN** the build fails with the file, the line and the reason

#### Scenario: Finale reply
- **WHEN** a closing scene such as the ride's limo finale reaches Buck's reply, and the level's pack has a `finale` section
- **THEN** Buck says one of its lines in his bubble; without the section he says nothing there
