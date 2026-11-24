# Tasks

## 1. Track per level

- [x] 1.1 Add the `music:` header (design §1): `music: biker` in `1_road.txt`, `music: funk` in `2_courts.txt`, `music: laendler` in `4_clubhouse.txt` (first built as `polka`, see group 6); `Level.music` defaulting to `valkyries`; `Game.setState` choosing the level's track for every non-title state (the ride check goes); `tools/build.py` failing on an unknown track name, with a unit test in `tools/test_build.py`. Until 2.x and 3.x land, map `funk` and `polka` to the Valkyries so the game keeps playing. Verify with `python tools/build.py`, `python -m unittest tools/test_build.py` and `python tools/run_tests.py`.

## 2. The funk track

- [x] 2.1 Add the funk voices to `Sound.playEvent` (design §2): `slap` (with the `pop` flag), `clav`, `scratch`, `brass`, `ohat`, built only from oscillators, gains, biquads, noise and the existing wave shaper. Verify with `python tools/run_tests.py` (no regressions).
- [x] 2.2 Compose `SONGS.funk` (104 bpm, E dorian, 16 bars: groove, A9/B7#9 section with brass stabs, break, turnaround) in the event-list format. Check it quotes no known funk riff. Add tests: 16 × 16 steps, bpm 96–112, one loop contains `slap`, `scratch`, `clav`, `brass`, `kick`, `snare`, `hat` and `ohat`; it loops without a gap with a stubbed clock. Verify with `python tools/run_tests.py`.

## 3. The beer polka (superseded by group 6, the Schwyzer Ländler)

- [x] 3.1 Add the polka voices (design §3): `tuba`, `accord`, `clar`, `clink`. Verify with `python tools/run_tests.py`.
- [x] 3.2 Compose `SONGS.polka` (128 bpm, B♭ major, two 8-bar phrases, oom-pah, clarinet melody, accordion fill, glass clinks on bars 8 and 16) in the event-list format; check it quotes no known polka ("Beer Barrel Polka" and others). Add tests: 16 × 16 steps, bpm 120–140, tuba on the beats and accordion on the off-beats in every bar, melody notes, snare, kick and clinks present; it loops without a gap. Verify with `python tools/run_tests.py`.

## 4. Routes, balance, promo, docs

- [x] 4.1 Route tests (design §5): reel 1–5 intros select `biker`, `funk`, `valkyries`, `polka` (now `laendler`, group 6), `valkyries` (boss at tempo 1.25), each from step 0; pause, respawn and the tally keep track and step; `#level=2` and `#level=4` start with the funk and the polka. Update the existing tests that expect the Valkyries at reel 2. Verify with `python tools/run_tests.py`, `--browser edge` and `--hash touch`.
- [x] 4.2 Balance: an offline render of one loop of the funk, the polka and the Valkyries; peaks and RMS within ±3 dB; adjust the voice levels. Check `python tools/perf_phone.py` stays within budget.
- [x] 4.3 Promo: `python tools/promo/record_promo.py --dry all` runs clean (the recorder logs the new track switches and renders the songs).
- [x] 4.4 Update the README (music per reel, credits: original funk and polka, synthesized live) and re-run the full checks: build, tests (Chrome, Edge, touch), `check_levels.py`, promo unit tests, `openspec validate funk-and-polka-level-music --strict`.

## 6. The Schwyzer Ländler (superseded by group 7, "Ramseyers wei go grase")

- [x] 6.1 Replace the polka with the Ländler: the voices `orgeli`, `bassg` and `piano` (design §3; `clar` and `clink` stay, `tuba` and `accord` go), `SONGS.laendler` (3/4, 168 bpm, 12 steps per bar, B♭ major, two 8-bar phrases, um-pa-pa with plucked bass and piano, Örgeli melody with runs and turns, clarinet second voice, clinks on bars 8 and 16, no drums) in place of `SONGS.polka`; the clubhouse header `music: laendler` and the build's track list. Check the tune quotes no known Ländler or folk song.
- [x] 6.2 Tests: replace the polka tests with Ländler tests (16 × 12 steps, 150–180 bpm, bass on step 0 and piano on steps 4 and 8 in every bar, `orgeli`, `clar` and `clink` present, no `kick`, `snare` or `hat`; seamless loop); the route tests expect `laendler` at reel 4 and with `#level=4`; the level-header test and `tools/test_build.py` use `laendler`. Verify with `python tools/run_tests.py`, `--browser edge`, `--hash touch` and `python -m unittest tools/test_build.py`.
- [x] 6.3 Balance the Ländler against the Valkyries (offline render, peak and RMS within ±3 dB), update the README (music per reel, credits: an original Schwyzer Ländler), and re-run the full checks: build, tests, `check_levels.py`, `perf_phone.py`, promo dry run and unit tests, `openspec validate funk-and-polka-level-music --strict`.

## 7. "Ramseyers wei go grase" (superseded by group 8, the Clarinet Polka)

- [x] 7.1 Transcribe the melody of "Ramseyers wei go grase" from the songbook page (design §3: render it at a high resolution; melody line only, 4/4, D major, with the pick-up) into `SONGS.ramseyer`: Örgeli melody, clarinet second voice on the repeat, bass on beats 1 and 3, piano on beats 2 and 4 with the song's harmony, clinks at the phrase ends, no drums, about 116 bpm. Remove `SONGS.laendler`; the clubhouse header `music: ramseyer` and the build's track list. Note the source in a comment.
- [x] 7.2 Tests: replace the Ländler tests (16 bars × 16 steps, 100–130 bpm, bass on steps 0 and 8 and piano on steps 4 and 12 in every bar, `orgeli`, `clar`, `clink` present, no drums, the melody equal to the transcribed note list, seamless loop); the route and level-header tests and `tools/test_build.py` use `ramseyer`. Verify with `python tools/run_tests.py`, `--browser edge`, `--hash touch` and `python -m unittest tools/test_build.py`.
- [x] 7.3 Balance the song against the Valkyries (offline render, peak and RMS within ±3 dB), update the README (music per reel; credits: the traditional folk song "Ramseyers wei go grase", public domain, in the game's own arrangement) and re-run the full checks: build, tests, `check_levels.py`, `perf_phone.py`, promo dry run and unit tests, `openspec validate funk-and-polka-level-music --strict`.

## 8. The Clarinet Polka (design §3, play-test revision)

- [x] 8.1 Import the melody: `tools/midi_melody.py` reads `clarinet-polka.mid` (flutetunes.com) and writes `CLARINET_POLKA_TUNE` (per bar `[step, midi, steps]`, 24 steps per 2/4 bar, key changes noted) with the source and rights comment into `src/audio.js`. Check the import: 583 notes, the first notes F4 E♭4 D4 F4 B♭4 D5, the key changes B♭ → F → E♭.
- [x] 8.2 Arrange `SONGS.clarinetpolka` (design §3): the clarinet lead, the derived chords (with the override table), tuba on the beats, accordion off the beats, a light kick and snare, clinks at the section ends, 112 bpm, the 12-per-quarter grid, a seamless loop. Bring back `tuba` and `accord`, add the clarinet `lead` flag, remove `orgeli`, `bassg`, `piano`, `SONGS.ramseyer` and `RAMSEYER_TUNE`; the clubhouse header `music: clarinetpolka` and the build's track list.
- [x] 8.3 Tests: replace the Ramseyer tests (2/4 on 24 steps per bar, 100–130 bpm, a tuba note on each beat and accordion off the beats in every bar, `clar`, `tuba`, `accord`, `kick`, `snare`, `clink` present, the clarinet melody equal to `CLARINET_POLKA_TUNE` with 583 notes, seamless loop); the route, level-header and build tests use `clarinetpolka`. Verify with `python tools/run_tests.py`, `--browser edge`, `--hash touch` and `python -m unittest tools/test_build.py`.
- [x] 8.4 Balance against the Valkyries (offline render, peak and RMS within ±3 dB), update the README (music per reel; credits: the Clarinet Polka, traditional Polish / K. Namysłowski, public domain, melody after the flutetunes.com transcription, the game's own arrangement) and re-run the full checks: build, tests, `check_levels.py`, `perf_phone.py`, promo dry run and unit tests, `openspec validate funk-and-polka-level-music --strict`.

## 5. Play test

- [ ] 5.1 You listen in Chrome: the funk on the courts, the Clarinet Polka in the clubhouse (tune and chords), the hand-overs between reels, and the balance against the Valkyries and the sound effects.
