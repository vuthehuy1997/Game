// Hạt hiệu ứng và chữ bay. Game đẩy hạt vào `parts` (qua spark, dust hoặc tự push), gọi updateFx mỗi khung hình
// và drawParticles / drawTexts khi vẽ. Toạ độ là toạ độ thế giới của game.
// Hạt: { kind, x, y, vx, vy, life, max, col, size }. kind: 'spark' | 'dust' | 'leaf' | 'firefly' | khác (bay thẳng).
import { rand, prune } from './util.js';
import { ell, outlinedText } from '../art/draw.js';

export const parts = [], texts = [];

export function spark(x, y, n, col, spd = 300) {
  for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), v = rand(.3, 1) * spd; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(.2, .45), max: .45, col, size: rand(2, 4), kind: 'spark' }); }
}
export function dust(x, y, n = 6) { for (let i = 0; i < n; i++) parts.push({ x: x + rand(-14, 14), y, vx: rand(-80, 80), vy: rand(-80, -20), life: rand(.3, .6), max: .6, col: 'rgba(210,190,160,.7)', size: rand(4, 8), kind: 'dust' }); }
export function floatText(x, y, txt, col = '#fff', size = 22) { texts.push({ x, y, txt, col, size, life: .9, vy: -70 }); }
export function clearFx() { parts.length = 0; texts.length = 0; }

// t = đồng hồ của game (giây), dùng cho chuyển động lắc lư
export function updateParticles(dt, t = 0) {
  for (const p of parts) {
    p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.kind === 'spark') { p.vx *= .9; p.vy = p.vy * .9 + 400 * dt; }
    else if (p.kind === 'leaf') p.vx += Math.sin(t * 2 + p.size) * 20 * dt;
    else if (p.kind === 'firefly') { p.vx += rand(-40, 40) * dt; p.vy += rand(-40, 40) * dt; }
    else if (p.kind === 'dust') { p.vx *= .92; p.vy *= .92; }
  }
  prune(parts, p => p.life > 0);
  for (const x of texts) { x.life -= dt; x.y += x.vy * dt; x.vy *= .95; }
  prune(texts, x => x.life > 0);
}
export function drawParticles(c, t = 0) {
  for (const p of parts) {
    c.globalAlpha = Math.max(0, Math.min(1, p.life / p.max * 1.5));
    if (p.kind === 'spark') { c.strokeStyle = p.col; c.lineWidth = p.size * .8; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.vx * .03, p.y - p.vy * .03); c.stroke(); }
    else if (p.kind === 'leaf') ell(c, p.x, p.y, p.size, p.size * .55, p.col, t * 2 + p.size);
    else if (p.kind === 'firefly') { c.globalAlpha *= .5 + Math.sin(t * 6 + p.x) * .5; ell(c, p.x, p.y, p.size * 2.5, p.size * 2.5, 'rgba(217,242,122,.25)'); ell(c, p.x, p.y, p.size, p.size, p.col); }
    else ell(c, p.x, p.y, p.size, p.size, p.col);
  }
  c.globalAlpha = 1;
}
// fontFamily: họ phông CSS, ví dụ FB trong ui/theme.js
export function drawTexts(c, fontFamily) {
  c.textAlign = 'center';
  for (const t of texts) { c.globalAlpha = Math.min(1, t.life * 2); outlinedText(c, t.txt, t.x, t.y, `${t.size}px ${fontFamily}`, t.col); }
  c.globalAlpha = 1;
}
