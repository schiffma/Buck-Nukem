# Proposal

## Why

Buck Nukem's in-game sprite has three problems:
- **Head too big:** the head takes half of the 32-px sprite (a 16×16 block on an 18-px body). It reads as a bobble-head, not as the hero.
- **Face doesn't look like the photo:** the face is a downscaled photo crop with a feature overlay. At this size it turns into a mushy patch that doesn't look much like the person in `assets/img/buck_nukem.jpg`.
- **Footwear:** the hero should wear **clogs** instead of generic boots.

## What Changes

- **Proportions:** the in-game sprite keeps its 32-px height (so the hitbox and gameplay are unchanged), but the head shrinks to about a quarter of the height (≤ 9 px). Torso and legs get longer: narrower shoulders, a longer jacket, a **beer belly** (the white shirt bulges forward under the open jacket), legs about 10 px.
- **Better face:** the face is hand-pixelled from a template, using colours sampled from the photo instead of downscaled photo pixels. It shows:
  - long grey-blond hair, centre-parted, falling past the ears onto the shoulders
  - dark sunglasses with the photo's blue-purple lens tint and thin metal frames
  - a white horseshoe moustache and grey stubble
  - a tanned, reddish skin tone
  - the cigar
- **Clothes:** the dark navy jacket over the white V-neck shirt stays, with colours checked against the photo.
- **Clogs:** both feet become **black** clogs: a black upper, a rounded toe, a dark sole and a visible heel step. Every pose with feet (idle, run, jump, shoot, hurt, climb) shows them.
- **All poses redrawn** (idle, 4-frame run, jump, shoot, shoot-run, shoot-jump, hurt, 2 climb frames) for the new proportions. The big gun, muzzle flash, outline, shading and cigar smoke stay. The smoke position follows the new mouth position.
- **Head icon:** wherever the in-game head is reused (HUD lives icon, extra-life pickup, reel-card lives), it is the new smaller head, centred in its slot.
- **Unchanged:** the title, game-over and victory screens keep the 96×96 photo portrait.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `game/presentation`: "Hero appearance" changes. The head is at most about a third of the sprite height, the face is hand-pixelled from colours sampled from the hero photo, and boots become clogs.

## Impact

- **Code:**
  - `tools/build.py`: new `make_head()` (template plus colours sampled from the photo), and a `debug_hero_compare.png` preview with `--debug`.
  - `src/sprites.js`: hero torso, legs and clog rows; the head offset in `buildHeroFrame`; the back-of-head for climbing.
  - `src/player.js`: smoke offset, plus a check of the muzzle position.
  - `src/hud.js`, `src/screens.js`: centre the smaller head.
  - `src/test.js`: proportion, clog and face-palette tests.
  - `README.md`, if it describes the hero.
- **Gameplay:** none. Hitbox 10×28, frame 23×32 and gun height stay the same.
- **Size:** negligible.

## Assumptions (to confirm or adjust)

- "Optimized in the game levels" means the in-game sprite. The photo portrait on the title and end screens is not changed.
- Clogs are black (upper and sole). Footsteps make no new sound.
- Sprite height stays 32 px so collision and level design are unaffected.
