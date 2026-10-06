import { $ } from '../../../platform/core/util.js';
import { ell, rr, shade, outlinedText } from '../../../platform/art/draw.js';
import { drawParticles, drawTexts } from '../../../platform/core/fx.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { GRID_N, CELL, ORIGIN_X as BX, ORIGIN_Y as BY, COLORS, SP_ROW, SP_COL, SP_JEWEL, G, grid, special, offX, offY, pops, beams } from './state.js';
import { LEVELS, chapterOf } from './data.js';

const cv = $('cv'), ctx = cv.getContext('2d');
const BW = GRID_N * CELL, R = CELL * .38;
const center = (i, ox = 0, oy = 0) => [BX + (i % GRID_N + ox) * CELL + CELL / 2, BY + ((i / GRID_N | 0) + oy) * CELL + CELL / 2];

export function render() {
  drawBackground();
  drawBoard();
  drawGems();
  drawPops();
  drawBeams();
  drawParticles(ctx, G.t);
  drawTexts(ctx, FB);
  drawHud();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, 540);
  sky.addColorStop(0, '#1b1d33'); sky.addColorStop(.6, '#2c2446'); sky.addColorStop(1, '#0c0d16');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, 960, 540);
  for (let k = 0; k < 46; k++) {
    ctx.fillStyle = `rgba(255,246,214,${Math.max(0, .25 + .35 * Math.sin(G.t * 2 + k))})`;
    ctx.fillRect((k * 367) % 960, (k * 211) % 260, 2, 2);
  }
  const glow = ctx.createRadialGradient(780, 110, 10, 780, 110, 130);
  glow.addColorStop(0, 'rgba(255,240,200,.9)'); glow.addColorStop(.3, 'rgba(255,220,150,.3)'); glow.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.fillStyle = glow; ctx.fillRect(640, 0, 320, 300);
  ctx.fillStyle = '#fff3d6'; ctx.beginPath(); ctx.arc(780, 110, 30, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0b0c14'; ctx.beginPath(); ctx.moveTo(0, 540);
  for (let x = 0; x <= 960; x += 12) ctx.lineTo(x, 506 - 16 * Math.abs(Math.sin(x * .011)) - 8 * Math.sin(x * .047 + 1));
  ctx.lineTo(960, 540); ctx.closePath(); ctx.fill();
  for (let k = 0; k < 14; k++) {
    const x = ((k * 131 + G.t * 22 + 30 * Math.sin(G.t + k)) % 980) - 10;
    const y = ((k * 73 + G.t * 38) % 580) - 20;
    ell(ctx, x, y, 4, 2.2, 'rgba(255,170,190,.55)', G.t * 2 + k);
  }
}

function drawBoard() {
  const p = 18;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 28; ctx.shadowOffsetY = 10;
  const stone = ctx.createLinearGradient(0, BY - p, 0, BY + BW + p);
  stone.addColorStop(0, '#7a6a48'); stone.addColorStop(.5, '#453a28'); stone.addColorStop(1, '#221c12');
  ctx.fillStyle = stone; rr(ctx, BX - p, BY - p, BW + 2 * p, BW + 2 * p, 22); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#e2c27a'; ctx.lineWidth = 2.5;
  rr(ctx, BX - p + 5, BY - p + 5, BW + 2 * p - 10, BW + 2 * p - 10, 17); ctx.stroke();
  ctx.fillStyle = '#15152a'; rr(ctx, BX - 6, BY - 6, BW + 12, BW + 12, 12); ctx.fill();
  for (let y = 0; y < GRID_N; y++) for (let x = 0; x < GRID_N; x++) {
    ctx.fillStyle = (x + y) % 2 ? '#24243d' : '#1e1e35';
    rr(ctx, BX + x * CELL + 2, BY + y * CELL + 2, CELL - 4, CELL - 4, 9); ctx.fill();
  }
  for (const [x, y] of [[-p + 10, -p + 10], [BW + p - 10, -p + 10], [-p + 10, BW + p - 10], [BW + p - 10, BW + p - 10]]) {
    ell(ctx, BX + x, BY + y, 5, 5, '#e2c27a');
  }
}

function drawGems() {
  ctx.save();
  ctx.beginPath(); ctx.rect(BX - 4, BY - 4, BW + 8, BW + 8); ctx.clip();
  for (let i = 0; i < grid.length; i++) {
    const c = grid[i]; if (!c) continue;
    const [cx, cy] = center(i, offX[i], offY[i]);
    drawGem(cx, cy, R, c, special[i], i === G.selected);
  }
  ctx.restore();
}

