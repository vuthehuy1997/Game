import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { ac } from '../../../platform/core/audio.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import * as state from './state.js';
import * as save from './save.js';
import * as conquest from './conquest.js';
import { initRegions, updateRegions, showIntro, showWin } from './flow.js';
import { render } from './render.js';

const cv = $('cv');
cv.addEventListener('pointerdown', () => ac(), { once: true });

function update(dt) { conquest.step(dt); updateRegions(); }

mountHomeLink($('stage'));
conquest.collectOffline();
if (save.S.maxStage >= state.MAPS.length) state.G.won = true;
conquest.advanceIfCleared();
initRegions();
if (save.S.introStage !== save.S.stage && !state.G.won) showIntro();
save.save();
setInterval(save.save, 5000);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) save.save(); else conquest.collectOffline();
});
if (debugOn()) exposeGlobals([state, save, conquest, { update, render, initRegions, showWin }]);
startLoop(update, render);
