# Design

## Context

- **Display:** the game draws into a 320×240 back buffer (`render.js`). `present()` copies it, through the film filter, onto one `#screen` canvas. `resizeScreen()` picks an integer scale, and the page centres the canvas with a CSS flexbox.
- **Input:** `input.js` maps key codes to actions (`left`, `jump`, `fire`, `enter`, `pause`, `mute`, `film`, `fullscreen`, …) in `Input.held`, plus a per-step `Input.edge` for presses. The game only ever reads `Input.down(a)` and `Input.pressed(a)`. `Input.simulate(a, isDown)` is the only entry point for the test harness and the promo bridge (`tools/promo/bridge.js`, guarded by `tests/test_fairplay.py`).
- **Audio:** `Sound.unlock()` creates the `AudioContext`. It runs from `Input.anyKeyListeners`, which only the `keydown` handler calls.
- **Screens:** the "PRESS ENTER" / "PRESS P" texts and the `TITLE_CONTROLS` list are hard-coded in `screens.js`.
- **Build:** `tools/build.py` inlines `src/*.js` in a fixed `JS_ORDER` into `index.template.html`.
- **Phones:** a typical phone viewport in landscape is about 844×390 CSS px, with up to 47 px safe-area insets on the notch sides. iPhone Safari has no Fullscreen API for page elements.

Motivation: see proposal.md. Required behaviour: see `specs/game/touch-play`, plus the deltas to presentation, gameplay and distribution.

## Goals / Non-Goals

**Goals:**
- One code path for the game. Touch is only another *source* of the same actions, and layout is only another *scale rule*.
- The desktop is unchanged at the pixel level: same canvas size, same texts, same tests passing, unless touch mode is on.
- The touch mode logic can be tested in the existing headless test runner, with no real phone needed.

**Non-Goals:**
- Portrait play, a wider-than-4:3 view, gamepad support, haptics, PWA install or offline caching beyond the single file.
- Changing gameplay balance for touch (no aim assist, no auto-run, no easier mode).
- Making the promo autopilot use touch. It keeps driving `Input.simulate`.

## Decisions

### 1. Touch mode is a runtime flag in the same file
A new `src/touch.js` defines a `Touch` object. `Touch.on` is set at boot in these cases:
- `matchMedia("(hover: none) and (pointer: coarse)")` matches
- the hash contains `touch` as its own parameter (same parsing style as `level=`)
- otherwise, the first `pointerdown` with `pointerType === "touch"` turns it on

Every touch-specific branch elsewhere checks `Touch.on`.

*Alternative:* a separate `dist/buck_nukem_mobile.html` built with a flag. This was rejected by the user and gives two files to ship and test. *Alternative:* user-agent sniffing. It's brittle, and it fails for touchscreen laptops and for iPad Safari, which reports itself as a desktop.

`Touch.init()` is called from `boot()` in `main.js`. The promo bridge replaces `boot()`, so the autopilot never turns touch mode on. Headless Chrome has no coarse pointer, so the tests only get touch mode where they force it.

### 2. Input: held actions are counted per source
`Input` keeps, for each action, the set of sources holding it:
- `"kb"` for the keyboard
- `"sim"` for `Input.simulate`
- `"t<pointerId>"` for each finger

`Input.held[a]` is true while that set isn't empty. The edge is set when the set goes from empty to not empty.

The keyboard handlers, `Input.simulate` and the touch code all go through one `Input.set(action, source, isDown)`. `simulate()` keeps its signature and its behaviour. Blur releases only the `"kb"` source. Touch releases its own sources on `pointercancel`, `pointerup` and when the page is hidden. `Input.reset()` clears everything.

This covers "key and touch hold the same action" without special cases. The fairplay test still sees only `Input.simulate` from the bridge.

*Alternative:* writing `Input.held` directly from touch. That breaks when a key and a finger overlap, and it duplicates the edge logic.

