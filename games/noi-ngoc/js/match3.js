import { GRID_N, CELL, ORIGIN_X, ORIGIN_Y, COLORS, G, grid, special, offX, offY, pops, beams, SP_ROW, SP_COL, SP_JEWEL } from './state.js';
import { LEVELS, S, save } from './data.js';
import { showResult } from './flow.js';
import { spark, floatText } from '../../../platform/core/fx.js';
import { tone } from '../../../platform/core/audio.js';
import { prune } from '../../../platform/core/util.js';

const N = GRID_N * GRID_N;
const idx = (x, y) => y * GRID_N + x;
const xOf = i => i % GRID_N, yOf = i => (i / GRID_N) | 0;
const cellCenter = i => [ORIGIN_X + xOf(i) * CELL + CELL / 2, ORIGIN_Y + yOf(i) * CELL + CELL / 2];
const SWAP_DT = .2, STEP_DT = .36, DECAY = 12;
const randColor = () => 1 + ((Math.random() * COLORS.length) | 0);

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
export function starsFor(score, target) { return score >= target * 2 ? 3 : score >= target * 1.5 ? 2 : 1; }

export function startLevel(i) {
  G.mode = 'play'; G.level = i; G.score = 0; G.won = false; G.stars = 0; G.selected = null;
  G.busy = false; G.resolving = false; G.ending = false; G.stepT = 0; G.combo = 1; G.seed = []; G.anchor = -1;
  G.movesLeft = LEVELS[i].moves;
  special.fill(0); offX.fill(0); offY.fill(0); pops.length = 0; beams.length = 0;
  genGrid();
}
const adjacent = (a, b) => {
  const ax = xOf(a), ay = yOf(a), bx = xOf(b), by = yOf(b);
  return Math.abs(ax - bx) + Math.abs(ay - by) === 1;
};

function scanLine(at, dir, out) {
  let s = 0;
  for (let k = 1; k <= GRID_N; k++) {
    const same = k < GRID_N && grid[at(k)] !== 0 && grid[at(k)] === grid[at(s)];
    if (same) continue;
    if (k - s >= 3) out.push({ cells: Array.from({ length: k - s }, (_, j) => at(s + j)), dir });
    s = k;
  }
}
function findRuns() {
  const out = [];
  for (let y = 0; y < GRID_N; y++) scanLine(x => idx(x, y), 'h', out);
  for (let x = 0; x < GRID_N; x++) scanLine(y => idx(x, y), 'v', out);
  return out;
}
function specialsFor(runs) {
  const made = new Map();
  for (const r of runs) {
    const n = r.cells.length;
    if (n < 4) continue;
    const at = r.cells.includes(G.anchor) ? G.anchor : r.cells[n >> 1];
    const kind = n >= 5 ? SP_JEWEL : r.dir === 'h' ? SP_ROW : SP_COL;
    if (!made.has(at)) made.set(at, kind);
  }
  return made;
}
const madeLabel = { [SP_ROW]: 'Ngọc hàng!', [SP_COL]: 'Ngọc cột!', [SP_JEWEL]: 'Ngọc vạn năng!' };

function gravity() {
  for (let x = 0; x < GRID_N; x++) {
    let w = GRID_N - 1;
    for (let y = GRID_N - 1; y >= 0; y--) {
      const from = idx(x, y);
      if (!grid[from]) continue;
      const to = idx(x, w);
      if (to !== from) {
        grid[to] = grid[from]; special[to] = special[from]; offX[to] = 0; offY[to] = y - w;
        grid[from] = 0; special[from] = 0;
      }
      w--;
    }
    for (let y = w; y >= 0; y--) {
      const i = idx(x, y);
      grid[i] = randColor(); special[i] = 0; offX[i] = 0; offY[i] = -(y + 1);
    }
  }
}

