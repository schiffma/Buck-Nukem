# game/ride Specification

## Purpose

Defines the opening mofa ride: Buck on a Sachs mofa with a mounted machine gun, riding up the road to TC Wollerau through traffic and posh drivers, with the same inputs as on foot.

## Requirements

### Requirement: Ride reel
The first level, reel 1 "THE ROAD TO WOLLERAU", SHALL be a side-view road ride from left to right, about 640 tiles long, ending at the TC Wollerau club gate. Buck SHALL stay on the mofa for the whole reel. Passing the gate SHALL complete the level once the club president's limo is destroyed, and the next reel (the clay courts) SHALL start with Buck on foot with the standard blaster.

#### Scenario: Ride first
- **WHEN** the player starts a new game from the title without a level link
- **THEN** the "REEL 1" card shows "THE ROAD TO WOLLERAU" and Buck starts on the mofa at the left end of the road

#### Scenario: Long ride
- **WHEN** the ride level is loaded
- **THEN** its road is between 600 and 680 tiles long, with at least 2 checkpoints along the way

#### Scenario: Gate ends the ride
- **WHEN** the mofa reaches the club gate after the limo is destroyed
- **THEN** the level-complete tally is shown, and after it reel 2 starts with Buck on foot, the standard blaster, and the score, lives and health carried over

#### Scenario: Ride level is completable
- **WHEN** the level checker runs on the ride level
- **THEN** the road (including the climb) is continuous from the start to the gate, and every pickup can be reached with a hop or from a ramp

### Requirement: Mofa controls
On the mofa, Right SHALL accelerate up to the mofa's top speed, faster than Buck runs on foot. Left SHALL brake, and when stopped, roll the mofa slowly backwards. With neither held, the mofa SHALL coast and slow down gradually. Jump SHALL make a short hop from the road. Climbing, kneeling and dropping through platforms SHALL NOT apply on the mofa. The same actions SHALL work from the keyboard and from the touch controls.

#### Scenario: Accelerating
- **WHEN** the player holds Right for 3 seconds from a standstill
- **THEN** the mofa reaches its top speed, which is at least 1.5 times Buck's running speed, and keeps it while Right is held

#### Scenario: Coasting and braking
- **WHEN** the player releases Right at top speed
- **THEN** the mofa slows down gradually and still rolls on for at least one second, and holding Left instead stops it within about one second

#### Scenario: Rolling back
- **WHEN** the mofa stands still and the player holds Left
- **THEN** the mofa rolls backwards at no more than a quarter of its top speed, still facing right

#### Scenario: Hop
- **WHEN** the player presses Jump while the mofa is on the road
- **THEN** the mofa hops high enough to clear a Ferrari (rising at least 45 pixels), and lands back on the road; Jump in mid-air does nothing

#### Scenario: Touch
- **WHEN** the ride is played in touch mode
- **THEN** the pad's Right and Left, the Jump button and the Fire button control the mofa exactly as the keys do

### Requirement: Mounted machine gun
On the mofa Buck SHALL fire a machine gun mounted on the handlebars, with a faster fire rate than the standard blaster. Shots SHALL fly forward, or angled upward while Up is held. While riding, the HUD SHALL show "MOFA MG" as the weapon. The ride SHALL contain no weapon pickups, and leaving the ride SHALL give Buck the standard blaster.

#### Scenario: Firing forward
- **WHEN** the player holds Fire on the mofa for one second
- **THEN** the gun fires forward at its fire rate (at least 8 shots per second), each shot doing 1 damage

#### Scenario: Aiming up
- **WHEN** the player holds Up and Fire
- **THEN** the shots fly forward and upward at about 30 degrees, so they can hit things thrown over an SUV's roof

#### Scenario: HUD
- **WHEN** the ride is being played
- **THEN** the HUD weapon label reads "MOFA MG"

### Requirement: Machine gun sound
The mounted guns SHALL sound like heavy WW2 machine guns (.50 cal), not like the blaster: every volley SHALL be a deep, booming report (a heavy low thump, a crack and a short echo tail) of slightly varying pitch, so held Fire makes a slow, heavy "dug-dug-dug". The twin gun SHALL sound one report per volley (both guns together). The standard blaster on foot SHALL keep its sound.

#### Scenario: Rattle
- **WHEN** the player holds Fire on the mofa for one second
- **THEN** a heavy machine-gun report sounds with every volley (8 per second), each with a low thump (below 120 Hz) and an echo tail of at most 0.3 seconds, and the blaster's sound does not play

#### Scenario: On foot
- **WHEN** Buck fires the standard blaster on foot
- **THEN** the blaster's own sound plays, not the machine-gun report

### Requirement: Road ramps
The road SHALL have no obstacles of its own (no traffic cones, potholes or speed bumps): the danger comes from the cars. Wooden ramps SHALL launch the mofa into a long jump when taken at speed, up to pickups above the road.

#### Scenario: Clear road
- **WHEN** the ride level is loaded
- **THEN** it contains no traffic cones, potholes or speed bumps, and riding along the road costs no health without cars around

