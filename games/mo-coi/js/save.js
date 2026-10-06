import { readJSON, writeJSON } from '../../../platform/core/storage.js';
import { STORE_KEY } from '../meta.js';
import { MAPS, HOME, ENEMY_BASE } from './state.js';

// Quân ban đầu của một ải: nhà ta 5 quân, còn lại là giặc theo địa hình, mạnh dần qua từng ải
export function freshStage(idx) {
  const m = MAPS[idx], n = m.cols * m.rows;
  return {
    owner: Array.from({ length: n }, (_, i) => (i === HOME ? 1 : 0)),
    troops: Array.from({ length: n }, (_, i) => (i === HOME ? 5 : ENEMY_BASE[m.terrain[i]] + idx * 4)),
  };
}

// Bản lưu cũ (trước khi có ải) chỉ có owner/troops của ải 1: vẫn đọc được và giữ nguyên vùng đã chiếm
function load() {
  const saved = readJSON(STORE_KEY) || {};
  const stage = Number.isInteger(saved.stage) && saved.stage >= 0 && saved.stage < MAPS.length ? saved.stage : 0;
  const n = MAPS[stage].cols * MAPS[stage].rows;
  const ok = Array.isArray(saved.owner) && saved.owner.length === n && Array.isArray(saved.troops) && saved.troops.length === n;
  const base = freshStage(stage);
  return {
    stage, maxStage: Number.isInteger(saved.maxStage) ? saved.maxStage : 0,
    introStage: Number.isInteger(saved.introStage) ? saved.introStage : -1,
    owner: ok ? saved.owner : base.owner, troops: ok ? saved.troops : base.troops,
    lastSeen: saved.lastSeen || Date.now(),
  };
}

export const S = load();
export function save() { S.lastSeen = Date.now(); writeJSON(STORE_KEY, S); }
export function setStage(idx) { S.stage = idx; Object.assign(S, freshStage(idx)); }
export const curMap = () => MAPS[S.stage];
