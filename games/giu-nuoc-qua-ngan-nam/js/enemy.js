// AI địch: tự sinh quân liên tục theo mốc giờ + 1 tướng giặc theo mốc G.era.bossAt (spec Hệ
// thống 5). Thay cho waves.js (đã xoá ở Task 1).
import { G, troops } from './state.js';
import { spawnTroop } from './troops.js';
import { bossDef } from './data.js';
import { S, save } from './save.js';
import { showResult } from './flow.js';

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

// Thắng/thua (spec Hệ thống 6): phá căn cứ thay vì sống sót qua sóng. Thua kiểm tra trước
// thắng, để nếu cả 2 căn cứ cùng về 0 trong cùng 1 khung hình thì tính thua.
export function checkEnd() {
  if (G.hq.hp <= 0 && G.phase === 'battle') { G.hq.hp = 0; G.phase = 'lose'; showResult(); }
  else if (G.oppHq.hp <= 0 && G.phase === 'battle') { G.phase = 'win'; S.maxEra = Math.max(S.maxEra, G.eraIdx + 1); save(); showResult(); }
}
