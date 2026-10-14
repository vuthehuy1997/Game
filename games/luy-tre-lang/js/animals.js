// Thú nuôi: gà/lợn/trâu lang thang ban ngày ở Đồng Bằng, thuần hoá bằng đúng thức ăn.
// Gà/lợn đã thuần tự sinh vật phẩm theo chu kỳ; trâu đã thuần cho cưỡi (tăng tốc độ di chuyển).
import { rand } from '../../../platform/core/util.js';
import { COLS, TS, ANIMAL_DEF, FEED_FOR_ANIMAL, MAX_ANIMALS, ANIMAL_SPAWN_EVERY, BAND_W, BIOME } from './data.js';
import { G, isNight, invAdd, invRemove, invCount } from './state.js';
import { topSolidRow, biomeAt } from './world.js';
import { heldItem } from './player.js';

function clampCol(c) { return Math.max(2, Math.min(COLS - 3, c)); }
// Đồng Bằng là dải cột đầu tiên (0..BAND_W-1)
function randomPlainsCol() { return 2 + Math.floor(Math.random() * (BAND_W - 4)); }

export function spawnOneAnimal() {
  const kinds = ['ga', 'lon', 'trau'];
  const kind = kinds[(Math.random() * kinds.length) | 0];
  const playerCol = Math.floor(G.px / TS);
  const col = biomeAt(playerCol) === BIOME.PLAINS
    ? clampCol(playerCol + (Math.random() < .5 ? -1 : 1) * (8 + ((Math.random() * 10) | 0)))
    : randomPlainsCol();
  const x = (col + .5) * TS, y = topSolidRow(G.tiles, col) * TS;
  G.animals.push({ kind, x, y, dir: Math.random() < .5 ? -1 : 1, wanderT: rand(1, 3) });
}

export function spawnAnimalsIfNeeded(dt) {
  G.animalSpawnT += dt;
  if (isNight() || G.animals.length >= MAX_ANIMALS) return;
  if (G.animalSpawnT >= ANIMAL_SPAWN_EVERY) { G.animalSpawnT = 0; spawnOneAnimal(); }
}

export function despawnAllAnimals() { G.animals.length = 0; }

export function updateAnimals(dt) {
  for (const a of G.animals) {
    const def = ANIMAL_DEF[a.kind];
    a.wanderT -= dt;
    if (a.wanderT <= 0) { a.dir = Math.random() < .5 ? -1 : 1; a.wanderT = rand(1, 3); }
    a.x += a.dir * def.speed * dt;
    a.y = topSolidRow(G.tiles, clampCol(Math.floor(a.x / TS))) * TS;
  }
  if (isNight()) despawnAllAnimals();
  for (const p of G.pets) {
    const def = ANIMAL_DEF[p.kind];
    if (!def.produce) continue;
    p.prodT = (p.prodT ?? 0) + dt;
    if (p.prodT >= def.produceEvery) { p.prodT -= def.produceEvery; invAdd(G.inv, def.produce, 1); }
  }
}

export function nearestWildAnimal(radius) {
  let best = null, bestD = radius;
  for (const a of G.animals) {
    const d = Math.hypot(a.x - G.px, a.y - G.py);
    if (d <= bestD) { bestD = d; best = a; }
  }
  return best;
}

// Thuần hoá: cần đang cầm đúng thức ăn của con thú gần nhất trong bán kính, tiêu 1 thức ăn.
export function tameAnimal(radius) {
  const a = nearestWildAnimal(radius);
  if (!a) return false;
  const food = FEED_FOR_ANIMAL[a.kind];
  if (heldItem() !== food || invCount(G.inv, food) <= 0) return false;
  invRemove(G.inv, food, 1);
  G.animals.splice(G.animals.indexOf(a), 1);
  G.pets.push({ kind: a.kind, x: a.x, y: a.y, tamed: true, prodT: 0 });
  return true;
}

// Cưỡi trâu đã thuần trong bán kính (chỉ mount, xuống trâu xử lý ở physicsStep khi nhảy).
export function tryMountNearbyTrau(radius) {
  if (G.riding) return false;
  const found = G.pets.some(p => p.kind === 'trau' && Math.hypot(p.x - G.px, p.y - G.py) <= radius);
  if (!found) return false;
  G.riding = true;
  return true;
}
