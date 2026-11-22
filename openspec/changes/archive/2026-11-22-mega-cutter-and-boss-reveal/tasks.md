# Tasks

## 1. Mega Cutter

- [x] 1.1 Add `megaCutterDmg: 5`, `megaCutterRise: 70` and `upgradeRespawn: 20` to `src/config.js`.
  - Add `Player.isCutter()`, true for `"cutter"` or `"megacutter"`. Replace the `weapon === "cutter"` checks in `src/player.js`, `src/hud.js` and `tools/promo/bridge.js` with it.
  - In the boss arena, collecting `w` gives `"megacutter"` and shows "MEGA CUTTER!" (the powerup sound); in levels 1–3 it stays the Mega Blaster.

  Tests: collecting `w` in the arena gives `"megacutter"` and the HUD text "MEGA CUTTER"; `w` in level 1 gives `"mega"`; respawning in the arena resets the weapon to `"cutter"`.
- [x] 1.2 Make `fireBlade` fire two 16 px blades with 5 damage each under `"megacutter"`: one level, one with `vy = -megaCutterRise`. Keep the normal fire rate.

  Tests:
  - Holding Fire for 1 s under megacutter fires at most 3 shots, giving 2 blades each.
  - A blade on the raised face removes 5 health; a blade on the shell is deflected with 0 damage.
  - The second blade rises.
- [x] 1.3 Add sprites in `src/sprites.js`:
  - `SPR.megaBlade`: 4 spinning frames, 16 px, with an orange glow
  - `SPR.megaCutterPickup` and `SPR.megaCutterIcon`, outlined

  Use the boss arena's `w` pickup image when the level is the arena. Tests: the mega blade frames differ from `SPR.sawBlade` and from each other, they have orange pixels, and every edge pixel is outlined; the pickup image differs from `SPR.megagun`. Add them to the `sprites` screenshot sheet and check by eye.
- [x] 1.4 Place the upgrade and make it come back. Put `w` at (13,4) on the top platform of `src/levels/4_boss.txt` and confirm with `python tools/check_levels.py` that it is reachable. Record `Game.arenaUpgradeSpot`, and re-add the pickup `upgradeRespawn` seconds after it was taken, counting only while the hero lacks the megacutter, and only if no `w` pickup is present.

  Tests:
  - After taking it, no `w` pickup remains, and 20 s later one is back.
  - With the megacutter held, it does not come back.
  - Taking it again restarts the timer.

## 2. Boss reveal

- [x] 2.1 Implement the reveal pan in `src/main.js` (with helpers in `src/level.js` if needed):
  - It starts only on LEVEL_INTRO → BOSS.
  - It runs 0.8 s pan, 1.2 s hold and 0.8 s back.
  - The boss holds its intro pose with claws raised, the player gets no input, and no shots are fired.
  - Jump or Fire skips to a 0.3 s pan back.
  - At the end, snap the camera to the hero and send the boss to idle.

  Tests:
  - Going through the intro card into the arena: within 1.5 s the whole boss box is inside `[Camera.x, Camera.x + W]`.
  - During the reveal, holding Right doesn't move the hero, `Boss.log` stays empty and `Game.stats.shots` stays 0.
  - After about 3 s the camera is back on the hero and the state is BOSS with normal play.
  - Pressing Jump in the middle ends it within 0.5 s.
  - A respawn (`Game.onPlayerDeath()`) doesn't start a reveal.

  Update any flow or cutter tests that pass through the arena intro.

## 3. Promo agent, docs and release check

- [x] 3.1 Promo agent:
  - The bridge snapshot gets `reveal`, and the agent sends no input while it is set.
  - `w` is valued so the boss-level tour fetches it.
  - The boss logic treats `"megacutter"` like the cutter.
  - Add an agent unit test for the megacutter weapon in `hittable` and `boss_face_hittable`.

  Verify: `python tools/promo/record_promo.py --dry all` (seed 1977, and seed 7) reports "Spec limits: all met", and the run report shows the upgrade collected in L4.
- [x] 3.2 Update `README.md`: the boss arena paragraph (Mega Cutter on the top platform: twin blades, 5 damage each, lost on death, back after 20 s; the boss reveal at arena start, skippable with Jump or Fire). Rebuild `dist/buck_nukem.html`. Verify: the build succeeds, `python tools/run_tests.py` passes everything, and a `play,3,13,4,60` screenshot shows the pickup on the top platform.

## Workflow follow-up

- Archive after review; release as the next version if wanted.
