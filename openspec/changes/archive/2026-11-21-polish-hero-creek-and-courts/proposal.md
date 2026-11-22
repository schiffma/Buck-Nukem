# Proposal

## Why

Three pieces of polish feedback after the hero redesign:
- **Belly too big.** Buck's beer belly now dominates the sprite (12 px wide against 8 px shoulders). It should stay a belly, just smaller.
- **Creek water too natural.** The Krebsbach creek in level 2 is clear blue, but it's where the crayfish mutated. It should look toxic: glowing red.
- **Courts too bare.** The TC Wollerau clay-court level has only nets and fences. A tennis club should be full of court equipment.

## What Changes

- **Smaller belly:** the shirt bulges 1–2 px wider than the shoulders instead of 4 px. Every pose (idle, shoot, hurt, climb) is adjusted. Head, clogs and gameplay are unchanged.
- **Toxic red creek (level 2, Krebsbach):**
  - Water tiles become a toxic red liquid: deep crimson with glowing orange-red highlights and a bright surface line.
  - Animated bubbles pop on the surface.
  - A faint red glow hangs over the water.
  - Splashes and a submerged crayfish's bubbles turn red instead of light blue.
  - New decoration: toxic waste drums, and warning signs with a skull and "TOXIC" near the pools.
  - Water damage stays the same: 2 health and a bounce.
- **More tennis equipment (level 1, clay courts):** new props, placed only in empty cells so routes stay the same:
  - umpire chair
  - ball machine
  - ball baskets
  - racket bags
  - player benches
  - a scoreboard ("TC WOLLERAU" with a score)
  - court drag brushes
  - a water cooler
- **Map format:** new single-character props in the existing prop system (anchored top-left, decoration only), with footprints registered for the build's overlap warning:
  - court equipment: `Q` umpire chair, `@` ball machine, `%` ball basket, `V` racket bag, `z` bench, `[` scoreboard, `J` drag brush, `&` water cooler
  - toxic creek: `*` toxic drum, `^` warning sign

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `game/presentation`:
  - "Hero appearance": the belly scenario becomes a slight belly (1–2 px).
  - "Themed foreground tiles": the creek water is toxic red.
  - New requirement "Toxic Krebsbach creek".
  - New requirement "Tennis court equipment".

## Impact

- **Code:**
  - `src/sprites.js`: torso rows
  - `src/level.js`: water tiles per theme (toxic palette for the creek), glow, red splash and bubble colours
  - `src/player.js`, `src/enemies.js`: splash and bubble colours via the level's water palette
  - `src/props.js`: 10 new props
  - `tools/build.py`: `PROP_SIZES`
  - `src/levels/1_courts.txt` and `src/levels/2_creek.txt`: decoration only
  - `src/test.js`, `README.md`: legend
- **Gameplay:** none. Hitbox, water damage, routes, enemies and pickups are unchanged; `tools/check_levels.py` must still pass.
- **Size:** a few KB.

## Assumptions (to confirm or adjust)

- "Toxic read" means toxic **red** water.
- Only level 2 has creek water. The boss arena shares the creek theme but has no water, so it is visually unaffected.
- The new court equipment and toxic props are decoration only. You can't stand on them and they don't block movement.
