---
name: buck-promo-video
description: Create a promo video of Buck Nukem (dist/buck_nukem.html) auto-played by an AI - human-like, tactical, playing for the best score (items and kills worth their detour) - recorded to an MP4 no bigger than 16 MB; the whole game, or the mofa ride (reel 1) alone. Use when the user asks for a promo video, gameplay video, trailer, recording or "autoplay" video of Buck Nukem or of its road/mofa level.
---

# Buck Nukem promo video

Produce an MP4 promo video of `dist/buck_nukem.html` played automatically by an AI, with these rules:

- **Max 16 MB**: the final file must be ≤ 16,777,216 bytes (`--max-mb 16`, the default).
- **Human-like**:
  - short reaction delays (150–300 ms) before firing and dodging
  - a new walking direction is held at least 200 ms
  - no turning back within 1 s, except to dodge (it stops and settles instead)
  - every jump and shot has a visible reason
  - it plays only through the normal inputs (move, jump, climb, fire): no cheats, no god mode, no teleporting
- **Tactical**:
  - shoots only at a hittable target in line, in bursts, and stops shooting at an enemy its shots in flight will already kill
  - stands and fights an enemy on its route instead of walking into it
  - jumps over or backs away from briefcases, mower clippings, bubbles and shockwaves
  - retreats from a revving punk mower
  - kneels (Down) to shoot crayfish on the ground ahead at knee height, backs off from leaping crayfish and vaults over crayfish too close to shoot
  - grabs the nearest health when low
  - boss: shoots the face only while the claws are raised and jumps the claw-slam shockwave
- **Best score, not every item**: each level's route is planned as a whole (networkx). Each stop is worth its points against the level-end time bonus its detour costs (10 points per second):
  - ball 50, trophy 1000, lawyer 200, punk 500 points; health is worth its HP bonus and survival
  - key cards, the Mega Blaster, extra lives and the boss arena's Rivellas are always collected
  - skipped items are listed in the report as "not worth the detour"
- **Kills**: lawyers and gardener-punks are tour stops and are hunted down; a stop follows its enemy as it walks. Mutant crayfish on the ground are only hit by a kneeling shot (a standing shot flies over them): the agent kneels and shoots those ahead on its route, and shoots leaping ones standing. It doesn't turn back or detour for crayfish.
- **Complete run**: from the title poster to the victory screen, with the game's own music and sound effects. The full run starts at reel 2 (the clay courts); the mofa ride has its own promo (below).

## The ride promo (reel 1, the mofa ride)

`--ride` records only "THE ROAD TO WOLLERAU": the title poster, the REEL 1 card, the whole ride with the limo finale and the ride through the gate, ending on the level's tally (plus 2.5 s). Same rules (inputs only, reaction delays 150–300 ms, every hop and volley with a reason, same seed = same run), with the ride's own tactics (`tools/promo/agent/ride.py`):
- gas toward the gate; both guns fire in bursts only while a car is on screen in a gun's line (or a shootable item is on screen), and stop when the shots in flight will already destroy it
- Ferraris are heard about a second before they show up: it stops (and backs up a little), shoots them head-on and hops one it can't destroy in time (the hop timed with the game's own mofa physics, via `simulateHop`)
- keeps a gap behind an X7; Teslas from behind get the rear gun (a ramming Tesla sometimes still lands a 2-health hit: from the moment it shows up it needs a little longer to destroy than it takes to reach the mofa)
- shoots down thrown items in reach, dodges the others (gas/brake away or a hop)
- rides each ramp with an item above it at the approach speed whose flight collects it
- stops 85–130 px before the limo and fights it from there; leaves the finale alone (no Fire or Jump, so the whole scene is in the video)
- ride limits: completed within 180 s, at most 1 death, at most 2 stuck events; the play-quality limits apply to throttle flips (gas ↔ brake), hops and volleys

## Steps

1. One-time setup (Python 3.10+, Chrome or Edge installed):
   ```
   pip install -r tools/promo/requirements.txt
   ```
2. Rebuild the game so the video shows the current version:
   ```
   python tools/build.py
   ```
3. Optional check without video (about 1.5 min). It plays the whole game and prints the run report and the spec limits:
   ```
   python tools/promo/record_promo.py --dry all [--seed 1977]
   ```
   You can also dry-run one level with `--dry 0` … `--dry 3`. Expect `victory: True`. The ride: `--dry ride` (about 1 min), expect `COMPLETED` and "Spec limits: all met".
