import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';

const cv = $('cv'), ctx = cv.getContext('2d');
const W = 960, H = 540;

function update(dt) {}
function render() {
  ctx.fillStyle = '#1b1d24'; ctx.fillRect(0, 0, W, H);
}

mountHomeLink($('stage'));
if (debugOn()) exposeGlobals([{ update, render }]);
startLoop(update, render);
