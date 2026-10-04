import { readJSON, writeJSON } from '../../../platform/core/storage.js';
import { STORE_KEY } from '../meta.js';
import { N, HOME } from './state.js';

export const S = {
  owner: Array.from({ length: N }, (_, i) => i === HOME ? 1 : 0),
  troops: Array.from({ length: N }, (_, i) => i === HOME ? 5 : 8),
  lastSeen: Date.now(), ...(readJSON(STORE_KEY) || {}),
};
export function save() { S.lastSeen = Date.now(); writeJSON(STORE_KEY, S); }
