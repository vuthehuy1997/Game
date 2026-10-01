'use strict';
// Thế giới: khởi tạo ải, đợt địch, bẫy môi trường, đạn, vật phẩm, vò/thùng, hiệu ứng, camera.
// Mọi thứ trên mặt đất đều có gy = mặt đất của làn nó đang đứng.

function spark(x, y, n, col, spd = 300) {
  for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), v = rand(.3, 1) * spd; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(.2, .45), max: .45, col, size: rand(2, 4), kind: 'spark' }); }
}
function dust(x, y, n = 6) { for (let i = 0; i < n; i++) parts.push({ x: x + rand(-14, 14), y, vx: rand(-80, 80), vy: rand(-80, -20), life: rand(.3, .6), max: .6, col: 'rgba(210,190,160,.7)', size: rand(4, 8), kind: 'dust' }); }
function floatText(x, y, txt, col = '#fff', size = 22) { texts.push({ x, y, txt, col, size, life: .9, vy: -70 }); }
function dropItem(kind, x, gy, val = 0) {
  items.push(kind === 'coin'
    ? { kind, val, x, gy, y: gy - 40, vx: rand(-160, 160), vy: rand(-520, -300), t: 0 }
    : { kind, x, gy, y: gy - 40, vx: rand(-60, 60), vy: -420, t: 0 });
}

// cp: điểm lưu trước boss (xem updateWaves). Có cp thì vào thẳng đợt boss, giữ thời gian và số lần trúng đòn.
// i: thứ tự ải, hoặc một võ đài tạo bằng makeArena (khi đó G.stage = -1)
function resetWorld(i, cp) {
  const st = typeof i === 'object' ? i : STAGES[i];
  if (st.arena) i = -1;
  G.stage = i; G.st = st; G.tier = st.tier ?? i; G.camX = 0; G.lock = false; G.lockX = 0; G.wave = 0; G.queue = []; G.spawnT = 0; G.boss = null;
  G.coinsAtStart = S.coins; G.clearT = 0; G.overT = 0; G.ultT = 0; G.banner = null; G.goBlink = 0; G.result = null;
  G.surviveT = 0; G.hazT = 2; G.tideOut = false; G.time = 0; G.hits = 0; G.lightning = 0;
  G.cp = null; G.cpUsed = false; G.combo = 0; G.comboT = 0; G.maxCombo = 0; G.minDiff = CFG.diff; G.coinFrac = 0; G.stakes = [];
  P = newPlayer(); enemies = []; projs = []; parts = []; texts = []; items = [];
  props = [];
  if (cp) {
    G.cp = cp; G.cpUsed = true; G.wave = cp.wave; G.time = cp.time; G.hits = cp.hits; G.coinsAtStart = cp.coins0;
    G.maxCombo = cp.maxCombo; G.minDiff = Math.min(cp.minDiff, CFG.diff);
    P.x = st.waves[cp.wave].at - 120; G.camX = clamp(P.x - W * .4, 0, st.len - W);
  }
  ally = st.ally ? makeAlly(st.ally) : null;
  // rải vò, thùng dọc đường (tránh khu boss), mỗi cái một làn ngẫu nhiên
  let x = 320;
  while (!cp && x < st.len - 800) { const lane = (Math.random() * 3) | 0; props.push({ kind: pick(st.props || ['crate']), x, lane, gy: LANES[lane], shake: 0 }); x += rand(230, 420); }
}

/* ---------------- Vò / thùng ---------------- */
function hitProps(hb, gy) {
  props.forEach(p => { if (!p.dead && Math.abs(p.gy - gy) < 24 && overlap(hb, { x: p.x - 20, y: p.gy - 48, w: 40, h: 48 })) breakProp(p); });
}
function breakProp(p) {
  if (p.dead || p.x < G.camX - 40 || p.x > G.camX + W + 40) return;
  p.dead = true; SFX.crack(); G.shake = Math.max(G.shake, 3);
  for (let i = 0; i < 10; i++) parts.push({ x: p.x + rand(-16, 16), y: p.gy - rand(10, 40), vx: rand(-220, 220), vy: rand(-420, -120), life: .7, max: .7, col: p.kind === 'jar' ? '#8a5a34' : '#9a6a3a', size: rand(3, 6), kind: 'spark' });
  const n = 2 + (Math.random() * 3 | 0);
  for (let i = 0; i < n; i++) dropItem('coin', p.x, p.gy, 2);
  if (Math.random() < .3) dropItem('banh', p.x, p.gy);
}

