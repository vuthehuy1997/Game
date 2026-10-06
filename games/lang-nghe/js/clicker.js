import { UPGRADES, ACHIEVEMENTS, MAX_OFFLINE_SEC, FESTIVAL_MUL } from './data.js';
import { S, save } from './save.js';
import { G, pushLog } from './state.js';

export function autoPerSec() {
  let sum = 0;
  for (const u of UPGRADES) if (u.kind === 'auto') sum += (S.owned[u.id] || 0) * u.value;
  return sum;
}
export function festivalMult() { return G.festival > 0 ? FESTIVAL_MUL : 1; }
export function incomePerSec() { return autoPerSec() * festivalMult(); }
export function costOf(u) { return Math.round(u.baseCost * Math.pow(u.costMul, S.owned[u.id] || 0)); }
export function isUnlocked(u) { return (S.total || 0) >= u.req; }
export function canBuy(u) { return isUnlocked(u) && S.wealth >= costOf(u); }
export function buy(u) {
  if (!canBuy(u)) return false;
  S.wealth -= costOf(u); S.owned[u.id] = (S.owned[u.id] || 0) + 1;
  if (u.kind === 'click') S.perClick += u.value;
  pushLog(`${u.name} thứ ${S.owned[u.id]} đã vào việc.`);
  save();
  return true;
}
function gain(n) { S.wealth += n; S.total = (S.total || 0) + n; }
export function click() { gain(S.perClick); }
export function tickAuto(dt) { gain(incomePerSec() * dt); }
export function collectOffline() {
  const elapsed = Math.min(MAX_OFFLINE_SEC, Math.max(0, (Date.now() - S.lastSeen) / 1000));
  const g = Math.round(elapsed * autoPerSec());
  gain(g);
  return g;
}
export function checkAchievements() {
  for (const a of ACHIEVEMENTS) {
    if (S.achv.includes(a.id) || S.total < a.at) continue;
    S.achv.push(a.id);
    pushLog(`Thành tựu mới: ${a.name}!`);
  }
}
export function fmt(n) {
  n = Math.floor(n);
  if (n < 1000) return String(n);
  if (n < 1e6) return (n / 1e3).toFixed(1) + 'k';
  if (n < 1e9) return (n / 1e6).toFixed(1) + 'tr';
  return (n / 1e9).toFixed(1) + 'B';
}
