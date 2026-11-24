# Spec Delta

## MODIFIED Requirements

### Requirement: Ride of the Valkyries soundtrack
The game SHALL play a looping chiptune arrangement of Wagner's "Ride of the Valkyries", synthesized in the browser, in the creek level and the boss arena, including their intro cards; the other reels and the title have their own tracks. Because browsers block audio until the user interacts, music SHALL start on the first key press, mouse click or touch, or on page load where autoplay is allowed.

#### Scenario: Music starts after first input
- **WHEN** audio is not yet running and the player presses any key on the title screen, Enter included
- **THEN** the 70s rock title theme starts playing and loops, and the title screen stays

#### Scenario: Music starts after a click or touch
- **WHEN** the player's first interaction with the page is a mouse click or a touch on the title screen
- **THEN** the 70s rock title theme starts playing and loops, and the title screen stays

#### Scenario: Valkyries play once the game starts
- **WHEN** a game reaches the reel 3 intro (after the courts, or as the first intro of a game started with `#level=3`) or the boss arena's intro
- **THEN** the theme playing before stops and the Ride of the Valkyries theme plays from its start and loops

#### Scenario: Boss music intensifies
- **WHEN** the boss arena starts
- **THEN** the theme plays at a faster tempo

#### Scenario: Each reel its own track
- **WHEN** a game plays through the reels in order
- **THEN** the reel intros start, in turn, the biker rock song (reel 1), the funk track (reel 2), the Valkyries (reel 3), the Clarinet Polka (reel 4) and the faster Valkyries (reel 5), each from its start

## ADDED Requirements

### Requirement: Funk theme for the clay courts
The clay courts (reel 2) SHALL have their own looping, original funk track in a 1970s style: a syncopated slap bass line, a muted "chicken-scratch" rhythm guitar on sixteenth notes, clavinet chords, brass stabs and a tight funk beat with sixteenth-note hi-hats. It SHALL differ from the other tracks in key, tempo and groove, and SHALL be synthesized live in the browser from the game's own note data, using no recordings, samples or copyrighted melody.

#### Scenario: Plays on the courts
- **WHEN** the reel 2 intro card appears (after the ride, or as the first intro of a game started with `#level=2`)
- **THEN** the theme playing before stops and the funk track plays from its start, and it keeps looping through the level, pauses, respawns and its level tally without restarting

#### Scenario: Funk instrumentation
- **WHEN** one loop of the funk track is played
- **THEN** it contains slap bass notes, muted guitar scratches, clavinet chords, brass stabs, kick and snare drums and closed and open hi-hats, at a tempo between 96 and 112 bpm

#### Scenario: Mute
- **WHEN** the player presses M or taps Mute on the courts
- **THEN** the funk track becomes silent until sound is turned on again

### Requirement: Clarinet Polka in the clubhouse
The clubhouse and indoor hall (reel 4) SHALL play the traditional Clarinet Polka in the game's own arrangement: the clarinet plays the tune over an oom-pah polka band (tuba on the beat, accordion chords off the beat, a light snare and kick), with beer-glass clinks at the section ends. It SHALL be synthesized live from note data, with no recordings, samples or copied arrangement.

#### Scenario: Plays in the clubhouse
- **WHEN** the reel 4 intro card appears (after the creek, or as the first intro of a game started with `#level=4`)
- **THEN** the theme playing before stops and the Clarinet Polka plays from its start, and it keeps looping through the level, pauses, respawns and its level tally without restarting

#### Scenario: Recognisable tune
- **WHEN** the clubhouse song is played
- **THEN** its clarinet melody follows the traditional Clarinet Polka note for note (as in the public melody transcription it is taken from), including its runs and triplets and its sections in B-flat, F and E-flat, in 2/4 time at a tempo between 100 and 130 quarter notes per minute

#### Scenario: Polka band
- **WHEN** the clubhouse song is played
- **THEN** every bar has a tuba note on the beat and accordion chords off the beat that fit the melody's harmony, a light snare and kick keep the oom-pah, and glass clinks mark the section ends

#### Scenario: Mute
- **WHEN** the player presses M or taps Mute in the clubhouse
- **THEN** the song becomes silent until sound is turned on again
