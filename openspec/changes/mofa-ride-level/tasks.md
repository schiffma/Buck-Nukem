# Tasks

## 1. Groundwork and renumbering

- [x] 1.1 Sort out the order with the two open changes that touch the same specs (design §10):
  - `phone-frame-performance`: if it is archived, add a MODIFIED delta for "Film filter on the GPU" to this change ("level 1" becomes "clay-court level" in its scenarios); if it is still open, adjust its spec wording there instead.
  - `add-title-rock-music`: it must be archived before this change. If it can't be yet, note that this change's "Ride of the Valkyries soundtrack" block must be compared with the main spec again before archiving.

  Verify with `openspec validate mofa-ride-level --strict`, and `openspec validate --specs` after any archive.
- [x] 1.2 Rename the maps to their reel numbers (`2_courts`, `3_creek`, `4_clubhouse`, `5_boss`). Shift every level index (design §10):
  - `src/test.js` (`loadLevel`, shot specs, `BENCH_SCENES`)
  - `tools/perf_phone.py`
  - the promo session (`#level=2`) and the `--dry` mapping
  - the README links (`#level=5` = boss)

  For now, add a temporary placeholder `1_road.txt`: a flat road with start, checkpoint, 8 fans and exit, marked `ride: 1`, playable on foot until §2 exists. Update the "Start level from the URL", "Start reel note" and "Reel title cards" tests to the new numbers, including `#level=4` → clubhouse and `level=6` invalid. Verify with `python tools/build.py`, `python tools/run_tests.py`, `python tools/check_levels.py`, `python tools/promo/record_promo.py --dry all` (victory from reel 2, limits met) and `python tools/perf_phone.py` (budgets met).

## 2. Riding

- [x] 2.1 Add `src/ride.js` (`Mofa`) and the ride branch in `Player` (design §2): speed model, coasting, braking, rolling back, the fixed hop, no climb/kneel/drop, hitbox, face, respawn at a standstill. Add `isRide` and the ride camera lead `CONFIG.rideCamX` (design §9). Add tests:
  - top speed ≥ 1.5 × run speed after 3 s of Right
  - coasting lasts ≥ 1 s
  - Left stops it in about 1 s
  - rolling back ≤ 0.25 × top, still facing right
  - the hop clears 16 px; Jump in mid-air does nothing
  - Up/Down don't climb or kneel
  - respawn on the mofa at the checkpoint at speed 0
  - touch pad Right/Left and the Jump button drive the mofa (touch mode)

  Verify with `python tools/run_tests.py` and `--hash touch`.
- [x] 2.2 Mounted machine gun (design §3): `mofamg` weapon, 10 shots/s, 1 damage, Up = 30° upward, HUD "MOFA MG", the blaster again on the next level, no weapon pickups in ride maps (the build fails on `w` in a ride map). Add tests for the fire rate, the angle and the HUD label, and that reel 2 starts with the blaster after the gate. Verify with `python tools/run_tests.py`.
- [x] 2.3 Road hazards (design §4): cone, pothole, speed bump and ramp objects with their map characters, plus the README legend. Add tests:
  - cone: no damage and ≥ 1/3 speed loss
  - pothole: 1 damage, jolt and slowdown; hopped over: nothing
  - speed bump: a toss at speed
  - ramp at top speed: ≥ 2 × the hop's distance

  Verify with `python tools/run_tests.py`.

## 3. Posh drivers

- [x] 3.1 Car framework (design §5–6): the `car` flag, contact 2 with a stronger knockback, explosion, wreck, a fleeing driver, points, triggers `1`–`4`, the shared `Talk` helper with `POSH_LINES`, and destroyable `latte`/`golfball` shots. Add tests:
  - each type's HP and points (800/600/700/1000)
  - contact costs 2 health
  - destruction: explosion, engine stopped, score
  - line pool: ≥ 12 lines, each ≤ 20 characters, drawable with the font, no explicit words; one bubble at a time; 4 s cooldown

  Verify with `python tools/run_tests.py`.