function drawGem(cx, cy, r, c, sp, sel) {
  const col = COLORS[c - 1], t = G.t;
  ell(ctx, cx + 2, cy + r * .78, r * .8, r * .26, 'rgba(0,0,0,.4)');
  const g = ctx.createRadialGradient(cx - r * .35, cy - r * .4, r * .08, cx, cy, r * 1.1);
  g.addColorStop(0, shade(col, 120)); g.addColorStop(.45, col); g.addColorStop(1, shade(col, -95));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = shade(col, -70); ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.beginPath(); ctx.ellipse(cx - r * .36, cy - r * .42, r * .3, r * .16, -.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.arc(cx + r * .32, cy + r * .34, r * .14, 0, Math.PI * 2); ctx.fill();
  if (sp === SP_ROW || sp === SP_COL) {
    ctx.fillStyle = `rgba(255,255,255,${.55 + .4 * Math.sin(t * 7)})`;
    if (sp === SP_ROW) ctx.fillRect(cx - r * .85, cy - r * .16, r * 1.7, r * .32);
    else ctx.fillRect(cx - r * .16, cy - r * .85, r * .32, r * 1.7);
  } else if (sp === SP_JEWEL) {
    for (let k = 0; k < 3; k++) {
      ctx.strokeStyle = COLORS[(c + k + 1) % COLORS.length]; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(cx, cy, r * (.35 + k * .18), 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, r * .16, 0, Math.PI * 2); ctx.fill();
  }
  if (sel) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, r * 1.16, 0, Math.PI * 2); ctx.stroke(); }
}

function drawPops() {
  for (const p of pops) {
    const k = p.t / p.dur, [cx, cy] = center(p.i);
    ctx.save();
    ctx.globalAlpha = 1 - k;
    ctx.translate(cx, cy); ctx.scale(1 + k * .7, 1 + k * .7); ctx.translate(-cx, -cy);
    drawGem(cx, cy, R, p.col, p.sp, false);
    ctx.restore();
  }
}

function drawBeams() {
  for (const b of beams) {
    const k = b.t / b.dur;
    ctx.save();
    ctx.globalAlpha = 1 - k;
    if (b.dir === 'ring') {
      const [cx, cy] = center(b.i);
      ctx.strokeStyle = '#fff3c4'; ctx.lineWidth = 4 * (1 - k) + 1;
      ctx.beginPath(); ctx.arc(cx, cy, CELL * (.3 + k * 1.6), 0, Math.PI * 2); ctx.stroke();
    } else {
      const [cx, cy] = center(b.i), th = CELL * .5 * (1 - k * .5);
      ctx.fillStyle = 'rgba(255,246,214,.85)';
      if (b.dir === 'h') ctx.fillRect(BX, cy - th / 2, BW, th);
      else ctx.fillRect(cx - th / 2, BY, th, BW);
    }
    ctx.restore();
  }
}

function drawHud() {
  const L = LEVELS[G.level];
  if (!L || G.mode === 'menu') return;
  const ch = chapterOf(G.level);
  ctx.textAlign = 'left';
  outlinedText(ctx, ch.name.toUpperCase(), 24, 74, `15px ${FB}`, '#caa65a');
  outlinedText(ctx, `Màn ${G.level + 1}`, 24, 110, `30px ${FD}`, '#fff');
  outlinedText(ctx, L.title, 24, 138, `17px ${FB}`, '#e9dcb8');
  outlinedText(ctx, 'Điểm', 24, 186, `16px ${FB}`, '#a3a8b8');
  outlinedText(ctx, String(G.score), 24, 226, `44px ${FD}`, '#ffe6a8');
  const x0 = 24, w = 200, y0 = 246, h = 16, k = Math.min(1, G.score / (L.target * 2));
  ctx.fillStyle = 'rgba(0,0,0,.45)'; rr(ctx, x0, y0, w, h, 8); ctx.fill();
  if (k > 0) {
    const bar = ctx.createLinearGradient(x0, 0, x0 + w, 0);
    bar.addColorStop(0, '#e9b949'); bar.addColorStop(1, '#ffe6a8');
    ctx.fillStyle = bar; rr(ctx, x0, y0, Math.max(h, w * k), h, 8); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  for (const r of [.5, .75, 1]) ctx.fillRect(x0 + w * r - 1, y0 - 3, 2, h + 6);
  outlinedText(ctx, `Mục tiêu ${L.target}`, x0, 290, `16px ${FB}`, '#fff');

  ctx.textAlign = 'right';
  outlinedText(ctx, 'Lượt còn', 936, 186, `16px ${FB}`, '#a3a8b8');
  outlinedText(ctx, String(G.movesLeft), 936, 240, `52px ${FD}`, '#ffd35a');
  for (let i = 0; i < L.moves; i++) {
    ell(ctx, 936 - 9 - (i % 8) * 18, 262 + ((i / 8) | 0) * 18, 6, 6, i < G.movesLeft ? '#ffd35a' : 'rgba(255,255,255,.15)');
  }
  outlinedText(ctx, 'Nối 4: ngọc hàng / cột', 896, 336, `15px ${FB}`, '#e9dcb8');
  drawGem(920, 330, 11, 2, SP_ROW, false);
  outlinedText(ctx, 'Nối 5: ngọc vạn năng', 896, 376, `15px ${FB}`, '#e9dcb8');
  drawGem(920, 370, 11, 5, SP_JEWEL, false);
}
