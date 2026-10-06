import { readJSON } from '../../platform/core/storage.js';
import { ell } from '../../platform/art/draw.js';
import { COLORS } from './js/state.js';

export const STORE_KEY = 'noi-ngoc-v1';

export default {
  id: 'noi-ngoc',
  title: 'Nối Ngọc',
  tagline: 'Ngọc đá thời Lý · Nối ngọc khắc bia',
  desc: 'Đổi chỗ ngọc liền kề để nối ba viên cùng màu. Nối bốn tạo ngọc hàng hoặc cột, nối năm tạo ngọc vạn năng. Tám màn khắc bia đá thời Lý.',
  tags: ['Xếp hình', 'Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    return s && s.maxLevel ? { pct: Math.min(1, s.maxLevel / 8), text: `Đã qua ${s.maxLevel}/8 màn`, updated: 0 } : null;
  },

  // Ảnh bìa: lưới ngọc nhiều màu như trong game, 1 nhóm 3 viên được khoanh sáng
  cover(canvas) {
    const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
    c.fillStyle = '#12141a'; c.fillRect(0, 0, w, h);
    const n = 6, cell = Math.min(w, h) / (n + 1.4), ox = (w - n * cell) / 2, oy = (h - n * cell) / 2;
    const pick = (x, y) => (x * 7 + y * 13 + x * y * 3) % COLORS.length;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      ell(c, ox + x * cell + cell / 2, oy + y * cell + cell / 2, cell * .38, cell * .38, COLORS[pick(x, y)]);
    }
    c.strokeStyle = '#fff'; c.lineWidth = 3;
    c.beginPath(); c.arc(ox + 1 * cell + cell / 2, oy + 2 * cell + cell / 2, cell * .46, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(ox + 2 * cell + cell / 2, oy + 2 * cell + cell / 2, cell * .46, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(ox + 3 * cell + cell / 2, oy + 2 * cell + cell / 2, cell * .46, 0, Math.PI * 2); c.stroke();
  },
};
