// Luật chơi: di chuyển/va chạm, bắn (hitscan theo góc ngắm hẹp + đường ngắm thẳng), AI địch đơn giản
// (phát hiện trong tầm có đường ngắm thì áp sát hoặc nổ súng), nhặt vật phẩm, hoàn thành/thua màn.
import { CAMPAIGNS, WEAPONS } from './data.js';
import { G, P, S, enemies, pickups, grid, exitPos, curCampaign, saveProgress } from './state.js';
import { hasLineOfSight, moveWithCollision } from './map.js';
import { held } from '../../../platform/core/input.js';
import { prune, clamp } from '../../../platform/core/util.js';
import { tone } from '../../../platform/core/audio.js';
import { showResult, showPause, showOnly } from './flow.js';

export const PLAYER_R = .22;
export const MOVE_SPEED = 2.6;
export const TURN_SPEED = 2.4;
export const AIM_CONE = 10 * Math.PI / 180;
export const DETECT_RANGE = 6.5;
export const ENEMY_RANGE = 5;
export const ENEMY_SPEED = 1.1;
export const ENEMY_FIRE_INTERVAL = 1.15;
export const ENEMY_DMG = 7;
export const POINT_BLANK = 1.3;
export const PICKUP_DIST = .55;
export const EXIT_DIST = .6;

