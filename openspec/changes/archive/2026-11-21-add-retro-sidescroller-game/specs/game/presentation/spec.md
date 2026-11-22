# Spec Delta

## Purpose

Defines how the game looks and sounds: the fixed 320x240 retro display, the hero and photo-based backgrounds, the HUD and screens, and the Ride of the Valkyries soundtrack and sound effects.

## ADDED Requirements

### Requirement: Native 320x240 resolution
The game SHALL render every frame at an internal resolution of exactly 320×240 pixels and scale it to the largest integer multiple that fits the browser window (minimum 1×), centred on a black background, with nearest-neighbour scaling and no smoothing.

#### Scenario: Window resize
- **WHEN** the browser window is resized to 1280×1000
- **THEN** the game is shown at 4× (1280×960), centred, with sharp pixels

#### Scenario: Small window
- **WHEN** the window is smaller than 640×480
- **THEN** the game is shown at 1×

### Requirement: Hero appearance
The hero SHALL be a pixel-art character about 32 pixels tall whose head is derived from the face in `assets/img/buck_nukem.jpg` (long grey-blond hair, sunglasses, moustache), on a pixel body in a dark jacket and white shirt. The hero SHALL have distinct idle, run, jump, climb, shoot and hurt poses, mirrored when facing left.

#### Scenario: Facing direction
- **WHEN** the player moves left
- **THEN** the hero sprite is drawn mirrored to face left

### Requirement: Photo-based backgrounds
Each level SHALL use one of the TC Wollerau or Krebsbach photos from `assets/img/` as a scrolling parallax background, colour-reduced to a retro palette and scrolling slower than the foreground.

#### Scenario: Parallax scrolling
- **WHEN** the camera scrolls 100 pixels horizontally
- **THEN** the background scrolls by fewer than 100 pixels

### Requirement: Themed foreground tiles
Foreground tiles SHALL match each level's theme: clay-court surfaces, nets and fences for TC Wollerau; grass, gravel and water for the Krebsbach creek; walls and floors for the clubhouse/indoor hall.

#### Scenario: Creek water
- **WHEN** the Krebsbach level is shown
- **THEN** creek water tiles are visible and animated

### Requirement: HUD
During play a HUD SHALL show score, health as a segmented bar, lives, the current weapon and collected key cards, using a pixel font, without hiding the hero.

#### Scenario: Health display updates
- **WHEN** the hero loses one health point
- **THEN** the health bar shows one segment fewer in the same frame

### Requirement: Title and end screens
The game SHALL show a title screen with the game name "BUCK NUKEM", a pixelated portrait from the hero photo, a controls summary and "PRESS ENTER". It SHALL also have level-complete, game-over and victory screens.

#### Scenario: Starting the game
- **WHEN** the player presses Enter on the title screen
- **THEN** level 1 starts with score 0, full health and 3 lives

### Requirement: Ride of the Valkyries soundtrack
The game SHALL play a looping chiptune arrangement of Wagner's "Ride of the Valkyries", synthesized in the browser, during play. Because browsers block audio until the user interacts, music SHALL start on the first key press.

#### Scenario: Music starts after first input
- **WHEN** the player presses any key on the title screen
- **THEN** the Ride of the Valkyries theme starts playing and loops

#### Scenario: Boss music intensifies
- **WHEN** the boss arena starts
- **THEN** the theme plays at a faster tempo

### Requirement: Sound effects
The game SHALL play synthesized sound effects for shooting, jumping, enemy hits, explosions, pickups, taking damage, doors and the boss's claw slam.

#### Scenario: Shot sound
- **WHEN** the hero fires
- **THEN** a short shot sound plays

### Requirement: Mute toggle
Pressing M SHALL toggle all music and sound effects on and off.

#### Scenario: Muting
- **WHEN** the player presses M while audio is on
- **THEN** all music and sound effects stop until M is pressed again
