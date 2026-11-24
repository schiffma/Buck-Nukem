# Proposal

## Why

Play-test feedback: after the title rock theme and the ride's biker song, every later reel plays the same Ride of the Valkyries loop. The clay courts should groove to funky music, and the clubhouse with its Einsiedler bar calls for a beer-hall classic: the Clarinet Polka.

## What Changes

- Reel 2, the TC Wollerau clay courts, gets its own looping, original **70s funk** track: slap bass, a muted "chicken-scratch" guitar, clavinet, brass stabs and a tight funk beat.
- Reel 4, the clubhouse and indoor hall, plays the **Clarinet Polka** ("Dziadunio Polka", traditional Polish, around 1900) in the game's own arrangement: the clarinet plays the famous tune with its runs, over an oom-pah polka band (tuba bass on the beat, accordion chords off the beat, a light polka snare and kick), with beer-glass clinks at the section ends. The melody is traditional, or by Karol Namysłowski (died 1925, copyrighted 1913), and therefore in the public domain either way; it is taken note for note from a public MIDI transcription (flutetunes.com, a melody-only flute part); the chords and the arrangement are the game's own, no later published arrangement is copied. (Play-test revisions: this replaces the beer polka, the original Ländler and "Ramseyers wei go grase" planned before.)
- The Valkyries stay for reel 3 (the Krebsbach creek) and the boss arena (faster there, as now).
- Each level names its own track; every reel's intro card starts that reel's track from the beginning, and it keeps playing through the level, pauses, respawns and the level tally.
- The funk is an original composition; the Clarinet Polka is a public-domain melody in the game's own arrangement. Both are synthesized live from the game's own note data like the other tracks: no recordings, samples or copyrighted material (no known funk riff, no copied arrangement).
- The promo video's audio renders the new tracks too.
- Builds on the open change `add-title-rock-music` (its soundtrack requirement is the base here), so that change is archived first.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `game/presentation`: the "Ride of the Valkyries soundtrack" requirement now covers the Valkyries only in the creek and the boss arena; new requirements "Funk theme for the clay courts" and "Clarinet Polka in the clubhouse".
- `game/ride`: the "Biker rock ride theme" requirement's hand-over at reel 2 goes to the funk track instead of the Valkyries.

## Impact

- `src/audio.js`: two new songs in the song table and new voices (slap bass, clavinet, scratch guitar, brass, open hat; clarinet lead, tuba, accordion chords, polka snare, glass clink (the Ländler voices go)), built only from oscillators, filters, noise and the existing distortion, so the promo's offline renderer can play them.
- `src/main.js`: the track per level from a `music:` level header instead of the ride check.
- `src/levels/*.txt`: `music:` headers (ride `biker`, courts `funk`, clubhouse `clarinetpolka`; creek and boss default to the Valkyries); `tools/build.py` rejects an unknown track name.
- `src/test.js`: song shape and instrument tests, track-per-reel route tests; `tools/promo/bridge.js` needs no change beyond rendering the new songs, checked with a dry run.
- `README.md`: the music notes and credits.
