'use strict';
// Cảnh nền cuộn nhiều lớp (parallax) cho 6 ải: làng, kinh thành, bến sông, rừng, biển, Bạch Đằng.
// Cảnh xa vẽ trong hệ toạ độ có đường chân trời HZ rồi dịch lên cho khớp mép đất GT; mặt đất 3 làn vẽ riêng.
const HZ = 455;

function sky(stops) {
  const g = ctx.createLinearGradient(0, 0, 0, HZ);
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  ctx.fillStyle = g; ctx.fillRect(0, -(HZ - GT) - 10, W, HZ + (HZ - GT) + 10);
}
function hills(off, col, base, hgt, seed, span = 150, sharp = 1) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, HZ); ctx.lineTo(0, base);
  const k0 = Math.floor(off / span) - 1;
  for (let k = k0; k < k0 + W / span + 3; k++) {
    const px = k * span - off, h = hgt * (.45 + hash(k + seed) * .7), w = span * (.55 + hash(k * 7 + seed) * .35);
    ctx.lineTo(px - w, base);
    ctx.bezierCurveTo(px - w * .6 * sharp, base - h * 1.25, px + w * .6 * sharp, base - h * 1.25, px + w, base);
  }
  ctx.lineTo(W, base); ctx.lineTo(W, HZ); ctx.closePath(); ctx.fill();
}
function each(off, span, fn) { const k0 = Math.floor(off / span) - 1; for (let k = k0; k < k0 + W / span + 3; k++) fn(k, k * span - off + hash(k * 3.3) * span * .4); }
function ripples(y0, rows, gap, col, speed, len = 30, step = 80) {
  ctx.strokeStyle = col; ctx.lineWidth = 2;
  for (let i = 0; i < rows; i++) {
    const y = y0 + i * gap, o = ((G.camX * (.2 + i * .06)) + G.t * speed * (i % 2 ? 1 : -1)) % step;
    for (let x = -step - o; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke(); }
  }
}

