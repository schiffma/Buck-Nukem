// Buck Nukem: movement, ladders, shooting, health, lives and respawn.
const Player = {
  x: 0, y: 0, w: 10, h: 28, vx: 0, vy: 0,
  face: 1, onGround: false, coyote: 0, jumping: false,
  climbing: false, climbAnim: 0,
  hp: CONFIG.maxHp, lives: CONFIG.startLives,
  invuln: 0, hurtT: 0, dead: false, deathT: 0,
  weapon: "blaster", keys: {}, fireCd: 0, shootT: 0, animT: 0,
  spawnX: 0, spawnY: 0, waterCd: 0,

  resetForGame() {
    this.hp = CONFIG.maxHp; this.lives = CONFIG.startLives; this.weapon = "blaster"; this.keys = {};
  },
  placeAt(px, py) {
    this.x = px; this.y = py; this.vx = 0; this.vy = 0;
    this.climbing = false; this.dead = false; this.onGround = false; this.jumping = false;
    this.hurtT = 0; this.fireCd = 0; this.shootT = 0;
  },
  setCheckpoint(px, py) { this.spawnX = px; this.spawnY = py; },
  cx() { return this.x + this.w / 2; },
  cy() { return this.y + this.h / 2; },

  update(dt, level) {
    if (this.dead) {
      this.deathT -= dt;
      if (this.deathT <= 0) Game.onPlayerDeath();
      return;
    }
    if (this.invuln > 0) this.invuln -= dt;
    if (this.hurtT > 0) this.hurtT -= dt;
    if (this.fireCd > 0) this.fireCd -= dt;
    if (this.shootT > 0) this.shootT -= dt;
    if (this.waterCd > 0) this.waterCd -= dt;

    const dir = (Input.down("right") ? 1 : 0) - (Input.down("left") ? 1 : 0);
    const ctx_ = Math.floor(this.cx() / TILE);
    const ladderBody = level.isLadder(ctx_, Math.floor((this.y + this.h - 2) / TILE)) ||
                       level.isLadder(ctx_, Math.floor(this.cy() / TILE));
    const ladderBelow = level.isLadder(ctx_, Math.floor((this.y + this.h + 2) / TILE));

    // enter ladder
    if (!this.climbing && this.hurtT <= 0) {
      if ((Input.down("up") && ladderBody) || (Input.down("down") && this.onGround && ladderBelow)) {
        this.climbing = true; this.vx = 0; this.vy = 0;
        this.x = ctx_ * TILE + TILE / 2 - this.w / 2;
        if (!ladderBody) this.y += 3;   // step down into the ladder top
      }
    }

    if (this.climbing) {
      const v = (Input.down("down") ? 1 : 0) - (Input.down("up") ? 1 : 0);
      this.vy = v * CONFIG.climbSpeed; this.vx = 0;
      if (v) this.climbAnim += dt;
      if (dir) this.face = dir;          // Left/Right turn on the ladder (to shoot), without leaving it
      if (Input.pressed("jump")) {
        this.climbing = false;
        if (dir) { this.vy = CONFIG.jumpVel * 0.7; this.face = dir; this.jumping = true; Sound.play("jump"); }
      }
      const res = moveBody(this, dt, level, { platforms: false });
      const stillLadder = level.isLadder(ctx_, Math.floor((this.y + this.h - 1) / TILE)) ||
                          level.isLadder(ctx_, Math.floor(this.cy() / TILE));
      if (res.ground && v > 0) this.climbing = false;
      if (!stillLadder) {
        this.climbing = false;
        // reached the top: stand on the ladder top
        if (v < 0) {
          const ty = Math.floor((this.y + this.h) / TILE);
          if (level.isLadderTop(ctx_, ty)) this.y = ty * TILE - this.h;
          this.vy = 0;
        }
      }
      this.onGround = res.ground;
    } else {
      // horizontal
      const target = dir * CONFIG.runSpeed;
      const a = CONFIG.accel * dt * (this.onGround ? 1 : 0.7);
      if (this.hurtT <= 0) {
        if (this.vx < target) this.vx = Math.min(target, this.vx + a);
        else if (this.vx > target) this.vx = Math.max(target, this.vx - a);
        if (dir) this.face = dir;
      }
      // jump
      if (this.onGround) this.coyote = CONFIG.coyoteTime; else this.coyote -= dt;
      if (Input.pressed("jump") && this.coyote > 0 && this.hurtT <= 0) {
        this.vy = CONFIG.jumpVel; this.jumping = true; this.coyote = 0; this.onGround = false;
        Sound.play("jump");
      }
      if (this.jumping && !Input.down("jump") && this.vy < 0) { this.vy *= CONFIG.jumpCut; this.jumping = false; }
      if (this.vy >= 0) this.jumping = false;
      this.vy = Math.min(CONFIG.maxFall, this.vy + CONFIG.gravity * dt);
      const drop = Input.down("down") && !ladderBelow;
      const res = moveBody(this, dt, level, { platforms: true, dropThrough: drop && this.onGround });
      this.onGround = res.ground;
      if (res.wallTile) Game.touchTile(res.wallTile[0], res.wallTile[1]);
      if (res.ceilTile) Game.touchTile(res.ceilTile[0], res.ceilTile[1]);
      if (this.onGround) this.animT += dt * Math.abs(this.vx) / CONFIG.runSpeed;
    }

    // cigar smoke while standing around
    if (this.onGround && Math.abs(this.vx) < 10 && !this.climbing) {
      this.smokeT = (this.smokeT || 0) - dt;
      if (this.smokeT <= 0) {
        this.smokeT = 0.6;
        FX.parts.push({ x: this.face > 0 ? this.x + 9 : this.x + 1, y: this.y + 2,   // cigar ember (head 9,6) vx: rnd(-4, 4) + this.face * 3, vy: rnd(-16, -10),
          life: 1.4, max: 1.4, color: Math.random() < 0.5 ? "rgba(200,200,200,0.55)" : "rgba(160,160,160,0.45)", grav: -4, size: 2, smoke: true });
      }
    }

    // fire
    if (Input.down("fire") && this.fireCd <= 0) this.fire();     // also on ladders

    // water hazard
    const tx0 = Math.floor(this.x / TILE), tx1 = Math.floor((this.x + this.w - 1) / TILE);
    const tyw = Math.floor((this.y + this.h - 4) / TILE);
    for (let tx = tx0; tx <= tx1; tx++) {
      if (level.isWater(tx, tyw)) {
        if (this.waterCd <= 0) {
          FX.spark(this.cx(), this.y + this.h, level.waterPalette.splash, 12, 90, 0.5);
          this.waterCd = 0.4;
          this.hurt(CONFIG.waterDamage, true);
        }
        this.vy = CONFIG.jumpVel * 1.05; this.climbing = false;
        break;
      }
    }
    // fell out of the level
    if (this.y > level.pxH + 32) { this.hp = 0; this.die(); }
  },

  // A shot must not start beyond a wall: scan from Buck's centre to the far edge of the shot's
  // spawn box along its row. Returns true (and makes sparks at the wall) when one is in the way.
  muzzleBlocked(sx, w, cy) {
    const L = Game.level;
    if (!L) return false;
    const far = this.face > 0 ? sx + w : sx, ty = Math.floor(cy / TILE);
    for (let x = this.cx(); this.face > 0 ? x <= far : x >= far; x += this.face * 4) {
      const tx = Math.floor(x / TILE);
      if (L.isSolid(tx, ty)) {
        FX.spark(this.face > 0 ? tx * TILE : (tx + 1) * TILE, cy, "#ffe860", 6, 60, 0.25);
        Sound.play("deflect");
        return true;
      }
    }
    return false;
  },

  fire() {
    if (this.weapon === "cutter") { this.fireBlade(); return; }
    const up = this.weapon === "mega";
    this.fireCd = 1 / (up ? CONFIG.fireRateUp : CONFIG.fireRate);
    this.shootT = 0.15;
    const img = up ? SPR.shotUp : SPR.shot;
    const sx = this.face > 0 ? this.x + this.w + 9 : this.x - 9 - img.width;   // muzzle of the big gun
    Game.stats.shots++;
    Sound.play(up ? "shotUp" : "shot");
    if (this.muzzleBlocked(sx, img.width, this.y + 14)) return;     // pressed against a wall
    Game.shots.push({
      x: sx, y: this.y + 14 - Math.floor(img.height / 2), w: img.width, h: img.height,
      vx: this.face * CONFIG.shotSpeed * (up ? 1.2 : 1), dmg: up ? CONFIG.shotDmgUp : CONFIG.shotDmg, img: img, face: this.face,
    });
  },

  // Disc cutter (boss arena): a big spinning saw blade, slower than blaster shots. It spans
  // from gun height down to the knees, so it also cuts crayfish on the ground.
  fireBlade() {
    this.fireCd = 1 / CONFIG.cutterRate;
    this.shootT = 0.2;
    const sz = 14;
    const sx = this.face > 0 ? this.x + this.w + 6 : this.x - 6 - sz;
    Game.stats.shots++;
    Sound.play("grinder");
    if (this.muzzleBlocked(sx, sz, this.y + 12 + sz / 2)) return;
    Game.shots.push({ x: sx, y: this.y + 12, w: sz, h: sz, vx: this.face * CONFIG.cutterSpeed, dmg: CONFIG.cutterDmg,
      img: SPR.sawBlade[0], face: this.face, spin: true });
  },

  // n: damage points. fromWater: no knockback (the water bounce handles movement).
  hurt(n, fromWater) {
    if (this.dead || Game.godMode || this.invuln > 0) return false;
    this.hp = Math.max(0, this.hp - n);
    this.invuln = CONFIG.invuln;
    this.hurtT = 0.3;
    this.climbing = false;
    if (!fromWater) { this.vx = -this.face * 80; this.vy = -150; }
    Sound.play("hurt");
    Game.hurtFlash = 0.25;            // red screen-edge flash
    FX.blood(this.cx(), this.cy(), -this.face, 5);
    FX.shake(2, 0.15);
    if (this.hp <= 0) this.die();
    return true;
  },

  heal(n) { this.hp = Math.min(CONFIG.maxHp, this.hp + n); },

  die() {
    if (this.dead) return;
    this.dead = true; this.deathT = 1.3;
    FX.explode(this.cx(), this.cy(), true);
    FX.spark(this.cx(), this.cy(), "#e8a880", 20, 120, 1.0);
    Sound.play("die");
  },

  respawn() {
    this.placeAt(this.spawnX, this.spawnY);
    this.hp = CONFIG.maxHp;
    // power-up is lost with the life; in the boss arena the disc cutter is kept
    this.weapon = Game.level && Game.level.isBoss ? "cutter" : "blaster";
    this.invuln = 1.5;
  },

  draw(camX, camY) {
    if (this.dead) return;
    if (this.invuln > 0 && Math.floor(this.invuln * 15) % 2 === 0) return;   // blink
    const cutter = this.weapon === "cutter";
    const S = cutter ? SPR.heroCutter : SPR.hero;
    let set;
    if (this.hurtT > 0) set = S.hurt;
    else if (this.climbing) set = this.shootT > 0 ? S.shoot : S.climb[Math.floor(this.climbAnim * 8) % 2];   // shooting pose on a ladder
    else if (!this.onGround) set = this.shootT > 0 ? S.shootJump : S.jump;
    else if (Math.abs(this.vx) > 10) set = (this.shootT > 0 ? S.shootRun : S.run)[Math.floor(this.animT * 10) % 4];
    else set = this.shootT > 0 ? S.shoot : S.idle;
    const climbView = this.climbing && this.shootT <= 0;   // back view while climbing
    const right = this.face > 0 || climbView;
    const img = right ? set.r : set.l;
    // torso centre is column 8 of the frame (HERO_W - 9 when mirrored)
    const ox = right ? 8 : HERO_W - 9;
    const px = Math.round(this.x + this.w / 2 - ox - camX);
    const py = Math.round(this.y + this.h - HERO_H - camY + HUD_H);
    ctx.drawImage(img, px - set.pad, py - set.pad);
    if (cutter && this.shootT > 0.05) {   // grinder sparks off the disc
      const dx = right ? px + 20 : px + HERO_W - 21;
      for (let i = 0; i < 4; i++) fillRect(dx + (right ? 1 : -1) * (2 + ((Game.time * 97 + i * 3) % 5 | 0)), py + 14 + i * 2, 1, 1, i % 2 ? "#ffd040" : "#fff4a0");
    } else if (this.shootT > 0.1) {   // muzzle flash
      const mx = right ? px + HERO_W : px - 7;
      fillRect(mx, py + 15, 7, 7, "rgba(255,150,30,0.55)");
      fillRect(mx + 1, py + 16, 5, 5, "rgba(255,210,80,0.85)");
      fillRect(mx + (right ? 1 : 2), py + 17, 4, 3, "#fffbe0");
      fillRect(mx + (right ? 6 : -1), py + 18, 2, 1, "#ffffff");
    }
  },
};
