import { refill, prune } from '../../../platform/core/util.js';
import { spark } from '../../../platform/core/fx.js';
import { LEVELS, S, save } from './data.js';
import { G, blocks, targets, proj, ANCHOR, MAX_PULL, GRAVITY, LAUNCH_K, DMG_K, PROJ_R, GROUND_Y, W, setProj } from './state.js';
import { showResult } from './flow.js';

export function startLevel(i) {
  G.mode = 'aim'; G.level = i; G.won = false; G.dragging = false; G.aim = { x: ANCHOR.x, y: ANCHOR.y };
  G.shotsLeft = LEVELS[i].shots;
  refill(blocks, LEVELS[i].blocks.map(b => ({ ...b, dead: false })));
  refill(targets, LEVELS[i].targets.map(t => ({ ...t, dead: false })));
  setProj(null);
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
  setProj({ x: ANCHOR.x, y: ANCHOR.y, vx, vy });
  G.shotsLeft--; G.mode = 'fly'; G.aim = { x: ANCHOR.x, y: ANCHOR.y };
}
export function updatePhysics(dt) {
  if (G.mode !== 'fly' || !proj) return;
  proj.vy += GRAVITY * dt; proj.x += proj.vx * dt; proj.y += proj.vy * dt;
  for (const b of blocks) {
    if (b.dead) continue;
    if (proj.x > b.cx - b.w / 2 - PROJ_R && proj.x < b.cx + b.w / 2 + PROJ_R && proj.y > b.cy - b.h / 2 - PROJ_R && proj.y < b.cy + b.h / 2 + PROJ_R) {
      const spd = Math.hypot(proj.vx, proj.vy);
      b.hp -= spd * DMG_K; proj.vx *= .4; proj.vy *= .2;
      spark(proj.x, proj.y, 8, '#b08a5a'); if (b.hp <= 0) b.dead = true;
    }
  }
  for (const t of targets) {
    if (t.dead) continue;
    if (Math.hypot(proj.x - t.cx, proj.y - t.cy) < t.r + PROJ_R) {
      const spd = Math.hypot(proj.vx, proj.vy);
      t.hp -= spd * DMG_K; proj.vx *= .4; proj.vy *= .2;
      spark(t.cx, t.cy, 10, '#e9574a'); if (t.hp <= 0) t.dead = true;
    }
  }
  prune(blocks, b => !b.dead);
  prune(targets, t => !t.dead);
  if (proj.y > GROUND_Y + 60 || proj.x > W + 80 || proj.x < -80) {
    setProj(null);
    if (!targets.length) { G.mode = 'result'; G.won = true; S.maxLevel = Math.max(S.maxLevel, G.level + 1); save(); showResult(); }
    else if (G.shotsLeft <= 0) { G.mode = 'result'; G.won = false; showResult(); }
    else G.mode = 'aim';
  }
}
