// Trại lính xuất quân, lính/giặc hành quân và va chạm cận chiến, giặc áp sát Nhà chính gây sát thương liên tục.
import { prune } from '../../../platform/core/util.js';
import { spark } from '../../../platform/core/fx.js';
import { G, B, troops, LANES, findPlot, SPAWN_X, HQ_FRONT_X, ALLY_HOLD_X, MAX_ALLIES_PER_LANE } from './state.js';
import { showResult } from './flow.js';

export function spawnTroop(side, lane, def) {
  troops.push({
    side, lane, x: side === 'ally' ? HQ_FRONT_X + 10 : SPAWN_X,
    hp: def.hp, maxHp: def.hp, dmg: def.dmg, reach: def.reach, spd: def.spd, name: def.name || '', walk: 0,
  });
}
function nearestFoe(u) {
  let best = null, bd = Infinity;
  for (const o of troops) {
    if (o.side === u.side || o.lane !== u.lane || o.hp <= 0) continue;
    const d = Math.abs(o.x - u.x);
    if (d < bd) { bd = d; best = o; }
  }
  return best;
}
export function updateCamps(dt) {
  for (const b of B) {
    if (b.kind !== 'camp') continue;
    b.t -= dt;
    if (b.t > 0) continue;
    const def = G.era.troopTypes[b.lvl - 1];
    b.t = def.spawnEvery;
    const lane = findPlot(b.plot).lane;
    const alive = troops.filter(u => u.side === 'ally' && u.lane === lane).length;
    if (G.gold >= def.spawnCost && alive < MAX_ALLIES_PER_LANE) { G.gold -= def.spawnCost; spawnTroop('ally', lane, def); }
  }
}
export function updateTroops(dt) {
  for (const u of troops) {
    const dir = u.side === 'ally' ? 1 : -1;
    const foe = nearestFoe(u);
    if (foe && Math.abs(foe.x - u.x) <= u.reach) { foe.hp -= u.dmg * dt; u.walk += dt * 3; continue; }
    if (u.side === 'enemy' && u.x <= HQ_FRONT_X) { G.hq.hp -= u.dmg * dt; G.shake = Math.max(G.shake, 2); continue; }
    if (u.side === 'ally' && u.x >= ALLY_HOLD_X) { u.walk += dt * 2; continue; } // giữ hàng tiền tuyến, không đi tiếp vào khoảng trống
    u.x += dir * u.spd * dt; u.walk += dt * 8;
  }
  prune(troops, u => {
    if (u.hp > 0) return true;
    spark(u.x, LANES[u.lane] - 40, 8, u.side === 'ally' ? '#8fd6ff' : '#ff8f6b');
    return false;
  });
  if (G.hq.hp <= 0 && G.phase !== 'lose') { G.hq.hp = 0; G.phase = 'lose'; showResult(); }
}
