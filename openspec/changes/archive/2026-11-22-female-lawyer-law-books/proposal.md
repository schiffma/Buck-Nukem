# Proposal

## Why

The lawyer is a generic grey-suited man throwing a briefcase. Making the lawyers sharp-dressed women with short hair who throw thick Swiss law books gives the enemy more character and local colour, in the same tongue-in-cheek Wollerau setting as the fans and the Rivella. Short legal one-liners give the lawyers a voice, as the fans already have.

## What Changes

- **All lawyers become women.** A new 16 × 30 sprite set replaces the current one:
  - a dark skirt suit, white blouse and short hair (a bob)
  - dark heels
  - walk frames and a throwing pose

  The hitbox, speed, health, points and the gore style don't change.
- **They throw Swiss law books instead of briefcases.** The book is a thick hardback about 10 × 8 px with a white Swiss cross on the cover and a pale page edge, tumbling as it flies. There are four codes with different cover colours: **OR** (red), **ZGB** (dark blue), **StGB** (green), **SchKG** (orange). Trajectory, speed and damage are the same as the briefcase.

  When a book hits Buck or a wall, it bursts into a few fluttering pages, and a small floating label shows a matching article, e.g. "ART. 41 OR" or "ART. 8 ZGB".
- **Lawyer lines:** when throwing, a lawyer sometimes calls out in a small speech bubble, with lines like "ART. 41 OR!", "OBJECTION!", "SEE YOU IN BERN!", "YOU'RE SUED!", "TERMS APPLY!" and "SIGN HERE!". She speaks at most once every 4 seconds, and at most one lawyer speaks at a time. The bubble lasts about 1.5 seconds, in the fans' bubble style.
- Kneeling still ducks a book at chest height, as it ducked the briefcase.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `game/enemies`: the requirement "Lawyer enemy" changes: the lawyers are women, throw law books and call out lines.
- `game/presentation`: new requirements "Female lawyer look" and "Swiss law book projectile".
- `game/gameplay`: the kneeling scenario "Ducking under a briefcase" keeps its name (OpenSpec doesn't rename scenarios) but now mentions law books. It's only a wording change.

## Impact

- `src/sprites.js`: new lawyer rows (top, throw top, two leg frames) and the law book sprites (4 codes × 2 tumble frames).
- `src/enemies.js`: the projectile kind `lawbook` with a random code; it bursts into pages with an article label; the lawyer's bubble state and drawing.
- `src/fx.js`: the page-flutter particles.
- `src/fans.js`: the bubble drawing is factored into a shared helper.
- `src/test.js`: sprite outline and shading checks for the new sprites, the lawyer-attack test (law book), the kneel-duck test, and tests for the line pool, rate limit and burst.
- `tools/promo`: the projectile kind name is generic in the agent's logic; a dry run confirms the limits.
- `README.md`: the enemies line.
