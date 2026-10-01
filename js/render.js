'use strict';
// Vẽ khung hình: tư thế nhân vật, đạn, hiệu ứng, HUD và băng rôn.

function poseP(p) {
  const P2 = { face: p.face, t: p.t, poison: p.poison > 0, alpha: p.inv > 0 && p.state !== 'dash' && p.state !== 'ult' ? (Math.sin(p.t * 40) > 0 ? 1 : .45) : 1 };
  const w = p.walk;
  switch (p.state) {
    case 'idle': Object.assign(P2, { bob: Math.sin(p.t * 4) * 1.5, armF: .3 + Math.sin(p.t * 4) * .05, armB: -.3, blink: (p.t % 3.2) < .12 }); break;
    case 'run': Object.assign(P2, { legF: Math.sin(w) * .8, legB: -Math.sin(w) * .8, armF: -Math.sin(w) * .8, armB: Math.sin(w) * .8, bob: Math.abs(Math.sin(w)) * 4, lean: .08 }); break;
    case 'air': Object.assign(P2, { legF: .7, legB: -.2, armF: 2.3, armB: -2.1 }); break;
    case 'attack': {
      const a = ATK[p.combo], act = p.st >= a.a0 * .6;
      if (p.combo === 1) Object.assign(P2, { armF: act ? Math.PI / 2 : -.4, armB: -.5, lean: act ? .12 : -.05, legF: .3, legB: -.3 });
      else if (p.combo === 2) Object.assign(P2, { legF: act ? 1.65 : .4, legB: -.2, armF: -.6, armB: .8, lean: act ? -.2 : 0 });
      else Object.assign(P2, { armF: act ? Math.PI / 2 : -1, armB: act ? Math.PI / 2 - .25 : -1.2, lean: act ? .22 : -.12, legF: .5, legB: -.5, shout: act });
      break;
    }
    case 'airkick': Object.assign(P2, { legF: 1.4, legB: -.1, armF: -.8, armB: -1.4, lean: -.3 }); break;
    case 'land': Object.assign(P2, { legF: .5, legB: -.5, bob: -4 }); break;
    case 'cast': Object.assign(P2, { armF: p.st > .1 ? Math.PI / 2 : .2, armB: p.st > .1 ? Math.PI / 2 - .2 : -.3, lean: p.st > .1 ? .15 : -.1, legF: .4, legB: -.4, shout: p.st > .1 }); break;
    case 'dash': Object.assign(P2, { lean: .45, legF: .9, legB: -.9, armF: -1.2, armB: -1.5 }); break;
    case 'hurt': Object.assign(P2, { lean: -.3, armF: 2.4, armB: -2.4, hurtFace: 1 }); break;
    case 'ult': Object.assign(P2, { armF: Math.PI - .2, armB: -Math.PI + .2, shout: true, bob: Math.min(20, p.st * 40) }); break;
    case 'dead': Object.assign(P2, { down: Math.min(1, p.st * 3), hurtFace: 1 }); break;
    case 'spin': { const k = p.st * 26; Object.assign(P2, { face: Math.sin(k) > 0 ? 1 : -1, legF: 1.5, legB: -.3, armF: 1.9, armB: -1.9, bob: 6 }); break; }
    case 'rush': Object.assign(P2, { lean: .55, armF: Math.PI / 2, armB: Math.PI / 2 - .3, legF: .9, legB: -1, shout: true }); break;
    case 'guard': Object.assign(P2, { armF: 2.6, armB: 2.3, legF: .45, legB: -.45, bob: -3 }); break;
    case 'counter': Object.assign(P2, { armF: Math.PI / 2, armB: -.6, lean: .25, legF: .6, legB: -.5, shout: true }); break;
    case 'quake': Object.assign(P2, P.air ? { armF: -2.8, armB: -2.6, legF: .7, legB: -.3 } : { armF: .1, armB: -.2, lean: .35, legF: .7, legB: -.7, shout: true }); break;
  }
  return P2;
}
function poseAlly(a) {
  const P2 = { face: a.face, t: a.t };
  if (a.state === 'run') Object.assign(P2, { legF: Math.sin(a.walk) * .8, legB: -Math.sin(a.walk) * .8, armB: Math.sin(a.walk) * .8, armF: .4, wpn: .4, bob: Math.abs(Math.sin(a.walk)) * 4, lean: .08 });
  else if (a.state === 'attack') { const act = a.st < .2; Object.assign(P2, { armF: act ? 1.6 : -.9, wpn: act ? Math.PI / 2 : -1, lean: act ? .15 : -.08, legF: .4, legB: -.4, shout: act && a.combo === 3 }); }
  else Object.assign(P2, { bob: Math.sin(a.t * 4) * 1.5, armF: .35, wpn: .3 });
  return P2;
}
function poseE(e) {
  const P2 = { face: e.face, t: e.t, flash: e.flash, shieldRot: e.shieldRot };
  const w = e.walk, isB = e.d.boss;
  switch (e.state) {
    case 'approach':
      if (Math.abs(e.vx) > 1) Object.assign(P2, { legF: Math.sin(w) * .7, legB: -Math.sin(w) * .7, armB: Math.sin(w) * .6, armF: .3, bob: Math.abs(Math.sin(w)) * 3 });
      else Object.assign(P2, { bob: Math.sin(e.t * 4) * 1.5, armF: .35 });
      P2.wpn = e.d.ranged ? Math.PI / 2 : .3;
      if (e.d.support) { const b = Math.sin(e.t * 14); P2.armF = .6 + b * .5; P2.wpn = .8 + b * .6; }
      break;
    case 'windup':
      if (e.d.pot) Object.assign(P2, { armF: -2.4, lean: -.15 });
      else if (e.move === 'lunge') Object.assign(P2, { armF: .9, wpn: Math.PI / 2, lean: -.2, legF: .6, legB: -.6 });
      else Object.assign(P2, { armF: e.d.ranged ? Math.PI / 2 : -1, wpn: e.d.ranged ? Math.PI / 2 : -1.1, lean: -.12, armB: e.d.ranged ? Math.PI / 2 - .3 : -.4 });
      if (!isB && Math.sin(e.t * 40) > .3) P2.flash = .01; else if (isB) P2.shake = 1;
      break;
    case 'strike': case 'slash': case 'fury': Object.assign(P2, { armF: 1.6, wpn: (e.type === 'soldier' || e.type === 'lancer') ? Math.PI / 2 : 2.2, lean: .18, legF: .5, legB: -.5 }); break;
    case 'lunge': Object.assign(P2, { lean: .35, armF: 1.5, wpn: Math.PI / 2, legF: 1, legB: -.8 }); break;
    case 'charge': Object.assign(P2, { lean: .4, armF: 1.4, wpn: Math.PI / 2, legF: Math.sin(e.t * 30) * .9, legB: -Math.sin(e.t * 30) * .9, shout: true }); break;
    case 'slamUp': Object.assign(P2, { armF: -2.6, wpn: -2.8, legF: .8, legB: -.3 }); break;
    case 'recover': Object.assign(P2, { armF: .8, wpn: 1.2 }); break;
    case 'hurt': Object.assign(P2, { lean: -.3, armF: 2, armB: -2, hurtFace: 1 }); break;
    case 'down': Object.assign(P2, { down: 1, hurtFace: 1 }); break;
    case 'dead': Object.assign(P2, { down: 1, hurtFace: 1, alpha: e.deadT > .7 ? (Math.sin(e.deadT * 50) > 0 ? .8 : .2) : 1 }); break;
  }
  return P2;
}
function shadow(x, gy, s = 1) { ell(ctx, x, gy + 2, 26 * s, 6 * s, 'rgba(0,0,0,.28)'); }
function outlined(txt, x, y, font, fill, stroke = 'rgba(20,14,10,.85)', lw = 4) {
  ctx.font = font; ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.strokeText(txt, x, y); ctx.fillStyle = fill; ctx.fillText(txt, x, y);
}

