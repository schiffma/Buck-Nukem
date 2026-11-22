# Proposal

## Why

The fans added by the open change `cheering-tennis-fans` are few: 3–5 per level, 2 in the boss arena. Only the nearest fan says anything, with a short generic line ("GO BUCK!"). The user wants a bigger crowd of female tennis players in every level. Every one of them should cheer Buck on with her own cheeky, flirty messages, in the game's grindhouse spirit. Per-fan messages were planned before (task 4.1 of `cheering-tennis-fans`, never applied); this change takes that task over.

## What Changes

- **About double the fans:** 8–10 per regular level and 4–5 in the boss arena, placed along each level on floors and platforms, some standing in small groups by the courts, the creek and the bar.
- **More looks:** at least 14 distinct fan looks. New hair styles (pigtails, curls), sunglasses and a cap, and new outfit accents, so all fans in a level still look different.
- **Every fan talks (this absorbs task 4.1):**
  - On a kill, a trophy or a checkpoint near them, every fan within 12 tiles cheers and shows her own speech bubble, with different lines on screen at the same time.
  - Each fan also calls out to Buck when he walks within 4 tiles of her, at most once per 8 s per fan.
  - At most 3 bubbles show at once, the nearest fans first, and bubbles don't overlap each other.
- **Steamy, cheeky lines:** a pool of at least 30 flirty grindhouse one-liners, grouped by occasion:
  - shout-outs: "HEY HANDSOME!", "NICE RACKET, BUCK!"
  - kills: "OOH, DANGEROUS!"
  - trophies: "BIG CUP, BIG MAN!"
  - checkpoints

  The lines are suggestive innuendo only: no explicit sexual content, no nudity. The fans are adult club players. Lines can end with a small pixel heart.
- **Flirty touches:**
  - a small heart floats up from a fan when she calls out
  - a wolf-whistle sound plays on shout-outs (at most once per 4 s); the cheer sound stays at most once per 1.5 s
  - a new "blow a kiss" fan frame is used for shout-outs
- **Font:** a heart glyph is added to the bitmap font.
- **Still decorative:** fans have no collisions and no gameplay effect. Level reachability is unchanged.
- **`cheering-tennis-fans`:** its task 4.1 is marked as superseded by this change, and that change is archived first, so this change can modify the "Cheering tennis fans" requirement.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `game/presentation`: "Cheering tennis fans" (added to the main spec when `cheering-tennis-fans` is archived) changes:
  - fan counts double
  - at least 14 looks
  - every fan has her own bubble, with flirty line pools per occasion
  - shout-outs with a heart and a wolf whistle
  - limits on bubbles shown at once

## Impact

- **`src/fans.js`:** new variants and the kiss frame; per-fan bubbles, the shout-out timer, line pools and bubble layout; hearts.
- **`src/font.js`:** heart glyph.
- **`src/audio.js`:** `whistle` sound.
- **`src/main.js`:** draw call for the per-fan bubbles.
- **`src/levels/*.txt`:** more `F` cells.
- **`src/test.js`:** fan tests updated (counts, looks, bubbles, shout-outs, rate limits, line pool checks).
- **`README.md`:** fans paragraph and level legend counts.
- **`dist/buck_nukem.html`:** rebuilt; a few KB more.
- **Performance:** up to 10 fans and 3 bubbles per screen. The existing "under 8 ms per frame" performance tests must still pass.
- **Promo video:** more on-screen life; the agent ignores fans, so it's unaffected. `tools/check_levels.py` is unaffected (fans are decorative).