/* ---------------- Đợt địch ---------------- */
function updateWaves(dt) {
  const st = G.st;
  if (st.gen && G.wave >= st.waves.length) st.waves.push(st.gen(G.wave));
  if (!G.lock && G.wave < st.waves.length && P.x > st.waves[G.wave].at) {
    const wv = st.waves[G.wave];
    G.lock = true; G.lockX = clamp(wv.at - W * .45, 0, st.len - W);
    G.queue = wv.list ? wv.list.slice() : []; G.spawnT = st.arena && G.wave ? 1.6 : .3; G.side = 1;
    if (wv.tier != null) G.tier = wv.tier;
    G.surviveT = wv.survive || 0; G.hazT = 2;
    if (wv.label) banner(wv.label, wv.sub, 2.4);
    // điểm lưu trước boss: thua ở đây thì "Tái chiến" vào thẳng đợt này
    if (wv.boss && !G.cp && !st.arena) G.cp = { wave: G.wave, time: G.time, hits: G.hits, maxCombo: G.maxCombo, minDiff: G.minDiff, coins: S.coins, coins0: G.coinsAtStart };
    if (wv.boss && st.bossTalk && !G.cpUsed) {
      G.camX = G.lockX; P.x = clamp(P.x, G.camX + 24, G.camX + W - 24);
      if (ally) ally.x = clamp(P.x - 70, G.camX + 20, G.camX + W - 20);
      runDialog(st.bossTalk, resumePlay);
      return;
    }
  }
  if (!G.lock) return;
  const wv = st.waves[G.wave], camReady = Math.abs(G.camX - G.lockX) < 40;
  G.spawnT -= dt;
  if (G.surviveT > 0) {
    G.surviveT -= dt;
    if (G.spawnT <= 0 && camReady && enemies.filter(alive).length < wv.max) { spawnEnemy(pick(wv.pool), G.side); G.side = -G.side; G.spawnT = 1.1; }
    if (G.surviveT <= 0) { G.surviveT = 0; banner('Giữ vững!', 'Dẹp nốt quân giặc còn lại', 2); SFX.gong(); }
  } else if (G.queue.length && G.spawnT <= 0 && camReady) {
    const t = G.queue.shift(); spawnEnemy(t, EDEF[t.split(':')[0]].boss ? 1 : G.side); G.side = -G.side; G.spawnT = .55;
  }
  if (G.surviveT <= 0 && !G.queue.length && !enemies.some(alive)) {
    G.lock = false; G.wave++;
    if (st.arena) arenaWaveDone();
    else if (wv.boss) stageCleared();
    else { G.goBlink = 3; SFX.coin(); }
  }
}

/* ---------------- Bãi cọc Bạch Đằng ----------------
   Nước ròng (Ô Mã Nhi dưới nửa máu) thì 4 bãi cọc nhô lên trong khu giao chiến. Giặc lao qua hoặc bị hất văng vào bãi
   cọc cùng làn thì mắc cọc. Cọc là của quân ta: Tiểu Hổ và đồng đội đi qua không sao. */