// Một bước giải quyết: xoá các chuỗi ≥3, kích hoạt ngọc hàng/cột/vạn năng, tạo ngọc đặc biệt, rơi và bổ sung.
// Trả về false khi không còn gì để xoá.
function step() {
  const runs = findRuns();
  const made = specialsFor(runs);
  const hit = new Set(G.seed);
  G.seed = []; G.anchor = -1;
  for (const r of runs) for (const c of r.cells) if (!made.has(c)) hit.add(c);

  const queue = [...hit];
  for (let q = 0; q < queue.length; q++) {
    const c = queue[q], sp = special[c];
    if (sp !== SP_ROW && sp !== SP_COL) continue;
    const line = [];
    if (sp === SP_ROW) for (let x = 0; x < GRID_N; x++) line.push(idx(x, yOf(c)));
    else for (let y = 0; y < GRID_N; y++) line.push(idx(xOf(c), y));
    beams.push({ dir: sp === SP_ROW ? 'h' : 'v', i: c, t: 0, dur: .35 });
    for (const j of line) if (!made.has(j) && !hit.has(j)) { hit.add(j); queue.push(j); }
  }
  if (hit.size === 0) return false;

  const mult = G.combo;
  G.score += hit.size * 10 * mult;
  for (const c of hit) {
    const [cx, cy] = cellCenter(c);
    if (special[c] === SP_JEWEL) beams.push({ dir: 'ring', i: c, t: 0, dur: .45 });
    pops.push({ i: c, col: grid[c], sp: special[c], t: 0, dur: .3 });
    spark(cx, cy, 5, COLORS[grid[c] - 1], 240);
  }
  for (const c of hit) { grid[c] = 0; special[c] = 0; }
  for (const [c, kind] of made) {
    special[c] = kind;
    const [cx, cy] = cellCenter(c);
    floatText(cx, cy - 30, madeLabel[kind], '#fff3c4', 22);
    spark(cx, cy, 14, '#fff3c4', 320);
  }
  gravity();
  if (mult >= 2) floatText(ORIGIN_X + GRID_N * CELL / 2, ORIGIN_Y - 16, `Liên hoàn x${mult}`, '#ffd35a', 26);
  G.combo++;
  tone(480 + 70 * mult, .09, 'triangle', .05);
  return true;
}

function swapCells(a, b) {
  [grid[a], grid[b]] = [grid[b], grid[a]];
  [special[a], special[b]] = [special[b], special[a]];
}
function maxOffset() {
  let m = 0;
  for (let i = 0; i < N; i++) m = Math.max(m, Math.abs(offX[i]), Math.abs(offY[i]));
  return m;
}
function nudge(a, b) {
  const dx = xOf(b) - xOf(a), dy = yOf(b) - yOf(a);
  offX[a] = dx * .3; offY[a] = dy * .3; offX[b] = -dx * .3; offY[b] = -dy * .3;
}

export function trySwap(a, b) {
  const sa = special[a], sb = special[b];
  swapCells(a, b);
  if (!sa && !sb && findRuns().length === 0) { swapCells(a, b); nudge(a, b); return false; }

  const dx = xOf(b) - xOf(a), dy = yOf(b) - yOf(a);
  offX[a] = dx; offY[a] = dy; offX[b] = -dx; offY[b] = -dy;
  const seed = [];
  if (sa) seed.push(b);
  if (sb) seed.push(a);
  for (const [sp, pos] of [[sa, b], [sb, a]]) {
    if (sp !== SP_JEWEL) continue;
    const color = grid[pos === a ? b : a];
    for (let i = 0; i < N; i++) if (grid[i] === color) seed.push(i);
  }
  G.seed = seed; G.anchor = b;
  G.resolving = true; G.busy = true; G.stepT = SWAP_DT; G.combo = 1;
  return true;
}

function checkEnd() {
  const L = LEVELS[G.level];
  if (G.score >= L.target) {
    G.mode = 'result'; G.won = true; G.stars = starsFor(G.score, L.target);
    S.maxLevel = Math.max(S.maxLevel, G.level + 1);
    S.stars[G.level] = Math.max(S.stars[G.level] || 0, G.stars);
    save(); showResult();
  } else if (G.movesLeft <= 0) {
    G.mode = 'result'; G.won = false; G.stars = 0; showResult();
  }
}

export function selectCell(x, y) {
  if (G.busy || G.mode !== 'play') return;
  const i = idx(x, y);
  if (G.selected === null) { G.selected = i; return; }
  if (G.selected === i) { G.selected = null; return; }
  if (!adjacent(G.selected, i)) { G.selected = i; return; }
  const a = G.selected;
  G.selected = null;
  if (trySwap(a, i)) G.movesLeft--;
}

export function tick(dt) {
  G.t += dt;
  for (const arr of [offX, offY]) for (let i = 0; i < N; i++) {
    if (!arr[i]) continue;
    arr[i] = Math.abs(arr[i]) < .01 ? 0 : arr[i] * Math.exp(-DECAY * dt);
  }
  for (const p of pops) p.t += dt;
  for (const b of beams) b.t += dt;
  prune(pops, p => p.t < p.dur);
  prune(beams, b => b.t < b.dur);

  if (G.resolving) {
    G.stepT -= dt;
    if (G.stepT <= 0) {
      if (step()) G.stepT = STEP_DT;
      else { G.resolving = false; G.ending = true; }
    }
  }
  if (G.ending && maxOffset() <= .02) { G.ending = false; checkEnd(); }
  G.busy = G.resolving || G.ending || maxOffset() > .02;
}
