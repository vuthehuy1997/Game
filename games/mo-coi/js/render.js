import { $ } from '../../../platform/core/util.js';
import { ell, rr, outlinedText } from '../../../platform/art/draw.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { MAPS, G, HOME } from './state.js';
import { S, curMap } from './save.js';
import { isVisible, canAttack } from './conquest.js';
import { BOARD } from './layout.js';

const cv = $('cv'), ctx = cv.getContext('2d');
const PAPER = ['#f1e3b8', '#c9a766'], INK = '#3a2a18', HEADER = '#3b2a1a';
const BASE = { p: '#c9d18a', h: '#dcc38a', f: '#a9bb82', k: '#d8cdb8', r: '#8fb6c4' };
const MINE_INK = '#2f7a4a', ENEMY_INK = '#a8291f', GOLD = '#d9a533';
const TREES = [[.22, .5], [.5, .4], [.78, .5], [.34, .78], [.66, .8], [.9, .74]];

function cellRect(i, map) {
  const cw = BOARD.w / map.cols, ch = BOARD.h / map.rows, c = i % map.cols, r = (i / map.cols) | 0;
  return { x: BOARD.x + c * cw, y: BOARD.y + r * ch, w: cw, h: ch };
}

export function render() {
  const map = curMap();
  drawBackdrop();
  for (let i = 0; i < S.owner.length; i++) drawTile(i, map);
  drawMarches(map);
  drawHud();
  drawLog();
}

