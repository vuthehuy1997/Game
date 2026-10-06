// Dữ liệu 6 thời kỳ. makeEra sinh số liệu tăng dần theo độ khó (i = 0..5) từ một khung chung:
// cùng một bộ máy chơi, chỉ khó dần và khác tên/mốc năm/quân địch.
// Mỗi thời kỳ có 3 cấp lính riêng (tên, vũ khí, mũ, áo) — cấp của lính = cấp của trại lính đã nâng.
const LOOK = o => ({ skin: '#e8c49a', hair: '#1c1410', trim: '#e9b949', pants: '#2a2630', belt: '#c9a449', scale: .5, ...o });

function makeEra(i, flavor) {
  const k = 1 + i * 0.3;
  const troopTypes = flavor.troops.map((t, lvl) => ({
    id: `t${lvl}`, name: t.name, look: t.look,
    hp: Math.round((40 + lvl * 24) * k),
    dmg: Math.round((7 + lvl * 5) * k),
    reach: 22, spd: 42,
    spawnCost: 8 + lvl * 7,
    spawnEvery: 3.6 - lvl * 0.5,
  }));
  const waves = [0, 1, 2, 3, 4].map(w => ({
    mix: [{ type: 'grunt', count: 3 + w + i }],
    bossFinal: w === 4,
  }));
  return {
    id: flavor.id, name: flavor.name, year: flavor.year, foe: flavor.foe, bg: flavor.bg,
    hq: { hp: Math.round(90 * k), income: [4, 7, 11], upgradeCost: [40, 90] },
    campCost: 30, campUpgradeCost: [35, 60],
    towerDef: { cost: 35, dmg: Math.round(10 * k), range: 170, rate: 1 },
    stakeDef: { cost: 25, dmg: Math.round(50 * k) },
    enemy: { hp: Math.round(30 * k), dmg: Math.round(6 * k), reach: 22, spd: 40, look: flavor.enemyLook },
    troopTypes,
    waves,
  };
}

