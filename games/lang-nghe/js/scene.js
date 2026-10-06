import { rand, clamp } from '../../../platform/core/util.js';
import { drawChibi } from '../../../platform/art/chibi.js';
import { POSES } from '../../../platform/art/poses.js';
import { ell } from '../../../platform/art/draw.js';
import { UPGRADES } from './data.js';
import { S } from './save.js';
import { G } from './state.js';
import { SLOTS, GROUND, drawBackdrop, drawBuilding } from './buildings.js';

const MAX_WORKERS = 6, WALK_SPEED = 46;
const LOOKS = [
  { skin: '#f6d2ae', hair: '#1c1410', hat: 'nonla', shirt: '#2f6b57', trim: '#e9b949', pants: '#2a2630', belt: '#e9b949', scale: .6 },
  { skin: '#e8c49a', hair: '#1c1410', hat: 'khan', khan: '#b3261e', shirt: '#b3261e', trim: '#e9b949', pants: '#241f1a', belt: '#e9b949', scale: .6 },
  { skin: '#e2bd8c', hair: '#1c1410', hat: 'mu', mu: '#2a3a6b', shirt: '#2a3a6b', trim: '#e9b949', pants: '#2a2630', belt: '#e9b949', scale: .6 },
  { skin: '#f0cf9e', hair: '#1c1410', hat: 'nonla', shirt: '#7a5a34', trim: '#c9a449', pants: '#3a2a1a', belt: '#c9a449', scale: .6 },
];

export function workerCount() {
  const n = UPGRADES.filter(u => u.kind === 'auto').reduce((sum, u) => sum + (S.owned[u.id] || 0), 0);
  return Math.min(MAX_WORKERS, n);
}

function built() { return SLOTS.filter(s => !s.up || (G.appear[s.kind] || 0) > .5); }

function newWorker(i) {
  const w = { x: rand(60, 900), target: 0, state: 'walk', timer: 0, t: rand(0, 5), face: 1, look: LOOKS[i % LOOKS.length] };
  pickTarget(w);
  return w;
}
function pickTarget(w) {
  const doors = built();
  w.target = clamp(doors[(Math.random() * doors.length) | 0].x + rand(-24, 24), 30, 930);
  w.state = 'walk';
}
function stepWorker(w, dt) {
  w.t += dt;
  if (w.state === 'work') { w.timer -= dt; if (w.timer <= 0) pickTarget(w); return; }
  const dx = w.target - w.x;
  if (Math.abs(dx) < 2) { w.state = 'work'; w.timer = rand(1.2, 2.8); return; }
  w.face = Math.sign(dx);
  w.x += Math.sign(dx) * Math.min(Math.abs(dx), WALK_SPEED * dt);
}

export function updateScene(dt) {
  for (const s of SLOTS) {
    if (!s.up) { G.appear[s.kind] = 1; continue; }
    const want = (S.owned[s.up] || 0) > 0 ? 1 : 0, cur = G.appear[s.kind] || 0;
    G.appear[s.kind] = cur + clamp(want - cur, -dt * 1.5, dt * 1.5);
  }
  const n = workerCount();
  while (G.workers.length < n) G.workers.push(newWorker(G.workers.length));
  G.workers.length = n;
  for (const w of G.workers) stepWorker(w, dt);
}

export function drawScene(c, t) {
  drawBackdrop(c, 960, 540, GROUND);
  for (const s of SLOTS) {
    const a = s.up ? G.appear[s.kind] || 0 : 1;
    drawBuilding(c, s.kind, s.x, GROUND, 1, t, a);
  }
  for (const w of G.workers) {
    const moving = w.state === 'walk';
    const pose = moving
      ? POSES.run({ walk: w.t * 9 })
      : { armF: .9 + Math.sin(w.t * 7) * .7, armB: -.4, legF: .05, legB: -.05 };
    ell(c, w.x, GROUND + 4, 16, 4, 'rgba(0,0,0,.25)');
    drawChibi(c, w.x, GROUND + 4, w.look, { face: w.face, t, ...pose });
  }
}
