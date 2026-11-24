# Design

## Context

`src/audio.js` holds one song, `SONG` (16 bars of 9/8 Valkyries, built as an array of per-sixteenth event lists), and a `Sound` object with a look-ahead scheduler (`schedule()` every 25 ms, 120 ms horizon) that plays `SONG.events[step]` through `playEvent()`. `Sound.sixteenth` (0.1 s) is a single constant and `setTempo()` scales it (boss: 1.25). Music starts on the first key press via `Input.anyKeyListeners`; the title screen shows "(ANY KEY STARTS THE MUSIC)" until the AudioContext exists.

`src/main.js` drives a state machine (`Game.setState`). The title is `STATE.TITLE`; `newGame()` / level start sets the tempo and enters `STATE.LEVEL_INTRO`; game over and victory return to `STATE.TITLE` on Enter.

`tools/promo/recorder.js` re-renders the music offline: it assumes the Valkyries loop from t = 0 and follows a logged list of tempo changes. Its fake AudioContext proxy only exposes oscillator, gain, biquad, buffer source and buffer factories. The autopilot waits 3 s on the title before pressing Enter, so promo videos open on the title screen.

`src/test.js` checks the Valkyries song shape (`SONG.steps === 16 * 18`, melody, seamless loop, boss tempo) by stubbing `Sound.tone` and filtering lead notes by `vol === 0.22`.

## Goals / Non-Goals

**Goals:**
- A second, original song in the same event-list format, with rock-specific voices.
- Track switching driven by game state, with each switch restarting the new song from step 0.
- Keep the existing Valkyries data, voices, tests and boss tempo behaviour unchanged.
- The promo recording sounds the same as the live game.

**Non-Goals:**
- No audio files, samples or `AudioBuffer` recordings of instruments; no new build steps.
- No cross-fades between tracks (a hard cut fits the film-reel cut to the intro card).
- No separate music volume settings or track selection menu.
- Game over, level complete and victory screens keep the Valkyries track (unchanged).

## Decisions

### 1. Songs table instead of a single `SONG`
Introduce `SONGS = { title: ROCK, valkyries: SONG }`, each `{ events, steps, sixteenth }`. Keep the global `SONG` name as the Valkyries entry so existing tests and the recorder keep compiling. `Sound` gets `track` (default `"title"`) and `setTrack(name)`: if the name differs it sets `track`, resets `step = 0` and `nextTime = ac.currentTime + 0.05` (when playing). `schedule()` reads `SONGS[this.track]` and uses that song's `sixteenth / tempo`.
*Alternative:* two independent schedulers. Rejected: two timers, harder to guarantee only one plays, and more code for mute and tests.

### 2. Track selection in `Game.setState`
`setState` calls `Sound.setTrack(s === STATE.TITLE ? "title" : "valkyries")` and, for the title, `Sound.setTempo(1)`. PAUSE, LEVEL_COMPLETE, GAME_OVER and VICTORY map to `"valkyries"`, and because `setTrack` is a no-op when the track does not change, the Valkyries keep running uninterrupted across those screens as today. The pause resume path assigns `state` directly and never leaves the Valkyries, so it needs no change.
*Alternative:* call `setTrack` at each individual transition site. Rejected: easy to miss one (e.g. victory → title).

### 3. Rock song shape
4/4 at about 132 bpm (`sixteenth` ≈ 0.114 s), 16 bars × 16 steps = 256 steps, E minor / E blues tonality. Structure:
- Bars 1–8: main riff. Palm-muted low-E eighth-note chug with a pentatonic riff answer in the second half of each bar (e.g. E–G–A–Bb–A–G–E, varied in bars 4 and 8 with a turnaround). The riff is composed for this project and must not quote known riffs (no "Smoke on the Water", "Iron Man", "Whole Lotta Love" etc.); the implementer checks the final notes against this rule.
- Bars 9–14: power-chord section, sustained/staccato power chords on a progression such as E5–G5–A5–C5–D5–E5, bass following roots in eighths.
- Bars 15–16: drum fill (snare/tom-style sweeps) and a riff break back into bar 1; crash on bar 1 and bar 9.
- Drums throughout: kick on 1 and 3 (plus syncopated kicks in the riff), snare on 2 and 4, eighth-note hats.

### 4. Rock voices
New `playEvent` cases, all routed to `this.music`:
- `gtr` (single riff note): two detuned sawtooths into a shared `WaveShaperNode` (soft-clip curve built once in `unlock()`) and a lowpass around 2.5–3 kHz for the "amp" tone. Palm-muted notes use a lower cutoff and shorter envelope (`pm: true` flag on the event).
- `pow` (power chord): root, fifth and octave sawtooths into the same distortion chain.
- `rbass`: square/sawtooth an octave down, lowpassed, so it differs from the Valkyries' triangle bass.
- `crash`: long noise burst with a high cutoff; `tom`: short sine sweep. Kick, snare and hat reuse the existing voices.
A helper `dist(t, ...)` creates the per-note oscillators and connects them to a shaper node; volumes avoid `0.22` so the existing lead-note test filter does not pick up rock notes.

