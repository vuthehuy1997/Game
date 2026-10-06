// Bố cục màn hình 960×540 và vùng bấm. Mọi toạ độ ở đây là toạ độ logic của canvas.
import { COLS, ROWS, N, KINDS } from './data.js';

export const BOX = { x: 24, y: 88, tw: 84, th: 78 };
export const PANEL = { x: 712, y: 88, w: 224, h: 390 };
export const INFO = { x: 712, y: 326, w: 224, h: 152 };
export const EXPAND_BTN = { x: 724, y: 436, w: 200, h: 36 };
export const CARD_BTN = { x: 380, y: 372, w: 200, h: 46 };
export const CARD = { x: 170, y: 92, w: 620, h: 340 };
export const PALETTE = [...KINDS, 'remove'];
export const SLOT_R = 18;

export function hit(r, x, y) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function tileRect(i) {
  const c = i % COLS, r = Math.floor(i / COLS);
  return { x: BOX.x + c * BOX.tw, y: BOX.y + r * BOX.th, w: BOX.tw - 3, h: BOX.th - 3 };
}

export function slotPos(i, s) {
  const b = tileRect(i);
  const k = [[.27, .5], [.73, .5], [.5, .9]][s];
  return { x: b.x + b.w * k[0], y: b.y + b.h * k[1] };
}

export function tileAtPoint(x, y) {
  for (let i = 0; i < N; i++) {
    const b = tileRect(i);
    if (hit(b, x, y)) return i;
  }
  return -1;
}

export function slotAtPoint(x, y, owned) {
  let best = null, bd = SLOT_R * SLOT_R;
  for (let i = 0; i < N; i++) {
    if (!owned[i]) continue;
    for (let s = 0; s < 3; s++) {
      const p = slotPos(i, s), d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d <= bd) { bd = d; best = { tile: i, s }; }
    }
  }
  return best;
}

export function paletteRect(idx) {
  const c = idx % 2, r = Math.floor(idx / 2);
  return { x: PANEL.x + 8 + c * 108, y: PANEL.y + 34 + r * 52, w: 104, h: 46 };
}

export function paletteAt(x, y) {
  for (let k = 0; k < PALETTE.length; k++) if (hit(paletteRect(k), x, y)) return PALETTE[k];
  return null;
}
