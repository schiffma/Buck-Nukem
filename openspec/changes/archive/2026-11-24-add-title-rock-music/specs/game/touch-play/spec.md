# Spec Delta

## MODIFIED Requirements

### Requirement: Tapping through menus
In touch mode, a tap on the game picture SHALL act as Enter on every screen where Enter continues: the title (start a game; while the sound is not yet on, the first tap only starts it), the reel cards (skip), the level tally (fill and continue), the game-over card and the victory card. During play, a tap on the picture SHALL do nothing.

#### Scenario: Start from the title
- **WHEN** the title screen is shown in touch mode with the sound on and the player taps the picture
- **THEN** a new game starts, as with Enter

#### Scenario: First tap only starts the sound
- **WHEN** the title screen is shown in touch mode with the sound not yet on and the player taps the picture
- **THEN** the title music starts, the title stays and reads "TAP TO START", and the next tap starts a game

#### Scenario: Picture during play
- **WHEN** the game is being played and the player taps the picture
- **THEN** the game neither pauses nor reacts in any other way

#### Scenario: Resume from pause
- **WHEN** the game is paused and the player taps the picture or the Pause button
- **THEN** play resumes

### Requirement: Audio starts on the first touch
In touch mode the first touch anywhere on the page SHALL unlock audio and start the music, as the first key press does on the desktop.

#### Scenario: First tap on the title
- **WHEN** the title screen is shown with no audio yet and the player touches the screen
- **THEN** the title music starts playing within that touch's gesture, and the title screen stays
