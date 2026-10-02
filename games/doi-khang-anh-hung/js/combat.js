// Hitbox, sát thương, hitstop. 1 đòn có 3 giai đoạn theo thời gian: wind (vươn người, chưa gây sát thương) ->
// active (có hitbox, gây sát thương đúng 1 lần) -> recover (không thể hành động, chưa thể đánh tiếp).
import { overlap, clamp } from '../../../platform/core/util.js';
import { spark } from '../../../platform/core/fx.js';
import { FIGHTERS } from './data.js';
import { W } from './state.js';

export const WIND = { light: .12, heavy: .22 };
export const ACTIVE = { light: .08, heavy: .1 };
export const RECOVER = { light: .18, heavy: .3 };

export function startAttack(f, kind) {
  if (f.atk || f.hitstun > 0 || f.dashT > 0) return;
  f.atk = { kind, t: 0, hit: false };
}

function hurtbox(f) { return { x: f.x - 20, y: f.y - 110, w: 40, h: 110 }; }
function hitbox(f, reach) {
  const w = reach, x = f.face > 0 ? f.x : f.x - w;
  return { x, y: f.y - 95, w, h: 70 };
}

export function applyDamage(attacker, defender, dmg, knock, kind) {
  if (defender.dashT > 0) return; // bất tử trong lúc lướt né
  if (defender.counterT > 0) { // Task 5/6: thế phản đòn đang chủ động -> phản sát thương, kẻ tấn công nhận dmg thay
    const back = FIGHTERS[defender.fid].special.counterDmg;
    attacker.hp = clamp(attacker.hp - back, 0, FIGHTERS[attacker.fid].hp);
    spark(attacker.x, attacker.y - 70, 14, '#ffd35a'); attacker.hitstun = .3;
    defender.counterT = 0; // chỉ phản 1 lần mỗi lần kích hoạt, không phản liên tục suốt thời gian còn lại
    return;
  }
  const guarded = defender.guard && !defender.air;
  const taken = guarded ? dmg * .3 : dmg;
  defender.hp = clamp(defender.hp - taken, 0, FIGHTERS[defender.fid].hp);
  defender.vx = attacker.face * (guarded ? knock * .3 : knock);
  defender.x = clamp(defender.x + defender.vx * .03, 36, W - 36);
  defender.hitstun = guarded ? .12 : .25;
  attacker.meter = Math.min(100, attacker.meter + (kind === 'heavy' ? 14 : 8));
  defender.meter = Math.min(100, defender.meter + 5);
  spark(defender.x, defender.y - 70, guarded ? 5 : 12, guarded ? '#9fb0c9' : '#ff6a4a');
}

export function tryUseSpecial(f, opp) {
  if (f.meter < 100 || f.atk || f.hitstun > 0 || f.dashT > 0) return false;
  const sp = FIGHTERS[f.fid].special;
  f.meter = 0;
  if (sp.kind === 'counter') { f.counterT = sp.dur; return true; }
  if (sp.kind === 'ranged') {
    for (let i = 0; i < sp.hits; i++) applyDamage(f, opp, sp.dmg, 80, 'heavy');
    f.meter = 0; // applyDamage thưởng nội lực khi trúng đòn — chiêu đặc biệt phải tiêu hết, không được hồi lại
    return true;
  }
  if (sp.kind === 'dash') {
    f.dashT = .22; f.dashCd = .6; f.dashDir = f.face; f.specialDashDmg = sp.dmg; f.specialDashKnock = sp.knock;
    return true;
  }
  // 'dmg': chỉ trúng nếu còn trong tầm rộng
  const reach = FIGHTERS[f.fid].reach * 1.4;
  if (Math.abs(opp.x - f.x) <= reach) { applyDamage(f, opp, sp.dmg, sp.knock, 'heavy'); f.meter = 0; }
  return true;
}

export function updateCombat(f, opp, dt) {
  if (f.dashT > 0 && f.specialDashDmg && !f.specialDashHit && overlap(hurtbox(f), hurtbox(opp))) {
    f.specialDashHit = true; applyDamage(f, opp, f.specialDashDmg, f.specialDashKnock, 'heavy');
    f.meter = 0; // tương tự: chiêu xông không được hồi nội lực khi trúng đòn giữa đường
  }
  if (f.dashT <= 0) { f.specialDashDmg = null; f.specialDashHit = false; }
  if (!f.atk) return;
  const a = f.atk, d = FIGHTERS[f.fid];
  a.t += dt;
  const wind = WIND[a.kind], active = ACTIVE[a.kind], recover = RECOVER[a.kind];
  if (!a.hit && a.t >= wind && a.t < wind + active) {
    const reach = a.kind === 'heavy' ? d.reach : d.reach * .8;
    if (overlap(hitbox(f, reach), hurtbox(opp))) {
      a.hit = true;
      applyDamage(f, opp, a.kind === 'heavy' ? d.dmgHeavy : d.dmgLight, a.kind === 'heavy' ? 220 : 120, a.kind);
    }
  }
  if (a.t >= wind + active + recover) f.atk = null;
}
