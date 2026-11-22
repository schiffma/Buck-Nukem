// Grindhouse film post-processing. The scene is drawn into `buffer` as usual; Film.apply()
// grades it into `filmCanvas` (lurid 70s colour-print grade: saturation boost, warm
// highlights, teal-lifted shadows; grain, light vignette, flicker) and adds scratches and dust. present() then draws filmCanvas with
// a 0-1 px gate-weave jitter. G toggles the filter (on by default).
const FILM = {
  desat: -40,           // luma mix out of 256; negative = saturation boost (~+16 %)
  contrast: 1.1,
  crush: 4,             // black crush (0-255)
  gamma: 0.9,           // < 1 lifts the midtones
  warm: [1.07, 1.0, 0.90],
  lift: [0, 8, 14],     // teal lift in the shadows (faded print look)
  grain: 10,            // +- grain amplitude
  vignette: 0.28,
  flickerLevels: 8, flickerAmp: 0.07,
  scratchChance: 0.08, scratchLife: [3, 12],
  dustMax: 5,
  jitterChance: 0.12,
};

const filmCanvas = makeCanvas(W, H);
const filmCtx = filmCanvas.getContext("2d");

const Film = {
  enabled: true, ready: false,
  tables: [], vig: null, grain: [], img: null,
  scratches: [], jx: 0, jy: 0, flick: 4,

  init() {
    const N = W * H;
    for (let f = 0; f < FILM.flickerLevels; f++) {
      const bright = 1 + (f / (FILM.flickerLevels - 1) * 2 - 1) * FILM.flickerAmp;
      const chans = [0, 1, 2].map(function (ch) {
        const t = new Uint8Array(256);
        for (let c = 0; c < 256; c++) {
          let v = c / 255;
          v = 0.5 + (v - 0.5) * FILM.contrast;                       // contrast
          v = (v * 255 - FILM.crush) / (255 - FILM.crush);           // crushed blacks
          v = Math.pow(Math.max(0, v), FILM.gamma);
          v = v * FILM.warm[ch] * bright + FILM.lift[ch] / 255 * (1 - v);
          t[c] = Math.max(0, Math.min(255, Math.round(v * 255)));
        }
        return t;
      });
      this.tables.push(chans);
    }
    this.vig = new Uint16Array(N);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = (x - W / 2) / (W / 2), dy = (y - H / 2) / (H / 2);
      const d = Math.sqrt(dx * dx + dy * dy) / Math.SQRT2;
      this.vig[y * W + x] = Math.round(256 * (1 - FILM.vignette * Math.pow(d, 2.2)));
    }
    for (let k = 0; k < 4; k++) {
      const g = new Int8Array(N * 2);
      for (let i = 0; i < g.length; i++) g[i] = Math.round((Math.random() + Math.random() - 1) * FILM.grain);
      this.grain.push(g);
    }
    this.img = filmCtx.createImageData(W, H);
    this.ready = true;
    try { this.glReady = this.initGL(); } catch (e) { this.glReady = false; }
    this.mode = this.glReady ? "gl" : "cpu";
  },

  // One film frame. The random draws (flicker step, grain frame, grain row, then damage and
  // jitter) keep their order and count on every grade path, so seeded runs replay the same.
  apply() {
    if (!this.ready) this.init();
    // flicker drifts between neighbouring levels
    this.flick = clamp(this.flick + (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.6 ? 1 : 0), 0, FILM.flickerLevels - 1);
    const grainIndex = (Math.random() * 4) | 0;
    const row = (Math.random() * H) | 0;
    this.grade(this.flick, grainIndex, row);
    this.drawDamage();
    // gate weave
    this.jx = Math.random() < FILM.jitterChance * 0.3 ? 1 : 0;
    this.jy = Math.random() < FILM.jitterChance ? 1 : 0;
  },

  // Grades the scene buffer into filmCanvas: saturation boost, colour curve of flicker level
  // `flick`, grain frame `grainIndex` read from row `row` on, vignette. No damage, no jitter.
  mode: "cpu",           // "gl" (src/film.js WebGL pass) or "cpu"
  grade(flick, grainIndex, row) {
    if (!this.ready) this.init();
    if (this.mode === "gl" && filmGL && filmGL.isContextLost()) this.dropGL();
    if (this.mode === "gl") this.gradeGL(flick, grainIndex, row);
    else this.gradeCPU(flick, grainIndex, row);
  },
  // tests only: pick the grade path ("gl" only where it works)
  setMode(m) { if (!this.ready) this.init(); this.mode = m === "gl" && this.glReady ? "gl" : "cpu"; return this.mode; },
  glReady: false, gl: null,

  // ---------------- GPU grade (WebGL) ----------------
  // Same integer maths as gradeCPU: `x >> 8` is floor(x / 256) on integer-valued highp floats,
  // and every table goes in as exact bytes (colour curves, grain + 128, vignette as 2 bytes).
  initGL() {
    const gl = filmGL;
    if (!gl || gl.isContextLost()) return false;
    const hp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    if (!hp || hp.precision < 23 || gl.getParameter(gl.MAX_TEXTURE_SIZE) < 8 * H) return false;
    const VS = "attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }";
    const FS = [
      "precision highp float;",
      "uniform sampler2D scene, curve, grain, vig;",
      "uniform float flick, levels, grainRow, keep, ds;",
      "const vec2 SIZE = vec2(" + W + ".0, " + H + ".0);",
      "float byteOf(float v) { return floor(v * 255.0 + 0.5); }",
      "float curveOf(float v, int ch) {",
      "  vec3 t = texture2D(curve, vec2((v + 0.5) / 256.0, (flick + 0.5) / levels)).rgb;",
      "  return byteOf(ch == 0 ? t.r : ch == 1 ? t.g : t.b);",
      "}",
      "void main() {",
      "  float x = floor(gl_FragCoord.x), y = SIZE.y - 1.0 - floor(gl_FragCoord.y);",   // y = row from the top
      "  vec2 uv = vec2((x + 0.5) / SIZE.x, (y + 0.5) / SIZE.y);",
      "  vec3 c = floor(texture2D(scene, uv).rgb * 255.0 + 0.5);",
      "  float l = floor((c.r * 77.0 + c.g * 150.0 + c.b * 29.0) / 256.0);",
      "  vec3 m = clamp(floor((c * keep + l * ds) / 256.0), 0.0, 255.0);",
      "  float n = byteOf(texture2D(grain, vec2((x + 0.5) / SIZE.x, (grainRow + y + 0.5) / (8.0 * SIZE.y))).r) - 128.0;",
      "  vec4 vv = texture2D(vig, uv);",
      "  float v = byteOf(vv.a) * 256.0 + byteOf(vv.r);",                                 // LUMINANCE_ALPHA: lo in rgb, hi in a
      "  vec3 o = floor((vec3(curveOf(m.r, 0), curveOf(m.g, 1), curveOf(m.b, 2)) + n) * v / 256.0);",
      "  gl_FragColor = vec4(clamp(o, 0.0, 255.0) / 255.0, 1.0);",
      "}",
    ].join("\n");
    function shader(type, src) {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    }
    const vs = shader(gl.VERTEX_SHADER, VS), fs = shader(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return false;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);   // one full-screen triangle
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    function texture(unit, name) {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(gl.getUniformLocation(prog, name), unit);
      return t;
    }
    const L = FILM.flickerLevels, N = W * H;
    // colour curves: 256 x levels, RGB
    const curve = new Uint8Array(256 * L * 3);
    for (let f = 0; f < L; f++) for (let c = 0; c < 256; c++) for (let ch = 0; ch < 3; ch++) curve[(f * 256 + c) * 3 + ch] = this.tables[f][ch][c];
    texture(1, "curve");
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 256, L, 0, gl.RGB, gl.UNSIGNED_BYTE, curve);
    // grain: the 4 noise frames (2H rows each) stacked, value + 128
    const grain = new Uint8Array(N * 8);
    for (let k = 0; k < 4; k++) { const g = this.grain[k]; for (let i = 0; i < N * 2; i++) grain[k * N * 2 + i] = g[i] + 128; }
    texture(2, "grain");
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, W, 8 * H, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, grain);
    // vignette 0..256 as two bytes (lo, hi)
    const vig = new Uint8Array(N * 2);
    for (let i = 0; i < N; i++) { vig[i * 2] = this.vig[i] & 255; vig[i * 2 + 1] = this.vig[i] >> 8; }
    texture(3, "vig");
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE_ALPHA, W, H, 0, gl.LUMINANCE_ALPHA, gl.UNSIGNED_BYTE, vig);
    this.sceneTex = texture(0, "scene");                // stays bound on unit 0, re-uploaded every frame
    this.u = { flick: gl.getUniformLocation(prog, "flick"), grainRow: gl.getUniformLocation(prog, "grainRow") };
    gl.uniform1f(gl.getUniformLocation(prog, "levels"), L);
    gl.uniform1f(gl.getUniformLocation(prog, "keep"), 256 - FILM.desat);
    gl.uniform1f(gl.getUniformLocation(prog, "ds"), FILM.desat);
    gl.viewport(0, 0, W, H);
    if (gl.getError() !== gl.NO_ERROR) return false;
    const self = this;
    filmGLCanvas.addEventListener("webglcontextlost", function () { self.dropGL(); });
    this.gl = gl;
    return true;
  },
  gradeGL(flick, grainIndex, row) {
    const gl = this.gl;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, buffer);   // unit 0: the scene
    gl.uniform1f(this.u.flick, flick);
    gl.uniform1f(this.u.grainRow, grainIndex * 2 * H + row);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    filmCtx.drawImage(filmGLCanvas, 0, 0);
  },
  // GPU context lost (or unusable): the CPU grade for the rest of the session
  dropGL() { this.glReady = false; this.mode = "cpu"; this.gl = null; },

  gradeCPU(flick, grainIndex, row) {
    const N = W * H;
    const src = ctx.getImageData(0, 0, W, H).data;
    const out = this.img.data;
    const T = this.tables[flick], tr = T[0], tg = T[1], tb = T[2];
    const gr = this.grain[grainIndex];
    const go = row * W;
    const vig = this.vig, ds = FILM.desat, keep = 256 - ds;
    for (let i = 0, p = 0; i < N; i++, p += 4) {
      const r = src[p], g = src[p + 1], b = src[p + 2];
      const l = (r * 77 + g * 150 + b * 29) >> 8;
      const n = gr[i + go], v = vig[i];
      let R = (r * keep + l * ds) >> 8, G = (g * keep + l * ds) >> 8, B = (b * keep + l * ds) >> 8;
      R = R < 0 ? 0 : R > 255 ? 255 : R; G = G < 0 ? 0 : G > 255 ? 255 : G; B = B < 0 ? 0 : B > 255 ? 255 : B;
      out[p] = ((tr[R] + n) * v) >> 8;
      out[p + 1] = ((tg[G] + n) * v) >> 8;
      out[p + 2] = ((tb[B] + n) * v) >> 8;
      out[p + 3] = 255;
    }
    filmCtx.putImageData(this.img, 0, 0);
  },

  drawDamage() {
    // scratches: thin vertical lines that live for a few frames and wobble
    if (Math.random() < FILM.scratchChance) {
      this.scratches.push({ x: Math.random() * W, life: FILM.scratchLife[0] + Math.random() * (FILM.scratchLife[1] - FILM.scratchLife[0]),
        light: Math.random() < 0.6, a: 0.3 + Math.random() * 0.35, y0: Math.random() < 0.5 ? 0 : Math.random() * H * 0.5 });
    }
    for (let i = this.scratches.length - 1; i >= 0; i--) {
      const s = this.scratches[i];
      filmCtx.fillStyle = s.light ? "rgba(255,245,220," + s.a + ")" : "rgba(20,10,5," + s.a + ")";
      let x = s.x;
      for (let y = s.y0; y < H; y += 8) {
        x += Math.random() < 0.3 ? (Math.random() < 0.5 ? -1 : 1) : 0;
        filmCtx.fillRect(Math.round(x), y, 1, 8);
      }
      s.x += Math.random() < 0.5 ? -0.5 : 0.5;
      if (--s.life <= 0) this.scratches.splice(i, 1);
    }
    // dust specks and hairs
    const n = (Math.random() * (FILM.dustMax + 1)) | 0;
    for (let i = 0; i < n; i++) {
      const sz = 1 + ((Math.random() * 2.5) | 0);
      filmCtx.fillStyle = Math.random() < 0.7 ? "rgba(15,8,4,0.8)" : "rgba(255,240,210,0.7)";
      const x = (Math.random() * W) | 0, y = (Math.random() * H) | 0;
      if (Math.random() < 0.15) { filmCtx.fillRect(x, y, 1, 4 + sz * 2); filmCtx.fillRect(x + 1, y + 3 + sz * 2, 2, 1); }
      else filmCtx.fillRect(x, y, sz, sz);
    }
  },
};
