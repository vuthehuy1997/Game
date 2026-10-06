// Luật chơi: mở đất, xây công trình, kinh tế, sự kiện, giặc tấn công và qua chương.
import { COLS, N, SLOTS, CAPITAL, MAP, TERRAIN, BUILDINGS, CHAPTERS, EVENTS, KINDS, EXPAND_FOOD, MIN_POP_EXPAND } from './data.js';
import { G, resetRun, freshEvents } from './state.js';
import { saveProgress } from './save.js';

const LOSE_AFTER = 25, RAID_POWER = { base: 10, perChapter: 12 }, POP_START_CAP = 4, POP_PER_HOUSE = 4;

export const col = i => i % COLS;
export const row = i => Math.floor(i / COLS);
export const terrainOf = i => MAP[row(i)][col(i)];
export const isWater = i => terrainOf(i) === 'w';
export const slotIdx = (tile, s) => tile * SLOTS + s;
export const buildingAt = (tile, s) => G.slots[slotIdx(tile, s)];
export const ownedCount = () => G.owned.reduce((a, b) => a + b, 0);
export const unlockedKinds = (ch = G.chapter) => KINDS.filter(k => BUILDINGS[k].chapter <= ch);
export const goalFor = (ch = G.chapter) => CHAPTERS[ch].goal;
const maxCol = () => CHAPTERS[G.chapter].maxCol;

export function neighbors(i) {
  const c = col(i), r = row(i), out = [];
  if (c > 0) out.push(i - 1);
  if (c < COLS - 1) out.push(i + 1);
  if (r > 0) out.push(i - COLS);
  if (r < MAP.length - 1) out.push(i + COLS);
  return out;
}

export function hasBuilding(kind) {
  for (let i = 0; i < G.slots.length; i++) if (G.slots[i] === kind) return true;
  return false;
}

export function landCount() {
  let n = 0;
  for (let i = 0; i < N; i++) if (!isWater(i)) n++;
  return n;
}

export function reachableLand() {
  const seen = new Set([CAPITAL]), queue = [CAPITAL];
  while (queue.length) {
    const i = queue.pop();
    for (const n of neighbors(i)) if (!isWater(n) && !seen.has(n)) { seen.add(n); queue.push(n); }
  }
  return seen.size;
}

export function tileVisibility(i) {
  if (G.owned[i]) return 'owned';
  if (isWater(i)) return 'water';
  if (col(i) > maxCol()) return 'locked';
  if (neighbors(i).some(n => G.owned[n])) return 'frontier';
  return 'fog';
}

export function defenseOf(i) {
  let d = TERRAIN[terrainOf(i)].def;
  for (let s = 0; s < SLOTS; s++) d += BUILDINGS[buildingAt(i, s)]?.def || 0;
  return d;
}

export function rates() {
  const ev = G.ev.active;
  let food = .5, gold = .5 + .2 * ownedCount(), prestige = 0, houses = 0;
  for (let t = 0; t < N; t++) {
    if (!G.owned[t]) continue;
    for (let s = 0; s < SLOTS; s++) {
      switch (buildingAt(t, s)) {
        case 'house': houses++; break;
        case 'farm': {
          let m = TERRAIN[terrainOf(t)].food;
          if (ev === 'mua') m *= 1.6;
          if (ev === 'lu' && neighbors(t).some(isWater)) m *= .4;
          food += 1.5 * m;
          break;
        }
        case 'market': gold += 1.5; break;
        case 'workshop': gold += 2; break;
        case 'temple': prestige += .5; break;
        case 'citadel': prestige += .2; break;
      }
    }
  }
  const popCap = POP_START_CAP + POP_PER_HOUSE * houses;
  return { food, foodNet: food - G.res.pop * .05, gold, prestige, popCap };
}

export function expandIssue(i) {
  if (G.owned[i]) return 'owned';
  if (isWater(i)) return 'water';
  if (col(i) > maxCol()) return 'locked';
  if (!neighbors(i).some(n => G.owned[n])) return 'not_frontier';
  const t = TERRAIN[terrainOf(i)];
  if (terrainOf(i) === 'm' && !hasBuilding('outpost')) return 'need_outpost';
  if (G.res.pop < MIN_POP_EXPAND) return 'need_pop';
  if (G.res.gold < t.expand) return 'gold';
  if (G.res.food < EXPAND_FOOD) return 'food';
  return null;
}

export function expand(i) {
  if (G.mode !== 'play' || expandIssue(i)) return false;
  G.res.gold -= TERRAIN[terrainOf(i)].expand;
  G.res.food -= EXPAND_FOOD;
  G.owned[i] = 1;
  notify(`Khai phá ${TERRAIN[terrainOf(i)].name.toLowerCase()} thành công`, '#7bd389');
  saveProgress();
  return true;
}

export function placeBuild(i, s, kind) {
  if (G.mode !== 'play' || !G.owned[i] || !unlockedKinds().includes(kind) || buildingAt(i, s)) return false;
  const c = BUILDINGS[kind].cost;
  if (G.res.gold < c.gold || G.res.food < c.food) return false;
  G.res.gold -= c.gold;
  G.res.food -= c.food;
  G.slots[slotIdx(i, s)] = kind;
  saveProgress();
  return true;
}

