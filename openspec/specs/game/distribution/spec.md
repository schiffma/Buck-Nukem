# game/distribution Specification

## Purpose

Defines how the game is delivered: one self-contained HTML file, built from the project sources and images, that runs offline in a desktop browser.

## Requirements

### Requirement: Single self-contained HTML file
The game SHALL be delivered as one file, `dist/buck_nukem.html`, that contains all scripts, styles, image data and audio logic inline. It SHALL make no network requests and reference no other files.

#### Scenario: Opened offline from disk
- **WHEN** `dist/buck_nukem.html` is copied alone to another folder and opened from disk with the network disconnected
- **THEN** the game loads and is fully playable with images and sound

### Requirement: Reproducible build
A build command SHALL regenerate `dist/buck_nukem.html` from the project sources and `assets/img/` without manual steps, and SHALL fail with an error message if a required source image is missing.

#### Scenario: Rebuild
- **WHEN** the build command is run twice without source changes
- **THEN** both runs produce a working file with identical content

#### Scenario: Missing image
- **WHEN** a required image in `assets/img/` is missing
- **THEN** the build stops with an error naming the missing file

### Requirement: File size limit
The built HTML file SHALL be no larger than 2 MB.

#### Scenario: Size check
- **WHEN** the build finishes
- **THEN** it reports the output size and fails if the file exceeds 2 MB

### Requirement: Browser support
The game SHALL run at a steady 60 frames per second in current desktop Chrome, Firefox and Edge, with game speed independent of the display refresh rate. It SHALL also be playable in landscape with touch in current Chrome on Android and Safari on iOS, from the same file, with game speed independent of the display refresh rate. It SHALL draw at most one frame per 60 Hz game update.

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

#### Scenario: No extra frames on high refresh displays
- **WHEN** the display refreshes at 120 Hz or 144 Hz for one second
- **THEN** the game draws at most 61 frames in that second (one per game update), each showing the state after the latest update, and the debug overlay's FPS shows at most 61

#### Scenario: Every update is shown at 60 Hz
- **WHEN** the display refreshes at 60 Hz
- **THEN** the game still draws a frame on every refresh where an update happened, about 60 per second as before

### Requirement: Build version
The build SHALL embed a version text in the game file, derived from git: the release tag (for example "v1.0.2") when no files outside `dist/` changed since that tag, otherwise the tag plus the number of commits since it and the short commit hash (for example "v1.0.2-3-gab12cd3"), with "-dirty" appended when files outside `dist/` have uncommitted changes. When git or the tags are not available, it SHALL fall back to "v" plus the contents of the `VERSION` file.

#### Scenario: Tagged release
- **WHEN** the build runs on the commit tagged v1.0.2 with no changes outside `dist/`
- **THEN** the game file contains the version "v1.0.2"

#### Scenario: Building the release file does not change its version
- **WHEN** the release is tagged, the build is run and the rebuilt `dist/buck_nukem.html` is committed on top of the tag
- **THEN** rebuilding still yields the version "v1.0.2"

#### Scenario: Work in progress
- **WHEN** the build runs with uncommitted changes in `src/`
- **THEN** the version ends in "-dirty"

#### Scenario: No git
- **WHEN** the build runs where git is not installed or the folder is not a git repository
- **THEN** the build still succeeds and the version is "v" plus the `VERSION` file contents