function bamboo(x, base, k) {
  const n = 3 + ((hash(k) * 3) | 0);
  for (let i = 0; i < n; i++) {
    const bx = x + (i - n / 2) * 11, h = 170 + hash(k * 5 + i) * 110, lean = (hash(k + i * 9) - .5) * 30 + Math.sin(G.t * 1.2 + k + i) * 3;
    ctx.strokeStyle = i % 2 ? '#5d8a3a' : '#6f9c45'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(bx, base); ctx.quadraticCurveTo(bx, base - h * .6, bx + lean, base - h); ctx.stroke();
    ctx.strokeStyle = '#3e6128'; ctx.lineWidth = 2;
    for (let j = 1; j < 6; j++) { const yy = base - h * j / 6, xx = bx + lean * Math.pow(j / 6, 2); ctx.beginPath(); ctx.moveTo(xx - 3, yy); ctx.lineTo(xx + 3, yy); ctx.stroke(); }
    for (let j = 0; j < 4; j++) ell(ctx, bx + lean + (j - 1.5) * 12, base - h + j * 6 - 4, 13, 4, '#6ea345', (j - 1.5) * .5);
  }
}
function house(x, base) {
  ctx.fillStyle = '#c9a36b'; ctx.fillRect(x - 55, base - 52, 110, 52);
  ctx.fillStyle = '#6b4a2a'; ctx.fillRect(x - 14, base - 36, 28, 36);
  ctx.fillStyle = '#8a6a44'; for (let i = -1; i <= 1; i += 2) ctx.fillRect(x + i * 36 - 9, base - 38, 18, 14);
  ctx.fillStyle = '#b08a48'; ctx.beginPath(); ctx.moveTo(x - 76, base - 46); ctx.lineTo(x - 30, base - 104); ctx.lineTo(x + 30, base - 104); ctx.lineTo(x + 76, base - 46); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#8e6c35'; ctx.lineWidth = 2; for (let i = 0; i < 9; i++) { const xx = x - 60 + i * 15; ctx.beginPath(); ctx.moveTo(xx, base - 50); ctx.lineTo(xx + (xx < x ? 12 : -12), base - 96); ctx.stroke(); }
}
function palace(x, base, big) {
  const w = big ? 120 : 80, h = big ? 90 : 64;
  ctx.fillStyle = '#7a2a22'; ctx.fillRect(x - w, base - h, w * 2, h);
  ctx.fillStyle = '#a3261d'; for (let i = -2; i <= 2; i++) ctx.fillRect(x + i * w / 2.4 - 5, base - h, 10, h);
  ctx.fillStyle = '#2b1d1f';
  const roof = (y, rw) => {
    ctx.beginPath(); ctx.moveTo(x - rw - 30, y - 6); ctx.quadraticCurveTo(x - rw, y, x - rw + 10, y - 8); ctx.lineTo(x - rw * .55, y - 46); ctx.lineTo(x + rw * .55, y - 46); ctx.lineTo(x + rw - 10, y - 8); ctx.quadraticCurveTo(x + rw, y, x + rw + 30, y - 6); ctx.quadraticCurveTo(x + rw + 10, y + 10, x, y + 8); ctx.quadraticCurveTo(x - rw - 10, y + 10, x - rw - 30, y - 6); ctx.fill();
    ctx.fillStyle = '#c9a449'; ctx.fillRect(x - rw * .55, y - 49, rw * 1.1, 4); ctx.fillStyle = '#2b1d1f';
  };
  roof(base - h, w + 16);
  if (big) { ctx.fillStyle = '#7a2a22'; ctx.fillRect(x - w * .5, base - h - 80, w, 36); ctx.fillStyle = '#2b1d1f'; roof(base - h - 44, w * .6); }
  // lửa cháy trên mái
  for (let i = 0; i < 3; i++) { const fx = x - w * .6 + i * w * .6, fh = 18 + Math.sin(G.t * 8 + i * 2 + x) * 6; ctx.fillStyle = i % 2 ? 'rgba(255,122,47,.85)' : 'rgba(255,196,74,.85)'; ctx.beginPath(); ctx.moveTo(fx - 9, base - h - 30); ctx.quadraticCurveTo(fx, base - h - 30 - fh * 1.4, fx + 9, base - h - 30); ctx.fill(); }
}
function palaceSil(x, base, h) {
  ctx.fillRect(x - 40, base - h, 80, h);
  ctx.beginPath(); ctx.moveTo(x - 60, base - h); ctx.quadraticCurveTo(x - 50, base - h - 4, x - 44, base - h - 10); ctx.lineTo(x - 22, base - h - 32); ctx.lineTo(x + 22, base - h - 32); ctx.lineTo(x + 44, base - h - 10); ctx.quadraticCurveTo(x + 50, base - h - 4, x + 60, base - h); ctx.fill();
}
function boat(x, y, s, burning) {
  ctx.save(); ctx.translate(x, y + Math.sin(G.t * 1.5 + x * .01) * 2); ctx.scale(s, s);
  ctx.fillStyle = burning ? '#3a2a22' : '#5a3b24'; ctx.beginPath(); ctx.moveTo(-60, -10); ctx.quadraticCurveTo(0, 18, 64, -14); ctx.lineTo(50, -2); ctx.quadraticCurveTo(0, 10, -48, 0); ctx.closePath(); ctx.fill();
  ctx.fillRect(-50, -12, 100, 8);
  if (!burning) { // buồm cánh dơi
    ctx.fillStyle = '#b8894e'; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(-26, -70); ctx.quadraticCurveTo(10, -80, 30, -66); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#8a6434'; ctx.lineWidth = 1.5; for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(-26 + i * 11, -72 + i); ctx.stroke(); }
  } else {
    ctx.fillStyle = '#3d3834'; ctx.fillRect(-4, -100, 6, 90); ctx.fillStyle = '#7a6a58'; ctx.fillRect(-30, -96, 56, 40);
    for (let i = 0; i < 5; i++) { const fx = -40 + i * 20, fh = 30 + Math.sin(G.t * 9 + i * 2 + x) * 10; ctx.fillStyle = i % 2 ? '#ff7a2f' : '#ffc44a'; ctx.beginPath(); ctx.moveTo(fx - 10, -12); ctx.quadraticCurveTo(fx, -12 - fh * 1.3, fx + 10, -12); ctx.fill(); }
  }
  ctx.restore();
}
function stake(x, base, h) {
  ctx.fillStyle = '#3a2a1c'; ctx.beginPath(); ctx.moveTo(x - 5, base); ctx.lineTo(x - 3, base - h); ctx.lineTo(x, base - h - 12); ctx.lineTo(x + 3, base - h); ctx.lineTo(x + 5, base); ctx.fill();
  ctx.fillStyle = '#8a8f96'; ctx.beginPath(); ctx.moveTo(x - 3, base - h); ctx.lineTo(x, base - h - 12); ctx.lineTo(x + 3, base - h); ctx.fill();
}
function reeds(x, base, k) {
  ctx.strokeStyle = '#7d8f4a'; ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) { const h = 40 + hash(k * 3 + i) * 50, sw = Math.sin(G.t * 1.5 + i + k) * 4; ctx.beginPath(); ctx.moveTo(x + i * 5, base); ctx.quadraticCurveTo(x + i * 5, base - h * .6, x + i * 5 + sw + (i - 3) * 3, base - h); ctx.stroke(); }
  ell(ctx, x + 15, base - 80, 3, 10, '#c9b27a');
}
function pine(x, base, h, col) {
  ctx.fillStyle = shade('#3a2a1c', -10); ctx.fillRect(x - 4, base - h * .25, 8, h * .25);
  ctx.fillStyle = col;
  for (let i = 0; i < 4; i++) { const w = h * (.42 - i * .08), y = base - h * .2 - i * h * .2; ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x, y - h * .32); ctx.lineTo(x + w, y); ctx.closePath(); ctx.fill(); }
}
function laneLines() {
  ctx.strokeStyle = 'rgba(0,0,0,.13)'; ctx.lineWidth = 2; ctx.setLineDash([18, 14]);
  const o = G.camX % 32;
  for (let i = 0; i < 2; i++) { const y = (LANES[i] + LANES[i + 1]) / 2 + 2; ctx.beginPath(); ctx.moveTo(-o, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.setLineDash([]);
}
function groundShade() {
  const g = ctx.createLinearGradient(0, GT, 0, H); g.addColorStop(0, 'rgba(0,0,0,.12)'); g.addColorStop(.25, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.3)');
  ctx.fillStyle = g; ctx.fillRect(0, GT - 14, W, H - GT + 14);
}
function ground(top, edge, dark, stone) {
  const cx = G.camX;
  ctx.fillStyle = top; ctx.fillRect(0, GT - 14, W, H - GT + 14);
  ctx.fillStyle = edge; ctx.fillRect(0, GT - 18, W, 6);
  if (stone) {
    ctx.strokeStyle = dark; ctx.lineWidth = 2;
    for (let y = GT; y < H; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); const o = (cx + y * 1.3) % 80; for (let x = -o; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 24); ctx.stroke(); } }
  } else each(cx, 45, (k, x) => ell(ctx, x, GT + 6 + hash(k) * (H - GT - 10), 6 + hash(k * 2) * 8, 3, dark));
  groundShade(); laneLines();
}
function deck() {
  const cx = G.camX;
  ctx.fillStyle = '#8a5a32'; ctx.fillRect(0, GT - 14, W, H - GT + 14);
  ctx.strokeStyle = '#6b4424'; ctx.lineWidth = 2;
  for (let y = GT - 4; y < H; y += 18) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  const o = cx % 120; for (let x = -o; x < W; x += 120) { ctx.beginPath(); ctx.moveTo(x, GT - 14); ctx.lineTo(x, H); ctx.stroke(); }
  // lan can mạn thuyền
  ctx.fillStyle = '#5a381d'; ctx.fillRect(0, GT - 58, W, 6);
  const o2 = cx % 60; for (let x = -o2; x < W; x += 60) ctx.fillRect(x - 3, GT - 58, 6, 44);
  groundShade(); laneLines();
}

