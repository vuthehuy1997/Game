// Dữ liệu bản đồ, địa hình, công trình, chương sử và sự kiện.
// Bản đồ: 8 cột × 5 hàng, Thăng Long ở góc trên-trái, đất mở dần về phía nam-đông nam.
// Ký tự địa hình: p đồng bằng · h đồi · f rừng · m núi · w sông (không chiếm được).
export const COLS = 8, ROWS = 5, N = COLS * ROWS, SLOTS = 3;
export const CAPITAL = 9;
export const MAP = [
  'pphwpfmp',
  'pppwppfm',
  'hpfppwpm',
  'pphwpfpp',
  'phfpwppp',
];
export const EXPAND_FOOD = 15, MIN_POP_EXPAND = 3;

export const TERRAIN = {
  p: { name: 'Đồng bằng', def: 0, food: 1, expand: 40, color: '#7ea04a' },
  h: { name: 'Đồi', def: 4, food: .7, expand: 50, color: '#9a9a5a' },
  f: { name: 'Rừng', def: 2, food: .5, expand: 55, color: '#3d7040' },
  m: { name: 'Núi', def: 8, food: .2, expand: 80, color: '#7d7a74' },
  w: { name: 'Sông', def: 0, food: 0, expand: 0, color: '#2f7aa0' },
};

export const BUILDINGS = {
  house: { name: 'Nhà dân', cost: { gold: 20, food: 0 }, chapter: 0, desc: '+4 dân tối đa' },
  farm: { name: 'Ruộng lúa', cost: { gold: 15, food: 0 }, chapter: 0, desc: '+1.5 lương thực/s theo địa hình' },
  outpost: { name: 'Đồn', cost: { gold: 30, food: 10 }, chapter: 0, def: 12, desc: '+12 phòng thủ, cần để chiếm núi' },
  market: { name: 'Chợ', cost: { gold: 40, food: 10 }, chapter: 1, desc: '+1.5 vàng/s' },
  temple: { name: 'Chùa', cost: { gold: 80, food: 20 }, chapter: 1, desc: '+0.5 uy tín/s' },
  workshop: { name: 'Xưởng', cost: { gold: 60, food: 0 }, chapter: 2, desc: '+2 vàng/s' },
  citadel: { name: 'Thành', cost: { gold: 150, food: 60 }, chapter: 2, def: 30, desc: '+30 phòng thủ, +0.2 uy tín/s' },
};
export const KINDS = Object.keys(BUILDINGS);

export const CHAPTERS = [
  { name: 'Thăng Long', years: '1009 – 1306', maxCol: 2, goal: { tiles: 6, prestige: 0 },
    lore: 'Năm 1009, vua Lý Thái Tổ dời đô về Thăng Long. Từ kinh thành, dân ta khai hoang ven sông Hồng, dựng ấp và đắp đê. Hãy mở vùng đất đầu tiên.' },
  { name: 'Ô, Lý châu', years: '1306', maxCol: 4, goal: { tiles: 12, prestige: 25 },
    lore: 'Năm 1306, vua Chiêm Chế Mân dâng châu Ô và châu Lý làm lễ cưới Huyền Trân công chúa. Đất mới về phương nam đang chờ người khai phá.' },
  { name: 'Vijaya', years: '1471', maxCol: 6, goal: { tiles: 18, prestige: 50 },
    lore: 'Năm 1471, vua Lê Thánh Tông đánh hạ Vijaya, kinh đô Chiêm Thành, và mở rộng bờ cõi về phía nam. Núi và đèo hiểm trở, cần đồn ải để giữ đất.' },
  { name: 'Gia Định', years: '1698', maxCol: 7, goal: { tiles: 26, prestige: 80 },
    lore: 'Năm 1698, Nguyễn Hữu Cảnh vào Nam lập phủ Gia Định, đưa đất Đồng Nai và Sài Gòn vào bản đồ Đại Việt. Trận cuối: giữ vững mọi vùng đã mở.' },
];

export const EVENTS = {
  lu: { name: 'Lũ sông', dur: 25, warn: 'Cảnh báo: nước lũ sắp dâng!', text: 'Nước lũ tràn ruộng ven sông: ruộng cạnh sông chỉ còn 40% sản lượng.' },
  mua: { name: 'Mùa bội thu', dur: 25, warn: 'Trời quang mây tạnh, lúa sắp chín rộ.', text: 'Mùa bội thu: mọi ruộng tăng 60% sản lượng.' },
  giac: { name: 'Giặc tấn công', warn: 'Cảnh báo: giặc đang kéo đến biên giới!', text: '' },
};
