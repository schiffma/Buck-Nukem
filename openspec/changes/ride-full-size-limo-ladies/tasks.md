# Tasks

## 1. No tiny runners

- [x] 1.1 Remove the bail-out runners, the president's runner, `Cars.runners` and the tiny sprites (design §1); the vehicles screenshot without them. Update the tests that expect runners; add: no runners after destroying each car kind and the limo, wrecks still burning. Verify with `python tools/run_tests.py`.

## 2. Full-size posh ladies

- [x] 2.1 Add the posh fan style (design §2): `FAN_VARIANTS_POSH` (pink, white) and the `stand`, `climb`, `walk1`, `walk2` frames in `buildFanFrame`, not used by the background fans. Add tests: 20 × 32 like the fans, distinct variants, all four frames. Verify with `python tools/run_tests.py` and a sprite screenshot.
- [x] 2.2 The finale with the full-size ladies (design §3): climb-out at their turn, standing for their lines, stomping off at the end until off screen; `CONFIG.finale.stomp`. Update the finale tests; add the size, order and walk-off checks (design §4). Verify with `python tools/run_tests.py` and `#shot=finale` screenshots at 1.2, 2.5 and 5.5 s.

## 3. Docs and checks

- [x] 3.1 Update the README (no runners; the ladies climb out at fan size and stomp off) and run the full checks: build, tests (Chrome, Edge, touch), `check_levels.py`, `perf_phone.py`, promo dry run and unit tests, `openspec validate ride-full-size-limo-ladies --strict`.

## 4. The ladies stay and complain (revision 2)

- [x] 4.1 A `[finale]` section for quote packs (design §7): `tools/build.py` accepts it, `tools/test_build.py` covers it, `src/quotes/ride.txt` gets at least 6 dry Swiss German finale lines, and `Quotes.finaleLine()` replaces "YOU HAVE NO CLUE" in the scene. Add the reply tests (design §8). Verify with `python tools/test_build.py` and `python tools/run_tests.py`.
- [x] 4.2 The ladies stay (design §5): remove the walkers, `stomp` and the walk frames; add the `scold` frame; `Mofa.ladies` outlasting the scene, facing Buck, kept on respawn, cleared on level load. Replace the walk-off test with the stay test. Verify with `python tools/run_tests.py`.
- [x] 4.3 Complaining after the scene (design §6): at least 12 `LIMO_FINALE_LINES` aimed at Buck, nagging every 2–3 s in turns while on screen, within the ride's bubble rules. Add the nagging and line tests. Verify with `python tools/run_tests.py` and `#shot=finale` screenshots at 3.5 and 7 s.
- [x] 4.4 Update the README (the ladies stay and complain; Buck's Swiss German reply; the `[finale]` section in "Quote packs") and run the full checks: build, tests (Chrome, Edge, touch), `check_levels.py`, `perf_phone.py`, promo dry run and unit tests, `openspec validate ride-full-size-limo-ladies --strict`.

## 5. Play test

- [ ] 5.1 You play the ride's end: the ladies' size and look, the climb-out, their complaints after the scene and Buck's Swiss German reply.
