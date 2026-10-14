// Dữ liệu thuần (không trạng thái): loại tile, vật phẩm, công thức chế tác, quái, nhiệm vụ, cửa hàng.
export const COLS = 160, ROWS = 90, TS = 24;
export const DAY_LEN = 90; // giây mỗi ngày
export const STORE_KEY = 'luy-tre-lang-v1';

// Khu vực: chia thế giới thành 4 dải cột liên tiếp, cố định trái -> phải
export const BAND_W = Math.ceil(COLS / 4);
export const BIOME = { PLAINS: 'plains', BAMBOO_FOREST: 'bamboo_forest', SWAMP: 'swamp', MOUNTAIN: 'mountain' };
export const BIOME_NAME = { plains: 'Đồng Bằng', bamboo_forest: 'Rừng Tre Rậm', swamp: 'Đầm Lầy', mountain: 'Núi Đá Vôi' };
export const BIOME_SKY = {
  plains: { day: ['#7ec8e3', '#cfe8d0'], night: ['#0a1430', '#1a2440'], hill: 'rgba(130,180,110,.35)' },
  bamboo_forest: { day: ['#79c48a', '#def0cf'], night: ['#08201a', '#13332a'], hill: 'rgba(60,110,55,.45)' },
  swamp: { day: ['#8aa29c', '#cdd9cf'], night: ['#141f1c', '#233530'], hill: 'rgba(90,120,110,.4)' },
  mountain: { day: ['#92a8d6', '#e4ecf5'], night: ['#121a34', '#222c48'], hill: 'rgba(120,130,155,.4)' },
};

export const TILE = {
  AIR: 0, DIRT: 1, STONE: 2, BAMBOO: 3, COPPER: 4, IRON: 5, SILVER: 6, GOLD: 7,
  WALL: 8, ROOF: 9, BRICK: 10, DOOR: 11, TORCH: 12, BENCH: 13, BEDROCK: 14, FARMLAND: 15,
  WATER: 16, REED: 17,
};
export const SOLID = new Set([TILE.DIRT, TILE.STONE, TILE.BAMBOO, TILE.COPPER, TILE.IRON, TILE.SILVER, TILE.GOLD,
  TILE.WALL, TILE.BRICK, TILE.BENCH, TILE.BEDROCK, TILE.FARMLAND]);
export const WATER_SPEED_MULT = .6, WATER_JUMP_MULT = .7;
// Tile coi là "tường/mái" hợp lệ khi xét nhà (tường, mái, gạch, cửa đều tính)
export const HOUSE_BOUND = new Set([TILE.WALL, TILE.ROOF, TILE.BRICK, TILE.DOOR]);

export const HARDNESS = {
  [TILE.DIRT]: 1, [TILE.STONE]: 2, [TILE.BAMBOO]: 1, [TILE.COPPER]: 3, [TILE.IRON]: 4, [TILE.SILVER]: 5, [TILE.GOLD]: 6,
  [TILE.WALL]: 2, [TILE.ROOF]: 1, [TILE.BRICK]: 3, [TILE.DOOR]: 2, [TILE.TORCH]: 1, [TILE.BENCH]: 2, [TILE.BEDROCK]: Infinity,
  [TILE.FARMLAND]: 1,
};
// Vật phẩm rơi ra khi đào vỡ một tile
export const DROP = {
  [TILE.DIRT]: 'dat', [TILE.STONE]: 'da', [TILE.BAMBOO]: 'tre', [TILE.COPPER]: 'dong', [TILE.IRON]: 'sat',
  [TILE.SILVER]: 'bac', [TILE.GOLD]: 'vang', [TILE.WALL]: 'tuong_tre', [TILE.ROOF]: 'mai_tranh', [TILE.BRICK]: 'gach_gom',
  [TILE.DOOR]: 'cua_tre', [TILE.TORCH]: 'duoc', [TILE.BENCH]: 'ban_che', [TILE.FARMLAND]: 'dat',
};
// Hạt giống -> loại nông sản thu hoạch được
export const SEED_TO_CROP = { hat_lua: 'lua', hat_rau: 'rau', hat_dua: 'dua' };
export const CROP_STAGES = 4;
export const CROP_GROW_DAYS = 3; // số ngày trôi qua để chín (giai đoạn 3)
// Vật phẩm đặt được -> tile sẽ đặt xuống
export const PLACE_TILE = {
  tuong_tre: TILE.WALL, mai_tranh: TILE.ROOF, gach_gom: TILE.BRICK, cua_tre: TILE.DOOR, duoc: TILE.TORCH, ban_che: TILE.BENCH,
};

