// Thông tin Nam Tiến Đại Việt cho trang chủ. Chỉ import phần vẽ và dữ liệu thuần, không import code chạy game.
import { readJSON } from '../../platform/core/storage.js';
import { drawTerrain, drawBuilding } from './js/art.js';
import { CHAPTERS, MAP, COLS, ROWS, CAPITAL } from './js/data.js';

export const STORE_KEY = 'nam-tien-v1';

export default {
  id: 'nam-tien',
  title: 'Nam Tiến Đại Việt',
  tagline: 'Từ Thăng Long mở cõi về phương nam',
  desc: 'Khai phá đất từ Thăng Long đến Gia Định qua bốn chương sử. Xây ruộng, chợ, đồn, chùa; giữ đất trước lũ, mất mùa và giặc tấn công.',
  tags: ['Chiến lược', 'Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    if (!s || s.v !== 1) return null;
    const cleared = Math.min(CHAPTERS.length, s.cleared | 0);
    const owned = Array.isArray(s.owned) ? s.owned.filter(Boolean).length : 0;
    if (!cleared && owned <= 1) return null;
    return { pct: cleared / CHAPTERS.length, text: cleared >= CHAPTERS.length ? 'Đã mở trọn Nam tiến' : `Đã qua ${cleared}/${CHAPTERS.length} chương`, updated: 0 };
  },

  // Ảnh bìa: một góc bản đồ với đất đã khai phá, ruộng, đồn và kinh thành
  cover(canvas) {
    const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
    const bg = c.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#2a1f14'); bg.addColorStop(1, '#14110c');
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    const tw = 72, th = 60, x0 = (w - COLS * tw) / 2, y0 = (h - ROWS * th) / 2 + 4;
    const owned = new Set([CAPITAL, 1, 8, 10, 17, 18, 2]);
    const builds = { [CAPITAL]: ['house'], 10: ['farm'], 18: ['farm'], 2: [null, null, 'outpost'] };
    for (let i = 0; i < COLS * ROWS; i++) {
      const x = x0 + (i % COLS) * tw, y = y0 + Math.floor(i / COLS) * th, t = MAP[Math.floor(i / COLS)][i % COLS];
      c.save(); c.beginPath(); c.rect(x, y, tw - 3, th - 3); c.clip();
      drawTerrain(c, t, x, y, tw - 3, th - 3, i + 1, 0);
      c.restore();
      if (owned.has(i)) {
        c.strokeStyle = '#e9b949'; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, tw - 5, th - 5);
        (builds[i] || []).forEach((k, s) => {
          if (!k) return;
          const px = x + (tw - 3) * [.27, .73, .5][s], py = y + (th - 3) * (s === 2 ? .9 : .5);
          drawBuilding(c, k, px, py, .62, 0);
        });
      } else if (t !== 'w') {
        c.fillStyle = 'rgba(20,16,11,.45)'; c.fillRect(x, y, tw - 3, th - 3);
      }
    }
  },
};
