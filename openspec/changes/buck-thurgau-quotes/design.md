# Design

## Context

The quote-pack system from `buck-quote-packs` (implemented, not yet archived) does the work: `src/quotes/<pack>.txt`, `quotes: <pack>` in a level header, `Quotes.onKill(type)` from `damageEnemy`, a `[kill:<type>]` section *instead of* `[kill]`, a 3 s cooldown and build checks (at most 20 characters, font glyphs, no duplicates within a section). Only `1_road.txt` names a pack (`ride`). Enemies on foot: lawyer, cray and punk in levels 2–4; in the boss arena, the crayfish the boss summons. The font draws `A–Z 0–9 Ä Ö Ü` and ` !%'()*+,-./:<=>?♥`.

## Goals / Non-Goals

**Goals:** kill lines in every level; Thurgau dialect; a Harry Hasler-like tone; lines that match the enemy type on foot; content only, with no code change.

**Non-Goals:** `[start]` lines; new `[finale]` lines; a line for the giant boss's own death (it does not go through `Quotes.onKill`); voice audio; rewriting the ride's existing lines; different packs per level.

## Decisions

### 1. One shared `thurgau` pack for levels 2–5
All four levels on foot name `quotes: thurgau`. Per-level packs would repeat most lines, since the levels share the same enemies. A level can still get its own pack later.

### 2. Type sections hold general lines too
A `[kill:<type>]` section replaces `[kill]` for that type, so a lawyer kill would never draw a general line. Each type section therefore holds about 8 lines about that enemy plus 4 general boasts. Duplicates *across* sections are allowed by the build. `[kill]` stays as a fallback for any other type.

### 3. Style
- Thurgau / eastern Swiss markers: *goht* (not *gaht*), *nöd*, *öppe*, *gäll*, *gsii*, *hoi zäme*, *gopf*, *mä* (one), *-li* diminutives, *Mostindie* (Thurgau's nickname), *Most*, apple juice and Lake Constance references.
- Hasler-style tone: an agglo macho in love with himself and his style, who calls the ladies *Schätzeli*, likes cars and chrome, and calls himself king of Mostindie. The lines are original and quote no catchphrases from the show.
- All caps, at most 20 characters, dry and never explicit (as on the ride).

### 4. Draft content (checked for length and glyphs; final wording may be polished during apply)

`src/quotes/thurgau.txt`:
```
[kill]
HOI ZÄME, TSCHÜSS!      DAS GOHT RUCK-ZUCK.   GOPF, BIN I GUET.
SO MACHT MÄ DAS.        ÖPPE SO, GÄLL?        KÖNIG VO MOSTINDIE.
NÖD SCHLECHT, GÄLL?     LUEG UND LEHR, GÄLL.  STIL HÄND MIR, GÄLL.
DAS ISCH THURGAU!       SCHÄTZELI, LUEG MOL!  GHÖRT ZUM SERVICE.
HÄSCH GSEH, SCHATZ?     GOHT DOCH, GÄLL!      SO GUET BIN I HALT.
[kill:lawyer]
PLÄDOYER ABGLEHNT.      FALL ABGSCHLOSSE.     EINSPRUCH? GOHT NÖD.
RÄCHNIG GOHT AN DICH    SCHÄTZELI, KEI ZIIT.  URTEIL GSPROCHE.
KLAG ABGWIESE, GÄLL.    MIT MIR NÖD, MADAME.  PARAGRAPH FERTIG.
GOPF, SO EN STRESS.     HOI ZÄME, TSCHÜSS!    SO MACHT MÄ DAS.
[kill:cray]
CHREBSSUPPE, HOI!       AB IN TOPF!           ZRUGG IN BACH, GÄLL.
SCHERE AB, GOPF.        CHREBS MIT MOSTSAUCE  ROT BISCH SCHO GSII.
FÜR DE GRILL, HOI.      CHREBSLI, ADIEU.      CHREBSLI, GUET NACHT
DAS ISCH THURGAU!       GOPF, BIN I GUET.     ÖPPE SO, GÄLL?
[kill:punk]
SO MÄHT MÄ RASE!        ZWEITAKTER? FERTIG.   KEI BENZIN MEH, GÄLL
AB AUF D DEPONIE.       PUNK ISCH TOT, HOI.   FRISUR SITZT, GÄLL?
RASE GMÄHT, GOPF.       DE MÄHER ISCH HIN.    LUEG UND LEHR, GÄLL.
STIL HÄND MIR, GÄLL.    SCHÄTZELI, LUEG MOL!  GOHT DOCH, GÄLL!
```
(In the file: one line per quote; the columns here are only for reading.)

Added to the ride's `[kill]` in `src/quotes/ride.txt`, under a comment marking them as the Thurgau lines:
```
S MOFA ISCH KÖNIG!   PS SIND NÖD ALLES.    LEASING ABGLAUFE.
MFK? NÖD BESTANDE.   SCHÖNI CHARRE, GSII.  CHROM UND RAUCH, HOI
HOI ABSCHLEPPDIENST! DIE KISTE ISCH HIN.   GOPF, BIN I GUET.
STIL HÄND MIR, GÄLL. SCHÄTZELI, LUEG MOL!  KÖNIG VO MOSTINDIE.
```
The ride's header comment is updated: "Swiss German, dry; plus Thurgau macho lines".

### 5. Tests (`src/test.js`)
- Levels 2–5 name `thurgau`; the pack has `kill`, `kill:lawyer`, `kill:cray` and `kill:punk`, each type section with ≥ 12 lines, all ≤ 20 characters and in the font. This extends the existing ride content check to every pack.
- The ride's `[kill]` holds ≥ 24 lines (14 old + the new ones), and the old lines are still there (spot check "SO, FERTIG.").
- A lawyer kill on a courts test map with `quotes: thurgau` shows a line from `kill:lawyer`.
- The existing quote-pack tests stay green (the cooldown and the finale).

## Risks / Trade-offs

- [Dialect accuracy] → The lines are written in an approximation of Thurgau speech. The user, who knows the dialect, reviews the wording in `src/quotes/thurgau.txt`, which needs no code change.
- [Bubbles cover the action on foot] → The 3 s cooldown and the 1.5 s bubble time are unchanged, and the overlap rules keep Buck quiet when there is no room.
- [Too close to the TV character] → The lines are original and in the same spirit, with no catchphrases, names or quotes from the show.
- [Depends on an unarchived change] → `buck-quote-packs` is implemented in the working tree. Archive it before or together with this one.
