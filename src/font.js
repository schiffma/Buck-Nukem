// 5x7 bitmap font. Each glyph: 7 rows, 5 bits per row (bit 4 = leftmost pixel).
const GLYPHS = {
  A: [14, 17, 17, 31, 17, 17, 17], B: [30, 17, 17, 30, 17, 17, 30], C: [14, 17, 16, 16, 16, 17, 14],
  D: [30, 17, 17, 17, 17, 17, 30], E: [31, 16, 16, 30, 16, 16, 31], F: [31, 16, 16, 30, 16, 16, 16],
  G: [14, 17, 16, 23, 17, 17, 15], H: [17, 17, 17, 31, 17, 17, 17], I: [14, 4, 4, 4, 4, 4, 14],
  J: [7, 2, 2, 2, 2, 18, 12], K: [17, 18, 20, 24, 20, 18, 17], L: [16, 16, 16, 16, 16, 16, 31],
  M: [17, 27, 21, 21, 17, 17, 17], N: [17, 17, 25, 21, 19, 17, 17], O: [14, 17, 17, 17, 17, 17, 14],
  P: [30, 17, 17, 30, 16, 16, 16], Q: [14, 17, 17, 17, 21, 18, 13], R: [30, 17, 17, 30, 20, 18, 17],
  S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4], U: [17, 17, 17, 17, 17, 17, 14],
  V: [17, 17, 17, 17, 17, 10, 4], W: [17, 17, 17, 21, 21, 21, 10], X: [17, 17, 10, 4, 10, 17, 17],
  Y: [17, 17, 10, 4, 4, 4, 4], Z: [31, 1, 2, 4, 8, 16, 31],
  0: [14, 17, 19, 21, 25, 17, 14], 1: [4, 12, 4, 4, 4, 4, 14], 2: [14, 17, 1, 2, 4, 8, 31],
  3: [31, 2, 4, 2, 1, 17, 14], 4: [2, 6, 10, 18, 31, 2, 2], 5: [31, 16, 30, 1, 1, 17, 14],
  6: [6, 8, 16, 30, 17, 17, 14], 7: [31, 1, 2, 4, 8, 8, 8], 8: [14, 17, 17, 14, 17, 17, 14],
  9: [14, 17, 17, 15, 1, 2, 12],
  " ": [0, 0, 0, 0, 0, 0, 0], ".": [0, 0, 0, 0, 0, 12, 12], ",": [0, 0, 0, 0, 12, 4, 8],
  "!": [4, 4, 4, 4, 4, 0, 4], "?": [14, 17, 1, 2, 4, 0, 4], ":": [0, 12, 12, 0, 12, 12, 0],
  "-": [0, 0, 0, 31, 0, 0, 0], "'": [4, 4, 8, 0, 0, 0, 0], "/": [1, 1, 2, 4, 8, 16, 16],
  "(": [2, 4, 8, 8, 8, 4, 2], ")": [8, 4, 2, 2, 2, 4, 8], "+": [0, 4, 4, 31, 4, 4, 0],
  "=": [0, 0, 31, 0, 31, 0, 0], ">": [8, 4, 2, 1, 2, 4, 8], "<": [2, 4, 8, 16, 8, 4, 2],
  "%": [24, 25, 2, 4, 8, 19, 3], '"': [10, 10, 0, 0, 0, 0, 0], "*": [0, 21, 14, 31, 14, 21, 0],
  "♥": [0, 10, 31, 31, 14, 4, 0],
  // Swiss German umlauts (Buck's lines): two dots in the top row over a five-row letter
  "Ä": [10, 0, 14, 17, 31, 17, 17], "Ö": [10, 0, 14, 17, 17, 17, 14], "Ü": [10, 0, 17, 17, 17, 17, 14],
};
const FONT_CHARS = Object.keys(GLYPHS).join("");
const fontAtlases = {};

function fontAtlas(color) {
  if (fontAtlases[color]) return fontAtlases[color];
  const c = makeCanvas(FONT_CHARS.length * 6, 7);
  const g = c.getContext("2d");
  g.fillStyle = color;
  for (let i = 0; i < FONT_CHARS.length; i++) {
    const rows = GLYPHS[FONT_CHARS[i]];
    for (let y = 0; y < 7; y++)
      for (let x = 0; x < 5; x++)
        if (rows[y] & (16 >> x)) g.fillRect(i * 6 + x, y, 1, 1);
  }
  fontAtlases[color] = c;
  return c;
}

function textWidth(str, scale) { return str.length * 6 * (scale || 1) - (scale || 1); }

// Draws text; opts: {scale, align: "left"|"center"|"right", shadow: color}
function drawText(str, x, y, color, opts) {
  opts = opts || {};
  const s = opts.scale || 1;
  str = String(str).toUpperCase();
  if (opts.align === "center") x -= Math.floor(textWidth(str, s) / 2);
  else if (opts.align === "right") x -= textWidth(str, s);
  if (opts.shadow) drawText(str, x + s, y + s, opts.shadow, { scale: s });
  const atlas = fontAtlas(color || "#fff");
  x = Math.round(x); y = Math.round(y);
  for (let i = 0; i < str.length; i++) {
    const idx = FONT_CHARS.indexOf(str[i]);
    if (idx > 0 || str[i] === FONT_CHARS[0])
      ctx.drawImage(atlas, idx * 6, 0, 5, 7, x + i * 6 * s, y, 5 * s, 7 * s);
  }
}
