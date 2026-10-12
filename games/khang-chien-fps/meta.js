// Thông tin Kháng Chiến Cứu Quốc cho trang chủ. Nhẹ: không import code chạy game.
import { readJSON } from '../../platform/core/storage.js';
import { drawChibi } from '../../platform/art/chibi.js';
import { POSES } from '../../platform/art/poses.js';
import { outlinedText } from '../../platform/art/draw.js';
import { FD } from '../../platform/ui/theme.js';

export const STORE_KEY = 'khang-chien-fps-v1';
const SOLDIER = { skin: '#e3b98f', hair: '#1c1410', hat: 'helmet', helm: '#3a4a30', plume: '#2a3522', shirt: '#3a4a30', trim: '#8a7a5a', pants: '#2a2e22', belt: '#1c1410', weapon: 'club', scale: 1.1 };

export default {
  id: 'khang-chien-fps',
  title: 'Kháng Chiến Cứu Quốc',
  tagline: 'FPS lịch sử · 4 chiến dịch, 1947–1975',
  desc: 'Góc nhìn thứ nhất qua 4 chiến dịch: Việt Bắc 1947, Biên Giới 1950, Điện Biên Phủ 1954, Hồ Chí Minh 1975. Di chuyển, ngắm bắn, hoàn thành nhiệm vụ và mở vũ khí mới qua từng chiến dịch.',
  tags: ['Bắn súng FPS', 'Bàn phím · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    const total = (s?.progress || []).reduce((a, b) => a + b, 0);
    return total ? { pct: Math.min(1, total / 8), text: `Đã qua ${total}/8 màn`, updated: 0 } : null;
  },

  // Ảnh bìa: hai chiến sĩ trong hào đất dưới trời chạng vạng
  cover(canvas) {
    const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height, gy = h * .82;
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#2a2018'); sky.addColorStop(1, '#5a4a30');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    c.fillStyle = '#3a3024'; c.fillRect(0, gy, w, h - gy);
    c.fillStyle = '#4a3c2a';
    for (let i = 0; i < 6; i++) { const x = w * (i / 5.5); c.beginPath(); c.moveTo(x, gy); c.lineTo(x + w * .04, gy - h * .26); c.lineTo(x + w * .09, gy); c.closePath(); c.fill(); }
    const s = h / 300;
    drawChibi(c, w * .36, gy, SOLDIER, { face: 1, t: 0, scale: 1.3 * s, ...POSES.idle({ t: 0 }) });
    drawChibi(c, w * .68, gy, SOLDIER, { face: -1, t: .5, scale: 1.15 * s, ...POSES.guard() });
    c.textAlign = 'center';
    outlinedText(c, '1947 – 1975', w / 2, h * .16, `bold ${Math.round(h * .09)}px ${FD}`, '#ffe6a8', 'rgba(0,0,0,.85)', 4);
  },
};
