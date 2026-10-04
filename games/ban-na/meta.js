import { readJSON } from '../../platform/core/storage.js';

export const STORE_KEY = 'ban-na-v1';

export default {
  id: 'ban-na',
  title: 'Bắn Ná',
  tagline: 'Kéo ná, ngắm, phá sạch mục tiêu',
  desc: 'Kéo dây ná để ngắm rồi thả, đạn bay theo trọng lực phá công trình và tiêu diệt mục tiêu qua từng màn.',
  tags: ['Vật lý', 'Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    return s && s.maxLevel ? { pct: Math.min(1, s.maxLevel / 4), text: `Đã phá ${s.maxLevel}/4 màn`, updated: 0 } : null;
  },
};
