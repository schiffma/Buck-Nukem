# Design

## Context

See proposal.md for the motivation. Current state:
- `src/audio.js` holds a song table `SONGS = { title: ROCK, valkyries: SONG, biker: BIKER }`. Each song is `{ events, steps, sixteenth, bpm[, swing] }`: one event list per sixteenth step, events like `{ v: "rbass", m: <midi>, d: <sixteenths> }`. `Sound.playEvent` turns each event into Web Audio nodes (oscillators, gains, biquad filters, noise buffers, the soft-clip WaveShaper used by the guitars).
- `Game.setState` picks the track: `"title"` on the title, `"biker"` when the level is the ride, otherwise `"valkyries"`. `Sound.setTrack` restarts at step 0 only when the track changes, so pauses, respawns and tallies keep the song running.
- The boss arena sets `Sound.setTempo(1.25)` on load.
- The promo recorder (`tools/promo/bridge.js`) logs `setTrack` switches and renders the music offline from `SONGS` with `Sound.playEvent` on an `OfflineAudioContext` proxy that offers oscillators, gains, biquads, buffers and wave shapers.
- Level files have `key: value` headers parsed generically by `tools/build.py`.

## Goals / Non-Goals

**Goals:**
- An original 70s funk track for reel 2 and the traditional Clarinet Polka for reel 4 in the game's own arrangement, recognisably in their genres, built in the same data format as the other songs.
- The track per reel as level data, so the mapping is visible in the level files and tested.
- No change to the title, ride, creek or boss music; the promo audio keeps working.

**Non-Goals:**
- Samples, recordings or any copyrighted melody (no quoted funk riffs, no copied arrangement; the clubhouse melody is the public-domain Clarinet Polka).
- Different music inside parts of a level (e.g. only in the bar room); the song covers the whole clubhouse level.
- Volume mixing beyond a first balance; the final balance is checked by ear in the play test.

## Decisions

### 1. Track per level: a `music:` header
- `1_road.txt`: `music: biker`; `2_courts.txt`: `music: funk`; `4_clubhouse.txt`: `music: clarinetpolka`. Creek and boss have no header and default to `valkyries`.
- `Level` keeps `this.music = data.music || "valkyries"`; `Game.setState` uses `Sound.setTrack(this.level ? this.level.music : "valkyries")` for every non-title state. The ride check goes.
- `tools/build.py` fails on a `music:` value that is not a key of the song table (the names are listed in the build script next to the other checks).
- Alternative considered: a table in `main.js` keyed by level index. Rejected: reel numbers shifted once already with the ride; the header travels with the level.

### 2. The funk track (`SONGS.funk`)
- 104 bpm, 16 steps per bar, a light sixteenth swing (`swing: 0.12`), E dorian, 16 bars:
  - bars 1–8 groove on E9: syncopated slap bass (root on 1, octave pops on the "a" sixteenths, ghosted dead notes), sixteenth chicken-scratch guitar (muted, accented on 2 and 4), clavinet chords on the off-beat sixteenths;
  - bars 9–12 move to A9 – A9 – B7#9 – B7#9 with brass stabs on the "and" of 4;
  - bars 13–14 a break (bass and drums only, kick on the one, a bass run);
  - bars 15–16 a turnaround with a brass line rising into the top (crash on bar 1).
- Beat: kick on 1, the "a" of 2 and 3; snare on 2 and 4 with ghost notes; closed hats on every sixteenth, an open hat on the "and" of 4.
- New voices (event `v` names): `slap` (bass pluck: a triangle plus a short square transient through a fast-closing lowpass; a `pop` flag for the bright octave notes), `clav` (two detuned squares through a bandpass with a fast decay), `scratch` (a noise burst through a bandpass mixed with a muted `guitar()` chord, 25 ms), `brass` (three detuned sawtooths through a lowpass with a short swell), `ohat` (a longer high-passed noise).

