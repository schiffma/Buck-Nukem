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

const SONGS = { title: ROCK, valkyries: SONG };

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
    const horizon = this.ac.currentTime + 0.12;
    while (this.nextTime < horizon) {
      const song = this.song();
      const len = song.sixteenth / this.tempo;
      const evs = song.events[this.step % song.steps];
      for (const e of evs) this.playEvent(e, this.nextTime, len);
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
      case "kick": this.sweep("sine", 140, 40, t, 0.12, 0.6, this.music); break;
      case "snare": this.noise(t, 0.1, 0.25, 1800, this.music); break;
      case "hat": this.noise(t, 0.03, 0.08, 7000, this.music); break;
      // title theme (rock) voices
      case "gtr": this.guitar([midiHz(e.m)], t, e.pm ? len * 0.8 : e.d * len * 0.95, e.pm ? 0.5 : 0.7, e.pm); break;
      case "pow": this.guitar([midiHz(e.m), midiHz(e.m + 7), midiHz(e.m + 12)], t, e.d * len * 0.9, 0.45, false); break;
      case "rbass": this.bassNote(midiHz(e.m), t, e.d * len * 0.85, 0.45); break;
      case "crash": this.noise(t, 1.4, 0.3, 12000, this.music); break;
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
  applyEngine(i) {
    if (!this.ac || !this.sfx) return;
    const s = this.engines[i], v = this.engineVoice(i), t = this.ac.currentTime;
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
