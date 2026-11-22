# Spec Delta

## ADDED Requirements

### Requirement: Mega Cutter upgrade
The boss arena SHALL contain a disc-cutter upgrade on its highest platform. Touching it SHALL turn the disc cutter into the Mega Cutter until the hero loses a life: each shot fires two blades (one level, one angled slightly upward) dealing 5 damage each, at the normal cutter fire rate. While the hero lacks the upgrade, the pickup SHALL reappear at its spot 20 seconds after it was taken.

#### Scenario: Collecting the upgrade
- **WHEN** the hero touches the upgrade pickup on the top platform of the boss arena
- **THEN** the HUD shows "MEGA CUTTER" and every following shot fires two blades of 5 damage each

#### Scenario: Stronger against the boss
- **WHEN** a Mega Cutter blade hits the boss's exposed face
- **THEN** the boss loses 5 health; blades hitting the shell or closed claws are still deflected and do no damage

#### Scenario: Lost with a life
- **WHEN** the hero with the Mega Cutter loses a life in the boss arena and respawns
- **THEN** he has the plain disc cutter again

#### Scenario: Pickup comes back
- **WHEN** 20 seconds have passed since the upgrade was taken and the hero does not have the Mega Cutter
- **THEN** the upgrade pickup is back at its spot on the top platform

#### Scenario: Other levels unchanged
- **WHEN** the hero touches a weapon pickup in levels 1 to 3
- **THEN** he gets the Mega Blaster as before

### Requirement: Boss reveal at arena start
When the boss arena starts after its reel intro card, the camera SHALL pan from the hero to the boss, hold on the boss while it raises its claws, and pan back, taking about 3 seconds. During the reveal the hero SHALL not move or shoot and the boss SHALL not attack. Pressing Jump or Fire SHALL skip the rest of the reveal. The reveal SHALL not play when the hero respawns in the arena.

#### Scenario: Boss shown at the start
- **WHEN** the boss arena's intro card ends
- **THEN** within the next 1.5 seconds the whole boss is inside the camera view, and after about 3 seconds the camera is back on the hero and play begins

#### Scenario: No attacks during the reveal
- **WHEN** the reveal is running
- **THEN** the boss makes no attack, the hero does not move although movement keys are held, and no shots are fired

#### Scenario: Skipping the reveal
- **WHEN** the player presses Jump or Fire during the reveal
- **THEN** the camera returns to the hero and play begins within half a second

#### Scenario: Not on respawn
- **WHEN** the hero loses a life in the boss arena and respawns
- **THEN** play continues at once without a reveal
