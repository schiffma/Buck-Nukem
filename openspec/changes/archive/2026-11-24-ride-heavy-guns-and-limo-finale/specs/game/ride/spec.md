# Spec Delta

## MODIFIED Requirements

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

### Requirement: Machine gun sound
The mounted guns SHALL sound like heavy WW2 machine guns (.50 cal), not like the blaster: every volley SHALL be a deep, booming report (a heavy low thump, a crack and a short echo tail) of slightly varying pitch, so held Fire makes a slow, heavy "dug-dug-dug". The twin gun SHALL sound one report per volley (both guns together). The standard blaster on foot SHALL keep its sound.

#### Scenario: Rattle
- **WHEN** the player holds Fire on the mofa for one second
- **THEN** a heavy machine-gun report sounds with every volley (8 per second), each with a low thump (below 120 Hz) and an echo tail of at most 0.3 seconds, and the blaster's sound does not play

#### Scenario: On foot
- **WHEN** Buck fires the standard blaster on foot
- **THEN** the blaster's own sound plays, not the machine-gun report

## ADDED Requirements

### Requirement: Buck's one-liners on the ride
When a car is destroyed on the ride, Buck SHALL say a short, down-to-earth Swiss German line in a speech bubble above him, at most one every 3 seconds. The lines SHALL be at most 20 characters, drawable with the game font (which includes Ä, Ö and Ü), at least 12 different, and dry rather than explicit.

#### Scenario: After a kill
- **WHEN** Buck destroys a car and has not spoken in the last 3 seconds
- **THEN** a Swiss German line (for example "SO, FERTIG." or "GÄLL, DAS HET GSESSE") appears in a bubble above Buck for about 1.5 seconds, placed like the other bubbles without overlapping them

#### Scenario: Not after every kill
- **WHEN** Buck destroys two cars within 3 seconds
- **THEN** only the first kill gets a line

#### Scenario: Umlauts
- **WHEN** a line with Ä, Ö or Ü is shown
- **THEN** the letters are drawn with their dots, in the game's pixel font

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
