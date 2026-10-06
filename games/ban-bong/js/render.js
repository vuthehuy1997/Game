import { $ } from '../../../platform/core/util.js';
import { ell, rr, shade, outlinedText } from '../../../platform/art/draw.js';
import { drawChibi } from '../../../platform/art/chibi.js';
import { POSES } from '../../../platform/art/poses.js';
import { drawParticles, drawTexts } from '../../../platform/core/fx.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { COLS, ROWS, LOSE_ROW, CELL, TOP_Y, BOARD_X0, SHOOTER_X, SHOOTER_Y, COLORS, G, grid, proj } from './state.js';
import { LEVELS } from './data.js';
import { aimPath } from './physics.js';

const cv = $('cv'), ctx = cv.getContext('2d');
const R = CELL * .42, BOARD_W = COLS * CELL, BOARD_H = ROWS * CELL;
const ARCHER = { skin: '#f0cf9e', hair: '#1c1410', hat: 'khan', khan: '#2f6b57', shirt: '#2f6b57', trim: '#e9b949', pants: '#2a2630', belt: '#e9b949', weapon: 'bow', scale: 1.05 };
const ARCHER_X = SHOOTER_X - 46;
const cellX = c => BOARD_X0 + c * CELL + CELL / 2;
const cellY = r => TOP_Y + r * CELL + CELL / 2;

// Hậu cảnh vẽ một lần vào canvas phụ, mỗi khung hình chỉ chép sang
const backdrop = document.createElement('canvas');
backdrop.width = 960; backdrop.height = 540;
paintBackdrop(backdrop.getContext('2d'));

export function render() {
  ctx.drawImage(backdrop, 0, 0);
  drawLoseLine();
  drawBoard();
  drawFalling();
  if (G.mode === 'aim') drawAim();
  drawArcher();
  drawHeld();
  if (proj) bubble(proj.x, proj.y, R, COLORS[proj.color - 1]);
  drawParticles(ctx, G.t); drawTexts(ctx, FB);
  drawHud();
  drawBanner();
}

function paintBackdrop(c) {
  const sky = c.createLinearGradient(0, 0, 0, 330);
  sky.addColorStop(0, '#2a1d3c'); sky.addColorStop(.5, '#7d4560'); sky.addColorStop(1, '#f2b97a');
  c.fillStyle = sky; c.fillRect(0, 0, 960, 330);
  const glow = c.createRadialGradient(780, 110, 6, 780, 110, 170);
  glow.addColorStop(0, 'rgba(255,236,186,.9)'); glow.addColorStop(1, 'rgba(255,236,186,0)');
  c.fillStyle = glow; c.fillRect(600, 0, 360, 330);
  ell(c, 780, 110, 42, 42, '#ffefc4');
  ridge(c, 300, '#6b4a6e', 18, .011, 1.3);
  ridge(c, 318, '#4a3556', 12, .017, 2.6);
  const field = c.createLinearGradient(0, 318, 0, 540);
  field.addColorStop(0, '#7b9446'); field.addColorStop(.45, '#4f7233'); field.addColorStop(1, '#263f1f');
  c.fillStyle = field; c.fillRect(0, 318, 960, 222);
  for (let i = 0; i < 7; i++) {
    c.fillStyle = `rgba(200,236,240,${.16 - i * .015})`; c.fillRect(0, 350 + i * i * 4 + i * 6, 960, 3);
  }
  temple(c, 118, 'L'); temple(c, 842, 'R');
  c.fillStyle = 'rgba(14,8,14,.62)'; rr(c, BOARD_X0 - 16, TOP_Y - 6, BOARD_W + 32, BOARD_H + 16, 18); c.fill();
  c.strokeStyle = 'rgba(202,166,90,.6)'; c.lineWidth = 3; c.stroke();
}
function ridge(c, base, col, amp, freq, ph) {
  c.fillStyle = col; c.beginPath(); c.moveTo(0, 540);
  for (let x = 0; x <= 960; x += 12) c.lineTo(x, base - amp * (1 + Math.sin(x * freq + ph)) - 8 * Math.sin(x * freq * .37 + ph * 2));
  c.lineTo(960, 540); c.closePath(); c.fill();
}
// Đền hai bên: các tầng mái cong và cột gỗ, chỉ lộ ra ở hai mép màn
function temple(c, cx, side) {
  const pillarX = side === 'L' ? [30, 200] : [720, 890];
  c.fillStyle = '#4a2f2a';
  for (const x of pillarX) { c.fillRect(x, 230, 14, 110); c.fillStyle = '#c9a449'; c.fillRect(x - 3, 226, 20, 6); c.fillStyle = '#4a2f2a'; }
  roofTier(c, cx, 218, 230, 46, '#3a2430');
  roofTier(c, cx, 170, 176, 40, '#4e2f3a');
  roofTier(c, cx, 124, 118, 34, '#6a3a40');
}
function roofTier(c, cx, y, w, h, col) {
  const l = cx - w / 2, r = cx + w / 2;
  c.fillStyle = col; c.beginPath();
  c.moveTo(l - 14, y - h * .2);
  c.quadraticCurveTo(l + w * .15, y + h * .35, l + w * .35, y);
  c.quadraticCurveTo(cx, y - h * .25, r - w * .35, y);
  c.quadraticCurveTo(r - w * .15, y + h * .35, r + 14, y - h * .2);
  c.lineTo(r - 4, y + h * .6); c.lineTo(l + 4, y + h * .6); c.closePath(); c.fill();
  c.fillStyle = shade(col, -30); c.fillRect(l + 6, y + h * .6, w - 12, h * .2);
}

