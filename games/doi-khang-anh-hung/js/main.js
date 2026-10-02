import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { held } from '../../../platform/core/input.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { FIGHTERS, STAGES } from './data.js';
import { initInput } from './input.js';
import { updateFighter, startDash } from './fighter.js';
import { updateCombat, startAttack, tryUseSpecial } from './combat.js';
import { aiTick } from './ai.js';
import { updateHazard } from './hazards.js';
import { updateFlow } from './flow.js';
import { renderMatch, renderSelect } from './render.js';
import { newSelect, updateSelect, startMatch } from './menu.js';

const cv = $('cv'), ctx = cv.getContext('2d');
let G = newSelect(); // thay cho newMatch(...) cố định của Task 2-10
Object.assign(G, { p1id: 'tieuho', p2id: 'hungdao', stageId: 'thanglong', diff: 'normal' }); // giá trị an toàn trước khi chọn xong

function update(dt) {
  G.t = (G.t || 0) + dt;
  if (G.mode === 'select') {
    updateSelect(G);
    if (G.confirm) { G.confirm = false; startMatch(G, G); }
    return;
  }
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
function render() { G.mode === 'select' ? renderSelect(ctx, G) : renderMatch(ctx, G); }

mountHomeLink($('stage'));
if (debugOn()) exposeGlobals([{ G, FIGHTERS, STAGES, update, render, startAttack, tryUseSpecial, startDash, updateFighter, held, newSelect, updateSelect, startMatch }], { G: v => { G = v; } });
initInput();
startLoop(update, render);
