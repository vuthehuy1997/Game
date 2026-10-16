// Kinh tế chủ động (Mỏ vàng + thợ mỏ) và hàng chờ huấn luyện dùng chung (thợ mỏ/lính).
// Không có thu nhập tự sinh: vàng chỉ tăng khi có thợ mỏ đang gán tại Mỏ vàng.
import { G, troops, MAX_ALLIES } from './state.js';
import { spawnTroop } from './troops.js';

export function trainMiner() {
  if (G.phase !== 'battle') return false;
  // Đếm cả thợ đã train xong (total) lẫn đang chờ trong hàng (queue) để không cho xếp hàng
  // vượt quá maxMiners khi chưa có mục nào kịp hoàn tất (đối xứng với cách trainTroop đếm
  // alive + hàng chờ 'troop' so với MAX_ALLIES ở Hệ thống 3).
  const queuedMiners = G.train.queue.filter(q => q.kind === 'miner').length;
  if (G.miners.total + queuedMiners >= G.era.maxMiners) return false;
  if (G.gold < G.era.minerCost) return false;
  G.gold -= G.era.minerCost;
  G.train.queue.push({ kind: 'miner', t: G.era.minerTrainTime });
  return true;
}

export function assignMinerToMine() {
  if (G.miners.atMine >= G.miners.total) return false;
  G.miners.atMine++; return true;
}

export function unassignMinerFromMine() {
  if (G.miners.atMine <= 0) return false;
  G.miners.atMine--; return true;
}

export function updateMineIncome(dt) { G.gold += G.miners.atMine * G.era.mine.perMinerRate * dt; }

// Doanh trại: huấn luyện lính theo lựa chọn (troopTypeId), dùng chung hàng chờ với thợ mỏ.
export function trainTroop(troopTypeId) {
  if (G.phase !== 'battle') return false;
  const def = G.era.troopTypes.find(t => t.id === troopTypeId);
  if (!def || G.gold < def.cost) return false;
  const alive = troops.filter(u => u.side === 'ally').length;
  if (alive + G.train.queue.filter(q => q.kind === 'troop').length >= MAX_ALLIES) return false;
  G.gold -= def.cost;
  G.train.queue.push({ kind: 'troop', t: def.trainTime, troopTypeId });
  return true;
}

// Hàng chờ huấn luyện: chỉ 1 mục được train cùng lúc, xử lý tuần tự (FIFO), dùng chung cho
// thợ mỏ (Task 2) và lính (Task 3).
export function updateTrainQueue(dt) {
  if (!G.train.queue.length) return;
  const head = G.train.queue[0];
  head.t -= dt;
  if (head.t > 0) return;
  G.train.queue.shift();
  if (head.kind === 'miner') { G.miners.total++; return; }
  if (head.kind === 'troop') {
    const def = G.era.troopTypes.find(t => t.id === head.troopTypeId);
    spawnTroop('ally', def);
  }
}
