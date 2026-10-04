export const GRID_N = 8, CELL = 48, ORIGIN_X = (960 - GRID_N * CELL) / 2, ORIGIN_Y = 60;
export const COLORS = ['#e9574a', '#4a9fe9', '#5fae4a', '#e9b949', '#9a5ae9', '#e97aa8'];
export const G = { mode: 'menu', level: -1, movesLeft: 0, score: 0, won: false, selected: null, busy: false };
export const grid = new Array(GRID_N * GRID_N).fill(0);
