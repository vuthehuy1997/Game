import { $ } from '../../../platform/core/util.js';
import { outlinedText } from '../../../platform/art/draw.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { BUILDING_DEFS } from './data.js';
import { S } from './save.js';
import { unlockedKinds } from './buildings.js';

const cv = $('cv'), ctx = cv.getContext('2d');
export function render() {
  const sky = ctx.createLinearGradient(0, 0, 0, 540);
  sky.addColorStop(0, '#2a3b2a'); sky.addColorStop(1, '#4a6b3a');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, 960, 540);
  ctx.textAlign = 'left';
  outlinedText(ctx, `Vàng: ${Math.floor(S.gold)}`, 16, 36, `26px ${FD}`, '#ffe6a8');
  outlinedText(ctx, `Lương thực: ${Math.floor(S.food)}`, 16, 64, `18px ${FB}`, '#fff');
  ctx.textAlign = 'right';
  outlinedText(ctx, `Dân số: ${S.pop}`, 944, 36, `26px ${FD}`, '#ffe6a8');
  const locked = Object.keys(BUILDING_DEFS).filter(k => !unlockedKinds().includes(k));
  if (locked.length) {
    const next = locked.reduce((a, b) => BUILDING_DEFS[a].unlockAt < BUILDING_DEFS[b].unlockAt ? a : b);
    outlinedText(ctx, `Mở ${BUILDING_DEFS[next].name} ở dân số ${BUILDING_DEFS[next].unlockAt}`, 944, 64, `14px ${FB}`, '#a3a8b8');
  }
}
