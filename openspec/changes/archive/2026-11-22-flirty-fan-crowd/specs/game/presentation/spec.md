# Spec Delta

## MODIFIED Requirements

### Requirement: Cheering tennis fans
Every level SHALL show a crowd of adult female tennis players in the background cheering for Buck: 8–10 in each regular level and 4–5 in the boss arena. Within a level each SHALL look different. They SHALL idle with a cheer animation, face Buck, and each SHALL talk to him in her own speech bubble with cheeky, flirty lines (suggestive innuendo, never explicit). They are purely decorative.

#### Scenario: Fans in every level
- **WHEN** any level is loaded
- **THEN** it contains 8 to 10 fans (4 to 5 in the boss arena), each standing on solid ground or a platform

#### Scenario: All different
- **WHEN** the fans of one level are compared
- **THEN** no two of them share the same combination of hair style, hair colour, skin tone, outfit accent and accessory, and the game has at least 14 distinct looks

#### Scenario: Idle cheer and facing Buck
- **WHEN** a fan is on screen
- **THEN** her sprite animates (at least two different frames within one second) and she faces the side Buck is on

#### Scenario: Reaction to Buck's success
- **WHEN** Buck kills an enemy, picks up a trophy or touches a checkpoint within 12 tiles of fans
- **THEN** every fan within that range plays a jump-and-wave cheer for about one second, the nearest ones show speech bubbles with lines for that occasion, and no two bubbles on screen show the same line

#### Scenario: Shout-outs when Buck walks past
- **WHEN** Buck comes within 4 tiles of a fan who has not called out to him in the last 8 seconds
- **THEN** she blows him a kiss, a small heart floats up from her, and she shows a flirty shout-out bubble (such as "HEY HANDSOME!")

#### Scenario: Flirty but not explicit
- **WHEN** the line pools are checked
- **THEN** there are at least 30 distinct lines across the occasions (shout-out, kill, trophy, checkpoint), each at most 20 characters and drawable with the game font (including a heart), and none contains explicit sexual words

#### Scenario: Readable bubbles
- **WHEN** several fans talk at the same time
- **THEN** at most 3 bubbles are shown, nearest fans first, they don't overlap each other, each fan shows at most one bubble at a time, and every bubble disappears after about 1.5 seconds

#### Scenario: Rate limit
- **WHEN** several reactions or shout-outs happen within a short time
- **THEN** the cheer sound plays at most once per 1.5 seconds and the wolf whistle at most once per 4 seconds

#### Scenario: No gameplay effect
- **WHEN** Buck, his shots or enemies pass a fan
- **THEN** nothing collides with her, nothing is blocked or damaged, and the level checker's results are unchanged

#### Scenario: Outlined pixel art
- **WHEN** any fan frame is drawn, including the blow-a-kiss frame
- **THEN** every opaque edge pixel borders a dark outline pixel, as for the other sprites
