// Dữ liệu vũ khí và 4 chiến dịch. Sự kiện/mốc năm kiểm chứng theo lịch sử, không hư cấu; lời dẫn viết
// ngắn gọn, trang trọng. Mỗi chiến dịch mở một vũ khí mới khi người chơi bắt đầu chiến dịch đó.
import { level } from './map.js';

export const WEAPONS = {
  rifle: { id: 'rifle', name: 'Súng trường', dmg: 42, rate: .7, range: 8.5, mag: 5, reload: 1.3 },
  smg: { id: 'smg', name: 'Tiểu liên', dmg: 15, rate: .11, range: 6, mag: 24, reload: 1.6 },
  assault: { id: 'assault', name: 'Súng trường tấn công', dmg: 23, rate: .17, range: 7.5, mag: 20, reload: 1.5 },
};

// Nhìn chibi quân địch dùng chung hệ vẽ của cả Game Hub (platform/art/chibi.js) — không máu me, trúng
// đòn thì nháy trắng và ngã mờ dần (xem render.js).
const PHAP = { skin: '#e3b98f', hair: '#3a2a1a', hat: 'helmet', helm: '#5a6b4a', plume: '#3a4a2a', shirt: '#5a6b4a', trim: '#8a7a5a', pants: '#4a4a3a', belt: '#3a2a1a', weapon: 'club', scale: .92 };
const SAIGON = { skin: '#e3b98f', hair: '#1c1410', hat: 'helmet', helm: '#6b6b4a', plume: '#4a4a35', shirt: '#6b6b4a', trim: '#8a7a5a', pants: '#3a3a2e', belt: '#2a2a20', weapon: 'club', scale: .92 };

export const CAMPAIGNS = [
  {
    id: 'viet-bac-1947', name: 'Việt Bắc', year: 'Thu Đông 1947', foe: 'quân Pháp', weapon: 'rifle',
    lore: 'Cuối năm 1947, thực dân Pháp mở cuộc hành quân lớn lên chiến khu Việt Bắc, hòng đánh úp cơ quan đầu não kháng chiến. Quân và dân ta dựa vào rừng núi hiểm trở, phục kích từng toán quân, buộc địch phải rút lui trong thất bại.',
    enemyLook: PHAP,
    levels: [
      { name: 'Phục kích đường rừng', brief: 'Diệt toán quân Pháp lọt vào rừng rồi rút về an toàn.',
        map: level(12, 9, 'T', { pillars: [[3, 3], [3, 5], [8, 3], [8, 5], [5, 6]], start: [1, 7], exit: [10, 1],
          enemies: [[5, 2], [9, 6], [2, 2]], pickups: [[6, 6, 'health']] }) },
      { name: 'Giữ hầm bí mật', brief: 'Chặn địch trước cửa hầm, đừng để chúng lọt vào trong.',
        map: level(13, 10, 'T', { pillars: [[4, 4], [4, 5], [9, 4], [9, 5], [6, 2], [6, 7]], start: [1, 8], exit: [11, 1],
          enemies: [[6, 4], [10, 8], [3, 2], [11, 6]], pickups: [[2, 5, 'ammo'], [9, 2, 'health']] }) },
    ],
  },
  {
    id: 'bien-gioi-1950', name: 'Biên Giới', year: 'Thu Đông 1950', foe: 'quân Pháp', weapon: 'smg',
    lore: 'Tháng 9 năm 1950, quân ta chủ động tiến công cứ điểm Đông Khê, mở màn Chiến dịch Biên Giới. Sau nhiều ngày chiến đấu, tuyến biên giới Việt–Trung được khai thông, nối liền hậu phương kháng chiến với thế giới bên ngoài.',
    enemyLook: PHAP,
    levels: [
      { name: 'Hạ đồn Đông Khê', brief: 'Phá vỡ hàng rào đồn và tiêu diệt quân trấn giữ.',
        map: level(13, 9, 'G', { pillars: [[4, 3], [4, 4], [9, 3], [9, 4], [6, 6]], start: [1, 7], exit: [11, 1],
          enemies: [[5, 2], [8, 2], [10, 6], [3, 5]], pickups: [[7, 7, 'ammo']] }) },
      { name: 'Chặn viện binh', brief: 'Giữ đường độc đạo, không để viện binh địch tới kịp.',
        map: level(14, 10, 'G', { pillars: [[4, 4], [4, 5], [9, 4], [9, 5], [6, 7], [11, 2]], start: [1, 8], exit: [12, 1],
          enemies: [[6, 4], [11, 7], [3, 2], [8, 8], [12, 4]], pickups: [[2, 5, 'health'], [10, 3, 'ammo']] }) },
    ],
  },
  {
    id: 'dien-bien-phu-1954', name: 'Điện Biên Phủ', year: '1954', foe: 'quân Pháp', weapon: 'rifle',
    lore: 'Đầu năm 1954, quân ta vây chặt tập đoàn cứ điểm Điện Biên Phủ, đào hào giao thông siết dần vòng vây. Trận đánh đồi A1 là một trong những trận ác liệt nhất, mở đường cho chiến thắng ngày 7 tháng 5 năm 1954.',
    enemyLook: PHAP,
    levels: [
      { name: 'Hào giao thông', brief: 'Men theo hào, đánh chiếm từng ụ súng trên đường tới đồi A1.',
        map: level(14, 10, 'D', { pillars: [[3, 3], [3, 6], [7, 2], [7, 7], [11, 3], [11, 6]], start: [1, 8], exit: [12, 1],
          enemies: [[5, 4], [9, 4], [12, 6], [3, 2]], pickups: [[6, 8, 'health'], [10, 2, 'ammo']] }) },
      { name: 'Đồi A1', brief: 'Đánh chiếm hầm chỉ huy trên đỉnh đồi A1.',
        map: level(13, 11, 'A', { pillars: [[4, 4], [4, 6], [8, 4], [8, 6], [6, 2], [6, 8]], start: [1, 9], exit: [11, 1],
          enemies: [[6, 5], [10, 8], [3, 3], [9, 2], [11, 6]], pickups: [[2, 6, 'ammo'], [9, 6, 'health']] }) },
    ],
  },
  {
    id: 'ho-chi-minh-1975', name: 'Hồ Chí Minh', year: '1975', foe: 'lực lượng phòng thủ Sài Gòn', weapon: 'assault',
    lore: 'Mùa xuân năm 1975, các cánh quân thần tốc tiến về Sài Gòn. Ngày 30 tháng 4, chiến dịch kết thúc thắng lợi, non sông thu về một mối.',
    enemyLook: SAIGON,
    levels: [
      { name: 'Tiến vào cửa ngõ', brief: 'Phá tuyến phòng thủ ở cửa ngõ thành phố.',
        map: level(14, 10, 'B', { pillars: [[4, 3], [4, 6], [9, 3], [9, 6], [6, 8], [11, 2]], start: [1, 8], exit: [12, 1],
          enemies: [[5, 4], [10, 4], [3, 2], [12, 6], [7, 7]], pickups: [[2, 5, 'health'], [9, 8, 'ammo']] }) },
      { name: 'Tiến về nội đô', brief: 'Vượt qua các dãy phố cuối cùng, hoàn thành chiến dịch.',
        map: level(15, 11, 'B', { pillars: [[4, 4], [4, 7], [10, 4], [10, 7], [7, 2], [7, 9], [12, 5]], start: [1, 9], exit: [13, 1],
          enemies: [[6, 5], [11, 8], [3, 3], [9, 2], [13, 6], [8, 8]], pickups: [[2, 6, 'ammo'], [10, 2, 'health']] }) },
    ],
  },
];
