// Thông tin Hào Khí Việt Nam cho trang chủ nền tảng. File này phải nhẹ: không import code chạy game.
import { readJSON } from '../../platform/core/storage.js';
import { drawChibi } from '../../platform/art/chibi.js';
import { ell } from '../../platform/art/draw.js';
import { LOOKS } from './js/looks.js';

// Phải khớp với js/data.js (MAIN và STAGES.length * 3) và khoá lưu trong js/save.js; tests/test_platform.py kiểm tra điều này.
export const MAIN = 6, STAR_MAX = 21, STORE_KEY = 'haokhi-dong-a-v3';

export default {
  id: 'hao-khi',
  title: 'Hào Khí Việt Nam',
  tagline: 'Võ lâm Đại Việt · 1284 – 1288',
  desc: 'Theo chân Tiểu Hổ qua 6 ải đánh giặc Nguyên Mông: liên hoàn quyền, năm kỹ năng, cây kỹ năng, tuyệt học và võ đài.',
  tags: ['Hành động đi cảnh', 'Bàn phím · Cảm ứng'],
  url: new URL('./', import.meta.url).href,

  // Tiến độ của ô lưu chơi gần nhất; null nếu chưa chơi
  progress() {
    const store = readJSON(STORE_KEY), slots = ((store && store.slots) || []).filter(Boolean);
    if (!slots.length) return null;
    const sv = slots.reduce((a, b) => ((b.updated || 0) > (a.updated || 0) ? b : a));
    const stars = (sv.stars || []).reduce((a, b) => a + (b || 0), 0);
    const won = (sv.stars || []).slice(0, MAIN).filter(n => n > 0).length;
    return {
      pct: won / MAIN,
      text: won >= MAIN ? `Đã thắng cả ${MAIN} ải · ${stars}/${STAR_MAX} ★` : `Ải ${Math.min(sv.maxStage || 0, MAIN - 1) + 1}/${MAIN} · ${stars}/${STAR_MAX} ★`,
      updated: sv.updated || 0,
    };
  },

  // Ảnh bìa vẽ bằng chính bộ nhân vật dùng chung
  cover(canvas) {
    const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height, gy = h * .86;
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#3a1410'); sky.addColorStop(.55, '#a3261d'); sky.addColorStop(1, '#e9a13a');
    c.fillStyle = sky; c.fillRect(0, 0, w, h);
    ell(c, w * .72, h * .5, h * .26, h * .26, 'rgba(255,214,120,.9)');
    c.fillStyle = '#2a120e';
    c.beginPath(); c.moveTo(0, gy);
    for (let x = 0; x <= w; x += w / 8) c.lineTo(x, gy - h * (.14 + .1 * Math.sin(x * .013 + 1)));
    c.lineTo(w, gy); c.closePath(); c.fill();
    c.fillStyle = '#140e0a'; c.fillRect(0, gy, w, h - gy);
    const s = h / 300;
    drawChibi(c, w * .3, gy + 6, LOOKS.hero, { scale: 1.5 * s, armF: Math.PI / 2, armB: -.5, lean: .12, legF: .3, legB: -.3, shout: true });
    drawChibi(c, w * .62, gy + 4, LOOKS.soldier, { scale: 1.25 * s, face: -1, lean: -.3, armF: 2, armB: -2, hurtFace: 1 });
    drawChibi(c, w * .82, gy + 6, LOOKS.bossToaDo, { scale: 1.1 * s, face: -1, armF: -1, wpn: -1.1, lean: -.12 });
  },
};
