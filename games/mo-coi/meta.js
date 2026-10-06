import { readJSON } from '../../platform/core/storage.js';
import { rr, outlinedText } from '../../platform/art/draw.js';
import { FB } from '../../platform/ui/theme.js';
import { MAPS } from './js/state.js';

export const STORE_KEY = 'mo-coi-v1';
const LAND = { p: '#6b8f3a', h: '#7a8552', f: '#355f32', k: '#8a8170', r: '#2f6f8f' };

export default {
  id: 'mo-coi',
  title: 'Mở Cõi',
  tagline: 'Đánh giặc qua 3 ải, mở rộng bờ cõi Đại Việt',
  desc: 'Xuất quân từ đất nhà, chiếm đồng bằng, đồi và thành lũy qua 3 ải. Giặc phản công từng ngày: giữ đất ta hay mất đất.',
  tags: ['Chiến thuật', 'Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    if (!s) return null;
    const cleared = s.maxStage || 0, owned = (s.owner || []).filter(o => o === 1).length;
    if (!cleared && owned <= 1) return null;
    return { pct: cleared / MAPS.length, text: cleared >= MAPS.length ? `Đã mở trọn ${MAPS.length} ải` : `Đã qua ${cleared}/${MAPS.length} ải`, updated: 0 };
  },

  // Ảnh bìa: bản đồ ải 1 với sông, đồi, rừng và thành lũy; phe ta xanh, giặc đỏ
  cover(canvas) {
    const c = canvas.getContext('2d'), w = canvas.width, h = canvas.height, m = MAPS[0];
    c.fillStyle = '#1a1f18'; c.fillRect(0, 0, w, h);
    const cw = w * .9 / m.cols, ch = h * .8 / m.rows, ox = w * .05, oy = h * .1;
    for (let i = 0; i < m.cols * m.rows; i++) {
      const x = ox + (i % m.cols) * cw + 4, y = oy + ((i / m.cols) | 0) * ch + 4, t = m.terrain[i];
      rr(c, x, y, cw - 8, ch - 8, 8); c.fillStyle = LAND[t]; c.fill();
      c.strokeStyle = i === 0 ? '#7bd389' : t === 'r' ? '#0000' : 'rgba(255,255,255,.2)'; c.lineWidth = 2; c.stroke();
      if (t !== 'r' && i !== 0) { c.fillStyle = 'rgba(160,50,40,.35)'; c.fill(); }
    }
    c.textAlign = 'center';
    outlinedText(c, MAPS[0].name, w / 2, h * .95, `bold ${Math.round(h * .08)}px ${FB}`, '#ffe6a8', 'rgba(0,0,0,.85)', 4);
  },
};
