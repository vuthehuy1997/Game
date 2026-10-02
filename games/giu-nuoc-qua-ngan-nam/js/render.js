// Vẽ chiến trường. Task 2 thêm Nhà chính/lô đất/HUD, Task 4 thêm lính, Task 5 thêm đạn.
import { $ } from '../../../platform/core/util.js';

const cv = $('cv'), ctx = cv.getContext('2d');
const W_FALLBACK = 960, H_FALLBACK = 540;

export function render() {
  ctx.fillStyle = '#12141a';
  ctx.fillRect(0, 0, W_FALLBACK, H_FALLBACK);
}
