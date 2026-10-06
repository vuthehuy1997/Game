import './debug.js';
import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { ac } from '../../../platform/core/audio.js';
import { updateParticles } from '../../../platform/core/fx.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { G, AMMO_BUTTONS } from './state.js';
import { startDrag, updateDrag, release, updatePhysics, setAmmo } from './physics.js';
import { toMenu } from './flow.js';
import { render } from './render.js';

const cv = $('cv');
function toGame(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * 960, y: (e.clientY - r.top) / r.height * 540 }; }
cv.addEventListener('pointerdown', e => {
  ac();
  const p = toGame(e);
  const btn = AMMO_BUTTONS.find(b => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h);
  if (btn) { setAmmo(btn.kind); return; }
  startDrag(p.x, p.y);
});
cv.addEventListener('pointermove', e => { const p = toGame(e); updateDrag(p.x, p.y); });
cv.addEventListener('pointerup', () => release());
addEventListener('keydown', e => {
  if (e.key === '1') setAmmo('da');
  if (e.key === '2') setAmmo('dau');
});

export function update(dt) { G.t += dt; updatePhysics(dt); updateParticles(dt, G.t); }

mountHomeLink($('stage'));
toMenu();
startLoop(update, render);
