# Spec Delta

## MODIFIED Requirements

### Requirement: Buck's one-liners on the ride
When a car is destroyed on the ride, Buck SHALL say a short, down-to-earth Swiss German line in a speech bubble above him, at most one every 3 seconds. The lines SHALL come from the ride's quote pack (its `kill` section), be at most 20 characters, drawable with the game font (which includes Ä, Ö and Ü), at least 12 different, and dry rather than explicit.

#### Scenario: After a kill
- **WHEN** Buck destroys a car and has not spoken in the last 3 seconds
- **THEN** a Swiss German line (for example "SO, FERTIG." or "GÄLL, DAS HET GSESSE") appears in a bubble above Buck for about 1.5 seconds, placed like the other bubbles without overlapping them

#### Scenario: Not after every kill
- **WHEN** Buck destroys two cars within 3 seconds
- **THEN** only the first kill gets a line

#### Scenario: Umlauts
- **WHEN** a line with Ä, Ö or Ü is shown
- **THEN** the letters are drawn with their dots, in the game's pixel font

#### Scenario: From the ride's pack
- **WHEN** the ride's quote pack is edited (a line added to its `kill` section) and the game is rebuilt
- **THEN** the new line can appear after a car kill, without any code change
