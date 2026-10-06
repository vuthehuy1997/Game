// Công trình và ô đất vẽ bằng canvas. Mỗi thời kỳ có bộ màu riêng (mái, tường, cờ) để cảm nhận được xuyên thế kỷ.
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

// Chiều cao (px) của từng công trình theo cấp, dùng để vẽ và để test
export function buildingHeight(kind, lvl = 1) {
  if (kind === 'camp') return [42, 50, 68][lvl - 1];
  if (kind === 'tower') return 60;
  if (kind === 'stake') return 30;
  if (kind === 'hq') return 32 * lvl;
  return 0;
}

export function artFor(eraIdx) { return ERA_ART[eraIdx] || ERA_ART[0]; }

// Ô đất: đất khô nếu đã có công trình, cỏ nếu còn trống; ô trống có dấu + mờ để gợi ý xây
export function drawPlotGround(c, x, L, occupied, eraIdx, t) {
  const art = artFor(eraIdx);
  c.save();
  c.fillStyle = occupied ? art.dirt : art.grass;
  rr(c, x - 28, L - 44, 56, 52, 8); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 2; c.stroke();
  c.strokeStyle = shade(occupied ? art.dirt : art.grass, 30); c.lineWidth = 1.5;
  for (const [dx, dy] of [[-18, -30], [14, -34], [-8, -16], [18, -12], [-20, -4]]) {
    c.beginPath(); c.moveTo(x + dx, L + dy); c.lineTo(x + dx - 2, L + dy - 4); c.moveTo(x + dx, L + dy); c.lineTo(x + dx + 2, L + dy - 4); c.stroke();
  }
  if (!occupied) {
    const a = .45 + Math.sin(t * 3) * .15;
    c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - 7, L - 20); c.lineTo(x + 7, L - 20); c.moveTo(x, L - 27); c.lineTo(x, L - 13); c.stroke();
  }
  c.restore();
}

export function drawBuilding(c, kind, lvl, eraIdx, x, L, t) {
  const art = artFor(eraIdx);
  c.save();
  ell(c, x, L + 3, 30, 6, 'rgba(0,0,0,.28)');
  if (kind === 'camp') drawCamp(c, x, L, lvl, art, t);
  else if (kind === 'tower') drawTower(c, x, L, art, t);
  else if (kind === 'stake') drawStakes(c, x, L, art);
  c.restore();
}

function drawCamp(c, x, L, lvl, art, t) {
  if (lvl === 1) {
    c.fillStyle = TENT; c.beginPath(); c.moveTo(x - 24, L); c.lineTo(x, L - 40); c.lineTo(x + 24, L); c.closePath(); c.fill();
    c.strokeStyle = OUTLINE; c.lineWidth = 1.5; c.stroke();
    c.strokeStyle = art.roof; c.lineWidth = 4; c.beginPath(); c.moveTo(x, L - 40); c.lineTo(x, L); c.stroke();
    c.fillStyle = shade(TENT, -60); c.beginPath(); c.moveTo(x - 6, L); c.lineTo(x, L - 16); c.lineTo(x + 6, L); c.closePath(); c.fill();
    drawFlag(c, x, L - 40, 18, art.flag, t);
    return;
  }
  if (lvl === 2) {
    const top = L - 30;
    c.fillStyle = art.wall; rr(c, x - 22, top, 44, 30, 3); c.fill();
    drawRoof(c, x, top, 54, 20, art.roof);
    c.fillStyle = shade(art.wall, -50); c.fillRect(x - 5, L - 14, 10, 14);
    palisade(c, x, L, 30, 4);
    drawFlag(c, x + 16, top - 20, 16, art.flag, t);
    return;
  }
  const top = L - 34;
  c.fillStyle = art.wall; rr(c, x - 30, top, 60, 34, 3); c.fill();
  drawRoof(c, x, top, 68, 22, art.roof);
  c.fillStyle = art.wall; rr(c, x - 16, top - 22, 32, 22, 3); c.fill();
  drawRoof(c, x, top - 22, 38, 12, art.roof);
  c.fillStyle = shade(art.wall, -50); c.fillRect(x - 5, L - 14, 10, 14);
  c.fillStyle = '#1c1410'; c.fillRect(x - 11, top - 16, 6, 6); c.fillRect(x + 5, top - 16, 6, 6);
  palisade(c, x, L, 38, 5);
  drawFlag(c, x - 24, top - 4, 18, art.flag, t);
  drawFlag(c, x + 24, top - 4, 18, art.flag, t + .5);
}