export function removeBuild(i, s) {
  const kind = buildingAt(i, s);
  if (G.mode !== 'play' || !kind) return false;
  G.res.gold += Math.floor(BUILDINGS[kind].cost.gold / 2);
  G.res.food += Math.floor(BUILDINGS[kind].cost.food / 2);
  G.slots[slotIdx(i, s)] = null;
  saveProgress();
  return true;
}

export function raid(i) {
  const power = RAID_POWER.base + G.chapter * RAID_POWER.perChapter;
  if (defenseOf(i) >= power) {
    G.res.prestige += 2;
    notify(`Đánh lui giặc ở ${TERRAIN[terrainOf(i)].name.toLowerCase()}`, '#7bd389');
    return 'repelled';
  }
  let lost = 0;
  for (let s = 0; s < SLOTS; s++) if (buildingAt(i, s)) { G.slots[slotIdx(i, s)] = null; lost++; }
  if (lost) { notify(`Giặc phá ${lost} công trình`, '#e0604e'); return 'breached'; }
  if (i !== CAPITAL) {
    G.owned[i] = 0;
    notify('Giặc chiếm một vùng đất trống', '#e0604e');
    return 'lost';
  }
  notify('Giặc tràn vào kinh thành nhưng không phá được gì', '#e0604e');
  return 'held';
}

function raidRandom() {
  const targets = [];
  for (let i = 0; i < N; i++) {
    if (G.owned[i] && neighbors(i).some(n => !G.owned[n] && !isWater(n) && col(n) <= maxCol())) targets.push(i);
  }
  if (!targets.length) return null;
  return raid(targets[Math.floor(Math.random() * targets.length)]);
}

export function triggerEvent(kind) {
  if (kind === 'giac') return raidRandom();
  G.ev.active = kind;
  G.ev.timer = EVENTS[kind].dur;
  notify(EVENTS[kind].text, kind === 'lu' ? '#e0604e' : '#7bd389');
  return kind;
}

function updateEvents(dt) {
  const E = G.ev;
  if (E.active) { E.timer -= dt; if (E.timer <= 0) E.active = null; }
  if (E.pending) {
    E.warn -= dt;
    if (E.warn <= 0) { const k = E.pending; E.pending = null; triggerEvent(k); }
    return;
  }
  E.nextIn -= dt;
  if (E.nextIn <= 0) {
    const kinds = ['lu', 'mua', 'giac'];
    E.pending = kinds[Math.floor(Math.random() * kinds.length)];
    E.warn = 6;
    E.nextIn = 45 + Math.random() * 30;
    notify(EVENTS[E.pending].warn, '#ffd35a');
  }
}

export function checkGoal() {
  const g = goalFor();
  return ownedCount() >= g.tiles && G.res.prestige >= g.prestige;
}

export function tick(dt) {
  if (G.mode !== 'play') return;
  G.t += dt;
  const r = rates();
  G.res.food += r.foodNet * dt;
  if (G.res.food < 0) { G.res.food = 0; G.famineT += dt; } else G.famineT = Math.max(0, G.famineT - dt * .5);
  G.res.gold += r.gold * dt;
  G.res.prestige += r.prestige * dt;
  if (G.res.food > 0) {
    G.res.pop = G.res.pop < r.popCap ? Math.min(r.popCap, G.res.pop + .15 * dt) : Math.max(r.popCap, G.res.pop - .2 * dt);
  } else {
    G.res.pop = Math.max(0, G.res.pop - .02 * dt);
  }
  if (G.note.t > 0) G.note.t -= dt;
  updateEvents(dt);
  if (G.famineT >= LOSE_AFTER) { lose(); return; }
  if (checkGoal()) {
    G.mode = 'done';
    notify(`Hoàn thành chương ${G.chapter + 1}: ${CHAPTERS[G.chapter].name}`, '#ffd35a');
    saveProgress();
  }
}

function lose() {
  G.mode = 'lost';
  notify('Mất mùa, đói kém: dân làng tan đi nhiều', '#e0604e');
  saveProgress();
}

export function notify(text, color = '#ffe6a8') {
  G.log.unshift(text);
  G.log.length = Math.min(G.log.length, 5);
  G.note = { text, color, t: 5 };
}

export function startRun() {
  resetRun();
  saveProgress();
}

export function beginChapter() {
  G.mode = 'play';
  G.famineT = 0;
  G.snap = { owned: G.owned.slice(), slots: G.slots.slice(), res: { ...G.res } };
  notify(`Chương ${G.chapter + 1}: ${CHAPTERS[G.chapter].name}`, '#ffe6a8');
  saveProgress();
}

export function restartChapter() {
  if (!G.snap) return false;
  G.owned = G.snap.owned.slice();
  G.slots = G.snap.slots.slice();
  G.res = { ...G.snap.res };
  G.ev = freshEvents();
  G.famineT = 0;
  G.mode = 'play';
  notify('Thử lại chương từ đầu', '#ffe6a8');
  saveProgress();
  return true;
}

export function nextChapter() {
  G.cleared = Math.max(G.cleared, G.chapter + 1);
  if (G.chapter + 1 >= CHAPTERS.length) {
    G.mode = 'final';
    saveProgress();
    return false;
  }
  G.chapter++;
  G.mode = 'intro';
  G.famineT = 0;
  G.ev = freshEvents();
  G.sel = { kind: null, tile: -1 };
  saveProgress();
  return true;
}
