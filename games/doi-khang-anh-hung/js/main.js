import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { held } from '../../../platform/core/input.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { drawChibi } from '../../../platform/art/chibi.js';
import { POSES } from '../../../platform/art/poses.js';
import { groundShadow } from '../../../platform/art/draw.js';
import { FIGHTERS, STAGES } from './data.js';
import { W, H, GROUND, newMatch } from './state.js';
import { initInput } from './input.js';
import { updateFighter, startDash } from './fighter.js';
import { updateCombat, startAttack } from './combat.js';

const cv = $('cv'), ctx = cv.getContext('2d');
let G = newMatch('tieuho', 'hungdao', 'thanglong', true, 'normal');

function update(dt) {
  G.t += dt;
  updateFighter(G.f1, G.f2, dt);
  updateFighter(G.f2, G.f1, dt);
  updateCombat(G.f1, G.f2, dt);
  updateCombat(G.f2, G.f1, dt);
}
function render() {
  const st = STAGES[G.stageId];
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, st.sky[0]); sky.addColorStop(1, st.sky[1]);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, GROUND);
  ctx.fillStyle = st.ground; ctx.fillRect(0, GROUND, W, H - GROUND);
  for (const f of [G.f1, G.f2]) {
    groundShadow(ctx, f.x, GROUND);
    drawChibi(ctx, f.x, f.y, FIGHTERS[f.fid].look, { face: f.face, t: f.t, ...POSES.idle(f) });
  }
}

mountHomeLink($('stage'));
if (debugOn()) exposeGlobals([{ G, FIGHTERS, STAGES, update, render, startAttack, startDash, updateFighter, held }], { G: v => { G = v; } });
initInput();
startLoop(update, render);
