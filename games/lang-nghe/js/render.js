import { $ } from '../../../platform/core/util.js';
import { outlinedText } from '../../../platform/art/draw.js';
import { drawParticles, drawTexts } from '../../../platform/core/fx.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { G } from './state.js';
import { S } from './save.js';
import { ACHIEVEMENTS } from './data.js';
import { incomePerSec, fmt } from './clicker.js';
import { drawScene } from './scene.js';

const cv = $('cv'), ctx = cv.getContext('2d');
export function render() {
  drawScene(ctx, G.t);
  drawParticles(ctx, G.t); drawTexts(ctx, FB);

  ctx.textAlign = 'center';
  outlinedText(ctx, `${fmt(S.wealth)} xu`, 480, 56, `46px ${FD}`, '#ffe6a8');
  outlinedText(ctx, `+${fmt(incomePerSec())}/giây · mỗi lần bấm +${S.perClick}`, 480, 84, `17px ${FB}`, '#f3efe6');

  ctx.textAlign = 'left';
  G.log.slice(-2).forEach((l, i) => outlinedText(ctx, l.txt, 24, 124 + i * 22, `15px ${FB}`, '#fff6dc'));

  ctx.textAlign = 'right';
  outlinedText(ctx, `Thành tựu ${S.achv.length}/${ACHIEVEMENTS.length}`, 936, 30, `17px ${FB}`, '#fff');
  if (G.festival > 0) outlinedText(ctx, `Hội làng · x2 · còn ${Math.ceil(G.festival)}s`, 936, 54, `17px ${FB}`, '#ffd35a');
}
