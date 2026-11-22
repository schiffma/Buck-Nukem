# Spec Delta

## MODIFIED Requirements

### Requirement: Kneeling and low shots
While the player holds Down and the hero stands on the ground (not on a ladder top), the hero SHALL kneel: he does not walk, Left/Right only turn him, his shots leave at knee height (low enough to hit a crayfish on the ground) and only his lower body can be hit. Releasing Down SHALL make him stand up when there is room above him. Jump while kneeling on solid ground SHALL be a normal jump.

#### Scenario: Kneel stops the hero
- **WHEN** the hero runs right and the player presses and holds Down
- **THEN** the hero kneels and comes to a stop, and holding Left turns him to face left without moving him

#### Scenario: Low shot kills a ground crayfish
- **WHEN** a crayfish stands on the ground within range in front of the kneeling hero and the player holds Fire
- **THEN** the shots hit the crayfish and it is defeated after the usual 2 standard hits

#### Scenario: Standing shot still misses a ground crayfish
- **WHEN** the hero stands (not kneeling) and fires at a crayfish on the ground
- **THEN** the shot flies over the crayfish

#### Scenario: Ducking under a briefcase
- **WHEN** a projectile such as a thrown law book flies at the hero's chest height while he kneels
- **THEN** it passes over him and he takes no damage

#### Scenario: Still hurt by contact
- **WHEN** a crayfish walks into the kneeling hero
- **THEN** the hero takes damage as usual

#### Scenario: Low ceiling
- **WHEN** the hero kneels under a solid tile that leaves no room to stand and the player releases Down
- **THEN** the hero stays kneeling until he is no longer under the tile

#### Scenario: Ladder top keeps climbing down
- **WHEN** the hero stands on a ladder top and the player holds Down
- **THEN** the hero climbs down the ladder instead of kneeling

