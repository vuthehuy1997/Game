import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { ac } from '../../../platform/core/audio.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { COLS, ROWS } from './state.js';
import { S, save } from './save.js';
import * as D from './data.js';
import * as B from './buildings.js';
import * as E from './events.js';
import * as F from './flow.js';
import * as SC from './scene.js';
import { render } from './render.js';

const cv = $('cv');
cv.addEventListener('pointerdown', () => ac(), { once: true });

function update(dt) { B.tick(dt); E.updateEvents(dt); F.updatePlots(); F.checkMilestone(); }

mountHomeLink($('stage'));
B.recomputePop();
F.initPlots(COLS * ROWS);
B.collectOffline(); save();
setInterval(save, 5000);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) save(); else B.collectOffline();
});
if (debugOn()) exposeGlobals([{ S, save, update, render }, D, B, E, F, SC]);
startLoop(update, render);
