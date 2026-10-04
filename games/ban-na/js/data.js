import { readJSON, writeJSON } from '../../../platform/core/storage.js';
import { STORE_KEY } from '../meta.js';

export const LEVELS = [
  { blocks: [{ cx: 600, cy: 440, w: 36, h: 100, hp: 30 }], targets: [{ cx: 600, cy: 370, r: 18, hp: 25 }], shots: 3 },
  { blocks: [{ cx: 650, cy: 460, w: 40, h: 56, hp: 28 }, { cx: 650, cy: 400, w: 40, h: 56, hp: 28 }], targets: [{ cx: 650, cy: 345, r: 18, hp: 25 }], shots: 4 },
  { blocks: [{ cx: 560, cy: 440, w: 34, h: 110, hp: 32 }, { cx: 740, cy: 440, w: 34, h: 110, hp: 32 }], targets: [{ cx: 560, cy: 360, r: 16, hp: 22 }, { cx: 740, cy: 360, r: 16, hp: 22 }], shots: 5 },
  { blocks: [{ cx: 700, cy: 430, w: 50, h: 140, hp: 50 }], targets: [{ cx: 700, cy: 340, r: 16, hp: 20 }, { cx: 820, cy: 460, r: 16, hp: 20 }], shots: 5 },
];

export const S = { maxLevel: 0, ...(readJSON(STORE_KEY) || {}) };
export function save() { writeJSON(STORE_KEY, S); }
export const unlocked = i => i <= S.maxLevel;
