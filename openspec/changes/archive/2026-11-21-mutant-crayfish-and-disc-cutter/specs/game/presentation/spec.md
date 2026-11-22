# Spec Delta

## ADDED Requirements

### Requirement: Realistic red crayfish
The small crayfish and the giant boss SHALL look like the real crayfish in the change's reference photo, drawn side-on: red only (glossy red-brown armour, darker joints, pale claw tips; no blue), smooth carapace with a pointed rostrum, segmented tail with a tail fan, two large claws, thin legs and long antennae. Sprites keep dark 1-px outlines; hitboxes and behaviour stay unchanged; no glow effects.

#### Scenario: Red only
- **WHEN** a small crayfish frame or a boss frame is drawn
- **THEN** every opaque non-outline pixel is red-dominant or a near-neutral pale/dark tone (red channel at least as high as green and blue), and no pixel is blue-dominant (blue more than 20 above red)

#### Scenario: Crayfish anatomy
- **WHEN** a small crayfish sprite is built
- **THEN** it shows a segmented tail (at least three visible segment lines) ending in a tail fan, a claw at the front at least a quarter of the body length, thin legs below the body, and antennae extending forward at least half the body length

#### Scenario: Outlines kept
- **WHEN** any small crayfish frame is drawn over a background
- **THEN** every opaque edge pixel borders a dark outline pixel, as for all other sprites

#### Scenario: Gameplay unchanged
- **WHEN** a small crayfish or the boss is created
- **THEN** its hitboxes, health, speed and attack behaviour are the same as before the redesign

#### Scenario: No glow effects
- **WHEN** a small crayfish or the boss is on screen for one second
- **THEN** no glow particles are emitted and no helix or molecule glow is drawn around the boss
