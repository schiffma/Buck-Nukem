// Web Audio synth: two looping tracks - an original 70s-style hard-rock title theme and a
// chiptune arrangement of Wagner's "Ride of the Valkyries" (public-domain composition) for
// play - plus synthesized sound effects. No recordings or samples are used.
// The AudioContext is created on the first key press (browser autoplay rules).

function midiHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

// Note names -> MIDI numbers
const NOTE = (function () {
  const names = { C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 };
  const out = {};
  for (let o = 1; o <= 7; o++) for (const n in names) out[n + o] = 12 * (o + 1) + names[n];
  return out;
})();

// Time unit: one sixteenth note. 9/8 bar = 18 sixteenths.
// The Valkyrie figure per bar: dotted-eighth, sixteenth, eighth, then two dotted quarters.
function valkBar(a, b, c, d, e) {
  return e ? [[a, 3], [b, 1], [c, 2], [d, 6], [e, 6]] : [[a, 3], [b, 1], [c, 2], [d, 12]];
}
const PHRASE_A = [ // B minor statement
  valkBar("B4", "F#4", "B4", "D5", "B4"),
  valkBar("D5", "B4", "D5", "F#5", "D5"),
  valkBar("F#5", "D5", "F#5", "A5", "A4"),
  valkBar("D5", "A4", "D5", "F#5"),
];
const PHRASE_B = [ // D major answer
  valkBar("D5", "A4", "D5", "F#5", "D5"),
  valkBar("F#5", "D5", "F#5", "A5", "F#5"),
  valkBar("A5", "F#5", "A5", "C#6", "C#5"),
  valkBar("F#5", "C#5", "F#5", "A5"),
];
const BASS_A = ["B2", "B2", "D3", "D3"], BASS_B = ["D3", "D3", "F#2", "F#2"];
const CHORDS = {
  B2: ["B3", "D4", "F#4", "B4"], D3: ["D4", "F#4", "A4", "D5"], "F#2": ["F#3", "A3", "C#4", "F#4"],
};

const SONG = (function buildSong() {
  const STEPS_PER_BAR = 18;
  const bars = [];
  [[PHRASE_A, BASS_A, false], [PHRASE_B, BASS_B, false], [PHRASE_A, BASS_A, true], [PHRASE_B, BASS_B, true]]
    .forEach(function (p) {
      for (let i = 0; i < 4; i++) bars.push({ melody: p[0][i], bass: p[1][i], arp: p[2] });
    });
  const events = []; // per step: list of {v, m, d}
  for (let i = 0; i < bars.length * STEPS_PER_BAR; i++) events.push([]);
  bars.forEach(function (bar, bi) {
    const base = bi * STEPS_PER_BAR;
    let t = 0;
    bar.melody.forEach(function (n) {
      events[base + t].push({ v: "lead", m: NOTE[n[0]], d: n[1] });
      t += n[1];
    });
    const root = NOTE[bar.bass];
    for (let beat = 0; beat < 3; beat++) {          // galloping bass: 3-1-2 per beat
      const s = base + beat * 6;
      events[s].push({ v: "bass", m: root, d: 3 });
      events[s + 3].push({ v: "bass", m: root + 12, d: 1 });
      events[s + 4].push({ v: "bass", m: root, d: 2 });
      events[s].push({ v: beat === 1 ? "snare" : "kick" });
      events[s + 3].push({ v: "hat" });
    }
    if (bar.arp) {                                   // string-swirl arpeggios on held beats
      const ch = CHORDS[bar.bass].map(function (n) { return NOTE[n]; });
      const pat = [0, 1, 2, 3, 2, 1];
      for (let s = 6; s < 18; s++) events[base + s].push({ v: "arp", m: ch[pat[s % 6]] + 12, d: 1 });
    }
  });
  return { events: events, steps: events.length, sixteenth: 0.1 };   // dotted quarter = 100 bpm
})();

// All looping tracks: "title" (original 70s hard rock, defined below) and "valkyries".
// ---- Title theme: original 70s-style hard rock in E minor, 4/4, 132 bpm, 16 bars ----
// Written for this game (no quoted riffs). Voices: distorted guitar riff ("gtr", "pm" =
// palm-muted), power chords ("pow"), bass ("rbass"), kick/snare/hat, toms and crash.
// Riff bars: [note, sixteenths]; a trailing "p" marks a palm-muted note.
const ROCK_RIFF = {
  A: [["E2p", 2], ["E2p", 1], ["E2p", 1], ["G2", 2], ["E2p", 1], ["A2", 3], ["E2p", 1], ["D3", 1], ["E3", 2], ["D3", 2]],
  B: [["E2p", 2], ["E2p", 1], ["E2p", 1], ["G2", 2], ["E2p", 1], ["A2", 2], ["A#2", 1], ["A2", 2], ["G2", 2], ["E2", 2]],
  C: [["A2p", 2], ["A2p", 1], ["A2p", 1], ["C3", 2], ["A2p", 1], ["D3", 3], ["A2p", 1], ["G2", 1], ["A2", 2], ["B2", 2]],
  D: [["E2p", 2], ["E2p", 1], ["E2p", 1], ["G2", 2], ["E2p", 1], ["A2", 2], ["A#2", 1], ["B2", 2], ["D3", 2], ["B2", 2]],
  RUN: ["E3", "D3", "B2", "A2", "G2", "E2", "G2", "A2", "B2", "D3", "E3", "D3", "B2", "A2", "G2", "A2"].map(function (n) { return [n, 1]; }),
};
const ROCK = (function buildRock() {
  const STEPS = 16, events = [];
  const bars = [ // riff bars (bass roots per half bar), power-chord bars [first half, second half], break
    { riff: "A", bass: ["E2", "E2"] }, { riff: "B", bass: ["E2", "E2"] }, { riff: "A", bass: ["E2", "E2"] }, { riff: "C", bass: ["A2", "A2"] },
    { riff: "A", bass: ["E2", "E2"] }, { riff: "B", bass: ["E2", "E2"] }, { riff: "A", bass: ["E2", "E2"] }, { riff: "D", bass: ["E2", "B2"], fill: true },
    { pow: ["E2", "G2"] }, { pow: ["A2", "G2"] }, { pow: ["E2", "G2"] }, { pow: ["C3", "D3"] },
    { pow: ["E2", "G2"] }, { pow: ["A2", "B2"] },
    { riff: "RUN", bass: ["E2", "E2"] }, { stop: "B2" },
  ];
  for (let i = 0; i < bars.length * STEPS; i++) events.push([]);
  bars.forEach(function (bar, bi) {
    const base = bi * STEPS;
    function at(s, e) { events[base + s].push(e); }
    if (bar.riff) {
      let t = 0;
      ROCK_RIFF[bar.riff].forEach(function (n) {
        const pm = n[0].slice(-1) === "p";
        at(t, { v: "gtr", m: NOTE[pm ? n[0].slice(0, -1) : n[0]], d: n[1], pm: pm });
        t += n[1];
      });
    }
    if (bar.pow) {   // chug-chug-hit, then the held second chord
      [[0, 3, 0], [3, 3, 0], [6, 2, 0], [8, 6, 1], [14, 2, 1]].forEach(function (h) { at(h[0], { v: "pow", m: NOTE[bar.pow[h[2]]], d: h[1] }); });
    }
    const roots = bar.bass || bar.pow || [bar.stop, null];
    for (let s = 0; s < STEPS; s += 2) { const r = roots[s < 8 ? 0 : 1]; if (r) at(s, { v: "rbass", m: NOTE[r] - 12, d: 2 }); }
    if (bar.stop) {  // break: four B5 stabs with the kit, then a tom roll back into bar 1
      [0, 2, 4, 6].forEach(function (s) { at(s, { v: "pow", m: NOTE[bar.stop], d: 2 }); at(s, { v: "kick" }); at(s, { v: "snare" }); });
      [8, 10, 12, 14].forEach(function (s, i) { at(s, { v: "tom", f: [220, 180, 140, 110][i] }); });
      at(15, { v: "kick" });
      return;
    }
    // straight rock beat: kick on 1 and 3 (+ push), snare on 2 and 4, eighth-note hats, crash on bars 1 and 9
    const crash = bi === 0 || bi === 8;
    [0, 8, 10].forEach(function (s) { at(s, { v: "kick" }); });
    [4, 12].forEach(function (s) { at(s, { v: "snare" }); });
    if (bar.fill) [14, 15].forEach(function (s) { at(s, { v: "snare" }); });
    for (let s = crash ? 2 : 0; s < STEPS; s += 2) at(s, { v: "hat" });
    if (crash) at(0, { v: "crash" });
  });
  return { events: events, steps: events.length, sixteenth: 60 / 132 / 4 };
})();

