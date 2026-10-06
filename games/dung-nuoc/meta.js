import { readJSON } from '../../platform/core/storage.js';
import { drawSky, drawGround, drawTile, drawBuilding } from './js/scene.js';
import { plotBox } from './js/state.js';

export const STORE_KEY = 'dung-nuoc-v1';

export default {
  id: 'dung-nuoc',
  title: 'Dựng Nước',
  tagline: 'Dựng làng Thăng Long qua các triều Lý',
  desc: 'Đặt nhà, ruộng, chợ, lò gốm và đình làng trên từng ô đất. Lũ lụt và mùa bội thu thay đổi lương thực; mỗi mốc dân số mở một đoạn sử triều Lý.',
  tags: ['Xây dựng', 'Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    return s && s.pop ? { pct: Math.min(1, s.pop / 200), text: `Dân số ${s.pop}`, updated: 0 } : null;
  },

  // Ảnh bìa: cảnh làng ban ngày, công trình vẽ bằng chính bộ vẽ của game
  cover(canvas) {
    const c = canvas.getContext('2d');
    c.setTransform(canvas.width / 960, 0, 0, canvas.height / 540, 0, 0);
    drawSky(c, .42, 0); drawGround(c, .42);
    const spots = [[9, 'house'], [11, 'farm'], [14, 'temple'], [21, 'market'], [18, 'well'], [25, 'kiln'], [33, 'granary']];
    spots.forEach(([i]) => drawTile(c, i, true));
    spots.forEach(([i, kind]) => { const b = plotBox(i); drawBuilding(c, kind, b.x + b.w / 2, b.y + b.h - 6, 0); });
  },
};
