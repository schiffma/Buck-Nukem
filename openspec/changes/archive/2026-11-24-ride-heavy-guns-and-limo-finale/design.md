# Design

## Context

See proposal.md for the motivation. Current state (after the archived `mofa-ride-level`):
- `src/ride.js` builds the mofa sprite (`MOFA_SPR_W` 42 × `MOFA_SPR_H` 26) and draws Buck (`SPR.mofa.rider`, his hero sprite in a riding pose) on it; the guns are `drawMofaGun(MOFA_BARREL)` (7 + 7 px), front at `MOFA_GUN_X`, rear at `MOFA_REAR_X/Y`; shots start at the barrel tips. The player box on the ride is `CONFIG.mofaW` 28 × `mofaH` 30.
- `Mofa.fire` fires a volley (front and rear) at `CONFIG.mofaRate` 10, one `mg` sound per volley; `mg` is a 40 ms noise crack + a 160→50 Hz sine thump + a click.
- Cars and the limo are `ENEMY_TYPES` built by `carType()` in `src/cars.js`, with hit points from `CONFIG` (`suvHp` 12, `teslaHp` 8, `ferrariHp` 6, `limoHp` 30). The limo's death (`GORE_BY_TYPE.limo.die`) spawns the president and the two ladies as runners (`Cars.runners`, `SPR.ladyRun`).
- Speech bubbles: `Talk` (enemies, `e.bubble`, `Talk.rect` / `Talk.rects`), fans' own layout; on the ride up to two car bubbles that never overlap each other or fan bubbles.
- The font (`src/font.js`, `GLYPHS`) has A–Z, digits, punctuation and ♥, no umlauts.

## Goals / Non-Goals

**Goals:** a small mofa under a full-size Buck; big, heavy-sounding guns; dry Swiss German kill lines; a short, skippable finale scene at the limo; tests for each.

**Non-Goals:** Buck talking on foot in the other levels; changing car sizes; voice samples.

## Decisions

### 1. Mofa at 75%, Buck unchanged
- The mofa sprite layout is drawn on its existing 42 × 26 grid and scaled to 75% at sprite build time (32 × 20, nearest-neighbour with the outline re-applied), so the art keeps its details; `MOFA_SPR_W/H` become the scaled size, and the seat, gun and rear mount positions scale with it.
- Buck's rider sprite is unchanged; his seat height follows the smaller mofa so his hips sit on the seat (his feet hang lower beside the small frame, which is the joke).
- Player box: `mofaW` 28 → 22 (the moped is narrower), `mofaH` stays 30 (Buck is as tall as before). The level checker reads these from `CONFIG`, so hop and ramp reach stay checked.

