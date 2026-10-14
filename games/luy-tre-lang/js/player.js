// Vật lý người chơi, đào/đặt block, chế tạo, cận chiến.
import { held, pressed } from '../../../platform/core/input.js';
import { tone } from '../../../platform/core/audio.js';
import { clamp } from '../../../platform/core/util.js';
import {
  TS, COLS, ROWS, TILE, HARDNESS, DROP, PLACE_TILE, ITEMS, RECIPES, QUESTS, TOOL_POWER, WEAPON_DMG, HAND_POWER, HAND_DMG,
  PLAYER_W, PLAYER_H, GRAV, MOVE_SPEED, JUMP_V, REACH, BENCH_RADIUS, SEED_TO_CROP, CROP_GROW_DAYS, RIDE_SPEED_MULT,
  WATER_SPEED_MULT, WATER_JUMP_MULT, XP_MINE, XP_QUEST, XP_LEVEL_BASE, SKILL_WARRIOR, SKILL_MINER,
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

// Chân người chơi (vị trí G.py là cạnh dưới của hộp va chạm) có đang ở trong tile WATER không.
export function playerInWater() {
  const col = Math.floor(G.px / TS), row = Math.floor((G.py - 1) / TS);
  return getTile(G.tiles, col, row) === TILE.WATER;
}

export function physicsStep(dt) {
  const dir = (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0);
  const inWater = playerInWater();
  const speed = MOVE_SPEED * (G.riding ? RIDE_SPEED_MULT : 1) * (inWater ? WATER_SPEED_MULT : 1);
  G.vx = dir * speed; if (dir) G.face = dir;
  if (pressed.has('jump')) {
    if (G.riding) G.riding = false; // nhảy để xuống trâu, lần nhảy này không nhảy thật
    else if (G.grounded) { G.vy = -JUMP_V * (inWater ? WATER_JUMP_MULT : 1); tone(330, .12, 'triangle', .05, 260); }
  }
  G.vy += GRAV * dt;
  G.grounded = false;
  moveAxis(G.vx * dt, 'x');
  moveAxis(G.vy * dt, 'y');
  G.px = clamp(G.px, TS + PLAYER_W / 2, (COLS - 1) * TS - PLAYER_W / 2);
  if (G.atkCd > 0) G.atkCd -= dt;
  if (G.hurt > 0) G.hurt -= dt;
}

export function heldItem() { const s = G.inv[G.sel]; return s ? s.item : null; }
export function digPower() {
  const base = TOOL_POWER[heldItem()] ?? HAND_POWER;
  return G.skills.miner[0] ? base * SKILL_MINER.digSpeedMult : base;
}
export function weaponDmg() {
  const base = WEAPON_DMG[heldItem()] ?? HAND_DMG;
  return G.skills.warrior[0] ? base * SKILL_WARRIOR.dmgMult : base;
}

// Nhận XP, lên cấp tự động (ngưỡng level->level+1 = level*XP_LEVEL_BASE, XP dư giữ lại).
export function gainXp(amount) {
  if (amount <= 0) return;
  G.xp += amount;
  while (G.xp >= G.level * XP_LEVEL_BASE) {
    G.xp -= G.level * XP_LEVEL_BASE;
    G.level += 1;
    G.skillPoints += 1;
  }
}

// Mở 1 bậc kỹ năng (branch: 'warrior'|'miner', tier: 0,1,2 = bậc 1,2,3). Phải mở tuần tự, tốn 1 điểm.
export function unlockSkill(branch, tier) {
  const arr = G.skills[branch];
  if (!arr || arr[tier]) return false;
  if (tier > 0 && !arr[tier - 1]) return false;
  if (G.skillPoints <= 0) return false;
  arr[tier] = true;
  G.skillPoints -= 1;
  if (branch === 'warrior' && tier === 1) { G.maxHp += SKILL_WARRIOR.hpBonus; G.hp += SKILL_WARRIOR.hpBonus; }
  tone(440, .1, 'square', .05);
  return true;
}

export function inReach(c, r) {
  const dx = (c + .5) * TS - G.px, dy = (r + .5) * TS - (G.py - PLAYER_H / 2);
  return Math.hypot(dx, dy) <= REACH;
}

G.dig = {}; // tiến độ đào tạm thời, không lưu: key "c,r" -> số lần đập còn lại
// Đập một nhát vào tile (c,r). Trả về true nếu tile vỡ hẳn trong lần này.
export function hitTile(c, r) {
  const code = getTile(G.tiles, c, r);
  if (code === TILE.AIR || code === TILE.BEDROCK || code === TILE.WATER || code === TILE.REED) return false;
  if (!inReach(c, r)) return false;
  const key = c + ',' + r;
  if (G.dig[key] == null) G.dig[key] = HARDNESS[code];
  G.dig[key] -= digPower();
  if (G.dig[key] > 0) return false;
  delete G.dig[key];
  const drop = DROP[code];
  setTile(G.tiles, c, r, TILE.AIR);
  if (drop) {
    const doubled = G.skills.miner[1] && Math.random() < SKILL_MINER.doubleDropChance;
    invAdd(G.inv, drop, doubled ? 2 : 1);
    for (const q of G.quests) if (q.type === 'mine' && q.item === drop && !q.claimed) q.have = Math.min(q.need, q.have + 1);
    gainXp(XP_MINE[drop] || 0);
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

// Cày đất: ô (c,r) phải là DIRT, ô phía trên trống, đang cầm cuốc bất kỳ.
export function tillSoil(c, r) {
  if (!inReach(c, r)) return false;
  if (getTile(G.tiles, c, r) !== TILE.DIRT) return false;
  if (getTile(G.tiles, c, r - 1) !== TILE.AIR) return false;
  const item = heldItem();
  if (!item || !item.startsWith('cuoc')) return false;
  setTile(G.tiles, c, r, TILE.FARMLAND);
  tone(240, .06, 'triangle', .05);
  return true;
}

export function cropStage(crop) {
  return Math.max(0, Math.min(CROP_GROW_DAYS, G.day - crop.plantedDay));
}

export function plantCrop(c, r, seedItem) {
  if (!SEED_TO_CROP[seedItem]) return false;
  if (!inReach(c, r)) return false;
  if (getTile(G.tiles, c, r) !== TILE.FARMLAND) return false;
  if (G.crops.some(cr => cr.c === c && cr.r === r)) return false;
  if (invCount(G.inv, seedItem) <= 0) return false;
  invRemove(G.inv, seedItem, 1);
  G.crops.push({ c, r, kind: SEED_TO_CROP[seedItem], plantedDay: G.day });
  tone(300, .06, 'triangle', .05);
  return true;
}

export function harvestCrop(c, r) {
  if (!inReach(c, r)) return false;
  const idx = G.crops.findIndex(cr => cr.c === c && cr.r === r);
  if (idx < 0) return false;
  const crop = G.crops[idx];
  if (cropStage(crop) < CROP_GROW_DAYS) return false;
  const qty = Math.random() < .5 ? 2 : 3;
  invAdd(G.inv, crop.kind, qty);
  G.crops.splice(idx, 1);
  tone(500, .08, 'square', .05);
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
  gainXp(XP_QUEST);
  tone(660, .15, 'square', .06, 220);
  return true;
}

export function buy(item, price) {
  if (G.gold < price) return false;
  G.gold -= price; invAdd(G.inv, item, 1); return true;
}
export function sell(item, unitPrice, qty = 1) {
  if (invCount(G.inv, item) < qty) return false;
  invRemove(G.inv, item, qty);
  const mult = G.skills.miner[2] ? SKILL_MINER.sellBonusMult : 1;
  G.gold += Math.round(unitPrice * qty * mult);
  return true;
}
