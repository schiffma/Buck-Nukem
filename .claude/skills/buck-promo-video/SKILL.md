---
name: buck-promo-video
description: Create a promo video of Buck Nukem (dist/buck_nukem.html) auto-played by an AI - human-like, tactical, playing for the best score (items and kills worth their detour) - recorded to an MP4 no bigger than 16 MB. Use when the user asks for a promo video, gameplay video, trailer, recording or "autoplay" video of Buck Nukem.
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
  - backs off from leaping crayfish and vaults over crayfish blocking its way
  - grabs the nearest health when low
  - boss: shoots the face only while the claws are raised and jumps the claw-slam shockwave
- **Best score, not every item**: each level's route is planned as a whole (networkx). Each stop is worth its points against the level-end time bonus its detour costs (10 points per second):
  - ball 50, trophy 1000, lawyer 200, punk 500 points; health is worth its HP bonus and survival
  - key cards, the Mega Blaster, extra lives and the boss arena's Rivellas are always collected
  - skipped items are listed in the report as "not worth the detour"
- **Kills**: lawyers and gardener-punks are tour stops and are hunted down; a stop follows its enemy as it walks. Mutant crayfish can only be hit while they leap (a standing shot flies over a crayfish on the ground, by game design), so they're shot opportunistically, not hunted.
- **Complete run**: from the title poster to the victory screen, with the game's own music and sound effects.

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
   You can also dry-run one level with `--dry 0` … `--dry 3`. Expect `victory: True`.
4. Record the video (about 5–10 minutes; run it in the background):
   ```
   python tools/promo/record_promo.py [--out recordings/<name>.mp4] [--max-mb 16] [--seed 1977]
   ```
   The default output is `recordings/buck_nukem_promo_<date>.mp4`. The same seed always gives the same run.
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
  - `behaviour.py`: the tactics as a py_trees tree (Boss, Dodge, Mower, Cray, Spacing, Vault, Hold, Hunt, Route)
  - `controller.py`: human-like motion control and execution of jump plans
  - `metrics.py`: reversals, unneeded jumps, shots without a target and hit rate
- **Video:** the 320×240 frames (film filter on, with grain reduced so it compresses well) are posted in batches and piped into ffmpeg. The ffmpeg binary comes from the `imageio_ffmpeg` package.
- **Audio:** music, sound effects and the mower engines are logged with their game times. They are rendered afterwards with an `OfflineAudioContext` and muxed in as AAC 64 kbit/s mono.
- **Encode:** two-pass H.264 at 640×480 (nearest-neighbour 2× upscale) with `-tune animation`. The bitrate is computed from the run length to fit `--max-mb`.

## Options

`--out PATH`, `--max-mb 16`, `--seed N` (default 1977), `--browser chrome|edge`, `--no-audio`, `--dry all|0..3`, `--timeout <game minutes>` (default 15).

## Troubleshooting

- **"dist/buck_nukem.html not found":** run `python tools/build.py`.
- **`ModuleNotFoundError` (playwright, networkx, py_trees) or "ffmpeg not found":** `pip install -r tools/promo/requirements.txt`.
- **Chrome not found:** use `--browser edge`.
- **A `PAGE ERROR`:** run `--dry all` to see the JavaScript error, and fix `tools/promo/bridge.js`.
- **No victory, deaths, or limits missed:** the dry-run report lists the enemies alive at each exit and the skipped items. The play-quality table shows where reversals, unneeded jumps or shots without a target come from. Tune the tactics in `agent/behaviour.py` or the motion control in `agent/controller.py`. Check `python -m unittest discover -s tests -t .` (from `tools/promo`), or try another `--seed`.
- **Long runtime:** a full run is about 4–5 minutes of game time (≈ 8,000 frames). Capture plus encoding take several minutes.