export const ERAS = [
  makeEra(0, {
    id: 'hai-ba-trung', name: 'Hai Bà Trưng', year: '40–43', foe: 'quân Hán', bg: '#6fa33a',
    troops: [
      { name: 'Dân binh', look: LOOK({ hat: 'bandana', band: '#8a6a3e', shirt: '#7a5a34', weapon: 'club' }) },
      { name: 'Lính giáo tre', look: LOOK({ hat: 'nonla', shirt: '#4f7a40', weapon: 'spear' }) },
      { name: 'Cung thủ Lạc Việt', look: LOOK({ hat: 'bandana', band: '#b3261e', shirt: '#2f6b57', weapon: 'bow' }) },
    ],
    enemyLook: LOOK({ hat: 'helmet', helm: '#8a8a8a', plume: '#b3261e', shirt: '#8a4a2a', weapon: 'saber' }),
  }),
  makeEra(1, {
    id: 'bach-dang-938', name: 'Ngô Quyền · Bạch Đằng', year: '938', foe: 'quân Nam Hán', bg: '#3a7a93',
    troops: [
      { name: 'Lính cọc', look: LOOK({ hat: 'bandana', band: '#3a7a93', shirt: '#2f5f73', weapon: 'club' }) },
      { name: 'Lính nỏ', look: LOOK({ hat: 'khan', khan: '#2e5a6a', shirt: '#3a7a93', weapon: 'bow' }) },
      { name: 'Đội cọc sông', look: LOOK({ hat: 'mu', mu: '#2a3a6b', shirt: '#2a3a6b', weapon: 'spear' }) },
    ],
    enemyLook: LOOK({ hat: 'helmet', helm: '#5a5a2a', plume: '#d4a017', shirt: '#4a5a2a', weapon: 'glaive' }),
  }),
  makeEra(2, {
    id: 'ly-thuong-kiet', name: 'Lý Thường Kiệt', year: '1075–1077', foe: 'quân Tống', bg: '#8a6a3a',
    troops: [
      { name: 'Quân thường', look: LOOK({ hat: 'topknot', ribbon: '#e9b949', shirt: '#8a6a3a', weapon: 'spear' }) },
      { name: 'Lính thương', look: LOOK({ hat: 'nonla', shirt: '#9a6a2a', weapon: 'spear' }) },
      { name: 'Cung binh', look: LOOK({ hat: 'khan', khan: '#5a3a22', shirt: '#5a3a22', weapon: 'bow' }) },
    ],
    enemyLook: LOOK({ hat: 'helmet', helm: '#2a4a7a', plume: '#e9b949', shirt: '#2a4a7a', weapon: 'glaive' }),
  }),
  makeEra(3, {
    id: 'hung-dao-vuong', name: 'Hưng Đạo Vương', year: '1258–1288', foe: 'quân Nguyên Mông', bg: '#5a5a7a',
    troops: [
      { name: 'Lính giáo dài', look: LOOK({ hat: 'mu', mu: '#3a3a5a', shirt: '#3a3a5a', weapon: 'spear' }) },
      { name: 'Cung nỏ', look: LOOK({ hat: 'khan', khan: '#4a5a2a', shirt: '#5a4a3a', weapon: 'bow' }) },
      { name: 'Tướng đội mũ', look: LOOK({ hat: 'helmet', helm: '#7a6a3a', plume: '#b3261e', shirt: '#3a3a5a', weapon: 'saber' }) },
    ],
    enemyLook: LOOK({ hat: 'mongol', cap: '#3a2a1a', fur: '#d9c7a0', shirt: '#6b3a2a', weapon: 'glaive' }),
  }),
  makeEra(4, {
    id: 'le-loi', name: 'Lê Lợi', year: '1418–1427', foe: 'quân Minh', bg: '#7a3a3a',
    troops: [
      { name: 'Lính Lam Sơn', look: LOOK({ hat: 'khan', khan: '#2e5a3a', shirt: '#2e5a3a', weapon: 'spear' }) },
      { name: 'Nỏ thủ', look: LOOK({ hat: 'bandana', band: '#3a6a8a', shirt: '#3a4a5a', weapon: 'bow' }) },
      { name: 'Tướng Lam Sơn', look: LOOK({ hat: 'helmet', helm: '#6a6a6a', plume: '#c0392b', shirt: '#2e5a3a', weapon: 'saber' }) },
    ],
    enemyLook: LOOK({ hat: 'helmet', helm: '#4a3a6a', plume: '#e0c040', shirt: '#4a3a6a', weapon: 'glaive' }),
  }),
  makeEra(5, {
    id: 'quang-trung', name: 'Quang Trung', year: '1789', foe: 'quân Thanh', bg: '#3a5a3a',
    troops: [
      { name: 'Lính Tây Sơn', look: LOOK({ hat: 'bandana', band: '#c0392b', shirt: '#3a5a3a', weapon: 'saber' }) },
      { name: 'Hỏa mai thủ', look: LOOK({ hat: 'topknot', ribbon: '#c0392b', shirt: '#4a6a3a', weapon: 'spear' }) },
      { name: 'Trống trận voi', look: LOOK({ hat: 'helmet', helm: '#3a5a3a', plume: '#e9b949', shirt: '#3a5a3a', weapon: 'drum' }) },
    ],
    enemyLook: LOOK({ hat: 'helmet', helm: '#5a4a7a', plume: '#ffd35a', shirt: '#5a4a7a', weapon: 'glaive' }),
  }),
];

export function bossDef(era) {
  return {
    hp: Math.round(era.enemy.hp * 3.2), dmg: Math.round(era.enemy.dmg * 1.6),
    reach: era.enemy.reach + 10, spd: era.enemy.spd * .8, name: 'Tướng giặc', look: era.enemy.look,
  };
}
