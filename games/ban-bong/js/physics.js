import { COLS, ROWS, LOSE_ROW, CELL, TOP_Y, BOARD_X0, SHOOTER_X, SHOOTER_Y, PROJ_SPEED, N_COLORS, G, grid, proj, setProj } from './state.js';
import { LEVELS, S, save } from './data.js';
import { showResult } from './flow.js';

const SHOTS_PER_INSERT = 6;
let shotCount = 0;

function randColorFromGrid() {
  const present = new Set();
  for (const row of grid) for (const c of row) if (c) present.add(c);
  const arr = [...present];
  return arr.length ? arr[(Math.random() * arr.length) | 0] : 1 + ((Math.random() * N_COLORS) | 0);
}
export function startLevel(i) {
  G.mode = 'aim'; G.level = i; G.won = false;
  for (const row of grid) row.fill(0);
  const def = LEVELS[i];
  for (let r = 0; r < def.fillRows; r++) for (let c = 0; c < COLS; c++) grid[r][c] = 1 + ((Math.random() * def.colors) | 0);
  shotCount = 0; setProj(null);
  G.cur = randColorFromGrid(); G.next = randColorFromGrid();
  G.aimX = SHOOTER_X; G.aimY = TOP_Y;
}
export function aim(mx, my) { G.aimX = mx; G.aimY = my; }
export function fire(mx, my) {
  if (G.mode !== 'aim') return;
  const dx = mx - SHOOTER_X, dy = -Math.abs(my - SHOOTER_Y) || -1;
  const d = Math.hypot(dx, dy) || 1;
  setProj({ x: SHOOTER_X, y: SHOOTER_Y, vx: dx / d * PROJ_SPEED, vy: dy / d * PROJ_SPEED, color: G.cur });
  G.cur = G.next; G.next = randColorFromGrid();
  G.mode = 'fly';
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
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c] && !reach.has(key(r, c))) grid[r][c] = 0;
}
function tryAttach() {
  const col = Math.max(0, Math.min(COLS - 1, Math.round((proj.x - BOARD_X0 - CELL / 2) / CELL)));
  let topRow = ROWS;
  for (let r = 0; r < ROWS; r++) if (grid[r][col]) { topRow = r; break; }
  // topRow === 0 nghĩa là cột đã đầy tới tận trần (rất hay gặp sau insertRow, vì hàng 0 luôn được lấp kín) —
  // không còn hàng nào ở trên để gắn thêm, kẹp về 0 để tránh tính topRow-1 = -1 rồi ghi ra ngoài mảng.
  const stopY = topRow === ROWS ? TOP_Y : TOP_Y + (Math.max(0, topRow - 1)) * CELL;
  if (proj.y > stopY) return false;
  const row = Math.max(0, topRow === ROWS ? 0 : topRow - 1);
  grid[row][col] = proj.color;
  const group = cluster(row, col, proj.color);
  if (group.length >= 3) for (const [r, c] of group) grid[r][c] = 0;
  dropFloating();
  return true;
}
function isEmpty() { return grid.every(row => row.every(c => !c)); }
function hasOverflow() { for (let r = LOSE_ROW; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[r][c]) return true; return false; }
function insertRow() {
  for (let r = ROWS - 1; r > 0; r--) grid[r] = grid[r - 1].slice();
  grid[0] = Array.from({ length: COLS }, () => 1 + ((Math.random() * N_COLORS) | 0));
}
function win() { G.mode = 'result'; G.won = true; S.maxLevel = Math.max(S.maxLevel, G.level + 1); save(); showResult(); }
function lose() { G.mode = 'result'; G.won = false; showResult(); }
export function updateFly(dt) {
  if (G.mode !== 'fly' || !proj) return;
  proj.x += proj.vx * dt; proj.y += proj.vy * dt;
  if (proj.x < CELL / 2 || proj.x > 960 - CELL / 2) proj.vx *= -1;
  if (tryAttach()) {
    setProj(null);
    shotCount++;
    if (shotCount % SHOTS_PER_INSERT === 0) insertRow();
    if (isEmpty()) return win();
    if (hasOverflow()) return lose();
    G.mode = 'aim';
  }
}
