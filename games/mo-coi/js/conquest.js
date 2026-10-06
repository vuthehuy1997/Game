import { MAPS, MAX_TROOPS, SPAWN_PER_SEC, DEFENSE_GROW_PER_SEC, DEFENSE_CAP, DEF_MULT, G } from './state.js';
import { S, save, curMap, setStage } from './save.js';

export const MARCH_TIME = .8;
export const TERRAIN_NAME = { p: 'đồng bằng', h: 'ngọn đồi', f: 'rừng rậm', k: 'thành lũy', r: 'sông' };
const isRiver = i => curMap().terrain[i] === 'r';
const defMult = i => DEF_MULT[curMap().terrain[i]];
const place = i => `${TERRAIN_NAME[curMap().terrain[i]]} (ô ${i + 1})`;

export const neighbors = i => {
  const { cols, rows } = curMap(), x = i % cols, y = (i / cols) | 0, out = [];
  if (x > 0) out.push(i - 1); if (x < cols - 1) out.push(i + 1);
  if (y > 0) out.push(i - cols); if (y < rows - 1) out.push(i + cols);
  return out;
};
export function logEvent(text) {
  G.log.push({ text, at: G.t });
  if (G.log.length > 4) G.log.shift();
}
export function tick(dt) {
  for (let i = 0; i < S.owner.length; i++) {
    if (isRiver(i)) continue;
    if (S.owner[i]) S.troops[i] = Math.min(MAX_TROOPS, S.troops[i] + SPAWN_PER_SEC * dt);
    else S.troops[i] = Math.min(DEFENSE_CAP, S.troops[i] + DEFENSE_GROW_PER_SEC * dt);
  }
}
export const isVisible = i => !!S.owner[i] || neighbors(i).some(j => S.owner[j] === 1);
export function canAttack(from, to) {
  return !!S.owner[from] && !S.owner[to] && !isRiver(to) && neighbors(from).includes(to) && S.troops[from] > 1;
}
// Quân đánh vượt quân giữ (đã nhân hệ số địa hình) thì chiếm vùng; thua thì vùng giữ nguyên
function resolve(from, to, side) {
  const sent = Math.floor(S.troops[from]) - 1;
  if (sent <= 0) return false;
  S.troops[from] = 1;
  G.marches.push({ from, to, mine: side === 1, t: 0 });
  const eff = S.troops[to] * defMult(to);
  if (sent > eff) {
    S.owner[to] = side;
    S.troops[to] = Math.max(1, Math.round(sent - eff));
    logEvent(side === 1 ? `Quân ta chiếm ${place(to)}.` : `Giặc đoạt ${place(to)}!`);
  } else if (side === 1) {
    logEvent(`Quân ta đánh ${place(to)} nhưng bị đẩy lui.`);
  } else {
    logEvent(`Quân ta chặn được giặc ở ${place(to)}.`);
  }
  return true;
}
export function attack(from, to) {
  if (!canAttack(from, to)) return false;
  resolve(from, to, 1);
  save();
  return true;
}
export function enemyAttack(from, to) {
  if (S.owner[from] || !S.owner[to] || isRiver(to) || !neighbors(from).includes(to) || S.troops[from] <= 1) return false;
  return resolve(from, to, 0);
}
// Giặc chọn đòn có lợi nhất: quân mạnh nhất đánh vào vùng ta yếu nhất ở sát bên
function enemyTurn(dt) {
  if (G.intro) return;
  G.enemyT += dt;
  const period = Math.max(2.5, 5 - S.stage * .8);
  if (G.enemyT < period) return;
  G.enemyT = 0;
  let best = null;
  for (let from = 0; from < S.owner.length; from++) {
    if (S.owner[from] || isRiver(from) || S.troops[from] < 4) continue;
    for (const to of neighbors(from)) {
      if (S.owner[to] !== 1 || isRiver(to)) continue;
      const score = S.troops[from] - S.troops[to] * defMult(to);
      if (!best || score > best.score) best = { from, to, score };
    }
  }
  if (best && best.score > 1) enemyAttack(best.from, best.to);
}
export function step(dt) {
  G.t += dt;
  tick(dt);
  enemyTurn(dt);
  G.marches.forEach(m => { m.t += dt / MARCH_TIME; });
  G.marches = G.marches.filter(m => m.t < 1);
}
export function stageCleared() { return S.owner.every((o, i) => o === 1 || isRiver(i)); }
// Trả về 'next' khi mở ải kế tiếp, 'won' khi xong ải cuối, null nếu chưa xong
export function advanceIfCleared() {
  if (!stageCleared()) return null;
  S.maxStage = Math.max(S.maxStage, S.stage + 1);
  if (S.stage + 1 >= MAPS.length) { G.won = true; save(); return 'won'; }
  setStage(S.stage + 1);
  G.intro = true; G.enemyT = 0; G.selected = null; G.marches = [];
  save();
  return 'next';
}
export function collectOffline() {
  const elapsed = Math.min(4 * 3600, Math.max(0, (Date.now() - S.lastSeen) / 1000));
  tick(elapsed);
  return elapsed;
}
