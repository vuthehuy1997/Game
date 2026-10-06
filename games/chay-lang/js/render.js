import { $ } from '../../../platform/core/util.js';
import { drawChibi } from '../../../platform/art/chibi.js';
import { POSES } from '../../../platform/art/poses.js';
import { ell, rr, shade, outlinedText, groundShadow } from '../../../platform/art/draw.js';
import { drawParticles, drawTexts } from '../../../platform/core/fx.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { G, P, obstacles, pickups, items, banner, LANES_X, PLAYER_Y, JUMP_DUR, ZONES, ITEMS, ROAD_L, ROAD_R } from './state.js';

const cv = $('cv'), ctx = cv.getContext('2d');
const HERO = { skin: '#f6d2ae', hair: '#1c1410', hat: 'khan', khan: '#2f6b57', shirt: '#2f6b57', trim: '#e9b949', pants: '#2a2630', belt: '#e9b949' };
const WOOD = '#9a7444', WOOD_DARK = '#5a3a1e', BAMBOO = '#7fa35a', BAMBOO_DARK = '#4a6b33';

export function render() {
  ctx.save();
  if (G.shake > 0) { ctx.translate((Math.random() - .5) * G.shake, (Math.random() - .5) * G.shake); G.shake = Math.max(0, G.shake - 20 / 60); }
  drawBackdrop();
  drawRoad();
  for (const c of pickups) drawCoin(c);
  for (const it of items) drawItem(it);
  for (const o of obstacles) drawObstacle(o);
  drawPlayer();
  drawParticles(ctx, G.t); drawTexts(ctx, FB);
  ctx.restore();
  drawHud();
  drawBanner();
}

// ---------- nền parallax theo chặng ----------
function drawBackdrop() {
  if (G.mix > 0) { paintZone(G.prevZone); ctx.globalAlpha = 1 - G.mix; }
  paintZone(G.zone);
  ctx.globalAlpha = 1;
}
function paintZone(i) {
  const z = ZONES[i], sc = G.scroll;
  const sky = ctx.createLinearGradient(0, 0, 0, 540);
  sky.addColorStop(0, z.sky[0]); sky.addColorStop(1, z.sky[1]);
  ctx.fillStyle = sky; ctx.fillRect(-10, -10, 980, 560);
  if (i === 0) paintRice(z, sc);
  else if (i === 1) paintBamboo(z, sc);
  else paintRiver(z, sc);
}
function tiled(period, offset, fn) {
  const start = -((offset % period) + period) % period;
  for (let x = start - period; x < 960 + period; x += period) fn(x);
}
function paintRice(z, sc) {
  ctx.fillStyle = z.far;
  tiled(360, sc * .15, x => {
    ctx.beginPath(); ctx.moveTo(x, 300); ctx.quadraticCurveTo(x + 120, 200, x + 240, 300); ctx.lineTo(x + 360, 300); ctx.lineTo(x + 360, 360); ctx.lineTo(x, 360); ctx.fill();
  });
  for (const x of [60, 210, 760, 900]) {
    ctx.fillStyle = shade(z.far, -20); rr(ctx, x, 262, 46, 28, 3); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 6, 262); ctx.lineTo(x + 23, 240); ctx.lineTo(x + 52, 262); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = z.mid;
  ctx.fillRect(0, 340, 960, 200);
  for (let k = 0; k < 9; k++) {
    const y = 340 + ((k * 26 + sc * .7) % 200);
    ctx.fillStyle = `rgba(200,240,255,${.12 + (k % 3) * .05})`; ctx.fillRect(0, y, 960, 3);
  }
  for (const [x0, w] of [[0, ROAD_L], [ROAD_R, 960 - ROAD_R]]) {
    for (let y = 340 - ((sc % 60) + 60) % 60; y < 540; y += 60) {
      ctx.fillStyle = z.edge; ctx.fillRect(x0, y, w, 30);
      ctx.fillStyle = z.mid; ctx.fillRect(x0, y + 30, w, 30);
    }
  }
}
function paintBamboo(z, sc) {
  ctx.fillStyle = z.far;
  tiled(90, sc * .2, x => ctx.fillRect(x + 10, 0, 14, 540));
  ctx.fillStyle = shade(z.far, 20);
  tiled(90, sc * .2, x => { for (let y = 40; y < 540; y += 90) ctx.fillRect(x + 6, y, 22, 4); });
  for (const side of [0, 1]) {
    const bx = side ? ROAD_R + 40 : 60;
    tiled(120, sc * .6, x => {
      const px = bx + (x % 240 + 240) % 240 - 120;
      ctx.fillStyle = z.mid; ctx.fillRect(px, 0, 18, 540);
      ctx.fillStyle = shade(z.mid, 25); for (let y = 30; y < 540; y += 70) ctx.fillRect(px - 3, y, 24, 5);
      ell(ctx, px + 9, 90 + (x % 3) * 10, 46, 20, z.edge, .3);
    });
  }
}
function paintRiver(z, sc) {
  ctx.fillStyle = z.far;
  ctx.fillRect(0, 0, 960, 540);
  ctx.strokeStyle = 'rgba(220,245,255,.35)'; ctx.lineWidth = 3;
  for (let k = 0; k < 14; k++) {
    const y = (k * 42 + sc * .25) % 540;
    tiled(160, sc * .4 + k * 37, x => { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 40, y - 8, x + 80, y); ctx.stroke(); });
  }
  for (const side of [0, 1]) {
    const x0 = side ? ROAD_R : 0, w = side ? 960 - ROAD_R : ROAD_L;
    ctx.fillStyle = z.edge; ctx.fillRect(x0, 0, w, 540);
    ctx.fillStyle = z.mid;
    for (let y = -((sc % 46) + 46) % 46; y < 540; y += 46) ctx.fillRect(x0, y, w, 6);
  }
}

