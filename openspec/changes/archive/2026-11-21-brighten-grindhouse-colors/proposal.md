# Proposal

## Why

The game currently looks muddy and dark. Screenshots with the film filter on average a brightness of only 31–47 out of 255 in the levels and on the title (boss arena 62), and colour is washed out (mean chroma 0.11–0.22). Three layers stack up to cause this: the build-time background grade (40% saturation, sepia blend, brightness 0.65–0.75), the runtime film filter (30% desaturation, black crush, 1.3 contrast, strong vignette) and dark brown tile palettes. Sprites and pickups get lost against the backdrop. A 1970s exploitation print is lurid and saturated, not grey-brown: the look should become brighter and more colourful while keeping the trashy grindhouse character (grain, scratches, dust, gate weave, flicker, warm print colours, poster title, reel cards, cartoon gore).

## What Changes

- Re-grade the photo backgrounds at build time to a saturated, warm "70s colour print" look: more saturation than the source, a light warm cast instead of a sepia blend, mild contrast, and near-source brightness. Keep the retro palette reduction and ordered dithering.
- Retune the runtime film filter: no desaturation (a slight saturation boost instead), much less black crush and contrast, a lighter vignette, and a warm highlight / slightly teal shadow split typical of faded Eastmancolor prints. Grain, scratches, dust, gate weave and flicker stay.
- Brighten and saturate the level tile palettes (clay court, creek earth and grass, hall walls) and the clubhouse interior colours so the foreground reads clearly, still worn and dirty.
- Brighten the title poster and end-card backdrops so the poster reads as a colourful exploitation poster rather than a dark brown card.
- Add measurable brightness and colourfulness targets, checked by automated tests on fixed scenes.
- **BREAKING (spec):** the "gritty grade" rule that backgrounds must be *darker and less saturated* than the source photo is replaced by the opposite rule.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `game/presentation`: "Photo-based backgrounds" (new grade rule), "Film-grain post-processing" (new grade description and brightness/colour targets), "Clubhouse interior" (the hall backdrop is no longer "darkened"), plus a new requirement for overall brightness and colourfulness of the play screens and the title.

## Impact

- `tools/build.py`: `GRADE`, the per-background brightness values in `BACKGROUNDS`, and the build-time grade sanity check (currently fails the build unless saturation and brightness go down).
- `src/film.js`: `FILM` tuning table and the grade tables in `Film.init()`.
- `src/level.js`: `THEMES` palettes and the interior tile colours; `src/props.js` and `src/screens.js` where colours are hard-coded dark.
- `src/test.js`: new brightness/colourfulness tests; the vignette test stays.
- `tools/promo/recorder.js` lowers grain for video compression; that keeps working.
- `README.md` "Look" section.
- No new dependencies. File size changes only through re-graded backgrounds (still far below the 2 MB limit).
