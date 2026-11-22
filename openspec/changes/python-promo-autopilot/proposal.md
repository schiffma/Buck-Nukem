# Proposal

## Why

The promo videos are played by a 515-line JavaScript autopilot (`tools/promo/autopilot.js`) injected into the game page. It wins and collects every item, but it plays badly to watch. It wanders and gets stuck: the last full run spent 168 s on level 1 and 234–320 s on the clubhouse level for a route that needs a fraction of that. It also looks robotic and jittery, flipping direction and twitching between goals. Measured over a full run (558 s of play), it reverses its walking direction **93 times per minute** (78.5 per minute within a second of the previous turn), and **49.9% of its jumps are unneeded**: same floor, no gap, step, threat or pickup. These are exactly the illogical moves seen in the latest promo video (turning back and forth, pointless jumps); shots without a hittable target are rarer (2.1%). Its greedy "pick the next goal every few frames" strategy and its tightly coupled hand-written navigation are hard to test and tune. A properly structured agent in Python, driving the real game in a real browser through a professional automation framework, can plan the whole route up front, be unit-tested outside the browser, and move with deliberate, human-looking control.

## What Changes

- Replace the injected JS autopilot with a Python agent that drives the game through **Playwright** (Microsoft's browser-automation framework for Python), using the installed Chrome or Edge.
- The agent's decision logic runs in Python, built on established libraries: **networkx** for the level navigation graph and shortest paths, and **py_trees** (a behaviour-tree library used in robotics) for tactics (survive > fight > collect > exit, plus a boss sub-tree).
- Plan each level's route as a whole: the order of pickups, key cards, doors, enemies worth a kill and the exit is chosen from shortest-path distances (with key/door ordering), instead of greedily re-picking goals. This fixes the wandering. The run plays for the highest score: an item or enemy is only a stop when its points beat the time bonus its detour costs (user decision: not every item has to be collected).
- Make every action purposeful: each jump and each shot carries a reason from the planner or tactics (a route jump over a gap or onto a ledge, a dodge, a hittable target in line); jumps and shots without a reason are not issued, and the report counts any that slip through.
- Keep up with the current game: firing from ladders, the disc cutter in the boss arena, the petrol-mower engine and track logging for the video audio, and the cheering fans (ignored by the agent).
- Add a motion controller that makes the play look human: committed movement with minimum hold times, no rapid left/right flip-flopping, short reaction delays, fire bursts, and a stuck detector that replans instead of looping.
- Only a thin JavaScript bridge stays in the page: read a state snapshot, apply the chosen inputs, advance the game a fixed number of steps, simulate a jump with the game's own physics, capture frames and render the audio. Game randomness is seeded so a run is reproducible.
- A metrics tool measures the current JS autopilot first (baseline above) and the new agent afterwards with the same rules, so the improvement is shown in numbers.
- New command `python tools/promo/record_promo.py` keeps its options (`--out`, `--max-mb`, `--fps`, `--browser`, `--no-audio`, `--dry`, `--timeout`) and adds `--seed`. The run report adds play-quality metrics (time per level, stuck events, direction reversals per minute, quick reversals, unneeded jumps, shots without a hittable target, shot hit rate).
- Unit tests for navigation, route planning and the motion controller run without a browser (`python -m unittest`).
- **BREAKING (tooling):** `tools/promo/autopilot.js` is removed; the promo pipeline needs `pip install -r tools/promo/requirements.txt` (playwright, networkx, py_trees, imageio-ffmpeg).

## Capabilities

### New Capabilities

- `tooling/promo-video`: the automated promo-video recording: how the AI player is run (Python agent driving the real game through Playwright, fair inputs only), what a complete run must achieve (victory with the highest score: items and kills taken only when worth their detour), the play-quality limits (no stalls or wandering, smooth human-like control, level time limits), reproducibility, and the output (MP4 ≤ 16 MB with music and sound, run report).

### Modified Capabilities

(none; the game itself is unchanged)

## Impact

- `tools/promo/`: new Python package (agent, navigation, planner, behaviour tree, controller, Playwright session), new `bridge.js`; `record_promo.py` rewritten on Playwright; `recorder.js` reduced to capture and audio render, merged into the bridge; `autopilot.js` removed.
- Reuses the level parser from `tools/build.py` and the navigation rules of `tools/check_levels.py`.
- `.claude/skills/buck-promo-video/SKILL.md` and the README "Tests and checks" section are updated for the new commands and dependencies.
- New Python dependencies (tooling only, not shipped with the game): `playwright`, `networkx`, `py_trees`, plus the existing `imageio-ffmpeg`. Playwright uses the installed Chrome/Edge via its `channel` option, so no browser download is needed.
- `dist/buck_nukem.html` and the game code are unchanged; the bridge is injected into an in-memory copy as today.
