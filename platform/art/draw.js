// Hàm vẽ cơ bản trên canvas 2D. Tham số đầu `c` luôn là context cần vẽ.
import { clamp } from '../core/util.js';

export function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
export function ell(c, x, y, rx, ry, col, rot = 0) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, Math.PI * 2); c.fill(); }
export const shadeCache = {};
export function shade(hex, amt) {
  const k = hex + amt; if (shadeCache[k]) return shadeCache[k];
  const n = parseInt(hex.slice(1), 16), f = v => clamp(v + amt, 0, 255);
  return shadeCache[k] = `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
export function limb(c, x, y, a, len, w, col) {
  const x2 = x + Math.sin(a) * len, y2 = y + Math.cos(a) * len;
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke();
  return [x2, y2];
}
// Chữ có viền, dễ đọc trên mọi nền
export function outlinedText(c, txt, x, y, font, fill, stroke = 'rgba(20,14,10,.85)', lw = 4) {
  c.font = font; c.lineWidth = lw; c.strokeStyle = stroke; c.strokeText(txt, x, y); c.fillStyle = fill; c.fillText(txt, x, y);
}
// Bóng đổ dưới chân nhân vật đứng ở mặt đất gy
export function groundShadow(c, x, gy, s = 1) { ell(c, x, gy + 2, 26 * s, 6 * s, 'rgba(0,0,0,.28)'); }