- [x] 3.2 SUV, BMW, Tesla and Ferrari behaviour (design §5). Add tests:
  - SUV: stays ahead slower than top speed, can't be passed, throws every 1.5–2.5 s within a screen, its throws can be shot down with Up
  - BMW: tailgates 1–2 s with flashing lights and the horn, then brake-checks ahead
  - Tesla: quieter engine than the others; rams within half a screen
  - Ferrari: roar ≥ 1 s before it's on screen, > 2 × top speed, a hop over it causes no damage

  Verify with `python tools/run_tests.py`.

## 4. Sound, look and the real map

- [x] 4.1 Engine sounds (design §7): engine profiles per kind, the mofa voice following speed, horn, cone and pothole sounds; everything silent on pause, level end and mute. Extend the sound-coverage test ("every effect was triggered by its game event") and add tests: mofa pitch rises with speed; Tesla volume ≤ 1/3 of BMW's at the same distance; silent when paused. Verify with `python tools/run_tests.py`.
- [x] 4.1b Biker rock song (design §7): the `biker` song data, the scheduler `swing`, the `slide` voice, the track choice in `setState`. Add tests:
  - the reel 1 card switches title → biker from its start
  - the reel 2 card switches biker → Valkyries from its start
  - respawn keeps the song (same step continues)
  - one loop has shuffled guitar notes, power chords, bass, kick and snare, and a tempo ≠ 132 bpm
  - swung off-beats are delayed by 1/3 sixteenth
  - mute silences it
  - a `#level=2` game never sets the biker track

  Listen in Chrome and level its volume against the Valkyries. Verify with `python tools/run_tests.py`.
- [x] 4.2 Mofa and car art (design §8): sample the colours from `sachs-mofa.jpg` in `build.py` (required image), the seated Buck, wheel animation, muzzle flash, the four cars with drivers, the burning wreck. Add tests:
  - outlines on all new sprites
  - car heights (SUV tallest, Ferrari ≤ 16 px)
  - distinct main colours
  - headlight flash ≥ 2/s
  - wheel frames change with speed
  - the mofa colours come from the photo
  - the build fails without the photo

  Verify with `python tools/run_tests.py`, `python tools/build.py`, and a `screenshot.py` sheet of the sprites, checked by eye.
- [x] 4.3 Road theme, `bg_road` and props (signs with computed distance, the club gate), then the real `1_road.txt`: 320 × 15, hazards, cars, pickups, ≥ 1 checkpoint, 8–10 fans, gate at the exit. Add the ride scene to `BENCH_SCENES`. Add tests:
  - the place sign, ≥ 2 direction signs with decreasing distances, and the gate exist
  - decoration doesn't block
  - the bright/colourful checks pass for the ride scene on both film paths

  Verify with `python tools/build.py`, `python tools/run_tests.py`, and screenshots of three spots along the road, checked by eye.
- [x] 4.4 Ride mode in `tools/check_levels.py` (design §11): hop and ramp reach, every hazard can be cleared, pickups reachable, checkpoint and fans present. Verify that `python tools/check_levels.py` reports the road OK, and that it reports a deliberately broken copy (a pothole run too long to hop) as failing.

## 5. Docs and integration

- [x] 5.1 Update the README: the story and the level list (5 reels), the ride's biker rock song, mofa controls, the posh drivers, the new legend characters, `#level=1..5` with a note that old links shift by one, and `perf_phone.py` with the ride scenario. Verify that the documented commands and links work as written.
- [x] 5.2 Run all of these; all must pass:
  - `python tools/build.py` (size < 2 MB)
  - `python tools/run_tests.py`
  - `python tools/run_tests.py --browser edge`
  - `python tools/run_tests.py --size 844,390 --hash touch`
  - `python tools/check_levels.py`
  - `python tools/promo/record_promo.py --dry all`
  - `python tools/perf_phone.py`, extended with a ride run
  - `openspec validate mofa-ride-level --strict`
## 6. Play-test revision: car scale and fan groups (design §12)

- [x] 6.1 Cars in proportion to Buck: `CAR_INFO` sizes (SUV 88×33, BMW 88×26, Tesla 89×26, Ferrari 82×21), `drawCar()` redrawn for them (driver head ≥ 6 px high, wheel radius 6–7 px). Update the car tests:
  - SUV the tallest, Ferrari ≤ 22 px
  - every car 80–92 px long
  - the driver head ≥ 6 px

  Re-run the car behaviour tests (SUV gap, BMW tailgate and brake-check, Tesla ram, Ferrari hop with no damage). Verify with `python tools/run_tests.py` and a `#shot=vehicles` screenshot next to the mofa, checked by eye.
