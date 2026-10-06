import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { ac, tone } from '../../../platform/core/audio.js';
import { spark, floatText, updateParticles } from '../../../platform/core/fx.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { UPGRADES, ACHIEVEMENTS } from './data.js';
import { S, save } from './save.js';
import { G } from './state.js';
import { click, tickAuto, collectOffline, buy, costOf, canBuy, isUnlocked, autoPerSec, incomePerSec, festivalMult, checkAchievements, fmt } from './clicker.js';
import { updateEvents } from './events.js';
import { updateScene, workerCount } from './scene.js';
import { showOfflineGain, initShop, updateShop } from './flow.js';
import { render } from './render.js';

const cv = $('cv');
cv.addEventListener('pointerdown', e => {
  ac(); click(); tone(660, .05, 'square', .03);
  const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * 960 / r.width, y = (e.clientY - r.top) * 540 / r.height;
  spark(x, y, 10, '#ffe6a8', 260); floatText(x, y - 24, `+${S.perClick}`, '#ffe6a8', 20);
});

function update(dt) {
  G.t += dt;
  tickAuto(dt);
  updateEvents(dt);
  updateScene(dt);
  checkAchievements();
  updateParticles(dt, G.t);
  updateShop();
}

mountHomeLink($('stage'));
initShop();
const gain = collectOffline();
if (gain > 0) showOfflineGain(gain);
setInterval(save, 5000);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) save();
  else { const gain = collectOffline(); if (gain > 0) showOfflineGain(gain); }
});
if (debugOn()) exposeGlobals([{ S, G, UPGRADES, ACHIEVEMENTS, update, render, click, tickAuto, collectOffline, buy, costOf, canBuy, isUnlocked, autoPerSec, incomePerSec, festivalMult, checkAchievements, updateEvents, updateScene, workerCount, fmt, save }]);
startLoop(update, render);
