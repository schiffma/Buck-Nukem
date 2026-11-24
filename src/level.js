// Tile world. Maps are ASCII (see README.md for the legend), embedded by the build
// from src/levels/*.txt. Tiles are 16x16 and drawn procedurally per theme.
//
//  .  empty           #  solid          B  solid (alt)     =  one-way platform
//  H  ladder          ~  water (hurts)  R U G  locked door (red/blue/green)
//  r u g  key card    C  checkpoint     E  exit            P  player start
//  L  lawyer          K  crayfish       M  gardener-punk   X  boss
//  o  tennis ball     t  trophy         h  Rivella         s  Cervelat
//  +  extra life      w  weapon power-up
//  O  bar guy (seated regular)   W  waitress (behind the counter)   I  Einsiedler sign (4x1 prop)
//  D  sturdy crate (solid, indestructible)   d  breakable crate (solid, CRATE_HP strength)
//  n  net  f  fence  l  lamp  b  bush  v  window   (background decoration)
//  Clubhouse: a bar counter, A counter with taps, T table (one-way platforms);
//  props (decoration, anchored top-left): c chair, i stool, q bottle shelf, N neon sign,
//  $ cash register, Z trophy cabinet, m menu board, k kitchen pass, p picture,
//  x rackets, j hanging lamp, y plant, Y club plaque. Header "interior: x0-x1" gives
//  the column range drawn with the clubhouse wall backdrop instead of the photo.

const SOLID_CH = "#BRUGDd";
const CRATE_HP = 6;               // breakable crate strength (blaster 1, blade 3, shockwave 3)
const DECO_CH = "nflbv";
const PLATFORM_CH = "=aAT";
const ENTITY_CH = "PLKMXortuhsg+wCEFOW/13456789S>}e](){";   // / ramp, e ] ride fans (activists, rockers), ( ) roadside props (ride)   // O bar guy, W waitress (clubhouse bar); ! _ : / road hazards (ride)

// Water palettes: clear blue by default, toxic red in the Krebsbach creek.
const WATER_BLUE = { deep: "rgba(40,110,200,0.88)", mid: "rgba(120,190,255,0.6)", surface: "#cfe8ff",
  splash: "#9fd0ff", bubble: "#cfe8ff", glow: null };
const WATER_TOXIC = { deep: "rgba(120,8,8,0.92)", mid: "#b81c10", glint: "#ff6a30", surface: "#ff7a3a",
  splash: "#ff4020", bubble: "#ffd070", glow: "255,40,20" };
const THEMES = {
  court: { solid: "#bc5a2e", solid2: "#9a4424", top: "#e8783e", line: "#f2ead8", alt: "#9c9ca6", alt2: "#70707c",
           plat: "#34a852", plat2: "#1e6e36" },
  creek: { solid: "#93602e", solid2: "#734820", top: "#52c03c", line: "#2e8a24", alt: "#a0a094", alt2: "#6e6e64",
           plat: "#b87c38", plat2: "#7e5024", water: WATER_TOXIC },
  hall:  { solid: "#a84c30", solid2: "#783222", top: "#dca452", line: "#946430", alt: "#8c9ab0", alt2: "#5c6880",
           plat: "#dc6a2a", plat2: "#904414" },
  // the mofa ride: asphalt with dashed lane marks, a concrete curb below
  road:  { solid: "#76544a", solid2: "#5c3e36", top: "#886052", line: "#f0ece0", alt: "#a8a49c", alt2: "#7c786e",
           plat: "#8c7a5c", plat2: "#5c4c38" },
};

