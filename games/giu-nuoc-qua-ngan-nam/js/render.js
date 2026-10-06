// Vẽ chiến trường. Task 3 vẽ công trình đã xây, Task 4 thêm lính, Task 5 thêm đạn.
import { $, clamp } from '../../../platform/core/util.js';
import { drawChibi } from '../../../platform/art/chibi.js';
import { POSES } from '../../../platform/art/poses.js';
import { ell, outlinedText } from '../../../platform/art/draw.js';
import { drawParticles, drawTexts } from '../../../platform/core/fx.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { G, B, troops, projs, LANES, PLOTS, HQ_X } from './state.js';
import { drawPlotGround, drawBuilding, drawHQ as drawKeep, buildingHeight, WALL_TOP } from './art.js';

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
  troops.forEach(drawTroop);
  projs.forEach(drawProj);
  drawParticles(ctx, G.t); drawTexts(ctx, FB);
  ctx.restore();
  drawHud();
}
function drawHQ() {
  drawKeep(ctx, G.hq.lvl, G.eraIdx, G.t);
  const top = WALL_TOP - buildingHeight('hq', G.hq.lvl);
  ctx.textAlign = 'center';
  outlinedText(ctx, `Nhà chính Lv${G.hq.lvl}`, HQ_X, top - 30, `13px ${FB}`, '#fff');
  drawBar(HQ_X - 34, top - 22, 68, 6, G.hq.hp / G.hq.maxHp, '#7bbf5a');
}
function drawPlot(p) {
  const b = B.find(x => x.plot === p.id), L = LANES[p.lane];
  drawPlotGround(ctx, p.x, L, !!b, G.eraIdx, G.t);
  if (b) drawBuilding(ctx, b.kind, b.lvl, G.eraIdx, p.x, L + 4, G.t);
}
function drawTroop(u) {
  const face = u.side === 'ally' ? 1 : -1;
  drawChibi(ctx, u.x, LANES[u.lane], u.look, { face, t: G.t, ...POSES.run({ walk: u.walk }) });
  drawBar(u.x - 16, LANES[u.lane] - 76, 32, 5, u.hp / u.maxHp, u.side === 'ally' ? '#8fd6ff' : '#ff8f6b');
}
function drawProj(q) { ell(ctx, q.x, LANES[q.lane] - 36, 5, 5, '#ffe6a8'); }
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
