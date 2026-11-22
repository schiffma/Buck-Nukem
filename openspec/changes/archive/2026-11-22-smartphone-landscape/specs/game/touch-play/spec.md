# Spec Delta

## Purpose

Lets the same game file be played on a smartphone held in landscape, with on-screen touch controls beside the 4:3 picture that drive exactly the same game actions as the keyboard.

## ADDED Requirements

### Requirement: Touch mode
The game SHALL turn on touch mode at load when the device's primary pointer is coarse and it can't hover, or when the URL fragment contains `touch` as its own parameter (`#touch`, `#debug&touch`). Otherwise it SHALL turn on at the first touch on the page. Once on, it SHALL stay on until the page is reloaded. Without touch mode the game SHALL look and behave exactly as before.

#### Scenario: Phone at load
- **WHEN** the game is opened on a phone (coarse pointer, no hover)
- **THEN** touch mode is on from the first frame and the on-screen controls are shown

#### Scenario: Desktop unchanged
- **WHEN** the game is opened in a desktop browser with mouse and keyboard and no `touch` parameter
- **THEN** touch mode is off, no on-screen controls are shown, and scaling, texts and controls are the same as before this change

#### Scenario: First touch on a touchscreen laptop
- **WHEN** touch mode is off and the player touches the page
- **THEN** touch mode turns on, and from then on the on-screen controls are shown

#### Scenario: Forced by URL
- **WHEN** the game is opened on a desktop with `#touch` (or `#debug&touch`)
- **THEN** touch mode is on, and the on-screen controls can be used with the mouse as with a finger

### Requirement: Keyboard keeps working in touch mode
In touch mode every keyboard control SHALL keep working alongside the on-screen controls. If the same action is held by a key and by a touch, it SHALL stay held until both release it.

#### Scenario: Bluetooth keyboard on a phone
- **WHEN** touch mode is on and the player presses Space on a connected keyboard
- **THEN** the hero jumps as on the desktop

#### Scenario: Key and touch hold the same action
- **WHEN** the player holds Right on the keyboard and the on-screen Right, then releases only the on-screen Right
- **THEN** the hero keeps walking right until the key is released too

### Requirement: Side-bar control layout
In touch mode in landscape, the game picture SHALL keep its 4:3 frame, centred, and the controls SHALL sit in the bars to its left and right, never over the picture. Each side bar SHALL be at least 120 CSS pixels wide, measured inside the device's safe area (notch, rounded corners, home indicator). If the screen is too narrow for that, the picture SHALL be scaled down to make room.

#### Scenario: Common phone
- **WHEN** touch mode is on in an 844×390 CSS pixel landscape viewport with 47 px safe-area insets on the left and right
- **THEN** the picture is 4:3, centred, as large as possible, and both side bars are at least 120 px wide inside the safe area, with no control overlapping the picture

#### Scenario: Tall picture on a wide phone
- **WHEN** touch mode is on in a 932×430 viewport without insets
- **THEN** the picture fills the full viewport height (430 px tall, about 573 px wide)

#### Scenario: Narrow landscape screen
- **WHEN** touch mode is on in a 1024×768 landscape viewport (4:3 tablet)
- **THEN** the picture is scaled down below full height so that both side bars are at least 120 px wide

#### Scenario: Re-layout on resize
- **WHEN** the viewport size or the safe-area insets change (rotation, browser bars appearing or hiding)
- **THEN** the picture and the controls are laid out again within the same frame

### Requirement: Movement pad
The left side bar SHALL hold a D-pad with Left, Right, Up and Down plus the four diagonals, operated with one thumb. While a finger is on the pad, the held directions SHALL follow the finger as it slides, without lifting. A finger that slides off the pad SHALL keep the direction it last held, until it lifts.

#### Scenario: Walking
- **WHEN** a finger presses the pad's right arrow
- **THEN** the game's "right" action is held, and the hero walks right as with the Right key

#### Scenario: Sliding between directions
- **WHEN** a finger on the pad's right arrow slides over to the left arrow without lifting
- **THEN** "right" is released and "left" is held in the same frame

#### Scenario: Diagonal
- **WHEN** a finger presses the pad's down-right diagonal
- **THEN** both "down" and "right" are held, so the hero kneels facing right

#### Scenario: Ladder
- **WHEN** the hero overlaps a ladder and a finger holds the pad's up arrow
- **THEN** the hero climbs up as with the Up key

### Requirement: Action buttons
The right side bar SHALL hold a large Jump button and a large Fire button, each at least 56 CSS pixels across, with Fire placed where the thumb naturally rests and Jump next to it. Each button SHALL hold its game action for as long as a finger is on it. A finger may slide from one action button to the other without lifting.

#### Scenario: Jump height by holding
- **WHEN** a finger taps Jump briefly, and later holds Jump until the apex
- **THEN** the short tap gives a lower jump than the long hold, as with the Space key

#### Scenario: Autofire by holding
- **WHEN** a finger holds Fire for one second
- **THEN** the hero fires at the weapon's fire rate, as when the Fire key is held

