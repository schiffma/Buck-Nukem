# Design

## Context

- **Levels:** each level is a text map in `src/levels/*.txt` (header lines plus 32-column segments), loaded by `Level` (`src/level.js`). The build embeds them in file-name order, and `Game.loadLevel(i)` indexes that list. Only the boss arena has its own flag (`boss: 1`). It switches behaviour in a few places (camera lead `CONFIG.bossCamX`, cutter weapon, reveal pan).
- **Hero:** `Player` (`src/player.js`) is a platformer body (walk, jump, climb, kneel, fire) with health, invulnerability, lives and respawn at checkpoints.
- **Enemies:** they come from one table, `ENEMY_TYPES` (`src/enemies.js`), and are updated while within one screen of the view (`isActive`).
  - Enemy projectiles are objects in `Game.enemyShots` with a `kind` (lawbook, bubble, shockwave, clipping).
  - Lawyers have speech bubbles through `LawyerTalk`.
  - Mowers have engine sounds through `Sound.setEngines()` (the 2 nearest, louder when closer).
- **Hard-coded level indices:**
  - `src/test.js`: 28 `loadLevel(n)` calls and 7 shot specs
  - `tools/perf_phone.py`: `loadLevel(0)`
  - the promo recorder starts from the title, and its `--dry N` indexes the levels
- **Touch:** touch mode maps fingers to the same actions as the keys, so a new level needs no touch work.
- **Reference photo:** `assets/img/sachs-mofa.jpg`, untracked so far.

See proposal.md for the motivation, and the specs (`game/ride`, plus the enemies, gameplay and presentation deltas) for the requirements.

## Goals / Non-Goals

**Goals:**
- Riding is a mode of the existing hero, level and enemy systems: one hero, one health and lives model, one projectile list, one sound engine.
- The ride is authored like every other level, as a text map, and checked by the level checker.
- The renumbering is mechanical and caught by tests: every index that moves has a test or a tool run that fails if it's wrong.

**Non-Goals:**
- Teaching the promo AI to ride (a later change).
- Several lanes, overtaking on a second lane, or depth: the road is one lane in side view.
- New controls, a vehicle on other levels, getting off the mofa.

## Decisions

### 1. Level files and the `ride` flag
Rename the maps so file order equals reel number:
- `1_courts` → `2_courts`
- `2_creek` → `3_creek`
- `3_clubhouse` → `4_clubhouse`
- `4_boss` → `5_boss`
- new `1_road.txt`

The new map's header: `name: THE ROAD TO WOLLERAU`, `theme: road`, `bg: bg_road`, `ride: 1`.

`Level` gets `isRide`. The map is 320 × 15 tiles: one screen high, about 35 s at top speed and about 75–90 s with the fights. That fits the other levels' 1-minute pace.

*Alternative:* `0_road.txt` and keep the old names. Rejected: file numbers and reel numbers would differ by one forever.

### 2. Riding as a hero mode (`src/ride.js`)
`Player.update()` hands over to `Mofa.update(Player, dt, level)` when `level.isRide`. `Player.draw()` and `Player.fire()` do the same.

`Mofa` keeps only the horizontal speed model:

| Input | Effect |
|---|---|
| Right | accelerate to `CONFIG.mofaTop` (150 px/s, 1.56 × run speed) |
| Left | brake hard; below 0, roll back to −0.25 × top |
| nothing | coast, losing about 30 px/s per second |
| Jump | a fixed hop (no jump-cut) |

Gravity, floor collision, damage, invulnerability, lives and respawn stay the shared `Player` code.
- The riding hitbox is the mofa with Buck on it (about 28 × 30).
- The face is always +1 (rolling back keeps facing right).
- Up/Down climbing, kneeling and drop-through are skipped in ride mode.
- `respawn()` keeps the mode and sets the speed to 0.

On completion, `nextLevel()` sets `Player.weapon = "blaster"` when the next level isn't a ride.

*Alternative:* a separate vehicle entity that Buck sits on. Rejected: two bodies to keep in sync for damage, respawn, camera and tests.

