# Tasks

## 1. Small crayfish (realistic, red only)

- [x] 1.1 Redraw `CRAY1`/`CRAY2` in `src/sprites.js` as 32×14 side-view rows after the reference photo (tail fan, 5–6 overlapping tail segments, smooth carapace with groove and rostrum, eye, forward antennae, thin alternating legs, big claw with pale tips, glossy sheen pixels) in the red-only palette (`c`/`C`/`x`/`i` recoloured, `e` for claw tips), designed with the generator script and checked as a 12× preview next to the photo; drop the slime drips. Replace the "blue back above, red belly below" test with: no blue-dominant pixel in either frame, ≥ 3 tail segment lines, front claw ≥ 1/4 body length, legs below the body, forward antennae ≥ 1/2 body length; keep the outline and "hitbox/HP/speed unchanged" tests. Verify with `python tools/run_tests.py` and the `sprites` screenshot.
- [x] 1.2 Remove the glow motes: delete `FX.glow`, `GORE.glow`, `GORE.maxGlow`, the crayfish `glowT` emission and the blue entry in `GORE.shell`; replace the "emits blue glow particles" test with "no glow particles after 1 s with a crayfish on screen". Verify with `python tools/run_tests.py` and a level 2 screenshot (`play,1,12,26,60`) that the crayfish reads clearly against the creek.

## 2. Giant boss crayfish (realistic, red only)

- [x] 2.1 Redraw the boss in `src/boss.js` in realistic red: remove `splitEllipse`, blue spikes and claw edges; glossy red-brown carapace with darker lower shading, sheen band, cervical groove, overlapping tail plates, two-shade tail fan, heavy claws with dark joints and pale tips, rostrum between the eye stalks, long antennae; keep geometry, hitboxes, flash and enraged eyes. Replace the "shell split lengthwise" test with a red-only check on a rendered boss frame. Verify the boss tests pass and compare `python tools/screenshot.py <scratchpad>/boss.png boss,3,3,12,200` with the photo by eye.
- [x] 2.2 Remove the DNA helix and molecule glow (`drawGlow`, `noGlow` and its use in the outline test); replace the "pulsing blue DNA glow" test with "nothing drawn around the boss beyond its outlined body"; keep the boss-arena performance test. Verify with `python tools/run_tests.py`.

## 3. Disc cutter

- [x] 3.1 Add `cutterRate`, `cutterSpeed`, `cutterDmg` to `src/config.js`, the `"cutter"` weapon in `Player.fire()`/`respawn()` and the switch in `Game.loadLevel` for the boss arena, the spinning `SPR.sawBlade` (14×14, 4 frames), and blade deflection sparks on the shell/claws. Add tests: weapon is the cutter when the arena starts, ≤ 3 blades per second, blade ≥ 12 px and animates, face hit removes 3 HP, shell hit removes 0 and makes sparks, blade hits a ground-level crayfish, cutter kept after respawn in the arena, blaster in levels 1–3 and Mega Blaster unchanged. Verify with `python tools/run_tests.py`.
- [x] 3.2 Add hero frames holding the disc cutter (all poses), the HUD icon + "DISC CUTTER" label, and the `"grinder"` fire sound. Extend the outline test to the new hero frames, add a HUD text test and add `"grinder"` to the sound-coverage test. Verify with `python tools/run_tests.py` and a boss-arena screenshot with the hero firing (`fire,3,3,12,60`).

## 4. Integration and docs

- [x] 4.1 Run the full flow test (title → victory) and `python tools/promo/record_promo.py --dry 3`; the autopilot must still beat the boss with the cutter. Record the boss fight length; if it is under ~20 s of play, raise `bossHp` in `src/config.js` and re-run. Verify both runs reach victory.
- [x] 4.2 Update the README (crayfish description: realistic red crayfish, no blue/glow; boss description without the DNA helix; credits note that the crayfish follow a reference photo) and produce a before/after screenshot (red/blue version vs. realistic red) of a small crayfish and the boss for the user's review. Verify the README matches the built game.
- [x] 4.3 Run `python tools/build.py` (deterministic, under 2 MB), `python tools/run_tests.py`, `python tools/run_tests.py --browser edge`, `python tools/check_levels.py` and `openspec validate mutant-crayfish-and-disc-cutter --strict`; all pass.