export const ITEMS = {
  dat: { name: 'Đất', color: '#7a5a3a' }, da: { name: 'Đá', color: '#8a8a8f' }, tre: { name: 'Tre', color: '#7fae4a' },
  dong: { name: 'Quặng đồng', color: '#c97a45' }, sat: { name: 'Quặng sắt', color: '#9a8a7a' },
  bac: { name: 'Quặng bạc', color: '#cfd4dc' }, vang: { name: 'Quặng vàng', color: '#e9c349' },
  tuong_tre: { name: 'Tường tre', color: '#9a7a4a' }, mai_tranh: { name: 'Mái tranh', color: '#c9a54a' },
  gach_gom: { name: 'Gạch gốm', color: '#b5583a' }, cua_tre: { name: 'Cửa tre', color: '#6b4a2a' },
  duoc: { name: 'Đuốc', color: '#ffb23a' }, ban_che: { name: 'Bàn chế tác', color: '#5a4228' },
  cuoc_tre: { name: 'Cuốc tre', color: '#7fae4a', tool: true }, cuoc_da: { name: 'Cuốc đá', color: '#8a8a8f', tool: true },
  cuoc_dong: { name: 'Cuốc đồng', color: '#c97a45', tool: true }, cuoc_sat: { name: 'Cuốc sắt', color: '#9a8a7a', tool: true },
  giao_tre: { name: 'Giáo tre', color: '#7fae4a', tool: true }, kiem_da: { name: 'Kiếm đá', color: '#8a8a8f', tool: true },
  kiem_dong: { name: 'Kiếm đồng', color: '#c97a45', tool: true }, kiem_sat: { name: 'Kiếm sắt', color: '#9a8a7a', tool: true },
  ngoc_quy: { name: 'Ngọc quý', color: '#7fe0ff' },
  kiem_ngoc: { name: 'Kiếm Ngọc', color: '#7fe0ff', tool: true },
  hat_lua: { name: 'Hạt lúa', color: '#e9c349', seed: true }, hat_rau: { name: 'Hạt rau', color: '#5a9a3a', seed: true },
  hat_dua: { name: 'Hạt dưa', color: '#4a8a4a', seed: true },
  lua: { name: 'Lúa', color: '#e9c349' }, rau: { name: 'Rau', color: '#5a9a3a' }, dua: { name: 'Dưa', color: '#4a8a4a' },
  trung: { name: 'Trứng', color: '#f2e4c6' }, thit_lon: { name: 'Thịt lợn', color: '#e8a8ad' },
};

// Thú nuôi: loanh quanh ban ngày ở Đồng Bằng, thuần hoá bằng đúng thức ăn, gà/lợn đã thuần tự sinh vật phẩm.
export const ANIMAL_DEF = {
  ga: { name: 'Gà', hp: 6, speed: 30, produce: 'trung', produceEvery: 20 },
  lon: { name: 'Lợn', hp: 10, speed: 20, produce: 'thit_lon', produceEvery: 30 },
  trau: { name: 'Trâu', hp: 20, speed: 15 },
};
export const FEED_FOR_ANIMAL = { ga: 'lua', lon: 'rau', trau: 'dua' };
export const MAX_ANIMALS = 4, ANIMAL_SPAWN_EVERY = 6, RIDE_SPEED_MULT = 1.6;
export const TOOL_POWER = { cuoc_tre: 3, cuoc_da: 5, cuoc_dong: 7, cuoc_sat: 10 };
export const WEAPON_DMG = { giao_tre: 8, kiem_da: 12, kiem_dong: 18, kiem_sat: 26, kiem_ngoc: 36 };
export const HAND_POWER = 1, HAND_DMG = 3;
export const WEAPON_LOOK = { giao_tre: 'spear', kiem_da: 'saber', kiem_dong: 'saber', kiem_sat: 'saber', kiem_ngoc: 'saber',
  cuoc_tre: 'club', cuoc_da: 'club', cuoc_dong: 'club', cuoc_sat: 'club' };

