// Vị trí các nút trên canvas, dùng chung cho vẽ và xử lý chuột/chạm.
export const card = i => ({ x: 60 + (i % 3) * 290, y: 130 + Math.floor(i / 3) * 180, w: 260, h: 160 });
export const BACK = { x: 14, y: 52, w: 124, h: 30 };
export const pal = i => ({ x: 40 + i * 140, y: 484, w: 128, h: 44 });
export const START = { x: 760, y: 482, w: 180, h: 48 };
export const LORE_BTN = { x: 380, y: 418, w: 200, h: 50 };
export const OVER_MENU = { x: 300, y: 340, w: 200, h: 48 };
export const OVER_NEXT = { x: 520, y: 340, w: 200, h: 48 };
export const SLOT_R = 44;

export const hit = (r, x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
