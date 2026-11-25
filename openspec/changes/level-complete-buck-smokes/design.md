# Design

## Context

- `Screens.levelComplete()` (`src/screens.js`) draws `bg_complete` with a dark tint. On the 320×240 screen it draws "LEVEL COMPLETE!" (scale 2, y 30), the level name (y 56), five bonus rows (labels at x 60, values right-aligned at x 260, y 86–150), "SCORE" (y 180) and the prompt (y 210), all centred on the full width.
- `Game.completeLevel()` (`src/main.js`) builds `Game.tally`. `Game.update` counts `t.shown` up over about 1.5 s and sets `t.done`. Enter skips the count, and the next Enter continues.
- `drawFramedPortrait(x, y)` draws the 96×96 photo portrait (`IMG.portrait`, built from `buck_nukem.jpg`) in a 102×102 frame. It is used on the game-over and victory screens. In the portrait, Buck faces left. His horseshoe moustache runs across at y ≈ 44–48 and droops down both sides (left x ≈ 29–32, right x ≈ 45–47). The lips sit between the droops, right under the moustache, at about x 34–44, y 50–53. A 6× grid render shows this.
- `drawSpeechBubble(text, x, y, w, h, tx)` (`src/fans.js`) draws a cream bubble with red text and a tail pointing down at `tx`.
- Quote packs: the build accepts the sections `start`, `finale`, `kill` and `kill:<type>`. `Quotes.lines(section)` reads the current level's pack, and `Talk.line(pool)` deals lines without repeats.
- Levels that end on level complete: the ride (pack `ride`), the courts, creek and clubhouse (pack `thurgau`). The boss arena ends on the victory screen.

## Goals / Non-Goals

**Goals:** a smoking Buck and a winning line on the level-complete screen; lines editable in the packs; a layout that fits.

**Non-Goals:**
- Changing the victory or game-over screens.
- A new image asset: the cigarette and smoke are drawn as pixels on top of the existing portrait.
- Sound for the lighter or a puff.
- Changes to the bonus logic or timing.

## Decisions

### 1. Layout (320×240)
```
          LEVEL COMPLETE!            (y 30, centred, unchanged)
       TC WOLLERAU - CLAY COURTS     (y 56, centred)
                       LEVEL BONUS     5000
 +-----------------+   HEALTH BONUS     800     rows: labels x 140, values right x 306,
 | GWUNNE, WIE...  |   TIME BONUS      1200           y 80 + i*16 (80..144)
 +--v--------------+   ENEMIES           23
 +------+              TOTAL BONUS     7000
 |PORTR.|
 |  ~o  |                 SCORE 12345    (y 176, centred on x 223)
 +------+            PRESS ENTER ...    (y 210, centred on x 223)
```
- Portrait frame at x 14, y 120 (the image covers 14–110 × 120–216; the frame reaches y 219).
- Bubble: up to 20 characters, so at most 125 px wide. Left edge x 8, top y 98, height 11. The tail points down at the portrait's head (x ≈ 47) and ends above the frame's top at y 117.
- The right column runs from x 136 to 312. Score and prompt are centred on that column (x 224). The prompt texts ("PRESS ENTER TO CONTINUE", the touch prompt "TAP TO CONTINUE") fit in 176 px. A test checks this.
- Why not leave the table centred and draw the portrait over the backdrop? The table spans x 60–260, so it would collide with any portrait big enough to read. Scaling the portrait down to 64 px makes the face too small for a visible cigarette.

### 2. Cigarette and smoke
- The cigarette is drawn in screen pixels relative to the portrait origin (px, py). Its filter end sits on the line between the lips at (px+38, py+47), right under the moustache. From there it runs almost level to the left (1 px down per 4 px), is 10 px long and 2 px thick, and crosses the left moustache droop. It has off-white paper, a tan filter at the mouth end and an ember at the tip that flickers between `#ff7020` and `#ffb040`, the same colours as the ride cigarette.
  - Where the mouth is: a full-resolution crop of `buck_nukem.jpg`, gridded in portrait pixels, shows the nose at y ≈ 44, the moustache band at y ≈ 43–47 (x 28–46), and the line between the lips at y ≈ 47–48 (x 31–44). The lower lip is at y 48–50. The moustache droops run down to y ≈ 58 at x 28–31 and x 44–47.
  - History: the first version at (35, 52) sat on the cheek. The second at (39, 50), picked from the 96-px portrait alone, sat on the lower lip and chin, still too low according to the user's play-check. The 96-px portrait is too coarse to place the mouth, hence the full-resolution check. Candidate "P" (38, 47, length 10, 1-in-4 slope) was chosen from a 6× comparison (`now 39,50` / `P 38,47` / `Q 36,47` / `R 38,46`).
