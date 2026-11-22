# Design

## Context

Today `tools/promo/record_promo.py` serves an in-memory copy of `dist/buck_nukem.html` with `autopilot.js` and `recorder.js` injected before `boot()` (inside the game's IIFE scope, so they can read `Game`, `Player`, `Level`, etc.). It launches headless Chrome/Edge itself, receives frames over HTTP (`/frame`, `/audio`, `/log`, `/done`), pipes them into ffmpeg (`imageio_ffmpeg`) and does a two-pass H.264 encode sized to `--max-mb`. Each video frame is 2 game steps at a fixed `DT`, so the capture is frame-exact. The audio is rendered offline afterwards in 30 s chunks (`Promo.renderAudio`).

`autopilot.js` contains: a navigation graph (a port of `tools/check_levels.py`), jump planning by simulating the hero's physics (`simStep`, `planJump`), a greedy goal chooser (`goals()`/`chooseGoal()` every few frames), reactions (`react()`, `willHit()`), and a boss mode. Enemy behaviour uses `Math.random` (`src/enemies.js` cooldowns), so runs are not reproducible today.

Observed problems (last full run): level 1 168 s, level 3 234–320 s; frequent goal switching and direction flipping. The user's complaints: it gets stuck or wanders, and looks robotic/jittery.

## Goals / Non-Goals

**Goals:**
- Agent logic in Python, testable without a browser; Playwright drives the browser.
- Whole-level route planning; a stall detector; a motion controller with commitment and hold times.
- Keep the proven parts: frame-exact capture, chunked offline audio render, two-pass size-targeted encode.
- Reproducible runs through a seeded random generator.

**Non-Goals:**
- No machine-learning / reinforcement-learning training (considered and rejected below).
- No change to the game or its difficulty; the game does not know it is being played by an agent.
- No real-time (wall-clock) play: the game is stepped deterministically, faster or slower than real time.

## Decisions

### 1. Playwright for Python, using installed Chrome/Edge
`playwright.sync_api` with `chromium.launch(channel="chrome" | "msedge", headless=True)`. The page HTML (game + bridge) is served through `page.route()`, so no separate HTTP server is needed. Frames and audio are passed back with `page.expose_binding()` / route-intercepted POSTs of raw RGBA bytes (no base64), straight into the ffmpeg pipe.
*Alternatives:* Selenium (weaker CDP access, slower evaluate round-trips); keeping the hand-rolled HTTP server and `subprocess` browser launch (works, but it is the custom plumbing the user wants replaced and offers no page error/console capture).

### 2. Thin JS bridge, state snapshots, deterministic stepping
`tools/promo/bridge.js` (injected before `boot()` like today) exposes `PromoBridge`:
- `snapshot()`: hero (x, y, vx, vy, onGround, onLadder, face, hp, lives, keys, weapon, invuln), enemies (type, box, state, leaping, hidden/submerged), enemy projectiles, pickups, open/closed doors, boss state (hp, claws up, slam timer), game state and level index; the level grid only on level change.
- `step(actions, n)`: sets `Input.simulate` for the given actions, runs `n` game steps, returns the new snapshot. The agent decides once per video frame (2 steps at 30 fps), which is also a human-like decision rate.
- `simulate(state, inputPlan)`: runs the game's own player physics on a copied hero state for jump planning, so there is only one physics implementation (no Python port of the physics to drift out of sync).
- `frame()` / audio logging and chunked `renderAudio()` moved over from `recorder.js`, including the track log (title/Valkyries switches) and the petrol-mower engine log (`Sound.onEngines`), which the current recorder already renders.
- The snapshot also reports `climbing`, weapon (`blaster`/`mega`/`cutter`) and fire cooldown: the hero can now fire from ladders, and the disc cutter fires 2.5 blades/s that also hit crayfish on the ground. Fans are not in the snapshot (pure decoration).
- `seed(n)`: replaces `Math.random` with a seeded PRNG (mulberry32) before the game boots.
Bridge writes are limited to input state (spec "Fair play"); a test in the agent suite checks the bridge source for forbidden writes as a guard.

### 3. Navigation with networkx
`nav.py` builds a `networkx.DiGraph` of standing cells per level and key set, reusing `parse_level` from `tools/build.py` and the edge rules of `tools/check_levels.py` (walk, drop, jump with `MAX_DX`, climb, one-way platforms, doors needing keys). Edge weights are estimated travel times (walk tiles/speed, jump airtime, climb time). Shortest paths come from `nx.shortest_path` / `nx.single_source_dijkstra`. The graph is pure Python and unit-tested on the real level files.

### 4. Whole-level route plan (fixes wandering)
`planner.py` orders all pickups, key cards, doors and the exit as a tour: build a distance matrix from Dijkstra over the nav graph (respecting that a door's region becomes reachable only after its key), seed with nearest-neighbour, improve with 2-opt / or-opt under the key-before-door constraint, end at the exit. The plan is recomputed only on events (a pickup lost to a death, a door opened, a stuck event), never every frame. Score maximising (prize-collecting tour): every stop has a value in seconds of the level-end time bonus (10 points/s): ball 5 s, trophy 100 s, Rivella 20 s, Cervelat 30 s, lawyer 16 s and punk 44 s (kill points minus the fight time); keys, the Mega Blaster and extra lives are mandatory. After ordering, the stop whose removal saves more time than it is worth is dropped, repeatedly, and the rest re-ordered. Lawyers and punks are kill stops at their current position; the Hunt tactic takes over on their floor. Crayfish stay opportunistic (hunting them proved to cost lives in vault/dodge fights).
*Alternative:* OR-Tools routing. Rejected as a heavy dependency for tours of ≤ 30 nodes, where 2-opt is near-optimal and fast.

### 5. Tactics with py_trees
`behaviour.py` builds a `py_trees` tree ticked once per decision: `Selector[ Survive (dodge projectile / back off from revving mower or leaping crayfish / heal when low) , Fight (enemy level and in front and in range → face + burst fire, keep distance) , FollowRoute (next waypoint of the plan) ]`, with a separate `Boss` subtree (minions first, face only while claws are up, jump the slam shockwave, Rivellas when low). Blackboard holds snapshot, plan and controller state. Behaviour trees make priorities explicit and each leaf unit-testable with fake snapshots.
*Alternative:* RL with Gymnasium + Stable-Baselines3. Rejected (user's choice): hours of training, PyTorch, and no guarantee of collecting every item or looking human.

### 6. Human-like motion controller (fixes jitter)
`controller.py` turns behaviour outputs (desired direction, jump plan, fire) into inputs with:
- reaction delay queue: new threats are acted on after 150–300 ms (seeded random);
- direction commitment: a new horizontal direction is held ≥ 200 ms; a turn-around while walking eases through a short stop; dodges may override;
- path following with look-ahead (steer to a waypoint 2–3 cells ahead, not the next cell), so it does not stop and start at each tile;
- fire in bursts of 3–6 shots with pauses;
- stall detector: progress = decrease in route distance to the current target; 5 s without progress outside deliberate waits → stuck event, ban the failing edge, replan.
All of it is pure Python, tested with scripted snapshots.

### 6b. Purposeful actions (fixes pointless jumps, shots and dithering)
Every jump and shot input is issued only by a leaf that names its reason, and the controller logs `(t, action, reason)`:
- **Jumps:** `route-jump` (the current nav edge is a jump edge: gap, step up/down, platform), `dodge` (projectile/shockwave on a collision course), `vault` (crayfish blocking the path), `pickup` (item above). Walking edges are never executed with a jump; the JS autopilot's hop-to-unstick fallback is replaced by the stall detector's replan.
- **Shots:** `target` only when a hittable target is in line (enemy in the shot's row ahead within range; crayfish only while leaping; boss face only with claws raised). No fire-and-hope bursts.
- **Turning:** the route follower commits to the current edge until it is completed; a target behind Buck is engaged only if it is a threat or on the route, otherwise he keeps walking. Turnarounds need a reason (`route`, `dodge`, `threat`) and respect the 200 ms hold.

`agent/metrics.py` computes the spec metrics (reversals and quick reversals, unneeded jumps, shots without a target, hit rate) from the input log and per-step snapshots with the same rules as the baseline measurement; `tools/promo/quirks.py` runs it against either autopilot (the JS one for the baseline, the Python one for acceptance).

### 7. CLI and report
`record_promo.py` keeps its options and adds `--seed` (default fixed, so runs are reproducible by default). `--dry all|0..3` steps without capturing frames. The report adds per-level time, stuck events, reversals and quick reversals per minute, unneeded jumps, shots without a target and hit rate, and the run exits non-zero if the spec limits are missed (victory, no required item skipped, level ≤ 150 s, total ≤ 450 s, reversals ≤ 20/min, quick reversals ≤ 3/min, unneeded jumps ≤ 2%, shots without target ≤ 2%, stuck events ≤ 2).

### 8. Package layout
`tools/promo/requirements.txt`, `tools/promo/agent/` (`session.py` Playwright, `nav.py`, `planner.py`, `behaviour.py`, `controller.py`, `report.py`), `tools/promo/bridge.js`, `tools/promo/record_promo.py` (CLI, encode), `tools/promo/tests/` (`python -m unittest discover tools/promo/tests`). `autopilot.js` and `recorder.js` are deleted once the new agent meets the spec.

## Risks / Trade-offs

- [Playwright round-trip per decision slows the run] → one `evaluate` per video frame (~15,000 per run); measured CDP round-trips are about 1–3 ms, i.e. under a minute in total. Snapshots stay small (no grid after the first one).
- [Raw frame transfer through Playwright is slower than the current HTTP POST] → send frames as binary through a routed POST (same as today) rather than as evaluate return values; measure in the first capture task and fall back to the existing local HTTP sink if needed.
- [Hard limits (150 s per level, 20 reversals/min) may be unreachable on some level] → tasks measure each level in dry runs first; if a limit proves unrealistic for the level geometry, stop and propose a spec update instead of loosening silently.
- [Seeding `Math.random` also changes film grain] → harmless; grain is cosmetic and seeded grain is still random-looking.
- [New dependencies] → tooling only, pinned in `requirements.txt`; the game and its tests do not need them.
- [Losing the working JS autopilot] → keep it until the Python agent passes a full run, then delete it in a final task.

## Migration Plan

Build the new pipeline next to the old one (`record_promo.py` keeps working until task group 5), switch the CLI over when a full Python run meets the spec, then delete `autopilot.js`/`recorder.js` and update the skill and README. Rollback: restore the two JS files and the previous `record_promo.py`.
