// Bàn dữ liệu tướng và sân. Mỗi tướng: 1 "look" chibi (platform/art/chibi.js) + thống kê + 1 chiêu riêng.
// specials: kind 'dmg' (sát thương + đẩy lùi ngay), 'dash' (xông tới gây sát thương, bất tử khi xông),
// 'ranged' (gây sát thương không cần đứng gần), 'counter' (thế đỡ-phản đòn tạm thời).
export const FIGHTERS = {
  tieuho: {
    name: 'Tiểu Hổ', hp: 100, spd: 260, reach: 70, dmgLight: 6, dmgHeavy: 14,
    look: { skin: '#f6d2ae', hair: '#1c1410', hat: 'topknot', shirt: '#2f6b57', trim: '#e9b949', pants: '#2a2630', belt: '#e9b949', weapon: 'club' },
    special: { name: 'Hồi Phong Cước', kind: 'dmg', dmg: 22, knock: 260 },
  },
  hungdao: {
    name: 'Hưng Đạo Vương', hp: 105, spd: 220, reach: 95, dmgLight: 7, dmgHeavy: 16,
    look: { skin: '#e8c49a', hair: '#1c1410', hat: 'mu', mu: '#2a3a6b', shirt: '#2a3a6b', trim: '#e9b949', pants: '#241f1a', belt: '#e9b949', weapon: 'spear', beard: 1 },
    special: { name: 'Chấn Động Giáo', kind: 'dmg', dmg: 26, knock: 320 },
  },
  quoctoan: {
    name: 'Trần Quốc Toản', hp: 95, spd: 300, reach: 65, dmgLight: 6, dmgHeavy: 13,
    look: { skin: '#f0cf9e', hair: '#1c1410', hat: 'khan', khan: '#b3261e', shirt: '#b3261e', trim: '#e9b949', pants: '#2a2630', belt: '#e9b949', weapon: 'saber' },
    special: { name: 'Phá Cường Địch', kind: 'dash', dmg: 20, knock: 300 },
  },
  ngulao: {
    name: 'Phạm Ngũ Lão', hp: 100, spd: 230, reach: 100, dmgLight: 8, dmgHeavy: 18,
    look: { skin: '#dcb888', hair: '#1c1410', hat: 'khan', khan: '#4a2e1a', shirt: '#4a2e1a', trim: '#c9a449', pants: '#241f1a', belt: '#c9a449', weapon: 'glaive' },
    special: { name: 'Đâm Xuyên', kind: 'dmg', dmg: 24, knock: 360 },
  },
  binhtrong: {
    name: 'Trần Bình Trọng', hp: 115, spd: 220, reach: 60, dmgLight: 7, dmgHeavy: 15,
    look: { skin: '#e8c49a', hair: '#1c1410', hat: 'mu', mu: '#5a2a20', shirt: '#5a2a20', trim: '#e9b949', pants: '#241f1a', belt: '#e9b949', weapon: 'club', scar: true },
    special: { name: 'Thà Làm Quỷ Nước Nam', kind: 'counter', dur: 2, counterDmg: 30 },
  },
  khanhdu: {
    name: 'Trần Khánh Dư', hp: 90, spd: 240, reach: 140, dmgLight: 5, dmgHeavy: 12,
    look: { skin: '#e2bd8c', hair: '#1c1410', hat: 'bandana', band: '#2f6b57', shirt: '#2f6b57', trim: '#e9b949', pants: '#2a2630', belt: '#e9b949', weapon: 'bow' },
    special: { name: 'Loạt Tên', kind: 'ranged', dmg: 10, hits: 3 },
  },
};

export const STAGES = {
  thanglong: { name: 'Thăng Long', sky: ['#3a1410', '#a3261d'], ground: '#140e0a' },
  bachdang: { name: 'Bạch Đằng', sky: ['#0d2436', '#2f6b7a'], ground: '#0a1a1a', hazard: 'stakes' },
  vankiep: { name: 'Rừng Vạn Kiếp', sky: ['#0e1f12', '#2f4a2a'], ground: '#0c140d' },
};
