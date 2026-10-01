'use strict';
// Vòng lặp chính: cập nhật theo chế độ game rồi vẽ.

function update(dt) {
  G.t += dt;
  if (G.banner) { G.banner.t += dt; if (G.banner.t > G.banner.dur) G.banner = null; }
  G.flashT = Math.max(0, G.flashT - dt);
  G.shake = Math.max(0, G.shake - dt * 40);
  updateDialog(dt);
  if (G.mode === 'title') {
    G.camX = (G.t * 30) % (G.st.len - W); P.x = G.camX + 300; P.t += dt; P.state = 'run'; P.walk += dt * 9;
    updateFx(dt); return;
  }
  if (G.mode !== 'play' && G.mode !== 'clear') return;
  if (G.hitstop > 0) { G.hitstop -= dt; return; }
  if (G.slow > 0) { G.slow -= dt; dt *= .35; }
  if (G.mode === 'play') {
    G.time += dt; G.minDiff = Math.min(G.minDiff, CFG.diff);
    if (G.comboT > 0) { G.comboT -= dt; if (G.comboT <= 0) G.combo = 0; }
  }
  G.goBlink = Math.max(0, G.goBlink - dt);
  if (G.ultT > 0) G.ultT -= dt;
  updatePlayer(dt);
  if (G.mode === 'play') { updateWaves(dt); updateHazards(dt); }
  if (G.mode !== 'play' && G.mode !== 'clear') return; // hội thoại boss vừa mở
  if (ally) updateAlly(ally, dt);
  enemies.forEach(e => updateEnemy(e, dt));
  updateStakes(dt);
  enemies = enemies.filter(e => !e.remove);
  if (G.boss && G.boss.remove) G.boss = null;
  updateProjs(dt); updateItems(dt); updateFx(dt); updateCamera(dt);
  if (G.overT > 0 && P.state === 'dead') { G.overT -= dt; if (G.overT <= 0) gameOver(); }
  if (G.mode === 'clear') { G.clearT -= dt; if (G.clearT <= 0) { G.mode = 'story'; afterClear(); } }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(.033, (now - last) / 1000); last = now;
  try { update(dt); render(); } catch (err) { console.error(err); }
  pressed.clear();
  requestAnimationFrame(frame);
}

toTitle();
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => drawPortrait($('portrait'), 'hero'));
requestAnimationFrame(frame);
