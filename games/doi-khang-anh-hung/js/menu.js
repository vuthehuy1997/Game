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

export function startMatch(G, sel) {
  G.p1id = FIGHTER_IDS[sel.cursor1]; G.p2id = FIGHTER_IDS[sel.cursor2];
  G.stageId = STAGE_IDS[sel.stageCursor]; G.p2cpu = sel.p2cpu; G.diff = sel.diff;
  G.round = 1; G.wins = [0, 0]; G.banner = null; G.mode = 'fight';
  resetRound(G);
}
