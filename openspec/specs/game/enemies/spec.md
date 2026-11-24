# game/enemies Specification

## Purpose

Defines the enemies the hero fights (lawyers, mutant crayfish, crazy gardener robots) and the giant mutant crayfish final boss, including how each moves, attacks and is defeated.

## Requirements

### Requirement: Enemy activation
Enemies SHALL stay inactive until they are within about one screen width of the visible area, so off-screen enemies do not attack the hero.

#### Scenario: Distant enemy is idle
- **WHEN** an enemy is more than one screen width beyond the visible area
- **THEN** it does not move or fire

### Requirement: Lawyer enemy
Lawyers SHALL be women in skirt suits with short hair. They SHALL walk back and forth on their platform without walking off edges. When the hero is on roughly the same height and in front of them, they SHALL stop and throw a Swiss law book toward the hero, sometimes calling out a short legal line. A lawyer SHALL take 3 standard hits.

#### Scenario: Lawyer turns at a ledge
- **WHEN** a walking lawyer reaches the edge of its platform
- **THEN** it turns around instead of falling

#### Scenario: Lawyer attacks
- **WHEN** the hero is in front of a lawyer at a similar height within attack range
- **THEN** the lawyer throws a law book toward the hero (same arc, speed and 1 damage as the former briefcase)

#### Scenario: Book bursts with an article
- **WHEN** a law book hits the hero or a solid tile
- **THEN** it disappears in a burst of fluttering pages and a short floating label names an article of that book's code (for example "ART. 41 OR")

#### Scenario: Legal one-liners
- **WHEN** a lawyer throws
- **THEN** she may show a speech bubble with a line from a pool of at least 8 legal lines (each at most 20 characters, drawable with the game font, at least half of them naming a Swiss code or article); each lawyer speaks at most once per 4 seconds, at most one lawyer bubble shows at a time, and a bubble disappears after about 1.5 seconds

### Requirement: Mutant crayfish enemy
Mutant crayfish SHALL scuttle along the ground and periodically leap toward the hero; in creek areas they SHALL emerge from the water. Touching one SHALL damage the hero. A crayfish SHALL take 2 standard hits.

#### Scenario: Crayfish leap
- **WHEN** the hero is within leaping range of a crayfish
- **THEN** the crayfish jumps in an arc toward the hero's position

