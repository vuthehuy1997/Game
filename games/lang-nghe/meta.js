import { readJSON } from '../../platform/core/storage.js';
import { drawBackdrop, drawBuilding } from './js/buildings.js';

export const STORE_KEY = 'lang-nghe-v1';

export default {
  id: 'lang-nghe',
  title: 'Làng Nghề',
  tagline: 'Bấm sản xuất, mở nghề, để làng tự làm việc',
  desc: 'Bấm để kiếm xu, mở phường hội, thợ mộc, lò gốm, lò rèn và thương cảng. Làng vẫn làm việc khi bạn vắng mặt.',
  tags: ['Idle', 'Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    return s && s.wealth ? { pct: Math.min(1, s.wealth / 100000), text: `${Math.floor(s.wealth)} xu`, updated: 0 } : null;
  },

  // Ảnh bìa: cảnh làng với các công trình đã dựng
  cover(canvas) {
    const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height, gy = h * .72, s = h / 360 * .85;
    drawBackdrop(c, w, h, gy);
    [['house', .1], ['kiln', .26], ['well', .42], ['guild', .58], ['weave', .76], ['dock', .92]]
      .forEach(([kind, k]) => drawBuilding(c, kind, w * k, gy, s, 0, 1));
  },
};
