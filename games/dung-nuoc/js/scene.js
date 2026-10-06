// Vẽ cảnh làng: bầu trời ngày/đêm, ô đất, công trình có hoạt ảnh. Không đụng DOM nên meta.js dùng lại được.
import { rr, ell, shade } from '../../../platform/art/draw.js';
import { plotBox } from './state.js';

const CYCLE = 240; // giây cho một ngày đầy đủ
const SKY = [
  [0, '#1d2b4a', '#3d4f7a'], [.22, '#f2a57a', '#ffd9a0'], [.42, '#8fd0f0', '#e8f7e0'],
  [.7, '#e58a5a', '#5a3d6e'], [.85, '#1d2b4a', '#3d4f7a'], [1, '#1d2b4a', '#3d4f7a'],
];

export function dayFrac(now = Date.now()) { return ((now / 1000) % CYCLE) / CYCLE; }

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const toCss = c => `rgb(${c.map(v => Math.round(v)).join(',')})`;
export function skyPalette(frac) {
  let i = 0;
  while (i < SKY.length - 2 && frac > SKY[i + 1][0]) i++;
  const [f0, t0, b0] = SKY[i], [f1, t1, b1] = SKY[i + 1];
  const k = Math.min(1, Math.max(0, (frac - f0) / (f1 - f0)));
  const mix = (a, b) => hex(a).map((v, j) => v + (hex(b)[j] - v) * k);
  return [toCss(mix(t0, t1)), toCss(mix(b0, b1))];
}

export function drawSky(ctx, frac, t) {
  const [top, bot] = skyPalette(frac);
  const g = ctx.createLinearGradient(0, 0, 0, 160);
  g.addColorStop(0, top); g.addColorStop(1, bot);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 160);
  const night = frac > .85 || frac < .15;
  const sunA = frac * Math.PI * 2 - Math.PI / 2;
  const bx = 480 + Math.cos(sunA) * 420, by = 150 + Math.sin(sunA) * 150;
  if (night) {
    ell(ctx, bx, by, 16, 16, '#f4f0d8');
    for (let i = 0; i < 24; i++) ell(ctx, (i * 137) % 960, (i * 53) % 110, 1.3, 1.3, 'rgba(255,255,255,.7)');
  } else {
    ell(ctx, bx, by, 22, 22, 'rgba(255,220,120,.35)'); ell(ctx, bx, by, 14, 14, '#ffd35a');
  }
  const cloud = (x, y, s) => { ell(ctx, x, y, 34 * s, 12 * s, 'rgba(255,255,255,.55)'); ell(ctx, x + 18 * s, y - 6 * s, 20 * s, 12 * s, 'rgba(255,255,255,.55)'); };
  cloud((160 + t * 6) % 1100 - 100, 58, 1); cloud((620 + t * 4) % 1100 - 100, 40, .8);
  ctx.fillStyle = shade('#3a5a3a', night ? -40 : 0);
  ctx.beginPath(); ctx.moveTo(0, 150);
  for (let x = 0; x <= 960; x += 60) ctx.lineTo(x, 128 + Math.sin(x * .02) * 10);
  ctx.lineTo(960, 160); ctx.lineTo(0, 160); ctx.closePath(); ctx.fill();
}

export function drawGround(ctx, frac) {
  const night = frac > .85 || frac < .15;
  const g = ctx.createLinearGradient(0, 150, 0, 540);
  g.addColorStop(0, night ? '#2a3d2a' : '#6aa04e'); g.addColorStop(1, night ? '#17241a' : '#3f6b34');
  ctx.fillStyle = g; ctx.fillRect(0, 150, 960, 390);
  ctx.fillStyle = night ? '#1a4a6a' : '#3f8fb5';
  ctx.beginPath(); ctx.moveTo(0, 520);
  for (let x = 0; x <= 960; x += 40) ctx.lineTo(x, 520 + Math.sin(x * .05) * 4);
  ctx.lineTo(960, 540); ctx.lineTo(0, 540); ctx.closePath(); ctx.fill();
}

export function drawTile(ctx, i, filled) {
  const b = plotBox(i), x = b.x + 3, y = b.y + 3, w = b.w - 6, h = b.h - 6;
  ctx.fillStyle = filled ? '#8a6a3e' : '#7a9a4a';
  rr(ctx, x, y, w, h, 8); ctx.fill();
  ctx.strokeStyle = filled ? '#5a4226' : '#5f7d3a'; ctx.lineWidth = 2; ctx.stroke();
}

