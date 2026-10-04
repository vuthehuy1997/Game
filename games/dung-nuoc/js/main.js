import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { ac } from '../../../platform/core/audio.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { COLS, ROWS } from './state.js';
import { BUILDING_DEFS } from './data.js';
import { S, save } from './save.js';
import { recomputePop, unlockedKinds, canAfford, canBuild, build, incomePerSec, tick, collectOffline } from './buildings.js';
import { initPlots, updatePlots } from './flow.js';
import { render } from './render.js';

const cv = $('cv');
cv.addEventListener('pointerdown', () => ac(), { once: true });

function update(dt) { tick(dt); updatePlots(); }

mountHomeLink($('stage'));
recomputePop();
initPlots(COLS * ROWS);
collectOffline(); save();
setInterval(save, 5000);
if (debugOn()) exposeGlobals([{ S, BUILDING_DEFS, update, render, recomputePop, unlockedKinds, canAfford, canBuild, build, incomePerSec, tick, collectOffline, save }]);
startLoop(update, render);