// ---- Ride theme: original 70s-style biker rock in A, 150 bpm, boogie shuffle, 16 bars ----
// Written for this game (no quoted riffs). The boogie figure (root with fifth, sixth and
// flat seventh, palm-muted, two eighths each) is a generic blues idiom. Voices: "dyad"
// (palm-muted double stop), "pow", "rbass", "slide" (engine-rev guitar slide), kit.
// Off-beat eighths are swung (song.swing: delayed by a third of a sixteenth).
const BIKER = (function buildBiker() {
  const STEPS = 16, events = [];
  const A = NOTE.A2, D = NOTE.D3, E = NOTE.E3, G = NOTE.G2;
  const bars = [
    { boogie: A, slide: [NOTE.E2, NOTE.A2] }, { boogie: A, crash: true },                  // intro: riff, rev into the verse
    { boogie: A, crash: true }, { boogie: A }, { boogie: D }, { boogie: A },                 // verse
    { boogie: E }, { boogie: D }, { boogie: A }, { boogie: E, fill: true },
    { pow: [A, G], crash: true }, { pow: [D, A] }, { pow: [A, G] }, { pow: [E, E], fill: true },   // chorus
    { stabs: E, slide: [NOTE.E2, NOTE.E3] }, { stop: A },                                   // break, tom roll back to the top
  ];
  for (let i = 0; i < bars.length * STEPS; i++) events.push([]);
  bars.forEach(function (bar, bi) {
    const base = bi * STEPS;
    function at(s, e) { events[base + s].push(e); }
    if (bar.boogie) {
      const R = bar.boogie;
      [7, 7, 9, 9, 10, 10, 9, 9].forEach(function (iv, k) { at(k * 2, { v: "dyad", m: R, i: iv, d: 2 }); });
      [0, 4, 7, 9, 10, 9, 7, 4].forEach(function (iv, k) { at(k * 2, { v: "rbass", m: R - 12 + iv, d: 2 }); });   // walking bass
    }
    if (bar.pow) {   // chug-chug-hit, then the held second chord
      [[0, 3, 0], [3, 3, 0], [6, 2, 0], [8, 6, 1], [14, 2, 1]].forEach(function (h) { at(h[0], { v: "pow", m: bar.pow[h[2]], d: h[1] }); });
      for (let s = 0; s < STEPS; s += 2) at(s, { v: "rbass", m: bar.pow[s < 8 ? 0 : 1] - 12, d: 2 });
    }
    if (bar.stabs) { [0, 2, 4, 6].forEach(function (s) { at(s, { v: "pow", m: bar.stabs, d: 1 }); at(s, { v: "kick" }); at(s, { v: "snare" }); }); }
    if (bar.slide) at(bar.stabs ? 8 : 12, { v: "slide", m: bar.slide[0], m2: bar.slide[1], d: bar.stabs ? 8 : 4 });
    if (bar.stop) {
      at(0, { v: "pow", m: bar.stop, d: 4 }); at(0, { v: "kick" }); at(0, { v: "crash" });
      [8, 10, 12, 14].forEach(function (s, i) { at(s, { v: "tom", f: [240, 190, 150, 115][i] }); });
      return;
    }
    if (bar.stabs) return;
    // shuffle beat: kick on 1 and 3 (+ push), snare on 2 and 4, eighth-note hats
    [0, 8, 11].forEach(function (s) { at(s, { v: "kick" }); });
    [4, 12].forEach(function (s) { at(s, { v: "snare" }); });
    if (bar.fill) [13, 14, 15].forEach(function (s) { at(s, { v: "snare" }); });
    for (let s = bar.crash ? 2 : 0; s < STEPS; s += 2) at(s, { v: "hat" });
    if (bar.crash) at(0, { v: "crash" });
  });
  return { events: events, steps: events.length, sixteenth: 60 / 150 / 4, swing: 1 / 3, bpm: 150 };
})();

// Engine sound per car make (posh drivers, src/cars.js): firing rate (Hz), tone, filter, loudness.
// The Tesla is an electric whine at a third of the X7's volume; the Ferrari roars.
const CAR_ENGINES = {
  suv:     { rate: 10, freq: 45, cut: 600, gain: 0.15 },    // BMW X7: low diesel rumble
  tesla:   { rate: 90, freq: 330, cut: 800, gain: 0.05 },   // faint electric whine
  ferrari: { rate: 55, freq: 160, cut: 3000, gain: 0.22 },  // loud and high
  limo:    { rate: 8, freq: 38, cut: 400, gain: 0.08 },     // a parked V8 idling
};

// Reel 2, the clay courts: an original 70s funk groove (104 bpm, E): slap bass with octave pops,
// sixteenth chicken-scratch guitar, clavinet off-beats, brass stabs, a tight beat with ghost notes.
// Bars 1-8 groove on E9, 9-12 A9 / B7#9 with brass stabs, 13-14 a bass-and-drums break, 15-16 a
// turnaround with a rising brass line. Original note data; no known funk riff is quoted.
const FUNK = (function buildFunk() {
  const STEPS = 16, events = [];
  const E9 = [56, 62, 66], A9 = [61, 67, 71], B79 = [63, 69, 74];          // voicings (G#-D-F#, C#-G-B, D#-A-D)
  const GROOVE = [[0, 0, 2], [3, 0, 1], [6, 12, 1, 1], [8, 0, 1], [10, 3, 1], [11, 5, 1], [12, 0, 1], [14, 12, 1, 1], [15, 10, 1, 1]];
  const GROOVE_B = [[0, 0, 2], [3, 0, 1], [6, 12, 1, 1], [8, 7, 1], [9, 5, 1], [10, 3, 1], [12, 0, 2], [14, -2, 1], [15, -1, 1]];
  const bars = [
    { root: 40, chord: E9, bass: GROOVE, crash: true }, { root: 40, chord: E9, bass: GROOVE }, { root: 40, chord: E9, bass: GROOVE }, { root: 40, chord: E9, bass: GROOVE_B },
    { root: 40, chord: E9, bass: GROOVE }, { root: 40, chord: E9, bass: GROOVE }, { root: 40, chord: E9, bass: GROOVE }, { root: 40, chord: E9, bass: GROOVE_B, stab: [64, 68, 71] },
    { root: 45, chord: A9, bass: GROOVE, stab: [67, 71, 76] }, { root: 45, chord: A9, bass: GROOVE, stab: [67, 71, 76] },
    { root: 47, chord: B79, bass: GROOVE, stab: [69, 75, 78] }, { root: 47, chord: B79, bass: GROOVE_B, stab: [69, 75, 78] },
    { root: 40, brk: [[0, 0, 2], [4, 3, 1], [6, 5, 1], [8, 6, 1], [10, 7, 2], [14, 10, 1]] },
    { root: 40, brk: [[0, 12, 1, 1], [2, 10, 1], [4, 7, 1], [6, 5, 1], [8, 3, 1], [10, 0, 2], [14, -2, 1]] },
    { root: 40, chord: E9, bass: GROOVE, line: [[0, [64, 68, 71]], [4, [66, 69, 73]], [8, [68, 71, 74]], [12, [69, 73, 76]]] },
    { root: 40, chord: E9, bass: GROOVE_B, line: [[0, [68, 71, 76]], [6, [69, 73, 78]], [12, [71, 74, 80]]] },
  ];
  for (let i = 0; i < bars.length * STEPS; i++) events.push([]);
  bars.forEach(function (bar, bi) {
    const base = bi * STEPS;
    function at(s, e) { events[base + s].push(e); }
    (bar.brk || bar.bass).forEach(function (n) { at(n[0], { v: "slap", m: bar.root + n[1], d: n[2], pop: !!n[3] }); });
    if (bar.chord) {
      for (let s = 0; s < STEPS; s++) if (s !== 4 && s !== 12) at(s, { v: "scratch", c: bar.chord, acc: s % 4 === 2 });
      [4, 12].forEach(function (s) { at(s, { v: "scratch", c: bar.chord, acc: true }); });
      [2, 7, 10, 15].forEach(function (s) { at(s, { v: "clav", c: bar.chord.map(function (m) { return m + 12; }), d: 1 }); });
    }
    if (bar.stab) at(14, { v: "brass", c: bar.stab, d: 2 });
    if (bar.line) bar.line.forEach(function (l) { at(l[0], { v: "brass", c: l[1], d: 3 }); });
    // the beat: kick on 1, the "a" of 2 and the "and" of 3; snare on 2 and 4 with ghost notes;
    // closed hats on every sixteenth, an open hat on the "and" of 4
    [0, 7, 10].forEach(function (s) { at(s, { v: "kick" }); });
    [4, 12].forEach(function (s) { at(s, { v: "snare" }); });
    [6, 9, 15].forEach(function (s) { at(s, { v: "snare", g: 0.3 }); });
    for (let s = 0; s < STEPS; s++) if (s !== 14) at(s, { v: "hat" });
    at(14, { v: "ohat" });
    if (bar.crash) at(0, { v: "crash" });
  });
  return { events: events, steps: events.length, sixteenth: 60 / 104 / 4, swing: 0.1, bpm: 104 };
})();

