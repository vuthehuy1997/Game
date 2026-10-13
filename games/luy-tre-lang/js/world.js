// Sinh thế giới theo seed, truy cập/sửa tile, kiểm tra nhà hợp lệ, nén lưu dạng RLE.
import { COLS, ROWS, TS, TILE, SOLID, HOUSE_BOUND } from './data.js';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeWorld(seed) {
  const tiles = new Uint8Array(COLS * ROWS);
  const rnd = mulberry32(seed >>> 0);
  const jitter = []; for (let c = 0; c < COLS; c++) jitter.push(rnd());
  const oreRoll = []; for (let i = 0; i < COLS * ROWS; i++) oreRoll.push(rnd());

  const surf = c => Math.round(28 + Math.sin(c * 0.07) * 4 + Math.sin(c * 0.023 + 1.7) * 6 + (jitter[c] - .5) * 4);

  for (let c = 0; c < COLS; c++) {
    const s = Math.max(6, Math.min(ROWS - 20, surf(c)));
    for (let r = 0; r < ROWS; r++) {
      const i = r * COLS + c;
      if (c === 0 || c === COLS - 1 || r === ROWS - 1) { tiles[i] = TILE.BEDROCK; continue; }
      if (r < s) { tiles[i] = TILE.AIR; continue; }
      if (r < s + 5) { tiles[i] = TILE.DIRT; continue; }
      let t = TILE.STONE;
      const d = r - s;
      const roll = oreRoll[i];
      if (d >= 6 && d < 16 && roll < .10) t = TILE.COPPER;
      else if (d >= 16 && d < 28 && roll < .09) t = TILE.IRON;
      else if (d >= 28 && d < 40 && roll < .07) t = TILE.SILVER;
      else if (d >= 40 && roll < .05) t = TILE.GOLD;
      // hang động: không đục ngay sát mặt đất để tránh sập nền
      if (d >= 6) {
        const cave = Math.sin(c * .13 + r * .11) + Math.sin(c * .05 - r * .17) + (oreRoll[(i * 7) % oreRoll.length] - .5) * 1.3;
        if (cave > 1.05) t = TILE.AIR;
      }
      tiles[i] = t;
    }
    // Bụi tre trên mặt đất, cách quãng
    if (c % 7 === 3 && s - 3 >= 1) {
      for (let k = 1; k <= 3; k++) tiles[(s - k) * COLS + c] = TILE.BAMBOO;
    }
  }
  return tiles;
}

export function inBounds(c, r) { return c >= 0 && c < COLS && r >= 0 && r < ROWS; }
export function getTile(tiles, c, r) { return inBounds(c, r) ? tiles[r * COLS + c] : TILE.BEDROCK; }
export function setTile(tiles, c, r, code) { if (inBounds(c, r)) tiles[r * COLS + c] = code; }
export function isSolid(code) { return SOLID.has(code); }

// Hàng đầu tiên có tile đặc tính từ trên xuống tại cột c (dùng để đặt người chơi/quái lên mặt đất)
export function topSolidRow(tiles, c) {
  for (let r = 0; r < ROWS; r++) if (isSolid(getTile(tiles, c, r))) return r;
  return ROWS - 1;
}

// Nhà hợp lệ: tường trái+phải (một bên có thể là cửa), mái phía trên, có đuốc trong phòng 3x2,
// nền (tile đặc) ngay dưới sàn. (fx,fy) là ô sàn trống nơi người ở, (fx,fy-1) là ô đầu.
export function checkHouse(tiles, fx, fy) {
  const g = (dx, dy) => getTile(tiles, fx + dx, fy + dy);
  if (g(0, 0) !== TILE.AIR && g(0, 0) !== TILE.TORCH) return false;
  if (g(0, -1) !== TILE.AIR && g(0, -1) !== TILE.TORCH) return false;
  if (!isSolid(g(0, 1))) return false; // nền
  const left0 = g(-1, 0), left1 = g(-1, -1), right0 = g(1, 0), right1 = g(1, -1);
  const isBound = t => HOUSE_BOUND.has(t);
  if (!isBound(left0) || !isBound(left1) || !isBound(right0) || !isBound(right1)) return false;
  if (left0 !== TILE.DOOR && right0 !== TILE.DOOR && left1 !== TILE.DOOR && right1 !== TILE.DOOR) return false;
  if (g(-1, -2) !== TILE.ROOF && g(0, -2) !== TILE.ROOF && g(1, -2) !== TILE.ROOF) return false;
  const hasTorch = g(0, 0) === TILE.TORCH || g(0, -1) === TILE.TORCH;
  return hasTorch;
}

// Quét toàn bản đồ tìm một ngôi nhà hợp lệ (dùng sau khi người chơi đặt block); trả về {fx,fy} hoặc null
export function findHouse(tiles) {
  for (let c = 2; c < COLS - 2; c++) for (let r = 2; r < ROWS - 2; r++) {
    if (checkHouse(tiles, c, r)) return { fx: c, fy: r };
  }
  return null;
}

// Nén RLE: chuỗi "code:count,code:count,..."
export function encodeTiles(tiles) {
  let out = '', i = 0;
  while (i < tiles.length) {
    const v = tiles[i]; let n = 1;
    while (i + n < tiles.length && tiles[i + n] === v) n++;
    out += (out ? ',' : '') + v + ':' + n; i += n;
  }
  return out;
}
export function decodeTiles(str) {
  const tiles = new Uint8Array(COLS * ROWS);
  let i = 0;
  for (const pair of str.split(',')) {
    const [v, n] = pair.split(':').map(Number);
    for (let k = 0; k < n && i < tiles.length; k++) tiles[i++] = v;
  }
  return tiles;
}