function buildTileset(themeName) {
  const T = THEMES[themeName];
  const rng = makeRng(themeName.length * 7919);
  function tile(draw) { const c = makeCanvas(TILE, TILE); draw(c.getContext("2d")); return c; }
  function noise(g, base, dark, density) {
    g.fillStyle = base; g.fillRect(0, 0, TILE, TILE);
    g.fillStyle = dark;
    for (let i = 0; i < density; i++) g.fillRect(Math.floor(rng() * TILE), Math.floor(rng() * TILE), 1, 1);
  }
  const ts = {};
  // Worn variants: 0 clean, 1 cracked, 2 grimy (rusty on hall metal). Chosen per tile
  // by a stable hash of (tx, ty) so surfaces don't repeat uniformly.
  function wear(g, v, rust) {
    if (v === 1) {                                   // cracks: jagged dark lines
      g.fillStyle = "rgba(10,6,4,0.75)";
      for (let k = 0; k < 2; k++) {
        let x = 2 + Math.floor(rng() * 12), y = Math.floor(rng() * 6);
        for (let n = 0; n < 9; n++) {
          g.fillRect(x, y, 1, 1);
          x += Math.floor(rng() * 3) - 1; y += 1;
          if (x < 0 || x > 15 || y > 15) break;
        }
      }
    } else if (v === 2) {                            // grime / rust blotches
      for (let k = 0; k < 3; k++) {
        const cx = Math.floor(rng() * 16), cy = Math.floor(rng() * 16), r = 1 + Math.floor(rng() * 3);
        pxEllipse(g, cx, cy, r + 1, r, rust ? "rgba(140,64,20,0.55)" : "rgba(20,12,6,0.4)");
      }
      g.fillStyle = rust ? "rgba(170,90,30,0.6)" : "rgba(0,0,0,0.35)";
      for (let i = 0; i < 10; i++) g.fillRect(Math.floor(rng() * 16), Math.floor(rng() * 16), 1, 1);
    }
  }
  function solidBase(g) {
    if (themeName === "road") {                     // below the road surface: a grassy verge with soil
      noise(g, "#4e7e2e", "#38601e", 50);
      g.fillStyle = "#6a4a2a"; for (let i = 0; i < 6; i++) g.fillRect(Math.floor(rng() * 16), 4 + Math.floor(rng() * 12), 2, 1);
      return;
    }
    noise(g, T.solid, T.solid2, 40);
    if (themeName === "hall") { // bricks
      g.fillStyle = T.solid2;
      for (let y = 0; y < 16; y += 4) { g.fillRect(0, y, 16, 1); const o = (y / 4) % 2 ? 0 : 8; g.fillRect(o, y, 1, 4); }
    }
  }
  function solidTopDeco(g) {
    g.fillStyle = T.top; g.fillRect(0, 0, 16, 4);
    if (themeName === "court") { g.fillStyle = T.line; g.fillRect(0, 1, 16, 1); }
    else if (themeName === "road") {                // the road surface: a full tile of asphalt, lane dash, concrete curb
      noise(g, T.solid, T.solid2, 40);
      g.fillStyle = "#3e3c42"; g.fillRect(0, 0, 16, 1);
      g.fillStyle = T.line; g.fillRect(3, 5, 9, 1);
      g.fillStyle = T.alt; g.fillRect(0, 13, 16, 3); g.fillStyle = T.alt2; g.fillRect(0, 15, 16, 1);
    }
    else if (themeName === "creek") {
      g.fillStyle = T.line;
      for (let x = 0; x < 16; x += 3) g.fillRect(x, 4, 1, 1 + Math.floor(rng() * 3));
      g.fillStyle = "#6aa848"; for (let x = 1; x < 16; x += 4) g.fillRect(x, 0, 1, 1);
    } else { g.fillStyle = T.line; g.fillRect(0, 3, 16, 1); g.fillRect(5, 0, 1, 3); g.fillRect(12, 0, 1, 3); }
  }
  function altBase(g) {
    noise(g, T.alt, T.alt2, 30);
    g.fillStyle = T.alt2; g.fillRect(0, 15, 16, 1); g.fillRect(15, 0, 1, 16);
    g.fillStyle = "#a0a0a4"; g.fillRect(0, 0, 15, 1); g.fillRect(0, 0, 1, 15);
    if (themeName === "hall") { g.fillStyle = "#c0c2c8"; [[3, 3], [12, 3], [3, 12], [12, 12]].forEach(function (p) { g.fillRect(p[0], p[1], 1, 1); }); }
  }
  function platBase(g) {
    g.fillStyle = T.plat; g.fillRect(0, 0, 16, 5);
    g.fillStyle = T.plat2; g.fillRect(0, 4, 16, 1); g.fillRect(2, 5, 2, 3); g.fillRect(12, 5, 2, 3);
    g.fillStyle = "rgba(255,255,255,0.25)"; g.fillRect(0, 0, 16, 1);
  }
  function platWear(g, v) {
    if (v === 1) { g.fillStyle = "rgba(10,6,4,0.7)"; const x = 3 + Math.floor(rng() * 10); g.fillRect(x, 0, 1, 3); g.fillRect(x + 1, 2, 1, 2); }
    else if (v === 2) { g.fillStyle = themeName === "creek" ? "rgba(20,12,6,0.45)" : "rgba(140,64,20,0.6)";
      for (let i = 0; i < 6; i++) g.fillRect(Math.floor(rng() * 16), Math.floor(rng() * 4), 2, 1); }
  }
  const metal = themeName === "hall";
  ts.solid = [0, 1, 2].map(function (v) { return tile(function (g) { solidBase(g); wear(g, v, false); }); });
  ts.solidTop = [0, 1, 2].map(function (v) { return tile(function (g) { solidBase(g); wear(g, v, false); solidTopDeco(g); }); });
  ts.alt = [0, 1, 2].map(function (v) { return tile(function (g) { altBase(g); wear(g, v, metal); }); });
  ts.plat = [0, 1, 2].map(function (v) { return tile(function (g) { platBase(g); platWear(g, v); }); });
  // cover crates (boss arena): wooden planks with a dark outline; sturdy ones with metal
  // bands and rivets; breakable ones get a cracked variant once half their strength is gone
  function crateBase(g) {
    g.fillStyle = "#a8743a"; g.fillRect(1, 1, 14, 14);
    g.fillStyle = "#c8904a"; for (let y = 1; y < 15; y += 5) g.fillRect(1, y, 14, 1);       // plank highlights
    g.fillStyle = "#6e4420"; for (let y = 5; y < 15; y += 5) g.fillRect(1, y, 14, 1);       // plank seams
    g.fillStyle = "#8a5a2a"; for (let i = 0; i < 12; i++) g.fillRect(2 + i, 2 + i, 1, 1);  // diagonal brace
    for (let i = 0; i < 12; i++) g.fillRect(3 + i, 2 + i, 1, 1);
    g.fillStyle = "rgb(" + OUTLINE_COLOR.join(",") + ")";
    g.fillRect(0, 0, 16, 1); g.fillRect(0, 15, 16, 1); g.fillRect(0, 0, 1, 16); g.fillRect(15, 0, 1, 16);
  }
  ts.crateSturdy = tile(function (g) {
    crateBase(g);
    g.fillStyle = "#8c949e"; g.fillRect(1, 2, 14, 2); g.fillRect(1, 12, 14, 2); g.fillRect(2, 1, 2, 14); g.fillRect(12, 1, 2, 14);
    g.fillStyle = "#c8d0d8"; g.fillRect(1, 2, 14, 1); g.fillRect(1, 12, 14, 1);
    g.fillStyle = "#3a404e"; [[2, 3], [12, 3], [2, 13], [12, 13], [7, 3], [7, 13]].forEach(function (p) { g.fillRect(p[0], p[1], 1, 1); });
  });
  ts.crate = tile(crateBase);
  ts.crateCracked = tile(function (g) {
    crateBase(g);
    g.fillStyle = "#2a160a";
    [[9, 1], [9, 2], [8, 3], [8, 4], [9, 5], [10, 6], [10, 7], [9, 8], [4, 9], [5, 10], [5, 11], [6, 12], [6, 13], [3, 6], [4, 7]].forEach(function (p) { g.fillRect(p[0], p[1], 1, 1); });
    g.fillStyle = "#5a3818"; g.fillRect(11, 10, 3, 2); g.fillRect(2, 2, 2, 2);             // splintered gaps
  });
  // clubhouse interior tiles (theme independent)
  ts.wallpaper = [0, 1].map(function (v) {
    return tile(function (g) {
      g.fillStyle = "#a8404e"; g.fillRect(0, 0, 16, 16);
      g.fillStyle = "#cc6474";                                  // damask diamonds
      for (let i = 0; i < 4; i++) { g.fillRect(8 - i, 2 + i, 1 + i * 2, 1); g.fillRect(8 - i, 9 - i, 1 + i * 2, 1); }
      g.fillStyle = "#d8b060"; g.fillRect(v ? 1 : 15, 13, 1, 1); g.fillRect(8, 5, 1, 1);
      g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(0, 0, 1, 16);
    });
  });
  ts.wainscot = tile(function (g) {
    g.fillStyle = "#9c6230"; g.fillRect(0, 0, 16, 16);
    g.fillStyle = "#b87a3c"; for (let x = 0; x < 16; x += 4) g.fillRect(x, 3, 3, 11);
    g.fillStyle = "#e0a85a"; g.fillRect(0, 1, 16, 2);           // dado rail
    g.fillStyle = "#2a1a0c"; g.fillRect(0, 14, 16, 2);          // skirting board
  });
  ts.counter = tile(function (g) {
    g.fillStyle = "#a8743c"; g.fillRect(0, 0, 16, 3);          // polished top
    g.fillStyle = "#d8a860"; g.fillRect(0, 0, 16, 1);
    g.fillStyle = "#4a2a12"; g.fillRect(0, 3, 16, 13);         // front panels
    g.fillStyle = "#5e3818"; g.fillRect(1, 5, 6, 9); g.fillRect(9, 5, 6, 9);
    g.fillStyle = "#c8a040"; g.fillRect(0, 13, 16, 1);         // brass foot rail
  });
  // Einsiedler tap tower (16x28, 12 px above the counter): chrome column and crossbar,
  // 3 tall red/white striped tap handles with a little red shield, spouts and a drip tray
  ts.counterTaps = (function () {
    const c = makeCanvas(TILE, TILE + 12), g = c.getContext("2d");
    g.drawImage(ts.counter, 0, 12);
    g.fillStyle = "#101018"; g.fillRect(1, 6, 14, 4);            // crossbar outline
    g.fillStyle = "#c8ccd4"; g.fillRect(2, 7, 12, 2);            // chrome crossbar
    g.fillStyle = "#f0f4f8"; g.fillRect(2, 7, 12, 1);
    g.fillStyle = "#8a8e98"; g.fillRect(7, 9, 2, 3);             // column into the counter
    [3, 7, 11].forEach(function (x) {
      g.fillStyle = "#101018"; g.fillRect(x - 1, 0, 4, 7);       // handle outline
      for (let y = 1; y < 6; y++) { g.fillStyle = y % 2 ? "#d01818" : "#f4f0e8"; g.fillRect(x, y, 2, 1); }   // red/white stripes
      g.fillStyle = "#e02020"; g.fillRect(x, 0, 2, 1);           // shield cap
      g.fillStyle = "#ffffff"; g.fillRect(x, 3, 1, 1);           // tiny white cross on the shield
      g.fillStyle = "#9a9ea8"; g.fillRect(x, 9, 2, 2);           // spout
    });
    g.fillStyle = "#3a3e48"; g.fillRect(1, 11, 14, 1);           // drip tray
    g.fillStyle = "#6a6e78"; g.fillRect(2, 11, 12, 1);
    return c;
  })();
  // counter variants: a beer on a beer mat, two beer mats (plain counter stays variant 0)
  ts.counterGlass = (function () {
    const c = makeCanvas(TILE, TILE + 6), g = c.getContext("2d");
    g.drawImage(ts.counter, 0, 6);
    g.fillStyle = "#101018"; g.fillRect(4, 0, 6, 7);             // glass outline
    g.fillStyle = "#d8902a"; g.fillRect(5, 2, 4, 4);             // amber beer
    g.fillStyle = "#f8f4e8"; g.fillRect(5, 1, 4, 1);             // foam
    g.fillStyle = "#ffd070"; g.fillRect(5, 3, 1, 2);             // highlight
    g.fillStyle = "#f0e8d0"; g.fillRect(3, 6, 8, 1);             // beer mat
    g.fillStyle = "#c81e1e"; g.fillRect(6, 6, 2, 1);
    return c;
  })();
  ts.counterMats = tile(function (g) {
    g.drawImage(ts.counter, 0, 0);
    g.fillStyle = "#f0e8d0"; g.fillRect(2, 0, 5, 1); g.fillRect(10, 0, 5, 1);   // two beer mats
    g.fillStyle = "#c81e1e"; g.fillRect(4, 0, 1, 1); g.fillRect(12, 0, 1, 1);
  });
  ts.table = tile(function (g) {
    for (let x = 0; x < 16; x += 2) {                             // red/white checked cloth
      g.fillStyle = (x / 2) % 2 ? "#e8e0d0" : "#b01818"; g.fillRect(x, 0, 2, 2);
      g.fillStyle = (x / 2) % 2 ? "#b01818" : "#e8e0d0"; g.fillRect(x, 2, 2, 2);
      g.fillStyle = (x / 2) % 2 ? "#e8e0d0" : "#b01818"; g.fillRect(x, 4, 2, 2);
    }
    g.fillStyle = "#8a5a2a"; g.fillRect(2, 6, 2, 10); g.fillRect(12, 6, 2, 10);   // legs
  });
  ts.ladder = tile(function (g) {
    g.fillStyle = "#c0c4cc"; g.fillRect(2, 0, 2, 16); g.fillRect(12, 0, 2, 16);
    g.fillStyle = "#808490"; g.fillRect(4, 3, 8, 2); g.fillRect(4, 11, 8, 2);
  });
  const WP = T.water || WATER_BLUE;
  ts.waterPalette = WP;
  ts.water = [0, 1, 2, 3].map(function (f) {
    return tile(function (g) {
      g.fillStyle = WP.deep; g.fillRect(0, 0, 16, 16);
      g.fillStyle = WP.mid;
      for (let i = 0; i < 4; i++) g.fillRect((i * 5 + f * 2) % 16, (i * 4 + 2) % 16, 3, 1);
      if (WP.glint) {                                   // rising toxic bubbles (move per frame)
        g.fillStyle = WP.glint;
        g.fillRect((3 + f * 4) % 15, 12 - f * 3, 1, 1);
        g.fillRect((10 + f * 3) % 15, 14 - ((f * 5) % 12), 2, 1);
      }
    });
  });
  ts.waterTop = [0, 1, 2, 3].map(function (f) {
    return tile(function (g) {
      g.drawImage(ts.water[f], 0, 0);
      g.clearRect(0, 0, 16, 4);
      for (let x = 0; x < 16; x++) {
        const y = 2 + Math.round(Math.sin((x + f * 4) / 16 * Math.PI * 2) * 1.2); // 1..3
        g.fillStyle = WP.deep; g.fillRect(x, y + 1, 1, 4 - (y + 1));
        g.fillStyle = WP.surface; g.fillRect(x, y, 1, 1);
      }
      if (WP.glint) {                                   // bubbles popping on the surface
        const bx = (2 + f * 5) % 13, by = 3;
        g.fillStyle = WP.glint;
        if (f % 2 === 0) { g.fillRect(bx, by - 1, 2, 1); g.fillRect(bx - 1, by, 1, 1); g.fillRect(bx + 2, by, 1, 1); }
        else { g.fillRect(bx, by - 2, 1, 1); g.fillRect(bx + 2, by - 1, 1, 1); g.fillRect(bx - 1, by - 1, 1, 1); }
        g.fillRect((bx + 7) % 15, 5, 2, 2);
      }
    });
  });
  // faint glow strip above toxic surface tiles
  ts.waterGlow = null;
  if (WP.glow) {
    const c = makeCanvas(16, 6), g = c.getContext("2d");
    for (let y = 0; y < 6; y++) { g.fillStyle = "rgba(" + WP.glow + "," + (0.04 * (y + 1)).toFixed(2) + ")"; g.fillRect(0, y, 16, 1); }
    ts.waterGlow = c;
  }
  ts.door = {};
  Object.keys(KEY_COLORS).forEach(function (k) {
    ts.door[k] = tile(function (g) {
      g.fillStyle = "#30343c"; g.fillRect(0, 0, 16, 16);
      g.fillStyle = KEY_COLORS[k]; g.fillRect(2, 0, 12, 16);
      g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(2, 7, 12, 2);
      g.fillStyle = "#101018"; g.fillRect(6, 4, 4, 4); g.fillStyle = "#f0f0f0"; g.fillRect(7, 5, 2, 2);
    });
  });
  ts.deco = {
    n: tile(function (g) {
      g.fillStyle = "#f4f4f4"; g.fillRect(0, 2, 16, 2);
      g.fillStyle = "rgba(20,20,20,0.75)";
      for (let i = 0; i < 16; i += 3) { g.fillRect(i, 4, 1, 12); }
      for (let j = 6; j < 16; j += 3) g.fillRect(0, j, 16, 1);
    }),
    f: themeName === "road" ? tile(function (g) {            // road: steel guard rail on posts
      g.fillStyle = "#6a6e72"; g.fillRect(2, 6, 2, 10); g.fillRect(12, 6, 2, 10);
      g.fillStyle = "#c8ccd0"; g.fillRect(0, 5, 16, 4); g.fillStyle = "#8a8e92"; g.fillRect(0, 7, 16, 1); g.fillStyle = "#e8ecee"; g.fillRect(0, 5, 16, 1);
    }) : tile(function (g) {
      g.fillStyle = "rgba(40,120,70,0.8)";
      for (let i = -16; i < 16; i += 4) for (let y = 0; y < 16; y++) {
        g.fillRect(i + y, y, 1, 1); g.fillRect(i + 16 - y, y, 1, 1);
      }
      g.fillStyle = "#2a5a3a"; g.fillRect(0, 0, 16, 1);
    }),
    l: tile(function (g) { g.fillStyle = "#70747c"; g.fillRect(7, 0, 2, 16); }),
    lTop: tile(function (g) {
      g.fillStyle = "#70747c"; g.fillRect(7, 6, 2, 10); g.fillRect(3, 4, 10, 2);
      g.fillStyle = "#fff8c0"; g.fillRect(3, 6, 4, 2); g.fillRect(9, 6, 4, 2);
    }),
    b: tile(function (g) {
      pxEllipse(g, 8, 10, 8, 6, "#2e7a2a"); pxEllipse(g, 6, 9, 4, 3, "#46a03a"); pxEllipse(g, 11, 11, 3, 2, "#3a8e30");
    }),
    v: tile(function (g) {
      g.fillStyle = "#8a9098"; g.fillRect(0, 0, 16, 1); g.fillRect(0, 15, 16, 1); g.fillRect(0, 0, 1, 16); g.fillRect(15, 0, 1, 16);
      g.fillRect(7, 0, 2, 16); g.fillStyle = "rgba(180,220,255,0.15)"; g.fillRect(1, 1, 6, 14);
    }),
  };
  return ts;
}

