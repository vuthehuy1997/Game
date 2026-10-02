// Chuyển giai đoạn chuẩn bị/chiến đấu + trụ cọc. Task 6 thêm startWave/updateWaveSpawns/updateStakes.
import { refill } from '../../../platform/core/util.js';
import { ERAS } from './data.js';
import { G, B, troops, projs } from './state.js';

export function startEra(i) {
  G.eraIdx = i; G.era = ERAS[i]; G.phase = 'prep'; G.wave = 0; G.gold = 40; G.t = 0; G.shake = 0;
  G.hq = { hp: G.era.hq.hp, maxHp: G.era.hq.hp, lvl: 1 }; G.queue = []; G.spawnT = 0;
  refill(B); refill(troops); refill(projs);
  armStakes();
}
export function armStakes() {
  for (const b of B) if (b.kind === 'stake') b.used = false;
}
