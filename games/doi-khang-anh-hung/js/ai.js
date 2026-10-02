// Máy điều khiển P2: quyết định lại mỗi `interval` giây dựa trên khoảng cách hiện tại tới đối thủ.
// Độ khó chỉnh qua: interval (độ trễ phản ứng), guardChance, specialChance, reach khởi đánh.
import { held, pressed } from '../../../platform/core/input.js';
import { FIGHTERS } from './data.js';

export const DIFF = {
  easy: { interval: .5, guardChance: .1, specialChance: .2 },
  normal: { interval: .25, guardChance: .35, specialChance: .5 },
  hard: { interval: .1, guardChance: .6, specialChance: .8 },
};

export function aiTick(f, opp, dt, diffName) {
  const diff = DIFF[diffName] || DIFF.normal, act = a => f.side + '_' + a;
  f._aiT = (f._aiT || 0) + dt;
  if (f._aiT < diff.interval) return;
  f._aiT = 0;
  ['left', 'right', 'guard'].forEach(a => held.delete(act(a)));
  const dx = opp.x - f.x, dist = Math.abs(dx), reach = FIGHTERS[f.fid].reach;
  if (f.meter >= 100 && Math.random() < diff.specialChance) { pressed.add(act('special')); return; }
  if (dist > reach + 30) { held.add(act(dx > 0 ? 'right' : 'left')); return; }
  if (Math.random() < diff.guardChance && opp.atk) { held.add(act('guard')); return; }
  pressed.add(act(Math.random() < .5 ? 'light' : 'heavy'));
}
