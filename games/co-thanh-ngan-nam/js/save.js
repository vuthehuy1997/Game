// Tiến độ: số thời kỳ đã giữ được (cleared) và số sao cao nhất mỗi thời kỳ.
import { readJSON, writeJSON } from '../../../platform/core/storage.js';
import { STORE_KEY } from '../meta.js';
import { ERAS } from './data.js';

export function loadSave() {
  const s = readJSON(STORE_KEY) || {};
  const stars = Array.from({ length: ERAS.length }, (_, i) => Math.max(0, Math.min(3, (s.stars && s.stars[i]) | 0)));
  return { cleared: Math.max(0, Math.min(ERAS.length, s.cleared | 0)), stars };
}

export function saveProgress(era, stars) {
  const s = loadSave();
  s.cleared = Math.max(s.cleared, era + 1);
  s.stars[era] = Math.max(s.stars[era], stars);
  writeJSON(STORE_KEY, s);
  return s;
}

export function isUnlocked(era) {
  return era <= loadSave().cleared && era < ERAS.length;
}