### 3. Controls are drawn on a second, full-window canvas
`#pad` is a canvas that covers the whole viewport and sits above `#screen`. It's only shown in touch mode. It is sized at `devicePixelRatio` and redrawn only when something on it changes: held set, mute or film state, layout, or portrait. So it costs nothing per frame while idle.

It receives all pointer events, including over the picture, so tapping through menus needs no second listener. It's drawn with the game's pixel font and outline colours (font glyphs scaled by a whole factor), so it matches the look.

*Alternative:* DOM buttons. They're easier to hit-test but hard to style as crisp pixel art. They also bring extra gesture quirks (double-tap zoom and long-press menus differ per element on iOS). *Alternative:* drawing the controls into the 320×240 buffer. That's impossible, because the controls live outside the picture, and it would run them through the film filter.

### 4. Layout is a pure function
`touchLayout(vw, vh, insets)` returns:
- the game scale `s`
- the picture rect
- the two bar rects
- one rect or circle per control

The calculation:
- the safe box is the viewport minus `env(safe-area-inset-*)`, read from a hidden probe element's computed padding
- `s = min(safeH / 240, (safeW − 2·120) / 320)`
- the picture is centred in the safe box
- **left bar:** the D-pad circle (radius about `min(0.42·barW, 0.24·safeH)`) in the lower 2/3, and Pause and Mute at the top
- **right bar:** Fire low and toward the outer edge, where the thumb rests, and Jump above it and inward. Each has a diameter of at least 56 px. Film and Fullscreen go at the top.

Being pure, the function is unit-tested with the viewport sizes from the specs. `resizeScreen()` calls it in touch mode, and `Touch` reuses the result for hit-testing and drawing.

### 5. Scaling the picture in touch mode
In touch mode `resizeScreen()` does this:
- sets the backing store to `round(320·s·dpr) × round(240·s·dpr)` and the CSS size to `320·s × 240·s`
- positions `#screen` absolutely at the picture rect, so the flexbox centring is bypassed
- keeps `imageSmoothingEnabled = false`

`present()` already scales from the buffer. The only change is that `displayScale` becomes the device-pixel scale. That also keeps the film jitter offset in game pixels.

Fractional nearest-neighbour scaling makes some game pixels one device pixel wider than others. At a ratio of 3 or more that's not visible. Integer *device-pixel* scaling was considered, but it would waste up to 18% of the height on a 390 px phone. Desktop keeps the integer CSS scale exactly as before.

### 6. Hit-testing and multitouch
Each `pointerId` is tied, on `pointerdown`, to the control under it: the pad, the action group, a utility button, or the picture. Ties are broken with a hit radius of about 1.3× around the pad and the action buttons.

- **Pad:** the direction comes from the angle in 8 sectors of 45°, with a dead zone of 25% of the radius. On `pointermove` the finger's directions are recomputed, and the differences are released and pressed through `Input.set`. Off the pad, it keeps the last directions (spec).
- **Action group:** the finger holds whichever of Jump or Fire is nearer. Moving re-evaluates, which allows sliding from one to the other.
- **Utility buttons:** these act on release inside the same button. Pressing and releasing `"t<id>"` within one step is enough, because the edge survives until `Input.endStep()`. Pause, Mute, Film and Fullscreen go through the same actions as P, M, G and F. Fullscreen calls `Fullscreen.toggle()` inside the gesture and then tries `screen.orientation.lock("landscape")`. In touch mode the Windows-key lock and its notes are skipped.
- **Picture:** on `pointerdown` it presses `enter` only when `Game.state` is not PLAY or BOSS. During play Enter would pause, and the spec says a tap on the picture does nothing then.

`setPointerCapture` keeps the moves coming when a finger leaves the canvas.

### 7. Prompts and controls text
`screens.js` gets a helper, `promptText(kind)` (`start`, `continue`, `paused`, `music`), and a `titleControls()` function. Both return the existing strings when touch mode is off and the touch strings when it's on. The touch controls list fits the same 8 lines × 186 px panel:
- PAD — MOVE/CLIMB/KNEEL
- JUMP — JUMP
- FIRE — FIRE
- PAD DOWN+JUMP — DROP
- II — PAUSE
- ♪ — MUTE
- FILM — FILTER
- ⛶ — FULLSCREEN

