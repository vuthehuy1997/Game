import { readJSON } from '../../platform/core/storage.js';

export const STORE_KEY = 'ban-bong-v1';

export default {
  id: 'ban-bong',
  title: 'Bắn Bóng',
  tagline: 'Ngắm bắn, nối 3 bóng cùng màu',
  desc: 'Ngắm và bắn bóng màu lên lưới, từ 3 bóng cùng màu liền kề trở lên sẽ nổ. Dọn sạch lưới trước khi bóng tràn xuống.',
  tags: ['Bắn bóng', 'Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    return s && s.maxLevel ? { pct: Math.min(1, s.maxLevel / 4), text: `Đã qua ${s.maxLevel}/4 màn`, updated: 0 } : null;
  },
};
