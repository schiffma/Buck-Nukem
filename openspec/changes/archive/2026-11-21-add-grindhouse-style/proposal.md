# Proposal

## Why

Play-testing feedback on Buck Nukem raised two points. Players expect Ctrl to fire, as it does in many DOS-era action games, but Ctrl currently jumps. And the graphics look too naive: clean, flat pixel art with bright colours does not suit a game about a mulleted hero blasting lawyers and mutant crayfish. The game should look like a 1970s grindhouse / exploitation B-movie: gritty, scratched film, gaudy poster typography and over-the-top (cartoon) gore.

## What Changes

- **Controls**: Ctrl (left and right) fires, together with X and Alt. Jump is Space only. **BREAKING** for players used to jumping with Ctrl. The title screen, pause help and README are updated.
- **Film look**: a post-processing pass over every 320×240 frame adds a warm, high-contrast colour grade, crushed blacks, film grain, vertical scratches, dust specks, a vignette, slight frame jitter ("gate weave") and brightness flicker. Pressing G turns it on or off; it is on by default.
- **Grittier art**: all procedural sprites get dark 1-px outlines and 3-tone shading.
  - Hero: unshaven stubble, a cigar, heavier boots and a bigger gun.
  - Lawyers: sinister grin and sunken eyes.
  - Crayfish: slime highlights.
  - Robots: rust and stained blades.
  - Tiles: worn, cracked and dirty variants.
  - Muzzle flashes and explosions: larger and brighter.
- **Gritty backgrounds**: the photo backdrops are re-graded at build time (desaturated, warm/sepia tint, harder contrast, darker) to match the film look.
- **Cartoon gore**: defeated enemies burst into red pixel blood and a few gibs. Blood splatters leave temporary stains on nearby tiles. Taking damage flashes the screen edges red. Robots spray oil and sparks instead of blood. Gore is pixel-cartoon level, with no realistic dismemberment.
- **Grindhouse presentation**:
  - Title screen as an exploitation-movie poster: distressed outlined lettering, tagline and fake rating badge.
  - Level intros as film-reel title cards ("REEL 1", ...) with a countdown leader.
  - Short "MISSING REEL" gag card before the boss.
  - Game over and victory screens styled as "THE END" cards.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `game/gameplay`: "Keyboard movement and jumping" (jump keys) and "Shooting" (fire keys) change.
- `game/presentation`: hero appearance, photo backgrounds, themed tiles and title/end screens get the grindhouse style. New requirements cover the film post-processing filter and its G toggle, the damage flash, and reel title cards.
- `game/enemies`: "Enemy hit feedback" changes from generic explosion particles to blood/oil splatter, gibs and temporary stains.

## Impact

- **Code**:
  - `src/input.js` (key map)
  - `src/sprites.js` and `src/level.js` (sprite and tile art)
  - `src/fx.js` (blood, gibs, stains, damage flash)
  - `src/render.js` (film post-process)
  - `src/screens.js` and `src/hud.js` (poster/reel styling)
  - `src/enemies.js` and `src/boss.js` (death effects)
  - `tools/build.py` (background grade)
  - `src/test.js` (updated control tests, new filter and gore tests)
  - `README.md`
- **Performance**: the film pass runs every frame on 76,800 pixels. It must keep update+render well under the 16.7 ms frame budget. Current cost is about 0.5 ms.
- **Size**: the output must stay under the 2 MB limit. Re-graded backgrounds stay about the same size.
- **Dependency**: this change modifies requirements introduced by `add-retro-sidescroller-game`, which must be archived (its specs synced to `openspec/specs/`) before this change is archived.

## Assumptions (to confirm or adjust)

- Ctrl becomes fire-only. Space is the only jump key, and Up/W stay reserved for ladders.
- Gore stays cartoonish (pixel blood and gibs) and is always on. There is no separate gore toggle, only the film-filter toggle on G.
- The film filter is on by default.
