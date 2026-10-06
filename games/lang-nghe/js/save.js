import { readJSON, writeJSON } from '../../../platform/core/storage.js';
import { STORE_KEY } from '../meta.js';
import { UPGRADES } from './data.js';

const saved = readJSON(STORE_KEY) || {};
const spentOn = (u, n) => { let s = 0; for (let k = 0; k < n; k++) s += Math.round(u.baseCost * Math.pow(u.costMul, k)); return s; };

export const S = { wealth: 0, perClick: 1, owned: {}, achv: [], lastSeen: Date.now(), ...saved };
if (saved.total == null) S.total = S.wealth + UPGRADES.reduce((sum, u) => sum + spentOn(u, S.owned[u.id] || 0), 0);
export function save() { S.lastSeen = Date.now(); writeJSON(STORE_KEY, S); }