// Stable worn-variant choice for a tile position (0 clean, 1 cracked, 2 grimy).
function tileVariant(tx, ty) {
  let h = Math.imul(tx, 73856093) ^ Math.imul(ty, 19349663);
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  const r = ((h ^ (h >>> 16)) >>> 0) % 10;
  return r < 5 ? 0 : r < 8 ? 1 : 2;
}

class Level {
  constructor(data, index) {
    this.index = index;
    this.name = data.name || "LEVEL " + (index + 1);
    this.theme = data.theme || "court";
    this.bgName = data.bg || "bg_court";
    this.isBoss = data.boss === "1";
    this.isRide = data.ride === "1";       // the mofa ride (src/ride.js)
    this.rows = data.map.map(function (r) { return r.split(""); });
    this.h = this.rows.length;
    this.w = this.rows[0].length;
    this.pxW = this.w * TILE;
    this.pxH = this.h * TILE;
    this.spawns = [];
    this.openDoors = {};
    this.crateHp = {};             // "tx,ty" -> strength of breakable crates (reset on load)
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const ch = this.rows[y][x];
      if (ENTITY_CH.indexOf(ch) >= 0) {
        this.spawns.push({ ch: ch, tx: x, ty: y });
        const l = this.rows[y][x - 1], r = this.rows[y][x + 1];
        this.rows[y][x] = (ch === "K" && (l === "~" || r === "~")) ? "~" : ".";
      }
    }
    this.tiles = buildTileset(this.theme);
    if (this.isRide) this.buildRoad(data.climb);
    const ir = /^(\d+)-(\d+)$/.exec(data.interior || "");
    this.interior = ir ? [+ir[1], +ir[2]] : null;
    const bg = IMG[this.bgName];
    this.bgStrip = bg ? makeMirroredStrip(bg) : null;
    // Header "stretches: 0 bg_lake, 160 bg_village, ...": from that column on, the backdrop changes
    // (cross-faded over one screen around each border); the roadside props follow the stretch too.
    this.stretches = (data.stretches || "").split(",").map(function (s) { return s.trim().split(/\s+/); })
      .filter(function (p) { return p.length === 2 && IMG[p[1]]; })
      .map(function (p) { return { x0: +p[0] * TILE, name: p[1], img: IMG[p[1]] }; });
    this.stretches.forEach(function (s, k, a) { s.x1 = k + 1 < a.length ? a[k + 1].x0 : this.pxW; }, this);
    this.waterPalette = this.tiles.waterPalette;
  }
  // ---- the ride's road: a smooth surface instead of tile steps ----
  // colTop[tx]: the top row of the road in that column (first solid tile from the top).
  // Header "climb: x0-x1 r0-r1": between columns x0 and x1 the road top rises smoothly from row
  // r0 to row r1, eased in and out (the map's floor is stepped there; the drawing and the physics use the line).
  buildRoad(climb) {
    this.colTop = [];
    for (let tx = 0; tx < this.w; tx++) {
      let top = this.h;
      for (let ty = 0; ty < this.h; ty++) if (this.isSolid(tx, ty)) { top = ty; break; }
      this.colTop.push(top);
    }
    const m = /^(\d+)-(\d+)\s+(\d+)-(\d+)$/.exec((climb || "").trim());
    this.climb = m ? { x0: +m[1] * TILE, x1: (+m[2] + 1) * TILE, y0: +m[3] * TILE, y1: +m[4] * TILE } : null;
  }
  roadTop(x) {
    const c = this.climb;
    if (c && x >= c.x0 && x <= c.x1) {                  // eased in and out: steepest in the middle (1.5x the mean grade)
      const t = (x - c.x0) / (c.x1 - c.x0);
      return c.y0 + (c.y1 - c.y0) * t * t * (3 - 2 * t);
    }
    const tx = clamp(Math.floor(x / TILE), 0, this.w - 1);
    return this.colTop[tx] * TILE;
  }
  // how far the smooth road lies above (-) or below (+) the map's stepped floor at x
  slopeShift(x) {
    if (!this.isRide) return 0;
    const tx = clamp(Math.floor(x / TILE), 0, this.w - 1);
    return this.roadTop(x) - this.colTop[tx] * TILE;
  }
  // Road and grass verge along the profile (ride levels): from a pre-built band (the road tile and
  // the verge below, repeated across W + 16 px), one draw per run of columns at the same height:
  // a single draw on the flat, one per pixel step on the climb.
  drawRoad(camX, camY) {
    const ts = this.tiles;
    if (!this.roadBand) {
      const b = makeCanvas(W + TILE, TILE + VIEW_H), g = b.getContext("2d");
      for (let x = 0; x < b.width; x += TILE) {
        g.drawImage(ts.solidTop[0], x, 0);
        for (let y = TILE; y < b.height; y += TILE) g.drawImage(ts.solid[(y / TILE) % 3], x, y);
      }
      this.roadBand = b;
    }
    const x0 = Math.floor(camX), bottom = HUD_H + VIEW_H, band = this.roadBand;
    let sx = 0;
    while (sx < W) {
      const top = Math.round(this.roadTop(x0 + sx) - camY + HUD_H);
      let ex = sx + 1;
      while (ex < W && Math.round(this.roadTop(x0 + ex) - camY + HUD_H) === top) ex++;
      if (top < bottom) {
        const u = (((x0 + sx) % TILE) + TILE) % TILE, h = Math.min(bottom - top, band.height);
        ctx.drawImage(band, u, 0, ex - sx, h, sx, top, ex - sx, h);
      }
      sx = ex;
    }
  }
  at(tx, ty) {
    if (tx < 0 || tx >= this.w) return "#";       // side walls
    if (ty < 0 || ty >= this.h) return ".";
    return this.rows[ty][tx];
  }
  isSolid(tx, ty) { return SOLID_CH.indexOf(this.at(tx, ty)) >= 0; }
  isPlatform(tx, ty) { return PLATFORM_CH.indexOf(this.at(tx, ty)) >= 0; }
  inInterior(tx) { return !!this.interior && tx >= this.interior[0] && tx <= this.interior[1]; }
  isLadder(tx, ty) { return this.at(tx, ty) === "H"; }
  isLadderTop(tx, ty) { return this.isLadder(tx, ty) && !this.isLadder(tx, ty - 1); }
  isWater(tx, ty) { return this.at(tx, ty) === "~"; }
  isDoor(tx, ty) { return "RUG".indexOf(this.at(tx, ty)) >= 0; }
  isCrate(tx, ty) { const c = this.at(tx, ty); return c === "D" || c === "d"; }
  crateStrength(tx, ty) {
    if (this.at(tx, ty) !== "d") return 0;
    const k = tx + "," + ty;
    return k in this.crateHp ? this.crateHp[k] : CRATE_HP;
  }
  // Damages a breakable crate; returns true when it broke. Sturdy crates ignore damage.
  hitCrate(tx, ty, dmg) {
    if (this.at(tx, ty) !== "d") return false;
    const k = tx + "," + ty, hp = this.crateStrength(tx, ty) - dmg;
    if (hp > 0) { this.crateHp[k] = hp; return false; }
    delete this.crateHp[k];
    this.rows[ty][tx] = ".";
    const cx = tx * TILE + 8, cy = ty * TILE + 8;
    FX.gibs(cx, cy, GORE.wood, 10, false);
    FX.spark(cx, cy, "#c8904a", 10, 90, 0.5, 300);
    Sound.play("crate");
    return true;
  }
  // standable from above (for one-way collision and enemy ledge checks)
  isFloor(tx, ty) { return this.isSolid(tx, ty) || this.isPlatform(tx, ty) || this.isLadderTop(tx, ty); }

  // Opens every door tile of this colour connected to (tx, ty).
  openDoor(tx, ty) {
    const color = this.at(tx, ty);
    const stack = [[tx, ty]];
    let n = 0;
    while (stack.length) {
      const p = stack.pop();
      if (this.at(p[0], p[1]) !== color) continue;
      this.rows[p[1]][p[0]] = ".";
      n++;
      FX.spark(p[0] * TILE + 8, p[1] * TILE + 8, KEY_COLORS[color], 6, 60, 0.5);
      stack.push([p[0], p[1] - 1], [p[0], p[1] + 1], [p[0] - 1, p[1]], [p[0] + 1, p[1]]);
    }
    return n;
  }

  // index of the stretch at world x (0 without stretches)
  stretchAt(x) {
    let i = 0;
    for (let k = 1; k < this.stretches.length; k++) if (x >= this.stretches[k].x0) i = k;
    return i;
  }
  // The backdrop: the stretch at the camera's centre; within half a screen of a border the next
  // stretch fades in (alpha 0 -> 1 over one screen), so there is no hard cut.
  drawBackground(camX, camY) {
    const st = this.stretches;
    if (st.length) {
      const cx = camX + W / 2;
      for (let k = 1; k < st.length; k++) {
        const t = (cx - st[k].x0 + W / 2) / W;
        if (t > 0 && t < 1) {
          this.drawStretch(st[k - 1], camX, camY);
          ctx.globalAlpha = t; this.drawStretch(st[k], camX, camY); ctx.globalAlpha = 1;
          return;
        }
      }
      this.drawStretch(st[this.stretchAt(cx)], camX, camY);
      return;
    }
    if (!this.bgStrip) { fillRect(0, HUD_H, W, VIEW_H, "#203040"); return; }
    this.drawStrip(this.bgStrip, camX, camY);
    if (this.theme === "hall") fillRect(0, HUD_H, W, VIEW_H, "rgba(10,8,24,0.35)");
  }
  // a stretch's photo pans once from its left edge (camera half a screen before the stretch) to its
  // right edge (half a screen after it): slow, distant scenery, never mirrored
  drawStretch(s, camX, camY) {
    const u = clamp((camX + W - s.x0) / (s.x1 - s.x0 + W), 0, 1);
    const maxCamY = Math.max(1, this.pxH - VIEW_H);
    const oy = HUD_H - Math.round((camY / maxCamY) * (s.img.height - VIEW_H));
    ctx.drawImage(s.img, -Math.round(u * (s.img.width - W)), oy);
  }
  drawStrip(strip, camX, camY) {
    const sw = strip.width;
    const ox = Math.floor((camX * 0.3) % sw);
    const maxCamY = Math.max(1, this.pxH - VIEW_H);
    const oy = HUD_H - Math.round((camY / maxCamY) * (strip.height - VIEW_H));
    ctx.drawImage(strip, -ox, oy);
    if (sw - ox < W) ctx.drawImage(strip, sw - ox, oy);
  }

  drawTiles(camX, camY, time, layer) {
    // props can span several tiles to the right/down of their anchor: widen the scan back
    const x0 = Math.floor(camX / TILE) - (layer === "back" ? 6 : 0), y0 = Math.floor(camY / TILE) - (layer === "back" ? 1 : 0);
    const x1 = Math.ceil((camX + W) / TILE), y1 = Math.ceil((camY + VIEW_H) / TILE);
    const ts = this.tiles;
    const wf = Math.floor(time * 6) % 4;
    if (layer === "back" && this.interior) this.drawInterior(camX, camY);
    if (layer === "main" && this.isRide) this.drawRoad(camX, camY);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) continue;
      const ch = this.rows[ty][tx];
      const sx = tx * TILE - camX, sy = ty * TILE - camY + HUD_H;
      let img = null;
      if (layer === "back") {
        if (DECO_CH.indexOf(ch) >= 0) img = ch === "l" && this.at(tx, ty - 1) !== "l" ? ts.deco.lTop : ts.deco[ch];
        else if (ch === "H") img = ts.ladder;
        else if (PROP_DEFS[ch]) img = propCanvas(ch, time);
      } else if (layer === "main") {
        const v = tileVariant(tx, ty);
        if (ch === "#" && this.isRide) continue;     // the ride's road is drawn along its profile (drawRoad)
        if (ch === "#") img = this.isSolid(tx, ty - 1) && !this.isCrate(tx, ty - 1) ? ts.solid[v] : ts.solidTop[v];
        else if (ch === "D") img = ts.crateSturdy;
        else if (ch === "d") img = this.crateStrength(tx, ty) <= CRATE_HP / 2 ? ts.crateCracked : ts.crate;
        else if (ch === "B") img = ts.alt[v];
        else if (ch === "=") img = ts.plat[v];
        else if (ch === "a") {          // counter: plain, a beer on a mat, or two mats
          const cv = v % 3;
          if (cv === 1) { ctx.drawImage(ts.counterGlass, Math.round(sx), Math.round(sy) - 6); continue; }
          img = cv === 2 ? ts.counterMats : ts.counter;
        }
        else if (ch === "T") img = ts.table;
        else if (ch === "A") { ctx.drawImage(ts.counterTaps, Math.round(sx), Math.round(sy) - 12); continue; }
        else if (ts.door[ch]) img = ts.door[ch];
      } else if (layer === "water" && ch === "~") {
        const top = !this.isWater(tx, ty - 1);
        img = top ? ts.waterTop[wf] : ts.water[wf];
        if (top && ts.waterGlow) ctx.drawImage(ts.waterGlow, Math.round(sx), Math.round(sy) - 6);
      }
      if (img) ctx.drawImage(img, Math.round(sx), Math.round(sy));
    }
  }

  // Clubhouse wall backdrop (wallpaper, wainscot above floors) over the photo, for
  // every non-solid, non-water, non-window cell inside the interior column range.
  drawInterior(camX, camY) {
    const ts = this.tiles;
    const x0 = Math.max(this.interior[0], Math.floor(camX / TILE)), x1 = Math.min(this.interior[1], Math.ceil((camX + W) / TILE));
    const y0 = Math.max(0, Math.floor(camY / TILE)), y1 = Math.min(this.h - 1, Math.ceil((camY + VIEW_H) / TILE));
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const ch = this.rows[ty][tx];
      if (this.isSolid(tx, ty) || ch === "~" || ch === "v") continue;
      const img = this.isSolid(tx, ty + 1) ? ts.wainscot : ts.wallpaper[(tx + ty) % 2];
      ctx.drawImage(img, tx * TILE - camX, ty * TILE - camY + HUD_H);
    }
  }
}

