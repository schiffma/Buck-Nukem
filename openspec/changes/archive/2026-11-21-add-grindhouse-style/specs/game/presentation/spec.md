# Spec Delta

## MODIFIED Requirements

### Requirement: Hero appearance
The hero SHALL be a pixel-art character about 32 pixels tall whose head is derived from the face in `assets/img/buck_nukem.jpg` (long grey-blond hair, sunglasses, moustache) with added stubble and a cigar, on a pixel body in a dark jacket and white shirt with heavy boots and a large gun. Sprites SHALL use dark 1-px outlines and 3-tone shading. The hero SHALL have distinct idle, run, jump, climb, shoot and hurt poses, mirrored when facing left.

#### Scenario: Facing direction
- **WHEN** the player moves left
- **THEN** the hero sprite is drawn mirrored to face left

#### Scenario: Outlined sprites
- **WHEN** any hero or enemy sprite is drawn over a background
- **THEN** every opaque edge pixel of the sprite borders a dark outline pixel

### Requirement: Photo-based backgrounds
Each level SHALL use one of the TC Wollerau or Krebsbach photos from `assets/img/` as a scrolling parallax background, colour-reduced to a retro palette, graded at build time to a gritty look (desaturated, warm/sepia tint, harder contrast, darker overall) and scrolling slower than the foreground.

#### Scenario: Parallax scrolling
- **WHEN** the camera scrolls 100 pixels horizontally
- **THEN** the background scrolls by fewer than 100 pixels

#### Scenario: Gritty grade
- **WHEN** a processed background is compared to the same crop of the source photo
- **THEN** its average saturation and brightness are lower and its colours are shifted toward warm tones

### Requirement: Themed foreground tiles
Foreground tiles SHALL match each level's theme, drawn worn and dirty (cracks, stains, rust, grime): clay-court surfaces, nets and fences for TC Wollerau; grass, gravel and water for the Krebsbach creek; walls and floors for the clubhouse/indoor hall.

#### Scenario: Creek water
- **WHEN** the Krebsbach level is shown
- **THEN** creek water tiles are visible and animated

#### Scenario: Worn tile variants
- **WHEN** a row of identical solid tiles is drawn
- **THEN** at least two visibly different worn variants of the tile are used so the surface does not repeat uniformly

### Requirement: Title and end screens
The game SHALL show a title screen styled as a 1970s exploitation-movie poster: the game name "BUCK NUKEM" in large distressed, outlined lettering, a tagline, a fake rating badge, the pixelated portrait from the hero photo, a controls summary and "PRESS ENTER". It SHALL also have level-complete, game-over and victory screens; game over and victory SHALL be styled as "THE END" film cards.

#### Scenario: Starting the game
- **WHEN** the player presses Enter on the title screen
- **THEN** level 1 starts with score 0, full health and 3 lives

#### Scenario: Controls summary
- **WHEN** the title screen is shown
- **THEN** the controls list shows Space for jump and X/Ctrl/Alt for fire

## ADDED Requirements

### Requirement: Film-grain post-processing
Every rendered 320×240 frame SHALL pass through a film filter that applies a warm high-contrast colour grade, animated grain, occasional vertical scratches, dust specks, a vignette, a 0–1 pixel frame jitter and slight brightness flicker. The filter SHALL keep update and render together under 8 ms per frame on a desktop browser.

#### Scenario: Filter visible
- **WHEN** two consecutive frames of a static scene are rendered with the filter on
- **THEN** the frames differ (grain/flicker animate) and the screen corners are darker than the centre

#### Scenario: Performance budget
- **WHEN** 300 frames of level 1 are updated and rendered with the filter on
- **THEN** the average time per frame is under 8 ms

### Requirement: Film filter toggle
Pressing G SHALL toggle the film filter on and off at any time. The filter SHALL be on when the game starts.

#### Scenario: Toggling the filter
- **WHEN** the player presses G while the filter is on
- **THEN** subsequent frames are rendered without grade, grain, scratches, vignette and jitter until G is pressed again

### Requirement: Damage flash
When the hero takes damage, the screen edges SHALL flash red for about a quarter of a second.

#### Scenario: Hero hurt
- **WHEN** the hero loses health
- **THEN** a red vignette overlay appears and fades out within about 0.25 seconds

### Requirement: Reel title cards
Each level intro SHALL be shown as a film-reel title card: a short countdown leader (3, 2, 1) followed by "REEL n" and the level name. Before the boss arena, a "MISSING REEL" gag card SHALL be shown briefly. Pressing Enter or Space SHALL skip the card.

#### Scenario: Level intro
- **WHEN** level 2 starts
- **THEN** a countdown leader is shown, then "REEL 2" with the level name, then play begins

#### Scenario: Missing reel before the boss
- **WHEN** the hero exits level 3
- **THEN** a "MISSING REEL" card is shown before the boss arena's intro card