### 2. Heavy WW2 guns
- `drawMofaGun` draws a heavy MG: a 7 px receiver with a feed box, a 10 px barrel inside a perforated jacket (dark with light holes every 2 px), a wide flash hider; about 17 × 7 px instead of 14 × 6. The rear gun mirrors it. Muzzle flashes grow to 7 × 7 with a star shape.
- `CONFIG.mofaRate` 10 → 8. Damage per shot stays 1; the hit counts drop 20%: `suvHp` 10, `teslaHp` 6, `ferrariHp` 5, `limoHp` 24 (the X7, Tesla and Ferrari each die in the same time as before; the spec's numbers follow).
- The `mg` sound becomes a .50 cal report: a sine thump 110 → 40 Hz (0.12 s, louder), a band-passed noise crack (25 ms), a lowpassed noise "boom" body (0.08 s), and a quieter echo copy of the crack and body 0.11 s later through a lowpass (the tail ends by 0.3 s); pitch ±6% per volley.

### 3. Buck's Swiss German one-liners
- Font: three new glyphs Ä, Ö, Ü in the 5 × 7 style (the letter with two dots above, inside the glyph cell); `FONT_CHARS` picks them up, so the existing "drawable" checks work.
- `BUCK_LINES` (≥ 12, ≤ 20 characters, Swiss German, dry, not explicit), e.g. "SO, FERTIG.", "UFGRUMT!", "GÄLL, DAS HET GSESSE", "CHASCH VERGÄSSE.", "TSCHÜSS ZÄMME!", "FERTIG LUSCHTIG.", "DAS ISCH ERLEDIGT.", "ZACK, UND WÄG.", "HOPP, WIITER!", "NÜT FÜR UNGUET.", "SO GAHTS HALT.", "GHÖRT ALLES ZUM JOB", "BIS GLII, GELL.", "SCHO WIEDER EINE."
- When a car's `die()` runs on the ride, Buck speaks if 3 s have passed since his last line: `Player.bubble = { text, t: 1.5 }`. The bubble is drawn above Buck through the same rectangle logic as `Talk` (a `Talk.rect`-style box over the player) and joins the overlap check: it counts as one of the ride's bubbles; if it would overlap, the car bubble wins and Buck stays quiet (his line is a bonus, not a guarantee).

### 4. The limo finale (a small scene state in `Mofa`)
- On the limo's death: the explosion and points as now; the president runs off as now; instead of the ladies' runners, `Mofa.finale` starts: `{ t: 0, ladies: [...] }` and `Player.locked = true` (no gas, fire, jump; `hurt` ignored); pending car spawns are cleared and the remaining triggers ahead of the gate are dropped.
- Timeline (seconds): 0.0 the mofa rolls to a stop (normal coasting, brakes applied); 0.6 lady 1 crawls out of the wreck (a 2-frame crawl sprite moving 12 px/s away from the car, hat askew), bubble at 0.9 ("MY DRESS! IT'S DIOR!" etc. from `LIMO_FINALE_LINES`); 1.8 lady 2 crawls out, bubble at 2.1; 3.2 Buck's bubble "YOU HAVE NO CLUE"; 3.8 he lights the cigarette (a lighter flame for 0.4 s at his hand, then the cigarette glows); 4.2 first puff; 5.0 the scene ends: `locked` off, the ladies get up and run off (the existing `ladyRun` runners), the gate is open.
- Skip: Fire or Jump pressed after 0.3 s jumps to the end state (ladies running, cigarette lit, control back).
- Cigarette: `Player.cigarette = true` for the rest of the ride: a 3 px white stick with an orange glowing tip at Buck's mouth in `Mofa.draw`, and a grey puff (`FX.parts`, `smoke`) rising every ~1.1 s; cleared when the level ends.
- `LIMO_FINALE_LINES` (posh, arrogant, ≤ 20 characters): "MY DRESS! IT'S DIOR!", "CALL MY HUSBAND!", "MY NAILS! MY NAILS!", "THIS IS AN OUTRAGE!", "WHO IS YOUR LAWYER?", "I'LL HAVE YOU FIRED!"; each lady takes a different one.

### 5. Tests
- Sizes: the mofa sprite about 32 px long (75% ± 1 px), Buck's rider sprite the same size as before, gun sprites ≥ 14 px long; the player box 22 × 30; the level checker still OK.
- Rate and hits: 8 volleys per second (≥ 8 shots each way in 1 s at 8/s), hit points 10 / 6 / 5 / 24, a car killed in the same time as before (within one volley).
- Sound: the `mg` event schedules a low thump (start frequency ≤ 120 Hz) and an echo within 0.3 s (stubbed audio context recording oscillator and noise calls).
- One-liners: ≥ 12 lines, ≤ 20 characters, drawable (with Ä, Ö, Ü), not explicit; a kill shows Buck's bubble; a second kill within 3 s shows none; the umlaut glyphs have dots (pixels above the letter body).
- Finale: on the limo's death, control is locked, two crawling ladies appear by 2 s, their bubbles and Buck's "YOU HAVE NO CLUE" appear in order, the cigarette is lit by 4.5 s, no damage taken during the scene, control returns by 5.2 s, the ladies run, the gate is open, the god-mode play-through still reaches the tally; Fire skips the scene.
- Existing tests that pin the old numbers (rate 10, hit counts, mofa size, mg length ≤ 0.1 s, `ladyRun` immediately on death) are updated.

## Risks / Trade-offs

- [The smaller hitbox makes the ride easier] → it is 6 px narrower out of 28; the heavier guns' lower rate balances; the user plays it.
- [Downscaled mofa art loses detail] → the layout stays on its 42-wide grid and scales once with the outline re-applied; a screenshot check.
- [Swiss German spelling] → Mundart has no fixed spelling; the lines use common Zurich/Bernese forms; the user can correct them.
- [A paused scene annoys on replays] → 5 s, skippable after 0.3 s.
- [Promo agent] → the promo starts at reel 2, so the ride changes don't affect it; a dry run confirms.
