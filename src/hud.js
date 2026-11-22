// 16px status bar: score, segmented health, lives, weapon, key cards; boss bar in the arena.
function drawHud() {
  fillRect(0, 0, W, HUD_H, "#14141c");
  fillRect(0, HUD_H - 1, W, 1, "#4a4a5a");
  // score
  drawText(String(Game.score).padStart(7, "0"), 4, 5, "#ffe860");
  // health
  drawText("HP", 52, 5, "#ff8080");
  for (let i = 0; i < CONFIG.maxHp; i++) {
    const on = i < Player.hp;
    fillRect(66 + i * 6, 4, 5, 9, on ? (Player.hp <= 2 ? "#ff3030" : "#30d040") : "#3a2228");
    if (on) fillRect(66 + i * 6, 4, 5, 2, "rgba(255,255,255,0.35)");
  }
  // lives: hero head icon
  drawHead(ctx, 120, 0);
  drawText("X" + Math.max(0, Player.lives), 137, 5, "#ffffff");
  // weapon
  const mega = Player.weapon === "mega", cutter = Player.weapon === "cutter", megaCut = Player.weapon === "megacutter";
  ctx.drawImage(megaCut ? SPR.megaCutterIcon : cutter ? SPR.cutterIcon : mega ? SPR.megaIcon : SPR.blasterIcon, 158, 5);
  drawText(megaCut ? "MEGA CUTTER" : cutter ? "DISC CUTTER" : mega ? "MEGA" : "BLASTER", 171, 5,
    megaCut ? "#ffb040" : cutter ? "#ff9a30" : mega ? "#60c0ff" : "#c0c4cc");
  // keys
  let kx = cutter || megaCut ? 240 : 222;            // "DISC CUTTER" / "MEGA CUTTER" are longer labels
  ["R", "U", "G"].forEach(function (k) {
    if (Player.keys[k]) ctx.drawImage(SPR.keysHud[k], kx, 4);
    else { ctx.strokeStyle = "#33333d"; ctx.strokeRect(kx + 0.5, 4.5, 9, 7); }
    kx += 12;
  });
  // level number
  drawText("L" + (Game.levelIndex + 1), W - 4, 5, "#8890a0", { align: "right" });

  if (Game.boss && Game.boss.active) {
    const b = Game.boss;
    const w = 160, x = (W - w) / 2, y = HUD_H + 4;
    fillRect(x - 1, y - 1, w + 2, 8, "#000");
    fillRect(x, y, w, 6, "#401010");
    fillRect(x, y, Math.round(w * Math.max(0, b.hp) / b.maxHp), 6, b.enraged() ? "#ff4020" : "#e08020");
    drawText("GIANT MUTANT CRAYFISH", W / 2, y + 9, "#ffd0a0", { align: "center", shadow: "#000" });
  }
}
