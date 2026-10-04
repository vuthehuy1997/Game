import { readJSON, writeJSON } from '../../../platform/core/storage.js';
import { STORE_KEY } from '../meta.js';

export const LEVELS = [
  { fillRows: 3, colors: 3 }, { fillRows: 4, colors: 3 }, { fillRows: 4, colors: 4 }, { fillRows: 5, colors: 4 },
];
export const S = { maxLevel: 0, ...(readJSON(STORE_KEY) || {}) };
export function save() { writeJSON(STORE_KEY, S); }
export const unlocked = i => i <= S.maxLevel;
