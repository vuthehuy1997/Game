// AI địch: tự sinh quân liên tục theo mốc giờ + 1 tướng giặc theo mốc G.era.bossAt (spec Hệ
// thống 5). Thay cho waves.js (đã xoá ở Task 1).
import { G, troops } from './state.js';
import { spawnTroop } from './troops.js';
import { bossDef } from './data.js';

export function updateEnemySpawns(dt) {
  if (G.phase !== 'battle') return;
  G.enemySpawnT -= dt;
  const alive = troops.filter(u => u.side === 'enemy').length;
  if (G.enemySpawnT <= 0 && alive < G.era.enemy.maxAlive) {
    G.enemySpawnT = G.era.enemy.spawnEvery;
    spawnTroop('enemy', G.era.enemy);
  }
  if (!G.bossSpawned && G.t >= G.era.bossAt) { G.bossSpawned = true; spawnTroop('enemy', bossDef(G.era)); }
}