// Reel 4, the clubhouse: the Clarinet Polka ("Dziadunio Polka"; traditional Polish, around 1900,
// also credited to Karol Namyslowski, copyrighted 1913, died 1925: public domain either way), in
// the game's own arrangement. The melody is imported note for note with tools/midi_melody.py from
// the melody-only MIDI transcription on flutetunes.com ("clarinet-polka.mid", 2/4, 112 bpm); the
// chords, voicing and band are the game's own (no published arrangement is copied). Grid: twelve
// steps per quarter (sixteenths 3 steps, triplet sixteenths 2), 24 steps per 2/4 bar; the tune's
// pick-up sits at the end of the last bar so the loop is seamless.
// 583 notes, 96 bars of 24 steps; first notes F4 Eb4 D4 F4 Bb4 D5
const CLARINET_POLKA_TUNE = [
  [[0,62,3],[3,65,3],[6,70,2],[9,74,2],[12,65,3],[15,70,3],[18,74,2],[21,77,2]],   // 1
  [[0,74,6],[6,74,6],[12,74,6],[18,74,3],[21,77,3]],   // 2
  [[0,74,6],[6,74,3],[9,77,3],[12,74,6],[18,74,3],[21,77,3]],   // 3
  [[0,77,3],[3,75,3],[6,72,2],[9,69,2],[12,65,3],[18,65,2],[20,67,2],[22,65,2]],   // 4
  [[0,63,3],[3,65,3],[6,69,2],[9,72,2],[12,65,3],[15,69,3],[18,72,2],[21,75,2]],   // 5
  [[0,81,6],[6,81,6],[12,81,6],[18,79,3],[21,75,3]],   // 6
  [[0,81,6],[6,79,3],[9,75,3],[12,81,6],[18,79,3],[21,75,3]],   // 7
  [[0,79,3],[3,77,3],[6,74,2],[9,70,2],[12,65,6],[18,65,2],[21,63,2]],   // 8
  [[0,62,3],[3,65,3],[6,70,2],[9,74,2],[12,65,3],[15,70,3],[18,74,2],[21,77,2]],   // 9
  [[0,74,6],[6,74,6],[12,74,6],[18,74,3],[21,77,3]],   // 10
  [[0,74,6],[6,74,3],[9,77,3],[12,74,6],[18,74,3],[21,77,3]],   // 11
  [[0,77,3],[3,75,3],[6,72,2],[9,69,2],[12,65,6],[18,65,2],[20,67,2],[22,65,2]],   // 12
  [[0,63,3],[3,65,3],[6,69,2],[9,72,2],[12,65,3],[15,69,3],[18,72,2],[21,75,2]],   // 13
  [[0,81,6],[6,81,6],[12,81,6],[18,79,3],[21,75,3]],   // 14
  [[0,77,6],[6,81,3],[9,79,3],[12,77,3],[15,75,3],[18,74,3],[21,72,3]],   // 15
  [[0,70,3],[6,70,6],[12,70,6],[18,65,2],[21,63,2]],   // 16
  [[0,62,3],[3,65,3],[6,70,2],[9,74,2],[12,65,3],[15,70,3],[18,74,2],[21,77,2]],   // 17
  [[0,74,6],[6,74,6],[12,74,6],[18,74,3],[21,77,3]],   // 18
  [[0,74,6],[6,74,3],[9,77,3],[12,74,6],[18,74,3],[21,77,3]],   // 19
  [[0,77,3],[3,75,3],[6,72,2],[9,69,2],[12,65,3],[18,65,2],[20,67,2],[22,65,2]],   // 20
  [[0,63,3],[3,65,3],[6,69,2],[9,72,2],[12,65,3],[15,69,3],[18,72,2],[21,75,2]],   // 21
  [[0,81,6],[6,81,6],[12,81,6],[18,79,3],[21,75,3]],   // 22
  [[0,81,6],[6,79,3],[9,75,3],[12,81,6],[18,79,3],[21,75,3]],   // 23
  [[0,79,3],[3,77,3],[6,74,2],[9,70,2],[12,65,6],[18,65,2],[21,63,2]],   // 24
  [[0,62,3],[3,65,3],[6,70,2],[9,74,2],[12,65,3],[15,70,3],[18,74,2],[21,77,2]],   // 25
  [[0,74,6],[6,74,6],[12,74,6],[18,74,3],[21,77,3]],   // 26
  [[0,74,6],[6,74,3],[9,77,3],[12,74,6],[18,74,3],[21,77,3]],   // 27
  [[0,77,3],[3,75,3],[6,72,2],[9,69,2],[12,65,6],[18,65,2],[20,67,2],[22,65,2]],   // 28
  [[0,63,3],[3,65,3],[6,69,2],[9,72,2],[12,65,3],[15,69,3],[18,72,2],[21,75,2]],   // 29
  [[0,81,6],[6,81,6],[12,81,6],[18,79,3],[21,75,3]],   // 30
  [[0,77,6],[6,81,3],[9,79,3],[12,77,3],[15,75,3],[18,74,3],[21,72,3]],   // 31
  [[0,70,3],[6,70,6],[12,70,6]],   // 32
  [[0,72,2],[2,74,2],[4,72,2],[6,71,3],[9,72,3],[12,74,3],[15,72,3],[18,71,3],[21,72,3]],   // 33
  [[0,69,3],[3,72,3],[6,77,2],[9,81,2],[12,84,12]],   // 34
  [[0,81,3],[3,84,3],[6,82,2],[9,81,2],[12,79,3],[15,82,3],[18,81,2],[21,79,2]],   // 35
  [[0,77,3],[3,81,3],[6,81,2],[9,79,2],[12,77,3],[15,76,3],[18,74,3],[21,72,3]],   // 36
  [[0,72,2],[2,74,2],[4,72,2],[6,71,3],[9,72,3],[12,74,3],[15,72,3],[18,71,3],[21,72,3]],   // 37
  [[0,69,3],[3,72,3],[6,77,2],[9,81,2],[12,84,12]],   // 38
  [[0,81,3],[3,84,3],[6,82,2],[9,81,2],[12,79,3],[15,82,3],[18,81,2],[21,79,2]],   // 39
  [[0,77,3],[6,77,6],[12,77,6]],   // 40
  [[0,72,2],[2,74,2],[4,72,2],[6,71,3],[9,72,3],[12,74,3],[15,72,3],[18,71,3],[21,72,3]],   // 41
  [[0,69,3],[3,72,3],[6,77,2],[9,81,2],[12,84,12]],   // 42
  [[0,81,3],[3,84,3],[6,82,2],[9,81,2],[12,79,3],[15,82,3],[18,81,2],[21,79,2]],   // 43
  [[0,77,3],[3,81,3],[6,81,2],[9,79,2],[12,77,3],[15,76,3],[18,74,3],[21,72,3]],   // 44
  [[0,72,2],[2,74,2],[4,72,2],[6,71,3],[9,72,3],[12,74,3],[15,72,3],[18,71,3],[21,72,3]],   // 45
  [[0,69,3],[3,72,3],[6,77,2],[9,81,2],[12,84,12]],   // 46
  [[0,81,3],[3,84,3],[6,82,2],[9,81,2],[12,79,3],[15,82,3],[18,81,2],[21,79,2]],   // 47
  [[0,77,3],[6,77,6],[12,77,6],[18,65,2],[21,63,2]],   // 48
  [[0,62,3],[3,65,3],[6,70,2],[9,74,2],[12,65,3],[15,70,3],[18,74,2],[21,77,2]],   // 49
  [[0,74,6],[6,74,6],[12,74,6],[18,74,3],[21,77,3]],   // 50
  [[0,74,6],[6,74,3],[9,77,3],[12,74,6],[18,74,3],[21,77,3]],   // 51
  [[0,77,3],[3,75,3],[6,72,2],[9,69,2],[12,65,3],[18,65,2],[20,67,2],[22,65,2]],   // 52
  [[0,63,3],[3,65,3],[6,69,2],[9,72,2],[12,65,3],[15,69,3],[18,72,2],[21,75,2]],   // 53
  [[0,81,6],[6,81,6],[12,81,6],[18,79,3],[21,75,3]],   // 54
  [[0,81,6],[6,79,3],[9,75,3],[12,81,6],[18,79,3],[21,75,3]],   // 55
  [[0,79,3],[3,77,3],[6,74,2],[9,70,2],[12,65,6],[18,65,2],[21,63,2]],   // 56
  [[0,62,3],[3,65,3],[6,70,2],[9,74,2],[12,65,3],[15,70,3],[18,74,2],[21,77,2]],   // 57
  [[0,74,6],[6,74,6],[12,74,6],[18,74,3],[21,77,3]],   // 58
  [[0,74,6],[6,74,3],[9,77,3],[12,74,6],[18,74,3],[21,77,3]],   // 59
  [[0,77,3],[3,75,3],[6,72,2],[9,69,2],[12,65,6],[18,65,2],[20,67,2],[22,65,2]],   // 60
  [[0,63,3],[3,65,3],[6,69,2],[9,72,2],[12,65,3],[15,69,3],[18,72,2],[21,75,2]],   // 61
  [[0,81,6],[6,81,6],[12,81,6],[18,79,3],[21,75,3]],   // 62
  [[0,77,6],[6,81,3],[9,79,3],[12,77,3],[15,75,3],[18,74,3],[21,72,3]],   // 63
  [[0,70,3],[6,70,6],[12,70,6],[18,82,3]],   // 64
  [[0,82,15],[15,79,3],[18,75,3],[21,72,3]],   // 65
  [[0,70,18],[18,70,3],[21,68,3]],   // 66
  [[0,67,3],[3,70,3],[6,75,2],[9,70,2],[12,67,3],[15,70,3],[18,75,2],[21,70,2]],   // 67
  [[0,68,3],[3,70,3],[6,74,2],[9,70,2],[12,68,3],[18,80,3]],   // 68
  [[0,80,15],[15,77,3],[18,74,3],[21,72,3]],   // 69
  [[0,70,18],[18,82,2],[20,84,2],[22,82,2]],   // 70
  [[0,86,9],[9,80,3],[12,86,9],[21,80,3]],   // 71
  [[0,84,3],[3,82,3],[6,79,2],[9,75,2],[12,70,3],[18,82,3]],   // 72
  [[0,82,15],[15,79,3],[18,75,3],[21,72,3]],   // 73
  [[0,70,18],[18,70,3],[21,68,3]],   // 74
  [[0,67,3],[3,70,3],[6,75,2],[9,70,2],[12,67,3],[15,70,3],[18,75,2],[21,70,2]],   // 75
  [[0,68,3],[3,70,3],[6,74,2],[9,70,2],[12,68,3],[18,80,3]],   // 76
  [[0,80,15],[15,77,3],[18,74,3],[21,72,3]],   // 77
  [[0,70,18],[18,70,6]],   // 78
  [[0,70,2],[2,72,2],[4,70,2],[6,69,3],[9,70,3],[12,71,3],[15,72,3],[18,73,3],[21,74,3]],   // 79
  [[0,75,3],[6,75,6],[12,75,6],[18,82,3]],   // 80
  [[0,82,15],[15,79,3],[18,75,3],[21,72,3]],   // 81
  [[0,70,18],[18,70,3],[21,68,3]],   // 82
  [[0,67,3],[3,70,3],[6,75,2],[9,70,2],[12,67,3],[15,70,3],[18,75,2],[21,70,2]],   // 83
  [[0,68,3],[3,70,3],[6,74,2],[9,70,2],[12,68,3],[18,80,3]],   // 84
  [[0,80,15],[15,77,3],[18,74,3],[21,72,3]],   // 85
  [[0,70,18],[18,82,2],[20,84,2],[22,82,2]],   // 86
  [[0,86,9],[9,80,3],[12,86,9],[21,80,3]],   // 87
  [[0,84,3],[3,82,3],[6,79,2],[9,75,2],[12,70,3],[18,82,3]],   // 88
  [[0,82,15],[15,79,3],[18,75,3],[21,72,3]],   // 89
  [[0,70,18],[18,70,3],[21,68,3]],   // 90
  [[0,67,3],[3,70,3],[6,75,2],[9,70,2],[12,67,3],[15,70,3],[18,75,2],[21,70,2]],   // 91
  [[0,68,3],[3,70,3],[6,74,2],[9,70,2],[12,68,3],[18,80,3]],   // 92
  [[0,80,15],[15,77,3],[18,74,3],[21,72,3]],   // 93
  [[0,70,18],[18,70,6]],   // 94
  [[0,70,2],[2,72,2],[4,70,2],[6,69,3],[9,70,3],[12,71,3],[15,72,3],[18,73,3],[21,74,3]],   // 95
  [[0,75,3],[6,75,6],[12,75,6],[18,65,2],[21,63,2]],   // 96
];
const CLARINET_POLKA_KEYS = [[0, "Bb"], [32, "F"], [48, "Bb"], [64, "Eb"]];   // [first bar (0-based), key]
// Per-bar chord overrides (0-based bar -> "I" | "IV" | "V7"), set by ear where the automatic choice is off.
const CLARINET_POLKA_CHORDS = {};
const CLARINET_POLKA = (function buildClarinetPolka() {
  const STEPS = 24, events = [];
  const ROOT = { Bb: 10, F: 5, Eb: 3 };
  const CHORDS = { I: [0, 4, 7], IV: [5, 9, 0], V7: [7, 11, 2, 5] };
  function keyAt(b) { let k = CLARINET_POLKA_KEYS[0][1]; CLARINET_POLKA_KEYS.forEach(function (e) { if (b >= e[0]) k = e[1]; }); return k; }
  // the chord of a bar: the one of I, IV, V7 covering the most melody time (notes on the beats count double)
  function chordOf(b, prev) {
    if (CLARINET_POLKA_CHORDS[b]) return CLARINET_POLKA_CHORDS[b];
    const r = ROOT[keyAt(b)];
    let best = prev || "I", bestScore = -1;
    ["I", "V7", "IV"].forEach(function (name) {
      const pcs = CHORDS[name].map(function (iv) { return (r + iv) % 12; });
      let sc = 0;
      CLARINET_POLKA_TUNE[b].forEach(function (n) { if (pcs.indexOf(n[1] % 12) >= 0) sc += n[2] * (n[0] % 12 === 0 ? 2 : 1); });
      if (sc > bestScore || (sc === bestScore && name === prev)) { best = name; bestScore = sc; }
    });
    return best;
  }
  function near(pc, lo) { let m = lo + ((pc - lo) % 12 + 12) % 12; return m; }   // the pitch class at or just above lo
  let prev = null;
  CLARINET_POLKA_TUNE.forEach(function (tune, b) {
    for (let i = 0; i < STEPS; i++) events.push([]);
    const base = b * STEPS, r = ROOT[keyAt(b)], name = chordOf(b, prev), iv = CHORDS[name];
    prev = name;
    function at(s, e) { events[base + s].push(e); }
    const root = near((r + iv[0]) % 12, 34), fifth = near((r + iv[0] + 7) % 12, 34);
    const chord = iv.slice(0, 3).map(function (x) { return near((r + x) % 12, 58); }).sort(function (a, c) { return a - c; });
    at(0, { v: "tuba", m: root, d: 9 }); at(12, { v: "tuba", m: fifth, d: 9 });          // oom ...
    [6, 18].forEach(function (s) { at(s, { v: "accord", c: chord, d: 5 }); });          // ... pah
    [0, 12].forEach(function (s) { at(s, { v: "kick", g: 0.7 }); });
    [6, 18].forEach(function (s) { at(s, { v: "snare", g: 0.35 }); });
    tune.forEach(function (n) { at(n[0], { v: "clar", m: n[1], d: n[2], lead: true }); });
    if (b === 31 || b === 47 || b === 63 || b === CLARINET_POLKA_TUNE.length - 1) at(12, { v: "clink" });   // section ends
  });
  return { events: events, steps: events.length, sixteenth: 60 / 112 / 12, bpm: 112, beats: 2, grid: 12 };
})();

