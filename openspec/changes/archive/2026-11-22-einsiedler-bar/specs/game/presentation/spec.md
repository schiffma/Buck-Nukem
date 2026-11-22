# Spec Delta

## MODIFIED Requirements

### Requirement: Clubhouse bar
The clubhouse SHALL contain a bar with a counter, bar stools, Einsiedler beer taps on a chrome tower, an "EINSIEDLER" back-bar sign, a back-bar shelf of bottles, a neon beer sign, a cash register, glasses and beer mats on the counter, three bar guys sitting at the counter and a blonde waitress behind it. The guys and the waitress SHALL be decoration only.

#### Scenario: Bar visible
- **WHEN** the hero walks through the bar area of level 3
- **THEN** the counter, stools, taps, bottle shelf and neon sign are visible, and the neon sign flickers

#### Scenario: Einsiedler taps and sign
- **WHEN** the bar is drawn
- **THEN** the tap tower shows 3 tall red-and-white tap handles over a drip tray, and a back-bar sign reads "EINSIEDLER"

#### Scenario: Three different bar guys
- **WHEN** the bar guys are drawn
- **THEN** there are three, sitting on stools at the counter, each with a different look, and each lifts his glass now and then (at least two different frames)

#### Scenario: Prost
- **WHEN** the bar guys clink glasses
- **THEN** a "PROST!" speech bubble shows for about 1.5 seconds, at most once per 6 seconds for the whole bar

#### Scenario: Blonde waitress behind the counter
- **WHEN** the waitress is drawn
- **THEN** she has blonde hair, stays within the counter's columns, is hidden below the waist by the counter, walks between the taps and sometimes pours a beer with a foam animation

#### Scenario: Decoration only
- **WHEN** the hero, his shots or enemies pass the bar guys or the waitress
- **THEN** nothing collides with them, nothing is damaged and the level checker's results are unchanged

#### Scenario: Outlined pixel art
- **WHEN** any bar guy or waitress frame is drawn
- **THEN** every opaque edge pixel borders a dark outline pixel, as for the other sprites
