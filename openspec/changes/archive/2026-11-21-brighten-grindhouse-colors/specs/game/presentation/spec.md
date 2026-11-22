# Spec Delta

## MODIFIED Requirements

### Requirement: Photo-based backgrounds
Each level SHALL use one of the TC Wollerau or Krebsbach photos from `assets/img/` as a scrolling parallax background, colour-reduced to a retro palette, graded at build time to a lurid 1970s colour-print look (more saturated than the photo, warm cast, mild contrast, brightness close to the photo) and scrolling slower than the foreground.

#### Scenario: Parallax scrolling
- **WHEN** the camera scrolls 100 pixels horizontally
- **THEN** the background scrolls by fewer than 100 pixels

#### Scenario: Gritty grade
- **WHEN** a processed background is compared to the same crop of the source photo
- **THEN** its average saturation is higher, its average brightness is at least 90% of the photo's, and its colours are shifted toward warm tones

### Requirement: Film-grain post-processing
Every rendered 320×240 frame SHALL pass through a film filter that applies a warm, saturated colour-print grade, animated grain, occasional vertical scratches, dust specks, a light vignette, a 0–1 pixel frame jitter and slight brightness flicker. The grade SHALL NOT desaturate the image. The filter SHALL keep update and render together under 8 ms per frame on a desktop browser.

#### Scenario: Filter visible
- **WHEN** two consecutive frames of a static scene are rendered with the filter on
- **THEN** the frames differ (grain/flicker animate) and the screen corners are darker than the centre

#### Scenario: Grade keeps colour
- **WHEN** a uniform saturated colour frame (for example pure clay-court orange) is passed through the filter
- **THEN** the output's average chroma is at least as high as the input's

#### Scenario: Light vignette
- **WHEN** a uniform mid-grey frame is passed through the filter
- **THEN** the corners are darker than the centre but at least 70% as bright

#### Scenario: Performance budget
- **WHEN** 300 frames of level 1 are updated and rendered with the filter on
- **THEN** the average time per frame is under 8 ms

### Requirement: Clubhouse interior
The clubhouse part of level 3 SHALL be drawn as the furnished interior of the TC Wollerau clubhouse. It SHALL have a wall backdrop of wood panelling and wallpaper instead of the photo, a bar area and a restaurant area, plus club decoration: trophy cabinet, framed photos or posters, tennis rackets on the wall and hanging lamps.

#### Scenario: Interior backdrop
- **WHEN** the camera shows the clubhouse part of level 3
- **THEN** empty space inside the clubhouse is drawn as panelled wall and wallpaper, and the aerial photo is not visible there

#### Scenario: Photo outside the clubhouse
- **WHEN** the camera shows the indoor hall part of level 3
- **THEN** the graded photo backdrop is used as in the other levels

## ADDED Requirements

### Requirement: Bright, colourful grindhouse look
With the film filter on, the title screen and every level SHALL look bright and colourful while keeping the grindhouse film character. Measured on the fixed benchmark scenes of the test suite (title, level 1 courts, level 2 creek, level 3 clubhouse and hall, boss arena), each final frame SHALL reach a mean brightness of at least 70 of 255 and a mean chroma of at least 0.25, and no more than 3% of pixels SHALL be clipped to pure white.

#### Scenario: Bright enough
- **WHEN** any benchmark scene is rendered with the film filter on
- **THEN** its mean luma (0.299 R + 0.587 G + 0.114 B) is at least 70

#### Scenario: Colourful enough
- **WHEN** any benchmark scene is rendered with the film filter on
- **THEN** its mean chroma ((max − min of R, G, B) / 255) is at least 0.25

#### Scenario: No blown-out highlights
- **WHEN** any benchmark scene is rendered with the film filter on
- **THEN** at most 3% of its pixels have all three channels at 250 or above

#### Scenario: Grindhouse character kept
- **WHEN** a benchmark scene is rendered over several frames with the film filter on
- **THEN** grain, flicker, scratches or dust still make consecutive frames differ, and the corners stay darker than the centre
