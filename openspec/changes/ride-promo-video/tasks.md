# Tasks

## 1. Bridge and session

- [x] 1.1 Ride state in the bridge snapshot and `simulateHop` (design §2); per-step ride rows (`gas`, `brake`, `hop`, `fire`, `target`). Add the hop-mirror check to `tools/promo/tests/test_session.py` and extend `test_fairplay.py`. Verify with `python -m unittest discover -s tests -t .` (from `tools/promo`).
- [x] 1.2 `Session(first_reel=1)`, `record_promo.py --ride` and `--dry ride`, the ride run end (tally done + 2.5 s outro), the default file name and the ride limits in `check()` (design §1).

## 2. The ride agent

- [x] 2.1 `agent/ride.py` (design §3, §4): finale hands-off, threat dodge, Ferrari/Tesla contact, gap behind the X7, the limo fight, ramps and WD-40, gas by default; bursts of fire only with a target in line; reaction delays and throttle hold. Add `tests/test_ride.py` on synthetic snapshots. Verify with the unit tests and `python tools/promo/record_promo.py --dry ride`.
- [x] 2.2 Ride metrics and report (design §5, §6). Tune the agent until `--dry ride` (seed 1977) completes the ride within all limits; also try two more seeds and note the results.

## 3. Video, docs and checks

- [x] 3.1 Record `python tools/promo/record_promo.py --ride`; check the size (≤ 16 MB) and frames by eye (title poster, REEL 1 card, mid-ride fight, the limo, the finale with the ladies and Buck's reply, the tally). Update `.claude/skills/buck-promo-video/SKILL.md` and the README's promo section with the ride option. Run the full promo unit tests and `--dry all` (unchanged full run), `openspec validate ride-promo-video --strict`.

## 4. Review

- [ ] 4.1 You watch the ride promo and say what to change (pace, tactics, ending).