// Camera with a dead zone, clamped to the level bounds.
// anchorX: where the target's centre is kept horizontally (the middle by default; the boss
// arena keeps Buck near the left edge so the view shows the arena ahead, towards the boss).
const Camera = {
  x: 0, y: 0, anchorX: W / 2,
  snap(target, level) {
    this.x = this.anchorX === W / 2 ? target.x - W / 2 : target.x + target.w / 2 - this.anchorX;
    this.y = level.isRide ? this.rideY(target, level) : target.y - VIEW_H / 2; this.clamp(level);
  },
  // The ride: the camera rides on the road profile, the road surface 24 px above the bottom of the
  // view (as on a one-screen-high map), rising with the climb; hops and ramp jumps don't move it.
  rideY(target, level) { return level.roadTop(target.x + target.w / 2) - (VIEW_H - 24); },
  follow(target, level) {
    const cx = target.x + target.w / 2, cy = target.y + target.h / 2;
    const ax = this.anchorX, dzX = ax === W / 2 ? 24 : 12, top = 70, bottom = 140;
    const sx = cx - this.x;
    if (sx < ax - dzX) this.x = cx - (ax - dzX);
    if (sx > ax + dzX) this.x = cx - (ax + dzX);
    const sy = cy - this.y;
    if (level.isRide) this.y = this.rideY(target, level);
    else if (sy < top) this.y = cy - top;
    else if (sy > bottom) this.y = cy - bottom;
    this.clamp(level);
  },
  clamp(level) {
    this.x = level.pxW <= W ? (level.pxW - W) / 2 : clamp(this.x, 0, level.pxW - W);
    this.y = level.pxH <= VIEW_H ? (level.pxH - VIEW_H) / 2 : clamp(this.y, 0, level.pxH - VIEW_H);
  },
};

