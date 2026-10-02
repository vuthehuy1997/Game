// Máy điều khiển P2: quyết định lại mỗi `interval` giây dựa trên khoảng cách hiện tại tới đối thủ.
// Độ khó chỉnh qua: interval (độ trễ phản ứng), guardChance, specialChance, reach khởi đánh.
import { FIGHTERS } from './data.js';

// Kênh phím riêng cho máy (P2 khi p2cpu=true): KHÔNG dùng chung held/pressed của platform/core/input.js,
// vì 1 người chơi thứ hai bấm phím thật ở cùng bàn phím sẽ ghi vào đúng các Set đó và tranh quyền điều
// khiển P2 với máy. fighter.js chọn đọc từ đây khi fighter đang là aiControlled.
export const aiHeld = new Set(), aiPressed = new Set();

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
  ['left', 'right', 'guard'].forEach(a => aiHeld.delete(act(a)));
  const dx = opp.x - f.x, dist = Math.abs(dx), reach = FIGHTERS[f.fid].reach;
  if (f.meter >= 100 && Math.random() < diff.specialChance) { aiPressed.add(act('special')); return; }
  if (dist > reach + 30) { aiHeld.add(act(dx > 0 ? 'right' : 'left')); return; }
  if (Math.random() < diff.guardChance && opp.atk) { aiHeld.add(act('guard')); return; }
  aiPressed.add(act(Math.random() < .5 ? 'light' : 'heavy'));
}