// ---------- mặt đường ----------
function drawRoad() {
  ctx.fillStyle = ZONES[G.zone].road; ctx.fillRect(ROAD_L, 0, ROAD_R - ROAD_L, 540);
  ctx.fillStyle = 'rgba(0,0,0,.12)';
  for (let y = -((G.scroll % 90) + 90) % 90; y < 540; y += 90) ctx.fillRect(ROAD_L, y, ROAD_R - ROAD_L, 3);
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 3; ctx.setLineDash([30, 40]); ctx.lineDashOffset = -G.scroll;
  [370, 590].forEach(x => { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 540); ctx.stroke(); });
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(40,30,20,.35)'; ctx.fillRect(ROAD_L, 0, 6, 540); ctx.fillRect(ROAD_R - 6, 0, 6, 540);
}

// ---------- chướng ngại ----------
function drawObstacle(o) {
  const x = LANES_X[o.lane], y = o.y;
  if (o.kind === 'block') drawFence(x, y);
  else if (o.kind === 'jump') drawCart(x, y);
  else drawGate(x, y);
}
function drawFence(x, y) {
  ell(ctx, x, y + 12, 100, 9, 'rgba(0,0,0,.22)');
  ctx.strokeStyle = WOOD_DARK; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 96, y - 2); ctx.lineTo(x + 96, y - 2); ctx.moveTo(x - 96, y + 8); ctx.lineTo(x + 96, y + 8); ctx.stroke();
  for (let i = -4; i <= 4; i++) {
    const sx = x + i * 24, col = i % 2 ? shade(WOOD, -12) : WOOD;
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(sx - 9, y + 14); ctx.lineTo(sx - 9, y - 18); ctx.lineTo(sx, y - 30); ctx.lineTo(sx + 9, y - 18); ctx.lineTo(sx + 9, y + 14); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = WOOD_DARK; ctx.lineWidth = 1.5; ctx.stroke();
  }
  ctx.fillStyle = '#d9c7a0'; ctx.fillRect(x - 96, y - 5, 192, 2);
}
function drawCart(x, y) {
  ell(ctx, x, y + 22, 84, 10, 'rgba(0,0,0,.22)');
  ctx.fillStyle = WOOD; rr(ctx, x - 72, y - 26, 144, 30, 6); ctx.fill();
  ctx.strokeStyle = WOOD_DARK; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = shade(WOOD, -20); ctx.fillRect(x - 72, y - 8, 144, 4);
  ell(ctx, x, y - 36, 58, 16, '#e8c15a');
  ctx.fillStyle = '#c99a3a';
  for (let i = -3; i <= 3; i++) ctx.fillRect(x + i * 14 - 2, y - 44 + (i % 2) * 3, 4, 4);
  for (const wx of [x - 52, x + 52]) {
    ctx.strokeStyle = WOOD_DARK; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(wx, y + 6, 18, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = WOOD; ctx.lineWidth = 2;
    for (let k = 0; k < 4; k++) { const a = G.t * 6 + k * Math.PI / 2; ctx.beginPath(); ctx.moveTo(wx, y + 6); ctx.lineTo(wx + Math.cos(a) * 15, y + 6 + Math.sin(a) * 15); ctx.stroke(); }
    ell(ctx, wx, y + 6, 3, 3, WOOD_DARK);
  }
}
function drawGate(x, y) {
  ell(ctx, x - 96, y + 14, 10, 4, 'rgba(0,0,0,.2)'); ell(ctx, x + 96, y + 14, 10, 4, 'rgba(0,0,0,.2)');
  for (const px of [x - 96, x + 96]) { ctx.fillStyle = BAMBOO_DARK; rr(ctx, px - 8, y - 78, 16, 92, 4); ctx.fill(); }
  ctx.fillStyle = BAMBOO; rr(ctx, x - 100, y - 36, 200, 20, 9); ctx.fill();
  ctx.strokeStyle = BAMBOO_DARK; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = BAMBOO_DARK; for (const nx of [x - 60, x, x + 60]) ctx.fillRect(nx - 2, y - 36, 4, 20);
  ctx.strokeStyle = '#c9a449'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 96, y - 16); ctx.lineTo(x + 96, y - 16); ctx.stroke();
  ctx.fillStyle = '#b3261e'; rr(ctx, x - 22, y - 62, 44, 16, 4); ctx.fill();
}

