# Tasks

## 1. Kneel state and low shot

- [x] 1.1 In `src/player.js`, add the kneel state.
  - Kneel when Down is held, Buck is on the ground, not climbing, has no ladder below him and isn't hurt. Enter with `y += 12, h = 16`. Stand up with `y -= 12, h = 28` only when the tiles above leave room.
  - While kneeling: no walking (target speed 0); Left/Right only turn him.
  - Jump while kneeling on solid ground: stand up and jump normally.
  - The kneel ends on leaving the ground. `placeAt` resets it.
  - Check the `Player.h` users in `src/main.js` (spawn, checkpoints) still use the standing height.
  - Add tests in `src/test.js`:
    - kneel stops a running hero; Left turns without moving
    - the hitbox is 16 px high with the feet unchanged; standing up restores 28
    - under a low ceiling he stays kneeling after Down is released, without clipping into the tile
    - Down on a ladder top still climbs down (existing test)
  - Verify with `python tools/build.py` and `python tools/run_tests.py`.
- [x] 1.2 Kneeling shots in `Player.fire()`/`fireBlade()`: blaster and Mega shots centred 6 px above the floor (`y + 10` while kneeling), the cutter blade at `y + 2`, and `muzzleBlocked` using the same row.
  - Add tests:
    - a kneeling hero kills a crayfish standing on the ground in front with 2 standard hits
    - a standing hero's shot still passes over a ground crayfish
    - the standing shot height is unchanged (existing test)
  - Verify with `python tools/run_tests.py`.
- [x] 1.3 Ducking checks. Add tests:
  - a briefcase at chest height flying at a kneeling hero passes over him with no damage
  - a crayfish walking into a kneeling hero still hurts him
  - a boss shockwave still hits a kneeling hero
  - Verify with `python tools/run_tests.py`.

## 2. Drop-through on Down + Jump

- [x] 2.1 In `src/player.js`, replace the held-Down drop-through.
  - Jump while kneeling on a one-way platform (platform tile under the feet) sets a 0.2 s drop timer, gives no jump impulse and ends the kneel. `moveBody` gets `dropThrough` while the timer runs.
  - Holding Down alone no longer drops through.
  - Add tests:
    - Down + Jump on an `=` ledge and on a clubhouse table drops Buck to the floor below
    - holding Down for 1 s on a ledge keeps him kneeling on it
  - Verify with `python tools/run_tests.py` and `python tools/check_levels.py` (all levels completable).

## 3. Kneeling pose and controls text

- [x] 3.1 In `src/sprites.js`, build the kneeling frames:
  - `SPR.hero.kneel`, `SPR.hero.kneelShoot` and a disc-cutter `SPR.heroCutter.kneel`, in the 23×32 frame
  - head and shortened torso drawn 10 px lower, kneeling legs in at most 4 rows (one knee on the ground, other leg bent forward), gun barrel row about 6 px above the frame bottom
  - In `Player.draw`, use these frames while kneeling, with the muzzle flash and cutter sparks at the kneel muzzle.
  - Check with screenshots (`python tools/screenshot.py` plus a kneel scene, or the `#shot=` mode), facing right and left, standing vs. kneeling, shooting, and with the cutter.
  - Add a test that the kneeling frame's lowest opaque row is at the feet and its top is at least 8 px lower than the standing frame's.
  - Verify with `python tools/run_tests.py`.
- [x] 3.2 Update the controls text:
  - title screen (`src/screens.js`): "UP/DOWN" → "CLIMB/KNEEL"
  - README controls table: Down kneels (low shot, duck); Down + Jump drops through platforms; Down on a ladder top climbs down
  - Adjust the title-screen controls test.
  - Verify with `python tools/run_tests.py` and a title screenshot (text fits the poster box).

## 4. Promo agent

- [x] 4.1 In `tools/promo/bridge.js`, add `hero.kneeling` to the snapshot. Make `hittableInLine` use the kneeling muzzle band (a ground crayfish in line is hittable for a kneeling shot).
  - Mirror the rule in `agent/world.py` `hittable` and the note in `agent/metrics.py`.
  - Extend `tests/test_fairplay.py` only if the allowed-writes scan needs it (the bridge still writes input only).
  - Verify with `python -m unittest discover -s tests -t .` from `tools/promo`.
- [x] 4.2 Add a `Kneel` leaf in `agent/behaviour.py` (before `Vault`).
  - Trigger: a crayfish on the ground, on Buck's floor, in front, 40 px – 9 tiles away, with a clear line, near the route.
  - Action: face it, hold Down (`why: "kneel"`), and let Fire shoot. Budget 4 s per crayfish; give way to Cray/Vault when it leaps or gets closer than 40 px.
  - The controller passes `down` for it. The follower keeps aligning within 6 px before pressing Down at a ladder top.
  - Add a unit test with a fake snapshot: a ground crayfish 80 px ahead → the leaf asks for Down and faces it; a crayfish on another floor → no kneel.
  - Verify with a dry run, `python tools/record_promo.py --dry all`: victory, more crayfish kills than before (11 alive at the exits on seed 1977), no new stuck events, play-quality limits not worse.
- [x] 4.3 Update the wording in the in-flight change `python-promo-autopilot`.
  - In its spec delta (`specs/tooling/promo-video/spec.md`), "a crayfish only while it leaps" becomes "a crayfish while it leaps, or on the ground from a kneeling shot". The "Detours that pay" scenario becomes "crayfish are shot when in line: in the air, or kneeling when on the ground".
  - Update `.claude/skills/buck-promo-video/SKILL.md` (Tactical list: kneels to shoot crayfish on the ground).
  - Verify with `openspec validate python-promo-autopilot --strict` and `openspec validate kneel-and-low-shot --strict`.

## 5. Integration

- [ ] 5.1 Full check:
  - `python tools/build.py`, `python tools/run_tests.py` (Chrome and `--browser edge`), `python tools/check_levels.py`
  - one manual play-through of level 2 (creek crayfish) and level 3 (clubhouse tables: Down + Jump)
  - Verify all pass and the file stays under the build size limit.