// Bóng: gradient cầu, điểm sáng và viền tối để nổi trên nền
function bubble(x, y, r, col) {
  const g = ctx.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r);
  g.addColorStop(0, shade(col, 90)); g.addColorStop(.55, col); g.addColorStop(1, shade(col, -70));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 1.5; ctx.stroke();
  ell(ctx, x - r * .35, y - r * .42, r * .22, r * .14, 'rgba(255,255,255,.7)', -.5);
}
function drawBoard() {
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const k = grid[r][c]; if (k) bubble(cellX(c), cellY(r), R, COLORS[k - 1]);
  }
}
function drawLoseLine() {
  const y = TOP_Y + LOSE_ROW * CELL;
  ctx.save(); ctx.setLineDash([8, 6]); ctx.strokeStyle = 'rgba(233,87,74,.6)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(BOARD_X0, y); ctx.lineTo(BOARD_X0 + BOARD_W, y); ctx.stroke(); ctx.restore();
}
function drawFalling() {
  for (const f of G.falling) { ctx.globalAlpha = Math.max(0, 1 - f.t * 1.1); bubble(f.x, f.y, R, COLORS[f.color - 1]); }
  ctx.globalAlpha = 1;
}
function drawAim() {
  const pts = aimPath(G.aimX, G.aimY);
  for (let i = 2; i < pts.length; i += 3) {
    ell(ctx, pts[i].x, pts[i].y, 2.6, 2.6, `rgba(255,240,200,${(.6 * (1 - i / pts.length)).toFixed(3)})`);
  }
}
// Cung thủ chibi đứng trên đài đá: tay trước cầm cung, tay sau kéo dây; bắn xong dây buông rồi kéo lại
function drawArcher() {
  ell(ctx, ARCHER_X, 538, 62, 11, 'rgba(0,0,0,.3)');
  ell(ctx, ARCHER_X, 534, 56, 9, '#6e6a5e'); ell(ctx, ARCHER_X, 531, 52, 8, '#8b867a');
  const release = G.recoil;
  drawChibi(ctx, ARCHER_X, 532, ARCHER, { face: 1, t: G.t, ...POSES.idle({ t: G.t }), armF: 1.5, armB: -.2 - .85 * (1 - release) });
}
function drawHeld() {
  bubble(SHOOTER_X, SHOOTER_Y, R, COLORS[G.cur - 1]);
  bubble(SHOOTER_X + 86, SHOOTER_Y + 6, R * .62, COLORS[G.next - 1]);
  ctx.textAlign = 'center'; outlinedText(ctx, 'Tiếp', SHOOTER_X + 86, SHOOTER_Y + 36, `14px ${FB}`, '#f3efe6');
}
function drawHud() {
  const lv = LEVELS[G.level];
  if (!lv) return;
  ctx.fillStyle = 'rgba(12,8,14,.6)'; rr(ctx, 16, 8, 928, 32, 10); ctx.fill();
  ctx.textAlign = 'left'; outlinedText(ctx, `Màn ${G.level + 1} · ${lv.name}`, 132, 31, `18px ${FD}`, '#ffe6a8');
  ctx.textAlign = 'center'; outlinedText(ctx, `Điểm ${G.score}`, 480, 31, `18px ${FB}`, '#fff');
  ctx.textAlign = 'right'; outlinedText(ctx, `Combo x${Math.max(1, G.combo)}`, 930, 31, `18px ${FB}`, G.combo >= 2 ? '#ff9a5a' : '#cfd3dd');
}
function drawBanner() {
  const b = G.banner;
  if (!b || G.mode === 'menu' || G.mode === 'result') return;
  const T = 3.6;
  if (b.t >= T) return;
  ctx.globalAlpha = Math.max(0, Math.min(1, b.t * 3, (T - b.t) * 2));
  const lines = wrap(b.lore, 520, `18px ${FB}`), h = 64 + lines.length * 26, top = 250 - h / 2;
  ctx.fillStyle = 'rgba(16,10,16,.72)'; rr(ctx, 190, top, 580, h, 14); ctx.fill();
  ctx.strokeStyle = 'rgba(202,166,90,.7)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.textAlign = 'center';
  outlinedText(ctx, `Màn ${G.level + 1} · ${b.title}`, 480, top + 42, `32px ${FD}`, '#ffd35a');
  lines.forEach((l, i) => outlinedText(ctx, l, 480, top + 74 + i * 26, `18px ${FB}`, '#fff'));
  ctx.globalAlpha = 1;
}
function wrap(text, maxW, font) {
  ctx.font = font;
  const lines = []; let cur = '';
  for (const w of text.split(' ')) {
    const t = cur ? cur + ' ' + w : w;
    if (cur && ctx.measureText(t).width > maxW) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}
