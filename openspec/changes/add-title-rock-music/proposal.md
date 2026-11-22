# Proposal

## Why

The game is styled as a 1970s grindhouse movie, but the title screen plays the same Wagner chiptune loop as the levels. A greasy 70s hard-rock riff on the poster title would sell the grindhouse mood and give the levels' Valkyries theme more impact when the reel starts. Real 70s rock recordings are copyrighted and the game must stay one offline HTML file, so the track must be an original composition synthesized live, like the existing soundtrack.

## What Changes

- Add an original, looping 70s-style hard-rock title theme (distorted "guitar" riff, power chords, bass, rock drum beat), synthesized in Web Audio. No recordings, no samples, no new files.
- The title theme plays on the title screen. Browsers block sound until the player interacts, so it starts as soon as that is allowed (see below).
- Starting a game switches to the existing Ride of the Valkyries loop for level intros, levels and the boss arena (unchanged, including the faster boss tempo).
- Returning to the title screen after game over or victory switches back to the rock theme.
- Mute (M) silences both tracks as before.
- The title music starts reliably: on the first key press, mouse click or touch, and right away on page load where the browser allows autoplay. It keeps playing correctly after the tab was in the background (no burst of missed notes, audio resumed if the browser suspended it), and every way back to the title (first start, game over, victory, mute and unmute) plays the rock theme.
- The promo video recorder renders the rock theme for the title-screen part of the video and the Valkyries afterwards.
- README credits describe the new track as original to the project.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `game/presentation`: the "Ride of the Valkyries soundtrack" requirement changes. Music becomes two tracks: an original 70s-rock title theme on the title screen and the Valkyries loop during play, and audio also starts on a click, touch or autoplay. New requirements "70s rock title theme" and "Reliable title music".

## Impact

- `src/audio.js`: second song definition, new instrument voices (distorted guitar, power chord, crash), and track switching in the `Sound` scheduler.
- `src/main.js`: selects the track on state changes (title vs. game).
- `src/input.js`: mouse/touch interactions also count as the first interaction that unlocks audio.
- `tools/promo/recorder.js`: offline audio render follows track changes instead of assuming the Valkyries loop from t = 0.
- `src/test.js`: new music tests; existing Valkyries tests keep passing.
- `README.md`: Credits and the `audio.js` line in the source layout.
- File size: a few KB of code; the build stays well under the 2 MB limit. No new dependencies.
