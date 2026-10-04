export const BUILDING_DEFS = {
  house:   { name: 'Nhà dân',    cost: { gold: 20 },            pop: 4,  unlockAt: 0 },
  farm:    { name: 'Ruộng lúa',  cost: { gold: 15 },            food: 2, unlockAt: 0 },
  market:  { name: 'Chợ',        cost: { gold: 40, food: 10 },  gold: 2, unlockAt: 10 },
  well:    { name: 'Giếng nước', cost: { gold: 30 },            pop: 6,  unlockAt: 20 },
  granary: { name: 'Kho thóc',   cost: { gold: 60 },            food: 6, unlockAt: 30 },
  temple:  { name: 'Đình làng',  cost: { gold: 80, food: 30 },  pop: 10, unlockAt: 40 },
};
export const MAX_OFFLINE_SEC = 4 * 3600;