const roof = (ctx, cx, y, w, h, col) => {
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(cx - w / 2 - 8, y + h);
  ctx.quadraticCurveTo(cx - w / 2 + 4, y + h * .15, cx - w * .2, y);
  ctx.lineTo(cx + w * .2, y);
  ctx.quadraticCurveTo(cx + w / 2 - 4, y + h * .15, cx + w / 2 + 8, y + h);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = shade(col, -40); ctx.lineWidth = 1.5;
  for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(cx - w * .5 + k * w * .12, y + h - 2); ctx.lineTo(cx - w * .2 + k * w * .1, y + 3); ctx.stroke(); }
};
const shadowOf = (ctx, cx, by, w) => ell(ctx, cx, by + 2, w * .55, 5, 'rgba(0,0,0,.25)');

// Vẽ công trình đứng trên đáy ô có tâm x=cx, chân tại by
export function drawBuilding(ctx, kind, cx, by, t) {
  shadowOf(ctx, cx, by, 60);
  if (kind === 'house') {
    ctx.fillStyle = '#e9dcc0'; ctx.fillRect(cx - 24, by - 26, 48, 26);
    ctx.fillStyle = '#6b4424'; ctx.fillRect(cx - 6, by - 14, 12, 14);
    roof(ctx, cx, by - 46, 60, 22, '#4f6b5a');
  } else if (kind === 'farm') {
    for (let r = 0; r < 3; r++) {
      ctx.fillStyle = '#5a3d22'; ctx.fillRect(cx - 34, by - 8 - r * 9, 68, 5);
      for (let i = 0; i < 9; i++) {
        const sx = cx - 30 + i * 8, sway = Math.sin(t * 2 + i * .7 + r) * 3;
        ctx.strokeStyle = '#7cae4a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(sx, by - 10 - r * 9); ctx.quadraticCurveTo(sx + sway, by - 22 - r * 9, sx + sway * 1.5, by - 28 - r * 9); ctx.stroke();
        ell(ctx, sx + sway * 1.5, by - 27 - r * 9, 2, 3.5, '#e9b949');
      }
    }
  } else if (kind === 'market') {
    ctx.fillStyle = '#6b4424'; ctx.fillRect(cx - 30, by - 30, 4, 30); ctx.fillRect(cx + 26, by - 30, 4, 30);
    ctx.fillStyle = '#a57a4a'; ctx.fillRect(cx - 30, by - 12, 60, 6);
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? '#e9d9b0' : '#b3261e';
      ctx.beginPath(); ctx.moveTo(cx - 34 + i * 11.3, by - 40); ctx.lineTo(cx - 34 + (i + 1) * 11.3, by - 40); ctx.lineTo(cx - 34 + (i + .5) * 11.3 + 2, by - 30); ctx.closePath(); ctx.fill();
      ctx.fillRect(cx - 34 + i * 11.3, by - 40, 11.3, 6);
    }
  } else if (kind === 'kiln') {
    ctx.fillStyle = '#8a4a2a'; ctx.beginPath(); ctx.ellipse(cx, by - 18, 26, 22, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff9a3a'; ctx.beginPath(); ctx.ellipse(cx, by - 4, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 3; i++) {
      const p = (t * .4 + i / 3) % 1;
      ell(ctx, cx - 6 + i * 6 + Math.sin(p * 6) * 3, by - 40 - p * 34, 4 + p * 6, 4 + p * 6, `rgba(200,200,200,${.5 * (1 - p)})`);
    }
  } else if (kind === 'well') {
    ell(ctx, cx, by - 10, 20, 9, '#8d8a80'); ell(ctx, cx, by - 12, 14, 6, '#1a2a3a');
    ctx.fillStyle = '#6b4424'; ctx.fillRect(cx - 22, by - 40, 4, 30); ctx.fillRect(cx + 18, by - 40, 4, 30);
    roof(ctx, cx, by - 52, 54, 16, '#8a3b1f');
  } else if (kind === 'granary') {
    ctx.fillStyle = '#b08a52'; ctx.fillRect(cx - 26, by - 30, 52, 30);
    ctx.fillStyle = '#c9a46a'; ctx.beginPath(); ctx.ellipse(cx, by - 30, 26, 18, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7a5a34'; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(cx - 26 + i * 17, by - 30); ctx.lineTo(cx - 26 + i * 17, by); ctx.stroke(); }
  } else if (kind === 'temple') {
    ctx.fillStyle = '#8a2a1e'; ctx.fillRect(cx - 22, by - 30, 44, 30);
    ctx.fillStyle = '#3a1a10'; ctx.fillRect(cx - 7, by - 16, 14, 16);
    roof(ctx, cx, by - 40, 66, 14, '#4a3a2a');
    roof(ctx, cx, by - 54, 50, 12, '#4a3a2a');
    roof(ctx, cx, by - 66, 34, 10, '#4a3a2a');
  }
}
