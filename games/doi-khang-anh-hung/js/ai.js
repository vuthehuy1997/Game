// Máy điều khiển P2: quyết định lại mỗi `interval` giây dựa trên khoảng cách hiện tại tới đối thủ VÀ
// trạng thái đòn đối thủ đang ra (sắp đánh / đang gây sát thương / vừa đánh xong hở sườn) — không chỉ
// lao thẳng vào đánh bất chấp, mà còn biết đỡ/né khi đối thủ sắp trúng đòn, tranh thủ phản công khi đối
// thủ vừa ra đòn xong, và thỉnh thoảng giữ khoảng cách/xông (dash) thay vì chỉ đi bộ một kiểu.
// Độ khó chỉnh qua: interval (độ trễ phản ứng), guardChance, specialChance, punishChance, retreatChance.
import { FIGHTERS } from './data.js';
import { WIND, ACTIVE } from './combat.js';

// Kênh phím riêng cho máy (P2 khi p2cpu=true): KHÔNG dùng chung held/pressed của platform/core/input.js,
// vì 1 người chơi thứ hai bấm phím thật ở cùng bàn phím sẽ ghi vào đúng các Set đó và tranh quyền điều
// khiển P2 với máy. fighter.js chọn đọc từ đây khi fighter đang là aiControlled.
export const aiHeld = new Set(), aiPressed = new Set();

export const DIFF = {
  easy: { interval: .5, guardChance: .15, specialChance: .2, punishChance: .3, retreatChance: .05 },
  normal: { interval: .25, guardChance: .4, specialChance: .5, punishChance: .6, retreatChance: .15 },
  hard: { interval: .1, guardChance: .65, specialChance: .8, punishChance: .9, retreatChance: .25 },
};

// Đòn của đối thủ đang ở giai đoạn nào: 'wind' (sắp gây sát thương, còn kịp đỡ/né), 'active' (đang gây
// sát thương), 'recover' (đã đánh xong, không hành động được — thời điểm tốt để phản công).
function threatPhase(opp) {
  if (!opp.atk) return null;
  const w = WIND[opp.atk.kind], a = ACTIVE[opp.atk.kind];
  if (opp.atk.t < w) return 'wind';
  if (opp.atk.t < w + a) return 'active';
  return 'recover';
}

export function aiTick(f, opp, dt, diffName) {
  const diff = DIFF[diffName] || DIFF.normal, act = a => f.side + '_' + a;
  f._aiT = (f._aiT || 0) + dt;
  if (f._aiT < diff.interval) return;
  f._aiT = 0;
  ['left', 'right', 'guard'].forEach(a => aiHeld.delete(act(a)));

  const dx = opp.x - f.x, dist = Math.abs(dx), reach = FIGHTERS[f.fid].reach;
  const facing = dx > 0 ? 'right' : 'left', away = facing === 'right' ? 'left' : 'right';
  const threat = threatPhase(opp);

  // Đối thủ sắp hoặc đang gây sát thương và mình trong tầm dính đòn -> ưu tiên đỡ hoặc lùi ra,
  // không lao đầu vào ăn đòn như trước.
  if ((threat === 'wind' || threat === 'active') && dist <= reach + 40) {
    if (Math.random() < diff.guardChance) { aiHeld.add(act('guard')); return; }
    aiHeld.add(act(away)); return;
  }
  // Đối thủ vừa ra đòn xong, đang hở sườn (recover) và trong tầm -> tranh thủ phản công ngay.
  if (threat === 'recover' && dist <= reach + 20 && Math.random() < diff.punishChance) {
    aiPressed.add(act(Math.random() < .4 ? 'heavy' : 'light')); return;
  }
  // Đủ nội lực -> thỉnh thoảng tung chiêu riêng thay vì chỉ đánh thường.
  if (f.meter >= 100 && Math.random() < diff.specialChance) { aiPressed.add(act('special')); return; }
  // Ngoài tầm -> áp sát; nếu còn khá xa và đã hết hồi, thỉnh thoảng xông (dash) thay vì chỉ đi bộ.
  if (dist > reach + 30) {
    if (dist > reach + 120 && f.dashCd <= 0 && Math.random() < .3) { aiPressed.add(act('dash')); return; }
    aiHeld.add(act(facing)); return;
  }
  // Trong tầm và an toàn -> phần lớn tấn công, nhưng thỉnh thoảng lùi giữ khoảng cách để không bị bắt bài.
  if (Math.random() < diff.retreatChance) { aiHeld.add(act(away)); return; }
  aiPressed.add(act(Math.random() < .5 ? 'light' : 'heavy'));
}
