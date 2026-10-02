// Tháp canh tự bắn giặc gần nhất trong tầm, cùng làn; đạn bay tới mục tiêu rồi gây sát thương.
import { prune } from '../../../platform/core/util.js';
import { G, B, troops, projs, findPlot, PROJ_SPEED } from './state.js';

export function updateTowers(dt) {
  for (const b of B) {
    if (b.kind !== 'tower') continue;
    b.t -= dt;
    if (b.t > 0) continue;
    const plot = findPlot(b.plot);
    const target = troops.find(u => u.side === 'enemy' && u.lane === plot.lane && Math.abs(u.x - plot.x) <= G.era.towerDef.range);
    if (!target) continue;
    b.t = 1 / G.era.towerDef.rate;
    projs.push({ lane: plot.lane, x: plot.x, target, dmg: G.era.towerDef.dmg, dead: false });
  }
}
export function updateProjs(dt) {
  for (const p of projs) {
    if (p.dead || p.target.hp <= 0) { p.dead = true; continue; }
    const dir = Math.sign(p.target.x - p.x) || 1;
    p.x += dir * PROJ_SPEED * dt;
    if (Math.abs(p.target.x - p.x) < 14) { p.target.hp -= p.dmg; p.dead = true; }
  }
  prune(projs, p => !p.dead);
}
