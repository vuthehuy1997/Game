import { $ } from '../../../platform/core/util.js';
import { drawChibi } from '../../../platform/art/chibi.js';
import { POSES } from '../../../platform/art/poses.js';
import { ell, rr, shade, outlinedText, groundShadow } from '../../../platform/art/draw.js';
import { drawParticles, drawTexts } from '../../../platform/core/fx.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { G, P, obstacles, pickups, LANES_X, PLAYER_Y } from './state.js';

const cv = $('cv'), ctx = cv.getContext('2d');
const HERO = { skin: '#f6d2ae', hair: '#1c1410', hat: 'khan', khan: '#2f6b57', shirt: '#2f6b57', trim: '#e9b949', pants: '#2a2630', belt: '#e9b949' };

export function render() {
  ctx.save();
  if (G.shake > 0) { ctx.translate((Math.random() - .5) * G.shake, (Math.random() - .5) * G.shake); G.shake = Math.max(0, G.shake - 20 / 60); }

  const sky = ctx.createLinearGradient(0, 0, 0, 540);
  sky.addColorStop(0, '#dff0e0'); sky.addColorStop(1, '#5f9a4a');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, 960, 540);
  // con đường chạy: dải giữa sáng hơn, vạch kẻ chia 3 làn dọc
  ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(150, 0, 660, 540);
  ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 3;
  [170, 370, 590, 790].forEach(x => { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 540); ctx.stroke(); });

  for (const o of obstacles) drawObstacle(o);
  for (const c of pickups) { ell(ctx, LANES_X[c.lane], c.y, 10, 10, '#e9b949'); ell(ctx, LANES_X[c.lane], c.y, 4, 4, '#a07a22'); }

  const jumpOff = P.jumpT > 0 ? -Math.sin((1 - P.jumpT / .55) * Math.PI) * 70 : 0;
  const x = LANES_X[P.lane];
  groundShadow(ctx, x, PLAYER_Y);
  const pose = P.ducking ? { legF: .2, legB: -.2, armF: .1, armB: -.1, bob: -16 } : P.jumpT > 0 ? POSES.air() : POSES.run({ walk: P.walk });
  drawChibi(ctx, x, PLAYER_Y + jumpOff, HERO, { face: P.face, t: G.t, ...pose });

  drawParticles(ctx, G.t); drawTexts(ctx, FB);
  ctx.restore();

  ctx.textAlign = 'left'; outlinedText(ctx, `${Math.round(G.dist / 20)}m`, 16, 36, `26px ${FD}`, '#ffe6a8');
  ctx.textAlign = 'right'; outlinedText(ctx, `Xu: ${G.coins}`, 944, 36, `20px ${FB}`, '#fff');
}

function drawObstacle(o) {
  const x = LANES_X[o.lane], y = o.y;
  if (o.kind === 'jump') {
    // tảng đá thấp giữa đường — nhảy qua
    ell(ctx, x, y + 6, 30, 12, 'rgba(0,0,0,.18)');
    ell(ctx, x, y, 26, 18, '#8a8a8a');
    ell(ctx, x - 6, y - 4, 10, 7, shade('#8a8a8a', 40));
    ctx.strokeStyle = shade('#8a8a8a', -40); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y, 26, 18, 0, 0, Math.PI * 2); ctx.stroke();
  } else if (o.kind === 'duck') {
    // thân gỗ ngáng ngang — cúi qua
    ell(ctx, x, y + 8, 34, 10, 'rgba(0,0,0,.18)');
    ctx.fillStyle = '#7a5a34'; rr(ctx, x - 34, y - 10, 68, 20, 10); ctx.fill();
    ctx.strokeStyle = shade('#7a5a34', -40); ctx.lineWidth = 1.5;
    for (let i = -24; i <= 24; i += 12) { ctx.beginPath(); ctx.moveTo(x + i, y - 9); ctx.lineTo(x + i, y + 9); ctx.stroke(); }
    ell(ctx, x - 34, y, 10, 11, shade('#7a5a34', 25)); ell(ctx, x + 34, y, 10, 11, shade('#7a5a34', 25));
  } else {
    // rào chông tre — phải đổi làn
    ell(ctx, x, y + 10, 36, 10, 'rgba(0,0,0,.18)');
    ctx.fillStyle = '#5a4634';
    for (const dx of [-20, 0, 20]) { ctx.beginPath(); ctx.moveTo(x + dx, y - 26); ctx.lineTo(x + dx - 10, y + 10); ctx.lineTo(x + dx + 10, y + 10); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = shade('#5a4634', -30); ctx.lineWidth = 1.5;
    for (const dx of [-20, 0, 20]) { ctx.beginPath(); ctx.moveTo(x + dx, y - 26); ctx.lineTo(x + dx, y + 10); ctx.stroke(); }
  }
}
