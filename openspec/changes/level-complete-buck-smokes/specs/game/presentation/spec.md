# Spec Delta

## ADDED Requirements

### Requirement: Buck on the level-complete screen
The level-complete screen SHALL show Buck's framed photo portrait with a lit cigarette between his lips that smokes like a real cigarette. Once the bonus count has finished, Buck SHALL say a short Thurgau-dialect line about winning in a speech bubble. The line SHALL come from the `[complete]` section of the level's quote pack, and all elements SHALL fit on the screen without overlapping.

#### Scenario: Smoking portrait
- **WHEN** a level is completed and the level-complete screen shows
- **THEN** Buck's portrait is drawn in its frame at the lower left, a cigarette with a glowing ember sits on the line between his lips, right under the moustache, and a thin, translucent wisp of smoke rises continuously from the ember, swaying and widening as it climbs before it fades

#### Scenario: Taking a drag
- **WHEN** the level-complete screen has been showing for a few seconds
- **THEN** every 4–6 seconds Buck takes a drag: the ember glows brighter for about half a second, and shortly afterwards a soft cloud of smoke comes out of his mouth, drifts away from his face and fades within about 2 seconds

#### Scenario: Winning line
- **WHEN** the bonus count on the level-complete screen has finished
- **THEN** a speech bubble above the portrait shows a line from the level's `[complete]` lines (for example "GWUNNE, WIE IMMER."), and it stays until the player continues

#### Scenario: Not during the count
- **WHEN** the bonus count is still running
- **THEN** the portrait smokes but no bubble is shown

#### Scenario: Another line next time
- **WHEN** the player completes several levels
- **THEN** each screen picks a line from the pack's `[complete]` lines, and no line repeats until all of them have been used

#### Scenario: No lines
- **WHEN** the level's quote pack has no `[complete]` section, or the level has no pack
- **THEN** the smoking portrait shows without a bubble

#### Scenario: Layout
- **WHEN** the level-complete screen is drawn, in keyboard or touch mode
- **THEN** the title, the level name, the bonus table, the score, the prompt, the portrait and the bubble are all inside the screen, and none of them overlaps another
