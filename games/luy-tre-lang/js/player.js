// Vật lý người chơi, đào/đặt block, chế tạo, cận chiến.
import { held, pressed } from '../../../platform/core/input.js';
import { tone } from '../../../platform/core/audio.js';
import { clamp } from '../../../platform/core/util.js';
import {
  TS, COLS, ROWS, TILE, HARDNESS, DROP, PLACE_TILE, ITEMS, RECIPES, QUESTS, TOOL_POWER, WEAPON_DMG, HAND_POWER, HAND_DMG,
  PLAYER_W, PLAYER_H, GRAV, MOVE_SPEED, JUMP_V, REACH, BENCH_RADIUS,
} from './data.js';
import { G, invAdd, invRemove, invCount } from './state.js';
import { getTile, setTile, isSolid, findHouse, checkHouse } from './world.js';

function aabb(x, y) { return { l: x - PLAYER_W / 2, r: x + PLAYER_W / 2, t: y - PLAYER_H, b: y }; }
function collideRect(l, r, t, b) {
  const c0 = Math.floor(l / TS), c1 = Math.floor((r - .01) / TS), r0 = Math.floor(t / TS), r1 = Math.floor((b - .01) / TS);
  for (let c = c0; c <= c1; c++) for (let rr = r0; rr <= r1; rr++) if (isSolid(getTile(G.tiles, c, rr))) return true;
  return false;
}
function moveAxis(dx, axis) {
  const steps = Math.ceil(Math.abs(dx)); if (!steps) return;
  const stepv = dx / steps;
  for (let i = 0; i < steps; i++) {
    const nx = axis === 'x' ? G.px + stepv : G.px, ny = axis === 'y' ? G.py + stepv : G.py;
    const { l, r, t, b } = aabb(nx, ny);
    if (collideRect(l, r, t, b)) { if (axis === 'y') { if (stepv > 0) G.grounded = true; G.vy = 0; } break; }
    if (axis === 'x') G.px = nx; else G.py = ny;
  }
}

export function physicsStep(dt) {
  const dir = (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0);
  G.vx = dir * MOVE_SPEED; if (dir) G.face = dir;
  if (pressed.has('jump') && G.grounded) { G.vy = -JUMP_V; tone(330, .12, 'triangle', .05, 260); }
  G.vy += GRAV * dt;
  G.grounded = false;
  moveAxis(G.vx * dt, 'x');
  moveAxis(G.vy * dt, 'y');
  G.px = clamp(G.px, TS + PLAYER_W / 2, (COLS - 1) * TS - PLAYER_W / 2);
  if (G.atkCd > 0) G.atkCd -= dt;
  if (G.hurt > 0) G.hurt -= dt;
}

export function heldItem() { const s = G.inv[G.sel]; return s ? s.item : null; }
export function digPower() { return TOOL_POWER[heldItem()] ?? HAND_POWER; }
export function weaponDmg() { return WEAPON_DMG[heldItem()] ?? HAND_DMG; }

export function inReach(c, r) {
  const dx = (c + .5) * TS - G.px, dy = (r + .5) * TS - (G.py - PLAYER_H / 2);
  return Math.hypot(dx, dy) <= REACH;
}

G.dig = {}; // tiến độ đào tạm thời, không lưu: key "c,r" -> số lần đập còn lại
// Đập một nhát vào tile (c,r). Trả về true nếu tile vỡ hẳn trong lần này.
export function hitTile(c, r) {
  const code = getTile(G.tiles, c, r);
  if (code === TILE.AIR || code === TILE.BEDROCK) return false;
  if (!inReach(c, r)) return false;
  const key = c + ',' + r;
  if (G.dig[key] == null) G.dig[key] = HARDNESS[code];
  G.dig[key] -= digPower();
  if (G.dig[key] > 0) return false;
  delete G.dig[key];
  const drop = DROP[code];
  setTile(G.tiles, c, r, TILE.AIR);
  if (drop) {
    invAdd(G.inv, drop, 1);
    for (const q of G.quests) if (q.type === 'mine' && q.item === drop && !q.claimed) q.have = Math.min(q.need, q.have + 1);
  }
  tone(180, .08, 'square', .05);
  maybeSpawnNpc();
  return true;
}

export function placeTile(c, r, item) {
  if (!PLACE_TILE[item]) return false;
  if (!inReach(c, r)) return false;
  if (getTile(G.tiles, c, r) !== TILE.AIR) return false;
  if (invCount(G.inv, item) <= 0) return false;
  const { l, r: rr, t, b } = aabb(G.px, G.py);
  const tl = c * TS, tt = r * TS;
  if (tl < rr && tl + TS > l && tt < b && tt + TS > t) return false; // không đặt đè lên người
  invRemove(G.inv, item, 1);
  setTile(G.tiles, c, r, PLACE_TILE[item]);
  tone(260, .06, 'triangle', .05);
  maybeSpawnNpc();
  return true;
}

export function nearBench() {
  const pc = Math.floor(G.px / TS), pr = Math.floor(G.py / TS), rad = Math.ceil(BENCH_RADIUS / TS);
  for (let c = pc - rad; c <= pc + rad; c++) for (let r = pr - rad; r <= pr + rad; r++)
    if (getTile(G.tiles, c, r) === TILE.BENCH) return true;
  return false;
}

export function craft(id) {
  const rec = RECIPES.find(x => x.id === id); if (!rec) return false;
  if (rec.bench && !nearBench()) return false;
  for (const [item, qty] of Object.entries(rec.need)) if (invCount(G.inv, item) < qty) return false;
  for (const [item, qty] of Object.entries(rec.need)) invRemove(G.inv, item, qty);
  invAdd(G.inv, rec.out, rec.qty);
  tone(520, .1, 'square', .05, 120);
  return true;
}

export function maybeSpawnNpc() {
  if (G.npc.active) return false;
  const h = findHouse(G.tiles);
  if (!h) return false;
  G.npc = { active: true, x: (h.fx + .5) * TS, y: (h.fy + 1) * TS, fx: h.fx, fy: h.fy };
  return true;
}

export function nearNpc() {
  if (!G.npc.active) return false;
  return Math.hypot(G.npc.x - G.px, G.npc.y - G.py) <= 2.5 * TS;
}

export function claimQuest(id) {
  const q = G.quests.find(x => x.id === id);
  if (!q || q.claimed || q.have < q.need) return false;
  q.claimed = true;
  const reward = (QUESTS.find(x => x.id === id) || {}).reward;
  if (reward) { if (reward.gold) G.gold += reward.gold; if (reward.item) invAdd(G.inv, reward.item, 1); }
  tone(660, .15, 'square', .06, 220);
  return true;
}

export function buy(item, price) {
  if (G.gold < price) return false;
  G.gold -= price; invAdd(G.inv, item, 1); return true;
}
export function sell(item, unitPrice, qty = 1) {
  if (invCount(G.inv, item) < qty) return false;
  invRemove(G.inv, item, qty); G.gold += unitPrice * qty; return true;
}
