# Design

## Context

See proposal.md for the motivation. Current state:
- `BUCK_LINES` (14 Swiss German lines) in `src/cars.js`; `Talk.buckKill()` in `src/enemies.js` is called from the cars' `die()` (not for the limo), only on ride levels; it sets `Player.bubble` with a 3 s cooldown (`CONFIG.buckTalkCd`) and places it via `Talk.buckSpeaker()` (`Player.y - 6`, made for the mofa). `Talk.rects` / `Talk.say` already treat Buck's bubble as one of the ride's bubbles; `Talk.draw` draws it.
- Levels are `key: value` header + map segments, parsed by `tools/build.py` (`parse_level`) and embedded as `LEVEL_DATA` (placeholder `{{LEVELS}}` in `src/index.template.html`). The build already fails with clear errors for bad level data (ride map rules, unknown music track).
- Enemy types: `lawyer`, `cray`, `punk` (`src/enemies.js`), `suv`, `tesla`, `ferrari`, `limo` (`src/cars.js`); every kill goes through `damageEnemy` in `src/enemies.js`.
- The font's characters are the keys of `GLYPHS` in `src/font.js`.

## Goals / Non-Goals

**Goals:** quote packs as plain files; per-level packs; `start`, `kill` and `kill:<type>` events; one set of rules for showing quotes on foot and on the mofa; build-time checks; the ride's lines moved into a pack with no change in behaviour.

**Non-Goals:** writing packs for the other levels (they stay silent for now); other events (pickups, hurt); voice audio; changing the limo finale's fixed line.

## Decisions

### 1. Pack files
`src/quotes/<pack>.txt`, UTF-8:
```
; Buck on the mofa ride - Swiss German, dry
[kill]
SO, FERTIG.
UFGRUMT!
[kill:limo]          (not used: the limo has its finale)
[start]
HOPP, IS GLIS.
```
- `;` starts a comment line; blank lines are ignored; text is upper-cased by the game font anyway, the file is written in capitals for clarity.
- Section names: `start`, `kill`, `kill:<type>` with `<type>` one of the enemy types (`lawyer`, `cray`, `punk`, `suv`, `tesla`, `ferrari`, `limo`; the build keeps this list next to the music track list and a test checks it against `ENEMY_TYPES`).
- A pack may be empty (only comments) or have any subset of sections.

### 2. Build
- `tools/build.py` reads every `src/quotes/*.txt` into `{ pack: { section: [lines] } }` and embeds it as `QUOTE_PACKS` (new placeholder `{{QUOTES}}` in the template, next to `LEVEL_DATA`).
- Checks (each fails the build with `file:line: reason`): a line before any section; an unknown section or enemy type; a line longer than 20 characters; a character not in the font (the build reads the glyph keys from `src/font.js`); a duplicate line within a section. A level header `quotes: <pack>` naming a missing pack fails with the level file name.
- `tools/test_build.py` covers the parser and every check.

### 3. Runtime: a `Quotes` module (in `src/enemies.js`, next to `Talk`)
- `Quotes.pack()` → `QUOTE_PACKS[Game.level.quotes]` or null.
- `Quotes.onKill(type)`: called from `damageEnemy` when an enemy dies (replacing the call in the cars' `die()`); skipped for `limo` (its finale speaks). Lines from `kill:<type>`, else `kill`; cooldown `CONFIG.buckTalkCd` (3 s); the same "no room → stay quiet" rule as now.
- `Quotes.onStart()`: called when a level's intro ends and play begins (the transition `LEVEL_INTRO → PLAY/BOSS` in `Game.update`), not on respawn; shows a `start` line 0.6 s later (a short timer, cancelled if Buck dies or the level ends), ignoring the kill cooldown but setting it.
- Lines are picked with the existing `Talk.line(pool)` deck (no repeats until the section is used up).
- Placement: `Talk.buckSpeaker()` returns `Player.y - 6` on the mofa and `Player.y - 2` on foot (above the hero sprite's head); the overlap check against enemy, fan and (in the finale) ladies' bubbles is the same in every level. Off the ride, enemy bubbles stay one at a time (`Talk.say`), and they also keep clear of Buck's bubble.
- `BUCK_LINES` and `Talk.buckKill` are removed; the finale keeps its fixed "YOU HAVE NO CLUE".

### 4. Content
- `src/quotes/ride.txt`: the 14 current lines under `[kill]`; `1_road.txt` gets `quotes: ride`. No `start` section for now (the ride already opens with the biker song and the activists' cheers); the user can add one.
- No packs for the other levels; the README explains how to add one (create `src/quotes/<name>.txt`, add `quotes: <name>` to the level header, rebuild).

### 5. Tests
- Build (`tools/test_build.py`): parsing, sections, comments, every failing check, unknown pack in a level header, the enemy type list equal to the game's `ENEMY_TYPES` (read from the source).
- Game (`src/test.js`), with test packs injected into `QUOTE_PACKS` for the duration of a test:
  - the ride pack: ≥ 12 lines, the ride's car kill shows one of them, the cooldown (existing tests, now reading the pack);
  - a per-type section wins over `kill`;
  - a level without a pack: kills and start are silent;
  - `start`: a line about 0.6 s after the intro, once; none after a respawn;
  - on foot (a courts test map with a test pack): a lawyer kill shows a bubble above Buck's head that overlaps no other bubble;
  - the limo finale still says "YOU HAVE NO CLUE" and the limo kill draws no pack quote.

## Risks / Trade-offs

- [Quotes cover the action on foot] → the bubble sits above the head for 1.5 s, at most every 3 s; levels without packs are unaffected.
- [Pack edits break the build] → the errors name the file and line; that is the intent (no silent truncation in game).
- [Enemy type names drift] → a test compares the build's list with `ENEMY_TYPES`.