4. Record the video (about 5–10 minutes; run it in the background):
   ```
   python tools/promo/record_promo.py [--out recordings/<name>.mp4] [--max-mb 16] [--seed 1977]
   ```
   The default output is `recordings/buck_nukem_promo_<date>.mp4`. The same seed always gives the same run.
   The ride alone: `python tools/promo/record_promo.py --ride` (about 3–5 minutes) → `recordings/buck_nukem_ride_promo_<date>.mp4`.
5. Verify before handing over:
   - The run report shows `victory: True`. The last line says whether the play-quality limits were met. The exit code is 1 when a limit is missed: the video is still written, so judge whether it's good enough or try another `--seed`.
   - The printed file size is ≤ 16 MB.
   - Optional: extract a few frames with the bundled ffmpeg to check the video by eye:
     ```
     python -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())"
     <ffmpeg> -ss 60 -i <video>.mp4 -frames:v 1 frame.png
     ```
6. Report to the user:
   - the video path, size and duration
   - the run report: per level score, items collected/total (plus skipped), kills/total, deaths, time

## How it works

- **Browser:** `tools/promo/agent/session.py` runs Playwright with the installed Chrome or Edge. It serves an in-memory copy of the game from a local HTTP server, so `dist/buck_nukem.html` itself is never modified. The copy has two additions:
  - a seeded `Math.random`, for reproducible runs
  - `tools/promo/bridge.js` in place of `boot()`
- **Bridge:** `bridge.js` gives the agent read-only snapshots of the game and applies its inputs through `Input.simulate` only (checked by `tests/test_fairplay.py`). It also simulates candidate jumps with the game's own physics, logs per-step play-quality rows and captures frames and audio.
- **Agent:** the Python agent (`tools/promo/agent/`) decides once per video frame (2 game steps):
  - `nav.py`: a networkx graph of the cells Buck can stand on, with walk, drop, climb and jump moves weighted by travel time
  - `planner.py`: the route over a level, built in key stages, ordered by nearest neighbour then 2-opt/or-opt, and pruned to the stops worth their detour
  - `behaviour.py`: the tactics as a py_trees tree (Boss, Dodge, Mower, Cray, Spacing, Kneel, Vault, Hold, Hunt, Route)
  - `controller.py`: human-like motion control and execution of jump plans
  - `ride.py`: the mofa ride (no nav graph: a priority list per decision: finale, thrown items, cars, ramps, gas)
  - `metrics.py`: reversals, unneeded jumps, shots without a target and hit rate (on the ride: throttle flips, hops and volleys)
- **Video:** the 320×240 frames (film filter on, with grain reduced so it compresses well) are posted in batches and piped into ffmpeg. The ffmpeg binary comes from the `imageio_ffmpeg` package.
- **Audio:** music, sound effects and the mower engines are logged with their game times. They are rendered afterwards with an `OfflineAudioContext` and muxed in as AAC 64 kbit/s mono.
- **Encode:** two-pass H.264 at 640×480 (nearest-neighbour 2× upscale) with `-tune animation`. The bitrate is computed from the run length to fit `--max-mb`.

## Options

`--out PATH`, `--max-mb 16`, `--seed N` (default 1977), `--browser chrome|edge`, `--no-audio`, `--ride`, `--dry all|ride|0..3`, `--timeout <game minutes>` (default 15).

## Troubleshooting

- **"dist/buck_nukem.html not found":** run `python tools/build.py`.
- **`ModuleNotFoundError` (playwright, networkx, py_trees) or "ffmpeg not found":** `pip install -r tools/promo/requirements.txt`.
- **Chrome not found:** use `--browser edge`.
- **A `PAGE ERROR`:** run `--dry all` to see the JavaScript error, and fix `tools/promo/bridge.js`.
- **No victory, deaths, or limits missed:** the dry-run report lists the enemies alive at each exit and the skipped items. The play-quality table shows where reversals, unneeded jumps or shots without a target come from. Tune the tactics in `agent/behaviour.py` or the motion control in `agent/controller.py`. Check `python -m unittest discover -s tests -t .` (from `tools/promo`), or try another `--seed`.
- **Long runtime:** a full run is about 4–5 minutes of game time (≈ 8,000 frames). Capture plus encoding take several minutes.