#### Scenario: Slide from Fire to Jump
- **WHEN** a finger on Fire slides onto Jump without lifting
- **THEN** "fire" is released and "jump" is pressed, and the hero jumps

### Requirement: Multitouch
Every finger on the controls SHALL act on its own, so the player can move, jump and fire at the same time. Lifting or cancelling one finger SHALL release only the actions that finger held.

#### Scenario: Run, jump and fire
- **WHEN** one finger holds the pad's right arrow, a second holds Fire and a third presses Jump
- **THEN** the hero runs right, fires and jumps, all in the same frames

#### Scenario: Drop through a platform
- **WHEN** the hero stands on a one-way platform, one finger holds the pad's down arrow and another presses Jump
- **THEN** the hero drops through the platform, as with Down + Space

#### Scenario: Cancelled touch
- **WHEN** the browser cancels a touch (for example a system gesture or an incoming call)
- **THEN** every action that finger held is released

#### Scenario: App switch
- **WHEN** the page loses focus or is hidden while fingers are on the controls
- **THEN** all touch-held actions are released

### Requirement: Utility buttons
In touch mode, small buttons in the side bars, away from the pad and the action buttons, SHALL offer Pause, Mute, Film filter and Fullscreen. They SHALL act like the P, M, G and F keys. The Fullscreen button SHALL only be shown where the browser can show the page fullscreen. Each button SHALL show its current state (sound on or off, filter on or off).

#### Scenario: Pause button
- **WHEN** the player taps Pause during play
- **THEN** the game pauses as with the P key

#### Scenario: Mute button
- **WHEN** the player taps Mute while the sound is on
- **THEN** all music and sound stop, and the button shows the muted state

#### Scenario: No fullscreen on iPhone
- **WHEN** the game runs in a browser without the Fullscreen API for page elements
- **THEN** no Fullscreen button is shown and the layout still fits the visible viewport

#### Scenario: Fullscreen in landscape
- **WHEN** the player taps Fullscreen on a phone that supports it
- **THEN** the page goes fullscreen and, where the browser allows it, the orientation is locked to landscape

### Requirement: Readable control graphics
The on-screen controls SHALL be drawn in the game's pixel style (pixel font and outlines). Each control SHALL be semi-opaque at rest and clearly brighter while it is held, so the player can see which actions are active. They SHALL stay sharp at any device pixel ratio.

#### Scenario: Pressed feedback
- **WHEN** a finger holds the Fire button
- **THEN** the Fire button is drawn in its pressed look until the finger lifts

### Requirement: Tapping through menus
In touch mode, a tap on the game picture SHALL act as Enter on every screen where Enter continues: the title (start a game), the reel cards (skip), the level tally (fill and continue), the game-over card and the victory card. During play, a tap on the picture SHALL do nothing.

#### Scenario: Start from the title
- **WHEN** the title screen is shown in touch mode and the player taps the picture
- **THEN** a new game starts, as with Enter

#### Scenario: Picture during play
- **WHEN** the game is being played and the player taps the picture
- **THEN** the game neither pauses nor reacts in any other way

#### Scenario: Resume from pause
- **WHEN** the game is paused and the player taps the picture or the Pause button
- **THEN** play resumes

### Requirement: Audio starts on the first touch
In touch mode the first touch anywhere on the page SHALL unlock audio and start the music, as the first key press does on the desktop.

#### Scenario: First tap on the title
- **WHEN** the title screen is shown with no audio yet and the player touches the screen
- **THEN** the title music starts playing within that touch's gesture

### Requirement: Portrait prompt
In touch mode with the screen in portrait (viewport taller than wide), the game SHALL show a full-screen "turn your phone" card over everything, with a rotating-phone pixel icon, and hide the controls. If a level was being played, the game SHALL be paused and stay paused after rotating back to landscape until the player resumes. Without touch mode, the card SHALL never be shown.

#### Scenario: Rotated to portrait during play
- **WHEN** the player turns the phone to portrait during play
- **THEN** the "turn your phone" card is shown and the game is paused

#### Scenario: Back to landscape
- **WHEN** the phone is turned back to landscape
- **THEN** the card disappears, the game is still paused, and it shows "PAUSED"

#### Scenario: Desktop narrow window
- **WHEN** touch mode is off and the desktop window is made taller than wide
- **THEN** no portrait card is shown and the game is scaled as before

### Requirement: Pause when hidden
In touch mode, when the page is hidden (app switch, screen lock, another tab), a level being played SHALL be paused.

#### Scenario: Screen locked during play
- **WHEN** the phone's screen is locked during play in touch mode
- **THEN** the game is paused when the page becomes visible again

### Requirement: No browser gestures over the game
In touch mode, touches on the game page SHALL NOT scroll, zoom (pinch or double-tap), select text, open a long-press menu or trigger pull-to-refresh.

#### Scenario: Double tap on Jump
- **WHEN** the player taps the Jump button twice quickly
- **THEN** the hero jumps twice (once per landing) and the page does not zoom

#### Scenario: Long press on Fire
- **WHEN** the player holds Fire for several seconds
- **THEN** no context menu, selection or magnifier appears, and firing continues
