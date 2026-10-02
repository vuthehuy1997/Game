// Tiến trình: thời kỳ cao nhất đã mở. Mỗi thời kỳ chơi độc lập, không cộng dồn chỉ số giữa các màn.
import { readJSON, writeJSON } from '../../../platform/core/storage.js';
import { STORE_KEY } from '../meta.js';

export const S = { maxEra: 0, ...(readJSON(STORE_KEY) || {}) };
export function save() { writeJSON(STORE_KEY, S); }
export const unlocked = i => i <= S.maxEra;
