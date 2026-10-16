import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { updateParticles } from '../../../platform/core/fx.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { ERAS } from './data.js';
import { S, unlocked } from './save.js';
import { G, troops, startEra, ALLY_HOLD_X, OPP_HQ_FRONT_X } from './state.js';
import { trainMiner, assignMinerToMine, unassignMinerFromMine, updateMineIncome, updateTrainQueue, trainTroop } from './buildings.js';
import { spawnTroop, setStance, updateTroops } from './troops.js';
import { updateEnemySpawns } from './enemy.js';

// Task 1-4/7: nền tảng chiến trường 1 làn + kinh tế mỏ vàng + huấn luyện lính (Doanh trại) +
// thế trận Phòng thủ/Tấn công. HUD/render/luồng chơi đầy đủ (AI địch, thắng/thua, HUD) sẽ
// được Task 5-7 nối lại dần — tạm thời chỉ vẽ nền trống để trang chạy không crash trong lúc
// chờ render.js/flow.js được viết lại theo state.js mới.
const cv = $('cv'), ctx = cv.getContext('2d');
function render() {
  ctx.fillStyle = G.era ? G.era.bg : '#12141a';
  ctx.fillRect(0, 0, 960, 540);
}

let paused = false;
function update(dt) {
  if (paused) return;
  if (G.phase === 'battle') {
    G.t += dt; G.shake = Math.max(0, G.shake - dt * 30);
    updateMineIncome(dt); updateTrainQueue(dt); updateTroops(dt); updateEnemySpawns(dt);
    // Task 6 sẽ gọi lại ở đây: checkEnd.
  }
  updateParticles(dt, G.t);
}

mountHomeLink($('stage'));
if (debugOn()) exposeGlobals([{
  G, troops, startEra, S, unlocked, ERAS, update, render, pause: v => { paused = v; },
  trainMiner, assignMinerToMine, unassignMinerFromMine, updateMineIncome, updateTrainQueue,
  trainTroop, spawnTroop, setStance, updateTroops, updateEnemySpawns, ALLY_HOLD_X, OPP_HQ_FRONT_X,
}]);
startLoop(update, render);
