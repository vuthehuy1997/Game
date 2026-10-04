import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { ac, tone } from '../../../platform/core/audio.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { UPGRADES } from './data.js';
import { S, save } from './save.js';
import { G } from './state.js';
import { click, tickAuto, collectOffline, buy, costOf, canBuy, autoPerSec, fmt } from './clicker.js';
import { showOfflineGain, initShop, updateShop } from './flow.js';
import { render } from './render.js';

const cv = $('cv');
cv.addEventListener('pointerdown', () => { ac(); click(); tone(660, .05, 'square', .03); G.pulse = 1; });

function update(dt) { tickAuto(dt); G.pulse = Math.max(0, G.pulse - dt * 3); updateShop(); }

mountHomeLink($('stage'));
initShop();
const gain = collectOffline();
if (gain > 0) showOfflineGain(gain);
setInterval(save, 5000);
if (debugOn()) exposeGlobals([{ S, G, UPGRADES, update, render, click, tickAuto, collectOffline, buy, costOf, canBuy, autoPerSec, fmt, save }]);
startLoop(update, render);
