# Proposal

## Why

Buck Nukem is already online (GitHub Pages), but it can only be played with a keyboard. On a phone the game shows at 1× in a corner (the integer scaling can't reach 2× at a phone's ~390 px landscape height), nothing reacts to touch, and the music never starts. Phones are where a link like `buck_nukem.html#level=4` gets opened. Phone support should share all of the game: the same file, levels, rules, look and tests, with only input and layout added.

## What Changes

- **Same file, touch mode added:** `dist/buck_nukem.html` turns on a *touch mode* when it runs on a touch device, or on the first touch, or when the URL has `#touch`. Desktop play with a keyboard is unchanged.
- **Phone layout (landscape):** the 320×240 picture keeps its 4:3 frame. In touch mode it is scaled to the largest size that fits (fractional, still with sharp nearest-neighbour pixels), not just a whole multiple. It leaves room in the side bars for the controls and respects the phone's notch and safe areas.
- **On-screen controls in the side bars:** a D-pad on the left (Left, Right, Up, Down, with diagonals) and Jump and Fire on the right, so thumbs never cover the action. Several fingers can press at once (for example run + jump + fire, or Down + Jump to drop through a platform). Small buttons for Pause, Mute, Film filter and, where the browser allows it, Fullscreen.
- **Touch drives the same actions as the keyboard:** a button press sets exactly the same game actions (`left`, `jump`, `fire`, `enter`, …) that the keys set. The game logic, the AI promo bridge and the tests don't need to know which input was used.
- **Menus by tapping:** a tap on the picture acts as Enter on the title, the reel cards, the level tally and the end cards. The first tap also starts the music.
- **Texts that match the input:** in touch mode the title shows a touch controls summary and "TAP TO START", and the other screens say "TAP" or "TAP II" instead of "PRESS ENTER" or "PRESS P".
- **Portrait prompt:** in portrait the game pauses and shows a "turn your phone" card. Play continues in landscape.
- **Mobile hygiene:** no page zoom, scrolling, text selection or long-press menu. The game pauses when the tab is hidden while playing in touch mode.
- **Browser support:** current Chrome on Android and Safari on iOS, in landscape, are supported alongside desktop Chrome, Edge and Firefox.

No breaking changes. Keyboard controls, the desktop integer scaling and all gameplay stay as they are.

## Capabilities

### New Capabilities
- `game/touch-play`: touch mode on phones. It covers turning touch mode on, the side-bar control layout, multitouch buttons that map to the game's actions, tapping through menus, the portrait prompt, safe areas, fullscreen and orientation, and pausing when hidden.

### Modified Capabilities
- `game/presentation`: "Native 320x240 resolution" (fractional fit-to-screen scaling in touch mode, leaving room for the side bars) and "Title and end screens" (touch controls summary and tap prompts in touch mode).
- `game/gameplay`: "Pause" (also with the on-screen Pause button and automatically in portrait).
- `game/distribution`: "Browser support" (adds mobile Chrome on Android and Safari on iOS in landscape, with game speed still independent of the display refresh rate).

## Impact

- **Code:**
  - new `src/touch.js` (touch mode, layout, controls drawing, pointer handling)
  - `src/input.js`: shared press and release helpers used by both keyboard and touch
  - `src/render.js`: scaling in touch mode
  - `src/screens.js`: input-aware prompt texts and controls list
  - `src/audio.js`: music starts on the first tap
  - `src/main.js`: auto-pause
  - `src/index.template.html`: viewport meta, the controls layer, CSS against scroll, zoom and selection
  - `tools/build.py`: adds `touch.js` to the inlined script order, if the order is listed there
- **Tests:** new scenarios in `src/test.js` (layout maths for common phone sizes, synthetic touch pointer events → actions, multitouch, menu taps, portrait pause, prompt texts). `tools/run_tests.py` and `tools/screenshot.py` get a phone-size and `#touch` option.
- **Unchanged:** levels, gameplay rules, `Input.simulate` and the promo autopilot (`tools/promo`), the file stays well under 2 MB, no dependencies are added.
- **Risk:** film filter cost on slower phones (the 8 ms budget is measured on desktop); Fullscreen API not available on iPhone Safari (the layout must work without it).
