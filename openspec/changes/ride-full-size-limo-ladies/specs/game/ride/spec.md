# Spec Delta

## MODIFIED Requirements

### Requirement: Limo finale
When the president's limo is destroyed, play SHALL pause for a short scene of about 5 seconds: the mofa rolls to a stop, the two posh ladies, as big as the fans, climb out of the wreck one after the other and each complains at Buck, then Buck answers with a dry Swiss German line from the ride's quote pack and lights a cigarette. Fire or Jump SHALL skip the scene. Afterwards control SHALL return with the gate open, and Buck SHALL keep the cigarette, puffing smoke, until the ride ends.

#### Scenario: The scene
- **WHEN** the limo's health reaches 0
- **THEN** after the explosion the player cannot move or fire, the ladies climb out of the wreck and stand beside it, each says a line in a bubble (for example "MY DRESS! IT'S DIOR!"), Buck's bubble with a dry Swiss German line (for example "NÖD MIS PROBLEM.") follows, and he lights a cigarette with a small flame and a puff of smoke

#### Scenario: Back in control
- **WHEN** the scene ends (after about 5 seconds) or the player presses Fire or Jump
- **THEN** control returns, the gate is open, the ladies stay standing by the wreck, and riding through the gate ends the level

#### Scenario: Cigarette
- **WHEN** Buck rides on after the scene
- **THEN** a lit cigarette glows at his mouth and a small puff of smoke rises from it every second or so, until the level ends

#### Scenario: No damage during the scene
- **WHEN** the scene plays
- **THEN** Buck cannot be hurt, no cars spawn, and no corks are thrown

#### Scenario: Ladies at fan size
- **WHEN** the ladies climb out of the limo
- **THEN** each is drawn at the fans' size (20 × 32 pixels) in the fans' outlined style, in a big hat, sunglasses, pearls and a dress (one pink, one white), with a climb-out pose, a standing pose and a scolding pose (a finger wagging at Buck)

#### Scenario: The ladies keep complaining
- **WHEN** Buck rides on after the scene while the ladies are on screen
- **THEN** they stay by the wreck facing him in the scolding pose, and one of them complains at him in a bubble every 2 to 3 seconds (for example "YOU RUINED MY DAY!"), taking turns, within the ride's limit of two bubbles; once they are off screen they are quiet
