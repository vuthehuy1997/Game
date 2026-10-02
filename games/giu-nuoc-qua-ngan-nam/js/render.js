// Vẽ chiến trường. Task 3 vẽ công trình đã xây, Task 4 thêm lính, Task 5 thêm đạn.
import { $, clamp } from '../../../platform/core/util.js';
import { rr, outlinedText } from '../../../platform/art/draw.js';
import { drawParticles, drawTexts } from '../../../platform/core/fx.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { G, B, LANES, PLOTS, HQ_X } from './state.js';

const cv = $('cv'), ctx = cv.getContext('2d');

export function render() {
  if (!G.era) { ctx.fillStyle = '#12141a'; ctx.fillRect(0, 0, 960, 540); return; }
  ctx.save();
  if (G.shake > 0) ctx.translate((Math.random() - .5) * G.shake, (Math.random() - .5) * G.shake);
  const sky = ctx.createLinearGradient(0, 0, 0, 480);
  sky.addColorStop(0, G.era.bg); sky.addColorStop(1, '#1c2a1c');
  ctx.fillStyle = sky; ctx.fillRect(-10, -10, 980, 560);
  LANES.forEach(y => { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(0, y + 8, 960, 3); });

  drawHQ();
  PLOTS.forEach(drawPlot);
  drawParticles(ctx, G.t); drawTexts(ctx, FB);
  ctx.restore();
  drawHud();
}
function drawHQ() {
  LANES.forEach(y => { ctx.fillStyle = '#5a4a36'; rr(ctx, HQ_X - 36, y - 56, 72, 56, 6); ctx.fill(); });
  const y = LANES[1];
  ctx.textAlign = 'center';
  outlinedText(ctx, `Nhà chính Lv${G.hq.lvl}`, HQ_X, y - 70, `13px ${FB}`, '#fff');
  drawBar(HQ_X - 36, y - 80, 72, 7, G.hq.hp / G.hq.maxHp, '#7bbf5a');
}
function drawPlot(p) {
  const b = B.find(x => x.plot === p.id);
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.setLineDash(b ? [] : [4, 4]);
  rr(ctx, p.x - 28, LANES[p.lane] - 48, 56, 48, 6); ctx.stroke(); ctx.setLineDash([]);
}
function drawBar(x, y, w, h, frac, col) {
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col; ctx.fillRect(x, y, w * clamp(frac, 0, 1), h);
}
function drawHud() {
  ctx.textAlign = 'left';
  outlinedText(ctx, `Vàng: ${Math.floor(G.gold)}`, 16, 30, `22px ${FD}`, '#ffe6a8');
  outlinedText(ctx, `${G.era.name} · ${G.era.year}`, 16, 54, `16px ${FB}`, '#fff');
  ctx.textAlign = 'right';
  outlinedText(ctx, `Đợt ${Math.min(G.wave + 1, G.era.waves.length)}/${G.era.waves.length}`, 944, 30, `18px ${FB}`, '#fff');
  outlinedText(ctx, G.phase === 'prep' ? 'Chuẩn bị' : G.phase === 'battle' ? 'Chiến đấu' : '', 944, 52, `14px ${FB}`, '#ffd35a');
  ctx.textAlign = 'left';
}
