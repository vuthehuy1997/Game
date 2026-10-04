import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { ac } from '../../../platform/core/audio.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { COLS, ROWS, N, HOME, MAX_TROOPS, SPAWN_PER_SEC, DEFENSE_GROW_PER_SEC, DEFENSE_CAP, G } from './state.js';
import { S, save } from './save.js';
import { neighbors, tick, canAttack, attack, hasWon, collectOffline } from './conquest.js';
import { initRegions, updateRegions } from './flow.js';
import { render } from './render.js';

const cv = $('cv');
cv.addEventListener('pointerdown', () => ac(), { once: true });

function update(dt) { tick(dt); updateRegions(); }

mountHomeLink($('stage'));
initRegions(N);
collectOffline(); save();
setInterval(save, 5000);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) save(); else collectOffline();
});
if (debugOn()) exposeGlobals([{ S, G, N, HOME, MAX_TROOPS, update, render, neighbors, tick, canAttack, attack, hasWon, collectOffline }]);
startLoop(update, render);
