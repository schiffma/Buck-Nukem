// Promo bridge: the only code the Python promo agent injects into the game page (inside the
// game's script scope, just before boot()). It contains NO decision logic:
//  - seed(n)            deterministic Math.random (mulberry32)
//  - boot()             load assets, build sprites, headless stepping (no requestAnimationFrame)
//  - snapshot(full)     read-only view of the game state for the agent
//  - step(seq)          apply one input set per game step (Input.simulate only) and advance
//  - simulateJumps(...) run the game's own player physics on a copy of the hero for candidate
//                       input plans (the agent picks one; physics stays in one implementation)
//  - metrics log        per-step rows for the play-quality metrics (agent/metrics.py)
//  - recording          frame capture + sound/track/tempo/engine logs + chunked audio render
// Fair play: the only game object written is Input (via Input.simulate); everything else is
// read. (Recording hooks wrap Sound/damage functions to log calls; they do not alter results.)

const PromoBridge = {
  steps: 0, rows: [], ids: new WeakMap(), nextId: 1, gridSent: null, booted: false,
  hits: 0, rec: null,

  seed(n) {
    let a = (n >>> 0) || 1;
    Math.random = function () {               // mulberry32
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },

  boot() {
    const self = this;
    return new Promise(function (resolve) {
      loadAssets(function () {
        buildSprites();
        Game.headless = true;
        self.booted = true;
        // count hero shot hits (enemies and the boss face) for the hit rate
        const dmg = damageEnemy;
        damageEnemy = function (e, d, dir) { self.hits++; return dmg(e, d, dir); };
        const hitBoss = Boss.hitByShot.bind(Boss);
        Boss.hitByShot = function (s) { const hp = Boss.hp, r = hitBoss(s); if (Boss.hp < hp) self.hits++; return r; };
        resolve(true);
      });
    });
  },

  id(o) { let v = this.ids.get(o); if (!v) { v = this.nextId++; this.ids.set(o, v); } return v; },

  snapshot(full) {
    const P = Player, L = Game.level, self = this;
    const s = {
      state: Game.state, stateT: Game.stateT, levelIndex: Game.levelIndex, time: Game.time, steps: this.steps,
      tallyDone: !!(Game.tally && Game.tally.done), reveal: !!Game.reveal, score: Game.score, kills: Game.stats.kills, shots: Game.stats.shots, hits: this.hits,
      hero: { x: P.x, y: P.y, w: P.w, h: P.h, vx: P.vx, vy: P.vy, onGround: P.onGround, climbing: P.climbing, face: P.face,
        hp: P.hp, lives: P.lives, keys: { R: !!P.keys.R, U: !!P.keys.U, G: !!P.keys.G }, weapon: P.weapon, fireCd: P.fireCd,
        invuln: P.invuln, dead: P.dead, kneeling: !!P.kneeling, hurtT: P.hurtT, coyote: P.coyote, jumping: P.jumping, jumpHeld: Input.down("jump") },
    };
    if (L && (Game.state === STATE.PLAY || Game.state === STATE.BOSS || Game.state === STATE.LEVEL_INTRO || Game.state === STATE.PAUSE)) {
      s.enemies = Game.enemies.filter(function (e) { return !e.dead; }).map(function (e) {
        return { id: self.id(e), type: e.type, x: e.x, y: e.y, w: e.w, h: e.h, vx: e.vx, vy: e.vy, face: e.face, state: e.state || "",
          leaping: !!e.leaping, hidden: !!(e.T.hidden && e.T.hidden(e)), active: !!e.active, onGround: !!e.onGround, hp: e.hp, t: e.t || 0 };
      });
      s.enemyShots = Game.enemyShots.map(function (b) { return { kind: b.kind, x: b.x, y: b.y, w: b.w, h: b.h, vx: b.vx || 0, vy: b.vy || 0, grav: b.grav || 0 }; });
      s.heroShots = Game.shots.filter(function (b) { return !b.deflected; }).map(function (b) { return { x: b.x, y: b.y, w: b.w, h: b.h, vx: b.vx, dmg: b.dmg }; });
      s.pickups = Game.pickups.map(function (p) { return { id: self.id(p), type: p.type, x: p.x, y: p.y, w: p.w, h: p.h }; });
      s.exit = Game.exit ? { x: Game.exit.x, y: Game.exit.y, w: Game.exit.w, h: Game.exit.h } : null;
      s.checkpoints = Game.checkpoints.map(function (c) { return { x: c.x, y: c.y, on: c.on }; });
      s.camera = { x: Camera.x, y: Camera.y };
      s.level = { name: L.name, isBoss: !!L.isBoss, w: L.w, h: L.h, pxW: L.pxW, pxH: L.pxH };
      const key = L.rows.map(function (r) { return r.join(""); }).join("\n");
      if (full || key !== this.gridSent) { s.grid = L.rows.map(function (r) { return r.join(""); }); this.gridSent = key; }
      if (Boss.active) {
        s.boss = { state: Boss.state, hp: Boss.hp, maxHp: Boss.maxHp, raised: !!Boss.raised, claw: Boss.claw, ox: Boss.ox, homeX: Boss.homeX, floor: Boss.floor, phase: Boss.phase || null,
          face: Boss.face(), shell: Boss.shell(), claws: Boss.claws(), t: Boss.t || 0 };
      }
    }
    return s;
  },

  // seq: one input set per game step, e.g. [{right:1, fire:1, why:"route"}, {...}]
  step(seq, wantFull) {
    for (const inp of seq) {
      ["left", "right", "up", "down", "jump", "fire", "enter"].forEach(function (a) { Input.simulate(a, !!inp[a]); });
      const pre = this.preRow();
      Game.update(DT); Input.endStep();
      this.steps++;
      this.logRow(pre, inp);
      if (this.rec) this.recStep();
    }
    return this.snapshot(wantFull);
  },

  // The bare game loop with inputs and nothing else (used by the fair-play test as the reference
  // that step() must match exactly).
  rawUpdate(seq) {
    for (const inp of seq) {
      ["left", "right", "up", "down", "jump", "fire", "enter"].forEach(function (a) { Input.simulate(a, !!inp[a]); });
      Game.update(DT); Input.endStep();
    }
    return true;
  },

  // ---------------- play-quality metrics log ----------------
  preRow() { return { g: Player.onGround, x: Player.x, y: Player.y, shots: Game.stats.shots, c: Player.climbing, hits: this.hits }; },
  // the band a shot fired now would sweep: around the gun row (chest standing, knee kneeling)
  hittableInLine() {
    const P = Player, gy = P.gunY(), y0 = gy - 6, y1 = gy + 8, f = P.face, cx = P.cx();
    for (const e of Game.enemies) {
      if (e.dead || (e.T.hidden && e.T.hidden(e))) continue;
      if (e.type === "cray" && !e.leaping && !P.isCutter() && !P.kneeling) continue;    // standing blaster shots fly over a crayfish on the ground
      const dx = (e.x + e.w / 2 - cx) * f;
      if (dx > -4 && dx < 14 * TILE && e.y < y1 + (P.isCutter() ? 6 : 0) && e.y + e.h > y0) return true;
    }
    if (Boss.active && Boss.raised && Boss.claw > 0.5) {
      const b = Boss.face(), dx = (b.x + b.w / 2 - cx) * f;
      if (dx > 0 && b.y < y1 && b.y + b.h > y0) return true;
    }
    return false;
  },
  threatNear() {
    const cx = Player.cx(), cy = Player.cy();
    for (const s of Game.enemyShots) if (Math.abs(s.x - cx) < 4 * TILE && Math.abs(s.y - cy) < 3 * TILE) return true;
    for (const e of Game.enemies) if (!e.dead && Math.abs(e.x + e.w / 2 - cx) < 3 * TILE && Math.abs(e.y + e.h / 2 - cy) < 2 * TILE) return true;
    return Boss.active && Boss.state !== "dying";
  },
  // row: [level, t, dir, why, jumpStart, onGround, x, y, shot, hittable, threat, pickupsLeft, climbing, hits, fireInput]
  logRow(pre, inp) {
    if (Game.state !== STATE.PLAY && Game.state !== STATE.BOSS) return;
    const P = Player;
    const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    // a jump = leaving the ground upward with Jump pressed (not a knockback or a water bounce)
    const jumpStart = inp.jump && pre.g && !P.onGround && P.vy < -100 && !P.climbing && !pre.c ? 1 : 0;
    const shot = Game.stats.shots > pre.shots ? 1 : 0;
    this.rows.push([Game.levelIndex, +Game.time.toFixed(4), dir, inp.why || "", jumpStart, P.onGround ? 1 : 0, Math.round(P.x * 10) / 10,
      Math.round(P.y * 10) / 10, shot, shot ? ((this.hittableInLine() || this.hits > pre.hits) ? 1 : 0) : 0,   // a point-blank kill in the same step had a target too
      (jumpStart || shot) ? (this.threatNear() ? 1 : 0) : 0,
      Game.pickups.length, P.climbing ? 1 : 0, this.hits, inp.fire ? 1 : 0]);
  },
  takeRows() { const r = this.rows; this.rows = []; return r; },

  // ---------------- physics queries for jump planning ----------------
  // cands: [[pre, dir, J, D, R], ...] (pre-run steps, direction, jump hold, horizontal delay,
  // horizontal release). Returns per candidate: [landTx, landTy, xErr, frames, wet] or null.
  simulateJumps(cands, maxFrames) {
    const L = Game.level, out = [];
    for (const c of cands) {
      const pre = c[0], dd = c[1], J = c[2], D = c[3], R = c[4];
      const s = this.simState();
      let res = null;
      for (let f = 0; f < pre + (maxFrames || 150); f++) {
        const t = f - pre;
        const inp = { left: false, right: false, jump: t >= 0 && t < J };
        const horiz = f < pre || (t >= D && t < R);
        if (horiz && dd > 0) inp.right = true;
        if (horiz && dd < 0) inp.left = true;
        this.simStep(s, inp, L);
        if (this.simWater(s, L) || s.y > L.pxH) { res = [0, 0, 0, f + 1, 1]; break; }
        if (t > 2 && s.onGround) {
          const nx = Math.floor((s.x + s.w / 2) / TILE), ny = Math.floor((s.y + s.h - 1) / TILE);
          res = [nx, ny, (s.x + s.w / 2) - (nx * TILE + 8), f + 1, 0];
          break;
        }
      }
      out.push(res);
    }
    return out;
  },
  simState() {
    const P = Player;
    return { x: P.x, y: P.y, w: P.w, h: P.h, vx: P.vx, vy: P.vy, onGround: P.onGround, coyote: P.coyote,
      jumping: P.jumping, climbing: P.climbing, face: P.face, jumpHeld: Input.down("jump") };
  },
  simStep(s, inp, level) {              // mirrors Player.update movement
    const dt = DT;
    const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    const pressed = inp.jump && !s.jumpHeld;
    s.jumpHeld = !!inp.jump;
    if (s.climbing) {
      s.vy = 0; s.vx = 0;
      if (pressed) { s.climbing = false; if (dir) { s.vy = CONFIG.jumpVel * 0.7; s.face = dir; s.jumping = true; } }
      s.onGround = moveBody(s, dt, level, { platforms: false }).ground;
      return;
    }
    const target = dir * CONFIG.runSpeed;
    const a = CONFIG.accel * dt * (s.onGround ? 1 : 0.7);
    if (s.vx < target) s.vx = Math.min(target, s.vx + a); else if (s.vx > target) s.vx = Math.max(target, s.vx - a);
    if (dir) s.face = dir;
    if (s.onGround) s.coyote = CONFIG.coyoteTime; else s.coyote -= dt;
    if (pressed && s.coyote > 0) { s.vy = CONFIG.jumpVel; s.jumping = true; s.coyote = 0; s.onGround = false; }
    if (s.jumping && !inp.jump && s.vy < 0) { s.vy *= CONFIG.jumpCut; s.jumping = false; }
    if (s.vy >= 0) s.jumping = false;
    s.vy = Math.min(CONFIG.maxFall, s.vy + CONFIG.gravity * dt);
    s.onGround = moveBody(s, dt, level, { platforms: true, dropThrough: false }).ground;
  },
  simWater(s, level) {
    const tx0 = Math.floor(s.x / TILE), tx1 = Math.floor((s.x + s.w - 1) / TILE), ty = Math.floor((s.y + s.h - 4) / TILE);
    for (let tx = tx0; tx <= tx1; tx++) if (level.isWater(tx, ty)) return true;
    return false;
  },

  // ---------------- recording ----------------
  // opts: {fps, sink}: frames are POSTed as raw RGBA to sink + "/frame?i=n" every 60/fps steps
  startRecording(opts) {
    const self = this, fps = opts.fps || 30;
    FILM.grain = 5; FILM.scratchChance *= 0.5;                       // calmer grain: compresses far better
    this.rec = { fps: fps, every: Math.round(60 / fps), sink: opts.sink, frames: 0, n: 0, pending: [], batch: [],
      sfx: [], tempo: [{ t: 0, tempo: Sound.tempo || 1 }], tracks: [{ t: 0, track: Sound.track }], engines: [] };
    const R = this.rec;
    Sound.onPlay = function (name) { R.sfx.push({ t: R.frames / fps, name: name }); };
    const setTempo = Sound.setTempo.bind(Sound);
    Sound.setTempo = function (t) { R.tempo.push({ t: R.frames / fps, tempo: t }); setTempo(t); };
    const setTrack = Sound.setTrack.bind(Sound);
    Sound.setTrack = function (name) { if (name !== Sound.track) R.tracks.push({ t: R.frames / fps, track: name }); setTrack(name); };
    let lastEng = "";
    Sound.onEngines = function (slots) {
      const v = slots.map(function (x) { return { on: !!x.id, rate: x.rate, freq: x.freq, cut: x.cut, gain: x.gain }; });
      const key = JSON.stringify(v);
      if (key !== lastEng) { lastEng = key; R.engines.push({ t: R.frames / fps, v: v }); }
    };
    return true;
  },
  recStep() {
    const R = this.rec;
    R.n++;
    if (R.n % R.every) return;
    Game.render();
    if (Film.enabled) Film.apply();          // the film pass only; no upscaled screen blit needed for capture
    const src = Film.enabled ? filmCtx : ctx;
    R.batch.push(src.getImageData(0, 0, W, H).data);
    R.frames++;
    if (R.batch.length >= 30) this.sendBatch();
  },
  // frames go out 30 at a time (one POST per second of video): far fewer uploads competing with
  // the agent's Playwright calls. ?i= is the index of the batch's first frame.
  sendBatch() {
    const R = this.rec;
    if (!R || !R.batch.length) return;
    const first = R.frames - R.batch.length;
    R.pending.push(fetch(R.sink + "/frame?i=" + first, { method: "POST", body: new Blob(R.batch) }));
    R.batch = [];
  },
  async flush() { this.sendBatch(); const p = this.rec ? this.rec.pending : []; if (this.rec) this.rec.pending = []; await Promise.all(p); return this.rec ? this.rec.frames : 0; },
  async finishRecording(withAudio) {
    await this.flush();
    const R = this.rec, dur = R.frames / R.fps;
    if (withAudio) {
      const blob = await this.renderAudio(dur);
      await fetch(R.sink + "/audio", { method: "POST", body: blob });
    }
    return { frames: R.frames, duration: dur };
  },

  // Music + logged effects + engine voices rendered offline in 30 s chunks (one context each,
  // with a tail for ringing notes), mixed by sample offset.
  async renderAudio(dur) {
    const R = this.rec, sr = 22050, len = Math.ceil(sr * dur), CHUNK = 30, TAIL = 3, S = Sound;
    const notes = [];
    let t = 0.05, step = 0, ti = 0, ki = 0;
    while (t < dur) {
      while (ti + 1 < R.tempo.length && R.tempo[ti + 1].t <= t) ti++;
      while (ki + 1 < R.tracks.length && R.tracks[ki + 1].t <= t) { ki++; step = 0; t = Math.max(t, R.tracks[ki].t + 0.05); }
      const song = SONGS[R.tracks[ki].track];
      const l = song.sixteenth / R.tempo[ti].tempo;
      for (const e of song.events[step]) notes.push({ e: e, t: t, l: l });
      step = (step + 1) % song.steps; t += l;
    }
    S.onPlay = null; S.muted = false;
    const data = new Float32Array(len);
    for (let c0 = 0; c0 < dur; c0 += CHUNK) {
      const c1 = Math.min(dur, c0 + CHUNK), off0 = Math.round(c0 * sr);
      const off = new OfflineAudioContext(1, Math.ceil(sr * (c1 - c0 + TAIL)), sr);
      const proxy = {
        currentTime: 0, sampleRate: sr, destination: off.destination,
        createOscillator: function () { return off.createOscillator(); }, createGain: function () { return off.createGain(); },
        createBiquadFilter: function () { return off.createBiquadFilter(); }, createBufferSource: function () { return off.createBufferSource(); },
        createBuffer: function (a, b, c) { return off.createBuffer(a, b, c); },
        createWaveShaper: function () { return off.createWaveShaper(); },
      };
      S.ac = proxy;
      S.master = off.createGain(); S.master.gain.value = 1; S.master.connect(off.destination);
      S.music = off.createGain(); S.music.gain.value = 0.32; S.music.connect(S.master);
      S.sfx = off.createGain(); S.sfx.gain.value = 0.5; S.sfx.connect(S.master);
      S.noiseBuf = off.createBuffer(1, sr, sr);
      const nd = S.noiseBuf.getChannelData(0); for (let i = 0; i < sr; i++) nd[i] = Math.random() * 2 - 1;
      for (const n of notes) if (n.t >= c0 && n.t < c1) S.playEvent(n.e, n.t - c0, n.l);
      for (const ev of R.sfx) if (ev.t >= c0 && ev.t < c1) { proxy.currentTime = ev.t - c0; S.play(ev.name); }
      S.engineVoices = null;
      const engs = R.engines;
      let k0 = -1; for (let k = 0; k < engs.length && engs[k].t < c0; k++) k0 = k;
      for (let k = Math.max(0, k0); k < engs.length && engs[k].t < c1; k++) {
        const tt = Math.max(0, engs[k].t - c0), first = k === k0;
        engs[k].v.forEach(function (x, i) {
          const v = S.engineVoice(i);
          if (first) {
            v.saw.frequency.setValueAtTime(x.freq || 55, 0); v.sub.frequency.setValueAtTime((x.freq || 55) / 2, 0);
            v.lfo.frequency.setValueAtTime(x.rate || 14, 0); v.f.frequency.setValueAtTime(x.cut || 900, 0); v.out.gain.setValueAtTime(x.gain, 0);
          } else {
            if (x.on) {
              v.saw.frequency.setTargetAtTime(x.freq, tt, 0.05); v.sub.frequency.setTargetAtTime(x.freq / 2, tt, 0.05);
              v.lfo.frequency.setTargetAtTime(x.rate, tt, 0.05); v.f.frequency.setTargetAtTime(x.cut, tt, 0.05);
            }
            v.out.gain.setTargetAtTime(x.gain, tt, 0.06);
          }
        });
      }
      const part = (await off.startRendering()).getChannelData(0);
      for (let i = 0, n = Math.min(part.length, len - off0); i < n; i++) data[off0 + i] += part[i];
    }
    const out = new DataView(new ArrayBuffer(44 + data.length * 2));
    function str(o, s) { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); }
    str(0, "RIFF"); out.setUint32(4, 36 + data.length * 2, true); str(8, "WAVE"); str(12, "fmt ");
    out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true); out.setUint32(24, sr, true);
    out.setUint32(28, sr * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true); str(36, "data"); out.setUint32(40, data.length * 2, true);
    for (let i = 0; i < data.length; i++) out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, data[i] * 0.9)) * 32767, true);
    return new Blob([out.buffer], { type: "audio/wav" });
  },

  // Diagnostics only (record_promo.py --dry N): start a level directly. Never used in promo runs.
  devStartLevel(i) {
    Player.resetForGame(); Game.loadLevel(i); Game.setState(Game.level.isBoss ? STATE.BOSS : STATE.PLAY);
    return this.snapshot(true);
  },
};
window.PromoBridge = PromoBridge;