// ---------- xu & vật phẩm ----------
function drawCoin(c) {
  const x = LANES_X[c.lane], y = c.y, mag = P.fx.magnet > 0 && c.lane === P.lane;
  if (mag) ell(ctx, x, y, 22, 22, 'rgba(255,107,107,.18)');
  ell(ctx, x, y, 11, 11, '#e9b949'); ell(ctx, x, y, 6, 6, '#a07a22');
  ell(ctx, x - 3, y - 3, 2.5, 2.5, '#fff6d0');
}
function drawItem(it) {
  const def = ITEMS[it.kind], x = LANES_X[it.lane], y = it.y, p = 1 + Math.sin(G.t * 6) * .07;
  ell(ctx, x, y, 30 * p, 30 * p, 'rgba(255,255,255,.22)');
  ell(ctx, x, y, 24 * p, 24 * p, def.col);
  ctx.strokeStyle = shade(def.col, -50); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 24 * p, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#3a2a18'; ctx.strokeStyle = '#3a2a18'; ctx.lineCap = 'round';
  if (it.kind === 'shield') {
    ctx.beginPath(); ctx.moveTo(x - 10, y - 11); ctx.lineTo(x + 10, y - 11); ctx.lineTo(x + 10, y + 1); ctx.quadraticCurveTo(x, y + 13, x - 10, y + 1); ctx.closePath(); ctx.fill();
  } else if (it.kind === 'boots') {
    ell(ctx, x - 3, y + 2, 9, 6, '#3a2a18'); ell(ctx, x + 6, y + 6, 6, 4, '#3a2a18');
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 12, y - 8); ctx.lineTo(x - 2, y - 2); ctx.moveTo(x + 2, y - 10); ctx.lineTo(x + 12, y - 4); ctx.stroke();
  } else {
    ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y + 1, 9, Math.PI, 0); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 9, y + 1); ctx.lineTo(x - 9, y + 9); ctx.moveTo(x + 9, y + 1); ctx.lineTo(x + 9, y + 9); ctx.stroke();
  }
}

