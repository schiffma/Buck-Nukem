# Spec Delta

## ADDED Requirements

### Requirement: Mega Cutter look
The Mega Cutter's pickup and blades SHALL look distinct from the plain disc cutter: the pickup is an outlined pixel-art disc cutter with a glowing orange blade, and its blades are larger (at least 16 pixels) with an orange glow, still spinning. The HUD weapon label SHALL read "MEGA CUTTER" while it is active.

#### Scenario: Distinct blades
- **WHEN** a plain cutter blade and a Mega Cutter blade are drawn
- **THEN** the Mega Cutter blade is at least 16 pixels wide, its frames differ from the plain blade's, and it contains orange glow pixels

#### Scenario: HUD label
- **WHEN** the hero has the Mega Cutter
- **THEN** the HUD shows "MEGA CUTTER" with the upgraded weapon icon

#### Scenario: Pickup readable
- **WHEN** the upgrade pickup is drawn on the top platform
- **THEN** it is outlined like the other pickups and differs from the Mega Blaster pickup
