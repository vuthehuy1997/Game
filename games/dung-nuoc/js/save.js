import { readJSON, writeJSON } from '../../../platform/core/storage.js';
import { STORE_KEY } from '../meta.js';
export const S = { grid: {}, gold: 50, food: 20, pop: 0, lastSeen: Date.now(), ...(readJSON(STORE_KEY) || {}) };
export function save() { S.lastSeen = Date.now(); writeJSON(STORE_KEY, S); }
