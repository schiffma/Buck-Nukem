# Spec Delta

## MODIFIED Requirements

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
