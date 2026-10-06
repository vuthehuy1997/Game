import { readJSON, writeJSON } from '../../../platform/core/storage.js';
import { STORE_KEY } from '../meta.js';

// Mỗi màn: tên, lời dẫn ngắn, số hàng bóng đầu màn và số màu bóng.
export const LEVELS = [
  { name: 'Cổng Đền', fillRows: 3, colors: 3, lore: 'Giặc kéo đến chân đền cổ. Bắn hạ những bóng đầu tiên trước khi chúng tràn vào.' },
  { name: 'Đồng Lúa', fillRows: 4, colors: 3, lore: 'Cánh đồng lúa thành chiến địa. Giữ vững hàng bóng, đừng để chúng vượt tuyến.' },
  { name: 'Bậc Thang', fillRows: 4, colors: 4, lore: 'Quân giặc leo lên bậc đá. Cứ mỗi 6 phát bắn, cả lưới lại bị đẩy xuống một hàng.' },
  { name: 'Mái Ngói', fillRows: 5, colors: 4, lore: 'Trên mái đình, bóng địch dày đặc. Hãy tìm những cụm lớn để nổ dây chuyền.' },
  { name: 'Trống Đền', fillRows: 5, colors: 5, lore: 'Tiếng trống đền dồn dập. Năm màu quân địch đồng loạt tiến công.' },
  { name: 'Đỉnh Tháp', fillRows: 6, colors: 5, lore: 'Đỉnh tháp là trận cuối. Dọn sạch lưới để giữ vững đền thờ.' },
];
export const S = { maxLevel: 0, best: 0, ...(readJSON(STORE_KEY) || {}) };
export function save() { writeJSON(STORE_KEY, S); }
export const unlocked = i => i <= S.maxLevel;
