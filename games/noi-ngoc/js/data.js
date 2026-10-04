import { readJSON, writeJSON } from '../../../platform/core/storage.js';
import { STORE_KEY } from '../meta.js';

export const LEVELS = [
  { target: 300, moves: 15 }, { target: 600, moves: 18 }, { target: 1000, moves: 20 },
  { target: 1500, moves: 22 }, { target: 2200, moves: 25 },
];
export const S = { maxLevel: 0, ...(readJSON(STORE_KEY) || {}) };
export function save() { writeJSON(STORE_KEY, S); }
export const unlocked = i => i <= S.maxLevel;
