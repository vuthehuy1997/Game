export const W = 960, H = 540;
export const LANES_X = [260, 480, 700];
export const ROAD_L = 150, ROAD_R = 810;
export const PLAYER_Y = 460;
export const JUMP_DUR = .55;

// Mỗi chặng là một vùng cảnh; `from` tính theo mét. Mốc cốt truyện (STORY) ứng với đầu mỗi chặng từ chặng 2.
export const ZONES = [
  { name: 'Đồng lúa', from: 0, sky: ['#dff0e0', '#9bc978'], far: '#7aa35a', mid: '#5f9a4a', road: '#c9a46a', edge: '#4f8a3a' },
  { name: 'Rừng tre', from: 30, sky: ['#c8dcc2', '#3c6a3a'], far: '#33602f', mid: '#22461f', road: '#8a7452', edge: '#2e5a2c' },
  { name: 'Bến sông', from: 65, sky: ['#c4e6f4', '#3f8fb0'], far: '#2e6f8f', mid: '#7a5a34', road: '#a08458', edge: '#6a5a3a' },
];
export const STORY = [
  { at: 0, text: 'Tiểu Tuấn nhận thư khẩn: giặc đã vượt biên. Phải chạy tới tiền đồn!' },
  { at: 30, text: 'Qua cánh đồng lúa, vào rừng tre. Giặc đang đuổi sát sau lưng!' },
  { at: 65, text: 'Tới bến sông! Thuyền tiền đồn đang chờ, chạy nốt đoạn cuối!' },
];
export const ITEMS = {
  shield: { name: 'Khiên tre', dur: 12, col: '#e9b949' },
  boots: { name: 'Giày gió', dur: 7, col: '#7fd3ff' },
  magnet: { name: 'Nam châm', dur: 8, col: '#ff6b6b' },
};

export const G = { mode: 'menu', t: 0, speed: 260, dist: 0, coins: 0, score: 0, shake: 0, scroll: 0, zone: 0, prevZone: 0, mix: 0, story: 1, newBest: false };
export const P = { lane: 1, jumpT: 0, ducking: false, walk: 0, face: 1, step: 0, fx: {} };
export const obstacles = []; // { lane, y, kind: 'block'|'jump'|'duck', hit }
export const pickups = [];   // { lane, y, got }  — xu
export const items = [];     // { lane, y, kind, got }  — vật phẩm
export const banner = { txt: '', t: 0 };
