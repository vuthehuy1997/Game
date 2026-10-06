import { $ } from '../../../platform/core/util.js';
import { rr, outlinedText } from '../../../platform/art/draw.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { BUILDING_DEFS, EVENT_DEFS, milestoneFor } from './data.js';
import { S } from './save.js';
import { incomePerSec, unlockedKinds } from './buildings.js';
import { EV, eventMult } from './events.js';
import { COLS, ROWS, plotBox } from './state.js';
import { dayFrac, drawSky, drawGround, drawTile, drawBuilding } from './scene.js';

const cv = $('cv'), ctx = cv.getContext('2d');

export function render() {
  const t = Date.now() / 1000, frac = dayFrac();
  drawSky(ctx, frac, t);
  drawGround(ctx, frac);
  for (let i = 0; i < COLS * ROWS; i++) drawTile(ctx, i, !!S.grid[i]);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const i = r * COLS + c, kind = S.grid[i];
    if (!kind) continue;
    const b = plotBox(i);
    drawBuilding(ctx, kind, b.x + b.w / 2, b.y + b.h - 6, t);
  }
  if (EV.phase !== 'idle') drawEvent(t);
  drawHud();
}

function panel(x, y, w, h) {
  ctx.fillStyle = 'rgba(16,14,10,.62)'; rr(ctx, x, y, w, h, 10); ctx.fill();
  ctx.strokeStyle = 'rgba(202,166,90,.7)'; ctx.lineWidth = 2; ctx.stroke();
}

function drawHud() {
  const inc = incomePerSec(), fm = eventMult('food');
  panel(12, 62, 262, 80);
  ctx.textAlign = 'left';
  outlinedText(ctx, `Vàng  ${Math.floor(S.gold)}`, 26, 92, `22px ${FD}`, '#ffe6a8');
  outlinedText(ctx, `Lương thực  ${Math.floor(S.food)}`, 26, 122, `18px ${FB}`, '#fff');
  ctx.textAlign = 'right';
  outlinedText(ctx, `+${inc.gold.toFixed(1)}/giây`, 262, 92, `14px ${FB}`, '#bfe6a0');
  outlinedText(ctx, `+${(inc.food * fm).toFixed(1)}/giây`, 262, 122, `14px ${FB}`, '#bfe6a0');

  const m = milestoneFor(S.pop), locked = Object.keys(BUILDING_DEFS).filter(k => !unlockedKinds().includes(k));
  panel(658, 10, 290, 84);
  ctx.textAlign = 'right';
  outlinedText(ctx, `Dân số  ${S.pop}`, 936, 40, `24px ${FD}`, '#ffe6a8');
  outlinedText(ctx, m.reign, 936, 64, `15px ${FB}`, '#caa65a');
  outlinedText(ctx, locked.length ? `Mở ${BUILDING_DEFS[nextLocked(locked)].name} ở dân số ${BUILDING_DEFS[nextLocked(locked)].unlockAt}` : m.title, 936, 84, `14px ${FB}`, '#a3a8b8');
}
const nextLocked = locked => locked.reduce((a, b) => BUILDING_DEFS[a].unlockAt < BUILDING_DEFS[b].unlockAt ? a : b);

function drawEvent(t) {
  const d = EVENT_DEFS[EV.kind], isFlood = EV.kind === 'flood', warn = EV.phase === 'warn';
  const col = isFlood ? '#5aa7e6' : '#e9b949';
  ctx.fillStyle = `rgba(20,14,10,${warn ? .55 + Math.sin(t * 6) * .25 : .8})`; rr(ctx, 300, 100, 360, 36, 10); ctx.fill();
  ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
  ctx.textAlign = 'center';
  outlinedText(ctx, warn ? 'Cảnh báo: ' + d.title : d.title, 480, 124, `16px ${FB}`, col);
  if (isFlood && !warn) for (let i = 0; i < 14; i++) {
    const x = (i * 71 + t * 180) % 960, y = 170 + ((i * 37 + t * 240) % 340);
    ctx.strokeStyle = 'rgba(120,190,240,.55)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 10); ctx.stroke();
  }
}
