// Di chuyển, nhảy, quay mặt — dùng chung cho fighter do người hoặc máy điều khiển.
// held/pressed chứa action 'p1_*' hoặc 'p2_*' tuỳ side của fighter.
import { held, pressed } from '../../../platform/core/input.js';
import { clamp } from '../../../platform/core/util.js';
import { FIGHTERS } from './data.js';
import { W, GROUND } from './state.js';
import { startAttack, tryUseSpecial } from './combat.js';
import { aiHeld, aiPressed } from './ai.js';

const GRAV = 2600, JUMP_VY = -760;

export function startDash(f) {
  if (f.dashT > 0 || f.dashCd > 0 || f.atk) return;
  f.dashT = .18; f.dashCd = .6; f.dashDir = f.face;
}

export function updateFighter(f, opp, dt, aiControlled) {
  f.t += dt;
  const d = FIGHTERS[f.fid], act = a => f.side + '_' + a;
  // Khi fighter này do máy điều khiển (P2 lúc p2cpu=true), đọc kênh phím riêng của máy (aiHeld/aiPressed
  // trong ai.js) thay vì Set dùng chung của platform/core/input.js — người chơi thứ hai bấm phím thật
  // sẽ không can thiệp được vào P2 khi máy đang cầm P2.
  const H = aiControlled ? aiHeld : held, P = aiControlled ? aiPressed : pressed;
  if (f.hitstun > 0) { f.hitstun -= dt; }
  const locked = f.atk || f.hitstun > 0 || f.dashT > 0;
  const dir = locked ? 0 : (H.has(act('right')) ? 1 : 0) - (H.has(act('left')) ? 1 : 0);
  f.guard = !locked && H.has(act('guard')) && !f.air;

  if (f.dashT > 0) { f.dashT -= dt; f.x += f.dashDir * 900 * dt; }
  else { f.vx = f.guard ? 0 : dir * d.spd; f.x += f.vx * dt; }
  f.dashCd = Math.max(0, f.dashCd - dt);
  if (f.counterT > 0) f.counterT -= dt;

  if (!f.air && !locked && H.has(act('jump'))) { f.vy = JUMP_VY; f.air = true; }
  f.vy += GRAV * dt; f.y += f.vy * dt;
  if (f.y >= GROUND) { f.y = GROUND; f.vy = 0; if (f.air) f.st = 0; f.air = false; }

  f.x = clamp(f.x, 36, W - 36);
  if (!locked) f.face = opp.x >= f.x ? 1 : -1;
  if (dir && !f.air) f.walk += dt * 10;

  if (!locked) {
    if (P.has(act('light'))) startAttack(f, 'light');
    else if (P.has(act('heavy'))) startAttack(f, 'heavy');
  }
  if (!locked && P.has(act('dash'))) startDash(f);
  if (!locked && P.has(act('special'))) tryUseSpecial(f, opp);
  f.state = f.atk ? (f.atk.kind === 'heavy' ? 'heavy' : 'light')
    : f.air ? 'air' : f.guard ? 'guard' : dir ? 'run' : f.st < .12 ? 'land' : 'idle';
}