### Requirement: Enemy hit feedback
An enemy hit by a projectile SHALL flash briefly and spill a few drops of blood (oil and sparks when a gardener-punk's mower is hit). A defeated enemy SHALL burst into a cartoon pixel splatter with a few gibs, leave temporary stains on nearby tiles, and award points by type.

#### Scenario: Hit flash
- **WHEN** a projectile hits an enemy that survives
- **THEN** the enemy flashes white for a few frames and a few blood droplets fly from the hit point

#### Scenario: Lawyer or crayfish defeated
- **WHEN** a lawyer's or crayfish's health reaches 0
- **THEN** red blood particles and several gib pieces fly out, fall with gravity, and red stains appear on solid tiles within a short radius

#### Scenario: Gardener-punk defeated
- **WHEN** a gardener-punk's health reaches 0
- **THEN** he bursts into red blood and gibs, and his mower explodes into black oil, sparks and metal debris

#### Scenario: Stains fade
- **WHEN** 20 seconds have passed since a stain was created, or more than 64 stains exist
- **THEN** the oldest stains disappear so stains never accumulate without limit

### Requirement: Giant mutant crayfish boss
The boss arena SHALL contain a giant mutant crayfish, several times the hero's size, with a health bar shown on screen. It SHALL take damage only on its face/eye stalks, which are exposed while its claws are raised; shots hitting its shell or closed claws SHALL be deflected.

#### Scenario: Boss health bar
- **WHEN** the boss arena starts
- **THEN** a boss health bar appears and shrinks as the boss takes damage

#### Scenario: Shell deflects shots
- **WHEN** a hero projectile hits the boss's shell
- **THEN** the projectile is deflected and the boss takes no damage

### Requirement: Boss attack patterns
The boss SHALL cycle through a claw slam with a floor shockwave, a bubble spray in an arc, and summoning small mutant crayfish on screen left of it, but SHALL summon at most 3 times per boss fight and then alternate slam and bubbles. Below half health it SHALL attack faster. The shockwave SHALL stop at the first solid tile or crate and damage breakable crates; bubbles SHALL burst on solid tiles and crates.

#### Scenario: Enraged phase
- **WHEN** the boss's health drops below 50 %
- **THEN** pauses between its attacks become shorter

#### Scenario: Boss summons minions
- **WHEN** the boss performs its summon attack
- **THEN** small mutant crayfish appear in the arena, each within the current camera view and left of the boss

#### Scenario: Only three summons
- **WHEN** the boss fight runs through at least 6 full attack cycles
- **THEN** the boss has summoned exactly 3 times, and every later cycle consists of a claw slam and a bubble spray only

#### Scenario: Respawn does not reset the summons
- **WHEN** the hero loses a life in the boss arena after the boss has summoned 3 times, and respawns there
- **THEN** the boss still does not summon again

#### Scenario: New game resets the summons
- **WHEN** a new game reaches the boss arena (or the arena is loaded again)
- **THEN** the boss can summon 3 times again

#### Scenario: Shockwave stopped by cover
- **WHEN** the shockwave reaches a crate or a solid tile on the floor
- **THEN** it disappears there, with a dust burst, and a breakable crate it hit loses 3 strength

### Requirement: Gardener-punk enemy
Gardener-punks SHALL patrol their platform pushing a lawn mower without walking off edges, and the running mower SHALL cost the hero 2 health on contact. A punk SHALL take 5 standard hits. He SHALL be drawn with a mohawk, a leather vest and a smoking blunt; the blunt is cosmetic only.

#### Scenario: Punk turns at a ledge
- **WHEN** a patrolling punk reaches the edge of its platform
- **THEN** it turns around instead of falling

#### Scenario: Mower contact
- **WHEN** the hero touches a punk's mower and is not invulnerable
- **THEN** the hero loses 2 health

#### Scenario: Blunt smoke
- **WHEN** a punk is on screen
- **THEN** small grey smoke puffs rise from his blunt every second or so, without affecting gameplay

### Requirement: Mower charge
When the hero is in front of a gardener-punk at roughly the same height and within about 6 tiles, the punk SHALL rev the mower for a short wind-up and then charge forward at high speed. The charge SHALL end at a ledge, a wall or after about 8 tiles, followed by a cooldown. While charging, the mower SHALL throw grass clippings and small stones forward as short-range projectiles that each cost 1 health.

#### Scenario: Wind-up before charging
- **WHEN** the hero stands in front of a punk within charge range
- **THEN** the punk stops, revs for about half a second with smoke puffs, and then moves toward the hero at least three times faster than his patrol speed

#### Scenario: Charge stops at a ledge
- **WHEN** a charging punk reaches the edge of his platform
- **THEN** the charge ends and the punk does not fall off

#### Scenario: Clippings and stones
- **WHEN** a punk is charging
- **THEN** grass and stone projectiles fly forward from the mower and disappear after a short distance or on hitting a wall

#### Scenario: No charge from behind
- **WHEN** the hero is behind a punk
- **THEN** the punk does not start a charge

### Requirement: Posh drivers in cars
The ride SHALL have enemy cars driven by arrogant, posh drivers: a BMW X7 (a big SUV), a Tesla and a Ferrari. Cars SHALL drive along the road, hurt Buck on contact (2 health plus a knockback) and take several hits. A destroyed car SHALL explode, the driver bails out, and the kill scores its points. Drivers SHALL call out arrogant one-liners in speech bubbles.

#### Scenario: Car destroyed
- **WHEN** a car's health reaches 0
- **THEN** it explodes with sparks, smoke and oil, its engine sound stops, the driver bails out, and the score rises by that car's points

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

### Requirement: BMW X7
The BMW X7 SHALL be a huge, tall, slow SUV (too tall to hop over) that drives ahead of Buck and blocks the road. Its driver SHALL toss latte cups and golf balls back over the roof in arcs toward Buck, and honk when Buck rides close behind. It SHALL take 12 hits.

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
The Tesla SHALL creep up from behind with no engine roar, only a faint electric whine, with its driver looking at a phone, and ram Buck. It SHALL take 8 hits.

#### Scenario: Silent approach
- **WHEN** a Tesla approaches from behind
- **THEN** its sound is clearly quieter than the other cars' engines, and it accelerates to ram Buck when about half a screen behind him

### Requirement: Ferrari
The Ferrari SHALL be a low, very fast car that comes from ahead with a loud engine roar. It SHALL be low enough to hop over, and it SHALL take 6 hits. Its approach SHALL be announced by the roar about one second before it appears on screen.

#### Scenario: Oncoming
- **WHEN** a Ferrari is spawned ahead of Buck
- **THEN** its roar is heard about one second before it comes into view, and it drives toward Buck at more than twice the mofa's top speed

#### Scenario: Hop over
- **WHEN** Buck hops while a Ferrari passes under the mofa
- **THEN** no contact damage happens and the Ferrari drives on off screen

### Requirement: Traffic waves
Besides single cars, the ride SHALL have set pieces of several cars at once: an X7 convoy ahead, two Teslas from behind, a Ferrari pair from ahead, and an X7 ahead while a Tesla comes from behind. Each wave SHALL start when Buck passes its marker.

#### Scenario: Convoy
- **WHEN** Buck passes an X7 convoy marker
- **THEN** two X7s drive ahead of him one after the other, each behaving like a single X7

#### Scenario: Pincer
- **WHEN** Buck passes an X7-and-Tesla marker
- **THEN** an X7 appears ahead and a Tesla comes up from behind at the same time

#### Scenario: Waves along the ride
- **WHEN** the ride map is checked
- **THEN** it contains at least one of each wave kind, spread over the stretches

### Requirement: Club president's limo
At the club gate, the club president's white super-stretch limousine (about 300 × 56 pixels, taller than the X7, in proportion to Buck on the mofa) SHALL block the way as a mini-boss: it stands before the gate, takes 30 hits, shows its health in a bar with the name "THE PRESIDENT'S LIMO", and the president pops champagne corks at Buck in arcs from the sunroof. The gate SHALL stay closed until the limo is destroyed. Destroying it SHALL score 3000 points.

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
- **THEN** its bubbles disappear and the ladies run off with the president

#### Scenario: Destroyed
- **WHEN** the limo's health reaches 0
- **THEN** it explodes like the other cars (bigger), the president runs off, 3000 points are scored, and the gate opens so the mofa can ride through and end the level
