import './debug.js';
import { startLoop } from '../../../platform/core/loop.js';
import { held, bindKeys, bindTouch, touchWanted } from '../../../platform/core/input.js';
import { ac } from '../../../platform/core/audio.js';
import { $ } from '../../../platform/core/util.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import { P } from './state.js';
import { update, reload, setWeapon, togglePause } from './logic.js';
import { toCampaignMenu } from './flow.js';
import { render } from './render.js';

const cv = $('cv'), joy = $('joy'), knob = $('knob');

// WASD/mũi tên để đi, mũi tên trái/phải để xoay (thay cho kéo chuột trên bàn phím không chuột).
bindKeys({
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', KeyD: 'right', ArrowLeft: 'turnL', ArrowRight: 'turnR',
  KeyR: 'reload', Escape: 'pause', KeyP: 'pause',
  Digit1: 'wpn1', Digit2: 'wpn2', Digit3: 'wpn3',
}, {
  onPress: k => {
    ac();
    if (k === 'reload') reload();
    else if (k === 'pause') togglePause();
    else if (k === 'wpn1') setWeapon('rifle');
    else if (k === 'wpn2') setWeapon('smg');
    else if (k === 'wpn3') setWeapon('assault');
  },
});

// Kéo chuột hoặc vuốt trên canvas để ngắm. Trên chuột, giữ nút cũng bắn liên tục (quy ước FPS quen
// thuộc); trên cảm ứng, vuốt chỉ để ngắm — bắn dành riêng cho nút "Bắn" để tránh bắn nhầm khi ngắm.
let dragging = false, lastX = 0;
cv.addEventListener('pointerdown', e => {
  ac(); dragging = true; lastX = e.clientX; cv.setPointerCapture(e.pointerId);
  if (e.pointerType === 'mouse') held.add('fire');
});
cv.addEventListener('pointermove', e => {
  if (!dragging) return;
  const dx = e.clientX - lastX; lastX = e.clientX;
  P.lookDelta += dx * .0032;
});
function endDrag(e) { dragging = false; if (e.pointerType === 'mouse') held.delete('fire'); }
cv.addEventListener('pointerup', endDrag);
cv.addEventListener('pointercancel', endDrag);

// Nút cảm ứng rời rạc: bắn (giữ để bắn liên tục), nạp đạn, đổi súng — dùng chung cơ chế held/pressed.
bindTouch($('touch'), {
  onPress: k => {
    if (k === 'reload') reload();
    else if (k === 'wpn1') setWeapon('rifle');
    else if (k === 'wpn2') setWeapon('smg');
    else if (k === 'wpn3') setWeapon('assault');
  },
});

// Joystick ảo di chuyển: kéo trong vòng tròn để đặt cờ up/down/left/right theo hướng kéo.
let joyActive = false, joyId = null, joyCX = 0, joyCY = 0;
function joyClear() { held.delete('up'); held.delete('down'); held.delete('left'); held.delete('right'); }
joy.addEventListener('pointerdown', e => {
  joyActive = true; joyId = e.pointerId; joy.setPointerCapture(e.pointerId);
  const r = joy.getBoundingClientRect(); joyCX = r.left + r.width / 2; joyCY = r.top + r.height / 2;
});
joy.addEventListener('pointermove', e => {
  if (!joyActive || e.pointerId !== joyId) return;
  let dx = e.clientX - joyCX, dy = e.clientY - joyCY;
  const len = Math.hypot(dx, dy), max = 34;
  if (len > max) { dx = dx / len * max; dy = dy / len * max; }
  knob.style.transform = `translate(${dx}px,${dy}px)`;
  joyClear();
  if (len > 10) {
    if (dy < -10) held.add('up'); if (dy > 10) held.add('down');
    if (dx < -10) held.add('left'); if (dx > 10) held.add('right');
  }
});
function joyEnd(e) { if (e.pointerId !== joyId) return; joyActive = false; knob.style.transform = 'translate(0,0)'; joyClear(); }
joy.addEventListener('pointerup', joyEnd);
joy.addEventListener('pointercancel', joyEnd);

function applyTouchVisibility() { joy.classList.toggle('on', touchWanted()); }
applyTouchVisibility();
addEventListener('touchstart', applyTouchVisibility, { once: true, passive: true });

mountHomeLink($('stage'));
toCampaignMenu();
startLoop(update, render);
