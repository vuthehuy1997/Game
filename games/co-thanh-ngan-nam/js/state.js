// Trạng thái dùng chung. Các mảng/đối tượng không bao giờ bị gán lại (chỉ sửa nội dung), để debug.js chụp đúng.
export const W = 960, H = 540;
export const GATE_X = 250;
export const SPAWN_X = 1000;
export const LANES = [190, 300, 410];
export const COLS_X = [330, 430, 530];
export const LANE_HIT = 34;

export const G = {
  mode: 'menu', era: 0, wave: 0, gateHp: 100, gold: 0, waveT: 0, t: 0,
  queue: [], result: null, stars: 0, pick: 'wall', rule: 'nho',
};

export const slots = Array.from({ length: 9 }, (_, i) => ({
  i, lane: Math.floor(i / 3), col: i % 3, x: COLS_X[i % 3], y: LANES[Math.floor(i / 3)], b: null,
}));
export const enemies = [];
export const shots = [];
export const fires = [];
