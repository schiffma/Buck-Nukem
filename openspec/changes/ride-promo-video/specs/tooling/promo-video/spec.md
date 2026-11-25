# Spec Delta

## ADDED Requirements

### Requirement: Ride promo video
The promo tooling SHALL record a video of the mofa ride alone ("THE ROAD TO WOLLERAU", reel 1), played by the Python agent under the same fair-play, human-like and reproducibility rules as the full run. The video SHALL go from the title poster through the REEL 1 card and the whole ride, including the limo finale, to the level's tally, with the game's music and sound, at most 16 MB by default.

#### Scenario: Recording the ride
- **WHEN** `python tools/promo/record_promo.py --ride` is run
- **THEN** an MP4 of at most 16,777,216 bytes is written (by default `recordings/buck_nukem_ride_promo_<date>.mp4`) that starts on the title poster with the title music, shows the REEL 1 card, the ride with the biker song and sound effects, and ends on the ride's tally screen after the mofa has passed the gate

#### Scenario: Finale kept in the video
- **WHEN** the limo is destroyed during a ride run
- **THEN** the agent presses neither Fire nor Jump until the scene ends on its own, so the ladies climbing out, their complaints, Buck's reply and the cigarette are all in the video

#### Scenario: Dry run
- **WHEN** `python tools/promo/record_promo.py --dry ride` is run
- **THEN** the ride is played without video and the report shows the score, items collected/total, cars destroyed/total, deaths, time and the ride play-quality metrics, and the run ends with the level completed

#### Scenario: Ride limits
- **WHEN** a ride run ends
- **THEN** the level was completed within 180 s of play with at most 1 death and no stuck events, and the ride metrics stay within their limits (throttle flips at most 20 per minute, quick flips within 1 s at most 3 per minute, hops without a reason at most 2%, shots without a target at most 2%); a missed limit is reported and makes the exit code 1

### Requirement: Ride tactics
On the mofa the agent SHALL ride toward the gate at speed and play for the best score: it shoots cars in line ahead or behind, keeps a safe gap behind cars ahead, hops cars it cannot destroy before they reach it, shoots or dodges thrown items and corks, takes the ramps to the items above them, picks up WD-40 when hurt, and fights the limo from a distance. Every hop and burst of fire SHALL have a visible reason, after a reaction delay of 150–300 ms.

#### Scenario: Cars
- **WHEN** a car is on screen in line with a gun (ahead of the front gun or behind the rear gun)
- **THEN** the agent fires at it in bursts until it is destroyed, and stops firing when its shots in flight will already destroy it

#### Scenario: A Ferrari coming
- **WHEN** a Ferrari approaches from ahead and the agent's fire cannot destroy it before contact
- **THEN** the agent hops so that the mofa clears it, timed with the game's own mofa physics

#### Scenario: Gap ahead
- **WHEN** a car ahead (an X7) is slower than the mofa and close
- **THEN** the agent eases off or brakes to keep a gap instead of riding into it, while firing at it

#### Scenario: Thrown items and corks
- **WHEN** a latte cup, golf ball or champagne cork will hit the mofa
- **THEN** the agent shoots it down (aiming up with the front gun when it comes from above) or hops, brakes or speeds up out of its way

#### Scenario: Ramps and pickups
- **WHEN** a ramp lies ahead with a trophy or extra life above it, or the agent is hurt and a WD-40 can is ahead
- **THEN** the agent reaches the ramp at top speed so the jump collects the item, and takes the WD-40 can on the way

#### Scenario: The limo
- **WHEN** the limo is on screen with health left
- **THEN** the agent stops at a distance where it is not touching the limo, fires at it, and shoots down or dodges the corks until the limo is destroyed, then rides through the gate after the finale
