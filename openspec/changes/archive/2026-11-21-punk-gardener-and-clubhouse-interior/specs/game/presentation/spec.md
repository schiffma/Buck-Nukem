# Spec Delta

## MODIFIED Requirements

### Requirement: Themed foreground tiles
Foreground tiles SHALL match each level's theme, drawn worn and dirty (cracks, stains, rust, grime): clay-court surfaces, nets and fences for TC Wollerau; grass, gravel and water for the Krebsbach creek; a furnished clubhouse interior (see "Clubhouse interior") followed by walls and floors of the indoor hall for level 3.

#### Scenario: Creek water
- **WHEN** the Krebsbach level is shown
- **THEN** creek water tiles are visible and animated

#### Scenario: Worn tile variants
- **WHEN** a row of identical solid tiles is drawn
- **THEN** at least two visibly different worn variants of the tile are used so the surface does not repeat uniformly

## ADDED Requirements

### Requirement: Clubhouse interior
The clubhouse part of level 3 SHALL be drawn as the furnished interior of the TC Wollerau clubhouse. It SHALL have a wall backdrop of wood panelling and wallpaper instead of the photo, a bar area and a restaurant area, plus club decoration: trophy cabinet, framed photos or posters, tennis rackets on the wall and hanging lamps.

#### Scenario: Interior backdrop
- **WHEN** the camera shows the clubhouse part of level 3
- **THEN** empty space inside the clubhouse is drawn as panelled wall and wallpaper, and the aerial photo is not visible there

#### Scenario: Photo outside the clubhouse
- **WHEN** the camera shows the indoor hall part of level 3
- **THEN** the darkened photo backdrop is used as before

### Requirement: Clubhouse bar
The clubhouse SHALL contain a bar with a counter, bar stools, beer taps, a back-bar shelf of bottles, a neon beer sign and a cash register.

#### Scenario: Bar visible
- **WHEN** the hero walks through the bar area of level 3
- **THEN** the counter, stools, taps, bottle shelf and neon sign are visible, and the neon sign flickers

### Requirement: Clubhouse restaurant
The clubhouse SHALL contain a restaurant with tables with checked tablecloths, chairs, a menu chalkboard listing CERVELAT, RIVELLA and FONDUE with prices, a kitchen pass-through and potted plants.

#### Scenario: Restaurant visible
- **WHEN** the hero walks through the restaurant area of level 3
- **THEN** tables with chairs, the menu chalkboard and the kitchen pass-through are visible

#### Scenario: Menu board text
- **WHEN** the menu chalkboard is drawn
- **THEN** it shows the lines "CERVELAT", "RIVELLA" and "FONDUE" with prices in the pixel font
