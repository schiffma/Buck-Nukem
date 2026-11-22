# Proposal

## Why

Players and testers can't tell which build of Buck Nukem they are running. The playable page on GitHub Pages and local copies can differ, and releases are now git tags (v1.0.0, v1.0.1, v1.0.2). Separately, the boss fight happens on a single screen with two small ledges. Buck mostly stands still and trades shots, so the finale is the least tactical part of the game.

## What Changes

- **Version on the title screen:** the build reads the version from git, in `git describe` style: `v1.0.2` on a tagged release, and `v1.0.2-3-gab12cd3` or `…-dirty` for builds between releases. Changes under `dist/` don't count. The build embeds this text in the HTML, and the title poster shows it in small print. Without git, the build falls back to `v` plus the `VERSION` file.
- **Wider boss arena:** the arena grows from 20 × 15 tiles (one screen) to 40 × 15 tiles (two screens), and the camera scrolls. Buck starts on the left and the boss holds the right end.
- **Platforms on several levels:** the arena gets one-way platforms at three heights plus ladders. Buck can rise above the floor shockwave, sidestep bubble arcs and shoot the boss's face from different heights. Health spots and fans move onto the new layout: 4–5 fans, as the spec already requires.
- **Cover crates:** there are two new map tiles:
  - a sturdy crate that can't be destroyed
  - a breakable crate that falls apart after enough hits from Buck's blades or the boss's shockwaves

  Crates are solid. They stop the claw-slam shockwave and bubbles, and Buck can kneel behind one or stand on top of it. When the boss summons minions, they appear inside the visible part of the arena, left of the boss.
- Tests, the level checker and the promo agent's boss behaviour are updated for the new arena. The promo agent must still win the fight.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `game/presentation`: the title screen shows the build version.
- `game/gameplay`: new requirements for the boss arena layout (40 tiles wide, three platform heights) and for cover crates.
- `game/enemies`: boss attacks interact with cover: crates stop the shockwave and wear down breakable crates, and minions are summoned within view.
- `game/distribution`: the build embeds the git-derived version text, and reproducibility is kept.

## Impact

- `tools/build.py`: version lookup (`git describe` plus the dist exclusion, with `VERSION` as the fallback), passed to the game through `ASSETS_META`.
- `src/screens.js`: draws the version on the title.
- `src/levels/4_boss.txt`: the new 40 × 15 map.
- `src/level.js`: crate tiles (`D` sturdy, `d` breakable), their solidity, drawing, hit points and breaking.
- `src/enemies.js` and `src/boss.js`:
  - the shockwave is stopped by solid tiles, and damages breakable crates
  - hero shots damage breakable crates
  - minions spawn on screen
- `src/fx.js` and `src/audio.js`: splinters and a crate-break sound.
- `src/test.js`: arena size check (40 × 15), crate, version and boss-layout tests.
- `tools/check_levels.py`: crates count as solid.
- `tools/promo/`: the boss behaviour uses the platforms and the crate cover, and the bridge snapshot includes crates.
- `README.md`: map legend (`D`, `d`), the boss arena description and where the version appears.
