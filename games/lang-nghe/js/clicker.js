import { UPGRADES, MAX_OFFLINE_SEC } from './data.js';
import { S, save } from './save.js';

export function autoPerSec() {
  let sum = 0;
  for (const u of UPGRADES) if (u.kind === 'auto') sum += (S.owned[u.id] || 0) * u.value;
  return sum;
}
export function costOf(u) { return Math.round(u.baseCost * Math.pow(u.costMul, S.owned[u.id] || 0)); }
export function canBuy(u) { return S.wealth >= costOf(u); }
export function buy(u) {
  if (!canBuy(u)) return false;
  S.wealth -= costOf(u); S.owned[u.id] = (S.owned[u.id] || 0) + 1;
  if (u.kind === 'click') S.perClick += u.value;
  save();
  return true;
}
export function click() { S.wealth += S.perClick; }
export function tickAuto(dt) { S.wealth += autoPerSec() * dt; }
export function collectOffline() {
  const elapsed = Math.min(MAX_OFFLINE_SEC, Math.max(0, (Date.now() - S.lastSeen) / 1000));
  const gain = Math.round(elapsed * autoPerSec());
  S.wealth += gain;
  return gain;
}
export function fmt(n) {
  n = Math.floor(n);
  if (n < 1000) return String(n);
  if (n < 1e6) return (n / 1e3).toFixed(1) + 'k';
  if (n < 1e9) return (n / 1e6).toFixed(1) + 'tr';
  return (n / 1e9).toFixed(1) + 'B';
}
