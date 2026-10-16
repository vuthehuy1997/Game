// Công trình cố định (Mỏ vàng/Nhà dân/Doanh trại) và 2 căn cứ vẽ bằng canvas. Mỗi thời kỳ có
// bộ màu riêng (mái, tường, cờ) để cảm nhận được xuyên thế kỷ.
import { rr, ell, shade } from '../../../platform/art/draw.js';

export const ERA_ART = [
  { roof: '#8a6a3a', wall: '#6b4a2a', flag: '#3a7a3a', grass: '#5f9a3a', dirt: '#6b5a3a' },
  { roof: '#5a3a22', wall: '#7a5a3a', flag: '#2f6f8f', grass: '#4f8a46', dirt: '#5a4c36' },
  { roof: '#9a6a2a', wall: '#8a6a4a', flag: '#e0c040', grass: '#7a9a3a', dirt: '#8a7048' },
  { roof: '#3a3a5a', wall: '#5a4a3a', flag: '#b3261e', grass: '#4f7a40', dirt: '#5c5040' },
  { roof: '#5a2a2a', wall: '#4a3024', flag: '#d4a017', grass: '#4a6a36', dirt: '#4e4032' },
  { roof: '#2f5a3a', wall: '#3a3026', flag: '#c0392b', grass: '#3f6a3a', dirt: '#463a2c' },
];
const TENT = '#d9c7a0', WOOD_LIGHT = '#c9b28f', STONE = '#6b5a46', OUTLINE = 'rgba(20,14,10,.55)';
const ORE = '#ffd35a';

export function artFor(eraIdx) { return ERA_ART[eraIdx] || ERA_ART[0]; }

function drawRoof(c, x, y, w, h, col) {
  c.fillStyle = col; c.beginPath();
  c.moveTo(x - w / 2 - 6, y); c.quadraticCurveTo(x - w / 2, y - h * .25, x - w / 2 + 4, y - h * .25);
  c.lineTo(x, y - h); c.lineTo(x + w / 2 - 4, y - h * .25); c.quadraticCurveTo(x + w / 2, y - h * .25, x + w / 2 + 6, y);
  c.closePath(); c.fill();
  c.strokeStyle = shade(col, -35); c.lineWidth = 1.5; c.stroke();
}

export function palisade(c, x, L, half, n) {
  c.strokeStyle = WOOD_LIGHT; c.lineWidth = 3; c.lineCap = 'round';
  for (let i = 0; i <= n; i++) {
    const px = x - half + (i * 2 * half) / n;
    c.beginPath(); c.moveTo(px, L); c.lineTo(px, L - 10); c.stroke();
  }
}

export function drawFlag(c, x, top, h, col, t) {
  c.strokeStyle = '#3a2a1a'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(x, top); c.lineTo(x, top - h); c.stroke();
  const w = Math.sin(t * 6) * 2;
  c.fillStyle = col; c.beginPath(); c.moveTo(x, top - h); c.lineTo(x + 13, top - h + 4 + w); c.lineTo(x, top - h + 9); c.closePath(); c.fill();
}

// Doanh trại: lều vải + cờ hiệu (giữ nguyên phong cách trại cũ, không còn cấp bậc).
export function drawBarracks(c, x, L, eraIdx, t) {
  const art = artFor(eraIdx);
  c.save();
  ell(c, x, L + 3, 26, 6, 'rgba(0,0,0,.28)');
  c.fillStyle = TENT; c.beginPath(); c.moveTo(x - 22, L); c.lineTo(x, L - 36); c.lineTo(x + 22, L); c.closePath(); c.fill();
  c.strokeStyle = OUTLINE; c.lineWidth = 1.5; c.stroke();
  c.strokeStyle = art.roof; c.lineWidth = 4; c.beginPath(); c.moveTo(x, L - 36); c.lineTo(x, L); c.stroke();
  c.fillStyle = shade(TENT, -60); c.beginPath(); c.moveTo(x - 6, L); c.lineTo(x, L - 14); c.lineTo(x + 6, L); c.closePath(); c.fill();
  drawFlag(c, x, L - 36, 18, art.flag, t);
  c.restore();
}

// Nhà dân: mái tranh đơn giản của làng.
export function drawHouse(c, x, L, eraIdx) {
  const art = artFor(eraIdx);
  c.save();
  ell(c, x, L + 3, 22, 5, 'rgba(0,0,0,.28)');
  const top = L - 24;
  c.fillStyle = art.wall; rr(c, x - 18, top, 36, 24, 3); c.fill();
  drawRoof(c, x, top, 44, 16, art.roof);
  c.fillStyle = shade(art.wall, -50); c.fillRect(x - 4, L - 11, 8, 11);
  c.restore();
}

// Mỏ vàng: gò đất có cửa hầm và vài cục quặng vàng lấp lánh.
export function drawMine(c, x, L, eraIdx, t) {
  const art = artFor(eraIdx);
  c.save();
  ell(c, x, L + 3, 26, 6, 'rgba(0,0,0,.28)');
  c.fillStyle = shade(art.dirt, -10); c.beginPath();
  c.moveTo(x - 24, L); c.quadraticCurveTo(x - 20, L - 30, x, L - 34); c.quadraticCurveTo(x + 20, L - 30, x + 24, L); c.closePath(); c.fill();
  c.strokeStyle = OUTLINE; c.lineWidth = 1.5; c.stroke();
  ell(c, x, L - 6, 9, 12, '#1c1410');
  [[-10, -16], [8, -20], [0, -4]].forEach(([dx, dy], i) => {
    const a = .6 + Math.sin(t * 4 + i) * .4;
    ell(c, x + dx, L + dy, 4, 3.4, `rgba(255,211,90,${a})`);
  });
  c.restore();
}

// Nhà chính: tường thành có lỗ ở mép trên, dinh xếp 3 tầng mái cong cố định (không còn cấp nâng
// cấp). `flip` lật các chi tiết bất đối xứng (cờ) để căn cứ địch quay mặt ngược với căn cứ ta.
export const WALL_TOP = 236, WALL_BOTTOM = 454, HQ_HEIGHT = 96;
export function drawHQ(c, eraIdx, t, x, flip = false, wallTop = WALL_TOP, wallBottom = WALL_BOTTOM) {
  const art = artFor(eraIdx), fx = flip ? -1 : 1;
  c.save();
  c.fillStyle = STONE; rr(c, x - 40, wallTop, 80, wallBottom - wallTop, 4); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1.5;
  for (let y = wallTop + 18; y < wallBottom; y += 18) { c.beginPath(); c.moveTo(x - 40, y); c.lineTo(x + 40, y); c.stroke(); }
  c.fillStyle = shade(STONE, 20);
  for (let i = 0; i < 5; i++) c.fillRect(x - 40 + i * 17, wallTop - 8, 9, 8);
  for (let i = 0; i < 3; i++) {
    const bottom = wallTop - i * 32, w = 52 - i * 10;
    c.fillStyle = art.wall; rr(c, x - w / 2, bottom - 20, w, 20, 2); c.fill();
    c.fillStyle = '#1c1410'; c.fillRect(x - 5, bottom - 15, 10, 9);
    drawRoof(c, x, bottom - 20, w + 14, 12, art.roof);
  }
  drawFlag(c, x + fx * 22, wallTop - 4, 22, art.flag, t);
  c.restore();
}
