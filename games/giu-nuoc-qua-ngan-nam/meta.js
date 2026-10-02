// Thông tin Giữ Nước Qua Ngàn Năm cho trang chủ. Nhẹ: không import mã chạy game.
import { readJSON } from '../../platform/core/storage.js';

export const STORE_KEY = 'giu-nuoc-qua-ngan-nam-v1';

export default {
  id: 'giu-nuoc-qua-ngan-nam',
  title: 'Giữ Nước Qua Ngàn Năm',
  tagline: 'Xây làng, giữ đất qua 6 thời kỳ',
  desc: 'Dựng trại lính, tháp canh, trụ cọc quanh Nhà chính rồi để quân ta tự chống trả giặc ngoại xâm qua 6 thời kỳ lịch sử.',
  tags: ['Phòng thủ', 'Chuột · Cảm ứng'],
  url: new URL('./', import.meta.url).href,
  progress() {
    const s = readJSON(STORE_KEY);
    return s && s.maxEra ? { pct: s.maxEra / 6, text: `Đã thắng ${s.maxEra}/6 thời kỳ`, updated: 0 } : null;
  },
};
