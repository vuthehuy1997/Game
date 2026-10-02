// Chuyển giai đoạn chuẩn bị/chiến đấu + trụ cọc.
import { refill } from '../../../platform/core/util.js';
import { floatText, spark } from '../../../platform/core/fx.js';
import { ERAS, bossDef } from './data.js';
import { spawnTroop } from './troops.js';
import { S, save } from './save.js';
import { showResult } from './flow.js';
import { G, B, troops, projs, LANES, findPlot } from './state.js';

export function startEra(i) {
  G.eraIdx = i; G.era = ERAS[i]; G.phase = 'prep'; G.wave = 0; G.gold = 40; G.t = 0; G.shake = 0;
  G.hq = { hp: G.era.hq.hp, maxHp: G.era.hq.hp, lvl: 1 }; G.queue = []; G.spawnT = 0;
  refill(B); refill(troops); refill(projs);
  armStakes();
}
export function armStakes() {
  for (const b of B) if (b.kind === 'stake') b.used = false;
}
export function startWave() {
  if (G.phase !== 'prep') return;
  const wv = G.era.waves[G.wave];
  G.phase = 'battle';
  G.queue = wv.mix.flatMap(m => Array(m.count).fill(m.type));
  if (wv.bossFinal) G.queue.push('boss');
  G.spawnT = .4;
}
export function updateWaveSpawns(dt) {
  if (G.phase !== 'battle') return;
  G.spawnT -= dt;
  if (G.queue.length && G.spawnT <= 0) {
    const type = G.queue.shift();
    const def = type === 'boss' ? bossDef(G.era) : G.era.enemy;
    const lane = (Math.random() * 3) | 0;
    spawnTroop('enemy', lane, { ...def, name: def.name || 'Quân giặc' });
    G.spawnT = .7;
  }
  if (!G.queue.length && !troops.some(u => u.side === 'enemy')) finishWave();
}
function finishWave() {
  G.wave++;
  if (G.wave >= G.era.waves.length) {
    G.phase = 'win'; S.maxEra = Math.max(S.maxEra, G.eraIdx + 1); save(); showResult(); return;
  }
  G.gold += 20 + G.wave * 5; G.phase = 'prep'; armStakes();
}
export function updateStakes() {
  for (const b of B) {
    if (b.kind !== 'stake' || b.used) continue;
    const plot = findPlot(b.plot);
    const hit = troops.find(u => u.side === 'enemy' && u.lane === plot.lane && Math.abs(u.x - plot.x) < 14);
    if (!hit) continue;
    b.used = true; hit.hp -= G.era.stakeDef.dmg;
    floatText(hit.x, LANES[plot.lane] - 80, 'Mắc cọc!', '#ffd35a', 18);
    spark(hit.x, LANES[plot.lane] - 10, 10, '#d9c7a0', 320);
  }
}
