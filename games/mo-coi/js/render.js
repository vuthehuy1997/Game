import { $ } from '../../../platform/core/util.js';
import { ell, rr, outlinedText } from '../../../platform/art/draw.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { MAPS, G } from './state.js';
import { S, curMap } from './save.js';
import { isVisible, canAttack } from './conquest.js';
import { BOARD, tileRect } from './layout.js';

const cv = $('cv'), ctx = cv.getContext('2d');
const LAND = { p: ['#6b8f3a', '#5a7d30'], h: ['#7a8552', '#65704a'], f: ['#355f32', '#284b27'], k: ['#8a8170', '#6e6759'], r: ['#2f6f8f', '#245b77'] };
const MINE = '#7bd389', ENEMY = '#e0604e', GOLD = '#ffd35a';

export function render() {
  const map = curMap();
  drawBackdrop();
  for (let i = 0; i < S.owner.length; i++) drawTile(i, map);
  drawMarches(map);
  drawHud();
  drawLog();
}

function drawBackdrop() {
  const g = ctx.createLinearGradient(0, 0, 0, 540);
  g.addColorStop(0, '#2a3a4a'); g.addColorStop(.2, '#3d5a4a'); g.addColorStop(1, '#1a1f18');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 540);
  ctx.fillStyle = 'rgba(20,30,28,.6)';
  ctx.beginPath(); ctx.moveTo(0, 70);
  for (let x = 0; x <= 960; x += 60) ctx.lineTo(x, 50 + Math.sin(x * .02) * 14 + ((x / 60) % 2) * 8);
  ctx.lineTo(960, 84); ctx.lineTo(0, 84); ctx.closePath(); ctx.fill();
}

function drawTile(i, map) {
  const r = tileRect(i, map), t = map.terrain[i], [base, dark] = LAND[t];
  const owned = !!S.owner[i], seen = isVisible(i);
  const selected = G.selected === i, target = G.selected !== null && canAttack(G.selected, i);
  ctx.save();
  rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.clip();
  const g = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
  g.addColorStop(0, base); g.addColorStop(1, dark);
  ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.w, r.h);
  decorate(t, r);
  if (owned) { ctx.fillStyle = 'rgba(60,160,110,.22)'; ctx.fillRect(r.x, r.y, r.w, r.h); }
  else if (seen && t !== 'r') { ctx.fillStyle = 'rgba(160,50,40,.18)'; ctx.fillRect(r.x, r.y, r.w, r.h); }
  if (!seen && !owned) { ctx.fillStyle = 'rgba(8,10,12,.82)'; ctx.fillRect(r.x, r.y, r.w, r.h); }
  ctx.restore();

  rr(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.lineWidth = selected ? 4 : 2;
  ctx.strokeStyle = selected ? GOLD : target ? '#fff' : owned ? MINE : 'rgba(255,255,255,.22)';
  if (target) ctx.setLineDash([8, 6]);
  ctx.stroke(); ctx.setLineDash([]);

  if (t === 'r') return;
  if (!seen && !owned) { drawFog(r); return; }
  drawBanner(r, owned);
  drawTroops(r, i, owned);
}

// Chi tiết theo địa hình: sóng nước, đồi, cây rừng, tường thành
function decorate(t, r) {
  const T = performance.now() / 900;
  if (t === 'r') {
    ctx.strokeStyle = 'rgba(200,235,255,.35)'; ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      for (let x = r.x; x <= r.x + r.w; x += 8) ctx.lineTo(x, r.y + r.h * (.3 + k * .25) + Math.sin(x * .08 + T + k) * 3);
      ctx.stroke();
    }
  } else if (t === 'h') {
    ell(ctx, r.x + r.w * .3, r.y + r.h * .85, r.w * .4, r.h * .32, '#56603a');
    ell(ctx, r.x + r.w * .72, r.y + r.h * .9, r.w * .36, r.h * .28, '#4b5532');
  } else if (t === 'f') {
    for (let k = 0; k < 5; k++) {
      const x = r.x + r.w * (.12 + k * .19), y = r.y + r.h * (.7 + (k % 2) * .08);
      ctx.fillStyle = '#1e3b1e'; ctx.beginPath(); ctx.moveTo(x, y - r.h * .32); ctx.lineTo(x - 9, y); ctx.lineTo(x + 9, y); ctx.closePath(); ctx.fill();
    }
  } else if (t === 'k') {
    ctx.fillStyle = '#4e4739'; rr(ctx, r.x + r.w * .22, r.y + r.h * .4, r.w * .56, r.h * .5, 4); ctx.fill();
    ctx.fillStyle = '#3a3428';
    for (let k = 0; k < 4; k++) ctx.fillRect(r.x + r.w * (.22 + k * .19), r.y + r.h * .34, r.w * .07, r.h * .08);
  } else {
    ctx.strokeStyle = 'rgba(40,70,30,.35)'; ctx.lineWidth = 2;
    for (let k = 0; k < 4; k++) { const x = r.x + r.w * (.15 + k * .22), y = r.y + r.h * .8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 3, y - 8); ctx.stroke(); }
  }
}

