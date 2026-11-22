# Spec Delta

## ADDED Requirements

### Requirement: Fullscreen with Windows key lock
Pressing F SHALL toggle fullscreen at any time. While fullscreen, the game SHALL lock the left and right Windows keys through the browser's Keyboard Lock API where available, so they do not open the Start menu or take focus from the game. Esc SHALL stay unlocked and leave fullscreen; the lock SHALL end when fullscreen ends.

#### Scenario: Entering fullscreen
- **WHEN** the player presses F in a normal window
- **THEN** the game requests fullscreen and, once fullscreen, locks the MetaLeft and MetaRight keys and shows "WINDOWS KEY LOCKED" for about two seconds

#### Scenario: Leaving fullscreen
- **WHEN** the player presses F or Esc while fullscreen
- **THEN** fullscreen ends and the Windows keys are unlocked

#### Scenario: Browser without Keyboard Lock
- **WHEN** fullscreen starts in a browser that has no Keyboard Lock API or refuses the lock
- **THEN** the game still plays fullscreen and shows "FULLSCREEN (WINDOWS KEY NOT LOCKABLE HERE)" instead

#### Scenario: Windows key while locked
- **WHEN** the Windows key is pressed while the game is fullscreen with the lock active
- **THEN** the game keeps focus, held keys stay held, and firing continues

#### Scenario: Controls shown
- **WHEN** the title screen is shown
- **THEN** the controls list includes F for fullscreen
