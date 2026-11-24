# Spec Delta

## MODIFIED Requirements

### Requirement: Ride of the Valkyries soundtrack
The game SHALL play a looping chiptune arrangement of Wagner's "Ride of the Valkyries", synthesized in the browser, during play: on level intro cards, in every level except the mofa ride, and in the boss arena. Because browsers block audio until the user interacts, music SHALL start on the first key press, mouse click or touch, or immediately on page load where the browser allows autoplay. The title screen plays the 70s rock title theme, the ride its biker rock song.

#### Scenario: Music starts after first input
- **WHEN** audio is not yet running and the player presses any key on the title screen, Enter included
- **THEN** the 70s rock title theme starts playing and loops, and the title screen stays

#### Scenario: Music starts after a click or touch
- **WHEN** the player's first interaction with the page is a mouse click or a touch on the title screen
- **THEN** the 70s rock title theme starts playing and loops, and the title screen stays

#### Scenario: Valkyries play once the game starts
- **WHEN** a game reaches its first reel other than the mofa ride (the reel 2 intro after the ride, or the first intro of a game started with `#level=2` or later)
- **THEN** the theme playing before stops and the Ride of the Valkyries theme plays from its start and loops

#### Scenario: Boss music intensifies
- **WHEN** the boss arena starts
- **THEN** the theme plays at a faster tempo

## ADDED Requirements

### Requirement: 70s rock title theme
The title screen SHALL play a looping, original hard-rock theme in a 1970s style: a distorted guitar riff with power chords, bass and a rock drum beat. It SHALL be synthesized live in the browser from the game's own note data, using no recordings or samples and no copyrighted melody.

#### Scenario: Rock theme loops on the title
- **WHEN** music is playing and the title screen stays open longer than one full loop of the theme
- **THEN** the theme repeats from its start without a gap

#### Scenario: Rock instrumentation
- **WHEN** one loop of the title theme is played
- **THEN** it contains guitar riff notes, power chords, bass notes, kick and snare drums

#### Scenario: Back to the title
- **WHEN** the player returns to the title screen from the game over or victory screen
- **THEN** the Valkyries theme stops and the title theme plays from its start at normal tempo

#### Scenario: Mute covers the title theme
- **WHEN** the player presses M on the title screen while the title theme plays
- **THEN** the title theme becomes silent until M is pressed again

### Requirement: Reliable title music
The title screen SHALL always play the rock title theme once audio is allowed: the game SHALL try to start audio on page load, SHALL start it on the first key, click or touch otherwise, and SHALL keep the music playing in time after the tab was in the background or the browser suspended audio. While audio is supported but not yet running, the first input on the title SHALL only start the sound, not the game, and the title SHALL say so.

#### Scenario: Sound first, then the game
- **WHEN** the title screen is shown with audio supported but not yet running
- **THEN** the title reads "PRESS ANY KEY FOR SOUND" (in touch mode "TAP FOR SOUND"); the first key, click or tap starts the title theme and the title stays, now reading "PRESS ENTER" ("TAP TO START"); the next Enter or tap starts a game

#### Scenario: Enter starts at once when the sound is on
- **WHEN** audio already runs on the title (autoplay allowed, or after the first input), or the browser has no Web Audio at all
- **THEN** Enter (or a tap) starts a game right away

#### Scenario: Autoplay where allowed
- **WHEN** the page is opened in a browser that allows autoplay
- **THEN** the title theme starts without any input

#### Scenario: Background tab
- **WHEN** the tab was in the background for 10 seconds while the title theme played and becomes visible again
- **THEN** the theme continues in time from the current moment, and no notes scheduled for the missed time are played late in a burst

#### Scenario: Suspended audio resumed
- **WHEN** the browser has suspended the audio context and the player interacts with the page or the tab becomes visible
- **THEN** audio resumes and the title theme plays again

#### Scenario: Every way back to the title
- **WHEN** the title screen is reached by the first start, by Enter on the game-over card, by Enter on the victory card, or M is pressed twice on the title
- **THEN** the title theme is the active track at normal tempo and plays (unless muted)
