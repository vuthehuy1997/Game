// Kinh tế chủ động (Mỏ vàng + thợ mỏ) và hàng chờ huấn luyện dùng chung (thợ mỏ/lính).
// Không có thu nhập tự sinh: vàng chỉ tăng khi có thợ mỏ đang gán tại Mỏ vàng.
// Lưu ý: chưa import troops.js ở đây — file đó vẫn là code CŨ (hệ 3 làn, chưa được Task 3
// viết lại) và import nó sẽ crash lúc nạp module (B/LANES/findPlot/SPAWN_X không còn tồn
// tại trong state.js mới). Nhánh 'troop' dưới đây chỉ là khung cho Task 3 gọi spawnTroop.
import { G } from './state.js';

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

// Hàng chờ huấn luyện: chỉ 1 mục được train cùng lúc, xử lý tuần tự (FIFO), dùng chung cho
// thợ mỏ (Task 2) và lính (Task 3 thêm nhánh 'troop').
export function updateTrainQueue(dt) {
  if (!G.train.queue.length) return;
  const head = G.train.queue[0];
  head.t -= dt;
  if (head.t > 0) return;
  G.train.queue.shift();
  if (head.kind === 'miner') { G.miners.total++; return; }
  // Task 3 sẽ hoàn thiện nhánh này: tra G.era.troopTypes theo head.troopTypeId rồi gọi
  // spawnTroop('ally', def) (import từ troops.js mới, chưa tồn tại ở Task 2).
  if (head.kind === 'troop') {
    // (khung Task 2 — Task 3 thêm import spawnTroop + gọi tại đây)
  }
}
