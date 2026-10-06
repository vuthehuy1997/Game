export const GRID_N = 8, CELL = 54, ORIGIN_X = (960 - GRID_N * CELL) / 2, ORIGIN_Y = 62;
export const COLORS = ['#e9574a', '#4a9fe9', '#5fae4a', '#e9b949', '#9a5ae9', '#e97aa8'];
export const SP_ROW = 1, SP_COL = 2, SP_JEWEL = 3;
export const G = {
  mode: 'menu', level: -1, movesLeft: 0, score: 0, won: false, stars: 0, selected: null,
  busy: false, resolving: false, ending: false, t: 0, stepT: 0, combo: 1, seed: [], anchor: -1,
};
const N = GRID_N * GRID_N;
export const grid = new Array(N).fill(0);
export const special = new Array(N).fill(0);
export const offX = new Array(N).fill(0);
export const offY = new Array(N).fill(0);
export const pops = [], beams = [];
