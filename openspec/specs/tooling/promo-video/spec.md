# tooling/promo-video Specification

## Purpose

Automated promo-video recording for Buck Nukem: a Python AI agent plays the real game in a browser through Playwright and the run is recorded to a compact MP4 with the game's music and sound, so promo videos can be produced on demand and look like skilled human play.

## Requirements

### Requirement: Python agent driving the real game
The promo AI SHALL make all of its decisions in Python and SHALL drive the unmodified built game (`dist/buck_nukem.html`) in Chrome or Edge through Playwright. The page SHALL contain no AI decision logic; only a bridge that reports game state, applies inputs, advances the game and captures output.

#### Scenario: Decisions made in Python
- **WHEN** a promo run is started
- **THEN** the browser is launched and controlled by Playwright from Python, and every input the hero receives comes from the Python agent

#### Scenario: Game file untouched
- **WHEN** a promo run finishes
- **THEN** `dist/buck_nukem.html` on disk is byte-identical to before the run

### Requirement: Fair play
The agent SHALL control the hero only through the game's normal input actions (move, jump, climb, fire, pause/enter). It SHALL NOT teleport the hero, change health, lives, score or enemy state, or enable god mode.

#### Scenario: Inputs only
- **WHEN** the bridge applies an agent action
- **THEN** it only sets the game's input actions for the next steps; no game object other than the input state is written

### Requirement: Score-maximising run
A full promo run SHALL go from the title screen to the victory screen and play for the highest final score; collecting every pickup is not required. A pickup or an enemy kill SHALL be a stop on the route only when its points beat the level-end time bonus its detour costs. Key cards, the Mega Blaster, extra lives and the boss arena's pickups SHALL always be collected. The run report SHALL list, per level, the score, items collected/total/skipped, kills/total, deaths and time.

#### Scenario: Detours that pay
- **WHEN** the agent plans a level
- **THEN** each optional stop is valued against the time bonus (10 points per second): tennis ball 50, trophy 1000, lawyer 200, punk 500 points, health for the HP bonus and survival; a stop whose detour costs more is skipped, and crayfish are shot when in line: in the air, or kneeling when on the ground

#### Scenario: Victory with the best score
- **WHEN** a full run ends
- **THEN** the victory screen was reached, every skipped item is listed in the report with the reason "not worth the detour", and no required item (key card, Mega Blaster, extra life, boss-arena pickup) was skipped

#### Scenario: Run report
- **WHEN** a run ends (full or dry)
- **THEN** the report lists per level: score, items (collected, total, skipped), kills, deaths, time, stuck events, direction reversals per minute, quick reversals, unneeded jumps, shots without a hittable target and the shot hit rate

### Requirement: No stalling or wandering
The agent SHALL plan each level's route as a whole and SHALL make steady progress. Outside deliberate waits (combat, waiting for a boss opening, waiting for a hazard), it SHALL never go more than 5 seconds of game time without getting closer to its current target. Each regular level SHALL be finished within 150 seconds of game time and the whole run within 7.5 minutes.

#### Scenario: Stall recovery
- **WHEN** the hero makes no progress toward its target for 5 seconds outside a deliberate wait
- **THEN** the agent records a stuck event and replans, and a full run has at most 2 stuck events in total

#### Scenario: Level time limit
- **WHEN** a full run ends
- **THEN** every regular level (1–3) took at most 150 s of game time and the run from title to victory took at most 450 s

### Requirement: Human-like control
The agent's movement SHALL look deliberate and human: it SHALL react to new threats after a short delay (150–300 ms), fire in bursts, and SHALL NOT flip-flop its horizontal direction. A direction change SHALL be held for at least 200 ms except for dodges, and horizontal direction reversals SHALL average at most 20 per minute over a run.

#### Scenario: No flip-flopping
- **WHEN** the input log of a full run is analysed
- **THEN** no left/right input is released within 200 ms of being pressed unless it was a dodge, and reversals average at most 20 per minute

#### Scenario: Reaction delay
- **WHEN** a new enemy projectile appears on a collision course with the hero
- **THEN** the agent's dodge input starts between 150 and 300 ms later

### Requirement: Purposeful actions
Every jump and every shot SHALL have a visible reason: a jump crosses a gap or obstacle, reaches another floor or platform, dodges a threat or collects a pickup; a shot is fired at a hittable target in line (an enemy in the shot's row ahead, a crayfish while it leaps or on the ground from a kneeling shot, the boss face only while the claws are raised). Over a full run, at most 2% of jumps may be unneeded and at most 2% of shots may lack a hittable target.

#### Scenario: No unneeded jumps
- **WHEN** a full run's jumps are analysed
- **THEN** at most 2% of them take off and land on the same floor with no gap, step, threat or pickup in between (the current JS autopilot: 49.9%)

#### Scenario: No shots at nothing
- **WHEN** a full run's shots are analysed
- **THEN** at most 2% of them are fired without a hittable target in line, and the shot hit rate is reported

#### Scenario: No turning back and forth
- **WHEN** a full run's horizontal inputs are analysed
- **THEN** reversals average at most 20 per minute, and reversals within 1 second of the previous one that are not dodges average at most 3 per minute (the current JS autopilot: 92.7 per minute, 78.5 of them within a second)

### Requirement: Reproducible runs
A promo run SHALL be reproducible: with the same game build, options and seed, two runs SHALL produce the same inputs and the same run report.

#### Scenario: Same seed, same run
- **WHEN** the same dry run is executed twice with `--seed 7`
- **THEN** both runs report identical per-level times, items, kills and deaths

### Requirement: Video output
A recorded run SHALL produce an MP4 of at most 16 MB (by default) that shows the run from the title poster to the victory screen with the film filter on, and contains the game's music and sound effects in sync.

#### Scenario: Size limit
- **WHEN** a full run is recorded with default options
- **THEN** the MP4 file is at most 16,777,216 bytes

#### Scenario: Title to victory with sound
- **WHEN** the video is played
- **THEN** it starts on the title poster with the title music and ends on the victory screen, with music and sound effects audible throughout