const GROUNDS = {
  village: () => ground('#a8794c', '#6f9a44', '#8c6340'),
  citadel: () => ground('#6e5d52', '#56473e', '#4a3c34', true),
  river: () => ground('#c9a36e', '#8a9a55', '#a9844f'),
  forest: () => ground('#3b3a2a', '#2e4a2e', '#2a291e'),
  sea: () => deck(),
  bachdang: () => ground('#3f3327', '#2d3a2c', '#33291f'),
};
function drawBG() {
  ctx.save(); ctx.translate(0, GT - HZ); drawScenery(); ctx.restore();
  GROUNDS[G.st.bg]();
}
function drawScenery() {
  const cx = G.camX, th = G.st.bg;
  if (th === 'village') {
    sky(['#7fb8d6', '#c9e2da', '#f7deae']);
    ell(ctx, 740, 130, 44, 44, '#fff3cf');
    hills(cx * .08, '#a6c4b8', 330, 170, 3, 170, .6);
    hills(cx * .18, '#86ad9c', 370, 120, 11, 140, .7);
    ctx.fillStyle = '#9cc75e'; ctx.fillRect(0, 370, W, HZ - 370);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) { const y = 382 + i * 12, o = (cx * (.3 + i * .05)) % 60; for (let x = -o; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 30, y); ctx.stroke(); } }
    each(cx * .55, 330, (k, x) => { if (hash(k) < .55) bamboo(x, HZ - 30, k); else house(x, HZ - 28); });
  } else if (th === 'citadel') {
    sky(['#24162a', '#6e2e3e', '#e0773c']);
    ell(ctx, 220, 150, 36, 36, '#ffd9a0');
    for (let i = 0; i < 5; i++) { const sx = ((i * 260 - cx * .1) % 1300 + 1300) % 1300 - 100; for (let j = 0; j < 6; j++) { const r = 30 + j * 14, yy = 330 - j * 42 - ((G.t * 14) % 42); ctx.fillStyle = `rgba(40,25,30,${.35 - j * .05})`; ctx.beginPath(); ctx.arc(sx + Math.sin(j + G.t * .3) * 20, yy, r, 0, Math.PI * 2); ctx.fill(); } }
    hills(cx * .1, '#3b2532', 360, 70, 5, 110, 1.6);
    ctx.fillStyle = '#301e28'; each(cx * .22, 200, (k, x) => palaceSil(x, 380, hash(k) * 30 + 30));
    each(cx * .55, 520, (k, x) => palace(x, HZ - 26, hash(k) > .5));
    ctx.fillStyle = 'rgba(255,120,50,.08)'; ctx.fillRect(0, 300, W, HZ - 300);
  } else if (th === 'river') {
    sky(['#6fb0d4', '#b7dce6', '#eef2df']);
    hills(cx * .08, '#9dbfae', 320, 90, 7, 200, .5);
    ctx.fillStyle = '#4f8fa6'; ctx.fillRect(0, 320, W, HZ - 320);
    ripples(332, 8, 15, 'rgba(255,255,255,.35)', 20, 34, 90);
    each(cx * .3 - G.t * 12, 380, (k, x) => boat(x, 350 + hash(k) * 30, .7 + hash(k * 2) * .3, false));
    each(cx * .7, 90, (k, x) => { if (hash(k) < .6) reeds(x, HZ - 20, k); });
  } else if (th === 'forest') {
    sky(['#141a2a', '#2e3150', '#7a4a66']);
    ell(ctx, 690, 110, 34, 34, '#f4ecd0'); ell(ctx, 700, 104, 30, 30, '#2a2d4a');
    hills(cx * .06, '#262c44', 320, 150, 41, 170, .7);
    ctx.fillStyle = 'rgba(180,190,220,.12)'; ctx.fillRect(0, 300, W, 40);
    each(cx * .25, 70, (k, x) => pine(x, 380, 90 + hash(k) * 60, '#1d2a2e'));
    ctx.fillStyle = 'rgba(160,170,200,.10)'; ctx.fillRect(0, 360, W, 40);
    each(cx * .6, 150, (k, x) => pine(x, HZ - 10, 180 + hash(k * 2) * 90, '#15201c'));
  } else if (th === 'sea') {
    sky(['#4f9cc8', '#a3d0e0', '#f0e8cc']);
    ell(ctx, 180, 110, 40, 40, '#fff6d8');
    hills(cx * .05, '#86a9a4', 330, 150, 51, 150, .45);
    hills(cx * .12, '#6a918b', 340, 90, 61, 110, .4);
    ctx.fillStyle = '#2f7a9a'; ctx.fillRect(0, 330, W, HZ - 330);
    ripples(340, 7, 16, 'rgba(255,255,255,.3)', 30);
    each(cx * .28 + G.t * 6, 360, (k, x) => boat(x, 356 + hash(k) * 16, .8 + hash(k * 5) * .3, hash(k * 9) < .55));
  } else {
    const out = G.tideOut ? 1 : 0;
    sky(['#10161f', '#283042', '#5e4450']);
    hills(cx * .06, '#232b38', 300, 170, 21, 150, .45);
    hills(cx * .14, '#1b212c', 340, 120, 31, 120, .5);
    const wy = 330 + out * 40;
    ctx.fillStyle = out ? '#3a3226' : '#233744'; ctx.fillRect(0, 330, W, wy - 330);
    ctx.fillStyle = '#233744'; ctx.fillRect(0, wy, W, HZ - wy);
    ripples(wy + 10, 7, 14, 'rgba(160,190,210,.25)', 30);
    each(cx * .35, 420, (k, x) => boat(x, 360 + out * 30 + hash(k) * 20, 1 + hash(k * 3) * .3, true));
    each(cx * .6, 46, (k, x) => stake(x, HZ - 18 - hash(k) * 10, 26 + hash(k * 4) * 40 + out * 40));
    ctx.fillStyle = 'rgba(255,120,60,.06)'; ctx.fillRect(0, 280, W, HZ - 280);
  }
}

// Mưa ở Bạch Đằng, vẽ đè lên mọi thứ
function drawWeather() {
  if (G.st.bg !== 'bachdang') return;
  ctx.strokeStyle = 'rgba(180,200,220,.35)'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i = 0; i < 70; i++) { const x = (hash(i) * W * 1.2 + G.t * 300 - G.camX * .3) % (W * 1.2) - 50, y = (hash(i * 7) * H + G.t * 900) % H; ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 20); }
  ctx.stroke();
  if (G.lightning > 0) { ctx.fillStyle = `rgba(220,230,255,${G.lightning * 1.2})`; ctx.fillRect(0, 0, W, H); }
}