function raiseStakes() {
  G.stakes = [[170, 1], [390, 0], [590, 2], [800, 1]].map(([dx, lane]) => ({ x: G.lockX + dx, lane, gy: LANES[lane], up: 0, dead: false }));
}
function updateStakes(dt) {
  for (const s of G.stakes) {
    s.up = Math.min(1, s.up + dt * 1.5);
    if (s.dead || s.up < 1) continue;
    for (const e of enemies) {
      if (s.dead || !alive(e) || Math.abs(e.gy - s.gy) > 24 || Math.abs(e.x - s.x) > 36 || e.y < e.gy - 40 || e.stakeT > G.time) continue;
      const thrown = (e.state === 'hurt' || e.state === 'down') && Math.abs(e.vx) > 120;
      if (!thrown && !['charge', 'fury', 'lunge'].includes(e.state)) continue;
      const dir = Math.sign(e.vx) || 1;
      e.stakeT = G.time + 1; e.flash = .15; e.vx = 0;
      floatText(e.x, e.y - 150 * (e.sc || 1), 'Mắc cọc!', '#ffd35a', e.d.boss ? 30 : 20);
      spark(e.x, e.gy - 30, 14, '#d9c7a0', 380); SFX.crack(); SFX.heavy(); G.shake = Math.max(G.shake, e.d.boss ? 12 : 5);
      if (e.d.boss) {   // tướng giặc: mất 8% máu, choáng, bãi cọc đó gãy
        s.dead = true; e.hp -= e.maxHp * .08; G.hitstop = .12;
        if (e.hp <= 0) killEnemy(e, dir); else { e.state = 'hurt'; e.st = 1.5; e.stag = 0; }
      } else {
        e.hp -= 30;
        if (e.hp <= 0) killEnemy(e, dir); else { e.state = 'down'; e.st = .8; }
      }
    }
  }
}

/* ---------------- Bẫy môi trường (rơi vào làn của Tiểu Hổ) ---------------- */
function updateHazards(dt) {
  const hz = G.st.hazard;
  if (!hz || !G.lock || G.mode !== 'play' || !enemies.some(alive)) return;
  G.hazT -= dt; if (G.hazT > 0) return;
  G.hazT = rand(hz.every[0], hz.every[1]);
  const x = clamp(P.x + rand(-70, 70), G.camX + 30, G.camX + W - 30), gy = LANES[P.lane];
  if (hz.kind === 'debris') projs.push({ kind: 'rain', style: 'beam', from: 'e', x, y: -40, gy, vx: 0, vy: 0, delay: .9, dmg: 12, life: 4 });
  else if (hz.kind === 'firerain') for (let i = 0; i < 3; i++) projs.push({ kind: 'rain', style: 'fire', from: 'e', x: clamp(x + (i - 1) * 90, G.camX + 20, G.camX + W - 20), y: -30, gy: LANES[clamp(P.lane + i - 1, 0, 2)], vx: 0, vy: 0, delay: .8 + i * .12, dmg: 9, life: 4 });
  else if (hz.kind === 'bolt') projs.push({ kind: 'bolt', from: 'e', x, y: gy, gy, delay: 1, dmg: 16, life: 1.5, struck: false });
}

