export const COLS = 10, ROWS = 9, LOSE_ROW = 7, CELL = 44, TOP_Y = 50;
export const BOARD_X0 = (960 - COLS * CELL) / 2;
export const SHOOTER_X = 480, SHOOTER_Y = 480, PROJ_SPEED = 560, N_COLORS = 4;
export const COLORS = ['#e9574a', '#4a9fe9', '#5fae4a', '#e9b949', '#9a5ae9', '#e97aa8'];
export const G = {
  mode: 'menu', level: -1, won: false, cur: 1, next: 1, aimX: SHOOTER_X, aimY: TOP_Y, colors: N_COLORS,
  t: 0, score: 0, combo: 0, maxCombo: 0, popped: 0, recoil: 0, falling: [], banner: null,
};
export const grid = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
export let proj = null;
export function setProj(p) { proj = p; }
// exposeGlobals (debug.js) chụp giá trị của `proj` tại thời điểm tạo object literal, không phải live binding —
// để test đọc/ghi được proj hiện tại sau khi fire() đã gán, phải đi qua hàm này thay vì biến `proj` trần.
export function getProj() { return proj; }
