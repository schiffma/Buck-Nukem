// 320x240 back buffer, scaled to the largest integer multiple that fits the window.
const screenCanvas = document.getElementById("screen");
const screenCtx = screenCanvas.getContext("2d");
const buffer = document.createElement("canvas");
buffer.width = W; buffer.height = H;
const ctx = buffer.getContext("2d", { willReadFrequently: true });   // read back every frame by the film pass
ctx.imageSmoothingEnabled = false;

let displayScale = 1;
let booted = false;     // set by boot() once all modules and assets are ready

function resizeScreen() {
  const s = Math.max(1, Math.floor(Math.min(window.innerWidth / W, window.innerHeight / H)));
  displayScale = s;
  // Backing store at the scaled size: nearest-neighbour upscale done by us, so the
  // result is sharp in every browser (CSS image-rendering is a second safeguard).
  screenCanvas.width = W * s;
  screenCanvas.height = H * s;
  screenCanvas.style.width = (W * s) + "px";
  screenCanvas.style.height = (H * s) + "px";
  screenCtx.imageSmoothingEnabled = false;
  if (booted) present();   // resizing clears the canvas
}
window.addEventListener("resize", resizeScreen);
resizeScreen();

// Draws the frame to the screen: through the film filter (src/film.js) when enabled,
// with a 0-1 px gate-weave jitter, otherwise the raw buffer.
function present() {
  const s = displayScale;
  screenCtx.imageSmoothingEnabled = false;
  if (Film.enabled) {
    Film.apply();
    screenCtx.fillStyle = "#000";
    screenCtx.fillRect(0, 0, W * s, H * s);
    screenCtx.drawImage(filmCanvas, Film.jx * s, Film.jy * s, W * s, H * s);
  } else {
    screenCtx.drawImage(buffer, 0, 0, W * s, H * s);
  }
}

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  return c;
}

// Pixel-exact filled ellipse (no anti-aliasing), for procedural sprites.
function pxEllipse(g, cx, cy, rx, ry, color) {
  g.fillStyle = color;
  for (let y = -ry; y <= ry; y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    if (w > 0) g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 1);
  }
}

function fillRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}