function drawTower(c, x, L, art, t) {
  const top = L - 46;
  c.strokeStyle = '#6b4a2a'; c.lineWidth = 4; c.lineCap = 'round';
  [-16, 16].forEach(dx => { c.beginPath(); c.moveTo(x + dx, L); c.lineTo(x + dx * .7, top); c.stroke(); });
  c.lineWidth = 2;
  c.beginPath(); c.moveTo(x - 13, L - 16); c.lineTo(x + 13, L - 16); c.moveTo(x - 11, L - 30); c.lineTo(x + 11, L - 30); c.stroke();
  c.fillStyle = '#8a6a3a'; rr(c, x - 22, top, 44, 6, 2); c.fill();
  c.fillStyle = art.wall; rr(c, x - 14, top - 16, 28, 16, 2); c.fill();
  c.fillStyle = '#1c1410'; c.fillRect(x - 6, top - 12, 12, 6);
  drawRoof(c, x, top - 16, 36, 12, art.roof);
  drawFlag(c, x, top - 28, 16, art.flag, t);
}

function drawStakes(c, x, L, art) {
  for (let i = -2; i <= 2; i++) {
    const sx = x + i * 9;
    c.fillStyle = WOOD_LIGHT; c.beginPath(); c.moveTo(sx - 3.5, L); c.lineTo(sx, L - 30 + Math.abs(i) * 2); c.lineTo(sx + 3.5, L); c.closePath(); c.fill();
    c.strokeStyle = OUTLINE; c.lineWidth = 1; c.stroke();
  }
  c.fillStyle = art.wall; rr(c, x - 22, L - 14, 44, 5, 2); c.fill();
}

function drawRoof(c, x, y, w, h, col) {
  c.fillStyle = col; c.beginPath();
  c.moveTo(x - w / 2 - 6, y); c.quadraticCurveTo(x - w / 2, y - h * .25, x - w / 2 + 4, y - h * .25);
  c.lineTo(x, y - h); c.lineTo(x + w / 2 - 4, y - h * .25); c.quadraticCurveTo(x + w / 2, y - h * .25, x + w / 2 + 6, y);
  c.closePath(); c.fill();
  c.strokeStyle = shade(col, -35); c.lineWidth = 1.5; c.stroke();
}

function palisade(c, x, L, half, n) {
  c.strokeStyle = WOOD_LIGHT; c.lineWidth = 3; c.lineCap = 'round';
  for (let i = 0; i <= n; i++) {
    const px = x - half + (i * 2 * half) / n;
    c.beginPath(); c.moveTo(px, L); c.lineTo(px, L - 10); c.stroke();
  }
}

function drawFlag(c, x, top, h, col, t) {
  c.strokeStyle = '#3a2a1a'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(x, top); c.lineTo(x, top - h); c.stroke();
  const w = Math.sin(t * 6) * 2;
  c.fillStyle = col; c.beginPath(); c.moveTo(x, top - h); c.lineTo(x + 13, top - h + 4 + w); c.lineTo(x, top - h + 9); c.closePath(); c.fill();
}

// Nhà chính: tường thành có lỉnh ở mép trên, dinh xếp nhiều tầng mái cong theo cấp
export const WALL_TOP = 236, WALL_BOTTOM = 454;
export function drawHQ(c, lvl, eraIdx, t, x = 70, wallTop = WALL_TOP, wallBottom = WALL_BOTTOM) {
  const art = artFor(eraIdx);
  c.save();
  c.fillStyle = STONE; rr(c, x - 40, wallTop, 80, wallBottom - wallTop, 4); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1.5;
  for (let y = wallTop + 18; y < wallBottom; y += 18) { c.beginPath(); c.moveTo(x - 40, y); c.lineTo(x + 40, y); c.stroke(); }
  c.fillStyle = shade(STONE, 20);
  for (let i = 0; i < 5; i++) c.fillRect(x - 40 + i * 17, wallTop - 8, 9, 8);
  for (let i = 0; i < lvl; i++) {
    const bottom = wallTop - i * 32, w = 52 - i * 10;
    c.fillStyle = art.wall; rr(c, x - w / 2, bottom - 20, w, 20, 2); c.fill();
    c.fillStyle = '#1c1410'; c.fillRect(x - 5, bottom - 15, 10, 9);
    drawRoof(c, x, bottom - 20, w + 14, 12, art.roof);
  }
  if (lvl >= 2) drawFlag(c, x + 22, wallTop - 4, 22, art.flag, t);
  c.restore();
}
