import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { ac } from '../../../platform/core/audio.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { updateParticles } from '../../../platform/core/fx.js';
import { GRID_N, CELL, ORIGIN_X, ORIGIN_Y, G, grid, special, offX, offY } from './state.js';
import { LEVELS, S, unlocked } from './data.js';
import { startLevel, selectCell, trySwap, tick } from './match3.js';
import { toMenu, showIntro } from './flow.js';
import { render } from './render.js';

const cv = $('cv');
const cellAt = e => {
  const r = cv.getBoundingClientRect();
  const mx = (e.clientX - r.left) / r.width * 960, my = (e.clientY - r.top) / r.height * 540;
  const x = Math.floor((mx - ORIGIN_X) / CELL), y = Math.floor((my - ORIGIN_Y) / CELL);
  return x >= 0 && x < GRID_N && y >= 0 && y < GRID_N ? { x, y } : null;
};
let dragging = false;
cv.addEventListener('pointerdown', e => {
  ac();
  const c = cellAt(e);
  if (!c) return;
  dragging = true;
  selectCell(c.x, c.y);
});
cv.addEventListener('pointermove', e => {
  if (!dragging || G.selected === null) return;
  const c = cellAt(e);
  if (!c) return;
  const sx = G.selected % GRID_N, sy = (G.selected / GRID_N) | 0;
  if (Math.abs(sx - c.x) + Math.abs(sy - c.y) === 1) selectCell(c.x, c.y);
});
addEventListener('pointerup', () => { dragging = false; });

function update(dt) {
  tick(dt);
  updateParticles(dt, G.t);
}

mountHomeLink($('stage'));
toMenu();
if (debugOn()) exposeGlobals([{ G, grid, special, offX, offY, LEVELS, S, unlocked, update, render, startLevel, selectCell, trySwap, tick, toMenu, showIntro }]);
startLoop(update, render);
