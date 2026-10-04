import { $ } from '../../../platform/core/util.js';
import { ell, outlinedText } from '../../../platform/art/draw.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { GRID_N, CELL, ORIGIN_X, ORIGIN_Y, COLORS, G, grid } from './state.js';
import { LEVELS } from './data.js';

const cv = $('cv'), ctx = cv.getContext('2d');

export function render() {
  ctx.fillStyle = '#12141a'; ctx.fillRect(0, 0, 960, 540);
  for (let y = 0; y < GRID_N; y++) for (let x = 0; x < GRID_N; x++) {
    const i = y * GRID_N + x, cx = ORIGIN_X + x * CELL + CELL / 2, cy = ORIGIN_Y + y * CELL + CELL / 2;
    ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.strokeRect(ORIGIN_X + x * CELL, ORIGIN_Y + y * CELL, CELL, CELL);
    const c = grid[i]; if (!c) continue;
    ell(ctx, cx, cy, CELL * .38, CELL * .38, COLORS[c - 1]);
    if (i === G.selected) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, CELL * .44, 0, Math.PI * 2); ctx.stroke(); }
  }
  ctx.textAlign = 'left'; outlinedText(ctx, `Điểm: ${G.score}`, 16, 30, `22px ${FD}`, '#ffe6a8');
  ctx.textAlign = 'right';
  const target = LEVELS[G.level] ? LEVELS[G.level].target : 0;
  outlinedText(ctx, `Mục tiêu: ${target}`, 944, 30, `16px ${FB}`, '#fff');
  outlinedText(ctx, `Lượt: ${G.movesLeft}`, 944, 52, `16px ${FB}`, '#ffd35a');
}
