// Vị trí ô trên canvas 960×540. Canvas vẽ hình, lớp nút trong suốt bên trên dùng cùng toạ độ để bấm.
export const BOARD = { x: 40, y: 84, w: 880, h: 326 };
export function tileRect(i, map) {
  const cw = BOARD.w / map.cols, ch = BOARD.h / map.rows, c = i % map.cols, r = (i / map.cols) | 0;
  return { x: BOARD.x + c * cw + 5, y: BOARD.y + r * ch + 5, w: cw - 10, h: ch - 10 };
}