export const RECIPES = [
  { id: 'cuoc_tre', out: 'cuoc_tre', qty: 1, need: { tre: 4 }, bench: false },
  { id: 'ban_che', out: 'ban_che', qty: 1, need: { tre: 6 }, bench: false },
  { id: 'tuong_tre', out: 'tuong_tre', qty: 2, need: { tre: 2 }, bench: false },
  { id: 'giao_tre', out: 'giao_tre', qty: 1, need: { tre: 3 }, bench: false },
  { id: 'mai_tranh', out: 'mai_tranh', qty: 2, need: { tre: 3 }, bench: true },
  { id: 'cua_tre', out: 'cua_tre', qty: 1, need: { tre: 4 }, bench: true },
  { id: 'duoc', out: 'duoc', qty: 2, need: { tre: 1, da: 1 }, bench: true },
  { id: 'gach_gom', out: 'gach_gom', qty: 3, need: { da: 4 }, bench: true },
  { id: 'cuoc_da', out: 'cuoc_da', qty: 1, need: { da: 3, tre: 1 }, bench: true },
  { id: 'kiem_da', out: 'kiem_da', qty: 1, need: { da: 3, tre: 1 }, bench: true },
  { id: 'cuoc_dong', out: 'cuoc_dong', qty: 1, need: { dong: 3, tre: 1 }, bench: true },
  { id: 'kiem_dong', out: 'kiem_dong', qty: 1, need: { dong: 3, tre: 1 }, bench: true },
  { id: 'cuoc_sat', out: 'cuoc_sat', qty: 1, need: { sat: 3, tre: 1 }, bench: true },
  { id: 'kiem_sat', out: 'kiem_sat', qty: 1, need: { sat: 3, tre: 1 }, bench: true },
  { id: 'kiem_ngoc', out: 'kiem_ngoc', qty: 1, need: { ngoc_quy: 1, sat: 2 }, bench: true },
];

export const MOB_DEF = {
  ma_troi: { name: 'Ma trơi', hp: 16, dmg: 6, speed: 70, fly: true, color: '#bfe6a0' },
  quai_rung: { name: 'Quái rừng', hp: 24, dmg: 9, speed: 55, fly: false, color: '#5a3a2a' },
  boss_vua_quai: { name: 'Vua Quái Rừng', hp: 220, dmg: 18, speed: 45, fly: false, color: '#3a1f14',
    boss: true, lungeDmg: 36, lungeEvery: 3 },
};
export const BOSS_EVERY_DAYS = 5;

export const QUESTS = [
  { id: 'q1', text: 'Đào 5 quặng đồng', type: 'mine', item: 'dong', need: 5, reward: { gold: 30 } },
  { id: 'q2', text: 'Đánh bại 3 quái trong đêm', type: 'kill', need: 3, reward: { gold: 40 } },
  { id: 'q3', text: 'Đào 3 quặng sắt', type: 'mine', item: 'sat', need: 3, reward: { gold: 50, item: 'cuoc_sat' } },
];

export const SHOP_BUY = [{ item: 'duoc', price: 3 }, { item: 'gach_gom', price: 4 }, { item: 'tre', price: 1 },
  { item: 'hat_lua', price: 2 }, { item: 'hat_rau', price: 3 }, { item: 'hat_dua', price: 4 }];
export const SHOP_SELL = { dong: 2, sat: 3, bac: 5, vang: 8, lua: 2, rau: 3, dua: 4, trung: 3, thit_lon: 5 };

export const HOTBAR_SLOTS = 8;
export const PLAYER_W = 16, PLAYER_H = 40, GRAV = 2300, MOVE_SPEED = 230, JUMP_V = 760, REACH = 5 * TS;
export const MAX_MOBS = 6, SPAWN_EVERY = 4.5, BENCH_RADIUS = 3 * TS, NPC_RADIUS = 2.5 * TS, HIT_COOLDOWN = .35;
