// Thông tin game cho trang chủ. Sửa các trường này, rồi thêm game vào platform/games.js.
import { readJSON } from '../../platform/core/storage.js';

export const STORE_KEY = 'game-mau-v1';   // khoá lưu riêng của game, đổi khi chép sang game mới

export default {
  id: 'game-mau',
  title: 'Game mẫu',
  tagline: 'Chạy, nhảy, nhặt tiền',
  desc: 'Khung tối thiểu để bắt đầu một game mới trên nền tảng.',
  tags: ['Mẫu', 'Bàn phím · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    return s && s.best ? { pct: Math.min(1, s.best / 50), text: `Kỷ lục ${s.best} đồng`, updated: 0 } : null;
  },
};
