// Bản đồ raycasting: lưới ô vuông đơn vị 1. Ký tự tường khác nhau cho vật liệu khác nhau theo bối cảnh
// từng chiến dịch (xem MATS trong render.js); '.' là nền trống. Ký tự thực thể (S/X/E/H/M) được bóc ra
// khỏi lưới khi nạp màn, không phải vật cản.

// Dựng một phòng chữ nhật viền tường, rồi ghi đè các ô bên trong (cột chắn, điểm xuất phát/thoát/địch/vật phẩm).
export function room(w, h, wall, edits = {}) {
  const rows = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) row += (x === 0 || y === 0 || x === w - 1 || y === h - 1) ? wall : '.';
    rows.push(row);
  }
  for (const [k, ch] of Object.entries(edits)) {
    const [x, y] = k.split(',').map(Number);
    rows[y] = rows[y].slice(0, x) + ch + rows[y].slice(x + 1);
  }
  return rows;
}

// Dựng một màn hoàn chỉnh từ phòng chữ nhật + cột chắn + điểm xuất phát/thoát/địch/vật phẩm.
// Toạ độ (x,y) là chỉ số ô, phải nằm trong khoảng 1..w-2 / 1..h-2 (tránh đè lên tường viền).
export function level(w, h, wall, { pillars = [], start, exit, enemies = [], pickups = [] }) {
  const edits = {};
  for (const [x, y] of pillars) edits[`${x},${y}`] = wall;
  for (const [x, y] of enemies) edits[`${x},${y}`] = 'E';
  for (const [x, y, kind] of pickups) edits[`${x},${y}`] = kind === 'health' ? 'H' : 'M';
  edits[`${start[0]},${start[1]}`] = 'S';
  edits[`${exit[0]},${exit[1]}`] = 'X';
  return room(w, h, wall, edits);
}

// Bóc ký tự thực thể khỏi bản đồ chữ thành lưới tường thuần ('.' | ký tự vật liệu) + danh sách thực thể
// với toạ độ tâm ô (x+.5, y+.5).
export function parseMap(rows) {
  const grid = rows.map(r => r.split(''));
  const enemies = [], pickups = [];
  let start = null, exit = null;
  for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[y].length; x++) {
    const c = grid[y][x];
    if (c === 'S') { start = { x: x + .5, y: y + .5 }; grid[y][x] = '.'; }
    else if (c === 'X') { exit = { x: x + .5, y: y + .5 }; grid[y][x] = '.'; }
    else if (c === 'E') { enemies.push({ x: x + .5, y: y + .5 }); grid[y][x] = '.'; }
    else if (c === 'H') { pickups.push({ x: x + .5, y: y + .5, kind: 'health' }); grid[y][x] = '.'; }
    else if (c === 'M') { pickups.push({ x: x + .5, y: y + .5, kind: 'ammo' }); grid[y][x] = '.'; }
  }
  return { grid, w: grid[0].length, h: grid.length, start, exit, enemies, pickups };
}

export function isWallAt(grid, x, y) {
  const mx = Math.floor(x), my = Math.floor(y);
  if (my < 0 || my >= grid.length || mx < 0 || mx >= grid[0].length) return true;
  return grid[my][mx] !== '.';
}

// Đường ngắm thẳng không bị tường chặn giữa 2 điểm: bước nhỏ dọc đoạn thẳng, đủ mịn cho bản đồ nhỏ.
export function hasLineOfSight(grid, x0, y0, x1, y1) {
  const dist = Math.hypot(x1 - x0, y1 - y0), steps = Math.max(1, Math.ceil(dist / .2));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (isWallAt(grid, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false;
  }
  return true;
}

// Di chuyển có va chạm: thử từng trục riêng để trượt dọc tường thay vì bị chặn cứng khi đi chéo.
export function moveWithCollision(grid, pos, dx, dy, r) {
  const nx = pos.x + dx;
  if (!isWallAt(grid, nx + Math.sign(dx) * r, pos.y - r) && !isWallAt(grid, nx + Math.sign(dx) * r, pos.y + r)) pos.x = nx;
  const ny = pos.y + dy;
  if (!isWallAt(grid, pos.x - r, ny + Math.sign(dy) * r) && !isWallAt(grid, pos.x + r, ny + Math.sign(dy) * r)) pos.y = ny;
}
