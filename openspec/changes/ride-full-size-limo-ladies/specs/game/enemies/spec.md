# Spec Delta

## MODIFIED Requirements

### Requirement: Posh drivers in cars
The ride SHALL have enemy cars driven by arrogant, posh drivers: a BMW X7 (a big SUV), a Tesla and a Ferrari. Cars SHALL drive along the road, hurt Buck on contact (2 health plus a knockback) and take several hits. A destroyed car SHALL explode and burn out as a wreck (no driver runs off), and the kill scores its points. Drivers SHALL call out arrogant one-liners in speech bubbles.

#### Scenario: Car destroyed
- **WHEN** a car's health reaches 0
- **THEN** it explodes with sparks, smoke and oil, its engine sound stops, the wreck burns, no figure runs off, and the score rises by that car's points

#### Scenario: Contact
- **WHEN** a car touches Buck while he is not invulnerable
- **THEN** Buck loses 2 health and is knocked back, as from other contact damage

#### Scenario: Arrogant one-liners
- **WHEN** a car comes on screen
- **THEN** its driver calls out an arrogant line in a speech bubble within half a second, and again every 2.5 to 3.5 seconds while the car stays on screen; each bubble shows for about 1.5 seconds. The lines are at most 20 characters, drawable with the game font, at least 12 different, and arrogant rather than explicit (for example "DO YOU KNOW MY DAD?")

#### Scenario: Readable driver bubbles
- **WHEN** several cars are on screen
- **THEN** at most two car bubbles (drivers, the president or the limo's ladies) are shown at a time, and a new bubble waits until it would overlap neither another car bubble nor a fan's bubble

#### Scenario: Points
- **WHEN** cars of each type are destroyed
- **THEN** they score BMW X7 800, Tesla 700 and Ferrari 1000 points

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
- **THEN** its bubbles disappear, and the ladies climb out of the wreck for the limo finale (see the ride spec) and stay by it, complaining at Buck; the president stays in the wreck

#### Scenario: Destroyed
- **WHEN** the limo's health reaches 0
- **THEN** it explodes like the other cars (bigger), 3000 points are scored, the limo finale plays, and the gate opens so the mofa can ride through and end the level
