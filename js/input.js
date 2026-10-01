'use strict';
// Bàn phím và nút cảm ứng. held = đang giữ, pressed = vừa bấm trong khung hình này.

// A/D: trái phải · W/S: đổi làn · Space: nhảy · J: đánh · K L I O H (hoặc 1–5): 5 kỹ năng · Shift: lướt · U: tuyệt kỹ · Q: bánh chưng · E: rượu nếp
// Phím mũi tên dùng thay WASD được.
const KEYMAP = {
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', Space: 'jump',
  KeyQ: 'i1', KeyE: 'i2',
  KeyJ: 'atk', ShiftLeft: 'dash', ShiftRight: 'dash', KeyU: 'ult',
  KeyK: 's1', KeyL: 's2', KeyI: 's3', KeyO: 's4', KeyH: 's5',
  Digit1: 's1', Digit2: 's2', Digit3: 's3', Digit4: 's4', Digit5: 's5',
  Escape: 'pause', KeyP: 'pause', Enter: 'ok',
};
const held = new Set(), pressed = new Set();

addEventListener('keydown', e => {
  const k = KEYMAP[e.code]; if (!k) return;
  if (e.target.closest && e.target.closest('input, textarea, select')) return; // đang gõ trong ô nhập (mã lưu, thanh âm lượng)
  const onButton = e.target instanceof HTMLButtonElement && G.mode !== 'play';
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && !onButton) e.preventDefault();
  if (!e.repeat) pressed.add(k);
  held.add(k);
  if (e.repeat) return;
  if (G.mode === 'dialog') {
    if (k === 'pause') { e.preventDefault(); endDialog(); }
    else if (k === 'ok' || k === 'jump' || k === 'atk') { e.preventDefault(); advanceDialog(); }
    return;
  }
  if (k === 'pause') togglePause();
});
addEventListener('keyup', e => { const k = KEYMAP[e.code]; if (k) held.delete(k); });
addEventListener('blur', () => held.clear());

const touchEl = $('touch');
touchEl.querySelectorAll('button').forEach(b => {
  const k = b.dataset.k;
  const down = e => {
    e.preventDefault(); if (b.setPointerCapture) b.setPointerCapture(e.pointerId);
    held.add(k); pressed.add(k); b.classList.add('act'); ac();
    if (k === 'pause') togglePause();
  };
  const up = () => { held.delete(k); b.classList.remove('act'); };
  b.addEventListener('pointerdown', down);
  b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
});
// Nút cảm ứng: theo cài đặt (tự động / luôn bật / tắt)
let touchSeen = matchMedia('(pointer:coarse)').matches;
function applyTouch() { touchEl.classList.toggle('on', CFG.touch === 'on' || (CFG.touch === 'auto' && touchSeen)); }
addEventListener('touchstart', () => { touchSeen = true; applyTouch(); }, { once: true, passive: true });
applyTouch();
