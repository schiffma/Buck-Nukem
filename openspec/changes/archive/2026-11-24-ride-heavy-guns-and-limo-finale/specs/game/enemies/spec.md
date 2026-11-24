# Spec Delta

## MODIFIED Requirements

### Requirement: BMW X7
The BMW X7 SHALL be a huge, tall, slow SUV (too tall to hop over) that drives ahead of Buck and blocks the road. Its driver SHALL toss latte cups and golf balls back over the roof in arcs toward Buck, and honk when Buck rides close behind. It SHALL take 10 hits.

#### Scenario: Roadblock
- **WHEN** Buck catches up with a BMW X7
- **THEN** the X7 drives on slower than the mofa's top speed, and Buck cannot pass it except by destroying it

#### Scenario: Honking
- **WHEN** the mofa rides within about 40 pixels behind the X7
- **THEN** the X7's horn sounds, at most once per second

#### Scenario: Thrown objects
- **WHEN** Buck is within about one screen behind the X7
- **THEN** the driver throws a latte cup or a golf ball in an arc toward him every 1.5 to 2.5 seconds, costing 1 health on a hit, and shots aimed up can hit the objects and destroy them

### Requirement: Tesla
The Tesla SHALL creep up from behind with no engine roar, only a faint electric whine, with its driver looking at a phone, and ram Buck. It SHALL take 6 hits.

#### Scenario: Silent approach
- **WHEN** a Tesla approaches from behind
- **THEN** its sound is clearly quieter than the other cars' engines, and it accelerates to ram Buck when about half a screen behind him

### Requirement: Ferrari
The Ferrari SHALL be a low, very fast car that comes from ahead with a loud engine roar. It SHALL be low enough to hop over, and it SHALL take 5 hits. Its approach SHALL be announced by the roar about one second before it appears on screen.

#### Scenario: Oncoming
- **WHEN** a Ferrari is spawned ahead of Buck
- **THEN** its roar is heard about one second before it comes into view, and it drives toward Buck at more than twice the mofa's top speed

#### Scenario: Hop over
- **WHEN** Buck hops while a Ferrari passes under the mofa
- **THEN** no contact damage happens and the Ferrari drives on off screen

### Requirement: Club president's limo
At the club gate, the club president's white super-stretch limousine (about 300 × 56 pixels, taller than the X7, in proportion to Buck on the mofa) SHALL block the way as a mini-boss: it stands before the gate, takes 24 hits, shows its health in a bar with the name "THE PRESIDENT'S LIMO", and the president pops champagne corks at Buck in arcs from the sunroof. The gate SHALL stay closed until the limo is destroyed. Destroying it SHALL score 3000 points.

#### Scenario: Gate blocked
- **WHEN** the mofa reaches the limo while it still has health
- **THEN** it cannot pass the limo (contact damage and knockback as with other cars), and the level does not end

#### Scenario: Champagne corks
- **WHEN** Buck is within one screen of the limo
- **THEN** the president pops a champagne cork toward him every 1 to 1.5 seconds, costing 1 health on a hit; shots can destroy the corks

#### Scenario: Health bar
- **WHEN** the limo is on screen
- **THEN** a health bar with "THE PRESIDENT'S LIMO" shows its remaining health

#### Scenario: Posh ladies
- **WHEN** the limo is on screen and still has health
- **THEN** two or three posh ladies (big hats, sunglasses, pearls), their heads at least 8 pixels high like Buck's, are seen at its side windows, and one of them, or the president, calls out an arrogant line in a speech bubble above her window about every 2 to 3 seconds; the ladies' lines are at most 20 characters, drawable with the game font, at least 12 different, and arrogant rather than explicit (for example "IS THAT A MOFA? EW.")

#### Scenario: Ladies gone
- **WHEN** the limo is destroyed
- **THEN** its bubbles disappear, the president runs off, and the ladies crawl out of the wreck for the limo finale (see the ride spec) and run off when it ends

#### Scenario: Destroyed
- **WHEN** the limo's health reaches 0
- **THEN** it explodes like the other cars (bigger), the president runs off, 3000 points are scored, the limo finale plays, and the gate opens so the mofa can ride through and end the level
