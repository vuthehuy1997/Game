import { readJSON, writeJSON } from '../../../platform/core/storage.js';
import { STORE_KEY } from '../meta.js';

// Ải Chi Lăng (1427). Mỗi màn: title, sky (màu trời trên/dưới), wind (gió ngang, px/s², dương là gió thổi sang phải),
// shots (tổng số phát), fire (số đạn tẩm dầu), story/outro (lời dẫn trước và sau màn), blocks (hàng rào gỗ/lũy đá),
// targets (lính giặc; có span thì đi tuần qua lại quanh x0).
export const LEVELS = [
  { title: 'Tiếng trống đầu tiên', sky: ['#f6c28b', '#cfe7f0'], wind: 0, shots: 3, fire: 0,
    story: ['Năm 1427, quân Minh tràn qua ải Chi Lăng. Rừng núi im ắng, chỉ còn tiếng trống dồn của quân ta.', 'Bắn trúng tên giặc đứng sau bức tường gỗ đầu tiên.'],
    outro: 'Tiếng trống đầu tiên đã vang lên. Giặc bắt đầu biết đất này không dễ lấy.',
    blocks: [{ cx: 600, cy: 440, w: 36, h: 100, hp: 30 }],
    targets: [{ cx: 600, cy: 370, r: 18, hp: 25 }] },
  { title: 'Bờ lũy dựng vội', sky: ['#7ec8e3', '#e8f4d9'], wind: 0, shots: 4, fire: 0,
    story: ['Lũy gỗ dựng vội bên đường mòn, đủ để chặn một toán giặc tiên phong.', 'Đập sập tầng dưới để tên giặc trên cao ngã xuống.'],
    outro: 'Lũy gỗ đổ sập, toán giặc tiên phong tan tác chạy về phía núi.',
    blocks: [{ cx: 650, cy: 460, w: 40, h: 56, hp: 28 }, { cx: 650, cy: 400, w: 40, h: 56, hp: 28 }],
    targets: [{ cx: 650, cy: 345, r: 18, hp: 25 }] },
  { title: 'Gió lộng Chi Lăng', sky: ['#9fb8c9', '#dfe9e0'], wind: -18, shots: 5, fire: 1,
    story: ['Gió núi thổi từ đông sang tây, lệch cả đường đạn của người bắn.', 'Tính trước sức gió, lấy hướng mà bắn. Có một phát tẩm dầu để dành cho chỗ khó.'],
    outro: 'Người bắn đã đọc được gió. Hai tên giặc ngã xuống giữa đường đèo.',
    blocks: [{ cx: 560, cy: 440, w: 34, h: 110, hp: 32 }, { cx: 740, cy: 440, w: 34, h: 110, hp: 32 }],
    targets: [{ cx: 560, cy: 360, r: 16, hp: 22 }, { cx: 740, cy: 360, r: 16, hp: 22 }] },
  { title: 'Đồi cỏ bên sông', sky: ['#f0a46a', '#f6e2b8'], wind: 12, shots: 5, fire: 1,
    story: ['Đạn tẩm dầu nổ lan, đốt cháy cả một khoảng rộng. Giặc cũng biết chạy tìm chỗ ẩn.', 'Tên giặc ở bãi cỏ đang đi tuần. Đợi hắn đi qua rồi hãy bắn.'],
    outro: 'Lửa đạn tẩm dầu cháy rừng cỏ. Bên sông, giặc không còn chỗ ẩn.',
    blocks: [{ cx: 700, cy: 430, w: 50, h: 140, hp: 50 }],
    targets: [{ cx: 700, cy: 340, r: 16, hp: 20 }, { cx: 780, cy: 460, r: 16, hp: 20, x0: 780, span: 40, spd: 1.1, ph: 0 }] },
  { title: 'Mai Pass', sky: ['#5f7f8f', '#c9d8c4'], wind: 22, shots: 5, fire: 2,
    story: ['Hai bên sườn dốc, nơi ấy giặc hay phục kích.', 'Bắn luân phiên: đạn thường để dò gió, đạn tẩm dầu để kết liễu.'],
    outro: 'Sườn dốc Mai Pass đã trở lại tay ta. Gió đổi chiều, nhưng tay ngắm vẫn vững.',
    blocks: [{ cx: 590, cy: 440, w: 34, h: 90, hp: 30 }, { cx: 680, cy: 440, w: 34, h: 90, hp: 30 }],
    targets: [{ cx: 590, cy: 370, r: 16, hp: 22 }, { cx: 680, cy: 370, r: 16, hp: 22 }] },
  { title: 'Đêm đánh úp', sky: ['#1f2a44', '#4a5a7a'], wind: -25, shots: 6, fire: 2,
    story: ['Giặc mở đêm đánh úp, đuốc sáng rực cả thung lũng.', 'Gió đổi chiều liên tục. Giữ vững tay, nhìn đuốc mà ngắm.'],
    outro: 'Đuốc giặc tắt dần trong đêm. Quân ta giữ được đèo.',
    blocks: [{ cx: 620, cy: 440, w: 32, h: 100, hp: 30 }],
    targets: [{ cx: 620, cy: 360, r: 16, hp: 22 }, { cx: 800, cy: 460, r: 16, hp: 20, x0: 800, span: 45, spd: 0.9, ph: 1.2 }] },
  { title: 'Thành lũy Chi Lăng', sky: ['#7a6a88', '#e8c9a8'], wind: 15, shots: 6, fire: 3,
    story: ['Lũy đá dày hơn, giặc ẩn sau lớp lớp tường.', 'Thả đạn qua đầu tường để tới kẻ đứng sau.'],
    outro: 'Lũy đá đã vỡ. Chi Lăng gần như sạch bóng quân xâm lược.',
    blocks: [{ cx: 600, cy: 455, w: 30, h: 50, hp: 24 }, { cx: 600, cy: 395, w: 30, h: 70, hp: 30 }, { cx: 680, cy: 430, w: 30, h: 100, hp: 30 }],
    targets: [{ cx: 600, cy: 330, r: 16, hp: 22 }, { cx: 680, cy: 350, r: 16, hp: 22 }, { cx: 740, cy: 460, r: 16, hp: 20 }] },
  { title: 'Trận cuối', sky: ['#d8704a', '#f4d59a'], wind: -20, shots: 7, fire: 3,
    story: ['Quân giặc tan vỡ, tiếng trống Chi Lăng vang khắp thung lũng.', 'Một loạt đạn cuối cùng: đẩy lùi giặc ra khỏi bờ cõi.'],
    outro: 'Chi Lăng đã yên. Giặc rút qua ải, bờ cõi lại về tay dân Việt.',
    blocks: [{ cx: 560, cy: 440, w: 30, h: 110, hp: 32 }, { cx: 640, cy: 430, w: 30, h: 130, hp: 38 }, { cx: 720, cy: 450, w: 30, h: 80, hp: 26 }],
    targets: [{ cx: 560, cy: 360, r: 16, hp: 20 }, { cx: 640, cy: 300, r: 16, hp: 20 }, { cx: 760, cy: 460, r: 16, hp: 22, x0: 760, span: 35, spd: 1.3, ph: 0 }] },
];

export const S = { maxLevel: 0, best: [], ...(readJSON(STORE_KEY) || {}) };
export function save() { writeJSON(STORE_KEY, S); }
export const unlocked = i => i <= S.maxLevel;
