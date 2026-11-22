# Spec Delta

## MODIFIED Requirements

### Requirement: Lawyer enemy
Lawyers SHALL be women in skirt suits with short hair. They SHALL walk back and forth on their platform without walking off edges. When the hero is on roughly the same height and in front of them, they SHALL stop and throw a Swiss law book toward the hero, sometimes calling out a short legal line. A lawyer SHALL take 3 standard hits.

#### Scenario: Lawyer turns at a ledge
- **WHEN** a walking lawyer reaches the edge of its platform
- **THEN** it turns around instead of falling

#### Scenario: Lawyer attacks
- **WHEN** the hero is in front of a lawyer at a similar height within attack range
- **THEN** the lawyer throws a law book toward the hero (same arc, speed and 1 damage as the former briefcase)

#### Scenario: Book bursts with an article
- **WHEN** a law book hits the hero or a solid tile
- **THEN** it disappears in a burst of fluttering pages and a short floating label names an article of that book's code (for example "ART. 41 OR")

#### Scenario: Legal one-liners
- **WHEN** a lawyer throws
- **THEN** she may show a speech bubble with a line from a pool of at least 8 legal lines (each at most 20 characters, drawable with the game font, at least half of them naming a Swiss code or article); each lawyer speaks at most once per 4 seconds, at most one lawyer bubble shows at a time, and a bubble disappears after about 1.5 seconds
