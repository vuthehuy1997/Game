import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { ac } from '../../../platform/core/audio.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { GRID_N, CELL, ORIGIN_X, ORIGIN_Y, G, grid } from './state.js';
import { LEVELS, S, unlocked } from './data.js';
import { startLevel, selectCell, trySwap } from './match3.js';
import { toMenu } from './flow.js';
import { render } from './render.js';

const cv = $('cv');
cv.addEventListener('pointerdown', e => {
  ac();
  const r = cv.getBoundingClientRect();
  const mx = (e.clientX - r.left) / r.width * 960, my = (e.clientY - r.top) / r.height * 540;
  const x = Math.floor((mx - ORIGIN_X) / CELL), y = Math.floor((my - ORIGIN_Y) / CELL);
  if (x >= 0 && x < GRID_N && y >= 0 && y < GRID_N) selectCell(x, y);
});

function update() {}

mountHomeLink($('stage'));
toMenu();
if (debugOn()) exposeGlobals([{ G, grid, LEVELS, S, unlocked, update, render, startLevel, selectCell, trySwap }]);
startLoop(update, render);
