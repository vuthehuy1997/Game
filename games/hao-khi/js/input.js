// Bàn phím và nút cảm ứng. held = đang giữ, pressed = vừa bấm trong khung hình này.
import { bindKeys, bindTouch } from '../../../platform/core/input.js';
import { $ } from '../../../platform/core/util.js';
import { advanceDialog, endDialog, togglePause } from './flow.js';
import { G } from './state.js';

// A/D: trái phải · W/S: đổi làn · Space: nhảy · J: đánh · K L I O H (hoặc 1–5): 5 kỹ năng · Shift: lướt · U: tuyệt kỹ · Q: bánh chưng · E: rượu nếp
// Phím mũi tên dùng thay WASD được.
export const KEYMAP = {
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', Space: 'jump',
  KeyQ: 'i1', KeyE: 'i2',
  KeyJ: 'atk', ShiftLeft: 'dash', ShiftRight: 'dash', KeyU: 'ult',
  KeyK: 's1', KeyL: 's2', KeyI: 's3', KeyO: 's4', KeyH: 's5',
  Digit1: 's1', Digit2: 's2', Digit3: 's3', Digit4: 's4', Digit5: 's5',
  Escape: 'pause', KeyP: 'pause', Enter: 'ok',
};

export let touchApply = null;
// Nút cảm ứng: theo cài đặt (tự động / luôn bật / tắt)
export function applyTouch() { if (touchApply) touchApply(); }
export function initInput() {
  bindKeys(KEYMAP, {
    keepDefault: e => e.target instanceof HTMLButtonElement && G.mode !== 'play',
    onPress(k, e) {
      if (G.mode === 'dialog') {
        if (k === 'pause') { e.preventDefault(); endDialog(); }
        else if (k === 'ok' || k === 'jump' || k === 'atk') { e.preventDefault(); advanceDialog(); }
        return;
      }
      if (k === 'pause') togglePause();
    },
  });
  touchApply = bindTouch($('touch'), { onPress: k => { if (k === 'pause') togglePause(); } });
}
