# Tasks

## 1. Pack files and the build

- [x] 1.1 Add `src/quotes/ride.txt` with the 14 current lines under `[kill]` (design §1, §4) and `quotes: ride` in `1_road.txt`. Teach `tools/build.py` to parse the packs, embed `QUOTE_PACKS` (template placeholder `{{QUOTES}}`) and run the checks (design §2). Add parser and check tests to `tools/test_build.py`. Verify with `python tools/build.py` and `python -m unittest tools/test_build.py`.

## 2. The Quotes module

- [x] 2.1 Add `Quotes` (design §3): `onKill(type)` from `damageEnemy` (not for the limo), `onStart()` after a level's intro (not on respawn), per-type sections, the cooldown, placement on foot and on the mofa with the overlap rules; remove `BUCK_LINES` and `Talk.buckKill`. Update the existing ride tests to read the pack; add the tests of design §5. Verify with `python tools/run_tests.py`, `--browser edge` and `--hash touch`.

## 3. Docs and checks

- [x] 3.1 Update the README (the quote packs: file format, sections, enemy type names, the level header, the build checks) and run the full checks: build, tests, `check_levels.py`, promo dry run and unit tests, `openspec validate buck-quote-packs --strict`.

## 4. Follow-up

- [ ] 4.1 You write quote packs for the other levels (or ask for starter packs), and play-check where the quotes appear.
