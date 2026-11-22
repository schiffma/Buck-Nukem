# Spec Delta

## ADDED Requirements

### Requirement: Female lawyer look
The lawyer sprites SHALL show a woman in a dark skirt suit with a white blouse, short hair and dark heels, as outlined, 3-tone shaded pixel art in the same 16 x 30 frame as before, with two walk frames and a throwing pose.

#### Scenario: Recognisably female with short hair
- **WHEN** the lawyer frames are drawn
- **THEN** they show a skirt (no trouser legs above the knee), hair no lower than the chin line, and heels, and differ from the former male lawyer frames

#### Scenario: Outlined and shaded
- **WHEN** any lawyer frame is drawn
- **THEN** every opaque edge pixel borders a dark outline pixel and the suit colour appears as base, highlight and shadow tones

### Requirement: Swiss law book projectile
Thrown law books SHALL be drawn as thick hardbacks (about 10 x 8 pixels) with a white Swiss cross on the cover and a pale page edge, tumbling in flight, in four cover colours for the codes OR (red), ZGB (dark blue), StGB (green) and SchKG (orange).

#### Scenario: Four codes
- **WHEN** the law book sprites are drawn
- **THEN** there are four cover colours, each frame shows white cross pixels on the cover, and every opaque edge pixel is outlined

#### Scenario: Tumbling
- **WHEN** a law book is in flight
- **THEN** its drawing alternates between at least two different frames
