# Proposal

## Why

Two pieces of feedback on the grindhouse version of Buck Nukem:
- **The gardener enemy:** the "crazy gardener robot" (a green box with a straw hat and a hedge-trimmer) doesn't fit the B-movie tone. It should be a human **gardener-punk**: mohawk, leather vest, a blunt in his mouth, pushing a **lawn mower**.
- **Level 3 (CLUBHOUSE AND INDOOR HALL):** the clubhouse part looks boring and empty. It's bare brick walls with a few windows over a darkened aerial photo. It should look like the inside of the TC Wollerau clubhouse, with a **bar** and a **restaurant**.

## What Changes

- **Gardener-punk replaces the gardener robot** everywhere the robot appears (`M` in level maps). **BREAKING** for the robot's behaviour and look.
  - Look: a pixel-art punk with a green mohawk, sleeveless leather vest with studs, ripped jeans and boots, and a blunt glowing between his lips that puffs smoke. He pushes a red petrol lawn mower in front of him.
  - Patrol and contact: he patrols his platform without falling off edges. Touching the running mower blades costs 2 health.
  - Mower charge (replaces the weedkiller spray): when the hero is in front at roughly the same height and within range, he revs the engine (short wind-up with smoke and a rising engine sound), then charges forward at high speed. The charge ends at a ledge or wall, or after a set distance.
  - Grass and stones: while charging, the mower throws grass clippings and small stones forward as short-range projectiles.
  - Toughness: 5 standard hits, as before.
- **Gore for the punk:** he is human now, so he bleeds red blood and gibs. The mower bursts into oil, sparks and metal debris, so the robot's oil/sparks effect lives on in the mower.
- **Clubhouse interior for level 3:** segments 1 and 2 of `3_clubhouse.txt` become a furnished clubhouse.
  - Wall: wood-panelled lower wall and patterned wallpaper instead of the see-through photo backdrop.
  - Bar: a bar counter with stools, beer taps, back-bar shelves full of bottles, a neon beer sign and a cash register.
  - Restaurant: tables with checked tablecloths and chairs, a menu chalkboard ("CERVELAT 8.50", "RIVELLA 4.50", "FONDUE"), a kitchen pass-through and potted plants.
  - Club details: a trophy cabinet, framed photos/posters, tennis rackets on the wall, hanging lamps and a club-founded plaque.
  - Furniture you can use: tables and the bar counter are one-way platforms, so the hero can jump onto them.
  - Unchanged: doors, keys, ladders, the floor slab, the routes, and level 3's later segments (gym hall, green door, exit). The level must stay completable.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `game/enemies`: the "Crazy gardener robot enemy" requirement is replaced by a "Gardener-punk enemy" requirement (mower contact, revving charge, clippings and stones). "Enemy hit feedback" changes: robot oil/sparks becomes punk blood plus an exploding mower.
- `game/presentation`: "Themed foreground tiles" now describes the clubhouse interior. A new "Clubhouse interior" requirement covers the bar, the restaurant and the club decoration.
- `game/gameplay`: a new "Clubhouse furniture platforms" requirement: tables and the bar counter can be stood on.

## Impact

- **Code:**
  - `src/enemies.js`: robot → punk behaviour, mower charge, clippings and stones
  - `src/sprites.js`: punk and mower sprites
  - `src/config.js`: punk tuning
  - `src/level.js`: new interior decoration and furniture tile characters, the interior backdrop
  - `src/levels/3_clubhouse.txt`: furnished segments 1 and 2
  - `src/audio.js`: mower rev and engine sounds instead of spray
  - `src/fx.js`: blunt smoke and mower gore
  - `src/test.js`: robot tests → punk tests, interior tests
  - `tools/check_levels.py`: new furniture characters
  - `README.md`: legend
- **Dependency:** "Enemy hit feedback" and "Themed foreground tiles" are modified in their `add-grindhouse-style` versions. Archive `add-grindhouse-style` before this change.
- **Size:** procedural art only. The output grows by a few KB, well under the 2 MB limit.

## Assumptions (to confirm or adjust)

- The punk's ranged attack is the mower charge plus thrown clippings and stones. The weedkiller spray is dropped.
- The blunt is cosmetic only (smoke puffs, glowing tip). It has no gameplay effect, such as a haze on the hero.
- The level map letter stays `M` (now "mower punk"), so level layouts keep their enemy placement.
- Only the clubhouse part of level 3 (segments 1–2) is refurnished. The gym hall (segment 3) and the segments after it keep their look.