function drawProjs() {
  for (const q of projs) {
    if (q.kind === 'arrow') {
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(Math.atan2(q.vy, q.vx));
      ctx.strokeStyle = '#6b4424'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(12, 0); ctx.stroke();
      ctx.fillStyle = q.poison ? '#6fd06a' : '#cfd3da'; ctx.beginPath(); ctx.moveTo(12, -4); ctx.lineTo(20, 0); ctx.lineTo(12, 4); ctx.fill();
      ctx.fillStyle = '#e8e0cc'; ctx.fillRect(-20, -3, 6, 6); ctx.restore();
    } else if (q.kind === 'rain') {
      if (q.delay > 0) { ctx.globalAlpha = .5 + Math.sin(G.t * 30) * .3; ell(ctx, q.x, q.gy + 2, q.style === 'beam' ? 26 : 16, 5, '#ff3b2f'); ctx.globalAlpha = 1; continue; }
      if (q.style === 'beam') {
        ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(.15);
        ctx.fillStyle = '#4a2e1a'; ctx.fillRect(-10, -60, 20, 60);
        for (let i = 0; i < 3; i++) { ctx.fillStyle = i % 2 ? '#ff7a2f' : '#ffc44a'; ctx.beginPath(); ctx.moveTo(-10, -60 + i * 20); ctx.quadraticCurveTo(-4, -80 + i * 20 - Math.sin(G.t * 20 + i) * 6, 4, -60 + i * 20); ctx.fill(); }
        ctx.restore();
      } else {
        ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(q.x, q.y - 30); ctx.lineTo(q.x, q.y); ctx.stroke();
        ctx.fillStyle = '#cfd3da'; ctx.beginPath(); ctx.moveTo(q.x - 4, q.y); ctx.lineTo(q.x, q.y + 8); ctx.lineTo(q.x + 4, q.y); ctx.fill();
        if (q.style === 'fire') ell(ctx, q.x, q.y + 2, 5, 7, '#ffb347');
      }
    } else if (q.kind === 'bolt') {
      if (!q.struck) { ctx.globalAlpha = .45 + Math.sin(G.t * 30) * .3; ell(ctx, q.x, q.gy + 2, 30, 6, '#8fb8ff'); ctx.globalAlpha = 1; }
      else {
        ctx.strokeStyle = '#eef3ff'; ctx.lineWidth = 5; ctx.beginPath(); let yy = 0, xx = q.x + rand(-20, 20); ctx.moveTo(xx, 0);
        while (yy < q.gy) { yy += rand(30, 60); xx = q.x + rand(-18, 18); ctx.lineTo(xx, Math.min(yy, q.gy)); }
        ctx.stroke(); ctx.strokeStyle = '#8fb8ff'; ctx.lineWidth = 2; ctx.stroke();
      }
    } else if (q.kind === 'fire') {
      for (let i = 0; i < 4; i++) { const fx = q.x - 21 + i * 14, fh = 18 + Math.sin(G.t * 14 + i * 1.7 + q.x) * 7; ctx.fillStyle = i % 2 ? 'rgba(255,122,47,.9)' : 'rgba(255,196,74,.9)'; ctx.beginPath(); ctx.moveTo(fx - 8, q.gy + 2); ctx.quadraticCurveTo(fx, q.gy - fh * 1.5, fx + 8, q.gy + 2); ctx.fill(); }
    } else if (q.kind === 'pot') {
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.t * 8); drawPot(ctx, 0, 0, v => v, G.t); ctx.restore();
    } else if (q.kind === 'wave') {
      ctx.fillStyle = 'rgba(233,185,73,.85)'; ctx.beginPath(); ctx.moveTo(q.x - 24, q.gy); ctx.quadraticCurveTo(q.x, q.gy - 40 - Math.sin(G.t * 30) * 6, q.x + 24, q.gy); ctx.fill();
    } else if (q.kind === 'tide') {
      const dir = Math.sign(q.vx);
      ctx.save(); ctx.translate(q.x, LANES[2] + 10); ctx.scale(dir, (LANES[2] - LANES[0] + 90) / 80);
      ctx.fillStyle = 'rgba(40,110,150,.9)'; ctx.beginPath(); ctx.moveTo(-160, 4); ctx.quadraticCurveTo(-60, -40, 20, -70); ctx.quadraticCurveTo(60, -80, 70, -50); ctx.quadraticCurveTo(40, -58, 36, -36); ctx.quadraticCurveTo(50, -10, 60, 4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(230,245,255,.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(20, -70); ctx.quadraticCurveTo(60, -80, 70, -50); ctx.stroke();
      ctx.restore();
    } else if (q.kind === 'chuong') {
      ctx.save(); ctx.translate(q.x, q.y); ctx.scale(Math.sign(q.vx), 1);
      const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 44); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(.4, 'rgba(143,214,255,.8)'); g.addColorStop(1, 'rgba(63,143,120,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 44, 38, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(230,248,255,.85)'; rr(ctx, -6, -18, 18, 30, 7); ctx.fill();
      for (let i = 0; i < 4; i++) { rr(ctx, 10, -18 + i * 7.5, 14 - Math.abs(i - 1.5) * 2, 6, 3); ctx.fill(); }
      ctx.restore();
    }
  }
}

// Bãi cọc gỗ bịt sắt: nhô dần lên khi nước ròng; gãy sau khi tướng giặc mắc vào
function drawStakes(s) {
  if (!s.dead) { ctx.globalAlpha = .22 + Math.sin(G.t * 5) * .08; ell(ctx, s.x, s.gy + 3, 46, 9, '#e9b949'); ctx.globalAlpha = 1; }
  for (let i = 0; i < 5; i++) {
    const h = s.dead ? 7 + (i % 2) * 4 : (26 + ((i * 7) % 3) * 8) * s.up;
    if (h > 2) stake(s.x - 30 + i * 15, s.gy + 4 - (i % 2) * 5, h);
  }
}
function drawItem(it) {
  if (it.t > 11 && Math.sin(it.t * 20) < 0) return;
  shadow(it.x, it.gy, .4);
  if (it.kind === 'coin') { ell(ctx, it.x, it.y, 8, 8, '#e9b949'); ctx.strokeStyle = '#a07a22'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(it.x, it.y, 8, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#6b4a14'; ctx.fillRect(it.x - 2.5, it.y - 2.5, 5, 5); }
  else { ctx.fillStyle = '#3f7a3a'; ctx.fillRect(it.x - 11, it.y - 11, 22, 22); ctx.strokeStyle = '#e6d9a8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(it.x - 11, it.y); ctx.lineTo(it.x + 11, it.y); ctx.moveTo(it.x, it.y - 11); ctx.lineTo(it.x, it.y + 11); ctx.stroke(); }
}
function drawEnemy(e) {
  const s = e.sc || 1; shadow(e.x, e.gy, s);
  const pz = poseE(e); pz.scale = e.R ? e.R.sc : 1; if (e.rank && e.rank !== 'n') pz.flag = e.rank;
  if (e.buff && alive(e)) { ctx.strokeStyle = `rgba(255,90,60,${.35 + Math.sin(G.t * 8) * .15})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(e.x, e.gy + 2, 28 * s, 7 * s, 0, 0, Math.PI * 2); ctx.stroke(); }
  if (e.state === 'windup' && e.d.boss) { ctx.save(); ctx.globalAlpha = .35 + Math.sin(G.t * 30) * .2; ell(ctx, e.x, e.y - 60 * s, 60 * s, 70 * s, '#ff3b2f'); ctx.restore(); }
  drawChibi(ctx, e.x + (pz.shake ? rand(-2, 2) : 0), e.y, LOOKS[e.type], pz);
  if (!e.d.boss && alive(e) && e.rank && e.rank !== 'n') {
    const bw = e.rank === 'cmd' ? 70 : 54, y = e.y - 128 * s;
    ctx.textAlign = 'center'; outlined(e.R.label, e.x, y - 6, `13px ${FB}`, e.rank === 'cmd' ? '#ffd35a' : '#ffb4a6', 'rgba(20,14,10,.8)', 3);
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(e.x - bw / 2, y, bw, 6); ctx.fillStyle = e.rank === 'cmd' ? '#e9a13a' : '#e04a3a'; ctx.fillRect(e.x - bw / 2, y, bw * Math.max(0, e.hp / e.maxHp), 6);
  } else if (!e.d.boss && alive(e) && e.hp < e.maxHp) { const bw = 40; ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(e.x - bw / 2, e.y - 124 * s, bw, 5); ctx.fillStyle = '#e04a3a'; ctx.fillRect(e.x - bw / 2, e.y - 124 * s, bw * Math.max(0, e.hp / e.maxHp), 5); }
  if (e.state === 'windup' && !e.d.boss) { ctx.textAlign = 'center'; outlined('!', e.x, e.y - 128 * s, `bold 24px ${FB}`, e.move === 'lunge' ? '#ff5a3c' : '#ffd35a'); }
}
function drawPlayer() {
  shadow(P.x, P.gy);
  // vòng chỉ làn dưới chân để dễ thấy đang đứng làn nào
  if (G.mode === 'play') { ctx.strokeStyle = 'rgba(233,185,73,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(P.x, P.gy + 2, 30, 8, 0, 0, Math.PI * 2); ctx.stroke(); }
  if (P.state === 'ult') { const r = 60 + P.st * 80; ctx.save(); ctx.globalAlpha = .5; const g = ctx.createRadialGradient(P.x, P.y - 60, 10, P.x, P.y - 60, r); g.addColorStop(0, 'rgba(255,220,120,.9)'); g.addColorStop(1, 'rgba(255,120,40,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(P.x, P.y - 60, r, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  if (P.state === 'guard') { ctx.save(); ctx.globalAlpha = .45 + Math.sin(G.t * 20) * .15; ctx.strokeStyle = '#ffe6a8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(P.x, P.y - 55, 42, 66, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  if (P.rage >= 100 && G.mode === 'play') { ctx.save(); ctx.globalAlpha = .25 + Math.sin(G.t * 6) * .12; ell(ctx, P.x, P.y - 55, 40, 64, '#ffd35a'); ctx.restore(); }
  drawChibi(ctx, P.x, P.y, LOOKS.hero, poseP(P));
}

function render() {
  ctx.save();
  if (CFG.shake && G.shake > 0) ctx.translate(rand(-G.shake, G.shake), rand(-G.shake, G.shake) * .6);
  drawBG();
  ctx.translate(-Math.round(G.camX), 0);

  // vẽ theo chiều sâu: làn trong (gy nhỏ) trước, làn ngoài sau
  const draws = [];
  props.forEach(p => draws.push([p.gy - .5, () => drawProp(ctx, p)]));
  G.stakes.forEach(s => draws.push([s.gy - .45, () => drawStakes(s)]));
  items.forEach(it => draws.push([it.gy - .4, () => drawItem(it)]));
  enemies.forEach(e => draws.push([e.gy - (alive(e) ? 0 : .3), () => drawEnemy(e)]));
  if (ally) draws.push([ally.gy - .1, () => {
    shadow(ally.x, ally.gy); drawChibi(ctx, ally.x, ally.y, LOOKS[ally.look], poseAlly(ally));
    ctx.textAlign = 'center'; outlined(SPK[ally.look].name.split(' ').slice(-3).join(' '), ally.x, ally.y - 118, `12px ${FB}`, '#bfe3ff', 'rgba(20,14,10,.7)', 3);
  }]);
  if (P) draws.push([P.gy, drawPlayer]);
  draws.sort((a, b) => a[0] - b[0]).forEach(d => d[1]());
  drawProjs();
  for (const p of parts) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.max * 1.5));
    if (p.kind === 'spark') { ctx.strokeStyle = p.col; ctx.lineWidth = p.size * .8; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * .03, p.y - p.vy * .03); ctx.stroke(); }
    else if (p.kind === 'leaf') ell(ctx, p.x, p.y, p.size, p.size * .55, p.col, G.t * 2 + p.size);
    else if (p.kind === 'firefly') { ctx.globalAlpha *= .5 + Math.sin(G.t * 6 + p.x) * .5; ell(ctx, p.x, p.y, p.size * 2.5, p.size * 2.5, 'rgba(217,242,122,.25)'); ell(ctx, p.x, p.y, p.size, p.size, p.col); }
    else ell(ctx, p.x, p.y, p.size, p.size, p.col);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  for (const t of texts) { ctx.globalAlpha = Math.min(1, t.life * 2); outlined(t.txt, t.x, t.y, `${t.size}px ${FB}`, t.col); }
  ctx.globalAlpha = 1;
  ctx.restore();

  drawWeather();
  if (G.ultT > 0) {
    const k = 1 - G.ultT / 1.25;
    ctx.fillStyle = `rgba(20,10,5,${Math.min(.55, k * 2)})`; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.textAlign = 'center'; ctx.translate(W / 2, H / 2 - 30); const sc = 1 + Math.max(0, .4 - k) * 2; ctx.scale(sc, sc);
    outlined('Sát Thát!', 0, 0, `110px ${FD}`, '#ffd35a', '#6e1812', 10);
    ctx.font = `26px ${FB}`; ctx.fillStyle = '#f4e7c9'; ctx.fillText('Hào khí Đông A', 0, 50);
    ctx.restore();
  }
  if (G.flashT > 0) { ctx.fillStyle = `rgba(255,236,180,${G.flashT})`; ctx.fillRect(0, 0, W, H); }
  if (G.mode !== 'title') drawHUD();
  if (G.banner) drawBanner();
}

function drawHUD() {
  ctx.save();
  ctx.fillStyle = 'rgba(20,14,10,.72)'; rr(ctx, 14, 12, 330, 88, 12); ctx.fill();
  ctx.strokeStyle = '#e9b949'; ctx.lineWidth = 1.5; rr(ctx, 14, 12, 330, 88, 12); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.arc(56, 56, 34, 0, Math.PI * 2); ctx.fillStyle = '#e7d3a9'; ctx.fill(); ctx.clip();
  drawChibi(ctx, 53, 56 + 80 * .95 + 4, LOOKS.hero, { scale: .95, t: G.t, armF: .2 });
  ctx.restore();
  ctx.strokeStyle = '#a3261d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(56, 56, 34, 0, Math.PI * 2); ctx.stroke();
  const bar = (y, v, max, col, lbl) => {
    ctx.fillStyle = 'rgba(0,0,0,.5)'; rr(ctx, 100, y, 230, 13, 6); ctx.fill();
    if (v > 0) { ctx.fillStyle = col; rr(ctx, 100, y, Math.max(6, 230 * v / max), 13, 6); ctx.fill(); }
    ctx.font = `12px ${FB}`; ctx.fillStyle = '#f4e7c9'; ctx.textAlign = 'left'; ctx.fillText(lbl, 106, y + 11);
  };
  bar(24, P.hp, P.maxHp, P.poison > 0 ? '#5aa84a' : '#d2412f', `Sinh lực ${Math.ceil(P.hp)}/${P.maxHp}${P.poison > 0 ? ' · trúng độc' : ''}`);
  bar(46, P.mp, P.maxMp, '#3f8f9f', `Nội lực ${Math.floor(P.mp)}/${P.maxMp}`);
  const full = P.rage >= 100;
  bar(68, P.rage, 100, full ? (Math.sin(G.t * 8) > 0 ? '#ffd35a' : '#e9a13a') : '#c9912e', full ? 'Hào khí đầy · bấm U' : 'Hào khí');

  ctx.textAlign = 'right';
  outlined(G.st.name, W - 18, 40, `26px ${FD}`, '#ffe6a8', 'rgba(20,14,10,.8)', 5);
  outlined(`Ải ${G.stage + 1}/${STAGES.length} · ${G.st.year}`, W - 18, 62, `15px ${FB}`, '#f4e7c9', 'rgba(20,14,10,.8)', 5);
  ell(ctx, W - 118, 84, 9, 9, '#e9b949'); ctx.fillStyle = '#6b4a14'; ctx.fillRect(W - 121, 81, 6, 6);
  outlined(`${S.coins} văn`, W - 18, 91, `18px ${FB}`, '#ffe6a8', 'rgba(20,14,10,.8)', 5);
  const prog = clamp(P.x / G.st.len, 0, 1);
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(W - 200, 102, 182, 4); ctx.fillStyle = '#e9b949'; ctx.fillRect(W - 200, 102, 182 * prog, 4);

  // cấp độ + kinh nghiệm
  ctx.fillStyle = 'rgba(20,14,10,.72)'; rr(ctx, 14, 104, 330, 22, 8); ctx.fill();
  ctx.textAlign = 'left'; ctx.font = `13px ${FB}`; ctx.fillStyle = '#ffe6a8'; ctx.fillText(`Cấp ${S.lv}${S.sp ? ` · ${S.sp} điểm kỹ năng` : ''}`, 24, 120);
  ctx.fillStyle = 'rgba(0,0,0,.5)'; rr(ctx, 190, 111, 144, 8, 4); ctx.fill();
  ctx.fillStyle = '#8fe07a'; rr(ctx, 190, 111, Math.max(4, 144 * S.xp / xpNeed(S.lv)), 8, 4); ctx.fill();
  drawSkillBar();

  if (G.combo >= 3) {
    const pop = 1 + Math.max(0, G.comboT - 2.3) * 1.5;   // nảy lên khi vừa trúng thêm một đòn
    ctx.save(); ctx.translate(W - 24, 168); ctx.scale(pop, pop); ctx.textAlign = 'right'; ctx.globalAlpha = Math.min(1, G.comboT * 2);
    outlined(`${G.combo} đòn`, 0, 0, `38px ${FD}`, G.combo >= G.st.combo ? '#ffd35a' : '#ffe6a8', '#6e1812', 6);
    ctx.font = `14px ${FB}`; ctx.fillStyle = '#f4e7c9'; ctx.fillText('liên hoàn', 0, 18);
    ctx.restore();
  }
  const b = G.boss;
  if (G.surviveT > 0) {
    ctx.textAlign = 'center';
    outlined(`Giữ vững: ${Math.ceil(G.surviveT)} giây`, W / 2, b && alive(b) ? 100 : 44, `28px ${FD}`, G.surviveT < 6 ? '#8fe07a' : '#ffd35a', '#6e1812', 6);
  }
  if (b && alive(b)) {
    const bw = 360, bx = 372, by = 46;
    ctx.fillStyle = 'rgba(20,14,10,.78)'; rr(ctx, bx - 10, by - 30, bw + 20, 54, 10); ctx.fill();
    ctx.textAlign = 'left'; ctx.font = `16px ${FB}`; ctx.fillStyle = b.d.grand ? '#ffd35a' : '#ffb4a6'; ctx.fillText(`${b.d.rank} · ${b.d.name}`, bx, by - 10);
    if (b.phase3 || b.enraged) { ctx.textAlign = 'right'; ctx.fillStyle = '#ff5a3c'; ctx.fillText(b.phase3 ? 'Liều chết' : 'Nổi giận', bx + bw, by - 10); }
    ctx.fillStyle = 'rgba(0,0,0,.6)'; rr(ctx, bx, by, bw, 14, 7); ctx.fill();
    ctx.fillStyle = b.hp < b.maxHp * .5 ? '#ff5a3c' : '#c0392b'; rr(ctx, bx, by, Math.max(7, bw * b.hp / b.maxHp), 14, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(bx + bw / 2 - 1, by, 2, 14);
    if (b.d.grand) ctx.fillRect(bx + bw / 4 - 1, by, 2, 14);
  }
  if (G.goBlink > 0 && Math.sin(G.t * 8) > 0 && G.mode === 'play') {
    ctx.textAlign = 'right'; outlined('Tiến lên ➜', W - 30, H / 2, `34px ${FD}`, '#ffd35a', '#6e1812', 6);
  }
  ctx.restore();
}
// Thanh kỹ năng dưới bảng máu (góc trên trái, để không che làn ngoài cùng): 5 kỹ năng + lướt + tuyệt kỹ, có vòng hồi chiêu
function drawSkillBar() {
  const box = 52, gap = 4, y = 132;
  const slots = ACTIVE.map(id => ({ id, key: SKILLS[id].key, name: SKILLS[id].name, lv: sk(id), cd: P.cds[id], max: sk(id) ? SKILLS[id].cd[sk(id) - 1] : 1, mp: SKILLS[id].mp }));
  slots.push({ id: 'dash', key: 'Shift', name: 'Lướt', lv: 1, cd: Math.max(0, P.dashCd), max: [.55, .45, .38, .25][sk('thanphap')], mp: 0 });
  slots.push({ id: 'ult', key: 'U', name: 'Sát Thát', lv: 1, cd: 0, max: 1, mp: 0, rage: true });
  slots.forEach((sl, i) => {
    const x = 14 + i * (box + gap), ready = sl.rage ? P.rage >= 100 : sl.lv && sl.cd <= 0 && P.mp >= sl.mp;
    ctx.fillStyle = sl.rage && ready ? (Math.sin(G.t * 8) > 0 ? '#a3261d' : '#6e1812') : 'rgba(20,14,10,.78)';
    rr(ctx, x, y, box, box, 8); ctx.fill();
    ctx.strokeStyle = ready ? '#e9b949' : 'rgba(233,185,73,.35)'; ctx.lineWidth = 1.5; rr(ctx, x, y, box, box, 8); ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = `bold ${sl.key.length > 1 ? 11 : 16}px ${FB}`; ctx.fillStyle = sl.lv ? '#ffe6a8' : '#7d6a55'; ctx.fillText(sl.key, x + box / 2, y + 17);
    ctx.font = `10px ${FB}`; ctx.fillStyle = sl.lv ? '#f4e7c9' : '#7d6a55';
    const words = sl.name.split(' '); ctx.fillText(words.length > 2 ? words.slice(0, 2).join(' ') : sl.name, x + box / 2, y + 31, box - 4);
    if (!sl.lv) { ctx.fillText('chưa học', x + box / 2, y + 43); return; }
    if (sl.rage) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x + 6, y + box - 8, box - 12, 4); ctx.fillStyle = '#ffd35a'; ctx.fillRect(x + 6, y + box - 8, (box - 12) * P.rage / 100, 4); return; }
    if (sl.mp) { ctx.fillStyle = P.mp >= sl.mp ? '#8fd6ff' : '#ff8a70'; ctx.fillText(`${sl.mp} nội lực`, x + box / 2, y + 43, box - 4); }
    if (sl.cd > 0) {
      ctx.save(); rr(ctx, x, y, box, box, 8); ctx.clip(); ctx.globalAlpha = .6; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.moveTo(x + box / 2, y + box / 2);
      ctx.arc(x + box / 2, y + box / 2, box, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * sl.cd / sl.max); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.font = `bold 15px ${FB}`; ctx.fillStyle = '#fff'; ctx.fillText(sl.cd.toFixed(1), x + box / 2, y + box / 2 + 6);
    }
  });
}
function drawBanner() {
  const b = G.banner, k = b.t / b.dur, a = k < .15 ? k / .15 : k > .8 ? (1 - k) / .2 : 1;
  ctx.save(); ctx.globalAlpha = clamp(a, 0, 1); ctx.textAlign = 'center';
  const y = H * .38;
  ctx.fillStyle = 'rgba(20,14,10,.55)'; ctx.fillRect(0, y - 62, W, 104);
  ctx.fillStyle = '#e9b949'; ctx.fillRect(0, y - 62, W, 2); ctx.fillRect(0, y + 40, W, 2);
  outlined(b.text, W / 2, y, `56px ${FD}`, '#ffd35a', '#6e1812', 8);
  if (b.sub) { ctx.font = `20px ${FB}`; ctx.fillStyle = '#f4e7c9'; ctx.fillText(b.sub, W / 2, y + 30); }
  ctx.restore();
}
