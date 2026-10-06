import { refill, prune } from '../../../platform/core/util.js';
import { spark, dust } from '../../../platform/core/fx.js';
import { LEVELS, S, save } from './data.js';
import { G, blocks, targets, proj, ANCHOR, MAX_PULL, GRAVITY, LAUNCH_K, DMG_K, PROJ_R, GROUND_Y, W, BLAST_R, BLAST_DMG, AMMO, setProj } from './state.js';
import { showResult } from './flow.js';

const SETTLE = .7, FALL_TIME = 1.2;

export function startLevel(i) {
  const L = LEVELS[i];
  G.mode = 'aim'; G.level = i; G.won = false; G.stars = 0; G.dragging = false; G.aim = { x: ANCHOR.x, y: ANCHOR.y };
  G.shotsLeft = L.shots; G.fireLeft = L.fire || 0; G.ammo = 'da'; G.wind = L.wind || 0; G.shake = 0; G.settleT = 0;
  refill(blocks, L.blocks.map(b => ({ ...b, hp0: b.hp, dead: false, hurtT: 0 })));
  refill(targets, L.targets.map(t => ({ ...t, hp0: t.hp, dead: false, deadT: 0, hurtT: 0 })));
  setProj(null);
}
export function setAmmo(kind) {
  if (!AMMO[kind]) return;
  if (kind === 'dau' && G.fireLeft <= 0) return;
  G.ammo = kind;
}
export function startDrag(mx, my) {
  if (G.mode !== 'aim') return;
  if (Math.hypot(mx - ANCHOR.x, my - ANCHOR.y) < 50) G.dragging = true;
}
export function updateDrag(mx, my) {
  if (!G.dragging) return;
  const dx = mx - ANCHOR.x, dy = my - ANCHOR.y, d = Math.hypot(dx, dy) || 1;
  const k = d > MAX_PULL ? MAX_PULL / d : 1;
  G.aim = { x: ANCHOR.x + dx * k, y: ANCHOR.y + dy * k };
}
export function release() {
  if (!G.dragging) return;
  G.dragging = false;
  const vx = (ANCHOR.x - G.aim.x) * LAUNCH_K, vy = (ANCHOR.y - G.aim.y) * LAUNCH_K;
  if (G.ammo === 'dau') G.fireLeft--;
  G.shotsLeft--;
  setProj({ x: ANCHOR.x, y: ANCHOR.y, vx, vy, kind: G.ammo, trail: [] });
  G.mode = 'fly'; G.aim = { x: ANCHOR.x, y: ANCHOR.y };
  if (G.ammo === 'dau' && G.fireLeft <= 0) G.ammo = 'da';
}

// Đường bay dự kiến (gồm cả gió) để vẽ chấm ngắm; trả về các điểm cách nhau `every` bước.
export function trajectoryPoints(x, y, vx, vy, wind, steps = 60, every = 3) {
  const pts = [], dt = 1 / 30;
  for (let i = 1; i <= steps; i++) {
    vx += wind * dt; vy += GRAVITY * dt; x += vx * dt; y += vy * dt;
    if (i % every === 0) pts.push({ x, y });
    if (y > GROUND_Y) break;
  }
  return pts;
}

function rectDist(b, x, y) {
  const dx = Math.max(Math.abs(x - b.cx) - b.w / 2, 0), dy = Math.max(Math.abs(y - b.cy) - b.h / 2, 0);
  return Math.hypot(dx, dy);
}
function hitsBlock(b, x, y) {
  return x > b.cx - b.w / 2 - PROJ_R && x < b.cx + b.w / 2 + PROJ_R && y > b.cy - b.h / 2 - PROJ_R && y < b.cy + b.h / 2 + PROJ_R;
}
function hitsTarget(t, x, y) { return Math.hypot(x - t.cx, y - t.cy) < t.r + PROJ_R; }

