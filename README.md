# Buck Nukem – The Wollerau Crayfish Crisis

A retro early-90s style run-and-gun platformer set at TC Wollerau and the Krebsbach creek. It opens with Buck riding his Sachs mofa, a machine gun on the handlebars, up the lake road to the club.
Native resolution 320×240, delivered as **one self-contained HTML file**: `dist/buck_nukem.html`
(no network access and no other files needed, about 400 KB).

Version **1.0.9** (see `VERSION`; releases are git tags `vX.Y.Z`). The title screen shows the build's version in small print, bottom right: the release tag (`V1.0.2`), or for builds in between the tag plus commits since and the commit (`V1.0.2-3-GAB12CD3`, `-DIRTY` with uncommitted changes). Changes under `dist/` don't count.

Open `dist/buck_nukem.html` in Chrome or Edge (tested). Firefox should also work but has not been tested. On a phone, hold it in landscape and use Chrome on Android or Safari on iOS: the same file switches to touch controls (see [Playing on a phone](#playing-on-a-phone)). Browsers allow no sound before the first key, click or tap, so the title first says "PRESS ANY KEY FOR SOUND": that input only starts the music (a 70s hard-rock title theme) and the title stays; then Enter starts the game. Where the browser allows autoplay (for example after allowing sound for the page in the site settings), the music plays as soon as the page opens and Enter starts at once. Each reel has its own music: a biker rock song on the mofa ride, 70s funk on the clay courts, Ride of the Valkyries at the creek, the Clarinet Polka with an oom-pah band in the clubhouse, and the Valkyries again, faster, in the boss arena.

**Direct level links:** add `#level=N` (N = 1–5, the reel number: 1 mofa ride, 2 clay courts, 3 creek, 4 clubhouse, 5 boss arena) to start every new game at that level, e.g. `buck_nukem.html#level=5` or online <https://schiffma.github.io/Buck-Nukem/dist/buck_nukem.html#level=5>. Since 1.0.8 the mofa ride is reel 1, so older links point one reel earlier (the old `#level=4` boss link now opens the clubhouse). The title shows "STARTS AT REEL N" ("STARTS AT FINAL REEL"); Enter starts a fresh game there (score 0, 3 lives). It combines with other flags (`#debug&level=3`); invalid values start at reel 1.

## Controls

| Key | Action |
|---|---|
| Arrows / WASD | Move |
| Up / Down (W / S) | Climb ladders. Down on the ground kneels: Buck stops (Left/Right only turn him), shoots at knee height (hits crayfish on the ground) and ducks under head- and chest-high projectiles. On a ladder top Down climbs down. |
| Down + Space | Drop through a platform (ledges, clubhouse tables, bar counter) |
| Space | Jump (hold for higher jumps) |
| X / Ctrl / Alt | Fire (also on ladders: Left/Right turn Buck there) |
| P / Enter | Pause / resume |
| M | Mute music and sound |
| G | Film filter on/off (scratches, grain, colour grade) |
| F | Fullscreen on/off. In Chrome and Edge the Windows key is locked while fullscreen, so it can't open the Start menu and interrupt firing (a web page cannot block it in a normal window). Esc also leaves fullscreen. |
| F3 | Debug overlay (updates and frames per second) |

## Playing on a phone

The same `dist/buck_nukem.html` (also online on GitHub Pages) plays on a smartphone held in **landscape**, in current Chrome on Android and Safari on iOS. On a touch device the game switches to *touch mode* by itself. On a desktop, add `#touch` to the URL (`buck_nukem.html#touch`, or with other flags, e.g. `#level=5&touch`) to try it with the mouse. A touchscreen laptop switches on its first touch. A connected keyboard keeps working in touch mode.

- The 4:3 picture fills the screen height. The controls sit in the black bars beside it, never over the action, and clear of the notch.
- **Left bar:** the D-pad. Left/Right walk; Up/Down climb ladders; Down kneels; the diagonals combine (Down-Right kneels facing right). Slide your thumb between directions without lifting.
- **Right bar:** **FIRE** (hold to keep firing) and **JUMP** (hold for higher jumps). Slide between them without lifting. Several fingers work at once: run, jump and fire together. Pad Down + JUMP drops through a platform.
- **Top of the bars:** Pause (II), Mute (speaker), Film filter (film frame) and Fullscreen (corners). They act when you lift your finger on them. Fullscreen also locks the screen to landscape where the browser allows it. iPhone Safari has no fullscreen for web pages, so the button isn't shown there.
- **Menus:** tap the picture to start ("TAP TO START"), skip the reel cards, continue the tally and the end cards, and resume from pause. Until the sound is on, the title says "TAP FOR SOUND": the first tap only starts the music, the next one starts the game. During play, taps on the picture do nothing.
- **Portrait:** the game pauses and asks you to turn the phone. Switching apps or locking the screen also pauses the game.
- The page doesn't scroll, zoom, select text or open long-press menus.

## Game rules

- **Reel 1, the mofa ride "THE ROAD TO WOLLERAU":** Buck rides a small red Sachs mofa (drawn after `assets/img/sachs-mofa.jpg`; Buck keeps his size, a big man on a small moped) up the road along Lake Zurich to the TC Wollerau gate, passing the WOLLERAU place sign and TC WOLLERAU direction signs: about 75 s at full throttle, twice as long with the fights.
  - **Four stretches,** each with its own photo backdrop (cross-faded from one to the next) and roadside props: the lake promenade (railings, benches), Wollerau village (flower boxes, Swiss flags), the vineyard climb (vine rows, dry-stone walls) and the club on the hill (hedges, club flags). A checkpoint at each border.
  - **The climb:** in the last third the road rises smoothly up the hill to the club, 7 tiles in all. Uphill the mofa is up to 30% slower and its engine strains at full throttle.
  - **Controls on the mofa:** Right accelerates to the top speed (about 1.5× Buck's running speed); Left brakes and then rolls back slowly; with neither held the mofa coasts. Jump hops (high enough for a Ferrari). Fire shoots the **twin heavy machine guns**, oversized WW2-style guns with a deep .50 cal "dug-dug-dug" (8 volleys per second): one gun on the handlebars fires forward, the other on the luggage rack fires backward at the same time, at cars ahead and behind. Up angles the front gun 30° upward, for example at things thrown over the BMW X7's roof; the rear gun fires level. The mofa trails blue-grey two-stroke smoke, a thick cloud when the throttle is open. The HUD shows "MOFA MG". The touch controls work the same way.
  - **The road** has no obstacles of its own, only wooden ramps (a long jump at speed, up to trophies and an extra life): the danger is the traffic. **WD-40 spray cans** (+2 health) are the ride's health pickups.
  - **Buck's lines** (from the quote pack `src/quotes/ride.txt`, see [Quote packs](#quote-packs)): when he finishes off a car, Buck comments dryly in Swiss German ("SO, FERTIG.", "UFGRUMT!", "GÄLL, DAS HET GSESSE") or with a cocky Thurgau car line ("MFK? NÖD BESTANDE."), at most every 3 seconds.
  - **Posh drivers** in their cars, drawn after the photos in `assets/img/`, call out arrogant one-liners ("DO YOU KNOW MY DAD?", "NICE BIKE, GRANDPA!") as soon as their car shows up and every few seconds after; up to two bubbles at a time, never on top of each other or the fans' bubbles. Cars hurt Buck on contact (2 health and a hard knockback), explode when destroyed and burn out as wrecks:
    - the huge dark-grey **BMW X7** blocks the road ahead; its driver tosses latte cups and golf balls over the roof and honks at a mofa close behind (10 hits, 800 points)
    - the red **Tesla Model 3** creeps up almost silently from behind with its driver on the phone, and rams (6 hits, 700)
    - the red **Ferrari** comes from ahead at twice the mofa's speed, announced by its roar (hop over it or shoot it: 5 hits, 1000)
    - **traffic waves:** an X7 convoy, two Teslas from behind, a Ferrari pair, an X7 ahead with a Tesla behind
    - **the president's limo** (mini-boss): the club president's white super-stretch limousine, bigger than any car on the road, is parked before the gate and blocks the road. The president pops champagne corks from the sunroof every 1–1.5 s (1 health; they can be shot down). Two posh ladies in big hats and pearls sit at its side windows and call out lines with the president ("IS THAT A MOFA? EW.", "RUN HIM OVER, DEAR"); when the limo blows up, play pauses for a short scene (Fire or Jump skips it): the two ladies, as big as the fans, climb out of the wreck one after the other complaining at Buck ("MY DRESS! IT'S DIOR!"), Buck answers with a dry Swiss German line ("NÖD MIS PROBLEM.", "ÄXGÜSI, MADAME.", from the `[finale]` section of the ride's quote pack) and lights a cigarette, which he keeps puffing on the way through the gate. The ladies stay by the wreck, wagging a finger at him, and keep complaining in turns every 2–3 s while they are on screen ("YOU RUINED MY DAY!", "I'LL SUE YOU, MOFA!"). A bar shows THE PRESIDENT'S LIMO; the gate stays closed (red sign, barrier) until the limo is destroyed (24 hits, 3000 points).
  - **Fans on the road:** instead of tennis players, a demo of environmental activists at the WOLLERAU sign (parkas, ponchos and bell-bottoms, protest signs with a crossed-out car, a leaf or a globe: "BIKES NOT SUVS!", "ONE SUV LESS! ♥"), and rocker chicks at the club gate (studded leather, band tees, big hair, devil horns: "BORN TO RIDE! ♥", "BURN, BABY, BURN!").
  - **Checkpoints:** a Swiss flag at each stretch border (3). After a lost life Buck restarts at the last flag on the mofa, standing on the road; the cars on screen are gone, the limo keeps its damage.
  - The ride ends at the club gate; reel 2 starts with Buck on foot and the standard blaster.
- Then 3 levels plus the boss arena: TC Wollerau clay courts, Krebsbach creek and sports fields, the clubhouse and indoor hall (with the Einsiedler bar: a chrome tap tower with red-and-white Einsiedler handles, an EINSIEDLER sign, beers and beer mats on the counter, three regulars on stools who lift their glasses and clink "PROST!", and a blonde waitress pulling beers behind the counter), then the giant mutant crayfish.
- 8 health points and 3 lives. The lives counter includes the current life, so the game ends when the counter would reach 0. You respawn at the last checkpoint (Swiss flag) with full health, but the Mega Blaster power-up is lost.
- Pickups: tennis balls (50 points), trophies (1000), Rivella (+2 HP), Cervelat (+3 HP), extra life (hero head), key cards (red/blue/green open doors of the same colour), Mega Blaster (faster shots, double damage).
- Enemies: lawyers (sharp women in skirt suits with short hair; they throw Swiss law books — OR, ZGB, StGB, SchKG — that burst into pages with an article like "ART. 41 OR", and call out legal one-liners such as "OBJECTION!" or "SEE YOU IN BERN!"), mutant crayfish (realistic glossy red-brown crayfish; they leap and hide in the creek), gardener-punks with a petrol lawn mower (mohawk, blunt; its two-stroke engine putt-putts louder as you get closer and puffs exhaust smoke, revs in a black cloud and charges at full throttle, throwing grass and stones; it sputters and dies with the punk).
- Buck's kill lines on foot (from `src/quotes/thurgau.txt`, see [Quote packs](#quote-packs)): after a kill, at most every 3 seconds, Buck boasts in Thurgau dialect like a cocky agglo macho. Each enemy type has its own set: "PLÄDOYER ABGLEHNT." for a lawyer, "CHREBSSUPPE, HOI!" for a crayfish, "SO MÄHT MÄ RASE!" for a punk, mixed with general boasts like "KÖNIG VO MOSTINDIE.".
- Boss: a giant red crayfish. In its arena Buck fights with a giant **disc cutter** that fires spinning saw blades (2.5 per second, 3 damage each; they also cut crayfish on the ground) and keeps it after respawning there. Blades bounce off the shell and closed claws in a shower of sparks: hit the face when the claws are raised. Below half health it attacks faster. It summons small crayfish only 3 times per fight; after that it alternates claw slams and bubble sprays. The arena is two screens wide, and the camera keeps Buck near the left edge so the view shows the arena ahead and the boss. Platforms on three heights and two ladders take Buck above the floor shockwave, and the lowest ledge in front of the boss lines up with its face. Wooden cover crates stop the shockwave and bubbles, and Buck can kneel behind them or stand on them. They also block his own shots. Sturdy crates (metal bands) last forever; plain ones crack and burst after 6 blaster hits, 2 saw blades or 2 shockwaves. Summoned crayfish always appear on screen. On the highest platform waits the **Mega Cutter**: every shot fires two glowing blades (one level, one angled up) of 5 damage each. It is lost with a life and comes back 20 s after it was taken. When the arena starts, the camera pans over to show the boss and back; Jump or Fire skips it.

## Look

The game is styled like a 1970s grindhouse movie on a lurid, saturated colour print:
- **Film filter:** a bright colour-print grade (boosted saturation, warm highlights, teal-tinted shadows) with grain, scratches, dust, a light vignette, gate weave and flicker. G toggles it. The grade runs on the GPU (WebGL) where the browser offers it, which keeps phones smooth. Otherwise, or when the GPU context is lost, an identical CPU version takes over. Add `#film=cpu` to the URL to force the CPU version, for comparisons. The game draws at most one frame per 60 Hz game update, so 120/144 Hz displays don't redraw the same frame twice.
- **Sprites:** outlined and shaded.
- **Tiles:** bright clay, grass and brick colours, worn and cracked.
- **Backgrounds:** the photos, graded at build time to vivid, warm 70s colours and dithered to a 32-colour palette.
- **Gore:** cartoon pixel blood. Enemies burst into blood and gibs, the punks' mowers explode into oil and sparks, and leave stains that fade after 20 seconds.
- **Damage:** a red edge flash when Buck is hit.
- **Fans:** a crowd of TC Wollerau tennis players in 70s whites cheers Buck on: 8–10 per level, 4–5 in the boss arena, 14 different looks. When he scores nearby, they cheer and call out in speech bubbles. When he walks past, a fan blows him a kiss, a heart floats up and she calls out something cheeky ("HEY HANDSOME!", "NICE RACKET, BUCK!"), with a wolf whistle. The lines are flirty grindhouse innuendo, never explicit. At most 3 bubbles show at a time. Fans are pure decoration: nothing collides with them.
- **Screens:** a red-tinted exploitation-poster title, film-reel countdown intros ("REEL n", "MISSING REEL" before the boss) and "THE END" cards.

## Build

Requires Python 3 with Pillow and NumPy.

```
python tools/build.py            # writes dist/buck_nukem.html (fails above 2 MB, if an image is missing or if the colour grade check fails)
python tools/build.py --debug    # also writes dist/debug_*.png previews of the processed images
```

The build crops, resizes and colour-reduces the photos in `assets/img/` (`assets/img/` itself is never modified) and embeds them as base64 PNGs. It also embeds the level maps from `src/levels/*.txt` and inlines `src/*.js` into `src/index.template.html`. The output is deterministic: two builds from the same sources are byte-identical. The build also embeds the version text from git (`git describe` style, ignoring `dist/`; falls back to `VERSION` without git) and prints it.

Release steps:
1. Bump `VERSION` and commit.
2. Tag: `git tag -a vX.Y.Z -m "Buck Nukem X.Y.Z"`.
3. Run `python tools/build.py`. It now prints `vX.Y.Z`.
4. Commit `dist/buck_nukem.html`. The version stays `vX.Y.Z`, because `dist/` doesn't count.
5. Push with `git push origin main vX.Y.Z main:gh-pages`. The `gh-pages` branch is the playable GitHub Pages copy.

## Tests and checks

```
python tools/run_tests.py                 # in-game scenario tests, headless Chrome
python tools/run_tests.py --browser edge  # same in headless Edge
python tools/run_tests.py --size 844,390 --hash touch   # the whole suite in touch mode at phone size (landscape)
python tools/run_tests.py --size 390,844 --hash touch   # ... in a portrait window
python tools/check_levels.py              # every level completable, all pickups reachable (the ride: road, hazards, hop and ramp reach)
python tools/screenshot.py out.png title play,1,40,13,60 play,4,24,9,150 sprites
python tools/screenshot.py --touch out.png title play,1,40,13,60   # touch mode, whole 844x390 window with the control bars
python tools/screenshot.py --touch 500x900 out.png title          # portrait card (headless Chrome windows are at least 500 px wide)
```

`--hash` adds URL fragment parameters to `#test` (`#test&touch`). `--size` sets the browser window (headless Chrome keeps it at least 500 px wide and a little shorter than asked). The tests run the film checks on both the GPU and the CPU grade. Headless Chrome only offers software WebGL (SwiftShader), so `run_tests.py` and `screenshot.py` start it with `--enable-unsafe-swiftshader`.

Phone performance (needs Playwright, see the promo tools below):

```
python tools/perf_phone.py            # CPU ms per frame and stage in phone emulation (987x444 @2.75, CPU 1x and 4x): clay courts GPU vs CPU film grade, and the mofa ride
python tools/perf_phone.py --headed   # same with a visible window, if headless only gets software WebGL
```

It exits with 1 if the GPU path misses its budgets: under 5 ms per frame at 4× CPU slowdown, and at most 60% of the CPU path's time.

Promo video (an AI plays the game; needs `pip install -r tools/promo/requirements.txt` once: Playwright, networkx, py_trees, imageio-ffmpeg):

```
python tools/promo/record_promo.py --dry all   # play without video, print the run report and the play-quality limits
python tools/promo/record_promo.py             # record recordings/buck_nukem_promo_<date>.mp4 (max 16 MB; reels 2-5)
python tools/promo/record_promo.py --ride      # the mofa ride alone: recordings/buck_nukem_ride_promo_<date>.mp4 (title to tally)
python tools/promo/record_promo.py --dry ride  # the ride without video: run report and limits
python tools/promo/quirks.py                   # play-quality metrics only (reversals, unneeded jumps, shots without target)
cd tools/promo && python -m unittest discover -s tests -t .   # agent unit tests
```

`run_tests.py` opens `dist/buck_nukem.html#test`, which runs `src/test.js` against the real game code: movement, combat, enemies, boss, flow, audio scheduling and rendering, including brightness and colour targets on six fixed scenes. You can also open `buck_nukem.html#test` in a normal browser to see the report.

## Source layout

```
src/index.template.html  page shell (canvas, styles)
src/config.js            constants and the CONFIG tuning table
src/assets.js            decodes the embedded images
src/render.js            320x240 back buffer, integer scaling (fractional between the control bars in touch mode), WebGL probe
src/film.js              film filter: colour-print grade on the GPU (WebGL shader) or CPU, grain, scratches, dust, jitter
src/input.js             keyboard, fullscreen; actions held per source (keys, fingers, simulate)
src/touch.js             touch mode: side-bar layout, on-screen controls, taps, portrait card
src/ride.js              the mofa ride: riding physics, machine gun, road hazards, signs and gate, mofa art
src/cars.js              posh drivers: BMW X7, Tesla, Ferrari after the photos (behaviour, triggers, wrecks, one-liners, art)
src/font.js              5x7 bitmap font
src/sprites.js           procedural pixel art (hero body, enemies, pickups)
src/fx.js                particles, explosions, screen shake
src/audio.js             Web Audio synth: 70s rock title theme, biker rock ride theme, funk (courts), Clarinet Polka (clubhouse), Ride of the Valkyries arrangement, sound effects, engines
src/level.js             tile maps, themed tiles, camera, collision
src/player.js            the hero
src/enemies.js           lawyers, crayfish, gardener-punks, projectiles
src/props.js             clubhouse interior props (bar, restaurant, club decoration)
src/bar.js               clubhouse bar scene: regulars and the waitress (decoration)
src/boss.js              giant mutant crayfish
src/hud.js, screens.js   HUD and title/intro/complete/pause/game-over/victory screens
src/main.js              game state machine and the fixed 60 Hz loop
src/test.js              automated tests (#test) and screenshot mode (#shot=...)
src/levels/*.txt         level maps
tools/                   build, tests, level checker, screenshots, MIDI melody import (midi_melody.py)
tools/promo/             promo-video recorder: Playwright bridge + Python agent (route planning, tactics)
```

## Level format

Each `src/levels/*.txt` file starts with `key: value` header lines (`name`, `theme` = court|creek|hall|road, `bg`, `boss: 1`, `ride: 1` for the mofa ride; `quotes` = Buck's quote pack (see [Quote packs](#quote-packs)); `music` = biker|funk|clarinetpolka|valkyries, the level's track, default valkyries (the build rejects other names); a ride map may contain no weapon pickups `w`; on a ride, `stretches: 0 bg_lake, 160 bg_village, ...` changes the backdrop and the roadside props from that column on, cross-faded over one screen, and `climb: x0-x1 r0-r1` makes the road rise smoothly from row r0 to row r1 between columns x0 and x1, while the map's floor steps up underneath), followed by map segments separated by `---` lines. Segments are joined side by side and must all have the same number of rows. Lines starting with `;` are comments.

| Char | Meaning | Char | Meaning |
|---|---|---|---|
| `.` | empty | `P` | player start |
| `#` | solid (theme surface) | `E` | exit |
| `B` | solid (stone/metal) | `C` | checkpoint |
| `=` | one-way platform | `L` `K` `M` | lawyer, crayfish, gardener-punk |
| `H` | ladder | `X` | boss |
| `~` | creek water (toxic red in the Krebsbach level; hurts) | `o` `t` | tennis ball, trophy |
| `R` `U` `G` | locked door red/blue/green | `h` `s` | Rivella, Cervelat |
| `r` `u` `g` | key card red/blue/green | `+` `w` | extra life, Mega Blaster (Mega Cutter in the boss arena) |
| `n` `f` `l` `b` `v` | decoration: net, fence, lamp, bush, window | `a` `A` `T` | bar counter, counter with taps, table (one-way platforms) |
| `c` `i` `q` | chair, bar stool, bottle shelf | `N` `$` | neon "BIER" sign (2×1), cash register |
| `Z` `m` `k` | trophy cabinet (2×2), menu board (6×2), kitchen pass (3×2) | `p` `x` `j` | picture, tennis rackets, hanging lamp |
| `y` `Y` | potted plant (1×2), club plaque (4×2) | | |
| `Q` `@` `%` | umpire chair (2×3), ball machine (2×1), ball basket | `V` `z` `[` | racket bag (2×1), player bench (2×1), scoreboard (5×2) |
| `J` `&` | court drag brush (2×1), water cooler (1×2) | `*` `^` | toxic waste drum, skull "TOXIC" warning sign (2×2) |
| `O` | bar regular on a stool (decoration, clubhouse bar) | `W` | blonde waitress (put in the cell above the counter; decoration) |
| `I` | "EINSIEDLER" back-bar sign (4×1) | | |
| `F` | cheering tennis fan (background, stands on floor or a platform; 8–10 per level, 4–5 in the arena) | `D` `d` | cover crate: sturdy (indestructible), breakable (6 strength) |
| `/` | ramp (ride; 2 tiles, put on the left cell, in the cell above the road; launches a long jump at speed) | | |
| `1` | BMW X7 on the road (ride) | `3` `4` | triggers (ride): when Buck passes the column, a Tesla comes from behind, a Ferrari from ahead |
| `5` `6` | traffic waves (ride): an X7 convoy ahead (2, 160 px apart); two Teslas from behind (0.8 s apart) | `7` `8` | traffic waves (ride): a Ferrari pair from ahead (0.6 s apart); an X7 ahead and a Tesla behind |
| `9` | the president's limo (ride mini-boss; parked 60 px before the gate `}`, which stays closed until it is destroyed) | | |
| `e` `]` | ride fans: environmental activist, rocker chick (like `F`, on the floor; 4–5 of each, standing together) | | |
| `S` `>` | road signs (ride): yellow "WOLLERAU" place sign; brown "TC WOLLERAU" direction sign showing its distance to the exit | `}` | club gate (ride), 4×4 tiles from its top-left cell, around the exit `E` |
| `{` | WD-40 can (ride only; +2 health; a ride map may not contain `h` or `s`) | | |
| `(` | roadside row (ride; 2 tiles, in the cell above the road): lake railing, village flower boxes, vine row on the climb, hedge at the club | `)` | roadside feature (ride): bench, Swiss flag, dry-stone wall, club flag (by stretch) |

Multi-tile props are placed by their top-left cell; the rest of their footprint must be `.` (the build warns otherwise). The header line `interior: x0-x1` draws columns x0–x1 as the clubhouse interior (wallpaper and wood panelling instead of the photo; windows still show the photo).

A crayfish (`K`) placed next to water hides in the creek.

## Quote packs

Buck's one-liners come from plain text files in `src/quotes/`, one file per pack (for example `src/quotes/ride.txt`). A level uses a pack by naming it in its header: `quotes: ride`. A level without a `quotes:` line keeps Buck silent.

```
; comment lines start with a semicolon
[start]            ; once, about 0.6 s after the level's intro card (not after a respawn)
HOPP, IS GLIS.
[kill]             ; after Buck finishes off any enemy, at most every 3 seconds
SO, FERTIG.
UFGRUMT!
[kill:suv]         ; instead of [kill] for one enemy type
DE ISCH GSI.
[finale]           ; Buck's reply in a level's closing scene (the ride's limo finale)
NÖD MIS PROBLEM.
```

- One quote per line, at most 20 characters; lower case is shown in capitals. Allowed characters are those of the game font: A–Z, 0–9, `. , ! ? : - ' / ( ) + = > < % " *`, `♥` and `Ä Ö Ü`.
- Enemy types for `[kill:<type>]`: `lawyer`, `cray`, `punk`, `suv` (the BMW X7), `tesla`, `ferrari`, `limo` (the limo gets no kill quote: Buck's reply in its finale comes from `[finale]`).
- Every section is optional. Quotes are picked at random without repeats until a section is used up, and shown in a speech bubble above Buck (on foot or on the mofa) that never covers another bubble; if there is no room, Buck stays quiet.
- `python tools/build.py` checks the packs and stops with `file:line: reason` for a quote outside a section, an unknown section or enemy type, a quote that is too long, a character the font cannot draw, a duplicate, or a `quotes:` header naming a missing pack.
- The packs today:
  - `ride.txt` is used by the mofa ride. Its `[kill]` lines are dry Swiss German plus cocky Thurgau car lines ("MFK? NÖD BESTANDE.", "HOI ABSCHLEPPDIENST!"), and it has a `[finale]` section.
  - `thurgau.txt` is shared by the courts, creek, clubhouse and boss arena. It holds Thurgau-dialect lines in the voice of an agglo macho in love with his own style, with `[kill]` plus one set each for `lawyer`, `cray` and `punk`. A `[kill:<type>]` section replaces `[kill]`, so each set also repeats a few general boasts.
  - To give a level its own pack, add `src/quotes/<name>.txt` and put `quotes: <name>` in the level's header.

## Credits

- Hero and backgrounds: photos in `assets/img/` (hero portrait, TC Wollerau and Krebsbach).
- Crayfish: original pixel art, drawn side-on after a reference photo of a real crayfish supplied for this project; the photo itself is not part of the game.
- Music: original 70s-style hard-rock title theme, an original 70s-style biker rock song for the mofa ride (boogie shuffle), an original 70s funk groove for the clay courts (slap bass, clavinet, brass), all written for this game, and the Clarinet Polka ("Dziadunio Polka"; traditional Polish, also credited to Karol Namysłowski, 1856–1925; public domain; melody after the MIDI transcription on flutetunes.com, imported with `tools/midi_melody.py`) in the game's own arrangement (clarinet lead, tuba, accordion, light drums, glass clinks) for the clubhouse, all synthesized live, and a chiptune arrangement of Richard Wagner's "Ride of the Valkyries" (public domain composition) for the creek and the boss arena, also synthesized live. No recordings or samples are used.
- Everything else (code, pixel art, sound effects) is original to this project.
