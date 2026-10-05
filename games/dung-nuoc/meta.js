import { readJSON } from '../../platform/core/storage.js';
import { rr, shade } from '../../platform/art/draw.js';

export const STORE_KEY = 'dung-nuoc-v1';

export default {
  id: 'dung-nuoc',
  title: 'Dựng Nước',
  tagline: 'Xây làng, phát triển dân số không ngừng',
  desc: 'Đặt nhà dân, ruộng lúa, chợ búa lên từng ô đất, tích luỹ Vàng và Lương thực để mở khoá thêm công trình mới.',
  tags: ['Xây dựng', 'Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    return s && s.pop ? { pct: Math.min(1, s.pop / 200), text: `Dân số ${s.pop}`, updated: 0 } : null;
  },

  // Ảnh bìa: lưới ô đất với vài ô đã đặt nhà/ruộng/chợ, màu khác nhau theo loại
  cover(canvas) {
    const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#2a3b2a'); sky.addColorStop(1, '#4a6b3a');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);

    const n = 5, cell = Math.min(w, h * .8) / n, ox = (w - n * cell) / 2, oy = h * .12;
    const plan = { '0,0': '#8a6a3e', '2,0': '#5fae4a', '4,0': '#8a6a3e', '1,1': '#5fae4a', '3,1': '#e9b949', '0,2': '#5fae4a', '2,2': '#8a6a3e', '4,2': '#5fae4a', '1,3': '#e9b949', '3,3': '#8a6a3e' };
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const px = ox + x * cell, py = oy + y * cell;
      c.strokeStyle = 'rgba(255,255,255,.18)'; c.strokeRect(px, py, cell, cell);
      const col = plan[`${x},${y}`];
      if (col) { c.fillStyle = col; rr(c, px + cell * .12, py + cell * .12, cell * .76, cell * .76, 5); c.fill(); c.strokeStyle = shade(col, -30); c.lineWidth = 2; c.stroke(); }
    }
  },
};
