// Vẽ tile, quái, đồi xa theo khu vực, và icon vật phẩm — màu sắc làng quê Việt Nam.
import { ell, rr, shade } from '../../../platform/art/draw.js';
import { TILE, ITEMS, BIOME_SKY } from './data.js';

export const TILE_COLOR = {
  [TILE.DIRT]: '#6b4a2e', [TILE.STONE]: '#787c82', [TILE.BAMBOO]: '#6fae46',
  [TILE.COPPER]: '#787c82', [TILE.IRON]: '#787c82', [TILE.SILVER]: '#787c82', [TILE.GOLD]: '#787c82',
  [TILE.WALL]: '#9a7a4a', [TILE.ROOF]: '#c9a54a', [TILE.BRICK]: '#b5583a', [TILE.DOOR]: '#6b4a2a',
  [TILE.BENCH]: '#5a4228', [TILE.BEDROCK]: '#2a2420',
};
const ORE_FLECK = {
  [TILE.COPPER]: '#e08a4a', [TILE.IRON]: '#d8dde2', [TILE.SILVER]: '#f0f4f8', [TILE.GOLD]: '#ffd93a',
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

  if (code === TILE.DIRT) {
    c.fillStyle = shade('#6b4a2e', -18);
    ell(c, x + s * .3, y + s * .35, s * .07, s * .06, shade('#6b4a2e', -18));
    ell(c, x + s * .68, y + s * .6, s * .06, s * .05, shade('#6b4a2e', -18));
    ell(c, x + s * .5, y + s * .82, s * .055, s * .05, shade('#6b4a2e', -30));
  }
  if (code === TILE.STONE) {
    c.strokeStyle = shade('#787c82', -30); c.lineWidth = 1;
    c.beginPath(); c.moveTo(x + s * .2, y + s * .25); c.lineTo(x + s * .45, y + s * .5); c.stroke();
    c.fillStyle = shade('#787c82', 16); c.fillRect(x + s * .55, y + s * .15, s * .28, s * .18);
  }
  if (ORE_FLECK[code]) {
    // quặng: nền đá + đốm sáng đặc trưng theo loại, nổi bật rõ ràng
    const fleck = ORE_FLECK[code];
    ell(c, x + s * .3, y + s * .3, s * .13, s * .12, fleck);
    ell(c, x + s * .68, y + s * .55, s * .1, s * .09, fleck);
    ell(c, x + s * .45, y + s * .75, s * .09, s * .08, fleck);
    c.fillStyle = shade(fleck, 40); c.fillRect(x + s * .27, y + s * .27, s * .05, s * .05);
  }
  if (grassTop && (code === TILE.DIRT)) { c.fillStyle = '#7fae4a'; c.fillRect(x, y, s + .6, s * .28); }
  if (code === TILE.BAMBOO) {
    c.strokeStyle = '#4a7a2e'; c.lineWidth = 2;
    for (let i = 1; i < 3; i++) { c.beginPath(); c.moveTo(x, y + s * i / 3); c.lineTo(x + s, y + s * i / 3); c.stroke(); }
    c.strokeStyle = shade('#6fae46', 30); c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(x + s * .3, y + 1); c.lineTo(x + s * .3, y + s - 1); c.stroke();
  }
  if (code === TILE.WALL) {
    c.strokeStyle = shade('#9a7a4a', -25); c.lineWidth = 1.5;
    for (const fx of [.25, .5, .75]) { c.beginPath(); c.moveTo(x + s * fx, y + 1); c.lineTo(x + s * fx, y + s - 1); c.stroke(); }
  }
  if (code === TILE.DOOR) {
    c.strokeStyle = shade('#6b4a2a', -20); c.lineWidth = 1.2;
    for (const fx of [.3, .55, .8]) { c.beginPath(); c.moveTo(x + s * fx, y + s * .1); c.lineTo(x + s * fx, y + s * .9); c.stroke(); }
    c.fillStyle = '#e9b949'; c.fillRect(x + s * .7, y + s * .45, s * .12, s * .12);
  }
  if (code === TILE.ROOF) {
    c.fillStyle = shade(TILE_COLOR[code], -15); c.fillRect(x, y, s + .6, s * .22);
    c.strokeStyle = shade(TILE_COLOR[code], -40); c.lineWidth = 1;
    for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(x + s * .2 + i * s * .3, y + s); c.lineTo(x + s * .35 + i * s * .3, y + s * .3); c.stroke(); }
  }
  if (code === TILE.BRICK) {
    c.strokeStyle = shade('#b5583a', -35); c.lineWidth = 1;
    c.beginPath(); c.moveTo(x, y + s * .33); c.lineTo(x + s, y + s * .33); c.moveTo(x, y + s * .66); c.lineTo(x + s, y + s * .66); c.stroke();
    c.beginPath(); c.moveTo(x + s * .5, y); c.lineTo(x + s * .5, y + s * .33); c.moveTo(x + s * .2, y + s * .33); c.lineTo(x + s * .2, y + s * .66); c.moveTo(x + s * .75, y + s * .66); c.lineTo(x + s * .75, y + s); c.stroke();
  }
}

