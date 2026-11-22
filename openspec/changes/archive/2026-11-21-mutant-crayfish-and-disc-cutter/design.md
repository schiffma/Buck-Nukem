# Design

## Context

- **Small crayfish** (`src/sprites.js`): `CRAY1`/`CRAY2` are 24×12 character-grid rows using palette keys `c` (#c84828), `C` (#7e2614), `k`, plus slime `Y`; `spriteFromRows` + `makeSet` build right/left/flash variants and add the dark 1-px outline (the "outlines" test in `src/test.js` checks every sprite edge pixel borders an outline). Enemies use `SPR.cray[anim % 2]` (`src/enemies.js`); hitboxes are set in the enemy type, not from the sprite size.
- **Boss** (`src/boss.js`): drawn procedurally each frame by `drawBody`/`drawArm`/`drawClaw` with `pxEllipse`/`rect` in a palette object `C` (shell, shell2, hi, head, leg, eye; all white while flashing). Hitboxes come from `face()`, `shell()`, `claws()`, independent of the drawing. It is drawn into off-screen layers (`bossLayers`) to add an outline.
- **Weapons** (`src/player.js` `fire()`): `weapon` is `"blaster"` or `"mega"`; shots are plain objects in `Game.shots` with `img`, `vx`, `dmg`; `respawn()` resets to `"blaster"`; the Mega pickup sets `"mega"` (`src/main.js`). Boss deflection is handled where shots meet boss boxes. HUD (`src/hud.js`) shows the icon and name for blaster/mega.
- **Config** (`src/config.js`): `fireRate 5`, `shotSpeed 260`, `shotDmg 1`, `shotDmgUp 2`, `bossHp 50`.
- Reference photo: [crayfish_reference.png](crayfish_reference.png) in this change folder: a real crayfish seen from above, dark red-brown (sampled #48241a / #5d372a / #785141) with glossy highlights, pale bluish-white claw tips and joints, smooth carapace with a cervical groove and pointed rostrum, 6 tail segments and a tail fan, huge heavy claws.
- Current state of this change: the first, rejected look is implemented (28×14 red/blue `CRAY1`/`CRAY2` with palette keys `a`/`A`/`i`/`x`; boss `splitEllipse` shell, blue spikes and claw edges, `drawGlow` DNA helix/molecules with `Boss.noGlow`; `FX.glow` motes emitted by small crayfish; tests "blue back above, red belly below", "emits blue glow particles", "pulsing blue DNA glow", "shell split lengthwise"). The disc cutter is implemented and stays.

## Goals / Non-Goals

**Goals:**
- Recognisably the reference crayfish, seen side-on, at 32×14 px (small) and ~150 px (boss): red-brown glossy armour, rostrum, segmented tail and fan, heavy claws with pale tips, thin legs, long antennae. Red only.
- A satisfying disc cutter that changes only the boss arena.
- Gameplay of the crayfish unchanged (hitboxes, HP, speed, AI).

**Non-Goals:**
- No change to the boss's attack patterns, health bar rules or the face-only damage rule.
- No disc cutter outside the arena, no new pickup.
- No top-down drawing: the photo is a top view, but the game is side-on, so its anatomy and colours are translated into profile.
- No glow or other 'mutant' effects.
- No bitmap import of the reference picture; everything stays procedural pixel art (single-file build, consistent style).

## Decisions

### 1. Small crayfish: 32×14 side-view rows in a red-only palette
Widen the frame to 32×14 (in a 28 px frame the antennae could reach only 7 px in front of the eye, less than the required half body length) and redraw it in profile after the photo, facing right: tail fan at the back (x 0–3), 5–6 tail segments separated by darker ring lines and slightly overlapping like the photo, a smooth domed carapace with a cervical groove and a pointed rostrum, a dark eye, two long thin antennae sweeping forward and up, thin walking legs (alternating per frame), and a big heavy claw held forward (palm + two fingers, slightly open) with pale tips. Palette (replacing `a`/`A`/`i`/`x`), sampled from the photo and pushed a little redder so it reads on the bright backgrounds: base `c` #8c2c1c, shadow `C` #561810, highlight `x` #b84a32, glossy sheen `i` #e0806a (1-px reflections on carapace and claws), pale claw tip `e` #e8c8b0 (existing), legs/antennae in `C`. Slime drips are dropped (not in the photo). The sprite is designed with the small generator script used for the first version (rows → preview PNG) and pasted into `src/sprites.js`; the hitbox stays as defined in `src/enemies.js` and the sprite stays centred on it.

### 2. Boss: same geometry, realistic red shading
Keep `drawBody` geometry and hitboxes. Replace `splitEllipse` with plain red shading: glossy red-brown carapace (`#8c2c1c` base, darker `#561810` lower half shading, sheen highlights `#e0806a` as a curved band along the top), a cervical groove line, segment lines on the tail that overlap like plates, a tail fan in two shades, heavy claws with dark joints and pale tips `#e8c8b0`, a pointed rostrum between the eye stalks, and two long thin antennae (keep the 60 px swaying arcs). The blue spikes and claw edges are removed. Flash-white and the enraged red eyes stay.

### 3. Remove the glow effects
Delete `Boss.drawGlow`, `Boss.noGlow`, `FX.glow`, `GORE.glow`, `GORE.maxGlow`, the crayfish `glowT` emission and the blue entry in `GORE.shell`. Tests: replace the blue-split and glow tests with (a) a red-only pixel check on both crayfish frames and a rendered boss frame, (b) an anatomy check on the small sprite (tail segment lines, front claw size, legs, forward antennae), (c) "no glow" checks (no `glow` particles after one second of a crayfish on screen; no pixels around the boss that change when only the boss body is hidden). The boss-arena performance test stays.

### 4. Disc cutter as a third weapon value
`Player.weapon = "cutter"`:
- Set in `Game.loadLevel` when the level is the boss arena, and in `Player.respawn()` when `Game.level.isBoss` (instead of resetting to blaster). The Mega pickup cannot occur in the arena.
- `fire()` branch: `fireRate` `CONFIG.cutterRate` (2.5/s), speed `CONFIG.cutterSpeed` (190 px/s), `dmg` `CONFIG.cutterDmg` (3), sprite `SPR.sawBlade` (14×14, 4 rotation frames chosen from `Game.time`), spawned at the cutter's disc, vertical position so the blade spans from shot height down to the hero's knees (reaches ground-level crayfish).
- Deflection reuses the existing shell/claw deflect path, plus extra sparks (`FX.spark`) and a metallic "clang" (`deflect` sound reused).
- Hero sprite: new frames where the gun is replaced by a disc cutter (motor body + large grey disc with a guard), built from the existing hero frames by swapping the gun overlay rows; the outline test includes them.
- HUD: `SPR.cutterIcon` + "DISC CUTTER" in orange.
- Sound: new `"grinder"` effect (sawtooth sweep up + band noise, ~0.25 s).
- Boss HP stays 50: with 3 damage per blade the fight is roughly a third as long in hits. This is intended (the finale weapon should feel powerful); the enraged phase still triggers at half health.
*Alternative:* boomerang blades that bounce off walls. Rejected for now: harder for players and for the promo autopilot to reason about; can come later.

### 5. Tests
- Sprites: red-only check (no blue-dominant pixels) on both `SPR.cray` frames and a rendered boss frame; anatomy check on `SPR.cray[0]` (≥ 3 tail segment lines, front claw ≥ 1/4 body length, legs below the body, forward antennae ≥ 1/2 body length); outline test covers both crayfish frames and the hero cutter frames.
- No glow: no `glow` particles after a crayfish has been on screen for 1 s; nothing is drawn around the boss beyond its outlined body.
- Gameplay: weapon switch on arena start, fire rate ≤ 3/s, blade size ≥ 12 px and spin frames, face hit = 3 damage, shell hit = 0 damage + deflect sparks, blade hits a ground crayfish, cutter kept after respawn in the arena, blaster in regular levels (all implemented).
- The existing boss, crayfish, flow and performance tests keep passing.

## Risks / Trade-offs

- [Wider crayfish sprite looks offset from its hitbox] → centre the frame on the hitbox and check with the `sprites` screenshot and in play.
- [Dark red-brown crayfish blend into the red toxic creek water and the brown earth tiles] → dark outlines stay, glossy sheen pixels add contrast; check legibility in creek and boss-arena screenshots and lighten the base red if needed.
- [A realistic look at 32×14 reads as a blob] → keep strong silhouette cues (claw, tail fan, antennae) and compare against the photo at 4× scale before pasting the rows.
- [Boss fight becomes too short/easy] → measure with the flow test and a dry run; if it drops below ~20 s of play, raise `bossHp` (config only, no spec change).
- [Promo autopilot timings] → the JS autopilot's boss mode keys on the claws, not on weapon stats; verify with `python tools/promo/record_promo.py --dry 3`. The planned `python-promo-autopilot` change must account for the cutter's fire rate.
