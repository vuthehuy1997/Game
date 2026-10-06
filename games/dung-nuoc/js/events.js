import { EVENT_DEFS, EVENT_GAP } from './data.js';

// Trạng thái sự kiện chỉ tồn tại trong phiên chơi (không lưu), nên không đổi định dạng save.
export const EV = { phase: 'idle', kind: null, t: 0, next: 60 };

export function startEvent(kind) {
  EV.kind = kind; EV.phase = 'warn'; EV.t = EVENT_DEFS[kind].warn;
}
export function updateEvents(dt) {
  if (EV.phase === 'idle') {
    EV.next -= dt;
    if (EV.next <= 0) {
      startEvent(Math.random() < .5 ? 'flood' : 'harvest');
    }
    return;
  }
  EV.t -= dt;
  if (EV.t > 0) return;
  if (EV.phase === 'warn') { EV.phase = 'active'; EV.t = EVENT_DEFS[EV.kind].dur; return; }
  EV.phase = 'idle'; EV.kind = null;
  EV.next = EVENT_GAP[0] + Math.random() * (EVENT_GAP[1] - EVENT_GAP[0]);
}
// Hệ số sản lượng hiện tại cho 'food' hoặc 'gold' (1 nếu không có sự kiện đang diễn ra)
export function eventMult(res) {
  if (EV.phase !== 'active') return 1;
  const d = EVENT_DEFS[EV.kind];
  return res === 'food' && d.food != null ? d.food : 1;
}
