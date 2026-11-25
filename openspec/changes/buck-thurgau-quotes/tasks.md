# Tasks

## 1. Quote content

- [x] 1.1 Create `src/quotes/thurgau.txt` with `[kill]`, `[kill:lawyer]`, `[kill:cray]` and `[kill:punk]` (design §2–§4), and add `quotes: thurgau` to the headers of `2_courts.txt`, `3_creek.txt`, `4_clubhouse.txt` and `5_boss.txt`. Verify with `python tools/build.py`: no pack errors, and the summary lists `thurgau` with its line count.
- [x] 1.2 Add the Thurgau car lines to the `[kill]` section of `src/quotes/ride.txt` under a comment, and update the header comment (design §4). Keep the old lines and `[finale]`. Verify with `python tools/build.py`.

## 2. Tests and docs

- [x] 2.1 Extend `src/test.js` (design §5): the levels name `thurgau`, section sizes, length and glyph checks for every pack, the ride's ≥ 24 kill lines with the old lines kept, and a lawyer kill on foot drawing a `kill:lawyer` line. Verify with `python tools/run_tests.py`, `--browser edge` and `--hash touch`, all green.
- [x] 2.2 Update `README.md` (Buck's Thurgau lines on foot, the ride's added lines, the `thurgau` pack under Quote packs). Then run the full checks: `python -m unittest tools/test_build.py`, `python tools/check_levels.py` and `openspec validate buck-thurgau-quotes --strict`.

## 3. Review

- [ ] 3.1 Play-check one level on foot and the ride. You review the dialect and tone of the lines in `src/quotes/thurgau.txt` and `ride.txt`, and adjust the wording as needed (it needs only a rebuild).
