// Thông tin Giữ Nước Qua Ngàn Năm cho trang chủ. Nhẹ: không import mã chạy game.
import { readJSON } from '../../platform/core/storage.js';
import { drawChibi } from '../../platform/art/chibi.js';
import { POSES } from '../../platform/art/poses.js';
import { rr } from '../../platform/art/draw.js';

export const STORE_KEY = 'giu-nuoc-qua-ngan-nam-v1';
const ALLY_LOOK = { skin: '#f6d2ae', hair: '#1c1410', shirt: '#2f6b57', trim: '#e9b949', pants: '#2a2630', belt: '#e9b949', hat: 'khan', khan: '#2e3142', weapon: 'spear' };
const ENEMY_LOOK = { skin: '#e3b98f', hair: '#201810', shirt: '#7a2d2d', trim: '#c99a4a', pants: '#2a2020', belt: '#c99a4a', hat: 'mongol', cap: '#3a2a1a', fur: '#d9c7a0', weapon: 'glaive' };

export default {
  id: 'giu-nuoc-qua-ngan-nam',
  title: 'Giữ Nước Qua Ngàn Năm',
  tagline: 'Xây làng, giữ đất qua 6 thời kỳ',
  desc: 'Dựng trại lính, tháp canh, trụ cọc quanh Nhà chính rồi để quân ta tự chống trả giặc ngoại xâm qua 6 thời kỳ lịch sử.',
  tags: ['Phòng thủ', 'Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    return s && s.maxEra ? { pct: s.maxEra / 6, text: `Đã thắng ${s.maxEra}/6 thời kỳ`, updated: 0 } : null;
  },

  // Ảnh bìa: Nhà chính bên trái, quân ta chặn quân địch tiến tới trên 1 làn
  cover(canvas) {
    const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height, gy = h * .78;
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#2a3b2a'); sky.addColorStop(1, '#1c2a1c');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(0, gy + 6, w, 4);
    const s = h / 300;
    c.fillStyle = '#5a4a36'; rr(c, w * .06, gy - h * .22, w * .13, h * .22, 6); c.fill();
    drawChibi(c, w * .33, gy, ALLY_LOOK, { face: 1, t: 0, scale: 1.2 * s, ...POSES.idle({ t: 0 }) });
    drawChibi(c, w * .62, gy, ENEMY_LOOK, { face: -1, t: 0, scale: 1.1 * s, ...POSES.run({ walk: 1 }) });
    drawChibi(c, w * .78, gy, ENEMY_LOOK, { face: -1, t: .4, scale: 1.1 * s, ...POSES.run({ walk: 2.4 }) });
  },
};
