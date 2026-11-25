# Design

## Context

See proposal.md for the motivation. Current state:
- `src/cars.js`: a destroyed car's `die()` calls `Cars.bailOut(e)`, which pushes a runner (`Cars.runners`, drawn with `SPR.driverRun`, 6 × 12); the limo's `die()` also pushes the president as a runner and starts `Mofa.startFinale(e)`. `SPR.ladyRun` (8 × 14) and `SPR.ladyCrawl` (12 × 7) are built in `buildCarSprites()`.
- `src/ride.js`: the finale (`Mofa.finale`) holds two ladies `{x, y, dir, style, out, line, bubble, anim}`; they crawl at `CONFIG.finale.crawl` px/s; `endFinale` turns them into `ladyRun` runners; `drawFinale` draws `SPR.ladyCrawl`. Their bubbles are drawn in `Talk.draw`, anchored at the lady.
- `src/fans.js`: fans are 20 × 32 (`FAN_W`, `FAN_H`), built by `buildFanFrame(v, frame)` from a variant `v` (style `tennis`, `activist` or `rocker`, hair, skin, outfit colours) and a frame name (`idle`, `wave`, `jump`, `kiss`), outlined like the other sprites; `SPR.fansBy[style][variant][frame]`.

## Goals / Non-Goals

**Goals:** no figures smaller than the fans on the ride; the finale ladies at fan size in the fans' style, climbing out and staying by the wreck, complaining at Buck; Buck's reply a dry Swiss German line from the quote pack.

**Non-Goals:** changing the finale's timing, skip or lock; adding running drivers at fan size; changing the fans themselves; Buck answering every later complaint.

## Decisions

### 1. No runners
- `Cars.bailOut`, the president's runner push, `Cars.runners` (update and draw) and the sprites `SPR.driverRun`, `SPR.ladyRun`, `SPR.ladyCrawl` are removed. The wreck (fire, smoke, fading) stays as it is.
- The vehicles screenshot mode stops drawing `SPR.driverRun`.

### 2. A "posh" fan style
- `FAN_VARIANTS_POSH`: two variants, built with the existing builder so outline, proportions and shading match the fans:
  - pink: blonde hair, pink wide-brimmed hat with a band, pink dress, pearls, sunglasses, white gloves;
  - white: dark hair, white hat with a black band, white dress with a dark belt, pearls, sunglasses.
- `buildFanFrame` gets a `posh` branch: the dress (knee length), the big hat over the hair, pearls at the neck, sunglasses; frames `stand` (arms at the sides, chin up), `climb` (one knee raised, a hand gripping the door edge: the lower 10 rows are not drawn, as if still inside the car), `scold` (one forearm raised, finger wagging; arm 2 px higher than in `stand`). These frames exist only for the posh style; `SPR.fansBy.posh[variant][frame]`.
- The posh style never appears among the background fans (`Fans.spawn` does not use it).

### 3. The finale with full-size ladies
- At the start each lady stands at the limo's side door positions (the two side windows, `limoX(37)` and `limoX(107)`), feet on the road (`y = road top − FAN_H`), hidden until her turn.
- Her turn (`lady1` 0.6 s, `lady2` 1.8 s): a 0.4 s climb-out (`climb` frame, rising 10 px out of the door), then `stand` beside the car facing Buck; her bubble at `say1` / `say2` as now, anchored above her head (`y − 4`, the two staggered if they would touch).
- End (5.0 s or skip): both turn away from Buck and stomp off at 70 px/s (`walk1`/`walk2` every 0.15 s) until they are off screen, then they are removed; they are drawn in front of the wreck. `CONFIG.finale.crawl` becomes `CONFIG.finale.stomp` (70).
- Drawing stays in `Mofa.drawFinale` (now also after the finale ends, while the ladies walk off: `Mofa.finaleLadies` keeps them until they leave the screen).

### 4. Tests
- No runners: destroying an X7, a Tesla, a Ferrari and the limo leaves no `Cars.runners` (the list is gone) and draws nothing smaller than the fans; the wreck still burns.
- Ladies: the posh frames are `FAN_W × FAN_H` (20 × 32) like the fans' frames, two variants with distinct hat colours; in the finale both are out and standing by 2.6 s, each with her bubble in order, then Buck's line; after the end both walk away from Buck and leave the screen within 4 s.
- The existing finale tests (lock, order, cigarette, control back, skip, gate) keep passing; the god-mode play-through still reaches the tally.
- Screenshot mode `#shot=finale,<t>` checks by eye at 1.2, 2.5 and 5.5 s.

