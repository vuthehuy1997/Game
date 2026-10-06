export const TIERS = [
  { id: 'nen', name: 'Nền làng' },
  { id: 'thu', name: 'Nghề thủ công' },
  { id: 'buon', name: 'Buôn bán' },
];
// req: tổng xu đã kiếm được để mở khoá. building: công trình hiện lên cảnh làng khi có ít nhất 1 cái.
export const UPGRADES = [
  { id: 'phuong', name: 'Phường hội', tier: 'nen', kind: 'click', baseCost: 15, costMul: 1.15, value: 1, req: 0, building: 'guild', color: '#c9a449', desc: 'Hội phường tụ thợ khéo, mỗi cú bấm thu thêm.' },
  { id: 'tho', name: 'Thợ mộc', tier: 'nen', kind: 'auto', baseCost: 25, costMul: 1.15, value: 1, req: 0, building: 'house', color: '#b07a4a', desc: 'Dựng nhà cửa, thu xu mỗi giây.' },
  { id: 'xuong', name: 'Xưởng dệt', tier: 'thu', kind: 'auto', baseCost: 200, costMul: 1.17, value: 8, req: 150, building: 'weave', color: '#2f6b57', desc: 'Khung cửi rộn ràng suốt ngày.' },
  { id: 'lo_gom', name: 'Lò gốm', tier: 'thu', kind: 'auto', baseCost: 700, costMul: 1.18, value: 30, req: 500, building: 'kiln', color: '#b5673a', desc: 'Nung bát đĩa, hũ vại bán khắp vùng.' },
  { id: 'lo_ran', name: 'Lò rèn', tier: 'thu', kind: 'auto', baseCost: 5000, costMul: 1.2, value: 150, req: 4000, building: 'forge', color: '#6a6a74', desc: 'Rèn cuốc, liềm và binh khí.' },
  { id: 'cang', name: 'Thương cảng', tier: 'buon', kind: 'auto', baseCost: 1500, costMul: 1.2, value: 50, req: 1500, building: 'dock', color: '#3d6a8a', desc: 'Thuyền buôn cập bến, chở hàng đi xa.' },
  { id: 'cho', name: 'Chợ làng', tier: 'buon', kind: 'auto', baseCost: 20000, costMul: 1.22, value: 600, req: 15000, building: 'market', color: '#c05a3a', desc: 'Phiên chợ đông vui, người mua kẻ bán.' },
];
export const ACHIEVEMENTS = [
  { id: 'khoi-nghiep', name: 'Khởi nghiệp', at: 100 },
  { id: 'lang-nho', name: 'Làng nhỏ có tiếng', at: 1000 },
  { id: 'phuong-thinh', name: 'Phường thịnh vượng', at: 10000 },
  { id: 'dai-thuong', name: 'Đại thương làng', at: 100000 },
];
export const MAX_OFFLINE_SEC = 4 * 3600;
export const FESTIVAL_SEC = 20, FESTIVAL_MUL = 2, FESTIVAL_GAP = [60, 120];
