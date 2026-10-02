// Dữ liệu 6 thời kỳ. makeEra sinh số liệu tăng dần theo độ khó (i = 0..5) từ một khung chung:
// cùng một bộ máy chơi, chỉ khó dần và khác tên/mốc năm/quân địch.
const TROOP_NAMES = ['Dân binh', 'Lính giáo', 'Cấm quân'];

function makeEra(i, flavor) {
  const k = 1 + i * 0.3;
  const troopTypes = TROOP_NAMES.map((name, lvl) => ({
    id: `t${lvl}`, name,
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
    enemy: { hp: Math.round(30 * k), dmg: Math.round(6 * k), reach: 22, spd: 40 },
    waves,
  };
}

export const ERAS = [
  makeEra(0, { id: 'hai-ba-trung', name: 'Hai Bà Trưng', year: '40–43', foe: 'quân Hán', bg: '#6fa33a' }),
  makeEra(1, { id: 'bach-dang-938', name: 'Ngô Quyền · Bạch Đằng', year: '938', foe: 'quân Nam Hán', bg: '#3a7a93' }),
  makeEra(2, { id: 'ly-thuong-kiet', name: 'Lý Thường Kiệt', year: '1075–1077', foe: 'quân Tống', bg: '#8a6a3a' }),
  makeEra(3, { id: 'hung-dao-vuong', name: 'Hưng Đạo Vương', year: '1258–1288', foe: 'quân Nguyên Mông', bg: '#5a5a7a' }),
  makeEra(4, { id: 'le-loi', name: 'Lê Lợi', year: '1418–1427', foe: 'quân Minh', bg: '#7a3a3a' }),
  makeEra(5, { id: 'quang-trung', name: 'Quang Trung', year: '1789', foe: 'quân Thanh', bg: '#3a5a3a' }),
];

export function bossDef(era) {
  return {
    hp: Math.round(era.enemy.hp * 3.2), dmg: Math.round(era.enemy.dmg * 1.6),
    reach: era.enemy.reach + 10, spd: era.enemy.spd * .8, name: 'Tướng giặc',
  };
}