function hurtBlock(b, dmg) {
  b.hp -= dmg; b.hurtT = .14;
  spark(b.cx, b.cy, 6, '#b08a5a');
  if (b.hp <= 0) { b.dead = true; dust(b.cx, b.cy + b.h / 2, 12); spark(b.cx, b.cy, 14, '#8a6a3e', 260); G.shake = 12; }
}
function hurtTarget(t, dmg) {
  t.hp -= dmg; t.hurtT = .22;
  spark(t.cx, t.cy, 10, '#e9574a');
  if (t.hp <= 0) { t.dead = true; t.deadT = 0; dust(t.cx, t.cy + t.r, 6); G.shake = 6; }
}

function blast(x, y) {
  G.shake = 14; spark(x, y, 24, '#ffb347', 420); dust(x, y, 10);
  for (const b of blocks) if (!b.dead) { const d = rectDist(b, x, y); if (d < BLAST_R) hurtBlock(b, BLAST_DMG * (1 - d / BLAST_R)); }
  for (const t of targets) if (!t.dead) { const d = Math.max(0, Math.hypot(x - t.cx, y - t.cy) - t.r); if (d < BLAST_R) hurtTarget(t, BLAST_DMG * (1 - d / BLAST_R)); }
  endShot();
}

function endShot() {
  setProj(null);
  G.mode = 'settle'; G.settleT = SETTLE;
}

// Sau khi đạn dừng: lính đang gục còn nằm thêm chút; rồi mới chốt thắng/thua hoặc cho ngắm tiếp.
function decide() {
  if (!targets.some(t => !t.dead)) {
    G.won = true; G.stars = Math.min(3, 1 + G.shotsLeft); G.mode = 'result';
    S.maxLevel = Math.max(S.maxLevel, G.level + 1);
    S.best = S.best || [];
    S.best[G.level] = Math.max(S.best[G.level] || 0, G.stars);
    save(); showResult();
  } else if (G.shotsLeft <= 0) {
    G.won = false; G.stars = 0; G.mode = 'result'; showResult();
  } else G.mode = 'aim';
}

function stepProjectile(dt) {
  proj.trail.push({ x: proj.x, y: proj.y }); if (proj.trail.length > 12) proj.trail.shift();
  proj.vx += G.wind * dt;
  proj.vy += GRAVITY * dt; proj.x += proj.vx * dt; proj.y += proj.vy * dt;
  if (proj.kind === 'dau') {
    if (blocks.some(b => !b.dead && hitsBlock(b, proj.x, proj.y)) || targets.some(t => !t.dead && hitsTarget(t, proj.x, proj.y)) || proj.y > GROUND_Y) {
      return blast(proj.x, Math.min(proj.y, GROUND_Y));
    }
  } else {
    const spd = Math.hypot(proj.vx, proj.vy);
    for (const b of blocks) {
      if (b.dead || !hitsBlock(b, proj.x, proj.y)) continue;
      hurtBlock(b, spd * DMG_K); proj.vx *= .4; proj.vy *= .2;
    }
    for (const t of targets) {
      if (t.dead || !hitsTarget(t, proj.x, proj.y)) continue;
      hurtTarget(t, spd * DMG_K); proj.vx *= .4; proj.vy *= .2;
    }
  }
  if (proj.y > GROUND_Y + 60 || proj.x > W + 80 || proj.x < -80) endShot();
}

export function updatePhysics(dt) {
  for (const t of targets) {
    if (t.hurtT > 0) t.hurtT -= dt;
    if (t.dead) { t.deadT += dt; continue; }
    if (t.span) t.cx = t.x0 + Math.sin(G.t * t.spd + t.ph) * t.span;
  }
  for (const b of blocks) if (b.hurtT > 0) b.hurtT -= dt;
  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 30);
  if (G.mode === 'fly' && proj) stepProjectile(dt);
  if (G.mode === 'settle') { G.settleT -= dt; if (G.settleT <= 0) decide(); }
  prune(blocks, b => !b.dead);
  prune(targets, t => !t.dead || t.deadT < FALL_TIME);
}
