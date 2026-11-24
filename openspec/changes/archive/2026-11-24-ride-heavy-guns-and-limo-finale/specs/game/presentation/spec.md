# Spec Delta

## MODIFIED Requirements

### Requirement: Mofa look
Buck's mofa SHALL be outlined, 3-tone pixel art drawn after `assets/img/sachs-mofa.jpg`: a red frame, a chrome tank, a black seat, a luggage rack, spoked wheels and a two-stroke engine, with heavy guns on the handlebars and the rack. The mofa SHALL be drawn at 75% of the cars' scale while Buck keeps his usual size and look. The red, chrome and black colours SHALL be sampled from the photo at build time. The wheels SHALL turn with the speed.

#### Scenario: Colours from the photo
- **WHEN** the mofa sprite is built
- **THEN** its frame, tank and seat colours come from the corresponding regions of `assets/img/sachs-mofa.jpg`, and the build fails with an error naming the file if the photo is missing

#### Scenario: Riding frames
- **WHEN** the mofa moves
- **THEN** its wheel spokes animate in step with the speed, the gun shows a muzzle flash when firing, and every opaque edge pixel borders a dark outline pixel

#### Scenario: Small mofa, big man, big guns
- **WHEN** Buck rides the mofa
- **THEN** the mofa is about 32 pixels long (75% of before), Buck is drawn at the same size as on foot, and each gun is at least 14 pixels long with a perforated barrel jacket and a big muzzle

### Requirement: Car and driver looks
The cars SHALL be outlined pixel-art side views drawn after the reference photos in `assets/img/`, at the game's scale of about 25 pixels per metre (Buck's scale; the mofa itself is drawn smaller), recognisable by shape and colour without copied logos or number plates: a BMW X7 (`car-bmw-x7.webp`), a Tesla (`car_tesla.jpg`) and a Ferrari (`car_ferrari.avif`). Each SHALL show a posh driver in the side window. The wheels SHALL turn; a destroyed car SHALL leave a burning wreck that fades.

#### Scenario: Like the photos
- **WHEN** the three car sprites are drawn
- **THEN** the X7 is a tall, boxy dark-grey metallic SUV with a large chrome twin-kidney grille, roof rails and dark window trim; the Tesla a smooth deep-red sedan with a black glass roof, no grille and aero wheels; the Ferrari a low, bright red mid-engine coupe with a black rear, side air intakes and yellow brake calipers

#### Scenario: Three distinct cars
- **WHEN** the three car sprites are drawn
- **THEN** they differ in height and length (the X7 is the tallest, the Ferrari the lowest at no more than 32 pixels), their main colours differ, and every opaque edge pixel borders a dark outline pixel

#### Scenario: In proportion to Buck
- **WHEN** a car is drawn next to Buck on the mofa
- **THEN** at about 25 pixels per metre it is 110 to 130 pixels long, the X7 about 45 pixels tall, the Tesla about 36 and the Ferrari about 30, and the driver's head is at least 8 pixels high
