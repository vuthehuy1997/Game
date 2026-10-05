import { readJSON } from '../../platform/core/storage.js';
import { ell } from '../../platform/art/draw.js';
import { COLORS } from './js/state.js';

export const STORE_KEY = 'ban-bong-v1';

export default {
  id: 'ban-bong',
  title: 'Bắn Bóng',
  tagline: 'Ngắm bắn, nối 3 bóng cùng màu',
  desc: 'Ngắm và bắn bóng màu lên lưới, từ 3 bóng cùng màu liền kề trở lên sẽ nổ. Dọn sạch lưới trước khi bóng tràn xuống.',
  tags: ['Bắn bóng', 'Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    return s && s.maxLevel ? { pct: Math.min(1, s.maxLevel / 4), text: `Đã qua ${s.maxLevel}/4 màn`, updated: 0 } : null;
  },

  // Ảnh bìa: lưới bóng màu phía trên, bóng đang bắn lên từ dưới
  cover(canvas) {
    const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
    c.fillStyle = '#12141a'; c.fillRect(0, 0, w, h);
    const cols = 8, cell = w / (cols + 1), oy = h * .14;
    const pick = (x, y) => (x * 5 + y * 11) % COLORS.length;
    for (let y = 0; y < 4; y++) for (let x = 0; x < cols; x++) {
      ell(c, cell * (x + 1) + (y % 2 ? cell / 2 : 0), oy + y * cell * .86, cell * .42, cell * .42, COLORS[pick(x, y)]);
    }
    const sx = w * .5, sy = h * .88;
    c.strokeStyle = 'rgba(255,255,255,.4)'; c.setLineDash([4, 6]); c.lineWidth = 2;
    c.beginPath(); c.moveTo(sx, sy); c.lineTo(w * .58, h * .45); c.stroke(); c.setLineDash([]);
    ell(c, sx, sy, cell * .42, cell * .42, COLORS[0]);
    ell(c, sx + cell * .9, sy, cell * .3, cell * .3, COLORS[1]);
  },
};
