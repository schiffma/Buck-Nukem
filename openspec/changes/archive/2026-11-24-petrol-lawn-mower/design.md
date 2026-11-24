# Design

## Context

- **Sprite** (`src/sprites.js`): a punk frame is 30×30, built by `punkFrame(legs, mower)` from `PUNK_TOP` and 11 rows where each leg row is followed by a 15-column mower row (`MOWER`, `MOWER2` with moving wheel spokes, `PUNK_REV` with the body lifted 1 px). The mower is currently a red box (`R/r`), a green handle tip (`g`/`G`), a `C` band, a `v` deck and black wheels. `makeSet` adds outlines and the white flash; the outline test covers `SPR.punk.walk[0..1]` and `SPR.punk.rev`.
- **Behaviour** (`src/enemies.js`, `ENEMY_TYPES.punk`): states `patrol` → `rev` (`CONFIG.punkRev`) → `charge` → cooldown. Blunt smoke: one puff about every second (`e.smokeT`), as `FX.parts` entries with `smoke: true`. While revving: grey puffs at 50% chance per frame from behind the mower. One-shot sounds: `"rev"` on entering `rev`, `"mower"` on entering `charge`. Death gore: blood, gibs, mower explosion (oil, sparks, metal).
- **Audio** (`src/audio.js`): `Sound.play(name)` creates short-lived oscillators/noise per effect (`tone`, `sweep`, `noise`). There are no persistent voices. `Sound.onPlay` is the test hook; the promo recorder logs `onPlay` calls with times and re-renders them offline in 30 s chunks.
- **Tests** run headless with `Sound.ac` usually `null`, so audio behaviour is checked through logical state and the `onPlay` hook.

## Goals / Non-Goals

**Goals:**
- A recognisable petrol mower at sprite scale, smoke that tells the engine state, and an engine you hear coming.
- Engine sound that costs almost nothing: a fixed pool of 2 voices, updated once per frame.
- Testable without real audio (logical engine state) and reproducible in the promo video.

**Non-Goals:**
- No change to punk AI, speeds, damage, hitboxes or charge rules.
- No stereo panning (the game's audio is mono); distance only changes loudness.
- No engine sounds for anything else (the hero's disc cutter keeps its one-shot whine).

## Decisions

### 1. Mower sprite: petrol parts in the same 15×11 mower rows
Redraw `MOWER`/`MOWER2`/rev rows: a grey engine block with fin lines (`g/G/v`) on top of the deck, a red fuel tank with a black cap (`R/r/k`) on the engine, a pull-start handle (`k` T-grip) near the top of the push bar, a black muffler with a dark exhaust opening at the back facing the punk, deck (`v`), wheels with spokes (frame 2 shifts the spokes). Rust stays as the grindhouse detail (`O`). The exhaust opening position is exported (`MOWER_EXHAUST = {x, y}` relative to the frame, mirrored by facing) so smoke spawns exactly there.

### 2. Exhaust smoke by engine state
In `punk.update`, an `e.exhaustT` timer emits non-staining `FX.parts` smoke (`smoke: true`, negative gravity, drifting backwards):
- patrol: every 0.25–0.35 s, light blue-grey (`rgba(170,180,190,0.5)`), size 2;
- rev: every 0.06–0.08 s, dark (`rgba(40,40,40,0.75)`), size 2–3, a little faster;
- charge: every 0.05 s, dark, trailing behind (horizontal velocity opposite to the charge).
Dead punks emit nothing (the update stops). The blunt smoke and the old 50% rev puffs are replaced by this system for the mower (the blunt keeps its own puffs).

### 3. Engine voices: a pool of 2 persistent voices
`Sound.engines` holds 2 voice slots. Each frame `Game.updateEngines()` collects alive, active, on-screen punks, sorts them by distance to the hero, and calls `Sound.setEngines([{id, state, dist}, ...])` with the nearest 2 (an empty list outside `PLAY`/`BOSS`, while paused or on the level-complete tally). For each slot `Sound` computes logical targets:
- firing rate (putt-putt pulses): patrol 14 Hz, rev ramps 14 → 40 Hz over the wind-up, charge 48 Hz;
- tone frequency: patrol 55 Hz, rev up to 110 Hz, charge 140 Hz;
- loudness: `0.16 × clamp(1 − dist/300, 0.15, 1)`; 0 when the slot is unused.
With an `AudioContext`, a voice is: sawtooth oscillator + square sub-oscillator → lowpass (900–2200 Hz with the throttle) → gain that is amplitude-modulated by a square-wave LFO at the firing rate (the two-stroke "putt") → slot gain → `Sound.sfx` bus (so mute works). Parameters move with `setTargetAtTime(…, 0.05)` (a ¼ s fade on stop). Oscillators are created once and never stopped; idle slots sit at gain 0. Without a context only the logical state updates, which is what the tests read.
*Alternative:* one-shot sounds re-triggered every 0.3 s. Rejected: audible seams and much more node churn.

### 4. One-shot petrol sounds
- `"pullstart"`: rope pull (noise sweep up) + three sputters (low square blips) + catch, when a punk's engine first gets a voice (first time on screen; `e.engineStarted` flag).
- `"rev"`: redesigned as throttle blips (rising sawtooth bursts with exhaust noise).
- `"mower"`: a short full-throttle roar burst at charge start (the loop carries the sustained sound).
- `"choke"`: on death, a falling sputter (decreasing blips) before the existing explosion.

### 5. Promo recorder
Log `Sound.setEngines` targets per video frame (only when they change, to keep the log small) and, in each 30 s offline chunk, create the 2 voices on the offline context and apply the logged targets with `setValueAtTime`/`setTargetAtTime` at their frame times.

### 6. Tests
- Sprite: outline test (existing) on the new frames; engine/tank/muffler/wheel pixels present in the mower region (palette check on the rows).
- Smoke: count exhaust puffs (not blunt) in 1 s of patrol (≥ 3), during rev (≥ 3× patrol rate, darker), during charge (continuous); none after death.
- Engine: with 3 punks at different distances only the 2 nearest have voices, nearer is louder; pitch patrol < rev < charge; voices released on pause, level complete and off-screen (gain target 0); `"pullstart"`, `"rev"`, `"mower"`, `"choke"` in the sound-coverage test; mute sets the master to 0 as before.
- Gameplay unchanged: punk hitbox, HP, speeds, rev time, charge distance, contact damage.

## Risks / Trade-offs

- [Engine drone gets annoying] → low base volume, lowpass, distance falloff, 2-voice cap; tune by ear on level 1 and 3, keep below the music level.
- [Many smoke particles cost performance] → at most ~2 punks on screen, short-lived particles; the 8 ms performance test covers it.
- [Tests can't hear audio] → test the logical engine state and the `onPlay` hook; listen once in Chrome before finishing.
- [Promo video drift for the loop] → per-frame target log aligned with frame times; check a recorded clip around a punk charge.
