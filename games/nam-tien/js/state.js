import { N, SLOTS, CAPITAL } from './data.js';

// Mọi trạng thái nằm trong một object G được sửa tại chỗ, để các module khác luôn thấy giá trị mới.
export const G = { paused: false };

export function freshEvents() {
  return { active: null, timer: 0, pending: null, warn: 0, nextIn: 40 };
}

export function resetRun() {
  Object.assign(G, {
    mode: 'intro', chapter: 0, cleared: 0, t: 0,
    res: { food: 40, gold: 60, pop: 4, prestige: 0 },
    owned: new Array(N).fill(0),
    slots: new Array(N * SLOTS).fill(null),
    sel: { kind: null, tile: -1 },
    famineT: 0, ev: freshEvents(), snap: null, log: [], note: { text: '', color: '#ffe6a8', t: 0 },
  });
  G.owned[CAPITAL] = 1;
}

resetRun();
