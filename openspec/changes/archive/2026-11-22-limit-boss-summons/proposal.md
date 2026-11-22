# Proposal

## Why

The boss summons up to two small crayfish on every third attack for the whole fight. In the wider arena this keeps a steady stream of minions coming. They crowd the platforms, make the fight drag on, and pull attention away from the boss itself. Limiting the summons to the opening part of the fight keeps the early pressure and lets the second half be a straight duel with the boss.

## What Changes

- The boss summons minions at most **3 times per boss fight**. The count is not reset when Buck loses a life and respawns in the arena; only a new game or a reload of the arena resets it. Each summon is unchanged: up to 2 crayfish, at most 4 alive, appearing on screen left of the boss.
- Once the 3 summons are used up, the boss **skips** the summon slot, so its cycle becomes claw slam → bubbles → claw slam → … The enraged phase below 50% health still shortens its pauses.
- Crayfish that are already alive stay, and can still be killed for points.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `game/enemies`: the requirement "Boss attack patterns" gets a limit on summons and the skip rule.

## Impact

- `src/boss.js`: a summon counter (reset in `Boss.init`) and an attack choice that skips `summon` when 3 have been used.
- `src/config.js`: `bossSummons: 3`.
- `src/test.js`: tests for the limit, for respawning not resetting the count, and for the skip; one test that calls `startAttack("summon")` more than 3 times will be updated.
- `tools/promo`: the agent needs no change; a dry run confirms the promo limits are still met.
- **Dependency:** the active change `title-version-and-tactical-arena` also modifies "Boss attack patterns" (the shockwave stops at cover, minions spawn on screen). This change's delta builds on that version, so archive `title-version-and-tactical-arena` first.
