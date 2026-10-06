// Ải và địa hình. Mỗi ký tự trong `terrain` là một ô theo hàng từ trên xuống, trái sang phải:
// p đồng bằng · h đồi · f rừng · k thành lũy · r sông (không đi qua được).
export const MAPS = [
  { name: 'Bình Lục', lore: 'Mùa xuân, giặc tràn qua biên giới. Quân ta dựng cờ ở Bình Lục — bước đầu giữ nước.',
    cols: 4, rows: 3, terrain: 'pphp' + 'prpf' + 'ppkp' },
  { name: 'Đại La', lore: 'Giặc tiến về kinh thành. Đại La là cửa ngõ phía bắc, phải giữ bằng mọi giá.',
    cols: 5, rows: 4, terrain: 'pphpf' + 'prpph' + 'fpkrp' + 'ppphp' },
  { name: 'Chi Lăng', lore: 'Ải hiểm giữa núi non trùng điệp. Trận cuối: đẩy lùi giặc ra khỏi bờ cõi.',
    cols: 6, rows: 4, terrain: 'pphpfp' + 'prpphp' + 'fpkrpp' + 'pphprp' },
];
export const HOME = 0, MAX_TROOPS = 60, SPAWN_PER_SEC = 1.5, DEFENSE_GROW_PER_SEC = .3, DEFENSE_CAP = 40;
// Hệ số phòng thủ của địa hình: quân đánh phải vượt số quân bên giữ nhân với hệ số này
export const DEF_MULT = { p: 1, h: 1.5, f: 1.25, k: 2 };
// Quân giặc ban đầu theo địa hình, cộng thêm theo số ải đã mở
export const ENEMY_BASE = { p: 6, h: 10, f: 8, k: 14, r: 0 };
export const G = { t: 0, selected: null, won: false, intro: false, enemyT: 0, marches: [], log: [] };
