# Buck Nukem – The Wollerau Crayfish Crisis

A retro early-90s style run-and-gun platformer set at TC Wollerau and the Krebsbach creek.
Native resolution 320×240, delivered as **one self-contained HTML file**: `dist/buck_nukem.html`
(no network access and no other files needed, about 400 KB).

Version **1.0.6** (see `VERSION`; releases are git tags `vX.Y.Z`). The title screen shows the build's version in small print, bottom right: the release tag (`V1.0.2`), or for builds in between the tag plus commits since and the commit (`V1.0.2-3-GAB12CD3`, `-DIRTY` with uncommitted changes). Changes under `dist/` don't count.

Open `dist/buck_nukem.html` in Chrome or Edge (tested). Firefox should also work but has not been tested. On a phone, hold it in landscape and use Chrome on Android or Safari on iOS: the same file switches to touch controls (see [Playing on a phone](#playing-on-a-phone)). Press any key to start the music (a 70s hard-rock title theme), then Enter to play; the levels switch to Ride of the Valkyries.

**Direct level links:** add `#level=N` (N = 1–4, the reel number; 4 is the boss arena) to start every new game at that level, e.g. `buck_nukem.html#level=4` or online <https://schiffma.github.io/Buck-Nukem/dist/buck_nukem.html#level=4>. The title shows "STARTS AT REEL N" ("STARTS AT FINAL REEL"); Enter starts a fresh game there (score 0, 3 lives). It combines with other flags (`#debug&level=3`); invalid values start at level 1.

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

The same `dist/buck_nukem.html` (also online on GitHub Pages) plays on a smartphone held in **landscape**, in current Chrome on Android and Safari on iOS. On a touch device the game switches to *touch mode* by itself. On a desktop, add `#touch` to the URL (`buck_nukem.html#touch`, or with other flags, e.g. `#level=4&touch`) to try it with the mouse. A touchscreen laptop switches on its first touch. A connected keyboard keeps working in touch mode.

- The 4:3 picture fills the screen height. The controls sit in the black bars beside it, never over the action, and clear of the notch.
- **Left bar:** the D-pad. Left/Right walk; Up/Down climb ladders; Down kneels; the diagonals combine (Down-Right kneels facing right). Slide your thumb between directions without lifting.
- **Right bar:** **FIRE** (hold to keep firing) and **JUMP** (hold for higher jumps). Slide between them without lifting. Several fingers work at once: run, jump and fire together. Pad Down + JUMP drops through a platform.
- **Top of the bars:** Pause (II), Mute (speaker), Film filter (film frame) and Fullscreen (corners). They act when you lift your finger on them. Fullscreen also locks the screen to landscape where the browser allows it. iPhone Safari has no fullscreen for web pages, so the button isn't shown there.
- **Menus:** tap the picture to start ("TAP TO START"), skip the reel cards, continue the tally and the end cards, and resume from pause. The first tap also starts the music. During play, taps on the picture do nothing.
- **Portrait:** the game pauses and asks you to turn the phone. Switching apps or locking the screen also pauses the game.
- The page doesn't scroll, zoom, select text or open long-press menus.

## Game rules

- 3 levels plus the boss arena: TC Wollerau clay courts, Krebsbach creek and sports fields, the clubhouse and indoor hall (with the Einsiedler bar: a chrome tap tower with red-and-white Einsiedler handles, an EINSIEDLER sign, beers and beer mats on the counter, three regulars on stools who lift their glasses and clink "PROST!", and a blonde waitress pulling beers behind the counter), then the giant mutant crayfish.
- 8 health points and 3 lives. The lives counter includes the current life, so the game ends when the counter would reach 0. You respawn at the last checkpoint (Swiss flag) with full health, but the Mega Blaster power-up is lost.
- Pickups: tennis balls (50 points), trophies (1000), Rivella (+2 HP), Cervelat (+3 HP), extra life (hero head), key cards (red/blue/green open doors of the same colour), Mega Blaster (faster shots, double damage).
- Enemies: lawyers (sharp women in skirt suits with short hair; they throw Swiss law books — OR, ZGB, StGB, SchKG — that burst into pages with an article like "ART. 41 OR", and call out legal one-liners such as "OBJECTION!" or "SEE YOU IN BERN!"), mutant crayfish (realistic glossy red-brown crayfish; they leap and hide in the creek), gardener-punks with a petrol lawn mower (mohawk, blunt; its two-stroke engine putt-putts louder as you get closer and puffs exhaust smoke, revs in a black cloud and charges at full throttle, throwing grass and stones; it sputters and dies with the punk).
- Boss: a giant red crayfish. In its arena Buck fights with a giant **disc cutter** that fires spinning saw blades (2.5 per second, 3 damage each; they also cut crayfish on the ground) and keeps it after respawning there. Blades bounce off the shell and closed claws in a shower of sparks: hit the face when the claws are raised. Below half health it attacks faster. It summons small crayfish only 3 times per fight; after that it alternates claw slams and bubble sprays. The arena is two screens wide, and the camera keeps Buck near the left edge so the view shows the arena ahead and the boss. Platforms on three heights and two ladders take Buck above the floor shockwave, and the lowest ledge in front of the boss lines up with its face. Wooden cover crates stop the shockwave and bubbles, and Buck can kneel behind them or stand on them. They also block his own shots. Sturdy crates (metal bands) last forever; plain ones crack and burst after 6 blaster hits, 2 saw blades or 2 shockwaves. Summoned crayfish always appear on screen. On the highest platform waits the **Mega Cutter**: every shot fires two glowing blades (one level, one angled up) of 5 damage each. It is lost with a life and comes back 20 s after it was taken. When the arena starts, the camera pans over to show the boss and back; Jump or Fire skips it.

## Look

The game is styled like a 1970s grindhouse movie on a lurid, saturated colour print:
- **Film filter:** a bright colour-print grade (boosted saturation, warm highlights, teal-tinted shadows) with grain, scratches, dust, a light vignette, gate weave and flicker. G toggles it.
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
python tools/check_levels.py              # every level completable, all pickups reachable
python tools/screenshot.py out.png title play,0,40,13,60 play,3,24,9,150 sprites
python tools/screenshot.py --touch out.png title play,0,40,13,60   # touch mode, whole 844x390 window with the control bars
python tools/screenshot.py --touch 500x900 out.png title          # portrait card (headless Chrome windows are at least 500 px wide)
```

`--hash` adds URL fragment parameters to `#test` (`#test&touch`). `--size` sets the browser window (headless Chrome keeps it at least 500 px wide and a little shorter than asked).

Promo video (an AI plays the game; needs `pip install -r tools/promo/requirements.txt` once: Playwright, networkx, py_trees, imageio-ffmpeg):

```
python tools/promo/record_promo.py --dry all   # play without video, print the run report and the play-quality limits
python tools/promo/record_promo.py             # record recordings/buck_nukem_promo_<date>.mp4 (max 16 MB)
python tools/promo/quirks.py                   # play-quality metrics only (reversals, unneeded jumps, shots without target)
cd tools/promo && python -m unittest discover -s tests -t .   # agent unit tests
```

`run_tests.py` opens `dist/buck_nukem.html#test`, which runs `src/test.js` against the real game code: movement, combat, enemies, boss, flow, audio scheduling and rendering, including brightness and colour targets on six fixed scenes. You can also open `buck_nukem.html#test` in a normal browser to see the report.

## Source layout

```
src/index.template.html  page shell (canvas, styles)
src/config.js            constants and the CONFIG tuning table
src/assets.js            decodes the embedded images
src/render.js            320x240 back buffer, integer scaling (fractional between the control bars in touch mode)
src/input.js             keyboard, fullscreen; actions held per source (keys, fingers, simulate)
src/touch.js             touch mode: side-bar layout, on-screen controls, taps, portrait card
src/font.js              5x7 bitmap font
src/sprites.js           procedural pixel art (hero body, enemies, pickups)
src/fx.js                particles, explosions, screen shake
src/audio.js             Web Audio synth: 70s rock title theme, Ride of the Valkyries arrangement, sound effects
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
tools/                   build, tests, level checker, screenshots
tools/promo/             promo-video recorder: Playwright bridge + Python agent (route planning, tactics)
```

## Level format

Each `src/levels/*.txt` file starts with `key: value` header lines (`name`, `theme` = court|creek|hall, `bg`, `boss: 1`), followed by map segments separated by `---` lines. Segments are joined side by side and must all have the same number of rows. Lines starting with `;` are comments.

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

Multi-tile props are placed by their top-left cell; the rest of their footprint must be `.` (the build warns otherwise). The header line `interior: x0-x1` draws columns x0–x1 as the clubhouse interior (wallpaper and wood panelling instead of the photo; windows still show the photo).

A crayfish (`K`) placed next to water hides in the creek.

## Credits

- Hero and backgrounds: photos in `assets/img/` (hero portrait, TC Wollerau and Krebsbach).
- Crayfish: original pixel art, drawn side-on after a reference photo of a real crayfish supplied for this project; the photo itself is not part of the game.
- Music: original 70s-style hard-rock title theme, written for this game and synthesized live (distorted guitar, bass, drums), and a chiptune arrangement of Richard Wagner's "Ride of the Valkyries" (public domain composition) for the levels, also synthesized live. No recordings or samples are used.
- Everything else (code, pixel art, sound effects) is original to this project.
