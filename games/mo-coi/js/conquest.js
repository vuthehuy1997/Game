import { COLS, ROWS, N, MAX_TROOPS, SPAWN_PER_SEC, DEFENSE_GROW_PER_SEC, DEFENSE_CAP } from './state.js';
import { S, save } from './save.js';

export const neighbors = i => {
  const x = i % COLS, y = (i / COLS) | 0, out = [];
  if (x > 0) out.push(i - 1); if (x < COLS - 1) out.push(i + 1);
  if (y > 0) out.push(i - COLS); if (y < ROWS - 1) out.push(i + COLS);
  return out;
};
export function tick(dt) {
  for (let i = 0; i < N; i++) {
    if (S.owner[i]) S.troops[i] = Math.min(MAX_TROOPS, S.troops[i] + SPAWN_PER_SEC * dt);
    else S.troops[i] = Math.min(DEFENSE_CAP, S.troops[i] + DEFENSE_GROW_PER_SEC * dt);
  }
}
export function canAttack(from, to) {
  return !!S.owner[from] && !S.owner[to] && neighbors(from).includes(to) && S.troops[from] > 1;
}
export function attack(from, to) {
  if (!canAttack(from, to)) return false;
  const sent = Math.floor(S.troops[from]) - 1;
  if (sent <= 0) return false;
  S.troops[from] = 1;
  if (sent > S.troops[to]) { S.owner[to] = 1; S.troops[to] = sent - S.troops[to]; }
  save();
  return true;
}
export function hasWon() { return S.owner.every(o => o === 1); }
export function collectOffline() {
  const elapsed = Math.min(4 * 3600, Math.max(0, (Date.now() - S.lastSeen) / 1000));
  tick(elapsed);
  return elapsed;
}
