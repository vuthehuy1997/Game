import { $ } from '../../../platform/core/util.js';
import { ell, outlinedText } from '../../../platform/art/draw.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { COLS, ROWS, CELL, TOP_Y, BOARD_X0, SHOOTER_X, SHOOTER_Y, COLORS, G, grid, proj } from './state.js';

const cv = $('cv'), ctx = cv.getContext('2d');

export function render() {
  ctx.fillStyle = '#12141a'; ctx.fillRect(0, 0, 960, 540);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (!grid[r][c]) continue;
    ell(ctx, BOARD_X0 + c * CELL + CELL / 2, TOP_Y + r * CELL + CELL / 2, CELL * .42, CELL * .42, COLORS[grid[r][c] - 1]);
  }
  if (G.mode === 'aim') {
    ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.setLineDash([4, 6]); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(SHOOTER_X, SHOOTER_Y); ctx.lineTo(G.aimX, Math.min(G.aimY, SHOOTER_Y - 10)); ctx.stroke();
    ctx.setLineDash([]);
  }
  ell(ctx, SHOOTER_X, SHOOTER_Y, CELL * .42, CELL * .42, COLORS[G.cur - 1]);
  ell(ctx, SHOOTER_X + 70, SHOOTER_Y, CELL * .28, CELL * .28, COLORS[G.next - 1]);
  if (proj) ell(ctx, proj.x, proj.y, CELL * .42, CELL * .42, COLORS[proj.color - 1]);

  ctx.textAlign = 'right'; outlinedText(ctx, `Màn ${G.level + 1}`, 944, 30, `18px ${FB}`, '#fff');
  ctx.textAlign = 'left'; outlinedText(ctx, 'Tiếp theo', 16, 30, `16px ${FD}`, '#ffe6a8');
}
