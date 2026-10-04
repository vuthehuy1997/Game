import { $ } from '../../../platform/core/util.js';
import { outlinedText, ell } from '../../../platform/art/draw.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { G } from './state.js';
import { S } from './save.js';
import { autoPerSec, fmt } from './clicker.js';

const cv = $('cv'), ctx = cv.getContext('2d');
export function render() {
  ctx.fillStyle = '#12141a'; ctx.fillRect(0, 0, 960, 540);
  ctx.textAlign = 'center';
  outlinedText(ctx, fmt(S.wealth), 480, 140, `56px ${FD}`, '#ffe6a8');
  outlinedText(ctx, `+${fmt(autoPerSec())} / giây · bấm +${S.perClick}`, 480, 180, `18px ${FB}`, '#a3a8b8');
  const s = 1 + G.pulse * .25;
  ctx.save(); ctx.translate(480, 300); ctx.scale(s, s);
  ell(ctx, 0, 0, 70, 70, '#6b8f3a'); ell(ctx, 0, -10, 40, 30, '#8a6a3e');
  ctx.restore();
  outlinedText(ctx, 'Bấm vào làng để sản xuất', 480, 400, `16px ${FB}`, '#fff');
}
