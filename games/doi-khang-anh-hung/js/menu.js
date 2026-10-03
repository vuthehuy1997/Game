// Màn chọn trước trận: điều khiển bằng action đã có sẵn (không cần bộ phím mới).
// cursor1/cursor2: chỉ số trong danh sách tướng; p2cpu: true/false; stageCursor: chỉ số sân.
import { pressed } from '../../../platform/core/input.js';
import { FIGHTERS, STAGES } from './data.js';
import { resetRound } from './state.js';

export const FIGHTER_IDS = Object.keys(FIGHTERS);
export const STAGE_IDS = Object.keys(STAGES);

export function newSelect() {
  return { mode: 'select', cursor1: 0, cursor2: 1, p2cpu: true, diff: 'normal', stageCursor: 0 };
}

export function updateSelect(sel) {
  if (pressed.has('p1_left')) sel.cursor1 = (sel.cursor1 + FIGHTER_IDS.length - 1) % FIGHTER_IDS.length;
  if (pressed.has('p1_right')) sel.cursor1 = (sel.cursor1 + 1) % FIGHTER_IDS.length;
  if (pressed.has('p2_left')) sel.cursor2 = (sel.cursor2 + FIGHTER_IDS.length - 1) % FIGHTER_IDS.length;
  if (pressed.has('p2_right')) sel.cursor2 = (sel.cursor2 + 1) % FIGHTER_IDS.length;
  if (pressed.has('p1_special')) sel.p2cpu = !sel.p2cpu;
  if (pressed.has('p2_special')) sel.diff = sel.diff === 'easy' ? 'normal' : sel.diff === 'normal' ? 'hard' : 'easy';
  if (pressed.has('p1_jump')) sel.stageCursor = (sel.stageCursor + 1) % STAGE_IDS.length;
  if (pressed.has('p1_light') || pressed.has('p2_light')) sel.confirm = true;
}

// Bố cục ảnh chân dung tướng trên màn chọn (dùng chung giữa render.js vẽ và việc bắt bấm chuột/chạm ở đây,
// để vị trí vẽ và vùng bấm luôn khớp nhau). PORTRAIT_R: bán kính ảnh tròn. ROW1/ROW2_Y: tâm hàng P1/P2.
export const PORTRAIT_R = 42;
const PORTRAIT_STEP = 98, PORTRAIT_START_X = 235;
export const portraitX = i => PORTRAIT_START_X + i * PORTRAIT_STEP;
export const ROW1_Y = 150, ROW2_Y = 300;

// Bấm/chạm vào một ảnh tướng: đổi cursor1 (hàng P1) hoặc cursor2 (hàng P2, chỉ khi P2 đang là Người).
// mx, my: toạ độ theo không gian canvas 960×540 (đã quy đổi từ toạ độ màn hình thật).
export function pickFromClick(sel, mx, my) {
  const row = Math.abs(my - ROW1_Y) <= PORTRAIT_R ? 1 : Math.abs(my - ROW2_Y) <= PORTRAIT_R ? 2 : 0;
  if (!row || (row === 2 && sel.p2cpu)) return false;
  for (let i = 0; i < FIGHTER_IDS.length; i++) {
    if (Math.abs(mx - portraitX(i)) <= PORTRAIT_R) {
      if (row === 1) sel.cursor1 = i; else sel.cursor2 = i;
      return true;
    }
  }
  return false;
}

export function startMatch(G, sel) {
  G.p1id = FIGHTER_IDS[sel.cursor1]; G.p2id = FIGHTER_IDS[sel.cursor2];
  G.stageId = STAGE_IDS[sel.stageCursor]; G.p2cpu = sel.p2cpu; G.diff = sel.diff;
  G.round = 1; G.wins = [0, 0]; G.banner = null; G.mode = 'fight';
  resetRound(G);
}
