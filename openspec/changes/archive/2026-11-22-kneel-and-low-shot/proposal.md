# Proposal

## Why

Mutant crayfish on the ground can't be shot: a blaster shot leaves at chest height (hero top + 14 px) and flies over a crayfish that is only 10 px high. So the player has to wait for a crayfish to leap, or jump over it. That is frustrating, and it's why crayfish are the enemies most often left alive (11 survived the last promo run; every lawyer and punk died). A kneel on the Down key gives the player a low shot that hits crayfish on the ground. It also adds a classic run-and-gun move: ducking under high projectiles.

## What Changes

- **Kneel:** holding Down while Buck stands on the ground (not on a ladder top) makes him kneel. He stops moving; Left/Right only turn him around (as on ladders). Releasing Down makes him stand up again, unless a ceiling is in the way.
- **Low shot:** while kneeling, blaster and Mega Blaster shots leave at knee height, so they hit crayfish on the ground (and lawyers and punks too). In the boss arena, the disc cutter's blade leaves lower as well.
- **Duck:** kneeling lowers Buck's hitbox to about two thirds of his height. Projectiles flying at head or chest height pass over him. Crayfish contact, low mower clippings and the boss shockwave still hit.
- **BREAKING (controls):** dropping through a one-way platform (clubhouse tables and bar, `=` ledges) becomes **Down + Jump**. Down alone now kneels on a platform instead of dropping through. Down on a ladder top still climbs down the ladder.
- **Kneeling pose:** new kneeling sprite frames (standing still and shooting), also with the disc cutter.
- **Controls text:**
  - The title screen's controls list gets "UP/DOWN – CLIMB/KNEEL".
  - The README controls table documents Kneel and Down + Jump.
- **Tests:** in-game tests for kneeling, the low shot killing a ground crayfish, ducking under a briefcase, Down + Jump drop-through, Down alone not dropping, ladder tops, and standing up under a low ceiling.
- **Promo agent (tools/promo):**
  - The bridge, metrics and the agent know the kneeling muzzle height, so a ground crayfish in line counts as a hittable target.
  - The agent kneels to shoot crayfish standing on its route instead of only vaulting over them.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `game/gameplay`:
  - "Keyboard movement and jumping": Down is no longer reserved for ladders.
  - New requirement "Kneeling and low shots".
  - New requirement "Dropping through one-way platforms" (Down + Jump).
- `game/presentation`:
  - "Title and end screens": the controls summary lists kneeling.
  - New requirement "Kneeling pose".

## Impact

- **Game code:**
  - `src/player.js`: kneel state, hitbox, low muzzle, drop-through input, kneel drawing
  - `src/sprites.js`: kneeling frames
  - `src/screens.js`: title controls
  - `src/test.js`: new and adjusted tests
  - `README.md`: controls table
  - `dist/buck_nukem.html`: rebuilt
- **Level design:** levels that need a drop through a one-way platform stay completable; the drop just needs Down + Jump now. `tools/check_levels.py` is unchanged (it doesn't model inputs).
- **Promo tooling:**
  - `tools/promo/bridge.js` (`hittableInLine`)
  - `tools/promo/agent/world.py` (`hittable`)
  - `tools/promo/agent/behaviour.py`: a kneel-shot tactic for crayfish
  - `tools/promo/agent/controller.py`: hold Down while kneeling
  - `tools/promo/agent/metrics.py`: hittable rule note
- **In-flight change:** the python-promo-autopilot spec text "a crayfish only while it leaps" becomes "a crayfish while it leaps, or on the ground from a kneeling shot". That edit is made in that change's spec delta, which isn't archived yet.
- **No new dependencies.** File size grows by a few hundred bytes of sprite rows.
