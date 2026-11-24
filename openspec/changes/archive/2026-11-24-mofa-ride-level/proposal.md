# Proposal

## Why

The game drops Buck straight onto the clay courts. A new opening reel, Buck riding up the road to TC Wollerau on a Sachs mofa with a machine gun mounted on the handlebars, gives the story a proper grindhouse start. It also brings in a new kind of enemy, the arrogant, posh car drivers of the Zurich lake shore. The photo `assets/img/sachs-mofa.jpg` (a red Sachs mofa with a chrome tank, a black seat and a luggage rack) is the model for the mofa.

## What Changes

- **New reel 1, "THE ROAD TO WOLLERAU":** a side-view ride from left to right up the road to the TC Wollerau gate. Buck stays on the mofa the whole reel:
  - Right accelerates, Left brakes and rolls back slowly, and the mofa coasts when neither is held.
  - Jump hops over obstacles and low cars.
  - Fire shoots the mounted machine gun forward; Up angles it upward.
  - The same keys and touch buttons as on foot, with no new controls.
- **Road hazards:** traffic cones, potholes, speed bumps and ramps, plus pickups along the road, at least one checkpoint, and cheering fans near the club. The reel ends at the club gate, and reel 2 (the clay courts) starts with Buck on foot.
- **New enemies, posh drivers in their cars,** each with its own behaviour and arrogant one-liners in speech bubbles:
  - **SUV:** a huge, slow, tall roadblock ahead. The driver tosses latte cups and golf balls back over the roof.
  - **BMW:** tailgates from behind with flashing headlights and the horn, overtakes and brake-checks in front of Buck.
  - **Tesla:** creeps up from behind almost silently, with the driver on the phone, and rams.
  - **Ferrari:** low and very fast, oncoming with a loud roar. Jump over it or shoot it in time.

  Cars take several hits, then explode, and the driver bails out. The driver is worth points.
- **Play-test revision 7:** every posh driver calls out an arrogant line as soon as the car shows up and then every few seconds, with up to two bubbles on screen that never overlap. The president's limo becomes a 300 × 56 px super-stretch, so the posh ladies at its windows have heads as big as Buck's.
- **Play-test revision 6:** the ride is as hard as before revision 5 again (the extra WD-40 cans stay). The mofa carries a twin machine gun: Fire shoots forward from the handlebars and backward from the luggage rack at the same time, replacing the automatic rear turret. The ride's checkpoints are verified, including the one on the climb. Arrogant posh ladies ride in the president's limo and call out lines from its side windows.
- **Play-test revision 5:** the ride is easier (car contact 1 health, fewer hits per car and the limo, slower throws and corks, two more WD-40 cans), and the mounted gun sounds like a machine gun.
- **Play-test revision 4:** the ride doubles to about 640 tiles in four stretches with their own scenery (lake promenade, Wollerau village, vineyard climb, the club). The road climbs steadily up to the club in the last third. Traffic comes in waves (convoys, pairs, pincers). The club president's stretch limo blocks the gate as a mini-boss, popping champagne corks. On the ride, WD-40 spray cans replace Rivella and Cervelat as health items.
- **Play-test revision 3:** the cars are drawn after the reference photos (a BMW X7 in the SUV's role, a Tesla Model 3, a Ferrari), the road has no cones, potholes or speed bumps any more (the ramps stay), and the rear turret turns back as soon as a car comes up behind.
- **Play-test revision:** the cars are drawn in proportion to Buck on the mofa, about a third longer than in the first build. On the ride, the background fans are two groups instead of tennis players: environmental activists with protest signs, and rocker chicks in leather. Each group has its own look and lines.
- **Sound:** a two-stroke mofa engine whose pitch follows the speed, one engine sound per car type (the Tesla barely audible), and horns.
- **Biker rock song:** the ride has its own music, an original 1970s-style biker rock song (boogie-shuffle guitar riff, power chords, bass, drums), synthesized in the browser like the title theme. The Ride of the Valkyries takes over from reel 2.
- **Renumbering:** the existing levels become reels 2–5 (clay courts, creek, clubhouse, boss arena). `#level=N` keeps meaning reel N, so `#level=5` is now the boss arena and old `#level=4` links open the clubhouse. The level name in each requirement replaces "level 1" or "level 3".
- **Promo recorder:** the AI promo video starts at reel 2 (`#level=2`) and keeps its current content. Teaching the AI to ride is a later change.

## Capabilities

### New Capabilities
- `game/ride`: the mofa ride reel. Riding controls and physics, the mounted machine gun, road hazards, damage and respawn on the mofa, the level's end at the club gate, the mofa's engine sound and the ride's biker rock song.

### Modified Capabilities
- `game/enemies`: adds the posh car drivers (shared car rules plus SUV, BMW, Tesla and Ferrari behaviour).
- `game/gameplay`:
  - "Level sequence" (the ride first)
  - "Start level from the URL" (N = 1..5, boss = 5)
  - "Clubhouse furniture platforms", "Wide tactical boss arena" and "Mega Cutter upgrade" (refer to the levels by name, not by their old numbers)
- `game/presentation`:
  - adds the mofa, car and driver looks (cars in proportion to Buck), the road scenery and the ride's fan groups (activists, rocker chicks)
  - "Cheering tennis fans" (not on the ride)
  - "Ride of the Valkyries soundtrack" (every level except the ride; built on the version from the open change `add-title-rock-music`)
  - "Title and end screens" (Enter starts the ride)
  - "Reel title cards" (MISSING REEL after the clubhouse)
  - "Start reel note on the title" (reels 2–4, FINAL REEL = 5)
  - "Bright, colourful grindhouse look" (the ride becomes a benchmark scene)
  - Renamed level references in "Themed foreground tiles", "Film-grain post-processing", "Clubhouse interior", "Clubhouse bar", "Clubhouse restaurant" and "Tennis court equipment"

## Impact

- **Code:**
  - new `src/ride.js` (mofa physics, machine gun, hazards, road camera)
  - car enemies in `src/enemies.js`
  - mofa, car and driver sprites in `src/sprites.js`
  - road tiles and props in `src/level.js` / `src/props.js`
  - engine sounds and the biker rock song in `src/audio.js`; the track choice in `src/main.js`
  - a ride branch in `src/main.js` / `src/player.js`
  - HUD weapon label
  - new map `src/levels/1_road.txt`; the existing maps are renamed to match their reel numbers (`2_courts`, `3_creek`, `4_clubhouse`, `5_boss`)
- **Build:** `tools/build.py` adds `sachs-mofa.jpg` as a required image (mofa colours sampled from it) and a road background.
- **Tools:**
  - `tools/check_levels.py` checks ride levels (every gap and obstacle can be cleared with a mofa jump; the exit can be reached)
  - `tools/promo` starts at `#level=2` and maps its `--dry` indices to reels 2–5
  - `tools/perf_phone.py`, the benchmark scenes and the tests now load the courts by their new index
- **Tests:** new ride and car tests in `src/test.js`; every hard-coded level index in the existing tests is shifted by one.
- **Docs:** README (story, controls on the mofa, level list, links, level format).
- **Compatibility:** old `#level=N` bookmarks point one reel earlier. Two active changes touch the same spec text: `phone-frame-performance` says "level 1" (meaning the courts), and `add-title-rock-music` modifies the soundtrack requirement this change modifies again. Both should be archived before this one.
- **Unchanged:** the four existing levels' content and rules, touch controls (the same actions), the film filter, the single-file build (still well under 2 MB).
