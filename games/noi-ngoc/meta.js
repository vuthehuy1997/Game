import { readJSON } from '../../platform/core/storage.js';

export const STORE_KEY = 'noi-ngoc-v1';

export default {
  id: 'noi-ngoc',
  title: 'Nối Ngọc',
  tagline: 'Đổi chỗ, nối 3 viên ngọc cùng màu',
  desc: 'Bấm 2 viên ngọc liền kề để đổi chỗ, nối từ 3 viên cùng màu trở lên để ghi điểm, đạt mục tiêu trước khi hết lượt.',
  tags: ['Xếp hình', 'Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    return s && s.maxLevel ? { pct: Math.min(1, s.maxLevel / 5), text: `Đã qua ${s.maxLevel}/5 màn`, updated: 0 } : null;
  },
};
