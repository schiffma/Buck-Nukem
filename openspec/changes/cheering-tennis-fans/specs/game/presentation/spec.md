# Spec Delta

## ADDED Requirements

### Requirement: Cheering tennis fans
Every level SHALL show female tennis players in the background cheering for Buck: 3–5 in each regular level and 2–3 in the boss arena. Within a level each SHALL look different (hair, skin tone, outfit accents, accessory). They SHALL idle with a cheer animation, face Buck, call out to him in speech bubbles, and all cheer with their own messages when he scores near them. They are purely decorative.

#### Scenario: Fans in every level
- **WHEN** any level is loaded
- **THEN** it contains 3 to 5 fans (2 to 3 in the boss arena), each standing on solid ground or a platform

#### Scenario: All different
- **WHEN** the fans of one level are compared
- **THEN** no two of them share the same combination of hair, skin tone, outfit accent and accessory

#### Scenario: Idle cheer and facing Buck
- **WHEN** a fan is on screen
- **THEN** her sprite animates (at least two different frames within one second) and she faces the side Buck is on

#### Scenario: Reaction to Buck's success
- **WHEN** Buck kills an enemy, picks up a trophy or touches a checkpoint within 12 tiles of a fan
- **THEN** every fan within that range plays a jump-and-wave cheer for about one second and shows her own speech bubble cheering Buck (such as "GO BUCK!"), fans on screen at the same time show different lines, and a short cheer sound plays

#### Scenario: Shout-outs when Buck walks past
- **WHEN** Buck comes within 4 tiles of a fan who has not called out to him in the last 8 seconds
- **THEN** she shows a speech bubble with a short message to Buck (such as "HI BUCK!" or "YOU ROCK!")

#### Scenario: Rate limit
- **WHEN** several reactions happen within 1.5 seconds
- **THEN** the cheer sound plays at most once in that time, and each fan shows at most one bubble at a time

#### Scenario: No gameplay effect
- **WHEN** Buck, his shots or enemies pass a fan
- **THEN** nothing collides with her, nothing is blocked or damaged, and the level checker's results are unchanged

#### Scenario: Outlined pixel art
- **WHEN** any fan frame is drawn
- **THEN** every opaque edge pixel borders a dark outline pixel, as for the other sprites
