// Di chuyển, nhảy, quay mặt — dùng chung cho fighter do người hoặc máy điều khiển.
// held/pressed chứa action 'p1_*' hoặc 'p2_*' tuỳ side của fighter.
import { held, pressed } from '../../../platform/core/input.js';
import { clamp } from '../../../platform/core/util.js';
import { FIGHTERS } from './data.js';
import { W, GROUND } from './state.js';
import { startAttack } from './combat.js';

const GRAV = 2600, JUMP_VY = -760;

export function updateFighter(f, opp, dt) {
  f.t += dt;
  const d = FIGHTERS[f.fid], act = a => f.side + '_' + a;
  if (f.hitstun > 0) { f.hitstun -= dt; }
  const locked = f.atk || f.hitstun > 0 || f.dashT > 0;
  const dir = locked ? 0 : (held.has(act('right')) ? 1 : 0) - (held.has(act('left')) ? 1 : 0);
  f.guard = !locked && held.has(act('guard')) && !f.air;

  if (f.dashT > 0) { f.dashT -= dt; f.x += f.dashDir * 900 * dt; }
  else { f.vx = f.guard ? 0 : dir * d.spd; f.x += f.vx * dt; }
  f.dashCd = Math.max(0, f.dashCd - dt);
  if (f.counterT > 0) f.counterT -= dt;

  if (!f.air && !locked && held.has(act('jump'))) { f.vy = JUMP_VY; f.air = true; }
  f.vy += GRAV * dt; f.y += f.vy * dt;
  if (f.y >= GROUND) { f.y = GROUND; f.vy = 0; if (f.air) f.st = 0; f.air = false; }

  f.x = clamp(f.x, 36, W - 36);
  if (!locked) f.face = opp.x >= f.x ? 1 : -1;
  if (dir && !f.air) f.walk += dt * 10;

  if (!locked) {
    if (pressed.has(act('light'))) startAttack(f, 'light');
    else if (pressed.has(act('heavy'))) startAttack(f, 'heavy');
  }
  f.state = f.atk ? (f.atk.kind === 'heavy' ? 'heavy' : 'light')
    : f.air ? 'air' : f.guard ? 'guard' : dir ? 'run' : f.st < .12 ? 'land' : 'idle';
}
