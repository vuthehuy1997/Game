// Luật chơi thuần (không đụng canvas): xây dựng, đợt quân, va chạm, sát thương, kết thúc.
import { prune } from '../../../platform/core/util.js';
import { ERAS, BUILD, INCOME, WAVE_BONUS, GATE_MAX, STAR_THRESHOLDS } from './data.js';
import { G, slots, enemies, shots, fires, GATE_X, SPAWN_X, LANES, LANE_HIT } from './state.js';
import { saveProgress } from './save.js';

const HIDE_X = 640;
const GATE_STOP = GATE_X + 40;

export function startEra(i) {
  Object.assign(G, { era: i, rule: ERAS[i].rule, mode: 'intro', wave: 0, waveT: 0, gateHp: GATE_MAX, gold: ERAS[i].gold, result: null, stars: 0 });
  G.queue.length = 0; enemies.length = 0; shots.length = 0; fires.length = 0;
  for (const s of slots) s.b = null;
}

export function beginPrep() { G.mode = 'prep'; }

export function placeBuild(i, kind) {
  const s = slots[i], d = BUILD[kind];
  if (G.mode !== 'prep' || !s || s.b || !d || G.gold < d.cost) return false;
  G.gold -= d.cost;
  s.b = { kind, hp: d.hp, max: d.hp, cd: 0, flash: 0 };
  return true;
}

export function removeBuild(i) {
  const s = slots[i];
  if (G.mode !== 'prep' || !s || !s.b) return false;
  G.gold += BUILD[s.b.kind].sell;
  s.b = null;
  return true;
}

export function startWave() {
  const groups = ERAS[G.era].waves[G.wave];
  if (G.mode !== 'prep' || !groups) return false;
  let start = 0, k = 0;
  for (const g of groups) {
    for (let n = 0; n < g.n; n++) G.queue.push({ t: start + n * g.gap, kind: g.kind, lane: k++ % 3 });
    start += 4;
  }
  G.queue.sort((a, b) => a.t - b.t);
  G.waveT = 0; G.mode = 'battle';
  return true;
}

export function spawnEnemy(kind, lane) {
  const spec = ERAS[G.era].troops[kind];
  enemies.push({ kind, name: spec.name, spec, lane, x: SPAWN_X, hp: spec.hp, max: spec.hp, pitHit: false, shellT: spec.shellEvery || 0, walk: 0, hidden: false });
}

export function tick(dt) {
  G.t += dt;
  if (G.mode === 'battle') step(dt);
  for (const s of shots) s.t -= dt;
  for (const f of fires) f.t -= dt;
  prune(shots, s => s.t > 0);
  prune(fires, f => f.t > 0);
}

function step(dt) {
  G.waveT += dt;
  while (G.queue.length && G.queue[0].t <= G.waveT) {
    const q = G.queue.shift();
    spawnEnemy(q.kind, q.lane);
  }
  G.gold += INCOME * dt;
  for (const s of slots) if (s.b) buildingAct(s, dt);
  for (const e of enemies) if (e.hp > 0) enemyAct(e, dt);
  prune(enemies, e => e.hp > 0 && e.x > -60);

  if (G.gateHp <= 0) return finish('lost');
  if (G.queue.length === 0 && enemies.length === 0) endWave();
}

function buildingAct(s, dt) {
  const b = s.b, d = BUILD[b.kind];
  b.flash = Math.max(0, b.flash - dt);
  if (b.kind === 'tower') {
    b.cd -= dt;
    if (b.cd > 0) return;
    const e = nearestVisible(s, d.range);
    if (!e) return;
    b.cd = d.cd;
    const mul = G.rule === 'nho' ? 1.5 : 1;
    shots.push({ x1: s.x, y1: s.y - 50, x2: e.x, y2: LANES[e.lane], t: .25 });
    hurtEnemy(e, d.dmg * mul * (e.spec.shield ? .5 : 1));
  } else if (b.kind === 'fire') {
    b.cd -= dt;
    if (b.cd > 0) return;
    if (!enemies.some(e => !e.hidden && inRadius(s, e, d.radius))) return;
    b.cd = d.cd;
    fires.push({ x: s.x, y: s.y, r: d.radius, t: .6 });
    for (const e of enemies) if (inRadius(s, e, d.radius)) hurtEnemy(e, d.dmg);
  }
}