function norm(a) { return ((a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; }
function toast(txt) { G.toastTxt = txt; G.toastT = 1.6; }

export function updatePlayer(dt) {
  const w = WEAPONS[P.weapon];
  P.fireT = Math.max(0, P.fireT - dt);
  if (P.reloadT > 0) { P.reloadT -= dt; if (P.reloadT <= 0) P.ammo = w.mag; }
  const turn = (held.has('turnR') ? 1 : 0) - (held.has('turnL') ? 1 : 0);
  P.angle = norm(P.angle + turn * TURN_SPEED * dt + P.lookDelta); P.lookDelta = 0;
  const fwd = (held.has('up') ? 1 : 0) - (held.has('down') ? 1 : 0);
  const strafe = (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0);
  P.moving = fwd || strafe ? 1 : 0;
  if (P.moving) P.walk += dt * 9;
  const speed = MOVE_SPEED * dt;
  const dx = (Math.cos(P.angle) * fwd + Math.cos(P.angle + Math.PI / 2) * strafe) * speed;
  const dy = (Math.sin(P.angle) * fwd + Math.sin(P.angle + Math.PI / 2) * strafe) * speed;
  moveWithCollision(grid, P, dx, dy, PLAYER_R);

  for (const p of pickups) {
    if (p.got || Math.hypot(p.x - P.x, p.y - P.y) > PICKUP_DIST) continue;
    p.got = true;
    if (p.kind === 'health') { P.hp = Math.min(P.maxHp, P.hp + 40); toast('Hồi máu'); }
    else { P.ammo = WEAPONS[P.weapon].mag; toast('Nhận đạn'); }
    tone(880, .08, 'square', .05);
  }
  prune(pickups, p => !p.got);
}

export function updateEnemies(dt) {
  for (const e of enemies) {
    if (e.hp <= 0) { e.deadT += dt; continue; }
    e.hurtT = Math.max(0, e.hurtT - dt);
    const dx = P.x - e.x, dy = P.y - e.y, dist = Math.hypot(dx, dy);
    const los = dist < DETECT_RANGE && hasLineOfSight(grid, e.x, e.y, P.x, P.y);
    if (los) {
      e.state = 'alert'; e.angle = Math.atan2(dy, dx);
      if (dist > ENEMY_RANGE * .6) {
        const spd = ENEMY_SPEED * dt;
        moveWithCollision(grid, e, Math.cos(e.angle) * spd, Math.sin(e.angle) * spd, .22);
        e.walk += dt * 8;
      } else {
        e.fireT -= dt;
        if (e.fireT <= 0) {
          e.fireT = ENEMY_FIRE_INTERVAL;
          const chance = dist < POINT_BLANK ? 1 : clamp(1 - (dist - POINT_BLANK) / (ENEMY_RANGE - POINT_BLANK) * .75, .25, 1);
          if (Math.random() < chance) damagePlayer(ENEMY_DMG);
          tone(140, .08, 'sawtooth', .06, -40);
        }
      }
    } else e.state = 'patrol';
  }
  prune(enemies, e => e.hp > 0 || e.deadT < .9);
}

function damagePlayer(dmg) {
  P.hp = Math.max(0, P.hp - dmg); P.hurtT = .3; G.shake = 6; G.hitFlash = .4;
}

export function hitEnemy(e, dmg) {
  e.hp -= dmg; e.hurtT = .18;
  if (e.hp <= 0) { e.hp = 0; e.state = 'dead'; e.deadT = 0; G.kills++; toast(`Hạ gục! ${G.kills}/${G.needKills}`); }
}

export function shoot() {
  if (G.mode !== 'play') return;
  const w = WEAPONS[P.weapon];
  if (P.fireT > 0 || P.reloadT > 0) return;
  if (P.ammo <= 0) { reload(); return; }
  P.fireT = w.rate; P.ammo--; P.muzzle = 1;
  tone(160, .07, 'sawtooth', .07, -60);
  // Mục tiêu: địch GẦN NHẤT trong góc ngắm hẹp (không phải góc nhỏ nhất) — khi 2 địch thẳng hàng,
  // phải trúng địch đứng trước, không phải địch đứng sau.
  let best = null, bestDist = Infinity;
  for (const e of enemies) {
    if (e.hp <= 0) continue;
    const dx = e.x - P.x, dy = e.y - P.y, dist = Math.hypot(dx, dy);
    if (dist > w.range || dist >= bestDist) continue;
    const ang = Math.abs(norm(Math.atan2(dy, dx) - P.angle));
    if (ang > AIM_CONE) continue;
    if (!hasLineOfSight(grid, P.x, P.y, e.x, e.y)) continue;
    bestDist = dist; best = e;
  }
  if (best) hitEnemy(best, w.dmg);
}

export function reload() {
  if (G.mode !== 'play' || P.reloadT > 0) return;
  const w = WEAPONS[P.weapon];
  if (P.ammo >= w.mag) return;
  P.reloadT = w.reload;
  tone(220, .12, 'triangle', .05);
}

export function setWeapon(id) {
  if (G.mode !== 'play' || !S.weapons.includes(id) || id === P.weapon) return;
  P.weapon = id; P.ammo = WEAPONS[id].mag; P.reloadT = 0; P.fireT = 0;
}

export function checkExit() {
  if (G.mode !== 'play') return;
  if (G.kills < G.needKills) return;
  if (!exitPos || Math.hypot(exitPos.x - P.x, exitPos.y - P.y) > EXIT_DIST) return;
  completeLevel();
}

export function completeLevel() {
  const camp = curCampaign(), ci = G.campaign, li = G.level;
  if ((S.progress[ci] || 0) <= li) S.progress[ci] = li + 1;
  saveProgress();
  const campaignDone = li >= camp.levels.length - 1;
  G.mode = 'result';
  showResult(true, campaignDone);
}

export function checkDeath() {
  if (G.mode === 'play' && P.hp <= 0) { G.mode = 'result'; showResult(false, false); }
}

export function togglePause() {
  if (G.mode === 'play') { G.mode = 'pause'; showPause(); }
  else if (G.mode === 'pause') { G.mode = 'play'; showOnly(null); }
}

// Vòng cập nhật tổng hợp mỗi khung hình: gọi thẳng từ startLoop, gọi lại nguyên khối từ test harness.
export function update(dt) {
  if (G.mode !== 'play') return;
  G.t += dt;
  if (held.has('fire')) shoot();
  updatePlayer(dt);
  updateEnemies(dt);
  checkExit();
  checkDeath();
  G.shake = Math.max(0, G.shake - dt * 14);
  G.hitFlash = Math.max(0, G.hitFlash - dt * 1.6);
  P.muzzle = Math.max(0, P.muzzle - dt * 6);
  if (G.toastT > 0) G.toastT -= dt;
}
