export const BUILDING_DEFS = {
  house:   { name: 'Nhà dân',    cost: { gold: 20 },            pop: 4, gold: 0.5, unlockAt: 0,  desc: 'Nhà gianh mái cong, nơi dân làng sinh sống.' },
  farm:    { name: 'Ruộng lúa',  cost: { gold: 15 },            food: 2, unlockAt: 0,  desc: 'Thửa ruộng xanh, lúa đung đưa theo gió.' },
  market:  { name: 'Chợ',        cost: { gold: 40, food: 10 },  gold: 2, unlockAt: 10, desc: 'Quán lều có mái bạt, thương lái tụ họp mua bán.' },
  kiln:    { name: 'Lò gốm',     cost: { gold: 35 },            gold: 1.2, unlockAt: 15, desc: 'Lò đất nung bát đĩa, khói bốc lên mỗi ngày.' },
  well:    { name: 'Giếng nước', cost: { gold: 30 },            pop: 6,  unlockAt: 20, desc: 'Giếng đá xây vòng quanh, nước trong cho cả làng.' },
  granary: { name: 'Kho thóc',   cost: { gold: 60 },            food: 6, unlockAt: 30, desc: 'Kho gỗ mái tròn, cất thóc phòng năm đói kém.' },
  temple:  { name: 'Đình làng',  cost: { gold: 80, food: 30 },  pop: 10, unlockAt: 40, desc: 'Đình nhiều tầng mái, nơi thờ thành hoàng và bàn việc chung.' },
};
export const MAX_OFFLINE_SEC = 4 * 3600;

// Lời dẫn theo triều đại: mỗi mốc dân số mở một đoạn sử ngắn.
export const MILESTONES = [
  { pop: 0,  reign: 'Lý Thái Tổ (1010)',  title: 'Dời đô về Thăng Long', text: 'Năm 1010, vua Lý Thái Tổ dời đô về Thăng Long. Ven sông Hồng, dân ta bắt đầu khai hoang và lập ấp.' },
  { pop: 10, reign: 'Lý Thái Tông',       title: 'Chợ làng mở',          text: 'Thương lái từ kinh thành ghé qua buôn bán. Tiếng chợ rộn ràng mỗi buổi sớm bên bến nước.' },
  { pop: 20, reign: 'Lý Thánh Tông',      title: 'Đê điều và giếng nước', text: 'Đê được đắp cao, giếng được đào sâu. Dân làng bớt khổ vì lụt lội và thiếu nước.' },
  { pop: 30, reign: 'Lý Nhân Tông',       title: 'Kho thóc đầy',         text: 'Lúa được cất vào kho để phòng năm mất mùa, để làng không lo đói kém khi bão lụt kéo đến.' },
  { pop: 40, reign: 'Lý Thần Tông',       title: 'Đình làng dựng nên',   text: 'Đình làng mọc lên giữa xóm. Nơi ấy thờ thành hoàng, và cũng là chỗ dân làng hội họp bàn việc chung.' },
  { pop: 60, reign: 'Lý Anh Tông',        title: 'Làng no, nước thịnh',  text: 'Tiếng trống hội và tiếng hò đồng áng hòa vào nhau. Làng Việt bước sang một thời thịnh trị.' },
];
export function milestoneIndex(pop) {
  let idx = 0;
  MILESTONES.forEach((m, i) => { if (pop >= m.pop) idx = i; });
  return idx;
}
export function milestoneFor(pop) { return MILESTONES[milestoneIndex(pop)]; }

// Sự kiện ngẫu nhiên: báo trước `warn` giây rồi kéo dài `dur` giây.
export const EVENT_DEFS = {
  flood:   { warn: 8, dur: 25, food: .4,  title: 'Mây đen kéo về, lũ sắp tràn!', note: 'Nước lũ ngập ruộng: lương thực chỉ còn 40%.' },
  harvest: { warn: 8, dur: 25, food: 1.8, title: 'Trời quang mây tạnh, mùa bội thu!', note: 'Lúa chín rộ: lương thực tăng lên 180%.' },
};
export const EVENT_GAP = [50, 90];
