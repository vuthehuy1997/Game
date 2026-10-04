import { rand, prune, refill } from '../../../platform/core/util.js';
import { floatText } from '../../../platform/core/fx.js';
import { G, P, obstacles, pickups, LANES_Y, PLAYER_X, JUMP_DUR } from './state.js';
import { S, save } from './save.js';
import { showResult } from './flow.js';

const SPEED_MAX = 620, ACCEL = 4, HIT_RANGE = 26;
let spawnT = 0;

export function startRun() {
  G.mode = 'run'; G.t = 0; G.speed = 260; G.dist = 0; G.coins = 0; G.score = 0; G.shake = 0;
  P.lane = 1; P.jumpT = 0; P.ducking = false; P.walk = 0;
  refill(obstacles); refill(pickups); spawnT = .9;
}
export function moveLane(dir) { if (G.mode === 'run') P.lane = Math.max(0, Math.min(2, P.lane + dir)); }
export function doJump() { if (G.mode === 'run' && P.jumpT <= 0 && !P.ducking) P.jumpT = JUMP_DUR; }
export function setDuck(v) { if (P.jumpT <= 0) P.ducking = v; }

export function updateRun(dt) {
  if (G.mode !== 'run') return;
  G.t += dt; G.speed = Math.min(SPEED_MAX, G.speed + ACCEL * dt);
  G.dist += G.speed * dt; P.walk += dt * 10;
  if (P.jumpT > 0) P.jumpT = Math.max(0, P.jumpT - dt);

  spawnT -= dt;
  if (spawnT <= 0) {
    const lane = (Math.random() * 3) | 0, kind = ['block', 'jump', 'duck'][(Math.random() * 3) | 0];
    obstacles.push({ lane, x: 1040, kind });
    if (Math.random() < .6) pickups.push({ lane: (Math.random() * 3) | 0, x: 1040 + rand(-60, 60) });
    spawnT = Math.max(.55, 1.3 - G.speed / 1000);
  }
  for (const o of obstacles) o.x -= G.speed * dt;
  for (const c of pickups) c.x -= G.speed * dt;

  for (const o of obstacles) {
    if (o.hit || o.lane !== P.lane || Math.abs(o.x - PLAYER_X) > HIT_RANGE) continue;
    const dodged = (o.kind === 'jump' && P.jumpT > 0) || (o.kind === 'duck' && P.ducking);
    if (!dodged) { o.hit = true; return gameOver(); }
  }
  for (const c of pickups) {
    if (c.got || c.lane !== P.lane || Math.abs(c.x - PLAYER_X) > HIT_RANGE) continue;
    c.got = true; G.coins++; floatText(PLAYER_X, LANES_Y[P.lane] - 60, '+1', '#ffe6a8', 16);
  }
  prune(obstacles, o => o.x > -60 && !o.hit);
  prune(pickups, c => c.x > -60 && !c.got);
}
function gameOver() {
  G.mode = 'over'; G.shake = 8;
  G.score = Math.round(G.dist / 20) + G.coins * 5;
  if (G.score > S.best) { S.best = G.score; save(); }
  showResult();
}
