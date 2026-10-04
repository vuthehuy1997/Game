import { readJSON } from '../../platform/core/storage.js';

export const STORE_KEY = 'dung-nuoc-v1';

export default {
  id: 'dung-nuoc',
  title: 'Dựng Nước',
  tagline: 'Xây làng, phát triển dân số không ngừng',
  desc: 'Đặt nhà dân, ruộng lúa, chợ búa lên từng ô đất, tích luỹ Vàng và Lương thực để mở khoá thêm công trình mới.',
  tags: ['Xây dựng', 'Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    return s && s.pop ? { pct: Math.min(1, s.pop / 200), text: `Dân số ${s.pop}`, updated: 0 } : null;
  },
};
