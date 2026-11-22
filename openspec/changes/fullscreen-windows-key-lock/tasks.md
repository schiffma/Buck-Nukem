# Tasks

## 1. Fullscreen and Windows key lock

- [x] 1.1 Add `KeyF` → `"fullscreen"` to `KEYMAP`, the fullscreen toggle (request/exit, errors caught) handled in every game state, `fullscreenchange` handling that locks `["MetaLeft", "MetaRight"]` on enter (and unlocks on exit), the status note ("WINDOWS KEY LOCKED" / "FULLSCREEN (WINDOWS KEY NOT LOCKABLE HERE)") and ignoring Meta key events in the input handler. Add tests with stubbed Fullscreen and Keyboard Lock APIs: F requests fullscreen, lock called with exactly the two Meta keys and the locked note shown, F again exits and unlocks, no `navigator.keyboard` → "not lockable" note, Meta keydown/keyup leaves held fire untouched. Verify with `python tools/run_tests.py`.

## 2. Controls and docs

- [x] 2.1 Add "F FULLSCREEN" as an 8th line in the title controls box (grow the box by one line) and to the README controls table, with a note that the Windows key can only be locked in fullscreen in Chrome/Edge. Extend the title controls test. Verify with `python tools/run_tests.py` and a title screenshot.

## 3. Integration

- [x] 3.1 Run `python tools/build.py`, `python tools/run_tests.py`, `--browser edge`, `python tools/check_levels.py` and `openspec validate fullscreen-windows-key-lock --strict`; all pass. Then ask the user to check by hand in Chrome or Edge: press F, press the Windows key while holding fire, press Esc.
