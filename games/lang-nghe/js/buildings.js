// Vẽ công trình và phông làng. Module thuần vẽ (không có trạng thái game) để dùng chung cho cảnh chính,
// icon trong bảng nâng cấp và ảnh bìa trên trang chủ.
import { ell, rr, shade } from '../../../platform/art/draw.js';

export const GROUND = 300;
export const SLOTS = [
  { kind: 'house', x: 80, up: 'tho' },
  { kind: 'kiln', x: 185, up: 'lo_gom' },
  { kind: 'forge', x: 290, up: 'lo_ran' },
  { kind: 'well', x: 400 },
  { kind: 'guild', x: 520, up: 'phuong' },
  { kind: 'weave', x: 640, up: 'xuong' },
  { kind: 'market', x: 760, up: 'cho' },
  { kind: 'dock', x: 880, up: 'cang' },
];

export function drawBackdrop(c, w, h, gy) {
  const sky = c.createLinearGradient(0, 0, 0, gy);
  sky.addColorStop(0, '#9fd3e6'); sky.addColorStop(1, '#e9f2d6');
  c.fillStyle = sky; c.fillRect(0, 0, w, gy);
  c.fillStyle = '#8fb88a';
  c.beginPath(); c.moveTo(0, gy);
  for (let x = 0; x <= w; x += w / 10) c.lineTo(x, gy - h * (.1 + .05 * Math.sin(x * .02 + 1)));
  c.lineTo(w, gy); c.closePath(); c.fill();
  c.fillStyle = '#7fa35a'; c.fillRect(0, gy, w, h - gy);
  c.fillStyle = '#d2b27c'; c.fillRect(0, gy + h * .06, w, h * .08);
}

