import { rand } from '../../../platform/core/util.js';
import { FESTIVAL_SEC, FESTIVAL_GAP } from './data.js';
import { G, pushLog } from './state.js';

export function updateEvents(dt) {
  if (G.festival > 0) {
    G.festival = Math.max(0, G.festival - dt);
    if (G.festival === 0) pushLog('Hội làng tan, làng trở lại nhịp thường.');
    return;
  }
  G.nextFestival -= dt;
  if (G.nextFestival <= 0) {
    G.festival = FESTIVAL_SEC;
    G.nextFestival = rand(FESTIVAL_GAP[0], FESTIVAL_GAP[1]);
    pushLog('Hội làng khai mạc: thu nhập gấp đôi!');
  }
}