## Risks / Trade-offs

- [Full-size ladies cover the limo's bubbles or Buck] → they stand at the side doors, away from the mofa; their bubbles use the same overlap rules as before.
- [The climb-out looks odd against the car's outline] → the lower body is hidden (inside the car) only during 0.4 s; a screenshot check.
- [Removing the runners loses some liveliness] → the burning wrecks and the bubbles remain; that is the requested trade.

## Revision 2: the ladies stay and complain, Buck replies in Swiss German

Replaces the walk-off of §2 and §3; the climb-out, sizes and timing stay.

### 5. The ladies stay
- `Mofa.walkers`, `updateWalkers`, `CONFIG.finale.stomp` and the `walk1`/`walk2` frames are removed; `POSH_FRAMES` becomes `stand`, `climb`, `scold`.
- The two ladies live in `Mofa.ladies` (set by `startFinale`, cleared on level load), not inside `Mofa.finale`, so they outlast the scene. `Mofa.finale` keeps only the timing. Their bubbles in `Talk.draw` and in `Talk.rects` (the ride's bubble count and overlap checks) read `Mofa.ladies`.
- They always face Buck (`dir` from Buck's x each step). The `scold` frame shows while a lady's bubble is up, `stand` otherwise. Nothing collides with them; they are drawn in front of the wreck until the level ends.
- A respawn after the scene keeps them (the limo is destroyed for good).

### 6. Complaining after the scene
- From the scene's end, while at least one lady is on screen: every `CONFIG.finale.nagEvery` ([2, 3] s, random) the next lady in turn says the next line of a shuffled deck of `LIMO_FINALE_LINES` (reshuffled when used up), for 1.5 s, through the same rule as the cars: not when two ride bubbles are up, not overlapping another bubble (Buck's included); if blocked she tries again 0.3 s later.
- `LIMO_FINALE_LINES` grows to at least 12 complaints aimed at Buck, at most 20 characters, drawable with the font (for example "YOU RUINED MY DAY!", "I'LL SUE YOU, MOFA!", "THAT WAS A BENTLEY!", "MY HUSBAND'S A JUDGE").
- Off screen the ladies are quiet; the timer waits.

### 7. Buck's reply from the quote pack
- The build's quote-pack parser accepts a `[finale]` section (`tools/build.py` `parse_quote_pack`); the README's quote-pack section lists it.
- `src/quotes/ride.txt` gets a `[finale]` section with at least 6 dry Swiss German lines, at most 20 characters: "NÖD MIS PROBLEM.", "MACH KEI THEATER.", "WÄRSCH DIHEI BLIBE.", "SO ISCH DS LÄBE.", "ÄXGÜSI, MADAME.", "TUET MER NÖD LEID.", "CHASCH DÄNK, GELL?", "ISCH HALT SO.".
- At `CONFIG.finale.buck` the finale calls `Quotes.finaleLine()`: a line from the level's pack `finale` section (random, no repeat until used up), shown for 1.8 s and setting `talkCd`; without the section Buck says nothing and the scene goes on (cigarette as before). "YOU HAVE NO CLUE" is gone.
- The `game/presentation` requirement "Buck's quote packs" is added by `buck-quote-packs`, which is still open: archive that change before this one so the MODIFIED delta finds it.

### 8. Tests (revision 2)
- Replace the walk-off test: after the scene ends, both ladies are still at their spots by the wreck after 5 s, facing Buck, and none has moved.
- Nagging: riding on slowly for 8 s after the scene with the ladies on screen gives at least 2 complaint bubbles from both ladies in turn, each from `LIMO_FINALE_LINES`, at most two ride bubbles at a time, none overlapping; the `scold` frame is drawn while a bubble is up; with the ladies off screen no bubble appears.
- Reply: in the scene Buck's bubble text is one of `QUOTE_PACKS.ride.finale`; with a pack without `[finale]` he says nothing and the cigarette still lights.
- Lines: at least 12 complaint lines, at most 20 characters, font-drawable; the ride pack has at least 6 `finale` lines.
- `tools/test_build.py`: `[finale]` parses; `[finale:x]` is an unknown section.
- Screenshots `#shot=finale,<t>` at 3.5 s (Buck's reply) and 7 s (standing, scolding, a complaint bubble).

### Risks (revision 2)
- [Endless nagging gets annoying] → only while they are on screen; the gate is right behind the limo, so it lasts a few seconds.
- [Their bubbles crowd Buck's cigarette ride] → the shared two-bubble limit and overlap checks.