const SONGS = { title: ROCK, valkyries: SONG, biker: BIKER, funk: FUNK, clarinetpolka: CLARINET_POLKA };

const Sound = {
  ac: null, master: null, music: null, sfx: null, noiseBuf: null,
  muted: false, playing: false, tempo: 1, step: 0, nextTime: 0, timer: null,
  track: "title",     // key into SONGS
  sixteenth: 0.1,     // seconds per sixteenth of the Valkyries at tempo 1 (kept for the tests)

  unlock() {
    if (!this.ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ac = new AC();
      this.master = this.ac.createGain(); this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ac.destination);
      this.music = this.ac.createGain(); this.music.gain.value = 0.32; this.music.connect(this.master);
      this.sfx = this.ac.createGain(); this.sfx.gain.value = 0.5; this.sfx.connect(this.master);
      this.shapeCurve = this.makeCurve();
      const len = this.ac.sampleRate;
      this.noiseBuf = this.ac.createBuffer(1, len, this.ac.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ac.state === "suspended") this.ac.resume();
  },

  // Sound is "ready" when it can play: the context runs, or there is no live audio at all
  // (no Web Audio in this browser, or headless: the promo recorder renders audio offline).
  supported() { return !!(window.AudioContext || window.webkitAudioContext); },
  ready() { return !this.supported() || Game.headless || !!(this.ac && this.ac.state === "running"); },
  // Page load: try to start right away (works where the browser allows autoplay); otherwise the
  // context stays suspended until the first key, click or tap. No error either way.
  tryAutoplay() {
    if (!this.supported()) return;
    try { this.unlock(); } catch (e) { return; }
    const self = this, go = function () { if (self.ac && self.ac.state === "running" && !self.playing && self.wantMusic !== false) self.startMusic(); };
    go();
    try { const p = this.ac.resume(); if (p && p.then) p.then(go, function () {}); } catch (e) { /* stays suspended */ }
  },
  // a suspended context (background tab, browser policy) is resumed on every interaction and when the tab shows again
  resume() { if (this.ac && this.ac.state === "suspended") { try { this.ac.resume(); } catch (e) { /* ignore */ } } },

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 1;
    return this.muted;
  },

  startMusic() {
    if (!this.ac || this.playing) return;
    this.playing = true;
    this.step = 0;
    this.nextTime = this.ac.currentTime + 0.05;
    const self = this;
    this.timer = setInterval(function () { self.schedule(); }, 25);
    this.schedule();
  },
  stopMusic() {
    this.playing = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  },
  setTempo(t) { this.tempo = t; },
  // Switch songs; the new one starts from its first step. Same track: no-op (keeps playing).
  setTrack(name) {
    if (name === this.track) return;
    this.track = name;
    this.step = 0;
    if (this.playing && this.ac) this.nextTime = this.ac.currentTime + 0.05;
  },
  song() { return SONGS[this.track] || SONG; },

  schedule() {
    if (!this.playing) return;
    // after a stall (background tab: timers throttled) skip the missed sixteenths, so the song
    // stays in time and nothing is played late in a burst
    const now = this.ac.currentTime;
    if (this.nextTime < now - 0.1) {
      const len = this.song().sixteenth / this.tempo, missed = Math.ceil((now - this.nextTime) / len);
      this.step = (this.step + missed) % this.song().steps;
      this.nextTime += missed * len;
      if (this.nextTime < now) this.nextTime = now + 0.05;
    }
    const horizon = this.ac.currentTime + 0.12;
    while (this.nextTime < horizon) {
      const song = this.song();
      const len = song.sixteenth / this.tempo;
      const evs = song.events[this.step % song.steps];
      // swing: off-beat eighths come late (the biker shuffle); the step grid itself stays even
      const at = this.nextTime + (song.swing && this.step % 4 === 2 ? song.swing * len : 0);
      for (const e of evs) this.playEvent(e, at, len);
      this.nextTime += len;
      this.step = (this.step + 1) % song.steps;
    }
  },

  playEvent(e, t, len) {
    switch (e.v) {
      case "lead":
        this.tone("square", midiHz(e.m), t, e.d * len * 0.92, 0.22, this.music);
        this.tone("square", midiHz(e.m) * 1.004, t, e.d * len * 0.92, 0.08, this.music); // chorus detune
        break;
      case "bass": this.tone("triangle", midiHz(e.m), t, e.d * len * 0.85, 0.5, this.music); break;
      case "arp": this.tone("square", midiHz(e.m), t, len * 0.7, 0.06, this.music); break;
      case "kick": this.sweep("sine", 140, 40, t, 0.12, 0.6 * (e.g || 1), this.music); break;
      case "snare": this.noise(t, 0.1, 0.25 * (e.g || 1), 1800, this.music); break;     // g: ghost notes softer
      case "hat": this.noise(t, 0.03, 0.08, 7000, this.music); break;
      // title theme (rock) voices
      case "gtr": this.guitar([midiHz(e.m)], t, e.pm ? len * 0.8 : e.d * len * 0.95, e.pm ? 0.5 : 0.7, e.pm); break;
      case "pow": this.guitar([midiHz(e.m), midiHz(e.m + 7), midiHz(e.m + 12)], t, e.d * len * 0.9, 0.45, false); break;
      case "rbass": this.bassNote(midiHz(e.m), t, e.d * len * 0.85, 0.45); break;
      // ride theme (biker rock) voices
      case "dyad": this.guitar([midiHz(e.m), midiHz(e.m + e.i)], t, e.d * len * 0.8, 0.45, true); break;
      case "slide": this.guitarSlide(midiHz(e.m), midiHz(e.m2), t, e.d * len, 0.6); break;
      case "crash": this.noise(t, 1.4, 0.3, 12000, this.music); break;
      // funk (reel 2)
      case "slap": this.slap(midiHz(e.m), t, e.d * len, e.pop); break;
      case "clav": this.clav(e.c.map(midiHz), t, Math.max(0.12, e.d * len)); break;
      case "scratch": this.noise(t, 0.035, e.acc ? 0.22 : 0.16, 3200, this.music); if (e.acc) this.guitar(e.c.map(midiHz), t, 0.06, 0.18, true); break;
      case "brass": this.brass(e.c.map(midiHz), t, e.d * len); break;
      case "ohat": this.noise(t, 0.2, 0.09, 9000, this.music); break;
      // the clubhouse: the Clarinet Polka's band (reel 4)
      case "tuba": this.tuba(midiHz(e.m), t, e.d * len); break;
      case "accord": this.accordion(e.c.map(midiHz), t, e.d * len); break;
      case "clar": this.clarinet(midiHz(e.m), t, e.d * len, e.lead); break;
      case "clink": this.tone("sine", 2600, t, 0.25, 0.1, this.music); this.tone("sine", 3905, t + 0.03, 0.22, 0.08, this.music); break;
      case "tom": this.sweep("sine", e.f, e.f * 0.5, t, 0.2, 0.55, this.music); break;
    }
  },

  // Soft-clip "amp" curve (tanh) for the distorted guitar.
  makeCurve() {
    const n = 1024, c = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(4 * x) / Math.tanh(4); }
    return c;
  },
  // Guitar amp chain (drive -> waveshaper -> cabinet lowpass -> level) into the music bus.
  // Rebuilt whenever the music bus changes (the promo recorder renders into a new one).
  ampInput() {
    if (this.amp && this.amp.bus === this.music) return this.amp.input;
    const ac = this.ac;
    const input = ac.createGain(), shaper = ac.createWaveShaper(), cab = ac.createBiquadFilter(), out = ac.createGain();
    input.gain.value = 3;
    shaper.curve = this.shapeCurve || (this.shapeCurve = this.makeCurve());
    shaper.oversample = "2x";
    cab.type = "lowpass"; cab.frequency.value = 3200; cab.Q.value = 0.9;
    out.gain.value = 0.2;
    input.connect(shaper); shaper.connect(cab); cab.connect(out); out.connect(this.music);
    this.amp = { bus: this.music, input: input };
    return input;
  },
  // One guitar note or chord: two slightly detuned saws per pitch into the amp.
  // Palm-muted notes are darker and shorter.
  guitar(freqs, t, dur, vol, pm) {
    if (!this.ac) return;
    const ac = this.ac, g = ac.createGain(), f = ac.createBiquadFilter();
    f.type = "lowpass"; f.frequency.setValueAtTime(pm ? 900 : 6000, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.004);
    g.gain.setValueAtTime(vol, t + Math.max(0.01, dur * 0.7));
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    f.connect(g); g.connect(this.ampInput());
    freqs.forEach(function (fr) {
      [0.997, 1.003].forEach(function (k) {
        const o = ac.createOscillator();
        o.type = "sawtooth"; o.frequency.setValueAtTime(fr * k, t);
        o.connect(f); o.start(t); o.stop(t + dur + 0.02);
      });
    });
  },
  // A sliding guitar note (pitch sweeps f0 -> f1): the engine-rev lick of the ride theme.
  // ---- funk and polka-band voices: oscillators, filters and gains only (the promo renders them offline) ----
  env(g, t, attack, peak, dur, sus) {      // fast attack, decay to sus x peak at 70% of dur, then silence at t + dur
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * (sus || 0.25)), t + Math.max(attack + 0.01, dur * 0.7));
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.02);
  },
  slap(freq, t, dur, pop) {                 // slap bass: triangle body + a short square transient, filter snapping shut
    if (!this.ac) return;
    const ac = this.ac, f = ac.createBiquadFilter(), g = ac.createGain();
    f.type = "lowpass"; f.frequency.setValueAtTime(pop ? 3200 : 1500, t); f.frequency.exponentialRampToValueAtTime(320, t + 0.12);
    this.env(g, t, 0.003, pop ? 0.5 : 0.6, Math.max(0.08, dur * 0.9), 0.6);
    f.connect(g); g.connect(this.music);
    [["triangle", 1], ["square", 0.35]].forEach(function (w, k) {
      const o = ac.createOscillator(), og = ac.createGain();
      o.type = w[0]; o.frequency.setValueAtTime(freq, t); og.gain.value = w[1];
      if (k === 1) { og.gain.setValueAtTime(w[1], t); og.gain.linearRampToValueAtTime(0.0001, t + 0.03); }
      o.connect(og); og.connect(f); o.start(t); o.stop(t + dur + 0.05);
    });
  },
  clav(freqs, t, dur) {                    // clavinet: detuned squares through a bandpass, quick decay
    if (!this.ac) return;
    const ac = this.ac, f = ac.createBiquadFilter(), g = ac.createGain();
    f.type = "bandpass"; f.frequency.setValueAtTime(1400, t); f.Q.value = 1.5;
    this.env(g, t, 0.002, 0.15, dur);
    f.connect(g); g.connect(this.music);
    freqs.forEach(function (fr) { [0.998, 1.002].forEach(function (k) {
      const o = ac.createOscillator(); o.type = "square"; o.frequency.setValueAtTime(fr * k, t);
      o.connect(f); o.start(t); o.stop(t + dur + 0.05);
    }); });
  },
  brass(freqs, t, dur) {                   // brass section: detuned saws, the filter swelling open
    if (!this.ac) return;
    const ac = this.ac, f = ac.createBiquadFilter(), g = ac.createGain();
    f.type = "lowpass"; f.frequency.setValueAtTime(600, t); f.frequency.linearRampToValueAtTime(2600, t + 0.05);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.07, t + 0.04);
    g.gain.setValueAtTime(0.055, t + Math.max(0.05, dur * 0.7)); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.03);
    f.connect(g); g.connect(this.music);
    freqs.forEach(function (fr) { [0.995, 1, 1.005].forEach(function (k) {
      const o = ac.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(fr * k, t);
      o.connect(f); o.start(t); o.stop(t + dur + 0.06);
    }); });
  },
  tuba(freq, t, dur) {                     // oom: sine with a softer triangle an octave up, soft attack
    if (!this.ac) return;
    const ac = this.ac, g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.5, t + 0.02);
    g.gain.setValueAtTime(0.42, t + dur * 0.6); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    g.connect(this.music);
    [["sine", 1, 1], ["triangle", 2, 0.3]].forEach(function (w) {
      const o = ac.createOscillator(), og = ac.createGain();
      o.type = w[0]; o.frequency.setValueAtTime(freq * w[1], t); og.gain.value = w[2];
      o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 0.03);
    });
  },
  accordion(freqs, t, dur) {               // pah: per note two squares detuned +-0.6% (the musette beat)
    if (!this.ac) return;
    const ac = this.ac, f = ac.createBiquadFilter(), g = ac.createGain();
    f.type = "lowpass"; f.frequency.setValueAtTime(2200, t);
    const v = 0.11 / Math.sqrt(freqs.length);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.01);
    g.gain.setValueAtTime(v * 0.85, t + dur * 0.8); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    f.connect(g); g.connect(this.music);
    freqs.forEach(function (fr) { [0.994, 1.006].forEach(function (k) {
      const o = ac.createOscillator(); o.type = "square"; o.frequency.setValueAtTime(fr * k, t);
      o.connect(f); o.start(t); o.stop(t + dur + 0.03);
    }); });
  },
  clarinet(freq, t, dur, lead) {           // clarinet: a square with a gentle vibrato, softened; lead: louder, brighter
    if (!this.ac) return;
    const ac = this.ac, o = ac.createOscillator(), lfo = ac.createOscillator(), lg = ac.createGain(), f = ac.createBiquadFilter(), g = ac.createGain();
    o.type = "square"; o.frequency.setValueAtTime(freq, t);
    lfo.frequency.value = 5.5; lg.gain.value = freq * 0.004; lfo.connect(lg); lg.connect(o.frequency);
    const v = lead ? 0.2 : 0.15;
    f.type = "lowpass"; f.frequency.setValueAtTime(lead ? 2600 : 1800, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + (lead ? 0.008 : 0.015));
    g.gain.setValueAtTime(v * 0.87, t + Math.max(0.02, dur * 0.8)); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(this.music);
    o.start(t); o.stop(t + dur + 0.03); lfo.start(t); lfo.stop(t + dur + 0.03);
  },
  guitarSlide(f0, f1, t, dur, vol) {
    if (!this.ac) return;
    const ac = this.ac, g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.setValueAtTime(vol, t + dur * 0.8);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    g.connect(this.ampInput());
    [0.997, 1.003].forEach(function (k) {
      const o = ac.createOscillator();
      o.type = "sawtooth"; o.frequency.setValueAtTime(f0 * k, t); o.frequency.exponentialRampToValueAtTime(f1 * k, t + dur * 0.9);
      o.connect(g); o.start(t); o.stop(t + dur + 0.02);
    });
  },
  bassNote(freq, t, dur, vol) {
    if (!this.ac) return;
    const o = this.ac.createOscillator(), f = this.ac.createBiquadFilter(), g = this.ac.createGain();
    o.type = "sawtooth"; o.frequency.setValueAtTime(freq, t);
    f.type = "lowpass"; f.frequency.setValueAtTime(700, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.linearRampToValueAtTime(vol * 0.6, t + dur);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.02);
    o.connect(f); f.connect(g); g.connect(this.music);
    o.start(t); o.stop(t + dur + 0.04);
  },

  tone(type, freq, t, dur, vol, dest) {
    if (!this.ac) return;
    const o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.setValueAtTime(vol * 0.75, t + Math.max(0.01, dur * 0.5));
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfx);
    o.start(t); o.stop(t + dur + 0.02);
  },
  sweep(type, f0, f1, t, dur, vol, dest) {
    if (!this.ac) return;
    const o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(dest || this.sfx);
    o.start(t); o.stop(t + dur + 0.02);
  },
  noise(t, dur, vol, cutoff, dest, sweepTo) {
    if (!this.ac) return;
    const src = this.ac.createBufferSource(), f = this.ac.createBiquadFilter(), g = this.ac.createGain();
    src.buffer = this.noiseBuf;
    f.type = "lowpass"; f.frequency.setValueAtTime(cutoff, t);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(dest || this.sfx);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
  },

  // ---- petrol mower engines: a pool of 2 persistent voices ----
  // setEngines() gets the (at most 2) nearest running mowers each frame as
  // {id, state: "patrol"|"rev"|"charge", throttle 0..1 (rev wind-up), dist}. Each slot keeps
  // logical targets (rate = two-stroke firing pulses per second, freq = engine tone,
  // gain by distance), which the tests read; with an AudioContext they drive real voices.
  engines: [{ id: null, rate: 0, freq: 0, gain: 0, cut: 900 }, { id: null, rate: 0, freq: 0, gain: 0, cut: 900 }],
  engineTargets(e) {
    if (e.kind && CAR_ENGINES[e.kind]) {                // a posh driver's car (src/cars.js): one sound per make
      const C = CAR_ENGINES[e.kind];
      return { rate: C.rate, freq: C.freq, cut: C.cut, gain: C.gain * clamp(1 - (e.dist || 0) / 800, 0.15, 1) };
    }
    const p = e.state === "rev" ? clamp(e.throttle || 0, 0, 1) : e.state === "charge" ? 1 : 0;
    const charge = e.state === "charge";
    return {
      rate: charge ? 48 : 14 + 26 * p,
      freq: charge ? 140 : 55 + 55 * p,
      cut: charge ? 2200 : 900 + 1100 * p,
      gain: 0.16 * (charge ? 1.35 : e.state === "rev" ? 1.1 : 1) * clamp(1 - (e.dist || 0) / 300, 0.15, 1),   // full throttle is louder
    };
  },
  setEngines(list) {
    const want = (list || []).slice(0, 2);
    const slots = this.engines;
    // keep a mower on the slot it already has; give free slots to the others
    const assigned = slots.map(function (s) { return want.find(function (e) { return e.id === s.id; }) || null; });
    want.forEach(function (e) {
      if (assigned.indexOf(e) >= 0) return;
      const free = assigned.indexOf(null);
      if (free >= 0) assigned[free] = e;
    });
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i], e = assigned[i];
      if (e) { Object.assign(s, this.engineTargets(e)); s.id = e.id; }
      else { s.id = null; s.gain = 0; }
      this.applyEngine(i);
    }
    if (this.onEngines) this.onEngines(slots);      // promo recorder hook
  },
  // Web Audio voice: saw + square sub -> lowpass -> gain amplitude-modulated by a square LFO
  // at the firing rate (the "putt-putt") -> slot gain -> sfx bus (so mute applies).
  engineVoice(i) {
    const ac = this.ac;
    let v = (this.engineVoices || (this.engineVoices = []))[i];
    if (v && v.bus === this.sfx) return v;
    const saw = ac.createOscillator(), sub = ac.createOscillator(), lfo = ac.createOscillator();
    const f = ac.createBiquadFilter(), am = ac.createGain(), depth = ac.createGain(), out = ac.createGain();
    saw.type = "sawtooth"; sub.type = "square"; lfo.type = "square";
    saw.frequency.value = 55; sub.frequency.value = 27.5; lfo.frequency.value = 14;
    f.type = "lowpass"; f.frequency.value = 900;
    am.gain.value = 0.5; depth.gain.value = 0.5; out.gain.value = 0;
    lfo.connect(depth); depth.connect(am.gain);
    saw.connect(f); sub.connect(f); f.connect(am); am.connect(out); out.connect(this.sfx);
    saw.start(); sub.start(); lfo.start();
    v = this.engineVoices[i] = { bus: this.sfx, saw: saw, sub: sub, lfo: lfo, f: f, out: out };
    return v;
  },
  // The mofa (ride): its own two-stroke voice; speed 0..1 or null (off: paused, level over, not riding).
  mofa: { rate: 0, freq: 0, gain: 0, cut: 700 },
  setMofa(speed) {
    const m = this.mofa;
    if (speed === null || speed === undefined) m.gain = 0;
    else {
      const p = clamp(speed, 0, 1);
      m.rate = 9 + 19 * p; m.freq = 50 + 60 * p; m.cut = 700 + 1300 * p; m.gain = 0.1 + 0.04 * p;
    }
    this.applyEngine(2, m);
  },
  applyEngine(i, slot) {
    if (!this.ac || !this.sfx) return;
    const s = slot || this.engines[i], v = this.engineVoice(i), t = this.ac.currentTime;
    if (s.gain > 0) {
      v.saw.frequency.setTargetAtTime(s.freq, t, 0.05); v.sub.frequency.setTargetAtTime(s.freq / 2, t, 0.05);
      v.lfo.frequency.setTargetAtTime(s.rate, t, 0.05); v.f.frequency.setTargetAtTime(s.cut, t, 0.05);
    }
    v.out.gain.setTargetAtTime(s.gain, t, 0.06);   // ~1/4 s fade when a mower drops out
  },

  // ---- sound effects ----
  play(name) {
    if (this.onPlay) this.onPlay(name);   // test hook
    if (!this.ac) return;
    const t = this.ac.currentTime;
    switch (name) {
      case "shot": this.sweep("square", 1100, 280, t, 0.08, 0.25); break;
      case "mg": {        // heavy WW2 .50 cal: a deep thump, a crack, a boom body and a short echo; pitch varies per volley
        const k = 1 + (Math.random() - 0.5) * 0.12;
        this.sweep("sine", 110 * k, 40, t, 0.12, 0.85);                 // thump
        this.noise(t, 0.025, 0.5, 4200 * k, null, 1500);                // crack
        this.noise(t, 0.08, 0.45, 900 * k, null, 250);                  // boom body
        this.noise(t + 0.11, 0.12, 0.16, 700 * k, null, 200);           // echo
        this.sweep("sine", 90 * k, 35, t + 0.11, 0.1, 0.25);
        break;
      }
      case "shotUp": this.sweep("sawtooth", 1500, 200, t, 0.1, 0.22); this.noise(t, 0.05, 0.15, 5000); break;
      case "jump": this.sweep("square", 220, 520, t, 0.1, 0.18); break;
      case "hit": this.sweep("square", 300, 120, t, 0.06, 0.25); this.noise(t, 0.05, 0.2, 3000); break;
      case "deflect": this.tone("square", 1800, t, 0.04, 0.18); this.tone("square", 2400, t + 0.04, 0.04, 0.14); break;
      case "explode": this.noise(t, 0.45, 0.7, 2500, null, 120); this.sweep("sine", 120, 30, t, 0.35, 0.5); break;
      case "bigexplode": this.noise(t, 1.2, 0.9, 3000, null, 60); this.sweep("sine", 90, 20, t, 1.0, 0.7); break;
      case "pickup": this.tone("square", 660, t, 0.06, 0.2); this.tone("square", 880, t + 0.06, 0.06, 0.2); this.tone("square", 1320, t + 0.12, 0.08, 0.2); break;
      case "health": this.tone("triangle", 523, t, 0.08, 0.4); this.tone("triangle", 659, t + 0.08, 0.08, 0.4); this.tone("triangle", 784, t + 0.16, 0.12, 0.4); break;
      case "oneup": [523, 659, 784, 1047, 784, 1047].forEach(function (f, i) { Sound.tone("square", f, t + i * 0.07, 0.07, 0.2); }); break;
      case "powerup": for (let i = 0; i < 8; i++) this.tone("square", 300 + i * 120, t + i * 0.04, 0.05, 0.2); break;
      case "key": this.tone("square", 988, t, 0.08, 0.2); this.tone("square", 1319, t + 0.08, 0.15, 0.2); break;
      case "hurt": this.sweep("sawtooth", 420, 90, t, 0.25, 0.35); break;
      case "crate": this.noise(t, 0.25, 0.5, 1600, null, 400); this.sweep("square", 220, 70, t, 0.12, 0.25); this.noise(t + 0.08, 0.15, 0.3, 3500); break;
      case "door": this.sweep("square", 140, 60, t, 0.35, 0.3); this.noise(t, 0.3, 0.25, 900); break;
      case "locked": this.tone("square", 110, t, 0.12, 0.3); this.tone("square", 90, t + 0.12, 0.15, 0.3); break;
      case "throw": this.sweep("triangle", 500, 900, t, 0.08, 0.25); break;
      case "pop": this.sweep("sine", 900, 300, t, 0.06, 0.4); this.noise(t, 0.05, 0.25, 3000); break;   // champagne cork
      case "horn":        // posh car horn: two square tones together
        this.tone("square", 392, t, 0.28, 0.12, this.sfx); this.tone("square", 494, t, 0.28, 0.1, this.sfx); break;
      case "cheer": {     // a few fans: rising "woo", crowd noise swell, two-note whistle
        const k = 0.95 + Math.random() * 0.1;
        this.sweep("sine", 320 * k, 560 * k, t, 0.45, 0.12); this.sweep("triangle", 400 * k, 660 * k, t + 0.04, 0.4, 0.08);
        this.noise(t, 0.6, 0.12, 2400, null, 1200);
        this.tone("square", 1600 * k, t + 0.1, 0.08, 0.05); this.tone("square", 2100 * k, t + 0.2, 0.14, 0.05);
        break;
      }
      case "whistle": {   // wolf whistle: a quick rising "whee", then a long rise-and-fall "whee-oo"
        const k = 0.96 + Math.random() * 0.08;
        this.sweep("sine", 1100 * k, 2300 * k, t, 0.16, 0.1);
        this.sweep("sine", 1300 * k, 2500 * k, t + 0.28, 0.14, 0.1);
        this.sweep("sine", 2500 * k, 1050 * k, t + 0.42, 0.42, 0.1);
        break;
      }
      case "pullstart":   // petrol mower: rope pull, three sputters, then the engine catches
        this.noise(t, 0.22, 0.22, 600, null, 2600);
        [0.3, 0.42, 0.56].forEach(function (d, i) {
          Sound.tone("square", 55 + i * 6, t + d, 0.06, 0.22); Sound.noise(t + d, 0.05, 0.18, 1400);
        });
        this.sweep("sawtooth", 45, 70, t + 0.7, 0.35, 0.2); this.noise(t + 0.7, 0.3, 0.12, 800); break;
      case "rev":         // throttle blips: rising two-stroke bursts with exhaust crackle
        for (let i = 0; i < 5; i++) {
          this.sweep("sawtooth", 60 + i * 20, 110 + i * 35, t + i * 0.1, 0.09, 0.22);
          this.sweep("square", 30 + i * 10, 55 + i * 18, t + i * 0.1, 0.09, 0.1);
        }
        this.noise(t, 0.5, 0.18, 700); break;
      case "mower":       // full-throttle roar as the charge starts (the engine loop carries on)
        this.sweep("sawtooth", 110, 150, t, 0.5, 0.3); this.sweep("square", 55, 75, t, 0.5, 0.18); this.noise(t, 0.5, 0.25, 2200, null, 900); break;
      case "choke":       // the engine sputters and dies
        [0, 0.09, 0.2, 0.34, 0.52].forEach(function (d, i) {
          Sound.sweep("sawtooth", 120 - i * 15, 60 - i * 8, t + d, 0.07, 0.24 - i * 0.035);
        });
        this.noise(t + 0.6, 0.25, 0.15, 500, null, 120); break;
      case "leap": this.sweep("square", 300, 700, t, 0.08, 0.12); break;
      case "slam": this.noise(t, 0.6, 1.0, 1200, null, 80); this.sweep("sine", 70, 25, t, 0.6, 0.9); break;
      case "bubble": this.sweep("sine", 300, 900, t, 0.1, 0.3); break;
      case "checkpoint": this.tone("square", 784, t, 0.1, 0.2); this.tone("square", 1047, t + 0.1, 0.2, 0.2); break;
      case "die": this.sweep("square", 600, 50, t, 0.9, 0.35); break;
      case "bosshurt": this.sweep("square", 200, 80, t, 0.12, 0.35); break;
      case "select": this.tone("square", 880, t, 0.05, 0.2); break;
      case "grinder":   // disc cutter: high-pitched grinder whine with a gritty edge
        this.sweep("sawtooth", 900, 2600, t, 0.25, 0.16); this.sweep("square", 1800, 3400, t, 0.2, 0.06); this.noise(t, 0.25, 0.18, 6000, null, 2500); break;
    }
  },
};

Input.anyKeyListeners.push(function () {
  Sound.unlock();
  if (!Sound.playing && Sound.wantMusic !== false) Sound.startMusic();
});
document.addEventListener("visibilitychange", function () { if (!document.hidden) Sound.resume(); });
