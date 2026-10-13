// Thông tin Lũy Tre Làng cho trang chủ. File này phải nhẹ: không import code chạy game.
import { readJSON } from '../../platform/core/storage.js';
import { drawChibi } from '../../platform/art/chibi.js';
import { TILE, TS, STORE_KEY } from './js/data.js';
import { makeWorld, topSolidRow } from './js/world.js';
import { drawTile } from './js/art.js';

const HERO = { skin: '#f6d2ae', hair: '#1c1410', hat: 'nonla', shirt: '#2f6b57', trim: '#e9b949', pants: '#2a2630', belt: '#e9b949', weapon: 'club' };

export default {
  id: 'luy-tre-lang',
  title: 'Lũy Tre Làng',
  tagline: 'Đào, dựng nhà, mở làng giữa luỹ tre',
  desc: 'Đào đất đá, chặt tre, lấy quặng đồng sắt bạc vàng theo từng tầng sâu. Dựng nhà tranh để đón thương nhân, chế tạo công cụ, chống quái đêm và sống qua từng ngày trong một thế giới sinh ngẫu nhiên.',
  tags: ['Sinh tồn · Xây dựng', 'Bàn phím · Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    return s && s.day ? { pct: Math.min(1, s.day / 10), text: `Ngày thứ ${s.day} · ${s.gold || 0} vàng`, updated: 0 } : null;
  },

  // Ảnh bìa: một lát cắt thế giới sinh từ seed cố định, nhân vật đứng trên mặt đất
  cover(canvas) {
    const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
    const tiles = makeWorld(20260101);
    const cols = 24, s = w / cols, startC = 60;
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#7ec8e3'); sky.addColorStop(1, '#cfe8d0');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    const topRow = topSolidRow(tiles, startC + 4), rows = Math.floor(h / s) + 1, startR = Math.max(0, topRow - 3);
    for (let r = 0; r < rows; r++) for (let cc = 0; cc < cols; cc++) {
      const col = startC + cc, row = startR + r;
      const code = tiles[row * 160 + col];
      const grassTop = code === TILE.DIRT && tiles[(row - 1) * 160 + col] === TILE.AIR;
      drawTile(c, code, cc * s, r * s, s, grassTop);
    }
    const heroCol = startC + 4;
    drawChibi(c, (heroCol - startC + .5) * s, (topRow - startR) * s, HERO, { face: 1, t: 0, scale: s / 24 * .62 });
  },
};