- [x] 6.2 Fan groups on the ride: the `style` per fan, the map characters `e` (activist) and `]` (rocker) in `Fans.spawn`, the build's fan-floor check and the level checker's fan count. Draw 6 activist and 6 rocker looks (`buildFanFrame()` by style: activist signs with a crossed-out car, leaf or globe; rocker leather, studs, teased hair, devil horns), and give each group its own line pools for shout, kill, trophy and checkpoint. Re-place the ride map's fans: 4–5 activists at the WOLLERAU sign, 4–5 rockers at the club gate, no `F`. Add tests:
  - two groups of 4–5 standing together, no tennis fans on the ride
  - all looks distinct within a group, outlines on every frame including the kiss
  - group lines: ≥ 6 shout-outs and ≥ 3 per other occasion, ≤ 20 characters, drawable, not explicit; a car kill near activists uses an activist line
  - the tennis fans on the other levels are unchanged (the existing fan tests still pass)

  README: the story and the legend (`e`, `]`). Verify with `python tools/run_tests.py`, `python tools/check_levels.py`, and screenshots of both groups, checked by eye.
- [x] 6.3 Re-run the integration checks of 5.2; all must pass.

## 8. Play-test revision 2 (design §13)

- [x] 8.1 Cars at the mofa sprite's scale: `CAR_INFO` sizes (SUV 121×46, BMW 121×36, Tesla 123×36, Ferrari 113×30), `drawCar()` scaling its base layouts, the hop at −330 (rises ≥ 45 px). Update the car-size tests (110–126 px long, SUV ~46, sedans ~36, Ferrari ~30 and ≤ 32, heads ≥ 8 px) and the hop test (rise ≥ 45 px). Re-run the car behaviour, hazard and level-checker tests. Verify with `python tools/run_tests.py`, `python tools/check_levels.py`, and a `#shot=vehicles` screenshot.
- [x] 8.2 Automatic rear turret: the target choice, rear fire without Fire held, forward priority with Fire held, the swivelling gun sprite and the rear muzzle flash. Add tests:
  - a car behind with its front on screen → backward shots (≥ 8/s) that damage it
  - Fire held → forward only
  - no car behind, or a car behind still off screen, or only cars ahead → no automatic fire

  Verify with `python tools/run_tests.py` and a screenshot of a rear shot.
- [x] 8.3 Two-stroke smoke trail by state (idle, riding, accelerating). Add tests: ≥ 3 puffs in 1 s at idle, ≥ 12 in 1 s accelerating and larger/darker; puffs start behind the rear wheel, rise, drift back and are gone within 1.5 s. Verify with `python tools/run_tests.py`, a screenshot, and `python tools/perf_phone.py` (the ride still under budget).
- [x] 8.4 Re-run the integration checks of 5.2 and the README (rear turret, smoke); all must pass.

## 10. Play-test revision 3 (design §14)

- [x] 10.1 Cars after the photos: the X7 (type `suv`, 129×45), the Tesla (118×36) and the Ferrari (114×30) redrawn after `assets/img/car-bmw-x7.webp`, `car_tesla.jpg` and `car_ferrari.avif`. The X7 honks at a mofa within 40 px behind it. Remove the BMW sedan (type, AI, sprite, engine profile; map `2` → `3`; legend). Update the car tests (sizes, distinct colours, the photo features, X7 honk) and drop the BMW tests. Verify with `python tools/run_tests.py` and a `#shot=vehicles` screenshot compared with the photos by eye.
- [x] 10.2 Clear road: remove the cone, pothole and speed-bump hazards (code, sounds, map cells, legend, tests). Keep the ramps. Add a test that the ride map has none of `!`, `_`, `:` and that riding it without cars costs no health. Verify with `python tools/run_tests.py` and `python tools/check_levels.py`.
- [x] 10.3 Early turret: `rearThreat` turns the turret back for a car within half a screen behind, even off screen; it fires once the car is on screen; it turns forward again with Fire held, the car gone, or the car beyond half a screen. Update the turret tests. Verify with `python tools/run_tests.py` and a screenshot of the turret turned back before the car shows.
- [x] 10.4 Re-run the integration checks of 5.2 and update the README (cars, no obstacles, turret); all must pass.

