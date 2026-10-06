import { COLS, ROWS, LOSE_ROW, CELL, TOP_Y, BOARD_X0, SHOOTER_X, SHOOTER_Y, PROJ_SPEED, N_COLORS, COLORS, G, grid, proj, setProj } from './state.js';
import { LEVELS, S, save } from './data.js';
import { showResult } from './flow.js';
import { rand, prune } from '../../../platform/core/util.js';
import { spark, floatText } from '../../../platform/core/fx.js';
import { tone } from '../../../platform/core/audio.js';

const SHOTS_PER_INSERT = 6, GRAVITY = 1400, AIM_STEP = 8, AIM_MAX_STEPS = 360, AIM_BOUNCES = 2;
let shotCount = 0;

const cellX = c => BOARD_X0 + c * CELL + CELL / 2;
const cellY = r => TOP_Y + r * CELL + CELL / 2;

function randColorFromGrid() {
  const present = new Set();
  for (const row of grid) for (const c of row) if (c) present.add(c);
  const arr = [...present];
  return arr.length ? arr[(Math.random() * arr.length) | 0] : 1 + ((Math.random() * N_COLORS) | 0);
}
export function startLevel(i) {
  const def = LEVELS[i];
  G.mode = 'aim'; G.level = i; G.won = false;
  for (const row of grid) row.fill(0);
  for (let r = 0; r < def.fillRows; r++) for (let c = 0; c < COLS; c++) grid[r][c] = 1 + ((Math.random() * def.colors) | 0);
  G.colors = def.colors;
  shotCount = 0; setProj(null);
  G.cur = randColorFromGrid(); G.next = randColorFromGrid();
  G.aimX = SHOOTER_X; G.aimY = TOP_Y;
  G.score = 0; G.combo = 0; G.maxCombo = 0; G.popped = 0; G.recoil = 0; G.falling = [];
  G.banner = { title: def.name, lore: def.lore, t: 0 };
}
export function aim(mx, my) { G.aimX = mx; G.aimY = my; }

function launchDir(mx, my) {
  const dx = mx - SHOOTER_X, dy = -Math.abs(my - SHOOTER_Y) || -1;
  const d = Math.hypot(dx, dy) || 1;
  return [dx / d, dy / d];
}
export function fire(mx, my) {
  if (G.mode !== 'aim') return;
  const [ux, uy] = launchDir(mx, my);
  setProj({ x: SHOOTER_X, y: SHOOTER_Y, vx: ux * PROJ_SPEED, vy: uy * PROJ_SPEED, color: G.cur });
  G.cur = G.next; G.next = randColorFromGrid();
  G.mode = 'fly'; G.recoil = 1;
}
// Đường ngắm: đi theo hướng bắn, nảy khỏi hai tường tối đa AIM_BOUNCES lần, dừng khi lên tới trần.
export function aimPath(mx, my) {
  let [ux, uy] = launchDir(mx, my);
  let x = SHOOTER_X, y = SHOOTER_Y, bounces = 0;
  const pts = [{ x, y }];
  for (let i = 0; i < AIM_MAX_STEPS && y > TOP_Y && bounces < AIM_BOUNCES; i++) {
    x += ux * AIM_STEP; y += uy * AIM_STEP;
    if (x < CELL / 2 || x > 960 - CELL / 2) {
      ux = -ux; x = Math.max(CELL / 2, Math.min(960 - CELL / 2, x)); bounces++;
    }
    pts.push({ x, y });
  }
  return pts;
}

