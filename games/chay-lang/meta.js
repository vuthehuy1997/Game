import { readJSON } from '../../platform/core/storage.js';

export const STORE_KEY = 'chay-lang-v1';

export default {
  id: 'chay-lang',
  title: 'Chạy Làng',
  tagline: 'Đổi làn, nhảy, trượt — chạy càng xa càng tốt',
  desc: 'Tự động chạy về phía trước, đổi làn/nhảy/trượt để né chướng ngại, nhặt xu dọc đường, phá kỷ lục quãng đường.',
  tags: ['Chạy vô tận', 'Bàn phím · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    return s && s.best ? { pct: Math.min(1, s.best / 500), text: `Kỷ lục ${s.best} điểm`, updated: 0 } : null;
  },
};