- **Smoke, modelled on a real cigarette.** Screen particles kept by the screen (`Screens.smoke`), not `FX`, which works in world coordinates. They are updated in `Game.update` during `LEVEL_COMPLETE` and reset in `completeLevel()`. They are drawn with alpha, not as opaque squares.
  - **Side-stream wisp (continuous):** one particle every ~0.06 s from the ember, rising slowly at 7–10 px/s. Each particle follows a sine sway whose amplitude grows with height (0 at the ember, ±3 px after ~20 px of rise). Its phase depends on the time it was born, so neighbouring particles form one wavy ribbon instead of a scatter. Size is 1 px for the first third of its life, then 2 px. Alpha runs from 0.45 down to 0. Colour is a cool blue-grey (`#c8ccd8`), the colour of smoke from a burning tip. Lifetime is 2.2 s. The ribbon reaches about 20 px above the ember before it breaks up.
  - **Drag cycle (every 4.5–6 s):** the ember brightens to `#ffd060` with a 1-px glow around it for 0.5 s ("the drag"), and the wisp pauses during the drag. About 0.4 s after the drag, an exhale of 14–18 particles leaves the left half of the mouth line (x 31–36, y 48). They move left and slightly down at 10–16 px/s, slow down, rise as they cool, and grow from 1 to 3–4 px. Alpha runs from 0.7 down to 0 over 1.6–2.2 s, and size grows from 1 to 5 px. These values were raised from 0.55 and 4 px during apply, because the exhale was hard to see over the photo. Colour is a warmer, whiter grey (`#e4e2de`), the colour of exhaled smoke. The first drag comes 1.5 s after the screen opens, so it shows during the bonus count.
  - Particles that leave the portrait (inside the frame) are dropped, so smoke never covers the frame or the bubble.
  - The portrait and the smoke run from the first frame of the screen and do not depend on the bubble.
  - The previous version (a puff of opaque 2–4 px squares every ~1 s, plus a dotted trail) looked like flying blocks, not smoke. The user called it unrealistic.

### 3. The line
- New pack section `[complete]`: the build adds `complete` next to `start` and `finale`. `tools/test_build.py` checks that it parses and that `[complete:x]` is rejected.
- `Quotes.completeLine()` returns `Talk.line(lines("complete"))` or null. `completeLevel()` stores it in `Game.tally.quote` before the state changes, while `Game.level` is still the finished level.
- `levelComplete()` draws the bubble only when `t.done && t.quote`. It doesn't blink. It stays until Enter.

### 4. Content: the same 14 lines in `thurgau.txt` and `ride.txt` under `[complete]`, all checked for length and glyphs
```
GWUNNE, WIE IMMER.    SO GOHT GWINNE!       DE SIEG GHÖRT MIR.
SCHO WIEDER GWUNNE.   ZIIT FÜR EN MOST.     KÖNIG BLIBT KÖNIG.
LOCKER GWUNNE, HOI.   EIFACH GUET, GÄLL?    MOSTINDIE ISCH STOLZ
S NÖCHSTE BITTE!      APPLAUS, SCHÄTZELI!   DAS ISCH KLASSE GSII
SIEGER RAUCHED, GÄLL  GOPF, WAS EN SIEG.
```
The ride pack gets the same lines, so the mofa ride ends the same way. The ride's dialect mix (dry Swiss German plus Thurgau) stays in its `[kill]` lines.

### 5. Tests (`src/test.js`)
- After `completeLevel()` on the courts, before `t.done`: the portrait's pixels are drawn at the frame position, the ember pixel is orange, and no bubble text is logged (`TEXT_LOG`).
- After `t.done`: the logged texts include a line from `QUOTE_PACKS.thurgau.complete`.
- Over about 2 s on the screen, at least one smoke puff is drawn above the ember.
- Two completions in a row draw two different lines (the deck).
- With `Game.level.quotes = null`: the portrait shows and no bubble is drawn.
- Layout: the rectangles of the title, name, rows, score, prompt (keyboard and touch), portrait frame and bubble are inside 320×240 and don't overlap. The bubble is measured with the longest `[complete]` line.
- The existing touch-text and tally-music tests stay green.

## Risks / Trade-offs

- [A cigarette drawn in pixels on a photo can look pasted on] → keep it small, anchor it between the lips under the moustache (§2), give it an outline-free filter and ember, and check it at 4× during apply. The user reviews it in the play-check.
- [The table moves right, and long level names] → the level name stays centred on the full width. The longest name is "THE CREEK - LAIR OF THE GIANT CRAYFISH", but its level ends on the victory screen. The longest name that reaches this screen ("KREBSBACH - CREEK AND SPORTS FIELDS", 210 px) fits.
- [The film filter darkens the corners] → the portrait sits 14 px from the left edge with its light frame, and stays readable through the vignette, as on the victory screen.
- [The promo video records the tally screen] → only the layout changes. The promo tooling detects the state, not pixel positions.