const DRAW = {
  house(c) {
    c.fillStyle = '#c8a46e'; rr(c, -30, -50, 60, 50, 4); c.fill();
    c.fillStyle = '#8a4a2a'; c.beginPath(); c.moveTo(-40, -48); c.lineTo(0, -88); c.lineTo(40, -48); c.closePath(); c.fill();
    c.fillStyle = '#5a3a22'; rr(c, -8, -28, 16, 28, 2); c.fill();
    c.fillStyle = '#f4e2a8'; c.fillRect(-24, -40, 10, 10); c.fillRect(14, -40, 10, 10);
  },
  kiln(c, t) {
    c.fillStyle = '#9a5230'; c.fillRect(-46, -30, 92, 30);
    c.fillStyle = '#b5673a'; c.beginPath(); c.arc(0, -30, 46, Math.PI, 0); c.fill();
    c.fillStyle = '#2a0f08'; rr(c, -14, -24, 28, 22, 6); c.fill();
    c.save(); c.globalAlpha *= .6 + .3 * Math.sin(t * 8);
    ell(c, 0, -12, 12, 8, '#ff8c2a');
    c.restore();
    ell(c, -30, -4, 9, 6, '#d9a06a'); ell(c, 32, -4, 9, 6, '#c98b55');
  },
  forge(c, t) {
    c.fillStyle = '#4a4a52'; rr(c, -36, -56, 72, 56, 4); c.fill();
    c.fillStyle = '#3a3a40'; rr(c, 14, -98, 16, 44, 2); c.fill();
    c.save(); c.globalAlpha *= .7 + .3 * Math.sin(t * 6);
    c.fillStyle = '#ff7a2a'; rr(c, -22, -34, 44, 26, 4); c.fill();
    c.restore();
    c.fillStyle = '#2a2a30'; rr(c, -12, -14, 24, 8, 2); c.fill();
    smoke(c, 22, -100, t, 3);
  },
  well(c) {
    ell(c, 0, -14, 28, 12, '#7b7f88');
    ell(c, 0, -17, 22, 8, '#2a3d52');
    c.strokeStyle = '#6b4424'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(-22, -20); c.lineTo(-22, -52); c.moveTo(22, -20); c.lineTo(22, -52); c.stroke();
    c.fillStyle = '#8a4a2a'; c.beginPath(); c.moveTo(-34, -50); c.lineTo(0, -72); c.lineTo(34, -50); c.closePath(); c.fill();
  },
  guild(c, t) {
    c.fillStyle = '#8b3a2a'; rr(c, -50, -80, 100, 80, 4); c.fill();
    c.fillStyle = '#c9a449'; rr(c, -56, -90, 112, 12, 3); c.fill();
    c.fillStyle = '#3a1f12'; c.beginPath(); c.moveTo(-12, 0); c.lineTo(-12, -30); c.arc(0, -30, 12, Math.PI, 0); c.lineTo(12, 0); c.closePath(); c.fill();
    c.fillStyle = '#f4e2a8'; c.fillRect(-38, -60, 14, 14); c.fillRect(24, -60, 14, 14);
    c.strokeStyle = '#4a2e1a'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -90); c.lineTo(0, -132); c.stroke();
    c.fillStyle = '#b3261e';
    c.beginPath(); c.moveTo(0, -132); c.lineTo(34, -124 + Math.sin(t * 4) * 3); c.lineTo(0, -116); c.closePath(); c.fill();
  },
  weave(c, t) {
    c.fillStyle = '#7a5a34'; rr(c, -50, -54, 100, 54, 3); c.fill();
    c.fillStyle = '#4a3424'; c.beginPath(); c.moveTo(-58, -52); c.lineTo(-50, -74); c.lineTo(50, -74); c.lineTo(58, -52); c.closePath(); c.fill();
    const cloth = ['#b3261e', '#e9b949', '#2f6b57', '#2a3a6b', '#e9574a'];
    cloth.forEach((col, i) => { c.fillStyle = col; c.fillRect(-38 + i * 15, -42, 9, 28 + Math.sin(t * 2 + i) * 2); });
  },
  market(c, t) {
    c.fillStyle = '#8a6a3e'; rr(c, -55, -34, 110, 34, 3); c.fill();
    for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#f4e2a8' : '#b3261e'; c.fillRect(-55 + i * 18.3, -62, 18.3, 16); }
    ['#e9574a', '#5fae4a', '#e9b949', '#9a5ae9'].forEach((col, i) => ell(c, -40 + i * 26, -38, 6, 6, col));
    c.fillStyle = '#5a3a22'; c.fillRect(-58, -34, 4, 34); c.fillRect(54, -34, 4, 34);
  },
  dock(c, t) {
    const bob = Math.sin(t * 2) * 1.5;
    c.fillStyle = '#6b4a2a'; rr(c, -60, -14, 120, 8, 2); c.fill();
    c.fillStyle = '#4a3424'; c.fillRect(-54, -6, 6, 14); c.fillRect(48, -6, 6, 14);
    c.save(); c.translate(0, bob);
    c.fillStyle = '#8a5a34'; c.beginPath(); c.moveTo(-40, -18); c.lineTo(40, -18); c.lineTo(30, -6); c.lineTo(-30, -6); c.closePath(); c.fill();
    c.strokeStyle = '#4a3424'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -18); c.lineTo(0, -54); c.stroke();
    c.fillStyle = '#f4e2a8'; c.beginPath(); c.moveTo(0, -52); c.lineTo(0, -22); c.lineTo(22, -22); c.closePath(); c.fill();
    c.restore();
  },
};

function smoke(c, x, y, t, n) {
  for (let i = 0; i < n; i++) {
    const k = ((t * .4 + i / n) % 1);
    c.save(); c.globalAlpha *= 1 - k;
    ell(c, x + Math.sin(t + i) * 4 + k * 10, y - k * 40, 5 + k * 7, 5 + k * 7, '#d8d4cc');
    c.restore();
  }
}

// Công trình đặt trên mặt đất gy, tâm theo x. a: độ hiện (0..1), công trình nhô lên dần khi a tăng.
export function drawBuilding(c, kind, x, gy, s = 1, t = 0, a = 1) {
  if (a <= 0) return;
  c.save();
  c.globalAlpha = a;
  c.translate(x, gy + (1 - a) * 18 * s); c.scale(s, s);
  ell(c, 0, 4, 60, 8, 'rgba(0,0,0,.25)');
  DRAW[kind](c, t);
  c.restore();
}

export function drawIcon(canvas, kind, tone) {
  const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  c.clearRect(0, 0, w, h);
  c.fillStyle = tone + '40'; rr(c, 0, 0, w, h, 10); c.fill();
  c.strokeStyle = shade(tone, 30); c.lineWidth = 2; rr(c, 1, 1, w - 2, h - 2, 10); c.stroke();
  drawBuilding(c, kind, w / 2, h * .88, Math.min(w, h) / 175, 0, 1);
}
