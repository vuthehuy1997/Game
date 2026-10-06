import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { ac } from '../../../platform/core/audio.js';
import { bindKeys, bindTouch, pressed, held } from '../../../platform/core/input.js';
import { updateParticles, parts } from '../../../platform/core/fx.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { G, P, obstacles, pickups, items, banner } from './state.js';
import { S } from './save.js';
import { startRun, updateRun, moveLane, doJump, setDuck, zoneAt } from './game.js';
import { toMenu } from './flow.js';
import { render } from './render.js';

function update(dt) {
  if (pressed.has('left')) moveLane(-1);
  if (pressed.has('right')) moveLane(1);
  if (pressed.has('jump')) doJump();
  setDuck(held.has('duck'));
  updateRun(dt);
  updateParticles(dt, G.t);
}

bindKeys({ ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', KeyX: 'duck', ShiftLeft: 'duck' }, { onPress: () => ac() });
bindTouch($('touch'));
mountHomeLink($('stage'));
toMenu();
if (debugOn()) exposeGlobals([{ G, P, obstacles, pickups, items, banner, parts, S, update, render, startRun, moveLane, doJump, setDuck, zoneAt }]);
startLoop(update, render);
