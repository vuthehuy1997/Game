import { readJSON } from '../../platform/core/storage.js';
import { rr, outlinedText } from '../../platform/art/draw.js';
import { FB } from '../../platform/ui/theme.js';
import { COLS, ROWS, HOME } from './js/state.js';

export const STORE_KEY = 'mo-coi-v1';

export default {
  id: 'mo-coi',
  title: 'Mở Cõi',
  tagline: 'Dựng quân, chiếm trọn bản đồ',
  desc: 'Vùng bạn kiểm soát tự sinh quân theo thời gian. Chọn vùng xuất quân rồi tấn công vùng kề để mở rộng lãnh thổ.',
  tags: ['Chiến thuật', 'Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    if (!s || !s.owner) return null;
    const n = s.owner.filter(o => o === 1).length;
    return n > 1 ? { pct: n / s.owner.length, text: `Kiểm soát ${n}/${s.owner.length} vùng`, updated: 0 } : null;
  },

  // Ảnh bìa: bản đồ lưới vùng, phe ta (xanh) đang lấn sang phe địch (đỏ)
  cover(canvas) {
    const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
    c.fillStyle = '#12141a'; c.fillRect(0, 0, w, h);
    const cell = Math.min(w / (COLS + 1), h / (ROWS + 1)), ox = (w - COLS * cell) / 2, oy = (h - ROWS * cell) / 2;
    for (let i = 0; i < COLS * ROWS; i++) {
      const x = i % COLS, y = (i / COLS) | 0, px = ox + x * cell, py = oy + y * cell;
      const mine = i === HOME || x < COLS / 2 - .5;
      const col = i === HOME ? '#3a7a4a' : mine ? '#2f6b57' : '#7a2d2d';
      rr(c, px + cell * .08, py + cell * .08, cell * .84, cell * .84, 6); c.fillStyle = col; c.fill();
      c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 2; c.stroke();
      if (i !== HOME) { c.textAlign = 'center'; outlinedText(c, String(3 + (i % 5)), px + cell / 2, py + cell / 2 + 6, `${Math.round(cell * .32)}px ${FB}`, '#fff'); }
    }
  },
};
