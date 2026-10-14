// Trạng thái sống của ván chơi. G bị sửa tại chỗ để mọi module luôn thấy giá trị mới nhất.
import { COLS, ROWS, TS, HOTBAR_SLOTS, QUESTS, STORE_KEY } from './data.js';
import { readJSON, writeJSON } from '../../../platform/core/storage.js';
import { makeWorld, topSolidRow, encodeTiles, decodeTiles } from './world.js';

export const G = {};

export function freshInventory() { return new Array(HOTBAR_SLOTS).fill(null); }
export function freshQuests() { return QUESTS.map(q => ({ id: q.id, type: q.type, item: q.item, need: q.need, have: 0, claimed: false })); }

export function invAdd(inv, item, qty) {
  for (const s of inv) if (s && s.item === item) { s.count += qty; return true; }
  for (let i = 0; i < inv.length; i++) if (!inv[i]) { inv[i] = { item, count: qty }; return true; }
  return false; // hết chỗ
}
export function invCount(inv, item) { const s = inv.find(s => s && s.item === item); return s ? s.count : 0; }
export function invRemove(inv, item, qty) {
  if (invCount(inv, item) < qty) return false;
  let left = qty;
  for (let i = 0; i < inv.length; i++) {
    const s = inv[i]; if (!s || s.item !== item) continue;
    const take = Math.min(left, s.count); s.count -= take; left -= take;
    if (s.count <= 0) inv[i] = null;
    if (left <= 0) break;
  }
  return true;
}

export function newGame(seed = Date.now() >>> 0) {
  const tiles = makeWorld(seed);
  const spawnCol = COLS >> 1, groundRow = topSolidRow(tiles, spawnCol);
  Object.assign(G, {
    seed, tiles, day: 1, time: 0,
    px: (spawnCol + .5) * TS, py: groundRow * TS, vx: 0, vy: 0, grounded: false, face: 1,
    hp: 100, maxHp: 100, hurt: 0, atkCd: 0,
    inv: freshInventory(), sel: 0, gold: 10,
    quests: freshQuests(), npc: { active: false, x: 0, y: 0, fx: -1, fy: -1 },
    mobs: [], spawnT: 0, mode: 'play', bossSpawnedDay: 0, boss2SpawnedDay: 0, crops: [],
    animals: [], pets: [], animalSpawnT: 0, riding: false,
  });
  invAdd(G.inv, 'tre', 6);
}

export function isNight() { return G.time >= .5; }

export function buildSave() {
  return {
    v: 1, seed: G.seed, day: G.day, time: G.time, px: G.px, py: G.py, hp: G.hp,
    inv: G.inv, sel: G.sel, gold: G.gold, quests: G.quests, bossSpawnedDay: G.bossSpawnedDay,
    boss2SpawnedDay: G.boss2SpawnedDay,
    npc: G.npc, tilesRLE: encodeTiles(G.tiles), crops: G.crops, pets: G.pets,
  };
}
export function saveGame() { writeJSON(STORE_KEY, buildSave()); }
export function loadGame() {
  const s = readJSON(STORE_KEY);
  if (!s || s.v !== 1 || !s.tilesRLE) return false;
  const tiles = decodeTiles(s.tilesRLE);
  if (tiles.length !== COLS * ROWS) return false;
  Object.assign(G, {
    seed: s.seed, tiles, day: s.day, time: s.time, px: s.px, py: s.py, vx: 0, vy: 0, grounded: false, face: 1,
    hp: s.hp, maxHp: 100, hurt: 0, atkCd: 0,
    inv: s.inv, sel: s.sel || 0, gold: s.gold, quests: s.quests, npc: s.npc || { active: false, x: 0, y: 0, fx: -1, fy: -1 },
    mobs: [], spawnT: 0, mode: 'play', bossSpawnedDay: s.bossSpawnedDay || 0,
    boss2SpawnedDay: s.boss2SpawnedDay || 0, crops: s.crops || [],
    animals: [], pets: s.pets || [], animalSpawnT: 0, riding: false,
  });
  return true;
}

newGame();
