// Sinh lính (ta/địch) trên chiến trường 1 làn kiểu Stick War. Task 3 chỉ cần spawnTroop đủ
// dùng cho hàng chờ huấn luyện (Doanh trại); updateTroops (di chuyển/đánh nhau theo thế trận)
// là việc của Task 4, chưa viết ở đây.
import { troops, HQ_FRONT_X, OPP_HQ_FRONT_X } from './state.js';

export function spawnTroop(side, def) {
  troops.push({
    side, x: side === 'ally' ? HQ_FRONT_X + 10 : OPP_HQ_FRONT_X - 10,
    hp: def.hp, maxHp: def.hp, dmg: def.dmg, reach: def.reach, spd: def.spd,
    name: def.name || '', look: def.look, walk: 0,
  });
}
