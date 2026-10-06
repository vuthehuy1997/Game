import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { ac } from '../../../platform/core/audio.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { updateParticles } from '../../../platform/core/fx.js';
import { G, grid, getProj } from './state.js';
import { LEVELS, S, unlocked } from './data.js';
import { startLevel, aim, fire, updateFly, tick, aimPath } from './physics.js';
import { toMenu } from './flow.js';
import { render } from './render.js';

const cv = $('cv');
function toGame(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * 960, y: (e.clientY - r.top) / r.height * 540 }; }
cv.addEventListener('pointermove', e => { const p = toGame(e); aim(p.x, p.y); });
cv.addEventListener('pointerdown', e => { ac(); const p = toGame(e); fire(p.x, p.y); });

function update(dt) { updateFly(dt); tick(dt); updateParticles(dt, G.t); }

mountHomeLink($('stage'));
toMenu();
if (debugOn()) exposeGlobals([{ G, grid, getProj, LEVELS, S, unlocked, update, render, startLevel, aim, fire, updateFly, tick, aimPath }]);
startLoop(update, render);
