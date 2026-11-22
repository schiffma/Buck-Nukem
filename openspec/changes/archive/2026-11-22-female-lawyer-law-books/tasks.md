# Tasks

## 1. Female lawyer sprites

- [x] 1.1 Replace `LAWYER_TOP`, `LAWYER_THROW_TOP`, `LAWYER_LEGS1` and `LAWYER_LEGS2` in `src/sprites.js` with the female lawyer: a short bob, lips, a white blouse collar, a dark skirt-suit jacket (palette `n`/`N`), a pencil skirt to the knee, skin legs, dark heels, and a raised arm in the throwing pose, in the same 16 × 30 frame.

  Tests in `src/test.js`:
  - The existing outline and 3-tone checks still pass for `SPR.lawyer` and `SPR.lawyerThrow`.
  - The frames differ from the old male rows (kept as a fixture).
  - The leg rows below the skirt contain skin pixels and no suit pixels.
  - No hair pixels below the chin row.

  Check by eye in the `sprites` sheet.

## 2. Swiss law books

- [x] 2.1 Add `LAWBOOK_CODES` (OR red, ZGB dark blue, StGB green, SchKG orange, each with 1–3 article labels) and procedural law book sprites `SPR.lawbook[code] = [flat, onEdge]`: a 10 × 8 cover with a white cross, a page edge and an outline, padded consistently.

  Tests:
  - 4 cover colours.
  - White cross pixels on each cover.
  - Every edge pixel is outlined.
  - The two frames differ.
- [x] 2.2 The lawyer throws `{ kind: "lawbook", code }` with the briefcase's box and physics. `drawEnemyShots` draws it with a tumble frame every 0.1 s. When it hits the hero or a solid tile it bursts: page particles and a floating article label (`FX.text`). Rename the `briefcase` kind in the tests.

  Tests:
  - A lawyer throws a law book toward the hero (with the throw sound).
  - A book hitting a wall or the hero spawns page particles and an `FX.text` whose text is one of that code's articles.
  - The kneel-duck test passes with a law book.

## 3. Lawyer lines

- [x] 3.1 Factor out `drawSpeechBubble(text, cx, bottomY)` from `Fans.drawBubble`, with an identical look (the existing fan bubble tests keep passing). Add `LAWYER_LINES`: at least 8 lines, each at most 20 characters, drawable with the font, at least half naming a Swiss code or article.
  - At a throw: with chance 0.5, only if `talkCd <= 0` and no other lawyer is talking, show a bubble for 1.5 s and set `talkCd = 4`.
  - Draw it above her head, clamped to the screen.

  Tests:
  - The line pool rules (count, length, font coverage, Swiss share).
  - Over 30 s of a lawyer throwing repeatedly, the gaps between her bubbles are at least 4 s.
  - With two lawyers throwing, there is never more than one lawyer bubble at a time.
  - Bubbles end after about 1.5 s.

## 4. Docs and checks

- [x] 4.1 Update the README's enemies line (female lawyers with short hair throwing Swiss law books — OR, ZGB, StGB, SchKG — and calling out legal one-liners). Rebuild `dist/buck_nukem.html`. Verify:
  - `python tools/run_tests.py` passes everything.
  - A `play` screenshot on level 1 near a lawyer, and one on level 3, show the new lawyer readable.
  - `python tools/promo/record_promo.py --dry all` reports "Spec limits: all met".

## Workflow follow-up

- Archive after review; release as the next version if wanted.