function drawBackdrop() {
  const g = ctx.createRadialGradient(480, 300, 120, 480, 300, 620);
  g.addColorStop(0, PAPER[0]); g.addColorStop(1, PAPER[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 540);
  ctx.fillStyle = HEADER; ctx.fillRect(0, 0, 960, 80);
  ctx.fillStyle = GOLD; ctx.fillRect(0, 80, 960, 3);
  ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(BOARD.x - 6, BOARD.y - 6, BOARD.w + 12, BOARD.h + 12);
  drawCompass(880, 470, 34);
}

function drawCompass(x, y, r) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.moveTo(0, -r + 4); ctx.lineTo(6, 0); ctx.lineTo(0, 6); ctx.lineTo(-6, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = ENEMY_INK; ctx.beginPath(); ctx.moveTo(0, -r + 4); ctx.lineTo(6, 0); ctx.lineTo(0, -4); ctx.closePath(); ctx.fill();
  ctx.textAlign = 'center'; ctx.font = `bold 13px ${FB}`; ctx.fillStyle = INK; ctx.fillText('B', 0, -r - 5);
  ctx.restore();
}

function drawTile(i, map) {
  const c = cellRect(i, map), t = map.terrain[i];
  const owned = !!S.owner[i], seen = isVisible(i);
  const selected = G.selected === i, target = G.selected !== null && canAttack(G.selected, i);
  ctx.save();
  ctx.beginPath(); ctx.rect(c.x, c.y, c.w, c.h); ctx.clip();
  ctx.fillStyle = BASE[t]; ctx.fillRect(c.x, c.y, c.w, c.h);
  if (!seen) drawFog(c);
  else drawTerrain(t, c);
  ctx.restore();

  ctx.lineWidth = selected ? 5 : 2;
  ctx.strokeStyle = selected ? GOLD : INK;
  ctx.globalAlpha = selected ? 1 : .55;
  if (target) ctx.setLineDash([8, 6]);
  ctx.strokeRect(c.x + 1, c.y + 1, c.w - 2, c.h - 2);
  ctx.setLineDash([]); ctx.globalAlpha = 1;

  if (!seen) return;
  if (t !== 'r') drawCamp(c, owned, i === HOME);
  if (t !== 'r') drawBadge(c, i, owned);
}

function drawFog(c) {
  ctx.fillStyle = 'rgba(70,55,35,.55)'; ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.strokeStyle = 'rgba(30,20,10,.25)'; ctx.lineWidth = 2;
  for (let k = -c.h; k < c.w; k += 12) { ctx.beginPath(); ctx.moveTo(c.x + k, c.y + c.h); ctx.lineTo(c.x + k + c.h, c.y); ctx.stroke(); }
  ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(243,235,210,.5)'; ctx.font = `bold ${Math.round(c.h * .5)}px ${FD}`;
  ctx.fillText('?', c.x + c.w / 2, c.y + c.h * .7);
}

function drawTerrain(t, c) {
  if (t === 'p') drawPaddies(c);
  else if (t === 'h') drawHills(c);
  else if (t === 'f') drawForest(c);
  else if (t === 'k') drawFortress(c);
  else drawRiver(c);
}

function drawPaddies(c) {
  for (let k = 0; k < 4; k++) {
    const y = c.y + c.h * (.16 + k * .2);
    ctx.fillStyle = k % 2 ? '#b7c96a' : '#a9bd5c'; rr(ctx, c.x + 6, y, c.w - 12, c.h * .12, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(90,110,40,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(c.x + 6, y + c.h * .12); ctx.lineTo(c.x + c.w - 6, y + c.h * .12); ctx.stroke();
  }
  ell(ctx, c.x + c.w * .82, c.y + c.h * .2, c.w * .05, c.w * .05, '#6f8f3a');
}

function drawHills(c) {
  ell(ctx, c.x + c.w * .34, c.y + c.h * .72, c.w * .36, c.h * .3, '#a88b52');
  ell(ctx, c.x + c.w * .72, c.y + c.h * .78, c.w * .32, c.h * .26, '#8f7444');
  ell(ctx, c.x + c.w * .28, c.y + c.h * .58, c.w * .14, c.h * .07, '#c9b07a');
  ctx.strokeStyle = 'rgba(70,90,40,.6)'; ctx.lineWidth = 2;
  for (let k = 0; k < 4; k++) { const x = c.x + c.w * (.12 + k * .24), y = c.y + c.h * .92; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 3, y - 7); ctx.stroke(); }
}

function drawForest(c) {
  for (const [fx, fy] of TREES) {
    const x = c.x + c.w * fx, y = c.y + c.h * fy, s = Math.min(c.w, c.h) * .1;
    ctx.fillStyle = '#6b4a2a'; ctx.fillRect(x - s * .18, y, s * .36, s * .9);
    ell(ctx, x, y - s * .2, s * 1.05, s * 1.05, '#3f6b3a');
    ell(ctx, x - s * .3, y - s * .5, s * .5, s * .5, '#5f8f4f');
  }
}

function drawFortress(c) {
  ctx.fillStyle = '#8a8a86'; rr(ctx, c.x + c.w * .12, c.y + c.h * .42, c.w * .66, c.h * .46, 3); ctx.fill();
  ctx.strokeStyle = '#55534e'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#9b9b96';
  for (let m = 0; m < 5; m++) ctx.fillRect(c.x + c.w * (.14 + m * .13), c.y + c.h * .34, c.w * .07, c.h * .1);
  ctx.fillStyle = '#3a3733'; ctx.beginPath(); ctx.arc(c.x + c.w * .39, c.y + c.h * .88, c.w * .07, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#9a9a95'; rr(ctx, c.x + c.w * .66, c.y + c.h * .18, c.w * .2, c.h * .7, 3); ctx.fill();
  ctx.fillStyle = '#7f7f7a'; ctx.fillRect(c.x + c.w * .66, c.y + c.h * .14, c.w * .06, c.h * .06); ctx.fillRect(c.x + c.w * .8, c.y + c.h * .14, c.w * .06, c.h * .06);
}

function drawRiver(c) {
  const T = performance.now() / 900;
  ctx.strokeStyle = 'rgba(230,246,255,.6)'; ctx.lineWidth = 2.5;
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    for (let x = c.x; x <= c.x + c.w; x += 6) ctx.lineTo(x, c.y + c.h * (.3 + k * .24) + Math.sin(x * .09 + T + k) * 4);
    ctx.stroke();
  }
}

function drawCamp(c, owned, isHome) {
  const s = isHome ? 1.3 : 1, bx = c.x + c.w * .24, by = c.y + c.h * .8;
  ctx.fillStyle = '#7a4a26'; ctx.beginPath(); ctx.moveTo(bx - 14 * s, by - 16 * s); ctx.lineTo(bx, by - 30 * s); ctx.lineTo(bx + 14 * s, by - 16 * s); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#c8a46a'; rr(ctx, bx - 11 * s, by - 16 * s, 22 * s, 16 * s, 2); ctx.fill();
  ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#3a2a18'; ctx.fillRect(bx - 3 * s, by - 8 * s, 6 * s, 8 * s);
  ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx + 14 * s, by - 30 * s); ctx.lineTo(bx + 14 * s, by - 56 * s); ctx.stroke();
  const wave = Math.sin(performance.now() / 260 + bx) * 3;
  ctx.fillStyle = isHome ? GOLD : owned ? MINE_INK : ENEMY_INK;
  ctx.beginPath(); ctx.moveTo(bx + 14 * s, by - 56 * s); ctx.quadraticCurveTo(bx + 24 * s, by - 52 * s + wave, bx + 34 * s, by - 55 * s + wave);
  ctx.lineTo(bx + 30 * s, by - 48 * s); ctx.lineTo(bx + 34 * s, by - 41 * s + wave); ctx.quadraticCurveTo(bx + 24 * s, by - 43 * s - wave, bx + 14 * s, by - 44 * s);
  ctx.closePath(); ctx.fill();
}

function drawBadge(c, i, owned) {
  const n = Math.floor(S.troops[i]), x = c.x + c.w - 24, y = c.y + c.h - 24;
  ctx.save();
  ctx.fillStyle = '#f6ecd0'; ctx.beginPath(); ctx.arc(x, y, 17, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = owned ? MINE_INK : ENEMY_INK; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = INK; ctx.font = `bold 15px ${FB}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(String(n), x, y + 1);
  ctx.restore();
}

function drawMarches(map) {
  for (const m of G.marches) {
    const a = cellRect(m.from, map), b = cellRect(m.to, map);
    const ax = a.x + a.w / 2, ay = a.y + a.h / 2, bx = b.x + b.w / 2, by = b.y + b.h / 2;
    const p = Math.min(1, m.t), x = ax + (bx - ax) * p, y = ay + (by - ay) * p;
    ctx.strokeStyle = m.mine ? MINE_INK : ENEMY_INK; ctx.lineWidth = 3; ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(x, y); ctx.stroke(); ctx.setLineDash([]);
    ell(ctx, x, y, 8, 8, '#f6ecd0');
    ell(ctx, x, y, 4, 4, m.mine ? MINE_INK : ENEMY_INK);
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