## 12. Play-test revision 4 (design §15)

- [x] 12.1 The climb: the `climb:` header, `Level.roadTop(x)` from the map, the mofa, cars, ramps, pickups, signs and fans on `roadTop`, uphill speed scaling and the strained engine, the slope wedges drawn, the camera following up. Add tests:
  - smooth (no step, never off the road) and ≥ 6 tiles higher at the top
  - uphill top speed ≥ 25% lower on the steepest part
  - cars and pickups on the surface

  The other levels' collision stays unchanged (the existing tests pass). Verify with `python tools/run_tests.py` and a screenshot of the climb.
- [x] 12.2 Stretches: the `stretches:` header, new backdrop crops (`bg_lake`, `bg_village`, `bg_climb`, `bg_club`) in `build.py`, the cross-fade over one screen, and per-stretch roadside props (the map characters `(` and `)`, their look picked by the stretch, and the README legend). Add tests:
  - four stretches in order, each with its backdrop and props
  - no hard cut at a border
  - one benchmark scene per stretch, bright and colourful on both film paths

  Verify with `python tools/build.py`, `python tools/run_tests.py`, and one screenshot per stretch.
- [x] 12.3 Traffic waves: triggers `5` (X7 convoy), `6` (two Teslas), `7` (Ferrari pair) and `8` (X7 ahead plus Tesla behind), with delays and offsets. Add one test per wave kind. Verify with `python tools/run_tests.py`.
- [x] 12.4 The president's limo (`9`): art (white stretch limo, sunroof, president), parked before the gate, 30 hits, champagne corks (shootable), the bar "THE PRESIDENT'S LIMO", the gate closed until it is destroyed, 3000 points, a big explosion. Add tests:
  - blocking: no level end, contact knockback
  - cork rate and damage, and corks can be shot
  - the bar on screen
  - destroyed → points and the gate opens → the level completes

  Verify with `python tools/run_tests.py` and a screenshot.
- [x] 12.5 WD-40 cans (`{`): art, +2 health, "WD-40 +2", a spray puff and the health sound; `build.py` fails on `h` or `s` in a ride map. Add tests for the pickup and for the build rule. Verify with `python tools/run_tests.py` and `python tools/build.py`.
- [x] 12.6 The new 640 × 22 map: four stretches, the climb in the last third, ≥ 2 checkpoints (3 planned), waves of every kind spread over the stretches, single cars, ramps, WD-40 cans, the activists in the first stretches and the rockers at the club, the limo at the gate. Extend the level checker's ride mode to `roadTop` (continuity, pickup reach relative to the local road). Update the ride-map tests. Verify with `python tools/check_levels.py`, `python tools/run_tests.py`, and a play-through by the test harness (god mode, holding Right and Fire) that reaches the tally.
- [x] 12.7 Update the README and re-run the integration checks of 5.2 (including `perf_phone.py` < 5 ms on the ride); all must pass.

## 14. Play-test revision 5 (design §16)

- [x] 14.1 Lower the difficulty in `CONFIG` and the map: car contact 1 health with knockback 110; X7 8, Tesla 5, Ferrari 4, limo 20 hits; X7 throws every 2.5–3.5 s; corks every 1.8–2.5 s; two more WD-40 cans before the limo. Update the tests that pin these numbers. Verify with `python tools/run_tests.py` and `python tools/check_levels.py`.
- [x] 14.2 The machine-gun sound `mg` (crack, thump, click, varied pitch) for the mounted gun, forward and backward; the blaster keeps `shot`. Add tests:
  - holding Fire on the mofa plays `mg` with every shot and never `shot`
  - the blaster on foot plays `shot`, not `mg`
  - `mg` is in the list of sounds that must exist

  Verify with `python tools/run_tests.py`.
- [x] 14.3 Update the README and re-run the integration checks of 5.2; all must pass.

## 15. Play-test revision 6 (design §17)

