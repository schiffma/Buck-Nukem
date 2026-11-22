# Spec Delta

## MODIFIED Requirements

### Requirement: Browser support
The game SHALL run at a steady 60 frames per second in current desktop Chrome, Firefox and Edge, with game speed independent of the display refresh rate. It SHALL also be playable in landscape with touch in current Chrome on Android and Safari on iOS, from the same file, with game speed independent of the display refresh rate.

#### Scenario: High refresh display
- **WHEN** the game runs on a 144 Hz display
- **THEN** the hero moves at the same speed as on a 60 Hz display

#### Scenario: Phone browsers
- **WHEN** `dist/buck_nukem.html` is opened from GitHub Pages in current Chrome on Android or Safari on iOS and the phone is held in landscape
- **THEN** the game loads in touch mode, music starts on the first tap, and a level can be played to its exit with the on-screen controls

#### Scenario: Same file for every device
- **WHEN** the build finishes
- **THEN** it writes one file, `dist/buck_nukem.html`, that serves desktop and phone, and no separate mobile file

#### Scenario: Slow device keeps game speed
- **WHEN** a phone renders fewer than 60 frames per second
- **THEN** the game still updates at 60 steps per second of game time, so the hero moves at the same speed as on the desktop
