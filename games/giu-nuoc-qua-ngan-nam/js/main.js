import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { updateParticles } from '../../../platform/core/fx.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { ERAS } from './data.js';
import { S, unlocked } from './save.js';
import { startEra } from './waves.js';
import { G, B, troops, projs, PLOTS, buildingOn } from './state.js';
import { toTitle, showEraSelect } from './flow.js';
import { render } from './render.js';

function update(dt) {
  G.t += dt; G.shake = Math.max(0, G.shake - dt * 30);
  updateParticles(dt, G.t);
}

mountHomeLink($('stage'));
toTitle();
if (debugOn()) exposeGlobals([{ G, B, troops, projs, PLOTS, buildingOn, update, render, ERAS, S, unlocked, startEra, showEraSelect }]);
startLoop(update, render);