#### Scenario: Ramp
- **WHEN** the mofa takes a ramp at top speed
- **THEN** it flies at least twice as far as a normal hop before landing

### Requirement: Damage and respawn on the mofa
On the mofa, Buck SHALL take damage from car contact and thrown objects, with the same health, invulnerability, lives and game over rules as on foot. After losing a life he SHALL respawn on the mofa at the last checkpoint he passed, standing still on the road surface (also where a checkpoint stands on the climb). The ride SHALL contain at least two checkpoints (Swiss flags at the roadside), and each SHALL activate when the mofa passes it. A respawn SHALL be safe: no car on screen survives it.

#### Scenario: Respawn
- **WHEN** Buck loses a life during the ride after passing a checkpoint
- **THEN** he respawns at that checkpoint on the mofa, at a standstill, with full health

#### Scenario: Every checkpoint
- **WHEN** the mofa passes each checkpoint of the ride map in turn, and Buck loses a life after each
- **THEN** each checkpoint's flag goes up as it is passed, and each respawn puts the mofa at the last flag passed, its wheels on the road surface (on the climb too), with the camera on the road

#### Scenario: Safe respawn
- **WHEN** Buck respawns while cars are on screen
- **THEN** those cars are gone, no car touches him during his invulnerability, triggers already passed stay used, the limo keeps its damage, and riding on from the checkpoint works as before

#### Scenario: Game over on the ride
- **WHEN** Buck loses his last life on the ride
- **THEN** the game-over screen appears as on the other levels

### Requirement: Mofa engine sound
While the ride is played, the mofa SHALL make a two-stroke engine sound whose pitch and loudness rise with its speed, idling when stopped. The sound SHALL stop when the game is paused, the level ends or the sound is muted.

#### Scenario: Pitch follows speed
- **WHEN** the mofa accelerates from a standstill to top speed
- **THEN** the engine sound's pitch rises steadily, and it falls back to the idle sound when the mofa stops

#### Scenario: Silence when paused
- **WHEN** the game is paused during the ride
- **THEN** the mofa and car engine sounds stop until play resumes

### Requirement: Biker rock ride theme
The ride SHALL have its own music: a looping, original biker rock song in a 1970s style. It SHALL have a driving boogie-shuffle guitar riff, power chords, a bass line and a rock drum beat, and differ from the title theme in key, tempo and groove. It SHALL be synthesized live in the browser from the game's own note data, using no recordings, samples or copyrighted melody.

#### Scenario: Plays on the ride
- **WHEN** the reel 1 intro card appears after the player presses Enter on the title
- **THEN** the title theme stops and the biker rock song plays from its start, and it keeps looping through the ride and its level tally without a gap

#### Scenario: Valkyries from reel 2
- **WHEN** the reel 2 intro card appears after the ride
- **THEN** the biker rock song stops and the clay courts' funk track plays from its start (the Valkyries follow from reel 3)

#### Scenario: Respawn keeps the song
- **WHEN** Buck loses a life during the ride and respawns
- **THEN** the biker rock song keeps playing without restarting

#### Scenario: Rock instrumentation
- **WHEN** one loop of the biker rock song is played
- **THEN** it contains shuffled guitar riff notes, power chords, bass notes, kick and snare drums, and its tempo differs from the title theme's 132 bpm

#### Scenario: Not on other reels
- **WHEN** a game is started with `#level=2` or any later reel
- **THEN** the biker rock song is never played in that game

#### Scenario: Mute
- **WHEN** the player presses M or taps Mute during the ride
- **THEN** the song becomes silent until sound is turned on again

### Requirement: Twin machine gun
The mofa SHALL carry two heavy machine guns: one on the handlebars facing forward and one on the luggage rack facing backward. While Fire is held, both SHALL fire at the same time at 8 volleys per second, so cars ahead and behind are shot together. Up SHALL angle the front gun only; the rear gun fires level. There SHALL be no automatic fire: without Fire held, neither gun shoots.

#### Scenario: Both directions
- **WHEN** the player holds Fire on the mofa for one second
- **THEN** at least 8 shots fly forward and at least 8 fly backward, each doing 1 damage

#### Scenario: Car from behind
- **WHEN** a car is behind the mofa with its front on screen and the player holds Fire
- **THEN** the rear gun's shots hit it and damage it

#### Scenario: No automatic fire
- **WHEN** a car is behind the mofa and the player does not hold Fire
- **THEN** no gun fires

#### Scenario: Aiming up
- **WHEN** the player holds Up and Fire
- **THEN** the front gun's shots fly forward and upward at about 30 degrees and the rear gun's shots fly level backward

### Requirement: Two-stroke smoke
The mofa SHALL trail blue-grey two-stroke exhaust smoke from its exhaust pipe behind the rear wheel: a few puffs at idle and a thick trail when accelerating. The puffs SHALL drift backwards and upwards and fade out.

#### Scenario: Idle and riding
- **WHEN** the mofa stands still for one second, and then accelerates with Right held for one second
- **THEN** it puffs at least 3 times at idle and at least 12 times while accelerating, the accelerating puffs larger and darker