- [x] 15.1 Restore the difficulty of before §16 in `CONFIG` (contact 2, knockback 160; 12 / 8 / 6 hits; limo 30; throws 1.5–2.5 s; corks 1–1.5 s); keep the 9 WD-40 cans. Update the tests that pin these numbers. Verify with `python tools/run_tests.py`.
- [x] 15.2 The twin machine gun: the rear gun sprite on the luggage rack, a volley forward and backward on Fire, Up angling the front gun only, muzzle flashes at both barrels, one `mg` per volley; remove the rear turret's auto-turn (`rearThreat`, `rearTarget`, `gunBack`). Replace the rear-turret tests with:
  - Fire held for 1 s: ≥ 8 shots each way
  - a car behind is hit by the rear gun
  - no shots without Fire
  - Up: the front shots angled, the rear level
  - one `mg` per volley

  Update the README (controls) and the art screenshot. Verify with `python tools/run_tests.py` and `python tools/screenshot.py` (vehicles, rear shot).
- [x] 15.3 Checkpoints: the respawn point on `roadTop` at the flag, `Mofa.mount` snapping to the road, cars on screen and pending wave spawns cleared on respawn. Add tests on the real map:
  - each of the 3 flags goes up when passed
  - losing a life after each puts the mofa at that flag on the road surface (the climb flag too), standing, full health, the camera on the road
  - no car contact during the respawn invulnerability
  - game over after the last life on the ride

  Verify with `python tools/run_tests.py` and `python tools/check_levels.py`.
- [x] 15.4 Posh ladies in the limo: two ladies at the side windows (hats, sunglasses, pearls, a glass), `LIMO_LADY_LINES` (≥ 12, ≤ 20 characters), speakers with bubble anchors (president and ladies) every 2–3 s while the limo is on screen, the ladies running off when it is destroyed. Add tests:
  - the lines' count, length and font
  - bubbles from the ladies and the president, above the speaker, one at a time
  - none after the limo is destroyed, three runners

  Verify with `python tools/run_tests.py` and the limo screenshot.
- [x] 15.5 Update the README and re-run the integration checks of 5.2; all must pass.

## 16. Play-test revision 7 (design §18)

- [x] 16.1 Talkative drivers on the ride: a line within 0.5 s of a car showing on screen, then every 2.5–3.5 s (`driverTalkEvery`), no chance roll; up to 2 car bubbles at once (`rideBubbles`), never overlapping each other or a fan bubble, retrying after 0.3 s; other levels unchanged. Add tests:
  - every car that comes on screen speaks within 0.5 s
  - the repeat interval
  - never more than 2 car bubbles, and no overlaps with each other or with fan bubbles over a long ride
  - the lawyers keep one bubble at a time

  Verify with `python tools/run_tests.py`.
- [x] 16.2 The limo at 300 × 56 with a taller window band; the ladies and the president with 9-px heads (hat, sunglasses, lips, pearls, glass); the sunroof, speakers, cork origin and runners scaled; the map checked (limo after the rockers). Add tests:
  - the limo's size, taller than the X7
  - the ladies' and the president's heads at least 8 px, measured like the drivers'
  - corks from the sunroof
  - the limo still parks 60 px before the gate, and the god-mode play-through still reaches the tally

  Verify with `python tools/run_tests.py`, `python tools/check_levels.py` and the limo screenshot.
- [x] 16.3 Update the README and re-run the integration checks of 5.2; all must pass.

## 13. Play test

- [ ] 13.1 You play the ride by hand on desktop and on a phone, and give feedback on:
  - difficulty
  - readability of the cars (now in proportion) and their throws
  - the two fan groups and their lines
  - the engine sounds
  - the biker rock song (including its volume against the Valkyries)
  - the jokes

  The numbers in `CONFIG` get tuned from that feedback. Earlier feedback (bigger cars, activists and rocker chicks instead of tennis players) is covered by group 6.

## Workflow follow-up

- Release as 1.1.0 following the README release steps after 13.1, then archive the change.
- Archive order (task 1.1): `add-title-rock-music` was still open when this change was applied. Archive it first. If it is archived after this change, compare this change's "Ride of the Valkyries soundtrack" block with the main spec again and rebase it (keep the ride exception).
- `phone-frame-performance`: its spec now says "clay-court level" instead of "level 1" (task 1.1), so it can be archived before or after this change.
- A later change: teach the promo AI to ride, so the promo video can start at reel 1.
