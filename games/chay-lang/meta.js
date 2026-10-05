import { readJSON } from '../../platform/core/storage.js';
import { drawChibi } from '../../platform/art/chibi.js';
import { POSES } from '../../platform/art/poses.js';
import { ell, groundShadow } from '../../platform/art/draw.js';

export const STORE_KEY = 'chay-lang-v1';
const HERO = { skin: '#f6d2ae', hair: '#1c1410', hat: 'khan', khan: '#2f6b57', shirt: '#2f6b57', trim: '#e9b949', pants: '#2a2630', belt: '#e9b949' };

export default {
  id: 'chay-lang',
  title: 'Chạy Làng',
  tagline: 'Đổi làn, nhảy, trượt — chạy càng xa càng tốt',
  desc: 'Tự động chạy về phía trước, đổi làn/nhảy/trượt để né chướng ngại, nhặt xu dọc đường, phá kỷ lục quãng đường.',
  tags: ['Chạy vô tận', 'Bàn phím · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    return s && s.best ? { pct: Math.min(1, s.best / 500), text: `Kỷ lục ${s.best} điểm`, updated: 0 } : null;
  },

  // Ảnh bìa: đường 3 làn nhìn từ trên, nhân vật chính đang chạy né chướng ngại
  cover(canvas) {
    const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height, gy = h * .86;
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#dff0e0'); sky.addColorStop(1, '#5f9a4a');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,255,.16)'; c.fillRect(w * .16, 0, w * .68, h);
    c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 3;
    [.18, .39, .61, .82].forEach(k => { c.beginPath(); c.moveTo(w * k, 0); c.lineTo(w * k, h); c.stroke(); });

    c.fillStyle = '#5a4634';
    for (const dx of [-1, 0, 1]) {
      const x = w * .72 + dx * w * .04, y = h * .3;
      c.beginPath(); c.moveTo(x, y - 26); c.lineTo(x - 10, y + 10); c.lineTo(x + 10, y + 10); c.closePath(); c.fill();
    }
    ell(c, w * .5, h * .5, 16, 16, '#e9b949'); ell(c, w * .5, h * .5, 6, 6, '#a07a22');

    groundShadow(c, w * .32, gy, 1.1);
    drawChibi(c, w * .32, gy, HERO, { face: 1, t: 0, scale: h / 300, ...POSES.run({ walk: 2 }) });
  },
};