#### Scenario: Puffs fade
- **WHEN** a puff leaves the exhaust
- **THEN** it starts behind the rear wheel, rises and drifts back, and has faded out within 1.5 seconds

### Requirement: Ride stretches
The ride SHALL lead through four stretches in order: the lake promenade, Wollerau village, the vineyard climb and the club on the hill. Each stretch SHALL have its own photo backdrop and its own roadside decoration, and the backdrop SHALL blend from one stretch into the next.

#### Scenario: Four stretches
- **WHEN** the mofa rides from the start to the gate
- **THEN** it passes the lake promenade, the village, the vineyard climb and the club in that order, each showing its own backdrop and decoration

#### Scenario: Smooth change
- **WHEN** the camera crosses the border between two stretches
- **THEN** the backdrop blends from one to the next over at least one screen width, without a hard cut

### Requirement: Climb to the club
In the last third of the ride, the road SHALL climb steadily up to the club on the hill, at least 6 tiles in all, as a smooth slope without steps. Uphill, the mofa SHALL be slower, with a top speed at least 25% lower on the steepest parts, and its engine SHALL sound strained. Cars, pickups, signs and fans SHALL follow the road's height, and the camera SHALL follow the mofa up.

#### Scenario: Smooth slope
- **WHEN** the mofa rides up the climb at full throttle
- **THEN** it stays on the road surface at every point, without bumping into a step or leaving the road, and ends at least 6 tiles higher than where the climb began

#### Scenario: Harder uphill
- **WHEN** the mofa holds full throttle on the steepest part of the climb
- **THEN** its speed settles at least 25% below its top speed on the flat, and the engine pitch shows it working at full throttle

#### Scenario: Everything on the slope
- **WHEN** a car drives, or a pickup, sign or fan stands, on the climb
- **THEN** it sits on the road surface at its position

### Requirement: WD-40 cans
On the ride, the health items SHALL be WD-40 spray cans instead of Rivella and Cervelat: a blue-and-yellow spray can that gives 2 health, shows "WD-40 +2" and a spray puff when picked up. The ride map SHALL contain no Rivella or Cervelat. The other levels SHALL keep their items.

#### Scenario: Picking one up
- **WHEN** Buck on the mofa touches a WD-40 can with 5 health
- **THEN** he has 7 health, "WD-40 +2" floats up, a spray puff and the health sound play, and the can is gone

#### Scenario: Ride only
- **WHEN** the levels are built
- **THEN** the ride map holds WD-40 cans but no Rivella or Cervelat, and the build fails if a ride map contains them

### Requirement: Buck's one-liners on the ride
When a car is destroyed on the ride, Buck SHALL say a short, down-to-earth Swiss German line in a speech bubble above him, at most one every 3 seconds. The lines SHALL come from the ride's quote pack (its `kill` section), be at most 20 characters, drawable with the game font (which includes Ä, Ö and Ü), at least 12 different, and dry rather than explicit.

#### Scenario: After a kill
- **WHEN** Buck destroys a car and has not spoken in the last 3 seconds
- **THEN** a Swiss German line (for example "SO, FERTIG." or "GÄLL, DAS HET GSESSE") appears in a bubble above Buck for about 1.5 seconds, placed like the other bubbles without overlapping them

#### Scenario: Not after every kill
- **WHEN** Buck destroys two cars within 3 seconds
- **THEN** only the first kill gets a line

#### Scenario: Umlauts
- **WHEN** a line with Ä, Ö or Ü is shown
- **THEN** the letters are drawn with their dots, in the game's pixel font

#### Scenario: From the ride's pack
- **WHEN** the ride's quote pack is edited (a line added to its `kill` section) and the game is rebuilt
- **THEN** the new line can appear after a car kill, without any code change

### Requirement: Limo finale
When the president's limo is destroyed, play SHALL pause for a short scene of about 5 seconds: the mofa rolls to a stop, the president runs off, the two posh ladies crawl out of the wreck one after the other and each calls out an arrogant line, then Buck answers "YOU HAVE NO CLUE" and lights a cigarette. Fire or Jump SHALL skip the scene. Afterwards control SHALL return with the gate open, and Buck SHALL keep the cigarette, puffing smoke, until the ride ends.

#### Scenario: The scene
- **WHEN** the limo's health reaches 0
- **THEN** after the explosion the player cannot move or fire, the ladies crawl out of the wreck on hands and knees, each says a line in a bubble (for example "MY DRESS! IT'S DIOR!"), Buck's bubble "YOU HAVE NO CLUE" follows, and he lights a cigarette with a small flame and a puff of smoke

#### Scenario: Back in control
- **WHEN** the scene ends (after about 5 seconds) or the player presses Fire or Jump
- **THEN** control returns, the gate is open, the ladies stand up and run off, and riding through the gate ends the level

#### Scenario: Cigarette
- **WHEN** Buck rides on after the scene
- **THEN** a lit cigarette glows at his mouth and a small puff of smoke rises from it every second or so, until the level ends

#### Scenario: No damage during the scene
- **WHEN** the scene plays
- **THEN** Buck cannot be hurt, no cars spawn, and no corks are thrown
