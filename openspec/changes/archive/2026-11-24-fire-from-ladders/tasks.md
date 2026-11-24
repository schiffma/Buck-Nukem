# Tasks

## 1. Firing on ladders

- [x] 1.1 In `src/player.js`, let Left/Right set the facing while climbing (no movement, ladder state kept), remove the `!this.climbing` fire condition, and show the shoot (or cutter) frame facing `face` while `shootT > 0` on a ladder. Add tests: turning on a ladder (face flips, position and climbing unchanged), firing on a ladder (climbing, stopped halfway, and after a 5-frame Up tap at the ladder foot) creates shots and keeps Buck on the ladder. Verify with `python tools/run_tests.py`; existing ladder tests still pass.

## 2. Shots through walls

- [x] 2.1 In `Player.fire()`/`fireBlade()`, check the tiles between the hero's centre and the spawn box; if one is solid or a closed door, make sparks at the wall, count the shot for the fire rate and create no projectile. Add a test: pressed against a 1-tile wall, no shot exists beyond the wall after 10 frames and sparks appeared; firing 2 tiles from a wall still creates a shot that hits the wall. Verify with `python tools/run_tests.py`.

## 3. Regression and docs

- [x] 3.1 Add the `firing everywhere` regression test (standing, running, jump + run, on a ladder, after hurt, next to a fan; also with the disc cutter in the boss arena). Update the README controls note ("Fire also works on ladders"). Run `python tools/build.py`, `python tools/run_tests.py`, `--browser edge`, `python tools/check_levels.py`, `python tools/promo/record_promo.py --dry all` and `openspec validate fire-from-ladders --strict`; all pass.