function cluster(r0, c0, color) {
  const seen = new Set(), stack = [[r0, c0]], key = (r, c) => r * COLS + c;
  seen.add(key(r0, c0));
  const out = [[r0, c0]];
  while (stack.length) {
    const [r, c] = stack.pop();
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || seen.has(key(nr, nc))) continue;
      if (grid[nr][nc] === color) { seen.add(key(nr, nc)); stack.push([nr, nc]); out.push([nr, nc]); }
    }
  }
  return out;
}
// Xoá các bóng không còn bám được vào trần; trả về danh sách [hàng, cột, màu] vừa bị tách ra
function dropFloating() {
  const reach = new Set(), key = (r, c) => r * COLS + c, stack = [];
  for (let c = 0; c < COLS; c++) if (grid[0][c]) { stack.push([0, c]); reach.add(key(0, c)); }
  while (stack.length) {
    const [r, c] = stack.pop();
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || reach.has(key(nr, nc))) continue;
      if (grid[nr][nc]) { reach.add(key(nr, nc)); stack.push([nr, nc]); }
    }
  }
  const out = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    if (grid[r][c] && !reach.has(key(r, c))) { out.push([r, c, grid[r][c]]); grid[r][c] = 0; }
  }
  return out;
}
function settle(row, col, color) {
  const group = cluster(row, col, color);
  const popped = group.length >= 3 ? group : [];
  for (const [r, c] of popped) { grid[r][c] = 0; spark(cellX(c), cellY(r), 8, COLORS[color - 1], 240); }
  const dropped = dropFloating();
  for (const [r, c, k] of dropped) G.falling.push({ x: cellX(c), y: cellY(r), vx: rand(-90, 90), vy: rand(-220, -60), color: k, t: 0 });
  if (!popped.length) { G.combo = 0; return; }
  G.combo++; G.maxCombo = Math.max(G.maxCombo, G.combo); G.popped += popped.length;
  const pts = (popped.length + dropped.length) * 10 * G.combo;
  G.score += pts;
  floatText(cellX(col), cellY(row) - 16, `+${pts}`, '#ffe6a8', 24);
  if (G.combo >= 2) floatText(cellX(col), cellY(row) - 44, `Combo x${G.combo}!`, '#ff9a5a', 20);
  tone(520 + G.combo * 90, .09, 'triangle', .05);
}
function tryAttach() {
  const col = Math.max(0, Math.min(COLS - 1, Math.round((proj.x - BOARD_X0 - CELL / 2) / CELL)));
  let lowRow = -1;
  for (let r = ROWS - 1; r >= 0; r--) if (grid[r][col]) { lowRow = r; break; }
  const stopY = lowRow === -1 ? TOP_Y : TOP_Y + (lowRow + 1) * CELL;
  if (proj.y > stopY) return false;
  const row = lowRow === -1 ? 0 : Math.min(ROWS - 1, lowRow + 1);
  grid[row][col] = proj.color;
  settle(row, col, proj.color);
  return true;
}
function isEmpty() { return grid.every(row => row.every(c => !c)); }
function hasOverflow() { for (let r = LOSE_ROW; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c]) return true; return false; }
function insertRow() {
  for (let r = ROWS - 1; r > 0; r--) grid[r] = grid[r - 1].slice();
  grid[0] = Array.from({ length: COLS }, () => 1 + ((Math.random() * G.colors) | 0));
}
function recordBest() { S.best = Math.max(S.best || 0, G.score); }
function win() { G.mode = 'result'; G.won = true; S.maxLevel = Math.max(S.maxLevel, G.level + 1); recordBest(); save(); showResult(); }
function lose() { G.mode = 'result'; G.won = false; recordBest(); save(); showResult(); }
export function updateFly(dt) {
  if (G.mode !== 'fly' || !proj) return;
  proj.x += proj.vx * dt; proj.y += proj.vy * dt;
  if (proj.x < CELL / 2 || proj.x > 960 - CELL / 2) proj.vx *= -1;
  if (tryAttach()) {
    setProj(null);
    if (isEmpty()) return win();
    shotCount++;
    if (shotCount % SHOTS_PER_INSERT === 0) insertRow();
    if (hasOverflow()) return lose();
    G.mode = 'aim';
  }
}
// Đồng hồ chung: bóng rơi, động tác cung thủ, lời dẫn màn
export function tick(dt) {
  G.t += dt;
  G.recoil = Math.max(0, G.recoil - dt * 3);
  if (G.banner) G.banner.t += dt;
  for (const f of G.falling) { f.t += dt; f.vy += GRAVITY * dt; f.x += f.vx * dt; f.y += f.vy * dt; }
  prune(G.falling, f => f.y < 620);
}
