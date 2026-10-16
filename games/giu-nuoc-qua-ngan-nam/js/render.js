// Vẽ chiến trường 1 làn kiểu Stick War: 2 căn cứ đối xứng, công trình cố định (Mỏ vàng/Nhà
// dân/Doanh trại), lính ta/địch, HUD vàng/thợ mỏ/thế trận. Không vẽ đạn (projs đã bị xoá ở
// Task 1 — xem spec Hệ thống 1/7).
import { $, clamp } from '../../../platform/core/util.js';
import { drawChibi } from '../../../platform/art/chibi.js';
import { POSES } from '../../../platform/art/poses.js';
import { outlinedText } from '../../../platform/art/draw.js';
import { drawParticles, drawTexts } from '../../../platform/core/fx.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { G, troops, LANE_Y, HQ_X, OPP_HQ_X, MINE_X, HOUSE_X, BARRACKS_X } from './state.js';
import { drawHQ, drawMine, drawHouse, drawBarracks, WALL_TOP, HQ_HEIGHT } from './art.js';

const cv = $('cv'), ctx = cv.getContext('2d');

export function render() {
  if (!G.era) { ctx.fillStyle = '#12141a'; ctx.fillRect(0, 0, 960, 540); return; }
  ctx.save();
  if (G.shake > 0) ctx.translate((Math.random() - .5) * G.shake, (Math.random() - .5) * G.shake);
  const sky = ctx.createLinearGradient(0, 0, 0, 480);
  sky.addColorStop(0, G.era.bg); sky.addColorStop(1, '#1c2a1c');
  ctx.fillStyle = sky; ctx.fillRect(-10, -10, 980, 560);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(0, LANE_Y + 8, 960, 3);

  drawMine(ctx, MINE_X, LANE_Y + 4, G.eraIdx, G.t);
  drawHouse(ctx, HOUSE_X, LANE_Y + 4, G.eraIdx);
  drawBarracks(ctx, BARRACKS_X, LANE_Y + 4, G.eraIdx, G.t);

  drawHQ(ctx, G.eraIdx, G.t, HQ_X, false);
  drawHQ(ctx, G.eraIdx, G.t, OPP_HQ_X, true);
  drawHqLabel(G.hq, HQ_X, 'Nhà chính ta', '#7bbf5a');
  drawHqLabel(G.oppHq, OPP_HQ_X, `Nhà ${G.era.foe}`, '#ff8f6b');

  troops.forEach(drawTroop);
  drawParticles(ctx, G.t); drawTexts(ctx, FB);
  ctx.restore();
  drawHud();
}

function drawTroop(u) {
  const face = u.side === 'ally' ? 1 : -1;
  drawChibi(ctx, u.x, LANE_Y, u.look, { face, t: G.t, ...POSES.run({ walk: u.walk }) });
  drawBar(u.x - 16, LANE_Y - 76, 32, 5, u.hp / u.maxHp, u.side === 'ally' ? '#8fd6ff' : '#ff8f6b');
}

function drawHqLabel(hq, x, label, col) {
  const top = WALL_TOP - HQ_HEIGHT;
  ctx.textAlign = 'center';
  outlinedText(ctx, label, x, top - 30, `13px ${FB}`, '#fff');
  drawBar(x - 34, top - 22, 68, 6, hq.hp / hq.maxHp, col);
}

function drawBar(x, y, w, h, frac, col) {
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col; ctx.fillRect(x, y, w * clamp(frac, 0, 1), h);
}

function drawHud() {
  ctx.textAlign = 'left';
  outlinedText(ctx, `Vàng: ${Math.floor(G.gold)}`, 16, 30, `22px ${FD}`, '#ffe6a8');
  outlinedText(ctx, `${G.era.name} · ${G.era.year}`, 16, 54, `16px ${FB}`, '#fff');
  outlinedText(ctx, `Thợ mỏ: ${G.miners.atMine}/${G.miners.total}`, 16, 76, `14px ${FB}`, '#fff');
  ctx.textAlign = 'right';
  outlinedText(ctx, G.stance === 'defend' ? 'Thế trận: Phòng thủ' : 'Thế trận: Tấn công', 944, 30, `18px ${FB}`, '#ffd35a');
  ctx.textAlign = 'left';
}