/* ---------------- Đạn và vùng sát thương ---------------- */
function updateProjs(dt) {
  for (const q of projs) {
    q.life -= dt; if (q.life <= 0) q.dead = true;
    if (q.kind === 'rain') {
      if (q.delay > 0) { q.delay -= dt; if (q.delay <= 0) { q.y = -20; q.vy = q.style === 'beam' ? 1000 : 900; } continue; }
      q.y += q.vy * dt;
      if (q.y >= q.gy) {
        q.dead = true; dust(q.x, q.gy, q.style === 'beam' ? 8 : 2);
        if (q.style === 'beam') { SFX.crack(); spark(q.x, q.gy - 10, 8, '#ffb347'); }
        if (q.style === 'fire') projs.push({ kind: 'fire', from: 'e', x: q.x, y: q.gy, gy: q.gy, life: 1.4, dmg: 5 });
      }
      const w = q.style === 'beam' ? 24 : 12;
      if (sameLane(q, P) && overlap({ x: q.x - w / 2, y: q.y - 30, w, h: 30 }, hurtbox(P))) { q.dead = true; hurtPlayer(q.dmg, 0); }
      continue;
    }
    if (q.kind === 'bolt') {
      if (q.delay > 0) {
        q.delay -= dt;
        if (q.delay <= 0) { q.struck = true; q.life = .3; G.lightning = .3; SFX.thunder(); G.shake = Math.max(G.shake, 6); if (sameLane(q, P) && Math.abs(P.x - q.x) < 30) hurtPlayer(q.dmg, 0); spark(q.x, q.gy - 5, 14, '#dfe8ff', 400); }
      }
      continue;
    }
    if (q.kind === 'fire') {
      if (Math.random() < .5) parts.push({ x: q.x + rand(-22, 22), y: q.gy - rand(0, 10), vx: rand(-10, 10), vy: rand(-90, -40), life: .5, max: .5, col: pick(['#ff7a2f', '#ffc44a']), size: rand(3, 6), kind: 'dust' });
      if (sameLane(q, P) && P.y > P.gy - 30 && Math.abs(P.x - q.x) < 30) hurtPlayer(q.dmg, 0);
      continue;
    }
    q.x += q.vx * dt; q.y += q.vy * dt;
    if (q.kind === 'arrow') {
      q.vy += 120 * dt;
      if (sameLane(q, P) && overlap({ x: q.x - 10, y: q.y - 4, w: 20, h: 8 }, hurtbox(P))) { q.dead = true; hurtPlayer(q.dmg, Math.sign(q.vx), { poison: q.poison }); }
      if (q.y > q.gy) q.dead = true;
    } else if (q.kind === 'pot') {
      q.t += dt; q.vy += GRAV * dt;
      const hitP = sameLane(q, P) && overlap({ x: q.x - 9, y: q.y - 9, w: 18, h: 18 }, hurtbox(P));
      if ((q.vy > 0 && q.y >= q.gy - 6) || hitP) {
        q.dead = true; SFX.boom(); spark(q.x, Math.min(q.y, q.gy - 6), 12, '#ffb347', 260);
        projs.push({ kind: 'fire', from: 'e', x: q.x, y: q.gy, gy: q.gy, life: 2.4, dmg: 6 });
        if (hitP) hurtPlayer(q.dmg, Math.sign(q.vx));
      }
    } else if (q.kind === 'wave') {
      if (sameLane(q, P) && P.y > P.gy - 34 && Math.abs(P.x - q.x) < 30) { q.dead = true; hurtPlayer(q.dmg, Math.sign(q.vx)); }
      if (Math.random() < .5) dust(q.x, q.gy, 1);
    } else if (q.kind === 'tide') {
      // sóng triều phủ cả 3 làn: chỉ nhảy hoặc lướt mới né được
      if (P.y > P.gy - 64 && Math.abs(P.x - q.x) < 60) hurtPlayer(q.dmg, Math.sign(q.vx));
      if (Math.random() < .8) parts.push({ x: q.x + rand(-50, 50), y: rand(LANES[0] - 80, LANES[2]), vx: q.vx * .3, vy: rand(-160, -60), life: .5, max: .5, col: 'rgba(200,230,255,.8)', size: rand(3, 6), kind: 'spark' });
      if (q.vx > 0 ? q.x > G.camX + W + 120 : q.x < G.camX - 120) q.dead = true;
      continue;
    } else if (q.kind === 'chuong') {
      q.t += dt;
      const hb = { x: q.x - 34, y: q.y - 38, w: 68, h: 76 };
      enemies.forEach(e => { if (!q.hit.has(e.id) && sameLane(e, q) && overlap(hb, hurtbox(e)) && damageEnemy(e, q.dmg, Math.sign(q.vx), 360, true)) q.hit.add(e.id); });
      hitProps(hb, q.gy);
      projs.forEach(o => { if ((o.kind === 'arrow' || o.kind === 'pot') && sameLane(o, q) && Math.abs(o.x - q.x) < 36 && Math.abs(o.y - q.y) < 40) o.dead = true; });
      if (Math.random() < .9) parts.push({ x: q.x + rand(-20, 20), y: q.y + rand(-26, 26), vx: -q.vx * .1, vy: rand(-30, 30), life: .35, max: .35, col: 'rgba(143,214,255,.8)', size: rand(3, 6), kind: 'dust' });
    }
    if (q.x < G.camX - 140 || q.x > G.camX + W + 140) q.dead = true;
  }
  projs = projs.filter(q => !q.dead);
}

