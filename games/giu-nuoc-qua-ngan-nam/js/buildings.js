// Xây/nâng cấp công trình + thu nhập Vàng theo thời gian. Mọi thao tác tốn Vàng chỉ cho phép ở giai đoạn chuẩn bị.
import { G, B, buildingOn } from './state.js';

export const BUILD_KINDS = ['camp', 'tower', 'stake'];
export const buildLabel = k => k === 'camp' ? 'Trại lính' : k === 'tower' ? 'Tháp canh' : 'Trụ cọc';

export function costOf(kind) {
  return kind === 'camp' ? G.era.campCost : kind === 'tower' ? G.era.towerDef.cost : G.era.stakeDef.cost;
}
export function canBuild(plotId, kind) {
  return G.phase === 'prep' && !buildingOn(plotId) && G.gold >= costOf(kind);
}
export function build(plotId, kind) {
  if (!canBuild(plotId, kind)) return false;
  G.gold -= costOf(kind);
  B.push({ plot: plotId, kind, lvl: 1, t: 0, used: false });
  return true;
}
export function campUpgradeCost(b) { return G.era.campUpgradeCost[b.lvl - 1]; }
export function canUpgrade(b) {
  return b.kind === 'camp' && b.lvl < 3 && G.phase === 'prep' && G.gold >= campUpgradeCost(b);
}
export function upgrade(b) {
  if (!canUpgrade(b)) return false;
  G.gold -= campUpgradeCost(b); b.lvl++; return true;
}
export function canUpgradeHQ() {
  return G.hq.lvl < 3 && G.phase === 'prep' && G.gold >= G.era.hq.upgradeCost[G.hq.lvl - 1];
}
export function upgradeHQ() {
  if (!canUpgradeHQ()) return false;
  G.gold -= G.era.hq.upgradeCost[G.hq.lvl - 1];
  G.hq.lvl++; G.hq.maxHp = Math.round(G.era.hq.hp * (1 + .25 * (G.hq.lvl - 1))); G.hq.hp = G.hq.maxHp;
  return true;
}
export function updateIncome(dt) { G.gold += G.era.hq.income[G.hq.lvl - 1] * dt; }
