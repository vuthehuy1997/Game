// Lưu tiến độ một ván: vị trí chương, đất đã mở, công trình, tài nguyên và bản chụp đầu chương để thử lại.
import { readJSON, writeJSON } from '../../../platform/core/storage.js';
import { STORE_KEY } from '../meta.js';
import { G, freshEvents } from './state.js';
import { N, SLOTS, CHAPTERS } from './data.js';

const VERSION = 1;

export function saveProgress() {
  writeJSON(STORE_KEY, {
    v: VERSION, mode: G.mode, chapter: G.chapter, cleared: G.cleared, t: G.t, famineT: G.famineT,
    owned: G.owned, slots: G.slots, res: G.res, snap: G.snap,
  });
}

export function loadProgress() {
  const s = readJSON(STORE_KEY);
  if (!s || s.v !== VERSION) return false;
  const numbers = ['food', 'gold', 'pop', 'prestige'].every(k => typeof s.res?.[k] === 'number');
  const valid = Array.isArray(s.owned) && s.owned.length === N && Array.isArray(s.slots) && s.slots.length === N * SLOTS
    && Number.isInteger(s.chapter) && s.chapter >= 0 && s.chapter < CHAPTERS.length && numbers;
  if (!valid) return false;
  Object.assign(G, {
    mode: s.mode, chapter: s.chapter, cleared: s.cleared | 0, t: s.t || 0, famineT: s.famineT || 0,
    owned: s.owned, slots: s.slots, res: { ...s.res }, snap: s.snap || null, ev: freshEvents(), sel: { kind: null, tile: -1 },
  });
  return true;
}
