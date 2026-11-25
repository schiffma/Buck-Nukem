# Tasks

## 1. Pack section and lines

- [x] 1.1 Accept `[complete]` in `tools/build.py` and add parser tests to `tools/test_build.py` (`[complete]` parses, `[complete:x]` fails). Add the 14 `[complete]` lines to `src/quotes/thurgau.txt` and `src/quotes/ride.txt` (design §3, §4). Verify with `python -m unittest tools/test_build.py` and `python tools/build.py`, where the pack counts grow by 14 each.

## 2. The screen

- [x] 2.1 Add `Quotes.completeLine()`. In `completeLevel()`, store the line in `Game.tally.quote` and clear the screen smoke, and update the smoke in `Game.update` during `LEVEL_COMPLETE` (design §2, §3). Verify that `Game.tally.quote` is a `[complete]` line after `completeLevel()` on the courts (a test in 3.1).
- [x] 2.2 Rework `Screens.levelComplete()`: the layout of design §1, the framed portrait, the cigarette and ember, the smoke particles, and the bubble once `t.done`. Tune the cigarette by eye on a 4× screenshot of the screen (save it to the scratchpad). Verify visually with `python tools/run_tests.py` and a screenshot of the screen in keyboard and touch mode.

## 3. Tests and docs

- [x] 3.1 Add the tests of design §5 to `src/test.js`. Verify with `python tools/run_tests.py`, `--browser edge` and `--hash touch`, all green.
- [x] 3.2 Update `README.md` (the level-complete screen with the smoking Buck, and the `[complete]` section under Quote packs). Run `python tools/check_levels.py` and `openspec validate level-complete-buck-smokes --strict`, and rebuild `dist`.

## 4. Fix: the cigarette in the mouth

- [x] 4.1 Move the cigarette's filter end to the middle of the mouth (design §2): `LC_LAYOUT.mouth` (39, 50) and `LC_CIG.len` 9, slanting 1 px down per 3 px. Add a test that the filter pixel lies in the lip zone (portrait x 34–44, y 50–53) and the ember lies left of the left moustache droop (x < 32). Update the existing cigarette and smoke checks if needed. Verify with a 6× crop of `python tools/screenshot.py ... "complete,1,40,13,30,200"` saved to the scratchpad and compared with candidate E, then run `python tools/run_tests.py`, `--browser edge` and `--hash touch` (all green), rebuild `dist`, and run `openspec validate level-complete-buck-smokes --strict`.

## 5. Fix: higher cigarette, realistic smoking

- [x] 5.1 Move the filter end to the lip line (design §2): `LC_LAYOUT.mouth` (38, 47), `LC_CIG` length 10, 1 px down per 4 px. Change the lip-zone test to portrait x 31–44, y 46–48, and the ember test to x < 30. Verify with a 6× crop of `python tools/screenshot.py <scratchpad>/lc_p.png "complete,1,40,13,30,200,nofilm"` compared with candidate P.
- [x] 5.2 Replace the smoke with the side-stream wisp and the drag cycle (design §2): a continuous swaying wisp with alpha, the ember brightening on a drag, and an exhale from the mouth line about 0.4 s later. Particles stay inside the portrait. Tests: (a) over 3 s the wisp has particles every frame and is drawn with alpha below 1; (b) within 7 s at least one drag happens, with a brighter ember, followed by exhale particles that start on the mouth line (portrait y 47–49) and move left; (c) no particle is drawn outside the portrait. Verify with a 3-frame strip of screenshots (`complete,...,90` / `...,130` / `...,160`) saved to the scratchpad and checked by eye, then run `python tools/run_tests.py`, `--browser edge` and `--hash touch` (all green), rebuild `dist`, and run `openspec validate level-complete-buck-smokes --strict`.

## 6. Review

- [ ] 6.1 You play through a level to its end, and check the cigarette, the smoke, the layout and the wording of the winning lines.
