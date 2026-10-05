// Thông tin Đối Kháng Anh Hùng cho trang chủ. Nhẹ: không import mã chạy game.
import { drawChibi } from '../../platform/art/chibi.js';
import { POSES } from '../../platform/art/poses.js';
import { outlinedText } from '../../platform/art/draw.js';
import { FD, FB } from '../../platform/ui/theme.js';
import { FIGHTERS, STAGES } from './js/data.js';

export const STORE_KEY = 'doi-khang-anh-hung-v1';

export default {
  id: 'doi-khang-anh-hung',
  title: 'Đối Kháng Anh Hùng',
  tagline: '6 danh tướng, 1 sàn đấu',
  desc: 'Đối kháng 1v1: 2 người cùng bàn phím hoặc đấu máy. Né, đỡ, tung chiêu riêng của từng tướng.',
  tags: ['Đối kháng', 'Bàn phím · 2 người'],
  url: new URL('./', import.meta.url).href,

  // Ảnh bìa: 2 tướng đối đầu trên sân Thăng Long
  cover(canvas) {
    const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height, gy = h * .82;
    const st = STAGES.thanglong;
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, st.sky[0]); sky.addColorStop(1, st.sky[1]);
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    c.fillStyle = st.ground; c.fillRect(0, gy, w, h - gy);
    const s = h / 300;
    drawChibi(c, w * .3, gy + 4, FIGHTERS.tieuho.look, { face: 1, t: 0, scale: 1.4 * s, ...POSES.guard() });
    drawChibi(c, w * .7, gy + 4, FIGHTERS.hungdao.look, { face: -1, t: 0, scale: 1.4 * s, armF: -1, wpn: -1.1, lean: -.15 });
    c.textAlign = 'center';
    outlinedText(c, 'VS', w / 2, h * .42, `bold ${Math.round(h * .22)}px ${FD}`, '#ffd35a', 'rgba(20,14,10,.85)', 6);
  },
};
