# Proposal

## Why

Play-test feedback on the mofa ride: Buck should look like a big man on a small moped, his twin guns should be big and sound like heavy WW2 machine guns, he should comment dryly in Swiss German when he finishes off a posh driver, and destroying the president's limo should end with a little scene: the posh ladies crawl out of the wreck complaining, Buck answers "YOU HAVE NO CLUE" and lights a cigarette.

## What Changes

- **Smaller mofa, same Buck:** the mofa is drawn at 75% of its size (about 32 instead of 42 pixels long); Buck keeps his size, so he sits big on a small moped. The cars keep their size. The mofa's hitbox narrows to the smaller moped. (The user asked for a smaller mofa with Buck unchanged; 75% is the planned reduction.)
- **Bigger, heavier guns:** both mounted guns become oversized WW2-style heavy machine guns (a perforated barrel jacket, a big muzzle, about twice as long as now), with bigger muzzle flashes.
- **WW2 .50 cal sound and feel:** a deep, booming "dug-dug-dug" with a short echo tail instead of the light rattle; the rate drops from 10 to 8 volleys per second, and the cars' hit counts drop by the same 20% (BMW X7 12 → 10, Tesla 8 → 6, Ferrari 6 → 5, limo 30 → 24) so they die as fast as before.
- **Buck's Swiss German one-liners:** when a car is destroyed on the ride, Buck says a short, down-to-earth Swiss German line in a speech bubble ("SO, FERTIG.", "UFGRUMT!", "GÄLL, DAS HET GSESSE"); the game font gets Ä, Ö and Ü.
- **The limo finale:** when the limo is destroyed, play pauses for a short scene (about 5 s, skippable with Fire or Jump): the mofa rolls to a stop, the president runs off, the two posh ladies crawl out of the wreck one by one, each with an arrogant line ("MY DRESS! IT'S DIOR!"), Buck answers "YOU HAVE NO CLUE" and lights a cigarette, then control returns with the gate open. Buck keeps the cigarette, puffing smoke, until the ride ends.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `game/presentation`: "Mofa look" (75% mofa, Buck unchanged, big guns), "Car and driver looks" (the 25 px per metre scale is Buck's, no longer the mofa's).
- `game/ride`: "Twin machine gun" (8 volleys per second, bigger guns), "Machine gun sound" (WW2 heavy .50 cal); new "Buck's one-liners on the ride" and "Limo finale".
- `game/enemies`: hit counts of the BMW X7, Tesla, Ferrari and the limo; the limo's "Ladies gone" scenario hands over to the finale.

## Impact

- `src/ride.js`: mofa sprite at 75%, the bigger gun sprites and barrel positions, hitbox, Buck's bubble and cigarette, the finale scene state.
- `src/config.js`: `mofaRate` 8, car and limo hit points, mofa hitbox width, finale timings.
- `src/audio.js`: the heavy `mg` report.
- `src/cars.js`: the ladies' crawl-out (instead of running off), their finale lines, the hand-over to the scene.
- `src/font.js`: glyphs Ä, Ö, Ü.
- `src/test.js`: sizes, rate and hit counts, sound shape, one-liners, the finale sequence and skip; existing tests that pin the old numbers.
- `README.md`.
