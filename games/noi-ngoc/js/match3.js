import { GRID_N, G, grid } from './state.js';
import { LEVELS, S, save } from './data.js';
import { showResult } from './flow.js';

const idx = (x, y) => y * GRID_N + x;
const N_COLORS = 6;
const randColor = () => 1 + ((Math.random() * N_COLORS) | 0);

function wouldMatch(x, y, c) {
  if (x >= 2 && grid[idx(x - 1, y)] === c && grid[idx(x - 2, y)] === c) return true;
  if (y >= 2 && grid[idx(x, y - 1)] === c && grid[idx(x, y - 2)] === c) return true;
  return false;
}
function genGrid() {
  for (let y = 0; y < GRID_N; y++) for (let x = 0; x < GRID_N; x++) {
    let c; do { c = randColor(); } while (wouldMatch(x, y, c));
    grid[idx(x, y)] = c;
  }
}
export function startLevel(i) {
  G.mode = 'play'; G.level = i; G.score = 0; G.won = false; G.selected = null; G.busy = false;
  G.movesLeft = LEVELS[i].moves; genGrid();
}
const adjacent = (a, b) => {
  const ax = a % GRID_N, ay = (a / GRID_N) | 0, bx = b % GRID_N, by = (b / GRID_N) | 0;
  return Math.abs(ax - bx) + Math.abs(ay - by) === 1;
};
function findMatches() {
  const hit = new Set();
  for (let y = 0; y < GRID_N; y++) {
    let run = 1;
    for (let x = 1; x <= GRID_N; x++) {
      const same = x < GRID_N && grid[idx(x, y)] === grid[idx(x - 1, y)] && grid[idx(x - 1, y)] !== 0;
      if (same) run++; else { if (run >= 3) for (let k = x - run; k < x; k++) hit.add(idx(k, y)); run = 1; }
    }
  }
  for (let x = 0; x < GRID_N; x++) {
    let run = 1;
    for (let y = 1; y <= GRID_N; y++) {
      const same = y < GRID_N && grid[idx(x, y)] === grid[idx(x, y - 1)] && grid[idx(x, y - 1)] !== 0;
      if (same) run++; else { if (run >= 3) for (let k = y - run; k < y; k++) hit.add(idx(x, k)); run = 1; }
    }
  }
  return hit;
}
function applyGravityAndRefill() {
  for (let x = 0; x < GRID_N; x++) {
    let write = GRID_N - 1;
    for (let y = GRID_N - 1; y >= 0; y--) if (grid[idx(x, y)] !== 0) { grid[idx(x, write)] = grid[idx(x, y)]; write--; }
    for (let y = write; y >= 0; y--) grid[idx(x, y)] = randColor();
  }
}
function resolveMatches() {
  let gained = 0, hit = findMatches();
  while (hit.size) {
    gained += hit.size * 10;
    for (const i of hit) grid[i] = 0;
    applyGravityAndRefill();
    hit = findMatches();
  }
  return gained;
}
export function trySwap(a, b) {
  [grid[a], grid[b]] = [grid[b], grid[a]];
  if (findMatches().size === 0) { [grid[a], grid[b]] = [grid[b], grid[a]]; return false; }
  return true;
}
function checkEnd() {
  if (G.score >= LEVELS[G.level].target) { G.mode = 'result'; G.won = true; S.maxLevel = Math.max(S.maxLevel, G.level + 1); save(); showResult(); }
  else if (G.movesLeft <= 0) { G.mode = 'result'; G.won = false; showResult(); }
}
export function selectCell(x, y) {
  if (G.busy || G.mode !== 'play') return;
  const i = idx(x, y);
  if (G.selected === null) { G.selected = i; return; }
  if (G.selected === i) { G.selected = null; return; }
  if (!adjacent(G.selected, i)) { G.selected = i; return; }
  const ok = trySwap(G.selected, i);
  G.selected = null;
  if (ok) { G.movesLeft--; G.score += resolveMatches(); checkEnd(); }
}
