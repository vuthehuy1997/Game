import { rand, prune, refill } from '../../../platform/core/util.js';
import { floatText, spark, dust } from '../../../platform/core/fx.js';
import { G, P, obstacles, pickups, items, banner, LANES_X, PLAYER_Y, JUMP_DUR, ZONES, STORY, ITEMS } from './state.js';
import { S, save } from './save.js';
import { showResult } from './flow.js';

const SPEED_MAX = 620, ACCEL = 4, HIT_RANGE = 26, SPAWN_Y = -40, MAGNET_UP = 160;
let spawnT = 0;

export const metres = () => G.dist / 20;
export function zoneAt(m) {
  let z = 0;
  ZONES.forEach((zn, i) => { if (m >= zn.from) z = i; });
  return z;
}

export function startRun() {
  Object.assign(G, { mode: 'run', t: 0, speed: 260, dist: 0, coins: 0, score: 0, shake: 0, scroll: 0, zone: 0, prevZone: 0, mix: 0, story: 1, newBest: false });
  Object.assign(P, { lane: 1, jumpT: 0, ducking: false, walk: 0, face: 1, step: 0 });
  P.fx = {};
  refill(obstacles); refill(pickups); refill(items);
  banner.txt = STORY[0].text; banner.t = 4;
  spawnT = .9;
}
export function moveLane(dir) {
  if (G.mode !== 'run') return;
  const next = Math.max(0, Math.min(2, P.lane + dir));
  if (next !== P.lane) P.face = dir > 0 ? 1 : -1;
  P.lane = next;
}
export function doJump() { if (G.mode === 'run' && P.jumpT <= 0 && !P.ducking) P.jumpT = JUMP_DUR; }
export function setDuck(v) { if (P.jumpT <= 0) P.ducking = v; }

export function updateRun(dt) {
  if (G.mode !== 'run') return;
  G.t += dt; G.speed = Math.min(SPEED_MAX, G.speed + ACCEL * dt);
  const boots = P.fx.boots > 0;
  G.dist += G.speed * (boots ? 1.2 : 1) * dt; G.scroll += G.speed * dt; P.walk += dt * 10;
  footsteps();
  const wasAir = P.jumpT > 0;
  if (wasAir) P.jumpT = Math.max(0, P.jumpT - dt);
  if (wasAir && P.jumpT <= 0) dust(LANES_X[P.lane], PLAYER_Y + 4, 8);
  for (const k of Object.keys(P.fx)) P.fx[k] = Math.max(0, P.fx[k] - dt);
  trackStory(dt);
  spawn(dt);
  for (const o of obstacles) o.y += G.speed * dt;
  for (const c of pickups) c.y += G.speed * dt;
  for (const it of items) it.y += G.speed * dt;
  if (collideObstacles()) return;
  collectCoins();
  collectItems();
  prune(obstacles, o => o.y < 600 && !o.hit);
  prune(pickups, c => c.y < 600 && !c.got);
  prune(items, it => it.y < 600 && !it.got);
}

function footsteps() {
  const s = Math.floor(P.walk / Math.PI);
  if (s === P.step) return;
  P.step = s;
  if (P.jumpT <= 0) dust(LANES_X[P.lane], PLAYER_Y + 4, 3);
}

function trackStory(dt) {
  const m = metres(), z = zoneAt(m);
  if (z !== G.zone) { G.prevZone = G.zone; G.zone = z; G.mix = 1; }
  G.mix = Math.max(0, G.mix - dt * .8);
  while (G.story < STORY.length && m >= STORY[G.story].at) {
    banner.txt = STORY[G.story].text; banner.t = 4; G.story++;
  }
  banner.t = Math.max(0, banner.t - dt);
}

function spawn(dt) {
  spawnT -= dt;
  if (spawnT > 0) return;
  const lane = (Math.random() * 3) | 0, kind = ['block', 'jump', 'duck'][(Math.random() * 3) | 0];
  obstacles.push({ lane, y: SPAWN_Y, kind });
  if (Math.random() < .6) pickups.push({ lane: (Math.random() * 3) | 0, y: SPAWN_Y + rand(-60, 60) });
  if (Math.random() < .18) {
    const kinds = Object.keys(ITEMS);
    items.push({ lane: (Math.random() * 3) | 0, y: SPAWN_Y - 120, kind: kinds[(Math.random() * kinds.length) | 0] });
  }
  spawnT = Math.max(.55, 1.3 - G.speed / 1000);
}

// Trả về true nếu va chạm làm kết thúc lượt
function collideObstacles() {
  for (const o of obstacles) {
    if (o.hit || o.lane !== P.lane || Math.abs(o.y - PLAYER_Y) > HIT_RANGE) continue;
    const dodged = (o.kind === 'jump' && P.jumpT > 0) || (o.kind === 'duck' && P.ducking);
    if (dodged) continue;
    o.hit = true;
    if (P.fx.shield > 0) {
      P.fx.shield = 0;
      spark(LANES_X[P.lane], PLAYER_Y - 30, 16, ITEMS.shield.col, 380);
      floatText(LANES_X[P.lane], PLAYER_Y - 90, 'Khiên đỡ!', '#ffe6a8', 20);
      continue;
    }
    gameOver();
    return true;
  }
  return false;
}

function collectCoins() {
  const magnet = P.fx.magnet > 0, value = P.fx.boots > 0 ? 2 : 1;
  for (const c of pickups) {
    if (c.got || c.lane !== P.lane) continue;
    const near = Math.abs(c.y - PLAYER_Y) <= HIT_RANGE || (magnet && c.y > PLAYER_Y - MAGNET_UP && c.y < PLAYER_Y + HIT_RANGE);
    if (!near) continue;
    c.got = true; G.coins += value;
    floatText(LANES_X[P.lane], PLAYER_Y - 60, '+' + value, '#ffe6a8', 16);
  }
}

function collectItems() {
  for (const it of items) {
    if (it.got || it.lane !== P.lane || Math.abs(it.y - PLAYER_Y) > HIT_RANGE) continue;
    const def = ITEMS[it.kind];
    it.got = true; P.fx[it.kind] = def.dur;
    spark(LANES_X[P.lane], PLAYER_Y - 30, 14, def.col, 300);
    floatText(LANES_X[P.lane], PLAYER_Y - 90, def.name, def.col, 20);
  }
}

function gameOver() {
  G.mode = 'over'; G.shake = 8;
  G.score = Math.round(metres()) + G.coins * 5;
  S.runs = (S.runs || 0) + 1;
  S.bestDist = Math.max(S.bestDist || 0, Math.floor(metres()));
  S.bestCoins = Math.max(S.bestCoins || 0, G.coins);
  G.newBest = G.score > S.best;
  if (G.newBest) S.best = G.score;
  save();
  showResult();
}
