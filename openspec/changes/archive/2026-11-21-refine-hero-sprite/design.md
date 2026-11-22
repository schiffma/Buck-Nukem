# Design

## Context

Current hero sprite (from the archived changes):

- **Head:** `tools/build.py` `make_head()` crops the face from `buck_nukem.jpg` (`FACE_CROP`), downscales it to 10×12, quantises it, and applies `FACE_FEATURES` (sunglasses, moustache, stubble) and `HEAD_EXTRAS` (cigar). It places the result in a 16×16 `HEAD_MASK` with hair coloured from `HAIR_SAMPLE`. The output is `ASSETS.head` (16×16, RGBA).
- **Body:** `src/sprites.js` `buildHeroFrame(torso, legs, back)` draws an 18-row body (`HERO_TORSO*` 11 rows plus `LEGS.*` 7 rows, 23 wide with the gun) at y = 14 and the head at (0, 0) in a 23×32 frame. Boots are rows `b`/`B`. The torso centre is column 8, mirrored `HERO_W - 9`. The gun barrel is at frame row 18 (torso row 4).
- **Dependants:**
  - `src/player.js`: draw offsets, muzzle flash at `py + 15…22`, shot spawn `y + 14`, smoke at `(x + 10 | x, y + 8)`
  - `src/hud.js`: lives icon `IMG.head` at (120, 0)
  - `src/screens.js`: reel card head
  - `src/sprites.js`: `SPR.life` (head in an 18×18 frame), `buildHeadBack()`
- **Tests:** frame size 23×32, the outline test, the 3-tone test.

## Goals / Non-Goals

**Goals:**
- Natural proportions in the same 23×32 frame: head ≤ 9 rows, body ≥ 23 rows, and a visible belly.
- A face that reads as the photo's person at 1×: long grey hair, tinted shades, white horseshoe moustache. Colours come from the photo, so the likeness depends on the source image rather than hand-picked colours.
- Black clogs in every pose.
- No gameplay change. Hitbox, gun height (barrel row 18 in the frame) and shot spawn stay the same.

**Non-Goals:**
- Changing the title, end-screen portrait or enemy sprites.
- New animations beyond redrawing the existing poses.
- Clog footstep sounds.

## Decisions

**1. Head = hand-made pixel template + photo-sampled palette (build time).**
`make_head()` no longer downscales the photo. It fills a 12×12 template (`HEAD_TEMPLATE`, facing right, three-quarter view) whose cells are palette keys:
- `H`/`h`: hair light/dark
- `s`/`S`: skin light/shadow
- `g`: shades frame
- `l`: lens
- `L`: lens glint
- `m`: moustache
- `d`: stubble
- `k`: mouth
- `c`/`C`/`o`/`a`: cigar body, cigar dark, ember, ash
- `.`: transparent

The palette is sampled from fixed regions of the photo (`SAMPLE_BOXES`): the hair strands right of the face, the cheek, the cheek shadow, the left lens, the moustache, and the jacket and shirt, which are passed to the sprite code. Each value is the median of the box, then lightly contrast-boosted.
- Shoulder hair: two hair strands extend 3 rows below the head template; this is the long hair falling onto the shoulders. The canvas is 12×15, with only the top 12 rows counting as head. The strands sit at the sides and overlap the jacket collar.
- `--debug` additionally writes `dist/debug_hero_compare.png`: the photo face crop next to the new head at 8×, plus the sampled palette swatches, for visual review.
- The build embeds the sampled palette as `ASSETS_META.heroPalette` (JSON), so the in-game body uses the photo's jacket and shirt colours and tests can check them.

*Alternative:* keep downscaling the photo and tune the crop. Rejected: at 8–10 px of face width, photo pixels blur into noise. A curated template with photo colours gives both readability and likeness.

**Revision (user feedback after the first build):** the head shrinks further to a 10×9 template, plus 3 rows of shoulder hair (10×12 canvas, placed at x = 3). The torso grows to 13 rows starting at frame row 9, with a belly bulge: the shirt widens by 3–4 px toward the front between torso rows 4 and 10. Clogs are black: upper `#141414`/`#2e2e2e`, sole `#3c3c3c`/`#262626`. The gun barrel stays on frame row 18 (torso row 9 now). The values in decisions 1–2 below describe the first build and are superseded by this revision.

**2. Body layout in the 23×32 frame.**
- Head: rows 0–11, placed at x = 2, so the 12-px head is centred over the torso centre at column 8.
- Shoulder hair: rows 12–14.
- Torso: rows 11–21, 11 rows. Narrower shoulders (8–9 px instead of 12). The jacket is longer and covers the hips. The gun barrel stays at frame row 18 (torso row 7), so the shot spawn, muzzle flash and boss face heights don't change.
- Legs: rows 22–31, 10 rows. Jeans to row 28, clogs rows 29–31:
  - row 29: brown leather upper, rounded toe
  - row 30: leather plus wood
  - row 31: light-wood sole with a heel gap
- Run frames: the clog is redrawn in a tilted (toe-down / heel-up) variant on the lifted foot.
- Clog palette: leather `#7a4422` / `#9a5a2e`, wood `#d8b070` / `#b08848`.
- Climb frames: the back-of-head is generated from the new head (all hair), and clogs show from behind (heel and sole).

**3. Dependants.**
- `SPR.life`, the HUD lives icon and the reel-card head use the 12×15 head centred in their existing slots. A helper `drawHead(g, x, y)` centres it in a 16×16 box.
- `player.js` cigar smoke moves to the new mouth position: frame (12, 9) facing right, mirrored for left.
- The muzzle-flash rows stay.

**4. Tests (`src/test.js`).**
- Proportion: the head canvas height is ≤ 15, and its non-transparent rows above the shoulder strands are ≤ 12. In `SPR.hero.idle`, the rows containing head pixels are ≤ 12, and the body spans ≥ 20 rows.
- Clogs: the bottom 3 rows of every grounded pose contain both a wood colour and a leather colour, before shading. This is checked on the unshaded row strings via the palette characters.
- Face palette: every non-transparent head pixel equals one of `ASSETS_META.heroPalette`'s colours (or the outline, cigar and glint constants). The palette's hair is lighter than its jacket, its skin is warmer (red > blue) than its lens, and its moustache is lighter than its skin.
- Existing frame size, outline and 3-tone tests keep passing. The gun height is unchanged (a test compares the shot spawn y with the hitbox).

## Risks / Trade-offs

- [Sample boxes land on the wrong photo area, e.g. background instead of hair] → `debug_hero_compare.png` shows the swatches, and the build fails if the samples violate basic relations (hair lighter than jacket, skin warmer than lens).
- [The head template doesn't look like him] → The template is small (12×12 data in `build.py`), so it's cheap to iterate with the compare image. Likeness is checked visually in a task.
- [Clogs unreadable at 1×] → A 3-row foot with a contrasting light sole. The outline separates it from dark floors.

## Migration Plan

Rebuild. To roll back, revert `tools/build.py`, `src/sprites.js` and the dependent files.

## Open Questions

- Exact template pixels and sample boxes will be tuned with the compare image during implementation. This doesn't change specs or tasks.
