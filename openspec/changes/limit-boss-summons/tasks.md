# Tasks

## 1. Summon limit

- [x] 1.1 In `src/config.js`, add `bossSummons: 3`. In `src/boss.js`:
  - `Boss.init` sets `this.summons = 0`.
  - The idle → attack choice takes the next attack from `BOSS_ATTACKS` and skips `"summon"` once `this.summons >= CONFIG.bossSummons`. Keep `attackIdx` advancing, so the cycle after the limit is slam → bubbles → slam …
  - The summon action increments `this.summons` and spawns nothing past the limit, which also covers a direct `startAttack("summon")`.

  Verify with the tests in 1.2.
- [x] 1.2 Add tests in `src/test.js`:
  - Run the boss fight in god mode, with the boss's health held up, for at least 6 attack cycles: `Boss.log` holds exactly 3 `summon` entries, and after the third summon only `slam`/`bubbles` appear.
  - After 3 summons, make the hero lose a life with `Game.onPlayerDeath()` and run on: no further summon.
  - Loading the arena again (`Game.loadLevel(3)`) resets the count to 0.
  - Update the "summoned crayfish appear inside the camera view" test so it stays within 3 summons.

  Verify: `python tools/run_tests.py` passes everything.

## 2. Docs and promo check

- [x] 2.1 In `README.md`, add to the boss description that it summons crayfish only 3 times. Rebuild `dist/buck_nukem.html`. Run `python tools/promo/record_promo.py --dry all` and confirm all spec limits are still met; note the boss-level time. Verify: the build succeeds, the tests pass and the dry run reports "Spec limits: all met".

## Workflow follow-up

- Archive `title-version-and-tactical-arena` before this change (both modify "Boss attack patterns"), then archive this one.
