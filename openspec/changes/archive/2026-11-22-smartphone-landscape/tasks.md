# Tasks

## 1. Shared input sources

- [x] 1.1 Refactor `src/input.js` so each held action records the set of sources holding it (`"kb"`, `"sim"`, `"t<pointerId>"`), all going through one `Input.set(action, source, isDown)`:
  - the edge is set when the set goes from empty to not empty
  - `Input.simulate` keeps its signature and behaviour
  - blur releases only `"kb"`
  - `Input.reset()` clears everything

  Add tests in `src/test.js`: key and simulate hold the same action, and the action is released only after both let go; `simulate` edge semantics are unchanged; blur leaves simulated holds alone. Verify with `python tools/run_tests.py` (whole suite still green) and `python tools/promo/record_promo.py --dry 0` (`victory`/level completed, no `PAGE ERROR`).

## 2. Touch mode and layout

- [x] 2.1 Create `src/touch.js` with the `Touch` object, and add it to `JS_ORDER` in `tools/build.py` after `input.js`.
  - `Touch.init()` detects touch mode: a coarse pointer with no hover, a `touch` hash parameter, or the first `pointerType === "touch"` pointerdown. It is called from `boot()` in `src/main.js`.
  - `Touch.enable()` turns touch mode on and is used by the tests.

  Add tests for hash parsing (`#touch`, `#debug&touch`, `#level=3&touch`, and `#untouched` stays off) and for touch mode being off by default in the headless runner. Verify with `python tools/build.py` and `python tools/run_tests.py`.
- [x] 2.2 Implement the pure `touchLayout(vw, vh, insets)` in `src/touch.js` (design §4), including reading the safe-area insets through a probe element. Add tests for each viewport from the specs: 844×390 with 47 px insets, 932×430, 1024×768. Check:
  - the picture is 4:3 and centred in the safe box
  - both bars are at least 120 px wide
  - no control overlaps the picture
  - the action buttons are at least 56 px across

  Verify with `python tools/run_tests.py`.
- [x] 2.3 Add fractional scaling in touch mode to `resizeScreen()` in `src/render.js` (design §5): backing store at `devicePixelRatio`, `#screen` positioned at the picture rect, smoothing off, `displayScale` in device pixels for `present()`. Add tests:
  - forced touch at 844×390 gives a scale above 1 and the expected canvas CSS rect
  - with touch mode off at 1280×1000 the canvas is still 1280×960, centred, exactly as before

  Verify with `python tools/run_tests.py` and with `python tools/run_tests.py --size 844,390`.
- [x] 2.4 Update `src/index.template.html` (design §10): the viewport meta, the touch, selection and overscroll CSS with `100dvh`, and the `#pad` canvas, hidden unless touch mode is on. Verify that the desktop title and level screenshots from `python tools/screenshot.py` are pixel-identical to the ones before the change, and that `python tools/build.py` passes (size well under 2 MB).

## 3. On-screen controls

- [x] 3.1 Draw the controls on `#pad` in the pixel style (design §3): D-pad, Jump, Fire, Pause, Mute, Film, and Fullscreen only when `document.fullscreenEnabled`. Draw a rest look and a pressed look, and show the mute and film state. Redraw only on change. Add `--hash` to `tools/run_tests.py` and a `touch` flag to `tools/screenshot.py` that captures the full window. Verify with a 844×390 touch screenshot of the title and of level 1, checked by eye: the controls sit in the bars, nothing covers the picture, and the pixels are sharp.
- [x] 3.2 Implement pointer handling (design §6):
  - capture each pointer
  - the pad uses 8 sectors with a dead zone, slides between directions, and keeps the last direction off the pad
  - the action group slides between Jump and Fire
  - utility buttons act on release inside the button
  - `pointercancel` and `pointerup` release only that finger's sources
  - `contextmenu` calls `preventDefault`

  Add tests with synthetic `PointerEvent`s (`pointerType: "touch"`) dispatched at the layout's control centres:
  - pad right → hero walks right
  - slide right → left switches in one step
  - down-right holds both actions
  - Fire held for 1 s → fire-rate shots
  - short versus held Jump → lower versus higher apex
  - three fingers: run, fire and jump together
  - pad Down + Jump on a one-way platform → drops through
  - cancel releases only its finger
  - Pause, Mute and Film buttons act like P, M and G
  - the pressed look is shown while held

  Verify with `python tools/run_tests.py --size 844,390 --hash touch`.