// Đồi xa mờ phía sau world, màu riêng theo khu vực để nhận ra ngay đang ở đâu
export function drawBackdrop(c, biome, W, H) {
  const pal = BIOME_SKY[biome];
  c.fillStyle = pal.hill;
  const baseY = H * .64;
  ell(c, W * .15, baseY, W * .22, H * .14, pal.hill);
  ell(c, W * .45, baseY + H * .03, W * .26, H * .16, pal.hill);
  ell(c, W * .78, baseY - H * .02, W * .24, H * .15, pal.hill);
  ell(c, W * 1.02, baseY, W * .2, H * .13, pal.hill);
}

export function drawMob(c, kind, x, y, t) {
  if (kind === 'ma_troi') {
    const bob = Math.sin(t * 3 + x * .1) * 6;
    c.globalAlpha = .55; ell(c, x, y - 20 + bob, 20, 20, '#bfe6a0'); c.globalAlpha = 1;
    ell(c, x, y - 20 + bob, 11, 11, '#e8ffd0');
    ell(c, x - 4, y - 21 + bob, 2.2, 3, '#1b1411'); ell(c, x + 4, y - 21 + bob, 2.2, 3, '#1b1411');
  } else if (kind === 'boss_vua_quai') {
    rr(c, x - 22, y - 56, 44, 56, 8); c.fillStyle = '#3a1f14'; c.fill();
    c.strokeStyle = shade('#3a1f14', -22); c.lineWidth = 2.5; c.stroke();
    c.fillStyle = '#d8d0c0';
    c.beginPath(); c.moveTo(x - 16, y - 52); c.lineTo(x - 25, y - 72); c.lineTo(x - 8, y - 50); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(x + 16, y - 52); c.lineTo(x + 25, y - 72); c.lineTo(x + 8, y - 50); c.closePath(); c.fill();
    const glow = .55 + Math.sin(t * .25) * .35;
    c.globalAlpha = glow; ell(c, x - 8, y - 36, 4.5, 4.5, '#ff5a3a'); ell(c, x + 8, y - 36, 4.5, 4.5, '#ff5a3a'); c.globalAlpha = 1;
    ell(c, x - 8, y - 36, 1.8, 1.8, '#fff'); ell(c, x + 8, y - 36, 1.8, 1.8, '#fff');
  } else {
    rr(c, x - 12, y - 30, 24, 30, 6); c.fillStyle = '#5a3a2a'; c.fill();
    ell(c, x - 4, y - 20, 2.2, 3, '#ffd35a'); ell(c, x + 5, y - 20, 2.2, 3, '#ffd35a');
  }
}

