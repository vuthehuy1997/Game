import { $ } from '../../../platform/core/util.js';
import { drawChibi } from '../../../platform/art/chibi.js';
import { POSES } from '../../../platform/art/poses.js';
import { ell, rr, outlinedText, groundShadow } from '../../../platform/art/draw.js';
import { drawParticles, drawTexts } from '../../../platform/core/fx.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { G, P, obstacles, pickups, LANES_Y, PLAYER_X } from './state.js';

const cv = $('cv'), ctx = cv.getContext('2d');
const HERO = { skin: '#f6d2ae', hair: '#1c1410', hat: 'khan', khan: '#2f6b57', shirt: '#2f6b57', trim: '#e9b949', pants: '#2a2630', belt: '#e9b949' };

export function render() {
  ctx.save();
  if (G.shake > 0) { ctx.translate((Math.random() - .5) * G.shake, (Math.random() - .5) * G.shake); G.shake = Math.max(0, G.shake - 20 / 60); }
  const sky = ctx.createLinearGradient(0, 0, 0, 500);
  sky.addColorStop(0, '#7ec8e3'); sky.addColorStop(1, '#e8f4d9');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, 960, 500);
  ctx.fillStyle = '#5f9a4a'; ctx.fillRect(0, 500, 960, 40);
  LANES_Y.forEach(y => { ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(0, y + 36, 960, 3); });

  for (const o of obstacles) {
    ctx.fillStyle = o.kind === 'block' ? '#8a6a3e' : o.kind === 'jump' ? '#b3261e' : '#4a6f9a';
    const y = LANES_Y[o.lane];
    if (o.kind === 'duck') rr(ctx, o.x - 22, y - 70, 44, 24, 4); else rr(ctx, o.x - 18, y - 46, 36, 46, 4);
    ctx.fill();
  }
  for (const c of pickups) ell(ctx, c.x, LANES_Y[c.lane] - 20, 9, 9, '#e9b949');

  const jumpOff = P.jumpT > 0 ? -Math.sin((1 - P.jumpT / .55) * Math.PI) * 70 : 0;
  const y = LANES_Y[P.lane] + jumpOff;
  groundShadow(ctx, PLAYER_X, LANES_Y[P.lane]);
  const pose = P.ducking ? { legF: .2, legB: -.2, armF: .1, armB: -.1, bob: -16 } : P.jumpT > 0 ? POSES.air() : POSES.run({ walk: P.walk });
  drawChibi(ctx, PLAYER_X, y, HERO, { face: 1, t: G.t, ...pose });

  drawParticles(ctx, G.t); drawTexts(ctx, FB);
  ctx.restore();

  ctx.textAlign = 'left'; outlinedText(ctx, `${Math.round(G.dist / 20)}m`, 16, 36, `26px ${FD}`, '#ffe6a8');
  ctx.textAlign = 'right'; outlinedText(ctx, `Xu: ${G.coins}`, 944, 36, `20px ${FB}`, '#fff');
}
