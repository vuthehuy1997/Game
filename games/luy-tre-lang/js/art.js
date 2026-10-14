// Vẽ tile, quái, đồi xa theo khu vực, và icon vật phẩm — màu sắc làng quê Việt Nam.
import { ell, rr, shade } from '../../../platform/art/draw.js';
import { TILE, ITEMS, BIOME_SKY } from './data.js';

export const TILE_COLOR = {
  [TILE.DIRT]: '#6b4a2e', [TILE.STONE]: '#787c82', [TILE.BAMBOO]: '#6fae46',
  [TILE.COPPER]: '#787c82', [TILE.IRON]: '#787c82', [TILE.SILVER]: '#787c82', [TILE.GOLD]: '#787c82',
  [TILE.WALL]: '#9a7a4a', [TILE.ROOF]: '#c9a54a', [TILE.BRICK]: '#b5583a', [TILE.DOOR]: '#6b4a2a',
  [TILE.BENCH]: '#5a4228', [TILE.BEDROCK]: '#2a2420', [TILE.FARMLAND]: '#5a3f24', [TILE.WATER]: '#3a6a7a',
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
  if (code === TILE.FARMLAND) {
    c.fillStyle = TILE_COLOR[code]; c.fillRect(x, y, s + .6, s + .6);
    c.strokeStyle = shade(TILE_COLOR[code], -22); c.lineWidth = 1; c.strokeRect(x + .5, y + .5, s - 1, s - 1);
    c.strokeStyle = shade(TILE_COLOR[code], -32); c.lineWidth = 1.2;
    for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(x + s * i / 4, y + s * .18); c.lineTo(x + s * i / 4, y + s * .92); c.stroke(); }
    return;
  }
  if (code === TILE.WATER) {
    c.globalAlpha = .82; c.fillStyle = TILE_COLOR[code]; c.fillRect(x, y, s + .6, s + .6); c.globalAlpha = 1;
    c.strokeStyle = shade(TILE_COLOR[code], 35); c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(x, y + s * .32); c.lineTo(x + s, y + s * .32); c.stroke();
    c.beginPath(); c.moveTo(x, y + s * .68); c.lineTo(x + s, y + s * .68); c.stroke();
    return;
  }
  if (code === TILE.REED) {
    c.strokeStyle = '#5a8a4a'; c.lineWidth = 1.5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x + s * .28, y + s); c.lineTo(x + s * .22, y + s * .08); c.stroke();
    c.beginPath(); c.moveTo(x + s * .52, y + s); c.lineTo(x + s * .58, y - s * .05); c.stroke();
    c.beginPath(); c.moveTo(x + s * .76, y + s); c.lineTo(x + s * .72, y + s * .18); c.stroke();
    c.fillStyle = shade('#5a8a4a', -15);
    ell(c, x + s * .58, y - s * .05, s * .05, s * .14, shade('#5a8a4a', -15));
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

