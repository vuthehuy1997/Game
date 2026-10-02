import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { updateParticles } from '../../../platform/core/fx.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { ERAS } from './data.js';
import { S, unlocked } from './save.js';
import { startEra } from './waves.js';
import { build, upgrade, upgradeHQ, updateIncome } from './buildings.js';
import { updateCamps, updateTroops } from './troops.js';
import { updateTowers, updateProjs } from './towers.js';
import { G, B, troops, projs, PLOTS, buildingOn } from './state.js';
import { toTitle, showEraSelect, initHud, updateHud } from './flow.js';
import { render } from './render.js';

function update(dt) {
  G.t += dt; G.shake = Math.max(0, G.shake - dt * 30);
  if (G.phase === 'prep' || G.phase === 'battle') {
    updateIncome(dt); updateCamps(dt); updateTroops(dt); updateTowers(dt); updateProjs(dt); updateHud();
  }
  updateParticles(dt, G.t);
}

mountHomeLink($('stage'));
initHud();
toTitle();
if (debugOn()) exposeGlobals([{ G, B, troops, projs, PLOTS, buildingOn, update, render, ERAS, S, unlocked, startEra, showEraSelect, build, upgrade, upgradeHQ }]);
startLoop(update, render);