### 3. Mounted machine gun
- `Player.weapon = "mofamg"` on ride levels (set in `loadLevel`/`respawn`, like the boss arena's cutter).
- Shots use the existing hero shot list: rate `CONFIG.mofaRate` = 10/s, 1 damage, speed 300.
- With Up held, they get `vy = -tan(30°) · speed`; `updateHeroShots` already moves shots by `vx`/`vy`.
- The HUD label reads "MOFA MG", with a small gun icon.

### 4. Road hazards as map props, not holes
New map characters, all free in the current legend:

| Char | Meaning |
|---|---|
| `!` | traffic cone |
| `_` | pothole (on the road top) |
| `:` | speed bump |
| `/` | ramp, 2 tiles |
| `S` | "WOLLERAU" place sign |
| `>` | "TC WOLLERAU" direction sign (its distance text is computed from its distance to the exit) |
| `}` | club gate, 4 × 4 decoration around the exit `E` |

Hazards are objects (`Game.hazards`), not tiles, so the road stays one continuous floor and the level checker's floor logic still works:
- **Cone:** knocked away with a speed loss of × 0.6.
- **Pothole:** contact on the ground means `Player.hurt(1)` plus a speed loss of × 0.5 and a small vy jolt. In the air it is ignored.
- **Speed bump:** vy −160 above 0.6 × top speed.
- **Ramp:** when taken at speed, a launch with vy −380, about twice a hop's distance.

### 5. Cars are enemies with a `car` flag
`ENEMY_TYPES` gets `suv`, `bmw`, `tesla` and `ferrari` with `car: true`, `contact: 2` and their HP and points (enemies spec). Map characters `1`–`4` mark them:
- **SUV (`1`):** placed on the road and activated like the other enemies. It drives at 0.6 × mofa top and keeps 70–150 px ahead of Buck, holding back when Buck stops. Every 1.5–2.5 s it throws a `latte` or `golfball` enemy shot in an arc (gravity) toward Buck.
- **BMW (`2`), Tesla (`3`), Ferrari (`4`):** triggers. When Buck passes the trigger column, the car spawns off screen behind Buck (BMW, Tesla) or ahead of him (Ferrari).
- **BMW:** a small state machine (tailgate, overtake, brake-check, leave or return) with headlight flash timers and the horn.
- **Tesla:** cruises silently at mofa speed + 20, then rams at + 120 when it is within 160 px.
- **Ferrari:** 340 px/s toward Buck; its engine sound starts at spawn, which is 1 s of travel off screen.

Other car rules:
- Contact uses the existing enemy contact path with a stronger knockback.
- Cars ignore hazards and each other.
- `latte` and `golfball` shots can be shot down: hero shots check them in `updateHeroShots`. No other enemy shot kind can be destroyed.
- **Death** reuses the mower explosion (oil, sparks, smoke) plus a burning wreck prop that fades in 20 s, and a `driver` FX particle running off screen. No gibs: the drivers are lampooned, not slaughtered.

### 6. Driver speech
`LawyerTalk` becomes a small shared `Talk(lines)` helper used by lawyers and drivers. It keeps the same rules: one bubble at a time, 4 s cooldown, 1.5 s display. `POSH_LINES` holds at least 12 lines of at most 20 characters, for example:
- "DO YOU KNOW MY DAD?"
- "NICE BIKE, GRANDPA!"
- "GET OFF MY ROAD!"
- "I PAY YOUR SALARY!"
- "DADDY'S CAR!"
- "MY LAWYER WILL CALL"
- "ZERO EMISSIONS, LOL"
- "0 TO 100 IN 2.9!"
- "PARKING IS FOR POOR"
- "TRUST FUND, BABY!"
- "ROSE O'CLOCK!"
- "MOVE IT, PEASANT!"

### 7. Sound
`Sound.setEngines(list)` already takes the 2 nearest mower engines. It is generalised to `{ x, kind, rate }` entries with one synth profile per kind:

| Kind | Synth profile |
|---|---|
| mower | the current one |
| suv | low diesel rumble |
| bmw | mid growl |
| tesla | quiet sine whine at a third of the volume |
| ferrari | loud high sawtooth |

The mofa is its own always-on voice while riding: a two-stroke pulse whose rate goes from 9 Hz at idle to 28 Hz at top speed, with the filter opening with speed. It stops in the same places the mower engines stop (pause, level end, mute).

New sound effects: a horn (two square tones), a cone thunk and a pothole clunk.

**Biker rock song.** A third entry in `SONGS` (`biker`), built in code like the title theme (`ROCK`) from the same voices: `gtr` with palm mutes, `pow`, `rbass`, kick, snare, hat, crash and tom. It adds a `slide` voice, a pitch-swept guitar note for the engine-rev licks. It is original, quoting no existing riff or melody:
- **Key, tempo, groove:** A, 150 bpm (not the title's E minor at 132 bpm), with a boogie shuffle.
- **Swing:** the scheduler gets a per-song `swing` (0.33): every off-beat eighth is delayed by a third of a sixteenth, so the existing step grid stays.
- **16 bars:**
  - 2 bars intro: the riff alone, with a slide rev into bar 3
  - 8 bars boogie verse over A–A–D–A–E–D–A–E, with a root–fifth–sixth bass walk
  - 4 bars power-chord chorus
  - 2 bars break with stabs and a tom roll; the loop then starts again at the intro
- **Track choice:** `Game.setState()` picks it. The title gets `title`; every other state gets `biker` when `Game.level.isRide`, else `valkyries`. Respawn and pause don't change the state's track, so the song keeps running. The boss tempo-up stays Valkyries-only.
- **Volume:** levelled against the Valkyries by rendering both offline and comparing loudness: the biker song is at 0.90× the Valkyries' RMS, the title theme at 0.94×. The by-ear check is part of the hand play test (task 5.3).

### 8. Look and build
- **Mofa sprite:** built procedurally in `sprites.js` from a pixel template, like the hero and the crayfish. The frame red, the chrome highlight and the seat black come from `ASSETS_META.mofa`, sampled by `build.py` from fixed boxes in `sachs-mofa.jpg`, which becomes a required image.
- **Wheels:** spoke frames switch at a rate proportional to the speed.
- **Buck:** the existing hero palette in a seated pose.
- **Cars:** procedural, outlined, 3-tone, about 56–72 px long: SUV 34 px tall, BMW and Tesla 22, Ferrari 16. A driver head in the window, sunglasses or pearls by type.
- **Road theme `road`:** asphalt with dashed lane marks, a curb, guard rail posts. Decoration props for the signs and the gate.
- **Backdrop `bg_road`:** a new build crop of an existing photo, the hills band of `tc_wollerau_02.jpg`, graded like the others. It can be swapped later if a road photo is added; that is not a spec change.

### 9. Camera on the ride
The boss arena's lead camera (`CONFIG.bossCamX`) is generalised to a per-level lead: `CONFIG.rideCamX` = 96 puts Buck about 1/3 from the left, so traffic ahead is visible. Vertical scrolling is off (one screen high).

### 10. Renumbering
- **Mechanical index shift:** every `loadLevel(n)` and shot spec in `src/test.js`, `BENCH_SCENES`, `tools/perf_phone.py`, and the README examples (`#level=4` → `#level=5`).
- **Title note:** `titleStartNote()` already handles any count (boss = FINAL REEL).
- **Promo recorder:** the session URL gets `#level=2`. Its title then shows "STARTS AT REEL 2", which is accepted. `--dry N` keeps meaning the N-th platform level (0–3) and adds 1 internally, so the documented commands still work.
- **Order of changes:** the active change `phone-frame-performance` says "level 1" (meaning the courts) in its spec. It should be archived first, after its Xiaomi check, so this change can modify its "Film filter on the GPU" scenarios to say "clay-court level". If it is still open at apply time, its wording is adjusted there instead (task 1.1).
- **The soundtrack requirement:** `add-title-rock-music` (still open, 5 tasks left) modifies "Ride of the Valkyries soundtrack" too, and archiving replaces the whole requirement block. This change's version is built on that change's text and only adds the ride exception and the start on the first non-ride reel. So `add-title-rock-music` must be archived first. If it is archived later, it would drop the ride exception, and this delta must then be rebased (task 1.1).

### 11. Level checker for rides
`check_levels.py` gets a ride mode:
- It simulates the mofa hop (and the ramp launch) with the game's constants at top speed.
- It walks the road from `P` to `E` and checks every pothole run and cone/bump cluster against the hop reach.
- Pickups must sit within hop height above the road, or ramp height after a ramp.
- There must be at least one checkpoint `C` and 8–10 fans `F`.

### 12. Play-test revision: car scale and the ride's fan groups
User feedback after the first build (task 5.3):

**Bigger cars, in proportion to Buck.** The scale is Buck himself: 32 px for about 1.8 m, so about 18 px per metre. The mofa sprite stays as it is.

| Car | New size (px) | Old size (px) |
|---|---|---|
| SUV | 88 × 33 | 66 × 34 |
| BMW | 88 × 26 | 62 × 22 |
| Tesla | 89 × 26 | 62 × 22 |
| Ferrari | 82 × 21 | 64 × 16 |

- `CAR_INFO` sizes change, and `drawCar()` is redrawn for them: longer bodies, wheels with a radius of 6–7 px, and the driver's head at least 6 px high in a bigger window.
- Behaviour distances in px stay. Still verified by the existing car tests:
  - the SUV keeps 70–150 px ahead
  - the BMW tailgates with an 8 px gap and pulls in 26 px ahead
- **The Ferrari can still be hopped:** the hop rises 40 px, and the mofa's underside stays above 21 px for about 0.41 s. Passing an 82 px Ferrari plus the 28 px mofa at 490 px/s takes about 0.22 s.

**Two fan groups on the ride.** `Fans` gets a `style` per fan: `tennis` (default), `activist` or `rocker`.
- **Map characters:** `F` stays the tennis fan. The new, free characters are `e` (environmental activist) and `]` (rocker chick). The ride map places the activists as a demo at the WOLLERAU sign near the start (4–5) and the rockers at the club gate (4–5).
- **Looks:** `buildFanFrame()` branches by style for the outfit, and keeps the body template, the 4 frames (idle, wave, jump, kiss) and the outline. 6 looks per group, as `FAN_VARIANTS_ACTIVIST` and `FAN_VARIANTS_ROCKER`.
  - **Activists:** green parka or poncho, bell-bottom jeans, a flower or headband. The held sign shows a symbol: a crossed-out car, a leaf or a globe. The cheer frames raise the sign.
  - **Rockers:** studded black leather jacket, a band T-shirt in the accent colour, big teased hair, boots. The cheer frames show the devil-horns hand.
- **Lines:** `FAN_LINES` becomes per style: `FAN_LINES.tennis` (today's pools), plus `activist` and `rocker` pools for shout, kill, trophy and checkpoint. Activists cheer destroyed cars in particular ("ONE SUV LESS! ♥"). Rockers cheer the ride ("BORN TO RIDE! ♥").
- **Tools:** the build's fan-floor warning, the level checker's 8–10 fans check and `Fans.spawn` count all three characters. The README legend gets `e` and `]`.

### 13. Play-test revision 2: bigger cars, rear turret, smoke
- **Cars at the mofa sprite's scale.** The mofa sprite (42 px for a 1.7 m mofa) sets the scale at about 25 px per metre: SUV 121 × 46, BMW 121 × 36, Tesla 123 × 36, Ferrari 113 × 30.
  - `drawCar()` keeps its layouts in the 18 px/m base boxes (`CAR_BASE`) and scales every rectangle, wheel and head to the new box, so the art stays consistent. Driver heads come out 8–10 px.
  - The hop rises to about 54 px (`mofaHopVel` −330). Over the 30 px Ferrari, the mofa stays clear for about 0.44 s; the Ferrari passes under it in 0.29 s while riding, or 0.41 s at a standstill. (Found while implementing: −310 left no margin at a standstill.) The ramp still flies more than twice the hop distance.
- **Automatic rear turret** (`Mofa.rearTarget`). The nearest awake, live car behind the mofa whose front is on screen. Found while implementing: the ride camera keeps Buck about 96 px from the left edge, so "half a screen behind" was mostly off screen, and shots at an unseen car vanish at the screen edge.
  - With no Fire held and a target present, `Mofa.fire(P, -1)` shoots backwards at the gun's normal rate.
  - The gun is drawn as its own small sprite (`SPR.mofa.gun`) on the handlebar mount. It points backwards for 0.3 s after a rear shot, so it visibly swivels, with the muzzle flash at its back end.
  - Fire held always means forward fire.
- **Two-stroke smoke.** `Mofa.smoke(P, dt)` emits `FX` smoke parts from the exhaust end, behind the rear wheel. Each puff drifts back and up and lives 1.2 s.

  | State | Interval | Size | Colour |
  |---|---|---|---|
  | idle | 0.25 s | 2–3 px | light blue-grey |
  | riding | 0.12 s | 3 px | blue-grey |
  | Right held | 0.05 s | 3–5 px | darker blue-grey |

### 14. Play-test revision 3: cars after the photos, clear road, early turret
- **Three cars after the photos.** The reference photos are `assets/img/car-bmw-x7.webp`, `car_tesla.jpg` and `car_ferrari.avif`.
  - The palette is picked from them and written into `CAR_COLORS`. The build's Pillow can't read AVIF, and the cars are drawn in code anyway, so the photos are references only, not build inputs.

  | Car | Role | Size (px) | Look |
  |---|---|---|---|
  | BMW X7 | the SUV role: roadblock and throws, plus a honk when Buck rides within 40 px behind (horn at most once a second) | 129 × 45 (5.15 × 1.8 m) | metallic dark grey #4a4e56, a big chrome twin-kidney grille, LED headlight strip, roof rails, black window trim; driver with pearls |
  | Tesla Model 3 | unchanged | 118 × 36 (4.7 × 1.44 m) | deep metallic red #9a1420, black glass roof, no grille, aero wheel covers |
  | Ferrari | unchanged | 114 × 30 | rosso #d81a14, black rear section and spoiler lip, side air intake, yellow brake calipers #f0c010 |

  - The X7 keeps the internal type id `suv`, so the map character `1` and the code stay. The README and the speech say "BMW X7".
  - The tailgating BMW sedan (type `bmw`, its sprite, AI, engine profile and headlight flash) is removed. The map's `2` triggers become `3` (Tesla), and `2` leaves the legend.
- **Clear road.** The cone, pothole and speed-bump hazards (`!`, `_`, `:`), their code, sounds (`cone`, `clunk`, `bump`), tests and legend rows are removed, and the map's hazard cells become empty road. Ramps (`/`) stay, with their launch and the ramp-only pickups. The level checker keeps checking ramps and pickups (its hazard-group check simply finds none).
- **Early turret.** `Mofa.rearThreat(P)` is the nearest live car behind within `W/2` px of the mofa's back, on or off screen. While a threat exists and Fire is not held, `P.gunBack` is set and the turret is drawn turned back. It fires only when `Mofa.rearTarget(P)` (the front on screen) also holds. Fire held, or no threat, turns it forward. This replaces the 0.3 s post-shot timer.

### 15. Play-test revision 4: a longer ride, the climb, waves, the limo, WD-40
**Map.** `1_road.txt` grows to 640 × 22 tiles (20 segments).
- The extra rows give room for the climb; the camera already follows vertically when a level is taller than the view.
- Four stretches, about 160 tiles each:

  | Stretch | Tiles | Backdrop source |
  |---|---|---|
  | lake promenade | 0–159 | the top band of `tc_wollerau_02.jpg` |
  | Wollerau village | 160–319 | the village band of `tc_wollerau_02.jpg` |
  | vineyard climb | 320–479 | the green hillside fields on the left of `tc_wollerau_02.jpg` (there is no vineyard photo, and `krebsbach_05.jpg` is a straight-down shot of the courts; vine rows are foreground props) |
  | the club on the hill | 480–639 | the courts in `tc_wollerau.jpg` |

- New level header `stretches: 0 bg_lake, 160 bg_village, 320 bg_climb, 480 bg_club`. The level keeps an ordered list. The backdrop draws the stretch at the camera's centre, cross-faded over 320 px (one screen) around each border; `globalAlpha` is used on the second strip.
- Each stretch gets its own deco: lake railings and benches; flower boxes and Swiss flags in the village; vine rows and dry-stone walls on the climb; hedges and flags at the club. The props are drawn by `src/ride.js` through the existing sign mechanism (`Game.signs`). Few map characters are still free, so two characters serve every stretch and the stretch (`Level.stretchAt(x)`) picks the look: `(` is a low row 2 tiles wide (lake railing, flower boxes, vine row, hedge) and `)` is a single feature (bench, Swiss flag, dry-stone wall, club flag). Both are in the README legend.
- The four stretch crops replace `bg_road` (§3, §8); the map's `bg:` header falls back to `bg_lake`.
- 3 checkpoints: one per stretch border.
- On ride levels the camera rides on the road profile: the road surface 24 px above the bottom of the view, rising with the climb (hops and ramp jumps don't move it).

**Climb as a road profile.** Tiles can only step, so the ride's road surface becomes a function `Level.roadTop(x)`:
- It is built from the map at load time: the top of the road's `#` column at each x, and a header `climb: 420-570 19-12`, meaning the road top rises smoothly from row 19 to row 12 between columns 420 and 570 (the last third, as the spec asks; the vineyard stretch's backdrop starts at 320, the slope at 420). In between, the map's floor is stepped, and the ride's road drawing fills the slope wedges.
- On ride levels the road is drawn column by column along `roadTop` (asphalt and curb on top, the grass verge below), not as `#` tiles. At load, pickups, signs, props, fans, ramps and parked cars are shifted onto the slope (`slopeShift(x)`, the smooth road minus the stepped floor); the mofa's floor is the higher of its two wheels' `roadTop`.
- The mofa, the cars, ramps, pickups, signs and fans place their feet with `roadTop(x)`, not with tile collision. The mofa uses tile collision only for walls (there are none on the ride).
- **Uphill:** top speed and acceleration are scaled by `max(0.4, 1 − k·grade)` with k = 4. The climb is eased in and out (smoothstep), so its steepest grade is 1.5× the mean: about 1:14 for 7 rows over 150 columns, and the top speed falls about 30% there. The engine voice runs at full-throttle rate with a lower speed, so it sounds strained.
- The level checker walks `roadTop` and checks continuity and pickup reach relative to the local road height.

**Traffic waves.** New trigger characters `5` (two X7s ahead, 160 px apart), `6` (two Teslas from behind, 0.8 s apart), `7` (two Ferraris from ahead, 0.6 s apart) and `8` (an X7 ahead and a Tesla behind). `Cars.addTrigger` gets a list of `{ kind, delay, offset }` per character, and spawns go through the existing `Cars.spawn`. An X7 placed ahead by a trigger spawns just off the right edge, driving.

**The president's limo.** A new car type `limo`, map character `9`.
- White stretch limousine, 9 m ≈ 220 × 40 px, chrome, a sunroof with the president (top hat, cigar).
- 30 hits, 3000 points.
- Parks 60 px before the gate (it doesn't drive).
- Throws champagne corks: a `cork` enemy shot in an arc, shootable, 1 damage, every 1–1.5 s while Buck is within a screen.
- A boss-style bar labelled THE PRESIDENT'S LIMO, shown while it is on screen.
- The exit `E` stays inactive (the gate closed, its sign red) until the limo is dead. Bigger explosion and wreck; the president runs off in tails.

**WD-40.** New pickup character `{`: a blue-and-yellow spray can sprite (10 × 14), +2 health, "WD-40 +2", a spray puff (white-blue particles) and the `health` sound. `build.py` fails on `h` or `s` in a ride map, like `w`.

**Tests and tools.** New tests for each piece:
- the map's length and checkpoints
- 4 stretches in order, and the cross-fade
- the climb's smoothness, the uphill slowdown, and everything following `roadTop`
- each wave kind
- the limo: blocking, corks, the bar, the gate opening, points
- WD-40: +2, the text, ride-only

The benchmark scenes get one scene per stretch, all bright and colourful on both film paths. `perf_phone.py`'s ride run should still be under 5 ms.

### 16. Play-test revision 5: lower difficulty, machine-gun sound
Play-test feedback: the ride is too hard, and the gun sounds like the blaster.

**Difficulty** (all in `CONFIG`):

| | before | now |
|---|---|---|
| car contact | 2 health, knockback 160 | 1 health, knockback 110 |
| X7 / Tesla / Ferrari hits | 12 / 8 / 6 | 8 / 5 / 4 |
| limo hits | 30 | 20 |
| X7 throws | every 1.5–2.5 s | every 2.5–3.5 s |
| champagne corks | every 1–1.5 s | every 1.8–2.5 s |
| WD-40 cans on the map | 7 | 9 (two more before the limo) |

The points per car stay. Contact damage on foot (lawyers, crayfish, punks) is unchanged; `contact` is per enemy type.

**Machine-gun sound.** A new sound `mg`, played by `Mofa.fire` (forward and backward) instead of the blaster's `shot`: a band-passed noise burst (about 40 ms, sharp attack) for the crack, a sine thump falling from 160 to 50 Hz underneath, and a short high click for the bolt, with the pitch varied by ±8% per shot. At 10 shots per second it rattles. The promo agent's audio log records it like the other sounds.

### 17. Play-test revision 6: harder again, twin gun, checkpoints, posh ladies
Play-test feedback: the ride got too easy; a gun firing both ways; check the save points; arrogant posh ladies in the stretch limo.

**Difficulty:** the `CONFIG` numbers of before §16 come back: car contact 2 health with knockback 160; X7 / Tesla / Ferrari 12 / 8 / 6 hits; limo 30; X7 throws every 1.5–2.5 s; corks every 1–1.5 s. The two extra WD-40 cans of §16 stay (9 cans), since the twin gun no longer covers the rear by itself.

**Twin machine gun.** The rear turret of §13/§14 (`rearThreat`, `rearTarget`, `gunBack`, the swivel) is replaced:
- A second gun sprite sits on the luggage rack, barrel pointing back, drawn behind Buck. The front gun stays on the handlebars.
- `Mofa.fire` fires a volley: one shot forward (angled up with Up, as now) and one level shot backward from the rear barrel, both 1 damage, at `mofaRate` (10 volleys per second). One `mg` sound per volley.
- No automatic fire: the turret's auto-turn and its tests go; the "Automatic rear fire" requirement becomes "Twin machine gun".
- Muzzle flashes at both barrels. The HUD label stays "MOFA MG".

**Checkpoints.** The ride already places 3 checkpoints (at 160, 320 and 480; the last one on the climb). This revision verifies them end to end and closes two gaps:
- The respawn point is the flag's foot on the smooth road (`roadTop`), not the stepped floor, so the mofa never respawns inside or above the slope; `Mofa.mount` snaps the wheels to the road.
- On respawn, cars on screen are removed (no wreck, no points) and pending wave spawns are dropped, so Buck doesn't respawn into a car. Triggers already passed stay used; the parked limo keeps its damage.
- Tests ride the real map in god mode to each flag, then switch god mode off and lose a life: the flag is up, the mofa is at the flag on the road surface, standing, with full health; the camera is on the road; no car touches it for its invulnerability time. Plus game over on the ride.

**Posh ladies in the limo.** Two ladies sit at the limo's side windows (base panes at x 28 and 98), the chauffeur stays at the front:
- Art in `drawCar("limo")`: big hats (one pink, one white with a black band), sunglasses, pearls, a champagne glass in one hand.
- Speech: the limo gets several speakers: the president (sunroof) and the two ladies (windows), each with a bubble anchor. `Talk` learns an anchor offset per bubble (`e.bubble.dx`) so the bubble sits above the speaker. While the limo is on screen, a speaker is picked every 2–3 s (one bubble at a time, as for all enemies): the president with `PRESIDENT_LINES`, the ladies with new `LIMO_LADY_LINES` (≥ 12 lines, ≤ 20 characters each, arrogant, not explicit), e.g. "IS THAT A MOFA? EW.", "DARLING, RUN HIM OVER", "HOW VERY RURAL!", "NO PEASANTS, PLEASE", "GSTAAD WAS NICER", "MY HUSBAND OWNS YOU".
- When the limo dies, the bubble goes, and two more runners (the ladies, in dresses) flee with the president.

### 18. Play-test revision 7: talkative drivers, a bigger limo, ladies in proportion
Play-test feedback: the drivers' arrogant bubbles are hardly seen; the limo and its ladies are too small next to Buck on the mofa.

**Driver bubbles.** Today a driver may speak every 4 s with a 60% chance, and `Talk.say` refuses whenever any enemy has a bubble, so on a busy road most lines never show. On ride levels:
- A car speaks within 0.5 s of first showing on screen (`talkCd` starts at 0–0.5 s when it becomes visible), then every 2.5–3.5 s (`CONFIG.driverTalkEvery`), with no chance roll.
- Up to two car bubbles at once (`CONFIG.rideBubbles = 2`): `Talk.say` on a ride level allows a new bubble when fewer than two cars talk and its rectangle (computed like `Talk.draw`, after clamping to the screen) overlaps neither a car bubble nor a fan bubble (`Fans.list`). When refused, the driver retries after 0.3 s.
- Other levels keep the one-bubble rule (lawyers, the bar).
- The limo counts as one speaker (one bubble for the president and the ladies together), every 2–3 s as before.

**The limo at 300 × 56.** `CAR_INFO.limo` becomes 300 × 56 at about 25 px per metre: a 12 m super-stretch SUV limo, 2.2 m tall, taller than the X7 (45 px).
- `CAR_BASE.limo` stays the 160-wide layout grid, but with a taller cabin. The window band grows to about 14 px, so the ladies fit with 9-px heads (the hat above, the pearls below): face 6 rows, hair, hat crown and brim, sunglasses, lips, pearls, and the glass in one hand. The president in the sunroof gets the same head size.
- The ladies' faces use the drivers' skin colour, so the existing head-size measurement (skin rows plus the hair rows) applies to them too.
- `LIMO_SUNROOF_X`, `LIMO_SPEAKERS` and the ladies' runner positions scale with the new width. The cork launch point follows the sunroof.
- The parking rule stays (60 px before the gate). The gate area on the map has room: the limo then starts at column 608, after the rocker chicks (588–600).
- The limo screenshot mode and the ride-art test check the size.

## Risks / Trade-offs

- **[The ride is too hard or too easy on the first try]** All numbers (speeds, HP, throw rates, spawn spacing) live in `CONFIG`, and the reel is play-tested by hand on desktop and phone (task 7.2). The checker only proves it's possible, not fair.
- **[Brand names]** Cars are recognisable by shape and colour, with no logos or badges. Brand names appear only in code identifiers, the README and the speech lines. The drivers' arrogance is the joke, not the brands.
- **[Index shift misses a spot]** → the shifted tests (for example the benchmark scenes, which check each level's look), the promo dry run reaching victory from reel 2, and a grep for `loadLevel(` and `#level=` in the review.
- **[The single engine-sound list gets crowded]** Still at most 2 car engines plus the mofa voice; Web Audio cost is unchanged in kind.
- **[Bigger cars change the feel]** Longer cars stay on screen longer and can be hopped less easily. Only the Ferrari is meant to be hopped, and the existing car tests (contact, tailgate, brake-check, Ferrari hop) are re-run after the resize.
- **[Ride complexity: road profile, stretches, waves, limo]** The slope is the deepest change: the mofa, cars and props switch from tile floors to `roadTop` on ride levels only, so the other levels' collision is untouched. The waves and the limo reuse the car framework.
- **[Phone performance]** The ride adds parallax and up to 4 cars. `tools/perf_phone.py` gets a ride scenario, and the 5 ms budget must still hold.

## Migration Plan

Release as 1.1.0, a new level. Old `#level=N` bookmarks open one reel earlier, as noted in the README. Roll back by reverting the release. No saved data exists.

## Open Questions

- **The backdrop photo:** the hills crop of `tc_wollerau_02.jpg` for now. A real photo of the lake road can replace it later, without changing the specs.
