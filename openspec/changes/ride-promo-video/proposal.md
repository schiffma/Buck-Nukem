# Proposal

## Why

The promo tooling records the whole game played by the Python agent, but the agent cannot ride the mofa: promo runs skip reel 1, "THE ROAD TO WOLLERAU", and start at the clay courts. The ride is the game's most showy level: heavy twin guns, posh drivers with arrogant bubbles, ramps, the president's limo and the finale with the complaining ladies, Buck's Swiss German reply and his cigarette. A short promo video of just that level is wanted.

## What Changes

- **A ride agent:** the Python promo agent learns to ride the mofa, with the same rules as on foot (only the normal inputs, human-like reaction delays, a visible reason for every hop and burst of fire, no cheats). It plays for the best score: gas toward the gate, kill the cars (X7s ahead, Teslas behind, Ferraris coming at it), hop Ferraris it can't kill in time, shoot down or dodge latte cups, golf balls and champagne corks, take the ramps for the trophies and the extra life up there, grab WD-40 when hurt, fight the limo from a safe distance, and leave the finale alone (no skipping) so the scene is in the video.
- **A ride-only recording:** `python tools/promo/record_promo.py --ride` records the title poster, the REEL 1 card, the whole ride with the limo finale and the ride through the gate, ending on the level's tally; at most 16 MB like the full promo. `--dry ride` plays it without video and prints the run report.
- **Ride play-quality metrics** in the report: throttle flips (gas ↔ brake) per minute, hops without a reason, shots without a target, hit rate, deaths, time.
- The full-game promo is unchanged (it still starts at reel 2).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tooling/promo-video`: new requirements "Ride promo video" and "Ride tactics".

## Impact

- `tools/promo/bridge.js`: ride state in the snapshot (cars, thrown items, the finale, the gate), a ride hop simulation using the game's own mofa physics; `devStartLevel` reaching reel 1.
- `tools/promo/agent/`: a ride behaviour (`ride.py`), the session starting at reel 1 for ride runs, ride metrics.
- `tools/promo/record_promo.py`: `--ride`, `--dry ride`, ride limits and the default file name.
- `tools/promo/tests/`: ride tactics and fair-play tests.
- `.claude/skills/buck-promo-video/SKILL.md`, `README.md` (promo section).
- No change to the game itself.
