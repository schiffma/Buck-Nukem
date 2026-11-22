// Global constants and tuning values. Everything gameplay-related lives in CONFIG
// so balance can be tweaked in one place.
const W = 320, H = 240;          // native resolution
const HUD_H = 16;                // HUD bar at the top
const VIEW_H = H - HUD_H;        // visible world height (224)
const TILE = 16;
const DT = 1 / 60;               // fixed simulation step

const CONFIG = {
  gravity: 1000,
  maxFall: 420,
  runSpeed: 96,
  accel: 900,
  jumpVel: -330,
  jumpCut: 0.45,                 // vy multiplier when Jump is released early
  climbSpeed: 64,
  coyoteTime: 0.07,
  maxHp: 8,
  startLives: 3,
  invuln: 1.0,
  // weapon
  fireRate: 5,                   // shots per second, standard blaster
  fireRateUp: 9,                 // shots per second, power-up
  shotSpeed: 260,
  shotDmg: 1,
  shotDmgUp: 2,
  cutterRate: 2.5,               // saw blades per second, disc cutter (boss arena)
  cutterSpeed: 190,
  cutterDmg: 3,
  // enemies
  activateMarginX: W,            // enemies update within one screen width of the view
  activateMarginY: VIEW_H,
  lawyerHp: 3, lawyerSpeed: 28, lawyerRange: 150, lawyerCooldown: 1.8, lawyerPoints: 200,
  crayHp: 2, craySpeed: 40, crayLeapRange: 96, crayCooldown: 1.6, crayPoints: 100,
  punkHp: 5, punkSpeed: 24, punkChargeSpeed: 110, punkRange: 96, punkChargeMax: 128,
  punkRev: 0.5, punkCooldown: 2.0, punkPoints: 500,
  bossHp: 50, bossPoints: 10000,
  // scoring
  ballPoints: 50, trophyPoints: 1000, levelBonus: 2500,
  waterDamage: 2,
};

const STATE = {
  TITLE: "TITLE", LEVEL_INTRO: "LEVEL_INTRO", PLAY: "PLAY", PAUSE: "PAUSE",
  LEVEL_COMPLETE: "LEVEL_COMPLETE", BOSS: "BOSS", GAME_OVER: "GAME_OVER", VICTORY: "VICTORY",
};

// Small deterministic RNG (used for procedural tiles so every run looks the same).
function makeRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function rnd(a, b) { return a + Math.random() * (b - a); }
