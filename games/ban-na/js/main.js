import './debug.js';
import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { ac } from '../../../platform/core/audio.js';
import { updateParticles } from '../../../platform/core/fx.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { LEVELS, S, unlocked } from './data.js';
import { G, blocks, targets, setProj } from './state.js';
import { startLevel, startDrag, updateDrag, release, updatePhysics } from './physics.js';
import { toMenu } from './flow.js';
import { render } from './render.js';

const cv = $('cv');
function toGame(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * 960, y: (e.clientY - r.top) / r.height * 540 }; }
cv.addEventListener('pointerdown', e => { ac(); const p = toGame(e); startDrag(p.x, p.y); });
cv.addEventListener('pointermove', e => { const p = toGame(e); updateDrag(p.x, p.y); });
cv.addEventListener('pointerup', () => release());

export function update(dt) { G.t += dt; updatePhysics(dt); updateParticles(dt, G.t); }

mountHomeLink($('stage'));
toMenu();
startLoop(update, render);
