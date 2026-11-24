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
  megaCutterDmg: 5, megaCutterRise: 70,   // Mega Cutter (boss arena upgrade): twin blades, 5 damage, 2nd rises
  upgradeRespawn: 20,            // s until the Mega Cutter pickup comes back (while Buck lacks it)
  // enemies
  activateMarginX: W,            // enemies update within one screen width of the view
  activateMarginY: VIEW_H,
  lawyerTalkCd: 4, lawyerTalkT: 1.5, lawyerTalkChance: 0.5,   // lawyer one-liners at a throw
  lawyerHp: 3, lawyerSpeed: 28, lawyerRange: 150, lawyerCooldown: 1.8, lawyerPoints: 200,
  crayHp: 2, craySpeed: 40, crayLeapRange: 96, crayCooldown: 1.6, crayPoints: 100,
  punkHp: 5, punkSpeed: 24, punkChargeSpeed: 110, punkRange: 96, punkChargeMax: 128,
  punkRev: 0.5, punkCooldown: 2.0, punkPoints: 500,
  bossHp: 50, bossPoints: 10000,
  bossSummons: 3,
  // mofa ride (src/ride.js): px/s and px/s^2
  mofaTop: 150, mofaAccel: 70, mofaBrake: 200, mofaCoast: 30, mofaReverse: 0.25, mofaHopVel: -330,
  mofaW: 28, mofaH: 30, mofaClimbK: 4,          // uphill: top speed x max(0.4, 1 - k * grade)
  mofaRampVel: -360, mofaRampGrav: 0.5,         // ramp launch at top speed; gravity factor in that flight
  // posh drivers (src/cars.js)
  suvHp: 12, teslaHp: 8, ferrariHp: 6,               // suv: the BMW X7
  suvPoints: 800, teslaPoints: 700, ferrariPoints: 1000,
  wd40Heal: 2,                                         // WD-40 can (ride health pickup)
  limoHp: 30, limoPoints: 3000, limoGateGap: 60,       // the president's limo: parks this far before the club gate
  limoTalkEvery: [2, 3],                              // the president or a lady at the window speaks
  corkEvery: [1.0, 1.5],                               // champagne corks from the sunroof, while Buck is within a screen
  suvSpeed: 90, ferrariSpeed: 340, carKnockback: 160, carContact: 2, suvThrowEvery: [1.5, 2.5], wreckLife: 20,
  driverTalkT: 1.5, driverTalkEvery: [2.5, 3.5],    // posh drivers: a line on first sight, then every 2.5-3.5 s
  rideBubbles: 2,                                    // ride: at most this many car bubbles at once (never overlapping)
  mofaRate: 10, mofaShotSpeed: 300, mofaAim: 30,   // mounted machine gun: shots/s, px/s, Up angle (degrees)
  rideCamX: 96,                  // ride: the camera keeps Buck's centre about this far from the left edge
  bossCamX: 80,                  // boss arena: the camera keeps Buck's centre about this far from the left edge
  reveal: { pan: 0.8, hold: 1.2, back: 0.8, skipBack: 0.3 },   // boss reveal camera pan at arena start (s)                // summon attacks per boss fight; then it alternates slam and bubbles
  shockwaveCrateDmg: 3,
  ledgeKnockback: 25,            // hit while standing on a one-way platform: small stagger (80 elsewhere)          // claw-slam shockwave vs breakable crates
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
// two screen boxes closer than `gap` px (or overlapping)
function rectsTouch(a, b, gap) {
  return a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap;
}
function rnd(a, b) { return a + Math.random() * (b - a); }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[k]; a[k] = t; } return a; }