### 3. The Clarinet Polka (`SONGS.clarinetpolka`)
Play-test revisions: a beer polka, an original Ländler and "Ramseyers wei go grase" came first; the clubhouse now plays the Clarinet Polka. None of those was released; their songs and the Ländler voices (`orgeli`, `bassg`, `piano`) are removed.
- **Source and rights:** the melody comes from the MIDI file `clarinet-polka.mid` on flutetunes.com (a melody-only flute part, labelled "Traditional Polish"): 583 notes, 2/4, 112 bpm, key signatures B♭ → F → E♭ (the polka's trio), about 82 bars. The tune is traditional, or by Karol Namysłowski ("Dziadunio Polka", copyrighted 1913, died 1925); it is in the public domain either way (life + 70 years; US publications before 1929). Later arrangements (e.g. one registered in 1941) are not used: only the note sequence of the melody is taken; chords, voicing and orchestration are the game's own.
- **Import, not hand transcription:** a small one-off script (`tools/midi_melody.py`) reads the MIDI file (format 1, 384 ticks per quarter) and prints the melody as `[step, midi, steps]` triples per bar into `src/audio.js` (`CLARINET_POLKA_TUNE`), with a source comment. The MIDI file is not shipped; the script and its expected output are kept so the import can be repeated.
- **Time grid:** the tune has sixteenth-note triplets (64 ticks), so the song uses a grid of twelfths of a quarter (32 ticks per step): a sixteenth is 3 steps, a triplet sixteenth 2 steps; a 2/4 bar is 24 steps. `sixteenth` (the step length the scheduler reads) is 60 / bpm / 12; the scheduler needs no change. Swing is off.
- **Harmony (the game's own):** per bar, the chord is chosen from the current key's I, IV, V7 (and the trio's own I and V7) as the one covering the most melody notes on the beats, with ties broken towards the previous chord; the result is reviewed by ear and can be overridden per bar in a small table.
- **Band:** `clar` plays the tune (louder and brighter than as a second voice: a `lead` flag raises its level and filter); `tuba` on beats 1 and 2 (root, then fifth), `accord` chords on the off-beats ("and" of 1 and 2), a light `kick` with the tuba and `snare` (ghost level) on the off-beats; a `clink` at the end of each section. `tuba` and `accord` return from the first polka plan (same voices); `orgeli`, `bassg` and `piano` go.
- **Length:** the whole tune as written, about 90 s at 112 bpm (form as in the source); it loops seamlessly from its last bar to its first. The clubhouse takes about a minute, so the player mostly hears it once.
- The level header becomes `music: clarinetpolka`; the build's track list and the tests follow; `SONGS.ramseyer` and `RAMSEYER_TUNE` are removed.

### 4. Mixing and the promo
- All new voices go into the existing `music` bus at levels comparable to the Valkyries' lead (checked with a short offline render: peak and RMS within ±3 dB of the Valkyries).
- The voices use only node types the promo proxy offers, so `renderAudio()` plays them without changes; a promo dry run confirms no errors. A full recording is the user's call.

### 5. Tests
- Song shape: `SONGS.funk` is 16 bars of 16 steps, `SONGS.clarinetpolka` in 2/4 on a grid of 24 steps per bar; bpm within the specified ranges; one loop contains the specified voices; the clubhouse song has a tuba note on each beat and accordion chords off the beat in every bar; its clarinet melody equals the imported note list, which in turn matches the MIDI's note count, first and last notes and key changes.
- Tracks per reel: the reel 1–5 intros select `biker`, `funk`, `valkyries`, `clarinetpolka`, `valkyries` (tempo 1.25 on the boss), each starting at step 0; pause, respawn and the level tally keep the track and its step; `#level=2` and `#level=4` start with the funk and the clubhouse song.
- Scheduler: with a stubbed clock both songs loop without a gap.
- Build: an unknown `music:` value fails the build (unit test in `tools/test_build.py`).
- The existing route tests that expect the Valkyries at reel 2 and a running Valkyries from reel 2 into reel 3 are updated.

## Risks / Trade-offs

- [The tunes sound cheesy or like a known song] → original note data, short motifs; the user listens in the play test, and the songs are pure data, cheap to change.
- [More voices raise CPU load on phones] → per step at most about six notes (comparable to the rock title); `perf_phone.py` on the courts stays within its budget.
- [Archive order] → this change modifies the soundtrack requirement as `add-title-rock-music` leaves it; archive `add-title-rock-music` first, then this one.
- [The derived chords sound wrong in places] → a per-bar override table; the user checks by ear.
- [Rights] → only the public-domain melody is used, not any published arrangement; the source and the attribution (traditional / Namysłowski) are noted in the code and the README.
- [The fast clarinet runs sound smeared] → the clarinet voice's attack is short; at 112 bpm a triplet sixteenth is 89 ms, enough for each note to speak.
- [Song length] → about 2,000 steps of event lists, a few kB of data; no effect on the frame time.
