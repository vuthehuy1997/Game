export const COLS = 8;
export const ROWS = 6;
// Lưới đất trong không gian canvas 960×540: góc trên trái (x0,y0), mỗi ô rộng cw, cao ch
export const MAP = { x0: 64, y0: 150, cw: 106, ch: 56 };
export function plotBox(i) {
  const col = i % COLS, row = (i / COLS) | 0;
  return { x: MAP.x0 + col * MAP.cw, y: MAP.y0 + row * MAP.ch, w: MAP.cw, h: MAP.ch };
}
