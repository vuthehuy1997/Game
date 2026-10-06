import { readJSON } from '../../platform/core/storage.js';
import { drawChibi } from '../../platform/art/chibi.js';
import { POSES } from '../../platform/art/poses.js';
import { ell, rr, shade, groundShadow } from '../../platform/art/draw.js';

export const STORE_KEY = 'ban-na-v1';
const ENEMY_LOOK = { skin: '#e3b98f', hair: '#201810', shirt: '#7a2d2d', trim: '#c99a4a', pants: '#2a2020', belt: '#c99a4a', hat: 'mongol', cap: '#3a2a1a', fur: '#d9c7a0', weapon: 'glaive', scale: .9 };

export default {
  id: 'ban-na',
  title: 'Bắn Ná',
  tagline: 'Ải Chi Lăng 1427: gió, đạn tẩm dầu, giặc đi tuần',
  desc: 'Kéo dây ná, tính gió rồi thả. Đạn đá đánh trực diện, đạn tẩm dầu nổ lan qua 8 màn Chi Lăng, giặc di chuyển và ngã xuống khi trúng đòn.',
  tags: ['Vật lý', 'Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  // Phải khớp số màn trong js/data.js (LEVELS.length); tests/test_ban_na.py kiểm tra điều này
  progress() {
    const s = readJSON(STORE_KEY);
    return s && s.maxLevel ? { pct: Math.min(1, s.maxLevel / 8), text: `Đã phá ${s.maxLevel}/8 màn`, updated: 0 } : null;
  },

  // Ảnh bìa: ná cao su ở cận cảnh, lính giặc đứng sau hàng rào gỗ
  cover(canvas) {
    const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height, gy = h * .9;
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#7ec8e3'); sky.addColorStop(1, '#e8f4d9');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    c.fillStyle = '#5f9a4a'; c.fillRect(0, gy, w, h - gy);

    const wx0 = w * .56, wy0 = gy - h * .3, ww = w * .16, wh = h * .3;
    c.fillStyle = '#7a5a34'; rr(c, wx0, wy0, ww, wh, 4); c.fill();
    c.strokeStyle = shade('#7a5a34', -35); c.lineWidth = 3;
    for (let i = 0; i < 4; i++) { const sx = wx0 + (i + .5) * ww / 4; c.beginPath(); c.moveTo(sx, wy0 + 3); c.lineTo(sx, wy0 + wh - 3); c.stroke(); }

    groundShadow(c, w * .72, gy - 4, .7);
    drawChibi(c, w * .72, gy - 2, ENEMY_LOOK, { face: -1, t: 0, ...POSES.idle({ t: 0 }) });

    const ax = w * .22, ay1 = gy, ay0 = h * .22, tipX = w * .36, tipY = h * .5;
    c.strokeStyle = '#6b4a2a'; c.lineWidth = Math.round(h * .018);
    c.beginPath(); c.moveTo(ax - 14, ay1); c.lineTo(ax - 8, ay0); c.stroke();
    c.beginPath(); c.moveTo(ax + 14, ay1); c.lineTo(ax + 8, ay0); c.stroke();
    c.strokeStyle = '#3a2a18'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(ax - 8, ay0); c.lineTo(tipX, tipY); c.lineTo(ax + 8, ay0); c.stroke();
    ell(c, tipX, tipY, 9, 9, '#2a2630');
  },
};
