// Sinh lính (ta/địch) trên chiến trường 1 làn kiểu Stick War, thế trận Phòng thủ/Tấn công cho
// quân ta (Task 4). Lính địch luôn hành vi "tấn công" cố định (giữ nguyên công thức gốc trước
// khi hệ 3 làn bị bỏ — xem git show 80d3c66:games/giu-nuoc-qua-ngan-nam/js/troops.js).
import { prune } from '../../../platform/core/util.js';
import { G, troops, HQ_FRONT_X, OPP_HQ_FRONT_X, ALLY_HOLD_X } from './state.js';

export function spawnTroop(side, def) {
  troops.push({
    side, x: side === 'ally' ? HQ_FRONT_X + 10 : OPP_HQ_FRONT_X - 10,
    hp: def.hp, maxHp: def.hp, dmg: def.dmg, reach: def.reach, spd: def.spd,
    name: def.name || '', look: def.look, walk: 0,
  });
}

export function setStance(stance) { if (stance === 'defend' || stance === 'attack') G.stance = stance; }

// Địch gần nhất khác side (không còn khái niệm lane — chỉ 1 làn chung, so sánh khác side là đủ).
function nearestFoe(u) {
  let best = null, bd = Infinity;
  for (const o of troops) {
    if (o.side === u.side || o.hp <= 0) continue;
    const d = Math.abs(o.x - u.x);
    if (d < bd) { bd = d; best = o; }
  }
  return best;
}

export function updateTroops(dt) {
  for (const u of troops) {
    const foe = nearestFoe(u);
    if (foe && Math.abs(foe.x - u.x) <= u.reach) {
      // Đứng đánh tại chỗ: trừ hp lẫn nhau theo dmg*dt, không di chuyển.
      foe.hp -= u.dmg * dt; u.walk += dt * 3; continue;
    }
    if (u.side === 'enemy') {
      // Hành vi cố định, không đọc G.stance (xem spec Hệ thống 5): tiến về HQ_FRONT_X, áp sát
      // thì gây sát thương liên tục lên hq.
      if (u.x <= HQ_FRONT_X) { G.hq.hp -= u.dmg * dt; G.shake = Math.max(G.shake, 2); continue; }
      u.x += -1 * u.spd * dt; u.walk += dt * 8;
      continue;
    }
    // Quân ta: mục tiêu x phụ thuộc G.stance (spec Hệ thống 4).
    if (G.stance === 'defend') {
      if (u.x !== ALLY_HOLD_X) { u.x += Math.sign(ALLY_HOLD_X - u.x) * u.spd * dt; u.walk += dt * 8; }
    } else { // 'attack'
      if (u.x < OPP_HQ_FRONT_X) { u.x += u.spd * dt; u.walk += dt * 8; }
      else { G.oppHq.hp -= u.dmg * dt; u.walk += dt * 3; }
    }
  }
  prune(troops, u => u.hp > 0);
}
