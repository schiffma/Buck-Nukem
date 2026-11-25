# Design

## Context

- `tools/promo/agent/session.py` opens the game at `#level=2` (`PROMO_FIRST_REEL = 2`): the agent cannot ride, so reel 1 is skipped. `dry_run(which)` starts a level with `PromoBridge.devStartLevel(i)`.
- The agent (`runner.py`) is built for platforming: a networkx nav graph of standable cells, a tour planner over pickups and kills, a py_trees behaviour tree (Boss, Dodge, Mower, Cray, …) and a controller that executes jump plans checked with `PromoBridge.simulateJumps` (a mirror of `Player.update`'s on-foot movement).
- The ride (`src/ride.js`, `src/cars.js`) is a side-scrolling road: Right gases (top speed `mofaTop` 150 px/s, slower uphill), Left brakes then rolls back slowly, Jump hops (`mofaHopVel` −330; ramps `/` launch at `mofaRampVel` −360 with `mofaRampGrav` 0.5), Fire fires the twin guns forward and backward (8 volleys/s), Up angles the front gun 30°. Cars are enemies of type `suv` (X7, ahead, slow, throws `latte`/`golfball` shots over its roof), `tesla` (from behind, rams), `ferrari` (from ahead, twice the mofa's speed), `limo` (parked before the gate, pops `cork` shots; gate locked until it dies). Pickups: trophies, an extra life on ramp flights, WD-40 `{`. Destroying the limo starts `Mofa.finale` (control locked ~5 s, Fire/Jump skip it). Passing the exit `E` behind the gate ends the level (`LEVEL_COMPLETE`, tally).
- The video pipeline (frames, audio log, offline render, two-pass encode to a size limit) works for any run length.

## Goals / Non-Goals

**Goals:** a ride-only promo, title to tally, ≤ 16 MB; a ride agent that plays fairly, human-like and for score; ride metrics and limits; dry runs for tuning.

**Non-Goals:** adding the ride to the full-game promo (it still starts at reel 2; a later change can switch `PROMO_FIRST_REEL` to 1); using the nav graph or tour planner on the ride; changing the game.

## Decisions

### 1. Entry points
- `record_promo.py --ride` and `--dry ride`. `Session(first_reel=1)` opens `#level=1`; the full run keeps reel 2.
- The run ends at `LEVEL_COMPLETE` once the tally is done, plus a 2.5 s outro; the agent never presses Enter there.
- Default output `recordings/buck_nukem_ride_promo_<date>.mp4`; `--max-mb 16` as before (the ~2.5 min run gets a higher bitrate than the full promo).
- `check()` gets ride limits: completed, time ≤ 180 s, deaths ≤ 1, stuck ≤ 2 (no progress toward the gate for 8 s, outside the limo fight and the finale), plus the ride metrics (§5).

### 2. Bridge additions (read-only, no decisions)
- `snapshot()` adds, when `Game.level.isRide`: `ride: { finale: !!Mofa.finale, finaleT, gateLocked: Game.gateLocked(), roadTop: [per tile column, sent once with the grid], top: CONFIG.mofaTop, aimUp: Input.down("up") }`; enemy shots already carry `kind` (`latte`, `golfball`, `cork`) and `shootable`; cars are enemies with `type`, `vx`, `hp`.
- `simulateHop(maxFrames)`: predicts the mofa's flight for a hop pressed now, or for the ramp launch at the current speed, as `[{t, x, y}]`, by a mirror of the vertical motion in `Mofa.update` (hop velocity, gravity, `mofaRampGrav`, landing on `roadTop`), like `simulateJumps` mirrors the on-foot physics. A promo test checks the mirror against the real game (landing x and time within 2 px / 2 frames on flat road, uphill and from a ramp).
- `devStartLevel(0)` works for the ride (already loads any level).

### 3. The ride behaviour (`agent/ride.py`)
A small priority list evaluated once per decision (every 2 game steps), replacing the platform tree while `level.isRide`:
1. **Finale:** while `ride.finale`: no input at all (no Fire, no Jump, no Right).
2. **Threat dodge:** for each thrown item or cork, predict its path (ballistic with its `vx`, `vy`, `grav`) against the mofa box over the next 1.2 s at the current throttle. If it hits: shoot it if it is `shootable` and a gun can reach it in time (front gun with Up for items above and ahead, rear gun level), else hop if the hop simulation clears it, else brake or gas so the box moves out of the hit window.
3. **Ferrari / Tesla contact:** time to contact from the gap and closing speed; shots needed = hp / volley damage; if the car can't be destroyed before contact − 0.15 s, hop when the simulated flight clears the car's box at the predicted overlap time. A Tesla behind is shot with the rear gun; if it would ram before it dies, gas away (top speed outruns it briefly) and keep shooting.
4. **Gap behind an X7:** keep the gap ≥ 60 px: ease off (coast) at < 90 px, brake at < 60 px; fire while it is in line.
5. **Limo:** stop 90–120 px before it (coast, then brake), fire, aim up at corks; if hp ≤ 3 and a cork can't be stopped, back off.
6. **Pickups and ramps:** a ramp with a trophy or extra life above (from the grid: items within the simulated ramp flight): be at top speed 2 tiles before the ramp, don't hop or brake on the approach unless a threat forces it. WD-40 when hp ≤ 5: ride over it (it lies on the road), hop if it floats above.
7. **Default:** gas toward the gate.

**Fire:** held in bursts only while a target is in line: a car whose box crosses the gun's line within screen range ahead (front) or behind (rear), or a shootable shot in the front gun's path (Up when the item is above the barrel line). Stop when the remaining hp of every target in line is covered by the volleys in flight. Fire is never held during the finale or with nothing in line.

### 4. Human-like control
- Reaction delay 150–300 ms (seeded) between a new threat or target first seen and the response (hop, fire, brake).
- Throttle state (gas / coast / brake) is held at least 200 ms; no gas↔brake flip back within 1 s except for a threat dodge.
- Every hop logs its reason (`ferrari`, `latte`, `golfball`, `cork`, `pickup`, `ramp-item`); every fire burst its target.

### 5. Ride metrics
`metrics.py` gets a ride branch on the same per-step rows (the bridge's `logRow` adds `gas`, `brake`, `hop`, `fire`, `target` on the ride):
- `throttle_flips_per_min` (gas ↔ brake), `quick_flips_per_min` (back within 1 s),
- `unneeded_hop_pct` (hops whose logged reason was not confirmed by a threat in the next 1.5 s or a ramp item collected),
- `no_target_pct` (volleys with no car or shootable in line), hit rate.
Limits: 20, 3, 2 %, 2 %.

### 6. Report
Per run: score, cars destroyed/total (by type), items collected/total (trophies, extra life, WD-40), deaths, time, stuck events and the metrics table.

### 7. Tests (`tools/promo/tests/`)
- `test_ride.py` (unit, no browser): threat prediction, contact timing, fire decisions (in line / covered by shots in flight / nothing during the finale), throttle hold and flip rules, on synthetic snapshots.
- Fair play: the ride path still writes only `Input` (extend `test_fairplay.py`), and the hop mirror check (§2) in `test_session.py`.
- Acceptance: `--dry ride` with seed 1977 completes the ride within the limits; a full `--ride` recording is checked by eye (frames at the start, mid-ride, the limo fight, the finale and the tally).

## Risks / Trade-offs

- [Ferraris at closing speed ~300 px/s leave little time] → hop decisions are based on the physics mirror; the reaction delay is the short end (150 ms) for contact threats.
- [Hopping with a cork or cup in the air lands into it] → the dodge checks the simulated flight against all predicted threat paths, and picks brake/gas if no hop is clean.
- [The X7 blocks the road and the agent stalls behind it] → the stall check excludes "behind an X7 while firing"; X7 hp 10 dies in ~1.3 s of fire.
- [A long recording is bigger than needed] → the bitrate is computed from the run length, as for the full promo.
