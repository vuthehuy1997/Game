import { readJSON } from '../../platform/core/storage.js';
import { ell } from '../../platform/art/draw.js';

export const STORE_KEY = 'lang-nghe-v1';

export default {
  id: 'lang-nghe',
  title: 'Làng Nghề',
  tagline: 'Bấm sản xuất, mua nâng cấp, để dành rồi quay lại',
  desc: 'Bấm để tạo của cải, mua thợ và nâng cấp để tăng thu nhập tự động. Làng vẫn sản xuất cả khi bạn vắng mặt.',
  tags: ['Idle', 'Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    return s && s.wealth ? { pct: Math.min(1, s.wealth / 100000), text: `${Math.floor(s.wealth)} của cải`, updated: 0 } : null;
  },

  // Ảnh bìa: biểu tượng làng phóng to như trong game + đồng vàng rơi quanh
  cover(canvas) {
    const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
    c.fillStyle = '#12141a'; c.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h * .56, s = h / 300;
    ell(c, cx, cy, 90 * s, 90 * s, '#6b8f3a'); ell(c, cx, cy - 13 * s, 52 * s, 38 * s, '#8a6a3e');
    [[-.62, -.3, .55], [.68, -.12, .4], [-.3, .5, .34], [.42, .48, .3]].forEach(([dx, dy, r]) => {
      ell(c, cx + dx * w * .3, cy + dy * h * .4, 14 * r * s * 2, 14 * r * s * 2, '#e9b949');
      ell(c, cx + dx * w * .3, cy + dy * h * .4, 6 * r * s * 2, 6 * r * s * 2, '#a07a22');
    });
  },
};
