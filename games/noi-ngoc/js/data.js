import { readJSON, writeJSON } from '../../../platform/core/storage.js';
import { STORE_KEY } from '../meta.js';

export const CHAPTERS = [
  { name: 'Đá Thăng Long', levels: [0, 1, 2] },
  { name: 'Chùa Diên Hựu', levels: [3, 4, 5] },
  { name: 'Nam Quốc Sơn Hà', levels: [6, 7] },
];
export const LEVELS = [
  { title: 'Viên đá đầu tiên', target: 300, moves: 16,
    intro: 'Năm Thuận Thiên thứ nhất, thợ đá kinh thành mở xưởng bên sông Hồng. Đổi chỗ hai viên liền kề để nối ba viên cùng màu.',
    outro: 'Viên ngọc đầu tiên sáng dưới ánh đèn xưởng.' },
  { title: 'Khuôn rồng', target: 500, moves: 18,
    intro: 'Khuôn đá đã khắc hình rồng. Nối bốn viên liền hàng để tạo ngọc hàng, xóa cả hàng khi chạm vào. Nối bốn viên dọc tạo ngọc cột.',
    outro: 'Rồng đá hiện rõ trên khuôn.' },
  { title: 'Bụi đá bay', target: 800, moves: 18,
    intro: 'Bụi đá mù mịt, ngọc rơi liên tiếp. Chuỗi nối càng dài, combo càng cao và điểm càng lớn.',
    outro: 'Bụi lắng, còn lại những viên ngọc sáng.' },
  { title: 'Chuông Diên Hựu', target: 1100, moves: 20,
    intro: 'Chùa Diên Hựu cần chuỗi ngọc treo chuông. Nối năm viên thẳng hàng tạo ngọc vạn năng, chạm vào sẽ quét sạch một màu.',
    outro: 'Tiếng chuông vang qua mặt hồ.' },
  { title: 'Ánh trăng sông Nhị', target: 1500, moves: 20,
    intro: 'Đêm trăng, thuyền ngọc qua sông Nhị. Hãy giữ ngọc hàng và ngọc vạn năng để dùng đúng lúc.',
    outro: 'Trăng phủ lên mặt nước lấp lánh.' },
  { title: 'Lửa lò luyện ngọc', target: 1900, moves: 22,
    intro: 'Lò luyện ngọc rực lửa, mỗi mẻ phải đủ độ sáng mới thành. Hãy tính trước các chuỗi nối lớn.',
    outro: 'Mẻ ngọc đầu tiên đạt độ trong suốt.' },
  { title: 'Kinh thành mở cửa', target: 2400, moves: 22,
    intro: 'Cửa thành Thăng Long mở rộng đón đoàn ngọc quý. Một chuỗi liên hoàn dài có thể lật ngược cả bàn cờ.',
    outro: 'Đoàn ngọc vào thành trong tiếng trống hội.' },
  { title: 'Nam quốc sơn hà', target: 3000, moves: 24,
    intro: 'Ngọc quý cuối cùng được khắc lên bia đá. Dùng mọi chiêu thức của thợ đá để hoàn thành bài thơ bất hủ.',
    outro: 'Sông núi nước Nam đã được khắc vào đá quý.' },
];

export const S = { maxLevel: 0, stars: [], ...(readJSON(STORE_KEY) || {}) };
export function save() { writeJSON(STORE_KEY, S); }
export const unlocked = i => i <= S.maxLevel;
export const chapterOf = i => CHAPTERS.find(c => c.levels.includes(i));
