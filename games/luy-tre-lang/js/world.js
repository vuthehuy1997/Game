// Sinh thế giới theo seed, truy cập/sửa tile, kiểm tra nhà hợp lệ, nén lưu dạng RLE.
import { COLS, ROWS, TS, TILE, SOLID, HOUSE_BOUND, BAND_W, BIOME } from './data.js';

// Khu vực theo cột: 4 dải liên tiếp cố định trái -> phải
export function biomeAt(col) {
  if (col < BAND_W) return BIOME.PLAINS;
  if (col < BAND_W * 2) return BIOME.BAMBOO_FOREST;
  if (col < BAND_W * 3) return BIOME.SWAMP;
  return BIOME.MOUNTAIN;
}

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

  const surf = c => {
    const biome = biomeAt(c);
    const amp = biome === BIOME.MOUNTAIN ? 1.8 : 1;
    const base = 28 + (biome === BIOME.SWAMP ? 10 : 0); // đầm lầy: mặt đất thấp hơn
    return Math.round(base + Math.sin(c * 0.07) * 4 * amp + Math.sin(c * 0.023 + 1.7) * 6 * amp + (jitter[c] - .5) * 4 * amp);
  };

  for (let c = 0; c < COLS; c++) {
    const biome = biomeAt(c);
    const s = Math.max(6, Math.min(ROWS - 20, surf(c)));
    const dirtThick = biome === BIOME.BAMBOO_FOREST ? 7 : 5;
    const oreBoost = biome === BIOME.MOUNTAIN ? 1.5 : 1; // núi: sắt/bạc nhiều hơn
    // Đầm lầy: cứ ~10 cột có 1 rãnh nước nông sâu 2 tile ngay trên bề mặt
    const isWaterDitch = biome === BIOME.SWAMP && c % 10 === 0;
    for (let r = 0; r < ROWS; r++) {
      const i = r * COLS + c;
      if (c === 0 || c === COLS - 1 || r === ROWS - 1) { tiles[i] = TILE.BEDROCK; continue; }
      if (r < s) { tiles[i] = TILE.AIR; continue; }
      if (isWaterDitch && r < s + 2) { tiles[i] = TILE.WATER; continue; }
      if (r < s + dirtThick) { tiles[i] = TILE.DIRT; continue; }
      let t = TILE.STONE;
      const d = r - s;
      const roll = oreRoll[i];
      if (d >= 6 && d < 16 && roll < .10) t = TILE.COPPER;
      else if (d >= 16 && d < 28 && roll < .09 * oreBoost) t = TILE.IRON;
      else if (d >= 28 && d < 40 && roll < .07 * oreBoost) t = TILE.SILVER;
      else if (d >= 40 && roll < .05) t = TILE.GOLD;
      // hang động: không đục ngay sát mặt đất để tránh sập nền
      if (d >= 6) {
        const cave = Math.sin(c * .13 + r * .11) + Math.sin(c * .05 - r * .17) + (oreRoll[(i * 7) % oreRoll.length] - .5) * 1.3;
        if (cave > 1.05) t = TILE.AIR;
      }
      tiles[i] = t;
    }
    // Bụi tre trên mặt đất: rừng tre rậm dày hơn hẳn các khu vực khác; đầm lầy không có tre, có bụi sậy thay thế
    const bambooEvery = biome === BIOME.BAMBOO_FOREST ? 3 : 7;
    const bambooPhase = biome === BIOME.BAMBOO_FOREST ? 1 : 3;
    if (biome !== BIOME.SWAMP && c % bambooEvery === bambooPhase && s - 3 >= 1) {
      for (let k = 1; k <= 3; k++) tiles[(s - k) * COLS + c] = TILE.BAMBOO;
    }
    if (biome === BIOME.SWAMP && !isWaterDitch && c % 4 === 2 && s - 1 >= 1) {
      tiles[(s - 1) * COLS + c] = TILE.REED;
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

// Nhà hợp lệ: tường trái+phải (một bên có thể là cửa), mái phía trên, có đuốc HOẶC đe rèn
// trong phòng 3x2, nền (tile đặc) ngay dưới sàn. (fx,fy) là ô sàn trống nơi người ở, (fx,fy-1)
// là ô đầu. Trả về 'blacksmith' | 'merchant' | false — nhà có cả đuốc lẫn đe rèn ưu tiên thợ rèn.
export function checkHouse(tiles, fx, fy) {
  const g = (dx, dy) => getTile(tiles, fx + dx, fy + dy);
  const isLight = t => t === TILE.AIR || t === TILE.TORCH || t === TILE.ANVIL;
  if (!isLight(g(0, 0))) return false;
  if (!isLight(g(0, -1))) return false;
  if (!isSolid(g(0, 1))) return false; // nền
  const left0 = g(-1, 0), left1 = g(-1, -1), right0 = g(1, 0), right1 = g(1, -1);
  const isBound = t => HOUSE_BOUND.has(t);
  if (!isBound(left0) || !isBound(left1) || !isBound(right0) || !isBound(right1)) return false;
  if (left0 !== TILE.DOOR && right0 !== TILE.DOOR && left1 !== TILE.DOOR && right1 !== TILE.DOOR) return false;
  if (g(-1, -2) !== TILE.ROOF && g(0, -2) !== TILE.ROOF && g(1, -2) !== TILE.ROOF) return false;
  const hasAnvil = g(0, 0) === TILE.ANVIL || g(0, -1) === TILE.ANVIL;
  const hasTorch = g(0, 0) === TILE.TORCH || g(0, -1) === TILE.TORCH;
  if (hasAnvil) return 'blacksmith';
  if (hasTorch) return 'merchant';
  return false;
}

// Quét toàn bản đồ tìm một ngôi nhà hợp lệ chưa bị chiếm (dùng sau khi người chơi đặt block);
// `exclude` là danh sách {fx,fy} các vị trí NPC đã có sẵn, bỏ qua để không "nâng cấp" NPC đã tồn
// tại khi người chơi thêm đe rèn vào đúng căn nhà cũ. Trả về {fx,fy,kind} hoặc null.
export function findHouse(tiles, exclude = []) {
  for (let c = 2; c < COLS - 2; c++) for (let r = 2; r < ROWS - 2; r++) {
    if (exclude.some(e => e.fx === c && e.fy === r)) continue;
    const kind = checkHouse(tiles, c, r);
    if (kind) return { fx: c, fy: r, kind };
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
