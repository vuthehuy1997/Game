// Hằng số hình học + trạng thái dùng chung cho mọi module. Mảng dùng chung: làm rỗng bằng refill(), không gán lại biến.
export const W = 960, H = 540;
export const LANES = [280, 360, 440];           // y mặt đất của 3 làn: trên, giữa, dưới
export const HQ_X = 70, HQ_FRONT_X = 130, SPAWN_X = 900;
export const ALLY_HOLD_X = 600;   // lính ta hành quân tới đây rồi giữ vị trí, chờ địch tới tầm thay vì đi mãi khỏi màn hình
export const MAX_ALLIES_PER_LANE = 3;
export const PROJ_SPEED = 420;
// 6 lô đất cố định: 2 cột × 3 làn, cạnh Nhà chính
export const PLOTS = [
  { id: 0, lane: 0, x: 190 }, { id: 1, lane: 0, x: 270 },
  { id: 2, lane: 1, x: 190 }, { id: 3, lane: 1, x: 270 },
  { id: 4, lane: 2, x: 190 }, { id: 5, lane: 2, x: 270 },
];
export const findPlot = id => PLOTS.find(p => p.id === id);

// phase: 'menu' | 'prep' | 'battle' | 'win' | 'lose'
export const G = {
  eraIdx: -1, era: null, phase: 'menu', wave: 0, gold: 0, t: 0, shake: 0,
  hq: { hp: 0, maxHp: 0, lvl: 1 }, queue: [], spawnT: 0,
};
export const B = [];       // { plot, kind: 'camp'|'tower'|'stake', lvl, t, used }
export const troops = [];  // { side: 'ally'|'enemy', lane, x, hp, maxHp, dmg, reach, spd, name, walk }
export const projs = [];   // { lane, x, target, dmg, dead }

export const buildingOn = plotId => B.find(b => b.plot === plotId);
