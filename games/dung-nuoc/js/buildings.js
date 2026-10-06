import { BUILDING_DEFS, MAX_OFFLINE_SEC } from './data.js';
import { S, save } from './save.js';
import { eventMult } from './events.js';

export function recomputePop() {
  let pop = 0;
  for (const kind of Object.values(S.grid)) pop += BUILDING_DEFS[kind].pop || 0;
  S.pop = pop;
}
export function unlockedKinds() { return Object.keys(BUILDING_DEFS).filter(k => BUILDING_DEFS[k].unlockAt <= S.pop); }
export function canAfford(kind) {
  const cost = BUILDING_DEFS[kind].cost;
  return (cost.gold || 0) <= S.gold && (cost.food || 0) <= S.food;
}
export function canBuild(plot, kind) { return !S.grid[plot] && unlockedKinds().includes(kind) && canAfford(kind); }
export function build(plot, kind) {
  if (!canBuild(plot, kind)) return false;
  const cost = BUILDING_DEFS[kind].cost;
  S.gold -= cost.gold || 0; S.food -= cost.food || 0;
  S.grid[plot] = kind; recomputePop(); save();
  return true;
}
export function incomePerSec() {
  let gold = 0, food = 0;
  for (const kind of Object.values(S.grid)) { gold += BUILDING_DEFS[kind].gold || 0; food += BUILDING_DEFS[kind].food || 0; }
  return { gold, food };
}
export function tick(dt) { const inc = incomePerSec(); S.gold += inc.gold * dt; S.food += inc.food * eventMult('food') * dt; }
export function collectOffline() {
  const elapsed = Math.min(MAX_OFFLINE_SEC, Math.max(0, (Date.now() - S.lastSeen) / 1000));
  const inc = incomePerSec(); S.gold += inc.gold * elapsed; S.food += inc.food * elapsed;
  return elapsed;
}