/* ---------------- Vật phẩm ---------------- */
function updateItems(dt) {
  for (const it of items) {
    it.t += dt; it.vy += GRAV * dt; it.x += it.vx * dt; it.y += it.vy * dt;
    if (it.y >= it.gy - 8) { it.y = it.gy - 8; it.vy = -it.vy * .35; it.vx *= .7; if (Math.abs(it.vy) < 40) it.vy = 0; }
    const dx = P.x - it.x;
    if (it.t > .5 && P.state !== 'dead') {
      // tiền tự hút về phía Tiểu Hổ, kể cả khác làn
      if (it.kind === 'coin' && Math.abs(dx) < 130) { it.x += dx * dt * 6; const dg = (P.gy - it.gy) * dt * 6; it.gy += dg; if (!it.vy) it.y += dg; }
      if (Math.abs(dx) < 30 && Math.abs(it.gy - P.gy) < 26 && P.y > P.gy - 80) {
        it.dead = true;
        if (it.kind === 'coin') { const v = it.val * (ms('coin') ? 1.2 : 1) + G.coinFrac, n = Math.floor(v + 1e-9); S.coins += n; G.coinFrac = v - n; SFX.coin(); }
        else { const h = Math.round(P.maxHp * .3); P.hp = Math.min(P.maxHp, P.hp + h); P.poison = 0; floatText(P.x, P.y - 120, '+' + h + ' Bánh chưng', '#8fe07a', 18); SFX.heal(); }
      }
    }
    if (it.t > 14) it.dead = true;
  }
  items = items.filter(i => !i.dead);
}

/* ---------------- Hiệu ứng ---------------- */
function updateFx(dt) {
  for (const p of parts) {
    p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.kind === 'spark') { p.vx *= .9; p.vy = p.vy * .9 + 400 * dt; }
    else if (p.kind === 'leaf') p.vx += Math.sin(G.t * 2 + p.size) * 20 * dt;
    else if (p.kind === 'firefly') { p.vx += rand(-40, 40) * dt; p.vy += rand(-40, 40) * dt; }
    else if (p.kind === 'dust') { p.vx *= .92; p.vy *= .92; }
  }
  parts = parts.filter(p => p.life > 0);
  for (const t of texts) { t.life -= dt; t.y += t.vy * dt; t.vy *= .95; }
  texts = texts.filter(t => t.life > 0);
  for (const p of props) p.shake = Math.max(0, p.shake - dt);
  props = props.filter(p => !p.dead);

  const th = G.st.bg;
  if (th === 'village' && Math.random() < dt * 3) parts.push({ kind: 'leaf', x: G.camX + rand(0, W + 200), y: -10, vx: rand(-60, -20), vy: rand(40, 80), life: 8, max: 8, col: pick(['#e79aa8', '#f3c4cc', '#8fbf5a']), size: rand(3, 5) });
  if (th === 'citadel' && Math.random() < dt * 10) parts.push({ kind: 'ember', x: G.camX + rand(0, W), y: H, vx: rand(-20, 20), vy: rand(-120, -50), life: 4, max: 4, col: pick(['#ffb347', '#ff7a2f', '#ffd35a']), size: rand(1.5, 3) });
  if ((th === 'forest' || th === 'dongbodau') && Math.random() < dt * (th === 'forest' ? 4 : 1.5)) parts.push({ kind: 'firefly', x: G.camX + rand(0, W), y: rand(150, GT + 40), vx: rand(-20, 20), vy: rand(-20, 20), life: 5, max: 5, col: '#d9f27a', size: 2.2 });
  if (th === 'sea' && Math.random() < dt * 4) parts.push({ kind: 'ember', x: G.camX + rand(0, W), y: GT - 30, vx: rand(-30, 30), vy: rand(-90, -40), life: 3, max: 3, col: pick(['#ffb347', '#ff7a2f']), size: rand(1.5, 2.5) });
  if (th === 'bachdang') { G.lightning -= dt; if (Math.random() < dt * .1) G.lightning = .22; }
}

function updateCamera(dt) {
  const target = clamp(G.lock ? G.lockX : P.x - W * .4, 0, G.st.len - W);
  G.camX += (target - G.camX) * Math.min(1, dt * (G.lock ? 5 : 8));
}
