// Vẽ tile và quái bằng hình khối đơn giản, màu sắc làng quê Việt Nam.
import { ell, shade, rr } from '../../../platform/art/draw.js';
import { TILE } from './data.js';

export const TILE_COLOR = {
  [TILE.DIRT]: '#6b4a2e', [TILE.STONE]: '#787c82', [TILE.BAMBOO]: '#6fae46',
  [TILE.COPPER]: '#c97a45', [TILE.IRON]: '#9a8a7a', [TILE.SILVER]: '#d8dde4', [TILE.GOLD]: '#e9c349',
  [TILE.WALL]: '#9a7a4a', [TILE.ROOF]: '#c9a54a', [TILE.BRICK]: '#b5583a', [TILE.DOOR]: '#6b4a2a',
  [TILE.BENCH]: '#5a4228', [TILE.BEDROCK]: '#2a2420',
};

export function drawTile(c, code, x, y, s, grassTop) {
  if (code === TILE.AIR) return;
  if (code === TILE.TORCH) {
    c.fillStyle = '#6b4a2a'; c.fillRect(x + s * .44, y + s * .3, s * .12, s * .7);
    ell(c, x + s * .5, y + s * .22, s * .22, s * .2, '#ffb23a');
    return;
  }
  c.fillStyle = TILE_COLOR[code] || '#444';
  c.fillRect(x, y, s + .6, s + .6);
  c.strokeStyle = shade(TILE_COLOR[code] || '#444', -22); c.lineWidth = 1;
  c.strokeRect(x + .5, y + .5, s - 1, s - 1);
  if (grassTop && (code === TILE.DIRT)) { c.fillStyle = '#7fae4a'; c.fillRect(x, y, s + .6, s * .28); }
  if (code === TILE.BAMBOO) {
    c.strokeStyle = '#4a7a2e'; c.lineWidth = 2;
    for (let i = 1; i < 3; i++) { c.beginPath(); c.moveTo(x, y + s * i / 3); c.lineTo(x + s, y + s * i / 3); c.stroke(); }
  }
  if (code === TILE.DOOR) { c.fillStyle = '#e9b949'; c.fillRect(x + s * .7, y + s * .45, s * .12, s * .12); }
  if (code === TILE.ROOF) { c.fillStyle = shade(TILE_COLOR[code], -15); c.fillRect(x, y, s + .6, s * .22); }
}

export function drawMob(c, kind, x, y, t) {
  if (kind === 'ma_troi') {
    const bob = Math.sin(t * 3 + x * .1) * 6;
    c.globalAlpha = .55; ell(c, x, y - 20 + bob, 20, 20, '#bfe6a0'); c.globalAlpha = 1;
    ell(c, x, y - 20 + bob, 11, 11, '#e8ffd0');
    ell(c, x - 4, y - 21 + bob, 2.2, 3, '#1b1411'); ell(c, x + 4, y - 21 + bob, 2.2, 3, '#1b1411');
  } else {
    rr(c, x - 12, y - 30, 24, 30, 6); c.fillStyle = '#5a3a2a'; c.fill();
    ell(c, x - 4, y - 20, 2.2, 3, '#ffd35a'); ell(c, x + 5, y - 20, 2.2, 3, '#ffd35a');
  }
}
