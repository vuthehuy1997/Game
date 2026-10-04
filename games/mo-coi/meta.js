import { readJSON } from '../../platform/core/storage.js';

export const STORE_KEY = 'mo-coi-v1';

export default {
  id: 'mo-coi',
  title: 'Mở Cõi',
  tagline: 'Dựng quân, chiếm trọn bản đồ',
  desc: 'Vùng bạn kiểm soát tự sinh quân theo thời gian. Chọn vùng xuất quân rồi tấn công vùng kề để mở rộng lãnh thổ.',
  tags: ['Chiến thuật', 'Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    if (!s || !s.owner) return null;
    const n = s.owner.filter(o => o === 1).length;
    return n > 1 ? { pct: n / s.owner.length, text: `Kiểm soát ${n}/${s.owner.length} vùng`, updated: 0 } : null;
  },
};
