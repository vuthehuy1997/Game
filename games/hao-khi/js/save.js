// Hệ thống lưu (3 ô + cài đặt) của Hào Khí Việt Nam.
// Cài đặt chung (âm lượng, rung, nút cảm ứng) nằm ở nền tảng; CFG.music, CFG.sfx, CFG.shake, CFG.touch trỏ về đó.
import { DEFAULT_SETTINGS, saveSettings, adoptSettings } from '../../../platform/core/settings.js';
import { readJSON, writeJSON, encodeSave, decodeSave } from '../../../platform/core/storage.js';

/* STORE = { slots: [save|null ×3], cur: ô đang chơi, cfg: cài đặt riêng của game }
   S     = bản lưu của ô đang chơi (tiến độ, tiền, luyện công, sao) */
export const STORE_KEY = 'haokhi-dong-a-v3', SAVE_TAG = 'HKDA1';
export const newSave = () => ({
  stage: 0, maxStage: 0, coins: 0, up: { atk: 0, hp: 0, mp: 0 }, stars: [], play: 0, updated: 0,
  lv: 1, xp: 0, sp: 1, skills: { chuong: 1 },   // cấp độ, kinh nghiệm, điểm kỹ năng chưa dùng, cấp từng kỹ năng
  ch: [], ms: {}, rec: {}, path: null, bag: {},                              // ấn thử thách đã đạt theo ải, phần thưởng mốc sao đã nhận
});
export const DEFAULT_CFG = { ...DEFAULT_SETTINGS, diff: 1, dmgNum: true, textSpeed: 2 };
export const DIFF = [
  { name: 'Dễ', desc: 'Giặc yếu hơn, đánh nhẹ tay. Mỗi ải tối đa 2★', hp: .8, dmg: .6 },
  { name: 'Thường', desc: 'Như sử sách ghi chép', hp: 1, dmg: 1 },
  { name: 'Khó', desc: 'Giặc lì đòn và hung hãn. Thắng thì được ấn Hổ tướng', hp: 1.25, dmg: 1.4 },
];
export const TEXT_SPEED = [{ name: 'Chậm', cps: 28 }, { name: 'Vừa', cps: 45 }, { name: 'Nhanh', cps: 80 }, { name: 'Tức thì', cps: 1e4 }];

export function loadStore() {
  const store = { slots: [null, null, null], cur: 0, cfg: { ...DEFAULT_CFG } }, s = readJSON(STORE_KEY);
  if (s && Array.isArray(s.slots)) Object.assign(store, s, { cfg: { ...DEFAULT_CFG, ...(s.cfg || {}) } });
  else {
    const old = readJSON('haokhi-dong-a-v2'); // chuyển bản lưu đời trước vào ô 1
    if (old && old.up) store.slots[0] = Object.assign(newSave(), old, { updated: Date.now() });
  }
  adoptSettings(store.cfg);
  return store;
}
export const STORE = loadStore();
export const CFG = STORE.cfg;
export let S = Object.assign(newSave(), STORE.slots[STORE.cur] || {});
export const sk = id => (S.skills && S.skills[id]) || 0;   // cấp hiện tại của một kỹ năng

export function persist() { saveSettings(); return writeJSON(STORE_KEY, STORE); }
export function save() { S.updated = Date.now(); STORE.slots[STORE.cur] = S; return persist(); }
export function useSlot(i, fresh) {
  STORE.cur = i;
  S = (fresh || !STORE.slots[i]) ? newSave() : Object.assign(newSave(), STORE.slots[i]);
  if (!S.skills || !S.skills.chuong) S.skills = Object.assign({ chuong: 1 }, S.skills);
  if (!Array.isArray(S.ch)) S.ch = [];
  if (!S.ms) S.ms = {};
  if (!S.rec) S.rec = {};
  if (!S.bag) S.bag = {};
  if (fresh) save(); else persist();
}
// Mã lưu để chuyển sang máy khác
export function exportCode(data) { return encodeSave(SAVE_TAG, data); }
export function importCode(code) {
  const d = decodeSave(SAVE_TAG, code);
  if (!d || typeof d.stage !== 'number' || !d.up) return null;
  return Object.assign(newSave(), d);
}
