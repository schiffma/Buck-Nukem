# Design

## Context

- **Lawyer sprite:** `src/sprites.js` builds it from character rows: `LAWYER_TOP` (18 rows), `LAWYER_THROW_TOP`, and `LAWYER_LEGS1`/`LAWYER_LEGS2` (12 rows each), 16 px wide, through `spriteFromRows` and `makeSet`. `makeSet` gives the outline and the 3-tone shading.
  - The palette `n`/`N` (`#5a6272`/`#3a404e`) is the suit.
  - A test checks the base, highlight and shadow tones of `#5a6272` on `SPR.lawyer[0]`.
  - `GORE.suit` uses the suit colours.
- **The briefcase:** `ENEMY_TYPES.lawyer.update` spawns `{ kind: "briefcase", w: 10, h: 8, vx: 125·face, vy: −70, grav: 160, dmg: 1 }`.
  - `updateEnemyShots` removes projectiles on solid tiles, with sparks, or on a hit.
  - `drawEnemyShots` draws the briefcase, flipping every 0.1 s.
  - Tests use the kind name `briefcase` in 4 places.
- **Fan bubbles:** `Fans.drawBubble` draws the bubble inline: an outlined cream box, a tail, and red text. It also lays bubbles out (at most 3, no overlaps), and fan lines are filtered by font coverage in tests.

## Goals / Non-Goals

**Goals:**
- Swap the art and the projectile with no change to difficulty: same hitbox, arc and damage.
- Lawyer lines that never clutter the screen.

**Non-Goals:**
- No mix of male and female lawyers.
- No new lawyer behaviour or attack pattern.
- No readable text on the book sprites themselves (8 px is too small); the code shows through the cover colour and the floating label on impact.

## Decisions

1. **Sprite rows:** new `LAWYER_TOP`, `LAWYER_THROW_TOP` and `LAWYER_LEGS1`/`2` in the same 16 × 30 frame:
   - **Head:** a short bob, hair `h` ending at the jaw, lips `r`.
   - **Body:** a blouse collar `w` and a fitted jacket `n`/`N`, keeping the suit palette so the shading test and the gore still apply.
   - **Legs:** a pencil skirt down to the knee rows, then skin-coloured (`s`/`S`) legs and dark heels `k`.
   - **Throwing pose:** keeps the raised arm.
   - **File holder:** the briefcase she carried is dropped; she holds a small red file `r`.

   The test checks: no `n` suit pixels in the leg columns below the skirt rows, skin pixels in those rows, and frames differing from the old male rows, kept as a fixture constant in the test.
2. **Law book sprites:** `LAWBOOK_CODES = [{ code: "OR", cover: "#c81e1e", arts: ["ART. 41 OR", "ART. 97 OR", "ART. 1 OR"] }, …]`, with ZGB `#1e3c8c` ("ART. 8 ZGB", "ART. 2 ZGB", "ART. 28 ZGB"), StGB `#1e7a36` ("ART. 111 STGB", "ART. 139 STGB") and SchKG `#e07818` ("ART. 38 SCHKG").
   - Each book is drawn procedurally at 10 × 8: the cover in its colour, a 1 px darker spine, a cream page edge on the right side and bottom, a 3 × 3 white cross on a 5 × 5 square, and an outline.
   - Frame 2 is the book turned on its edge (8 × 10 rotated). Both frames are padded to 10 × 10 so the drawing offset stays the same.
   - `SPR.lawbook[i] = [frame0, frame1]` as `makeSet` sets.
3. **The projectile:** `kind: "lawbook"`, `code: i` (random 0–3), with the same box and physics.
   - `updateEnemyShots` calls `burstBook(s)` when a law book hits the hero or a wall: 6 page particles (cream, white) drifting with low gravity and a little sideways sway, plus `FX.text(x, y, randomArticle(code), coverColour)`.
   - The 4 tests that use `briefcase` are renamed.
4. **Lawyer lines:** `LAWYER_LINES` lists 10 lines: "ART. 41 OR!", "OBJECTION!", "SEE YOU IN BERN!", "YOU'RE SUED!", "TERMS APPLY!", "SIGN HERE!", "ZGB SAYS NO!", "SCHKG FOR YOU!", "OVERRULED!" and "BILLABLE HOURS!".
   - When a throw starts, with chance 0.5, and only if `e.talkCd <= 0` and no other lawyer has a bubble: `e.bubble = { text, t: 1.5 }` and `e.talkCd = 4`.
   - The bubble is drawn above her head with a shared `drawSpeechBubble(text, cx, bottomY)`, factored out of `Fans.drawBubble` (same look). Its x is clamped to the screen.
   - Lines come from a shuffled deck, like the fans' lines.
5. **Promo agent:** it treats any non-shockwave/bubble enemy shot generically. The bridge's `threatNear` and the metrics don't depend on the kind, so no logic change is needed; one dry run confirms it.

## Risks / Trade-offs

- **Bubbles from lawyers and fans on screen together get cluttered** → the lawyer bubble is limited to one at a time and only 1.5 s long. It sits above the lawyer's head, and fans are usually elsewhere. The fans' own layout keeps its 3-bubble limit.
- **Skin-coloured legs hurt readability against light backgrounds** → the 3-tone shading and the outline keep the legs readable. A screenshot is checked on the court and clubhouse backgrounds.
- **Gore colours (suit grey) no longer match exactly** → the suit palette is kept on purpose.
