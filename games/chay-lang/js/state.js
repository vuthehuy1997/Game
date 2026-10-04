export const W = 960, H = 540;
export const LANES_Y = [170, 300, 430];
export const PLAYER_X = 160;
export const JUMP_DUR = .55;
export const G = { mode: 'menu', t: 0, speed: 260, dist: 0, coins: 0, score: 0, shake: 0 };
export const P = { lane: 1, jumpT: 0, ducking: false, walk: 0 };
export const obstacles = []; // { lane, x, kind: 'block'|'jump'|'duck', hit }
export const pickups = [];   // { lane, x, got }
