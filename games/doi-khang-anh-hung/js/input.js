// Gộp 2 bộ phím P1/P2 thành một keymap duy nhất cho platform/core/input.js.
import { bindKeys, bindTouch } from '../../../platform/core/input.js';
import { ac } from '../../../platform/core/audio.js';
import { $ } from '../../../platform/core/util.js';

export const KEYMAP = {
  KeyA: 'p1_left', KeyD: 'p1_right', KeyW: 'p1_jump', KeyS: 'p1_guard', KeyQ: 'p1_dash',
  KeyF: 'p1_light', KeyG: 'p1_heavy', KeyH: 'p1_special',
  ArrowLeft: 'p2_left', ArrowRight: 'p2_right', ArrowUp: 'p2_jump', ArrowDown: 'p2_guard',
  ShiftRight: 'p2_dash', Slash: 'p2_light', Period: 'p2_heavy', Comma: 'p2_special',
};

export function initInput() {
  bindKeys(KEYMAP, { onPress: () => ac() });
  bindTouch($('touch'));
  // Firefox mở Quick Find khi bấm "/" (và đôi khi "'"), cướp focus khỏi trang — chặn riêng ở đây vì
  // platform/core/input.js (dùng chung, không được sửa) chỉ preventDefault cho phím mũi tên/Space.
  addEventListener('keydown', e => { if (e.code === 'Slash' || e.code === 'Quote') e.preventDefault(); });
}
