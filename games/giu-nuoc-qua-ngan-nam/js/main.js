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
import { updateEnemySpawns, checkEnd } from './enemy.js';
import { toTitle, initHud, updateHud } from './flow.js';
import { render } from './render.js';

// Task 7/7 (hoàn tất): HUD/luồng chơi đầy đủ nối lại qua flow.js (initHud/updateHud), vẽ
// chiến trường thật qua render.js (thay placeholder nền trống của Task 1).
let paused = false;
function update(dt) {
  if (paused) return;
  if (G.phase === 'battle') {
    G.t += dt; G.shake = Math.max(0, G.shake - dt * 30);
    updateMineIncome(dt); updateTrainQueue(dt); updateTroops(dt); updateEnemySpawns(dt);
    checkEnd(); updateHud();
  }
  updateParticles(dt, G.t);
}

mountHomeLink($('stage'));
initHud();
if (debugOn()) exposeGlobals([{
  G, troops, startEra, S, unlocked, ERAS, update, render, pause: v => { paused = v; },
  trainMiner, assignMinerToMine, unassignMinerFromMine, updateMineIncome, updateTrainQueue,
  trainTroop, spawnTroop, setStance, updateTroops, updateEnemySpawns, checkEnd, ALLY_HOLD_X, OPP_HQ_FRONT_X,
}]);
startLoop(update, render);
toTitle();
