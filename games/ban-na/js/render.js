import { $ } from '../../../platform/core/util.js';
import { drawChibi } from '../../../platform/art/chibi.js';
import { POSES } from '../../../platform/art/poses.js';
import { rr, ell, shade, outlinedText, groundShadow } from '../../../platform/art/draw.js';
import { drawParticles } from '../../../platform/core/fx.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { G, blocks, targets, proj, ANCHOR, PROJ_R } from './state.js';

const cv = $('cv'), ctx = cv.getContext('2d');
const ENEMY_LOOK = { skin: '#e3b98f', hair: '#201810', shirt: '#7a2d2d', trim: '#c99a4a', pants: '#2a2020', belt: '#c99a4a', hat: 'mongol', cap: '#3a2a1a', fur: '#d9c7a0', weapon: 'glaive', scale: .42 };

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

  for (const b of blocks) drawWall(b);
  for (const t of targets) drawEnemy(t);
  if (proj) ell(ctx, proj.x, proj.y, PROJ_R, PROJ_R, '#2a2630');
  else ell(ctx, tip.x, tip.y, PROJ_R, PROJ_R, '#2a2630');

  drawParticles(ctx, G.t);
  ctx.textAlign = 'left'; outlinedText(ctx, `Đạn: ${G.shotsLeft}`, 16, 30, `22px ${FD}`, '#ffe6a8');
  ctx.textAlign = 'right'; outlinedText(ctx, `Màn ${G.level + 1}`, 944, 30, `18px ${FB}`, '#fff');
}

// Hàng rào tre/gỗ che chắn quân giặc — thanh tre dọc + dây buộc ngang thay vì khối màu trơn.
function drawWall(b) {
  const x0 = b.cx - b.w / 2, y0 = b.cy - b.h / 2;
  ctx.fillStyle = '#7a5a34'; rr(ctx, x0, y0, b.w, b.h, 4); ctx.fill();
  ctx.strokeStyle = shade('#7a5a34', -35); ctx.lineWidth = Math.max(1.5, b.w / 12);
  const slats = Math.max(2, Math.round(b.w / 13));
  for (let i = 0; i < slats; i++) {
    const sx = x0 + (i + .5) * b.w / slats;
    ctx.beginPath(); ctx.moveTo(sx, y0 + 3); ctx.lineTo(sx, y0 + b.h - 3); ctx.stroke();
  }
  ctx.strokeStyle = '#4a3a1e'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x0, y0 + b.h * .25); ctx.lineTo(x0 + b.w, y0 + b.h * .25); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x0, y0 + b.h * .75); ctx.lineTo(x0 + b.w, y0 + b.h * .75); ctx.stroke();
  ctx.strokeStyle = shade('#7a5a34', -50); ctx.lineWidth = 2; rr(ctx, x0, y0, b.w, b.h, 4); ctx.stroke();
}

// Quân giặc đứng sau rào — mục tiêu cần tiêu diệt, dùng chung kiểu vẽ chibi của cả Game Hub.
function drawEnemy(t) {
  const feetY = t.cy + t.r * 1.6;
  groundShadow(ctx, t.cx, feetY, .5);
  drawChibi(ctx, t.cx, feetY, ENEMY_LOOK, { face: -1, t: G.t, ...POSES.idle({ t: G.t }) });
}
