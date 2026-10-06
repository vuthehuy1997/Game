// Thông tin game cho trang chủ. Nhẹ: chỉ đọc tiến độ, không import mã chạy game.
import { readJSON } from '../../platform/core/storage.js';
import { drawChibi } from '../../platform/art/chibi.js';
import { POSES } from '../../platform/art/poses.js';
import { rr, shade } from '../../platform/art/draw.js';
import { ERAS } from './js/data.js';

export const STORE_KEY = 'co-thanh-ngan-nam-v1';

export default {
  id: 'co-thanh-ngan-nam',
  title: 'Cổ Thành Ngàn Năm',
  tagline: 'Giữ thành qua 6 thời kỳ, từ Cổ Loa đến Điện Biên',
  desc: 'Xây tường, tháp nỏ, hố chông và vạc dầu quanh cổng thành. Giặc tràn tới theo nhiều đường qua các thời kỳ lịch sử, mỗi thời kỳ có luật chơi riêng.',
  tags: ['Phòng thủ', 'Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    const cleared = Math.min(ERAS.length, (s && s.cleared) | 0);
    return cleared ? { pct: cleared / ERAS.length, text: `Đã giữ thành ${cleared}/${ERAS.length} thời kỳ`, updated: 0 } : null;
  },

  // Ảnh bìa: thành đá có cổng và tháp nỏ, một người giữ thành đứng trước cổng
  cover(canvas) {
    const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height, gy = h * .8;
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#2d3a4a'); sky.addColorStop(1, '#8a7a5a');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    c.fillStyle = '#4a5a3a'; c.fillRect(0, gy, w, h - gy);
    const wx = w * .08, ww = w * .42, wy = h * .2;
    c.fillStyle = shade('#8a8478', -40); c.fillRect(wx, wy, ww, gy - wy);
    c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 2;
    for (let y = wy + 18; y < gy; y += 22) { c.beginPath(); c.moveTo(wx, y); c.lineTo(wx + ww, y); c.stroke(); }
    c.fillStyle = shade('#8a8478', -60);
    for (let k = 0; k < 6; k++) c.fillRect(wx + k * ww / 6 + 4, wy - 12, ww / 12, 14);
    c.fillStyle = '#1a140e'; rr(c, wx + ww * .55, gy - h * .32, ww * .3, h * .32, 16); c.fill();
    c.fillStyle = '#6b4424'; c.beginPath(); c.moveTo(w * .62, wy - 40); c.lineTo(w * .74, wy - 90); c.lineTo(w * .86, wy - 40); c.closePath(); c.fill();
    const s = h / 300;
    drawChibi(c, w * .7, gy + 6, { skin: '#f6d2ae', hair: '#1c1410', hat: 'khan', khan: '#2f6b57', shirt: '#2f6b57', trim: '#e9b949', pants: '#2a2630', belt: '#e9b949', weapon: 'spear' }, { face: 1, t: 0, scale: 1.3 * s, ...POSES.guard() });
    drawChibi(c, w * .9, gy + 6, { skin: '#e3b98f', hair: '#201810', shirt: '#7a2d2d', trim: '#c99a4a', pants: '#2a2020', belt: '#c99a4a', hat: 'mongol', cap: '#3a2a1a', fur: '#d9c7a0', weapon: 'glaive' }, { face: -1, t: 0, scale: 1.1 * s, ...POSES.run({ walk: 1 }) });
  },
};