// Icon nhỏ cho hotbar/bảng chế tạo/cửa hàng, thay thế ô màu phẳng cũ
export function drawItemIcon(c, id, cx, cy, size) {
  const def = ITEMS[id]; if (!def) return;
  const col = def.color, s = size;
  c.save(); c.translate(cx, cy);
  if (def.tool && id.startsWith('cuoc')) {
    c.strokeStyle = '#8a6a3a'; c.lineWidth = s * .09; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-s * .18, s * .3); c.lineTo(s * .18, -s * .3); c.stroke();
    c.fillStyle = col;
    c.beginPath(); c.moveTo(s * .08, -s * .42); c.lineTo(s * .4, -s * .1); c.lineTo(s * .18, s * .08); c.lineTo(-s * .05, -s * .22); c.closePath(); c.fill();
    c.strokeStyle = shade(col, -30); c.lineWidth = 1; c.stroke();
  } else if (def.tool && id.startsWith('giao')) {
    c.strokeStyle = '#8a6a3a'; c.lineWidth = s * .08; c.beginPath(); c.moveTo(0, s * .4); c.lineTo(0, -s * .15); c.stroke();
    c.fillStyle = col; c.beginPath(); c.moveTo(0, -s * .45); c.lineTo(s * .13, -s * .1); c.lineTo(-s * .13, -s * .1); c.closePath(); c.fill();
  } else if (def.tool && id.startsWith('kiem')) {
    c.fillStyle = col; c.fillRect(-s * .05, -s * .42, s * .1, s * .62);
    c.fillStyle = shade(col, 30); c.fillRect(-s * .02, -s * .4, s * .04, s * .3);
    c.fillStyle = '#8a6a3a'; c.fillRect(-s * .18, s * .16, s * .36, s * .07);
    c.fillStyle = '#5a4228'; c.fillRect(-s * .04, s * .2, s * .08, s * .22);
    if (id === 'kiem_ngoc') { c.globalAlpha = .7; ell(c, 0, -s * .1, s * .1, s * .1, '#cffaff'); c.globalAlpha = 1; }
  } else if (id === 'tuong_tre' || id === 'cua_tre') {
    c.fillStyle = col; rr(c, -s * .32, -s * .32, s * .64, s * .64, s * .06); c.fill();
    c.strokeStyle = shade(col, -30); c.lineWidth = 1;
    for (const fx of [-.15, 0, .15]) { c.beginPath(); c.moveTo(s * fx, -s * .3); c.lineTo(s * fx, s * .3); c.stroke(); }
  } else if (id === 'mai_tranh') {
    c.fillStyle = col; c.beginPath(); c.moveTo(-s * .35, s * .2); c.lineTo(0, -s * .3); c.lineTo(s * .35, s * .2); c.closePath(); c.fill();
    c.strokeStyle = shade(col, -30); c.lineWidth = 1; c.stroke();
  } else if (id === 'gach_gom') {
    c.fillStyle = col; rr(c, -s * .32, -s * .22, s * .64, s * .44, s * .04); c.fill();
    c.strokeStyle = shade(col, -35); c.lineWidth = 1;
    c.beginPath(); c.moveTo(-s * .32, 0); c.lineTo(s * .32, 0); c.moveTo(0, -s * .22); c.lineTo(0, 0); c.stroke();
  } else if (id === 'duoc') {
    c.fillStyle = '#6b4a2a'; c.fillRect(-s * .05, -s * .05, s * .1, s * .42);
    ell(c, 0, -s * .18, s * .16, s * .14, '#ffb23a');
  } else if (id === 'ban_che') {
    c.fillStyle = col; rr(c, -s * .34, -s * .1, s * .68, s * .3, s * .05); c.fill();
    c.fillStyle = shade(col, -25); c.fillRect(-s * .28, s * .2, s * .08, s * .18); c.fillRect(s * .2, s * .2, s * .08, s * .18);
  } else if (id === 'ngoc_quy') {
    c.fillStyle = col;
    c.beginPath(); c.moveTo(0, -s * .38); c.lineTo(s * .28, -s * .05); c.lineTo(s * .16, s * .36); c.lineTo(-s * .16, s * .36); c.lineTo(-s * .28, -s * .05); c.closePath(); c.fill();
    c.strokeStyle = shade(col, -30); c.lineWidth = 1; c.stroke();
    c.globalAlpha = .8; ell(c, -s * .05, -s * .12, s * .07, s * .07, '#fff'); c.globalAlpha = 1;
  } else {
    // nguyên liệu thô: cục/mảnh bất quy tắc
    c.fillStyle = col;
    c.beginPath(); c.moveTo(-s * .3, s * .1); c.lineTo(-s * .12, -s * .3); c.lineTo(s * .18, -s * .28); c.lineTo(s * .32, s * .05); c.lineTo(s * .1, s * .34); c.lineTo(-s * .18, s * .3); c.closePath(); c.fill();
    c.strokeStyle = shade(col, -30); c.lineWidth = 1; c.stroke();
    c.fillStyle = shade(col, 35); c.beginPath(); c.ellipse(-s * .05, -s * .1, s * .08, s * .06, .3, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}
