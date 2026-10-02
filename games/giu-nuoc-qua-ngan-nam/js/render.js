// Vẽ chiến trường. Task 3 vẽ công trình đã xây, Task 4 thêm lính, Task 5 thêm đạn.
import { $, clamp } from '../../../platform/core/util.js';
import { drawChibi } from '../../../platform/art/chibi.js';
import { POSES } from '../../../platform/art/poses.js';
import { rr, ell, outlinedText } from '../../../platform/art/draw.js';
import { drawParticles, drawTexts } from '../../../platform/core/fx.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { G, B, troops, projs, LANES, PLOTS, HQ_X } from './state.js';

const cv = $('cv'), ctx = cv.getContext('2d');
const ALLY_LOOK = { skin: '#f6d2ae', hair: '#1c1410', shirt: '#2f6b57', trim: '#e9b949', pants: '#2a2630', belt: '#e9b949', hat: 'khan', khan: '#2e3142', weapon: 'spear', scale: .5 };
const ENEMY_LOOK = { skin: '#e3b98f', hair: '#201810', shirt: '#7a2d2d', trim: '#c99a4a', pants: '#2a2020', belt: '#c99a4a', hat: 'mongol', cap: '#3a2a1a', fur: '#d9c7a0', weapon: 'glaive', scale: .5 };

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
  if (b) {
    ctx.fillStyle = b.kind === 'camp' ? '#6b8f3a' : b.kind === 'tower' ? '#4a6f9a' : '#8a6a3a';
    rr(ctx, p.x - 24, LANES[p.lane] - 42, 48, 36, 5); ctx.fill();
    ctx.textAlign = 'center';
    outlinedText(ctx, b.kind === 'camp' ? `C${b.lvl}` : b.kind === 'tower' ? 'T' : 'X', p.x, LANES[p.lane] - 18, `15px ${FD}`, '#fff');
  }
}
function drawTroop(u) {
  const look = u.side === 'ally' ? ALLY_LOOK : ENEMY_LOOK, face = u.side === 'ally' ? 1 : -1;
  drawChibi(ctx, u.x, LANES[u.lane], look, { face, t: G.t, ...POSES.run({ walk: u.walk }) });
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
