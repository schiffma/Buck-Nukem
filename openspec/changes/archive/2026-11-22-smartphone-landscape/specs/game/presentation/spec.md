# Spec Delta

## MODIFIED Requirements

### Requirement: Native 320x240 resolution
The game SHALL render every frame at an internal resolution of exactly 320×240 pixels and, outside touch mode, scale it to the largest integer multiple that fits the browser window (minimum 1×), centred on a black background, with nearest-neighbour scaling and no smoothing. Touch mode scales as in "Touch-mode scaling".

#### Scenario: Window resize
- **WHEN** the browser window is resized to 1280×1000
- **THEN** the game is shown at 4× (1280×960), centred, with sharp pixels

#### Scenario: Small window
- **WHEN** the window is smaller than 640×480
- **THEN** the game is shown at 1×

### Requirement: Title and end screens
The game SHALL show a title screen styled as a 1970s exploitation-movie poster: the game name "BUCK NUKEM" in large distressed, outlined lettering, a tagline, a fake rating badge, the pixelated portrait from the hero photo, a controls summary, "PRESS ENTER" and the build version in small print. It SHALL also have level-complete, game-over and victory screens; game over and victory SHALL be "THE END" film cards.

#### Scenario: Starting the game
- **WHEN** the player presses Enter on the title screen
- **THEN** level 1 starts with score 0, full health and 3 lives

#### Scenario: Controls summary
- **WHEN** the title screen is shown outside touch mode
- **THEN** the controls list shows Space for jump, X/Ctrl/Alt for fire and Up/Down for climbing and kneeling

#### Scenario: Version shown
- **WHEN** the title screen is shown
- **THEN** the version text embedded by the build (for example "V1.0.2" or "V1.0.2-3-GAB12CD3") is drawn in small print in a corner of the poster, fully inside the screen, readable on the poster tint and not overlapping the other title elements

## ADDED Requirements

### Requirement: Touch-mode scaling
In touch mode the 320×240 picture SHALL be scaled by the largest factor, not necessarily a whole number, that keeps its 4:3 frame inside the space between the touch-control side bars. It SHALL use nearest-neighbour scaling at the device's pixel ratio, with no smoothing.

#### Scenario: Phone in landscape
- **WHEN** touch mode is on in an 844×390 CSS pixel viewport with a device pixel ratio of 3
- **THEN** the game is shown larger than 1× (fractional scale), 4:3, centred between the side bars, and every game pixel is a solid block of device pixels with no blended colours

### Requirement: Touch-mode texts
In touch mode the title's controls summary SHALL describe the on-screen controls, and every "PRESS …" prompt SHALL ask for a tap instead, in the same place and style as the keyboard text.

#### Scenario: Touch controls summary
- **WHEN** the title screen is shown in touch mode
- **THEN** the controls list names the pad for moving, climbing and kneeling, the Jump and Fire buttons, pad Down + Jump for dropping through, and the Pause, Mute, Film and Fullscreen buttons, and lists no keyboard keys

#### Scenario: Tap prompts
- **WHEN** the title, the level tally, the pause screen, the game-over card or the victory card is shown in touch mode
- **THEN** it shows "TAP TO START" on the title, "TAP TO CONTINUE" on the other screens, and "TAP II TO CONTINUE" when paused, instead of "PRESS ENTER" or "PRESS P TO CONTINUE", and the music hint on the title reads "(TAP STARTS THE MUSIC)"

#### Scenario: Prompts fit
- **WHEN** any tap prompt or the touch controls summary is drawn
- **THEN** it lies fully inside the 320×240 screen and does not overlap the other elements of that screen
