import { $ } from '../../../platform/core/util.js';
import { rr, ell, outlinedText } from '../../../platform/art/draw.js';
import { drawParticles } from '../../../platform/core/fx.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { G, blocks, targets, proj, ANCHOR, PROJ_R } from './state.js';

const cv = $('cv'), ctx = cv.getContext('2d');

export function render() {
  const sky = ctx.createLinearGradient(0, 0, 0, 480);
  sky.addColorStop(0, '#7ec8e3'); sky.addColorStop(1, '#e8f4d9');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, 960, 480);
  ctx.fillStyle = '#5f9a4a'; ctx.fillRect(0, 480, 960, 60);

  ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(ANCHOR.x - 18, 480); ctx.lineTo(ANCHOR.x - 12, ANCHOR.y - 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ANCHOR.x + 18, 480); ctx.lineTo(ANCHOR.x + 12, ANCHOR.y - 10); ctx.stroke();
  const tip = G.dragging ? G.aim : ANCHOR;
  ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(ANCHOR.x - 12, ANCHOR.y - 10); ctx.lineTo(tip.x, tip.y); ctx.lineTo(ANCHOR.x + 12, ANCHOR.y - 10); ctx.stroke();

  if (G.dragging) {
    const vx = ANCHOR.x - G.aim.x, vy = ANCHOR.y - G.aim.y;
    for (let i = 1; i <= 6; i++) { const t = i * .12; ell(ctx, G.aim.x + vx * 5.2 * t, G.aim.y + vy * 5.2 * t + .5 * 1000 * t * t, 3, 3, 'rgba(255,255,255,.6)'); }
  }

  for (const b of blocks) { ctx.fillStyle = '#8a6a3e'; rr(ctx, b.cx - b.w / 2, b.cy - b.h / 2, b.w, b.h, 4); ctx.fill(); }
  for (const t of targets) ell(ctx, t.cx, t.cy, t.r, t.r, '#b3261e');
  if (proj) ell(ctx, proj.x, proj.y, PROJ_R, PROJ_R, '#2a2630');
  else ell(ctx, tip.x, tip.y, PROJ_R, PROJ_R, '#2a2630');

  drawParticles(ctx, G.t);
  ctx.textAlign = 'left'; outlinedText(ctx, `Đạn: ${G.shotsLeft}`, 16, 30, `22px ${FD}`, '#ffe6a8');
  ctx.textAlign = 'right'; outlinedText(ctx, `Màn ${G.level + 1}`, 944, 30, `18px ${FB}`, '#fff');
}