const CROP_COLOR = { lua: '#e9c349', rau: '#5a9a3a', dua: '#4a8a4a' };
// Cây trồng trên 1 ô FARMLAND: lớn dần theo stage (0..3), chín (stage 3) ra quả/bông rõ rệt
export function drawCrop(c, kind, stage, x, y, s) {
  const cx = x + s / 2, baseY = y + s * .95, h = (stage + 1) / 4 * s * .85;
  c.strokeStyle = '#3a6a2a'; c.lineWidth = Math.max(1.4, s * .07);
  c.beginPath(); c.moveTo(cx, baseY); c.lineTo(cx, baseY - h); c.stroke();
  const col = CROP_COLOR[kind] || '#e9c349';
  if (stage >= 3) {
    ell(c, cx, baseY - h, s * .22, s * .18, col);
    c.strokeStyle = shade(col, -30); c.lineWidth = 1; c.stroke();
  } else if (stage >= 1) {
    c.strokeStyle = shade(col, 10); c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(cx - s * .1, baseY - h * .6); c.lineTo(cx, baseY - h * .82); c.lineTo(cx + s * .1, baseY - h * .6); c.stroke();
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

// Thú nuôi: gà (nhỏ, mào đỏ), lợn (hồng, tròn), trâu (to, sừng cong).
export function drawAnimal(c, kind, x, y) {
  if (kind === 'ga') {
    ell(c, x, y - 10, 10, 9, '#f2e4c6');
    ell(c, x + 7, y - 14, 5, 4, '#f2e4c6');
    c.fillStyle = '#c23a2a';
    c.beginPath(); c.moveTo(x + 8, y - 18); c.lineTo(x + 11, y - 20); c.lineTo(x + 9, y - 16); c.closePath(); c.fill();
    c.fillStyle = '#e9b949';
    c.beginPath(); c.moveTo(x + 11, y - 13); c.lineTo(x + 16, y - 12); c.lineTo(x + 11, y - 10); c.closePath(); c.fill();
  } else if (kind === 'lon') {
    ell(c, x, y - 13, 15, 11, '#e8a8ad');
    ell(c, x + 13, y - 11, 5.5, 4.2, '#e8a8ad');
    ell(c, x + 16.5, y - 11, 2.2, 1.7, shade('#e8a8ad', -25));
    c.fillStyle = shade('#e8a8ad', -15); ell(c, x - 6, y - 4, 3, 5, shade('#e8a8ad', -15));
  } else if (kind === 'trau') {
    rr(c, x - 20, y - 30, 40, 26, 8); c.fillStyle = '#3a3a3a'; c.fill();
    c.strokeStyle = shade('#3a3a3a', -20); c.lineWidth = 2; c.stroke();
    c.fillStyle = '#d8d0c0';
    c.beginPath(); c.moveTo(x - 14, y - 28); c.lineTo(x - 23, y - 40); c.lineTo(x - 7, y - 26); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(x + 14, y - 28); c.lineTo(x + 23, y - 40); c.lineTo(x + 7, y - 26); c.closePath(); c.fill();
    ell(c, x - 10, y - 18, 2, 2.4, '#fff'); ell(c, x + 10, y - 18, 2, 2.4, '#fff');
  }
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
  } else if (kind === 'boss_than_dam') {
    rr(c, x - 24, y - 60, 48, 60, 10); c.fillStyle = '#2a4a3a'; c.fill();
    c.strokeStyle = shade('#2a4a3a', -25); c.lineWidth = 2.5; c.stroke();
    // vây lưng (thay sừng): 3 tam giác rong rêu dọc sống lưng
    c.fillStyle = '#3f7a5a';
    for (const dx of [-10, 0, 10]) {
      c.beginPath(); c.moveTo(x + dx - 6, y - 58); c.lineTo(x + dx, y - 74); c.lineTo(x + dx + 6, y - 58); c.closePath(); c.fill();
    }
    // rong rêu rủ hai bên thân
    c.strokeStyle = '#4a8a5a'; c.lineWidth = 2.5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - 23, y - 40); c.quadraticCurveTo(x - 32, y - 22, x - 20, y - 6); c.stroke();
    c.beginPath(); c.moveTo(x + 23, y - 40); c.quadraticCurveTo(x + 32, y - 22, x + 20, y - 6); c.stroke();
    const glow = .5 + Math.sin(t * .2) * .3;
    c.globalAlpha = glow; ell(c, x - 9, y - 34, 4.5, 4.5, '#7fffb0'); ell(c, x + 9, y - 34, 4.5, 4.5, '#7fffb0'); c.globalAlpha = 1;
    ell(c, x - 9, y - 34, 1.8, 1.8, '#0a2a1a'); ell(c, x + 9, y - 34, 1.8, 1.8, '#0a2a1a');
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
  } else if (def.seed) {
    c.fillStyle = '#d8c9a0'; rr(c, -s * .28, -s * .34, s * .56, s * .6, s * .06); c.fill();
    c.strokeStyle = shade('#d8c9a0', -30); c.lineWidth = 1; c.stroke();
    ell(c, 0, -s * .02, s * .13, s * .13, col);
  } else if (id === 'lua') {
    c.strokeStyle = col; c.lineWidth = s * .05;
    for (const dx of [-.14, 0, .14]) { c.beginPath(); c.moveTo(s * dx, s * .34); c.lineTo(s * dx * 1.4, -s * .3); c.stroke(); }
    c.fillStyle = shade(col, 25);
    for (const dx of [-.14, 0, .14]) ell(c, s * dx * 1.4, -s * .32, s * .07, s * .1, shade(col, 25));
  } else if (id === 'rau') {
    c.fillStyle = col;
    for (const [dx, dy] of [[0, -.3], [-.22, -.05], [.22, -.05], [0, .15]]) ell(c, s * dx, s * dy, s * .2, s * .16, col);
    c.fillStyle = shade(col, -20); c.fillRect(-s * .03, s * .1, s * .06, s * .3);
  } else if (id === 'dua') {
    ell(c, 0, 0, s * .34, s * .3, col);
    c.strokeStyle = shade(col, -30); c.lineWidth = 1;
    for (const dy of [-.1, 0, .1]) { c.beginPath(); c.moveTo(-s * .32, s * dy); c.lineTo(s * .32, s * dy); c.stroke(); }
  } else if (def.armor != null) {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(0, -s * .42); c.lineTo(s * .32, -s * .24); c.lineTo(s * .28, s * .18); c.lineTo(0, s * .42); c.lineTo(-s * .28, s * .18); c.lineTo(-s * .32, -s * .24);
    c.closePath(); c.fill();
    c.strokeStyle = shade(col, -30); c.lineWidth = 1; c.stroke();
    c.fillStyle = shade(col, 30); c.beginPath(); c.arc(0, -s * .04, s * .12, 0, Math.PI * 2); c.fill();
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
