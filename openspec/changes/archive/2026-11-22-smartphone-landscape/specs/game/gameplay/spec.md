# Spec Delta

## MODIFIED Requirements

### Requirement: Pause
The player SHALL be able to pause and resume the game with P or Enter during play. While paused, nothing in the game world SHALL move. In touch mode the on-screen Pause button SHALL pause and resume as P does. A tap on the picture SHALL resume. The game SHALL also pause itself when the phone is turned to portrait or the page is hidden during play.

#### Scenario: Pausing
- **WHEN** the player presses P during play
- **THEN** the game freezes and shows "PAUSED" until P is pressed again

#### Scenario: Pause button
- **WHEN** the player taps the on-screen Pause button during play in touch mode
- **THEN** the game freezes and shows "PAUSED" until the Pause button, the picture or P is tapped or pressed

#### Scenario: Automatic pause
- **WHEN** touch mode is on and the phone is turned to portrait, or the page is hidden, during play
- **THEN** the game is paused and stays paused until the player resumes
