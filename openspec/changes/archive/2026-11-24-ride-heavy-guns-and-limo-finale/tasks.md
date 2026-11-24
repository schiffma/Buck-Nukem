# Tasks

## 1. Small mofa, big guns

- [x] 1.1 Draw the mofa at 75% (design §1): the sprite scaled at build time with the outline re-applied, `MOFA_SPR_W/H` and the seat, gun and rear-mount positions scaled, Buck's rider sprite unchanged with his seat height adjusted; `mofaW` 22. Add tests: the mofa about 32 px long, the rider unchanged, the player box 22 × 30. Verify with `python tools/run_tests.py`, `python tools/check_levels.py` and `python tools/screenshot.py` (vehicles, a ride scene).
- [x] 1.2 Heavy WW2 guns (design §2): the bigger gun sprite (perforated jacket, flash hider, ~17 × 7) front and rear, the shot origins at the new muzzles, bigger muzzle flashes; `mofaRate` 8; hit points `suvHp` 10, `teslaHp` 6, `ferrariHp` 5, `limoHp` 24. Update the tests that pin the old rate and hit counts; add: guns ≥ 14 px, 8 volleys per second, kill times as before. Verify with `python tools/run_tests.py` and a screenshot.
- [x] 1.3 The .50 cal `mg` sound (design §2): thump, crack, boom body, echo; pitch ±6%. Add a test with a stubbed audio context: a low thump (≤ 120 Hz) and an echo within 0.3 s per volley. Verify with `python tools/run_tests.py`.

## 2. Buck's Swiss German lines

- [x] 2.1 Add the glyphs Ä, Ö, Ü to the font (design §3) with a test (dots above the letter body, same cell size).
- [x] 2.2 `BUCK_LINES` and Buck's bubble on a car kill (design §3): at most one per 3 s, in the bubble layout without overlaps. Add tests: the line rules (≥ 12, ≤ 20 characters, drawable, not explicit), a kill shows a line, a second kill within 3 s none, no overlap with car or fan bubbles. Verify with `python tools/run_tests.py`.

## 3. The limo finale

- [x] 3.1 The finale scene (design §4): `Mofa.finale` with the timeline, `Player.locked`, the ladies' crawl sprite and `LIMO_FINALE_LINES`, Buck's "YOU HAVE NO CLUE", the lighter and the cigarette, skip with Fire or Jump, no damage, spawns and corks stopped; the ladies run off at the end; the cigarette and its puffs until the level ends. Add tests (design §5: lock, crawl, bubble order, cigarette by 4.5 s, no damage, control back by 5.2 s, skip, gate open, god-mode play-through reaches the tally) and a screenshot mode `#shot=finale,<t>`. Verify with `python tools/run_tests.py` and screenshots at 1.0, 2.5 and 4.5 s.

## 4. Docs and checks

- [x] 4.1 Update the README (the small mofa, the heavy guns, the hit counts, Buck's Swiss German lines, the limo finale) and run the full checks: build, tests (Chrome, Edge, touch), `check_levels.py`, `perf_phone.py`, promo dry run and unit tests, `openspec validate ride-heavy-guns-and-limo-finale --strict`.

## 5. Play test

- [ ] 5.1 You play the ride: the look of the small mofa and the big guns, the heavy gun sound, Buck's Swiss German lines (spelling), the limo finale; and say whether the difficulty still fits.