// Shared AABB-vs-tile movement (axis separated). Returns collision flags.
// opts: {platforms: bool (land on one-way platforms + ladder tops), dropThrough: bool}
function moveBody(b, dt, level, opts) {
  opts = opts || {};
  const res = { wallL: false, wallR: false, ground: false, ceil: false };
  // X axis
  b.x += b.vx * dt;
  const ty0 = Math.floor(b.y / TILE), ty1 = Math.floor((b.y + b.h - 1) / TILE);
  if (b.vx > 0) {
    const tx = Math.floor((b.x + b.w - 1) / TILE);
    for (let ty = ty0; ty <= ty1; ty++) if (level.isSolid(tx, ty)) { b.x = tx * TILE - b.w; res.wallR = true; res.wallTile = [tx, ty]; break; }
  } else if (b.vx < 0) {
    const tx = Math.floor(b.x / TILE);
    for (let ty = ty0; ty <= ty1; ty++) if (level.isSolid(tx, ty)) { b.x = (tx + 1) * TILE; res.wallL = true; res.wallTile = [tx, ty]; break; }
  }
  // Y axis
  const prevBottom = b.y + b.h;
  b.y += b.vy * dt;
  const tx0 = Math.floor(b.x / TILE), tx1 = Math.floor((b.x + b.w - 1) / TILE);
  if (b.vy > 0) {
    const ty = Math.floor((b.y + b.h - 0.01) / TILE);   // tile containing the feet
    for (let tx = tx0; tx <= tx1; tx++) {
      const top = ty * TILE;
      const oneWay = opts.platforms && !opts.dropThrough &&
        (level.isPlatform(tx, ty) || level.isLadderTop(tx, ty)) && prevBottom <= top + 0.01;
      if (level.isSolid(tx, ty) || oneWay) { b.y = top - b.h; b.vy = 0; res.ground = true; break; }
    }
  } else if (b.vy < 0) {
    const ty = Math.floor(b.y / TILE);
    for (let tx = tx0; tx <= tx1; tx++) if (level.isSolid(tx, ty)) { b.y = (ty + 1) * TILE; b.vy = 0; res.ceil = true; res.ceilTile = [tx, ty]; break; }
  }
  return res;
}

// True when the body is standing on something (used for ground checks without moving).
function standingOn(b, level, platforms) {
  const ty = Math.floor((b.y + b.h + 1) / TILE);
  const tx0 = Math.floor(b.x / TILE), tx1 = Math.floor((b.x + b.w - 1) / TILE);
  for (let tx = tx0; tx <= tx1; tx++) {
    if (level.isSolid(tx, ty)) return true;
    if (platforms && (level.isPlatform(tx, ty) || level.isLadderTop(tx, ty)) && Math.abs(b.y + b.h - ty * TILE) < 1) return true;
  }
  return false;
}
