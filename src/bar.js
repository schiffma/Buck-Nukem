// Clubhouse bar scene (decoration only, like the fans): regulars on stools at the counter (map
// character O) lift their beers and now and then clink glasses with a "PROST!" bubble; the
// blonde waitress (W) works behind the counter - the counter tiles hide her from the waist
// down - walking between the taps and pulling beers. W sits in the cell above the counter (so
// the counter tile stays whole); she stands on the counter row's floor. Nothing collides.
const BAR_GUY_H = 24, WAITRESS_H = 30;
const BAR_PROST_GAP = 6, BAR_PROST_T = 1.5, BAR_CLINK_T = 0.6, BAR_DRINK_T = 0.8;
const BAR_WAITRESS_SPEED = 14, BAR_POUR_T = 2;
const BAR_STEP = 8;            // she stands on a raised step behind the bar: visible from the chest up

const Bar = {
  guys: [], waitress: null, bubble: null, prostCd: 0, prostCheck: 0, time: 0,

  spawn(level) {
    this.guys = []; this.waitress = null; this.bubble = null; this.prostCd = 3; this.prostCheck = 0; this.time = 0;
    const self = this;
    const ws = level.spawns.filter(function (s) { return s.ch === "W"; })[0];
    let cx0 = null, cx1 = null;
    if (ws) {                                   // the counter's columns below the waitress's cell
      const row = ws.ty + 1;
      const isCounter = function (tx) { const c = level.at(tx, row); return c === "a" || c === "A"; };
      cx0 = ws.tx; cx1 = ws.tx;
      while (isCounter(cx0 - 1)) cx0--;
      while (isCounter(cx1 + 1)) cx1++;
      this.waitress = { x: ws.tx * TILE, y: (row + 1) * TILE - WAITRESS_H - BAR_STEP, minX: cx0 * TILE, maxX: cx1 * TILE, face: 1,
        pourT: 0, nextPour: rnd(4, 8), counterTop: row * TILE };
    }
    const mid = cx0 !== null ? (cx0 + cx1 + 1) * TILE / 2 : null;
    level.spawns.filter(function (s) { return s.ch === "O"; }).forEach(function (s, i) {
      const x = s.tx * TILE;
      self.guys.push({ x: x, y: (s.ty + 1) * TILE - BAR_GUY_H, look: i % SPR.barGuys.length,
        face: mid === null || mid > x + TILE / 2 ? 1 : -1, t: rnd(1, 4), drinkT: 0, clinkT: 0 });
    });
    return this;
  },

  frame(g) { return g.clinkT > 0 ? "clink" : g.drinkT > 0 ? "drink" : "idle"; },

  update(dt) {
    this.time += dt;
    for (const g of this.guys) {
      if (g.clinkT > 0) g.clinkT -= dt;
      if (g.drinkT > 0) g.drinkT -= dt;
      else if ((g.t -= dt) <= 0) { g.drinkT = BAR_DRINK_T; g.t = rnd(3, 6); }
    }
    // PROST: two neighbouring regulars clink glasses, at most once per BAR_PROST_GAP s
    if (this.bubble && (this.bubble.t -= dt) <= 0) this.bubble = null;
    if (this.prostCd > 0) this.prostCd -= dt;
    else if (this.guys.length >= 2 && (this.prostCheck -= dt) <= 0) {
      this.prostCheck = 0.5;
      if (Math.random() < 0.25) {
        const i = Math.floor(Math.random() * (this.guys.length - 1));
        this.guys[i].clinkT = BAR_CLINK_T; this.guys[i + 1].clinkT = BAR_CLINK_T;
        this.bubble = { text: "PROST!", t: BAR_PROST_T, guy: i };
        this.prostCd = BAR_PROST_GAP;
      }
    }
    const w = this.waitress;
    if (w) {
      if (w.pourT > 0) w.pourT -= dt;
      else {
        w.x += w.face * BAR_WAITRESS_SPEED * dt;
        if (w.x <= w.minX) { w.x = w.minX; w.face = 1; }
        if (w.x >= w.maxX) { w.x = w.maxX; w.face = -1; }
        if ((w.nextPour -= dt) <= 0) { w.pourT = BAR_POUR_T; w.nextPour = rnd(4, 8); }
      }
    }
  },

  // the waitress, before the main tiles: the counter in front hides her below the waist
  drawBack(camX, camY) {
    const w = this.waitress;
    if (!w) return;
    const set = w.pourT > 0 ? SPR.waitress.pour : SPR.waitress.walk[Math.floor(this.time * 6) % 2];
    const px = Math.round(w.x - camX), py = Math.round(w.y - camY + HUD_H);
    if (px < -TILE * 2 || px > W + TILE) return;
    ctx.drawImage(w.face > 0 ? set.r : set.l, px - set.pad, py - set.pad);
  },

  // the regulars and the glass she is filling, in front of the counter
  drawFront(camX, camY) {
    for (const g of this.guys) {
      const set = SPR.barGuys[g.look][this.frame(g)];
      const px = Math.round(g.x - camX), py = Math.round(g.y - camY + HUD_H);
      if (px < -TILE * 2 || px > W + TILE) continue;
      ctx.drawImage(g.face > 0 ? set.r : set.l, px - set.pad, py - set.pad);
    }
    const w = this.waitress;
    if (w && w.pourT > 0) {
      const f = Math.min(2, Math.floor((BAR_POUR_T - w.pourT) / (BAR_POUR_T / 3)));
      const set = SPR.beerGlass[f];
      const gx = Math.round(w.x + (w.face > 0 ? 12 : 0) - camX), gy = Math.round(w.counterTop - 6 - camY + HUD_H);
      ctx.drawImage(set.r, gx - set.pad, gy - set.pad);
    }
  },

  drawBubble(camX, camY) {
    const b = this.bubble;
    if (!b || !this.guys[b.guy]) return;
    const g = this.guys[b.guy], w = textWidth(b.text) + 6, h = 11;
    const cx = Math.round(g.x + TILE / 2 - camX), top = Math.round(g.y - camY + HUD_H) - h - 3;
    if (cx < -40 || cx > W + 40) return;
    drawSpeechBubble(b.text, clamp(cx - Math.floor(w / 2), 2, W - w - 2), Math.max(HUD_H + 2, top), w, h, cx);
  },
};
