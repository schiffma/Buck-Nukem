# Proposal

## Why

The gardener-punks push a red box on wheels that is silent while it moves. They only make two short one-off sounds (a rev before the charge and a buzz when the charge starts), and the only exhaust is a few grey puffs while revving. A trashy grindhouse villain needs a proper petrol lawn mower: a sputtering two-stroke engine you can hear before you see it, blue-grey exhaust smoke, black clouds when he guns the throttle, and an engine that chokes and dies with him.

## What Changes

- Redraw the mower as a petrol lawn mower: engine block with cooling fins, a fuel tank with a cap, a pull-start handle on the push bar, an exhaust muffler at the back, deck and wheels. Hitbox, speed and behaviour stay as they are.
- Exhaust smoke from the muffler tied to the engine: light blue-grey puffs while idling and patrolling, thick black clouds while revving, a dark trail while charging; none once the punk is dead. Smoke is cosmetic (no collisions, no stains). The punk's blunt smoke stays.
- A running petrol-engine sound: a continuous two-stroke "putt-putt" loop for mowers on screen, louder the closer they are, at most the 2 nearest at once. It rises to a screaming rev during the wind-up and a full-throttle roar while charging, and stops when the mower leaves the screen, the punk dies, the game is paused or the level ends. Mute (M) silences it.
- New and redesigned one-shot petrol sounds: a pull-start sputter when a mower's engine starts (punk first comes on screen), throttle blips for the rev, a roar burst when the charge starts, and a choke-and-die sputter when the punk is killed.
- The promo video recorder renders the engine loop in sync with the video.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `game/enemies`: new requirement "Petrol lawn mower" (look and exhaust smoke tied to the engine state). The existing punk and mower-charge requirements stay unchanged.
- `game/presentation`: new requirement "Petrol engine sound" (running loop per nearby mower, state-dependent pitch, one-shot petrol sounds, stop conditions, mute).

## Impact

- `src/sprites.js`: new `MOWER`/`MOWER2` rows and the rev frame (petrol engine, tank, muffler, pull-start), palette entries.
- `src/enemies.js`: exhaust smoke emission per punk state; engine start/stop hooks; choke on death.
- `src/audio.js`: a small engine-voice manager (persistent oscillators with continuous pitch/gain control) and the new one-shot sounds; the old `"rev"`/`"mower"` sounds are redesigned.
- `src/main.js`: updates the engine voices each frame from the on-screen punks; silences them on pause, level end and state changes.
- `tools/promo/recorder.js`: logs engine voice parameters per frame and renders them offline.
- `src/test.js`: sprite, smoke, engine-voice and sound-coverage tests.
- No new dependencies; small file-size increase.
