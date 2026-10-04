import { readJSON, writeJSON } from '../../../platform/core/storage.js';
import { STORE_KEY } from '../meta.js';
export const S = { wealth: 0, perClick: 1, owned: {}, lastSeen: Date.now(), ...(readJSON(STORE_KEY) || {}) };
export function save() { S.lastSeen = Date.now(); writeJSON(STORE_KEY, S); }
