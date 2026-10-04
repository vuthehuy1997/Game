import { readJSON } from '../../platform/core/storage.js';

export const STORE_KEY = 'lang-nghe-v1';

export default {
  id: 'lang-nghe',
  title: 'Làng Nghề',
  tagline: 'Bấm sản xuất, mua nâng cấp, để dành rồi quay lại',
  desc: 'Bấm để tạo của cải, mua thợ và nâng cấp để tăng thu nhập tự động. Làng vẫn sản xuất cả khi bạn vắng mặt.',
  tags: ['Idle', 'Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    return s && s.wealth ? { pct: Math.min(1, s.wealth / 100000), text: `${Math.floor(s.wealth)} của cải`, updated: 0 } : null;
  },
};