### 5. Promo recorder follows track changes
Wrap `Sound.setTrack` like `setTempo` and log `{ t, track }`. `renderAudio()` merges the tempo and track logs; on a track change it restarts at step 0 of the new song and uses that song's `sixteenth`. Add `createWaveShaper` to the offline proxy, and let the shaper curve be created from whatever context `Sound.ac` is (the recorder sets `S.ac = proxy` before rendering).

Render the audio in 30-second chunks: one `OfflineAudioContext` per chunk (plus a 3 s tail for notes that ring past the chunk end), each holding only the notes and effects that start in that chunk, mixed into one buffer by sample offset. A single context for a full ~10-minute run holding every note at once renders in roughly quadratic time (20 s of audio: 0.26 s, 60 s: 2.75 s, so about 4–5 minutes for a full run), which trips the recorder's 120 s no-progress watchdog. Chunks keep the cost linear, and the page posts a log line per chunk.

### 6. Title hint text
Keep "(ANY KEY STARTS THE MUSIC)"; it stays accurate.

### 7. Reliable start and resync
- **Unlock on any interaction:** `pointerdown` and `touchstart` listeners (once) call the same unlock-and-start path as the first key. The hint "(ANY KEY STARTS THE MUSIC)" becomes "(PRESS A KEY OR CLICK FOR MUSIC)".
- **Autoplay attempt:** on boot, create the `AudioContext` and call `resume()`; if `state` becomes `"running"`, start the music immediately; otherwise leave it suspended for the first interaction (no error, no console noise).
- **Resync after stalls:** background tabs throttle `setInterval` to about once per second, so `schedule()` can fall far behind. If `nextTime` is more than 0.1 s behind `currentTime`, skip ahead: advance `step` by the number of missed sixteenths (modulo the song length) and set `nextTime = currentTime + 0.05`, so the song stays in time and nothing is played late.
- **Resume:** on `visibilitychange` (visible) and on every interaction, call `ac.resume()` if the context is `"suspended"`.
- **Tests:** a click unlocks and starts the title theme; the autoplay path starts music when the context reports `"running"` (stubbed); a fake clock jumped 10 s ahead produces no events scheduled in the past and continues at the right step; game over → title, victory → title and M twice on the title all leave the title track active and playing.

### 8. Sound first on the title
Play-test feedback: the title theme is never heard. Browsers allow no sound before a user gesture, and the first gesture on the title is usually Enter, which also starts the game (the mofa ride and its biker song), so the title track is skipped.
- **Gate:** on the title, `Sound.ready()` = no Web Audio in this browser, or the context exists and is `"running"`. While not ready, Enter, Space, a click or a tap only unlocks and starts the title theme (it is consumed: no game start in the same input). Once ready, Enter or a tap starts the game as before. M toggles mute either way (and also unlocks).
- **Hint text:** `TITLE_TEXT.start` shows "PRESS ANY KEY FOR SOUND" / "TAP FOR SOUND" while not ready, then "PRESS ENTER" / "TAP TO START"; the old music hint line "(ANY KEY STARTS THE MUSIC)" goes.
- **Autoplay:** where the boot-time `resume()` (§7) leaves the context running, the gate is open from the start, so Enter starts at once.
- **Tests and tools:** `run_tests.py` runs Chrome and Edge with `--autoplay-policy=no-user-gesture-required`, so audio runs at boot and the existing title → game tests stay valid; new tests stub the context state (`"suspended"` → the first Enter stays on the title and starts the theme; `"running"` → Enter starts the game; no `AudioContext` → Enter starts the game). The promo recorder's browser gets the same autoplay flag (or the bridge unlocks the sound before its first Enter), so its run is unchanged. `screenshot.py` already uses headless Chrome without sound.
- **Spec alignment:** this change's soundtrack requirement now carries the ride's text from the archived `mofa-ride-level` (no Valkyries on the ride, the biker song), so archiving this change won't undo it.

## Risks / Trade-offs

- [Distortion via WaveShaper sounds harsh or clips the master] → keep the rock music gain balanced against the Valkyries by ear, lowpass after the shaper, and verify that peak levels stay comparable in a quick offline render.
- [Many oscillators per power chord (3 × 2 detuned) raise CPU load] → power chords are at most one per eighth note; the scheduler horizon is unchanged. Check the F3 overlay on the title stays at 60 fps.
- [The riff accidentally resembles a famous song] → explicit review step in tasks; the riff is short and data-only, so it is cheap to change.
- [The `setState` hook restarts the Valkyries unexpectedly] → `setTrack` is a no-op for the same track; a test covers play → pause → resume and level → level complete → next level without a restart.
- [Promo recorder drift] → rendered audio follows the same step data and logged switch times; the promo dry run catches errors.
