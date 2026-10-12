// Trạng thái dùng chung: G (vòng đời màn chơi), P (người chơi), enemies/pickups (mảng, sửa tại chỗ),
// grid/gridW/gridH/exitPos (bản đồ màn hiện tại, gán lại mỗi khi nạp màn — chỉ module này được phép gán
// lại các biến export let, theo đúng quy tắc ES module).
import { CAMPAIGNS } from './data.js';
import { WEAPONS } from './data.js';
import { parseMap } from './map.js';
import { readJSON, writeJSON } from '../../../platform/core/storage.js';
import { refill } from '../../../platform/core/util.js';
import { STORE_KEY } from '../meta.js';

export const S = { progress: new Array(CAMPAIGNS.length).fill(0), weapons: ['rifle'], ...(readJSON(STORE_KEY) || {}) };
export function saveProgress() { writeJSON(STORE_KEY, S); }

export const G = { mode: 'menu', campaign: 0, level: 0, kills: 0, needKills: 0, t: 0, shake: 0, hitFlash: 0, toastTxt: '', toastT: 0 };
export const P = { x: 1, y: 1, angle: 0, hp: 100, maxHp: 100, weapon: 'rifle', ammo: 5, reloadT: 0, fireT: 0, lookDelta: 0, walk: 0, moving: 0, muzzle: 0 };
export const enemies = [], pickups = [];
export let grid = [['.']], gridW = 1, gridH = 1, exitPos = null;

export function curCampaign() { return CAMPAIGNS[G.campaign]; }

// Nạp màn ci/li: dựng lại lưới tường + địch + vật phẩm, đặt người chơi ở điểm xuất phát, mở vũ khí của
// chiến dịch này nếu chưa có (mở ngay khi bắt đầu chơi chiến dịch, không cần đợi thắng).
export function loadLevel(ci, li) {
  const camp = CAMPAIGNS[ci], lv = camp.levels[li];
  const parsed = parseMap(lv.map);
  grid = parsed.grid; gridW = parsed.w; gridH = parsed.h; exitPos = parsed.exit;
  if (!S.weapons.includes(camp.weapon)) { S.weapons.push(camp.weapon); saveProgress(); }
  P.x = parsed.start.x; P.y = parsed.start.y; P.angle = 0;
  P.weapon = S.weapons.includes(camp.weapon) ? camp.weapon : S.weapons[S.weapons.length - 1];
  P.hp = P.maxHp; P.ammo = WEAPONS[P.weapon].mag; P.reloadT = 0; P.fireT = 0; P.lookDelta = 0; P.moving = 0; P.muzzle = 0;
  refill(enemies, parsed.enemies.map((e, i) => ({
    id: i, x: e.x, y: e.y, hp: Math.round(26 + ci * 8 + li * 5), maxHp: Math.round(26 + ci * 8 + li * 5),
    angle: 0, state: 'patrol', fireT: 1, walk: 0, hurtT: 0, deadT: 0,
  })));
  refill(pickups, parsed.pickups.map((p, i) => ({ id: i, x: p.x, y: p.y, kind: p.kind, got: false })));
  G.campaign = ci; G.level = li; G.kills = 0; G.needKills = enemies.length; G.t = 0; G.shake = 0; G.hitFlash = 0;
  G.toastTxt = ''; G.toastT = 0; G.mode = 'play';
}
