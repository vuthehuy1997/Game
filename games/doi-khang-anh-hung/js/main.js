import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { held } from '../../../platform/core/input.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { FIGHTERS, STAGES } from './data.js';
import { newMatch } from './state.js';
import { initInput } from './input.js';
import { updateFighter, startDash } from './fighter.js';
import { updateCombat, startAttack, tryUseSpecial } from './combat.js';
import { aiTick } from './ai.js';
import { updateHazard } from './hazards.js';
import { updateFlow } from './flow.js';
import { renderMatch } from './render.js';

const cv = $('cv'), ctx = cv.getContext('2d');
let G = newMatch('tieuho', 'hungdao', 'thanglong', true, 'normal');

function update(dt) {
  G.t += dt;
  if (G.mode === 'fight') {
    if (G.p2cpu) aiTick(G.f2, G.f1, dt, G.diff);
    updateFighter(G.f1, G.f2, dt);
    updateFighter(G.f2, G.f1, dt);
    updateCombat(G.f1, G.f2, dt);
    updateCombat(G.f2, G.f1, dt);
    updateHazard(G.f1, G.stageId, dt);
    updateHazard(G.f2, G.stageId, dt);
  }
  updateFlow(G, dt);
}
function render() { renderMatch(ctx, G); }

mountHomeLink($('stage'));
if (debugOn()) exposeGlobals([{ G, FIGHTERS, STAGES, update, render, startAttack, tryUseSpecial, startDash, updateFighter, held }], { G: v => { G = v; } });
initInput();
startLoop(update, render);