- [x] 3.3 Wire the Fullscreen button to `Fullscreen.toggle()` plus `screen.orientation.lock("landscape")`, with errors caught, and skip the Windows-key lock and its notes in touch mode. Add tests with stubbed Fullscreen and Orientation APIs: the button requests fullscreen and the landscape lock; without the API the button is hidden; no "WINDOWS KEY" note in touch mode. Verify with `python tools/run_tests.py`.

## 4. Menus, texts and audio

- [x] 4.1 Make a tap on the picture press `enter` in every state except PLAY and BOSS (design §6). Add tests:
  - a tap on the title starts a game
  - a tap skips a reel card
  - a tap fills and continues the level tally
  - a tap leaves the game-over and victory cards
  - a tap during play does not pause
  - a tap while paused resumes

  Verify with `python tools/run_tests.py --hash touch`.
- [x] 4.2 Add `promptText(kind)` and `titleControls()` to `src/screens.js`, with the touch strings from the presentation delta and the touch controls list (design §7). Leave the desktop strings unchanged. Extend the title, version, start-note and prompt tests to run in both modes, checking that the texts are present, inside the screen and don't overlap. Verify with `python tools/run_tests.py` and with `python tools/run_tests.py --hash touch`, plus a touch title screenshot.
- [x] 4.3 Call `Input.anyKeyListeners` on the first touch `pointerdown` and the first touch `pointerup`, and make `Sound.unlock()` call `resume()` on a suspended context. Add a test that a synthetic touch on the title creates the audio context and starts the title music. Verify with `python tools/run_tests.py --hash touch`.

## 5. Portrait and hidden page

- [x] 5.1 Show the portrait card on `#pad` ("TURN YOUR PHONE" and the rotating-phone icon, controls hidden) when `vh > vw` in touch mode. Pause PLAY or BOSS on portrait and on `visibilitychange` to hidden, and release all touch sources when hidden. Add tests:
  - in touch mode a portrait resize during play → card shown and state PAUSE
  - back to landscape → still paused, "PAUSED" shown
  - with touch mode off, a tall window shows no card and doesn't pause
  - a stubbed `document.hidden` during play pauses

  Verify with `python tools/run_tests.py`, with `python tools/run_tests.py --size 390,844 --hash touch` and with a portrait screenshot.

## 6. Docs

- [x] 6.1 Update `README.md`:
  - a "Playing on a phone" section (landscape, the controls, tap to start, the `#touch` flag, the Fullscreen and portrait behaviour, Android Chrome and iOS Safari)
  - the browser support line
  - the new `run_tests.py --hash`/`--size` and `screenshot.py` touch options

  Verify that the documented commands run as written.

## 7. Integration

- [x] 7.1 Run all the checks below and confirm they pass:
  - `python tools/build.py`
  - `python tools/run_tests.py`
  - `python tools/run_tests.py --browser edge`
  - `python tools/run_tests.py --size 844,390 --hash touch`
  - `python tools/check_levels.py`
  - `python tools/promo/record_promo.py --dry all` (`victory: True`, limits as before)
  - `openspec validate smartphone-landscape --strict`
- [ ] 7.2 Manual check on real devices, by the user, through a LAN server (`python -m http.server` in `dist/`) or GitHub Pages, on Android Chrome and on iPhone Safari, in landscape:
  - the first tap starts the music
  - run, jump and fire at the same time
  - drop through with Down + Jump
  - a ladder climb
  - Pause, Mute and Film; Fullscreen on Android
  - rotate to portrait and back
  - switch apps and come back
  - no zoom or scroll on double tap or long press
  - finish level 1

  Note the frame rate with F3 (connected keyboard) or `#debug`. If it is clearly below 60 fps, record that and propose the film-filter follow-up from design.md "Risks".

## Workflow follow-up

- Release as `v1.1.0` following the README release steps once 7.2 passes.
- Archive the change with `openspec archive smartphone-landscape` after the release and verify that the main specs contain the merged requirements.
