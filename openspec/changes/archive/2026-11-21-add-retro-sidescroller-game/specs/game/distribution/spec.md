# Spec Delta

## Purpose

Defines how the game is delivered: one self-contained HTML file, built from the project sources and images, that runs offline in a desktop browser.

## ADDED Requirements

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
The game SHALL run at a steady 60 frames per second in current desktop Chrome, Firefox and Edge, with game speed independent of the display refresh rate.

#### Scenario: High refresh display
- **WHEN** the game runs on a 144 Hz display
- **THEN** the hero moves at the same speed as on a 60 Hz display