function enemyAct(e, dt) {
  const d = e.spec;
  e.walk += dt * 10;
  e.hidden = !!d.trench && G.rule === 'hao' && e.x > HIDE_X;

  for (const s of slots) {
    if (s.lane === e.lane && s.b && s.b.kind === 'pit' && !e.pitHit && Math.abs(s.x - e.x) <= 30) {
      e.pitHit = true;
      s.b.flash = .3;
      hurtEnemy(e, BUILD.pit.dmg * (G.rule === 'ky' && e.spec.cav ? 2 : 1));
    }
  }
  if (e.hp <= 0) return;

  const blk = blockerOf(e);
  const engaged = !!blk && e.x - blk.x <= LANE_HIT;
  if (engaged) hurtBuilding(blk, d.dmg * dt);
  else if (d.range) {
    const t = rangedTarget(e, d.range);
    if (t) hurtBuilding(t, d.dmg * dt);
  }
  if (d.shellEvery) {
    e.shellT -= dt;
    if (e.shellT <= 0) {
      e.shellT = d.shellEvery;
      const towers = slots.filter(s => s.b && s.b.kind === 'tower');
      if (towers.length) hurtBuilding(towers[(Math.random() * towers.length) | 0], d.shellDmg);
    }
  }
  if (!engaged) {
    const floor = blk ? blk.x + LANE_HIT : GATE_STOP;
    e.x = Math.max(e.x - d.spd * dt, floor);
  }
  if (!blk && e.x <= GATE_STOP && d.dmg) G.gateHp -= d.dmg * dt;
}

function blockerOf(e) {
  let best = null;
  for (const s of slots) {
    if (s.lane !== e.lane || !s.b || !BUILD[s.b.kind].block || s.x > e.x) continue;
    if (!best || s.x > best.x) best = s;
  }
  return best;
}

function rangedTarget(e, range) {
  let best = null;
  for (const s of slots) {
    if (s.lane !== e.lane || !s.b || !BUILD[s.b.kind].block || s.x >= e.x || e.x - s.x > range) continue;
    if (!best || s.x > best.x) best = s;
  }
  return best;
}

function nearestVisible(s, range) {
  let best = null;
  for (const e of enemies) {
    if (e.hidden) continue;
    const dx = e.x - s.x, dy = LANES[e.lane] - s.y;
    if (dx * dx + dy * dy > range * range) continue;
    if (!best || e.x < best.x) best = e;
  }
  return best;
}

function inRadius(s, e, r) {
  const dx = e.x - s.x, dy = LANES[e.lane] - s.y;
  return dx * dx + dy * dy <= r * r;
}

function hurtEnemy(e, dmg) {
  if (e.hp <= 0) return;
  e.hp -= dmg;
  if (e.hp <= 0) G.gold += e.spec.gold;
}

function hurtBuilding(s, dmg) {
  if (!s.b) return;
  s.b.hp -= dmg;
  s.b.flash = .15;
  if (s.b.hp <= 0) s.b = null;
}

function endWave() {
  G.wave++;
  G.gold += WAVE_BONUS;
  if (G.wave >= ERAS[G.era].waves.length) return finish('won');
  G.mode = 'prep';
}

function finish(result) {
  G.mode = 'over';
  G.result = result;
  G.queue.length = 0;
  enemies.length = 0;
  if (result === 'won') {
    G.stars = G.gateHp >= STAR_THRESHOLDS[0] ? 3 : G.gateHp >= STAR_THRESHOLDS[1] ? 2 : 1;
    saveProgress(G.era, G.stars);
  } else G.stars = 0;
}
