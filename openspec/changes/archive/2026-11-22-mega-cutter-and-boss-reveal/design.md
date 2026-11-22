# Design

## Context

- **Weapon pickups:** `w` tiles spawn a pickup. `collectPickup` sets `Player.weapon = "mega"` (Mega Blaster) and shows "MEGA BLASTER!".
- **Disc cutter:** the boss arena forces `Player.weapon = "cutter"` in `loadLevel` and on respawn (`player.js`). `fireBlade()` creates one 14 px blade with `CONFIG.cutterDmg` (3) damage at `CONFIG.cutterRate` (2.5/s). Blades use the 4 spinning `SPR.sawBlade` frames.
- **Health respawns:** the arena already re-adds health pickups on a timer from `Game.arenaHealthSpots`, in `Boss.update`. The upgrade can reuse that pattern.
- **Camera:** `Camera.follow` uses a dead zone; `Camera.snap` and `clamp` exist.
- **State flow:** the arena reaches play through LEVEL_INTRO → `setState(STATE.BOSS)` in `Game.update`, while tests call `setState(STATE.BOSS)` directly. Boss starts in state `"intro"` with `t = 1.5` and doesn't attack then.
- **Top platform:** row 5, columns 12–16. `h` is at (14,4) and a fan at (15,4); (13,4) is free.

## Goals / Non-Goals

**Goals:**
- A pickup worth the climb that clearly shortens the fight.
- A reveal that shows where the boss is, without slowing down repeated attempts.

**Non-Goals:**
- No new boss attacks and no changes to boss health.
- No reveal on respawn, and no cinematic letterboxing.
- No change to the Mega Blaster in levels 1–3.

## Decisions

1. **Weapon value `"megacutter"`:**
   - `collectPickup` for `w` checks `Game.level.isBoss`. In the arena it gives `"megacutter"` and shows "MEGA CUTTER!"; elsewhere it gives `"mega"` as before.
   - Everything that tests `weapon === "cutter"` becomes `isCutter()` (cutter or megacutter): sprite choice, `fireBlade` vs `fire`, the HUD and the promo bridge's `hittableInLine`.
   - Respawn already resets to `"cutter"` in the arena, which covers "lost with a life".

   *Alternative:* a separate `megaT` timer flag. Rejected, because the weapon value already drives the HUD and sprites.
2. **Twin blades:** with `"megacutter"`, `fireBlade` pushes two blades, each 16 px with `CONFIG.megaCutterDmg = 5`.
   - One flies level.
   - The other has `vy = -CONFIG.megaCutterRise` (about 70 px/s), so from the firing ledge it rises across the face's 62 px height, while the level blade covers its lower part.
   - Both use `SPR.megaBlade` frames, the saw blade recoloured with an orange rim and a hot centre.

   Each blade hits on its own, so up to 10 damage per shot. With the 2.5/s rate, the fight drops from about 17 face hits to about 5–10. Deflection rules are unchanged.

   `updateHeroShots` already moves `s.vy`. Kneeling makes both blades roll along the floor, the second slightly rising.
3. **Pickup coming back:**
   - On level load the arena records `Game.arenaUpgradeSpot` from the `w` spawn.
   - `Boss.update` (or `updateWorld` while the level is the arena) keeps `upgradeTimer`: it starts at 20 s when the upgrade is taken, counts down only while `Player.weapon !== "megacutter"`, and at 0 re-adds the `w` pickup with a spark, if none is present.
   - Taking it again restarts the timer.
4. **Boss reveal:**
   - `Game.reveal = { t: 0 }` is set only in the LEVEL_INTRO → BOSS transition. Tests that call `setState(BOSS)` directly skip it, and so does respawning.
   - While `Game.reveal` is active, `updateWorld` updates FX, fans and the boss's idle animation only: the boss is held in `"intro"` with `t` kept above 0, and the player gets no input. The world clock keeps running for the animations.
   - The camera eases from the hero position to `clamp(Boss.ox + 60 − W/2)` over 0.8 s, holds for 1.2 s with the boss's claws raised as a show, then eases back over 0.8 s, using `Camera.x` directly.
   - At the end, `Camera.snap(Player)`, `Game.reveal = null` and `Boss.toIdle()`.
   - Jump or Fire pressed during the reveal jump to the pan-back phase, shortened to 0.3 s.
   - Enter keeps pausing as usual.
5. **Promo agent:**
   - The bridge exposes `reveal: !!Game.reveal`, and the agent emits no input while it is set, so it doesn't fight the freeze.
   - The `w` item gets a high value in `VALUE_S` for the boss level, so the planner routes to the top platform first.
   - The boss leaf treats `"megacutter"` like the cutter.
   - Verified with dry runs.

## Risks / Trade-offs

- **Twin blades make the fight trivial** → damage 5 rather than 6, the pickup sits on the hardest-to-reach platform, it's lost on death, and it takes 20 s to come back.
- **The pan annoys on repeated attempts** → it's skippable with Jump or Fire and only plays on arena entry; respawns don't replay it.
- **Existing tests depend on the boss starting in "intro" for 1.5 s** → the reveal only runs on the LEVEL_INTRO path, and the flow tests that go through LEVEL_INTRO are updated to skip it or wait about 3 s.
- **The angled blade from the floor flies over the face** → intended; from the floor the level blade still hits, and from the ledge both can.
