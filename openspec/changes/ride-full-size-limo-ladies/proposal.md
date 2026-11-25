# Proposal

## Why

Play-test feedback on the mofa ride: very tiny people run around (the drivers bailing out of destroyed cars and the limo's president, 6 × 12 pixels, and the limo ladies at 8 × 14 or crawling at 12 × 7), much smaller than Buck and the fans (20 × 32). They look out of place. The posh ladies leaving the destroyed limo should be as big as the female fans in the other levels.

Second round of feedback: the ladies should not run away but stay and complain to Buck, and Buck should answer with a dry Swiss German quote instead of "YOU HAVE NO CLUE".

## What Changes

- **No tiny runners:** destroyed cars no longer have a driver bailing out, and the president no longer runs off from the limo; the wrecks just burn.
- **Full-size posh ladies:** the two ladies in the limo finale are drawn at the fans' size (20 × 32 pixels) with the fans' figure builder, as a new "posh" style (big hats, sunglasses, pearls, dresses, one pink, one white). Instead of crawling, each climbs out of the wreck (a short climb-out pose), stands beside it and complains at Buck. They do not leave: after the scene they stay by the wreck, wagging a finger at Buck and complaining in turns every 2–3 seconds while they are on screen.
- **Buck's Swiss German reply:** instead of "YOU HAVE NO CLUE", Buck answers the ladies with a dry Swiss German line ("NÖD MIS PROBLEM.", "MACH KEI THEATER.") from a new `[finale]` section of the ride's quote pack.
- More complaint lines aimed at Buck (at least 12).
- The finale's timing, the cigarette, the skip and the locked control stay as they are.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `game/enemies`: "Posh drivers in cars" (no driver bailing out), "Club president's limo" (no running president; the ladies climb out for the finale).
- `game/ride`: "Limo finale" (fan-size ladies climb out, stay and keep complaining; Buck's Swiss German reply; no president running off).
- `game/presentation`: "Buck's quote packs" (a `finale` section). This requirement is added by the open change `buck-quote-packs`, so that change is archived first.

## Impact

- `src/cars.js`: remove `Cars.bailOut`, the president's runner, the runners list and the tiny sprites (`SPR.driverRun`, `SPR.ladyRun`, `SPR.ladyCrawl`).
- `src/fans.js`: a "posh" style in the fan figure builder (two variants) with stand, climb-out and scold frames (the walk frames go).
- `src/ride.js`: the finale's ladies use the posh fan frames (climb, stand, scold), stay by the wreck after the scene and complain; Buck's reply from the pack; the walkers go.
- `src/cars.js`: more complaint lines (`LIMO_FINALE_LINES`).
- `src/enemies.js`: `Quotes.line("finale")`; the ladies' bubbles after the scene.
- `src/quotes/ride.txt`, `tools/build.py`, `tools/test_build.py`: the `[finale]` section.
- `src/test.js`: tests for no runners, the ladies' size and poses; updated finale tests; the vehicles screenshot without the runner sprites.
- `README.md`.
