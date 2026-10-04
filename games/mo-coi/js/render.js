import { $ } from '../../../platform/core/util.js';
import { outlinedText } from '../../../platform/art/draw.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { S } from './save.js';

const cv = $('cv'), ctx = cv.getContext('2d');
export function render() {
  ctx.fillStyle = '#12141a'; ctx.fillRect(0, 0, 960, 540);
  const mine = S.owner.filter(o => o === 1).length;
  ctx.textAlign = 'left'; outlinedText(ctx, `Vùng kiểm soát: ${mine}/${S.owner.length}`, 16, 34, `22px ${FD}`, '#ffe6a8');
  ctx.textAlign = 'right'; outlinedText(ctx, 'Mở Cõi', 944, 34, `18px ${FB}`, '#fff');
}