The glyphs are drawn as small sprites, or as plain words if the font lacks them. Positions don't change, so the existing layout and overlap tests apply unchanged to both variants.

### 8. Audio unlock on touch
`Touch` calls the same `Input.anyKeyListeners` on its first `pointerdown` and again on its first `pointerup`. `Sound.unlock()` is idempotent, and it also calls `ac.resume()` when suspended. iOS only counts some events as user activation (historically `touchend` and `click`), so trying both is the cheapest reliable route.

### 9. Portrait card and auto-pause
`Touch` watches `resize` and `visibilitychange`.

**Portrait** (`vh > vw`) in touch mode:
- draws the "TURN YOUR PHONE" card with a rotating-phone pixel icon on `#pad`, opaque, covering `#screen`
- hides the controls
- calls `Game.setState(STATE.PAUSE)` if the state is PLAY or BOSS

**Hidden page:** the same pause rule, plus releasing all touch sources.

Resuming is always the player's choice. The existing PAUSE state already freezes the world, so no new game state is needed.

### 10. Page hygiene in the template
- **Viewport meta:** `width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no`.
- **CSS:** `touch-action: none`, `user-select: none`, `-webkit-user-select: none`, `-webkit-touch-callout: none` and `overscroll-behavior: none` on `html` and `body`. Use `height: 100dvh`, falling back to 100%.
- **`#pad`:** a `contextmenu` listener in touch mode calls `preventDefault`.

On the desktop none of this changes the rendering. The tests check that the canvas size and position are unchanged when touch mode is off.

### 11. Build and tools
- Add `touch.js` to `JS_ORDER` right after `input.js`. It only references later globals (`Game`, `Sound`, `resizeScreen`) inside functions, which run after the whole script has loaded.
- `tools/run_tests.py` already has a `--size` option. Add a `--hash` option, so `--size 844,390 --hash touch` runs the suite in forced touch mode at phone size.
- `tools/screenshot.py` gets a `touch` flag that captures the full window, including the bars, so the layout can be checked by eye.

## Risks / Trade-offs

- **[Film filter too slow on a mid-range phone]** It reads back and processes 76,800 pixels per frame, and the 8 ms budget is measured on the desktop. The fixed-timestep loop keeps the game speed, so only smoothness suffers → the Film button turns the filter off. During implementation, measure the frame time on a real phone. If it's clearly over 16 ms, propose a follow-up (half-rate grain, or filter off by default in touch mode) as its own change, because that would change the presentation spec.
- **[iOS Safari audio not unlocking]** → unlock on both `pointerdown` and `pointerup`, plus `resume()`. Verify on a real iPhone (see tasks).
- **[Browser UI bars change the viewport mid-game]** On Android the URL bar appears and hides → re-layout on every `resize` and `visualViewport` `resize`. The layout is pure and cheap.
- **[Thumbs miss small buttons]** → minimum sizes (pad radius, 56 px action buttons, 120 px bars) and generous hit radii. Utility buttons only act on release inside the button, so a sliding thumb doesn't toggle them by accident.
- **[Desktop regressions from the template CSS and the Input refactor]** → the full existing test suite runs with touch mode off at 1280×1000, plus new tests that `Input.simulate` and the key handlers behave exactly as before. The promo `--dry 0` run is the integration check for the bridge.
- **[Fractional scaling looks uneven at a device pixel ratio of 1–2]** Rare on phones → accepted. Desktop keeps integer scaling.

## Migration Plan

- Ship as a feature release, `v1.1.0`, following the README release steps. GitHub Pages serves the same `dist/buck_nukem.html`, so phone players get it at the existing URL.
- **Rollback:** revert the release commit and rebuild. Touch mode adds no stored data or new URLs. The `#touch` flag is harmless if ignored.

## Open Questions

- Exact pixel positions and glyph choices of the control graphics. Tune them by eye on a real phone, within the minimum sizes and placement rules of the spec.