// ---------- nhân vật ----------
function drawPlayer() {
  const jumpOff = P.jumpT > 0 ? -Math.sin((1 - P.jumpT / JUMP_DUR) * Math.PI) * 70 : 0;
  const x = LANES_X[P.lane], y = PLAYER_Y + jumpOff;
  groundShadow(ctx, x, PLAYER_Y, jumpOff ? .6 : 1);
  if (P.fx.boots > 0) {
    ctx.strokeStyle = 'rgba(127,211,255,.6)'; ctx.lineWidth = 3;
    for (let k = 0; k < 3; k++) { const yy = PLAYER_Y - 50 + k * 26 + (G.t * 300) % 26; ctx.beginPath(); ctx.moveTo(x - 46 - k * 6, yy); ctx.lineTo(x - 70 - k * 6, yy); ctx.moveTo(x + 46 + k * 6, yy); ctx.lineTo(x + 70 + k * 6, yy); ctx.stroke(); }
  }
  const pose = P.ducking ? { legF: .2, legB: -.2, armF: .1, armB: -.1, bob: -16 } : P.jumpT > 0 ? POSES.air() : POSES.run({ walk: P.walk });
  drawChibi(ctx, x, y, HERO, { face: P.face, t: G.t, ...pose });
  if (P.fx.shield > 0) {
    const r = 62 + Math.sin(G.t * 8) * 3;
    ctx.fillStyle = 'rgba(233,185,73,.12)'; ctx.beginPath(); ctx.arc(x, y - 50, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(233,185,73,.85)'; ctx.lineWidth = 4; ctx.stroke();
  }
}

// ---------- HUD & banner ----------
function drawHud() {
  const m = G.dist / 20, z = ZONES[G.zone], next = ZONES[G.zone + 1];
  const to = next ? next.from : z.from + 40, k = Math.min(1, (m - z.from) / (to - z.from));
  ctx.textAlign = 'left';
  outlinedText(ctx, `${Math.floor(m)} m`, 16, 40, `30px ${FD}`, '#ffe6a8');
  outlinedText(ctx, z.name, 16, 66, `18px ${FB}`, '#fff');
  ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(ctx, 16, 76, 180, 8, 4); ctx.fill();
  ctx.fillStyle = '#e9b949'; rr(ctx, 16, 76, Math.max(8, 180 * k), 8, 4); ctx.fill();

  ctx.textAlign = 'right';
  ell(ctx, 916, 30, 11, 11, '#e9b949'); ell(ctx, 916, 30, 6, 6, '#a07a22');
  outlinedText(ctx, `${G.coins}`, 898, 38, `26px ${FD}`, '#fff');
  let row = 0;
  for (const key of Object.keys(P.fx)) {
    if (!(P.fx[key] > 0)) continue;
    const def = ITEMS[key], y = 150 + row++ * 24;
    outlinedText(ctx, def.name, 800, y + 6, `16px ${FB}`, def.col);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(ctx, 812, y - 4, 104, 10, 4); ctx.fill();
    ctx.fillStyle = def.col; rr(ctx, 812, y - 4, Math.max(6, 104 * P.fx[key] / def.dur), 10, 4); ctx.fill();
  }
}
function drawBanner() {
  if (banner.t <= 0 || !banner.txt) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, banner.t * 2);
  ctx.font = `22px ${FB}`;
  const tw = ctx.measureText(banner.txt).width + 40;
  ctx.fillStyle = 'rgba(20,14,10,.72)'; rr(ctx, 480 - tw / 2, 84, tw, 40, 12); ctx.fill();
  ctx.textAlign = 'center';
  outlinedText(ctx, banner.txt, 480, 112, `22px ${FB}`, '#fff');
  ctx.restore();
}
