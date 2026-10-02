import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { G, B, troops, projs, PLOTS, buildingOn } from './state.js';
import { toTitle } from './flow.js';
import { render } from './render.js';

function update(dt) {
  G.t += dt;
}

mountHomeLink($('stage'));
toTitle();
if (debugOn()) exposeGlobals([{ G, B, troops, projs, PLOTS, buildingOn, update, render }]);
startLoop(update, render);