function drawFog(r) {
  ctx.fillStyle = '#c9d2c0'; ctx.globalAlpha = .18; ctx.font = `bold ${Math.round(r.h * .5)}px ${FD}`;
  ctx.textAlign = 'center'; ctx.fillText('?', r.x + r.w / 2, r.y + r.h * .7); ctx.globalAlpha = 1;
}

function drawBanner(r, owned) {
  const px = r.x + r.w * .14, top = r.y + r.h * .12, bottom = r.y + r.h * .62;
  ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(px, bottom); ctx.lineTo(px, top); ctx.stroke();
  const wave = Math.sin(performance.now() / 260 + px) * 3, col = owned ? '#2f8f5a' : '#b3261e';
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(px, top);
  ctx.quadraticCurveTo(px + r.w * .14, top + 4 + wave, px + r.w * .28, top + 1);
  ctx.lineTo(px + r.w * .26, top + r.h * .18 + wave); ctx.quadraticCurveTo(px + r.w * .14, top + r.h * .14 - wave, px, top + r.h * .2);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = owned ? MINE : ENEMY; ctx.lineWidth = 1.5; ctx.stroke();
}

// Quân hiển thị bằng các hình người nhỏ, tối đa 5, cộng số lượng ở góc
function drawTroops(r, i, owned) {
  const n = Math.min(5, Math.max(1, Math.round(S.troops[i] / 8))), sy = r.y + r.h * .86;
  for (let k = 0; k < n; k++) {
    const x = r.x + r.w * .18 + k * 14;
    ell(ctx, x, sy - 9, 4.5, 4.5, owned ? '#f6d2ae' : '#e3b98f');
    rr(ctx, x - 4, sy - 5, 8, 11, 3); ctx.fillStyle = owned ? '#2f6b57' : '#7a2d2d'; ctx.fill();
  }
  ctx.textAlign = 'right';
  outlinedText(ctx, String(Math.floor(S.troops[i])), r.x + r.w - 10, r.y + r.h - 8, `bold 20px ${FB}`, '#fff');
  ctx.textAlign = 'left';
}

function drawMarches(map) {
  for (const m of G.marches) {
    const a = tileRect(m.from, map), b = tileRect(m.to, map);
    const ax = a.x + a.w / 2, ay = a.y + a.h / 2, bx = b.x + b.w / 2, by = b.y + b.h / 2;
    const p = Math.min(1, m.t), x = ax + (bx - ax) * p, y = ay + (by - ay) * p;
    ctx.strokeStyle = m.mine ? MINE : ENEMY; ctx.lineWidth = 3; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(x, y); ctx.stroke(); ctx.setLineDash([]);
    ell(ctx, x, y, 8, 8, m.mine ? '#e8fff0' : '#ffd6cf');
    ell(ctx, x, y, 4, 4, m.mine ? MINE : ENEMY);
  }
}

function drawHud() {
  const mine = S.owner.filter(o => o === 1).length, total = S.owner.length;
  ctx.textAlign = 'left';
  outlinedText(ctx, `Ải ${S.stage + 1}/${MAPS.length} · ${MAPS[S.stage].name}`, 210, 46, `26px ${FD}`, '#ffe6a8');
  ctx.textAlign = 'right';
  outlinedText(ctx, `Vùng ta: ${mine}/${total}`, 920, 46, `20px ${FB}`, '#fff');
  ctx.textAlign = 'left';
  outlinedText(ctx, G.selected !== null ? 'Chọn ô kề để xuất quân' : 'Bấm vùng của ta để chọn quân', 210, 72, `15px ${FB}`, '#d8dccd', 'rgba(20,14,10,.85)', 3);
}

function drawLog() {
  const x = 40, y0 = 428;
  ctx.fillStyle = 'rgba(10,12,14,.55)'; rr(ctx, x - 8, y0 - 10, 520, 104, 8); ctx.fill();
  ctx.textAlign = 'left';
  G.log.forEach((e, k) => {
    const age = G.t - e.at, a = Math.max(.35, 1 - age / 12);
    ctx.globalAlpha = a;
    outlinedText(ctx, e.text, x, y0 + 18 + k * 22, `16px ${FB}`, e.text.includes('Giặc') ? '#ffb4a8' : '#cdeccf', 'rgba(0,0,0,.8)', 3);
  });
  ctx.globalAlpha = 1;
}
