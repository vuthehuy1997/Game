import { $ } from '../../../platform/core/util.js';
import { drawChibi } from '../../../platform/art/chibi.js';
import { POSES } from '../../../platform/art/poses.js';
import { rr, ell, shade, outlinedText, groundShadow } from '../../../platform/art/draw.js';
import { drawParticles, drawTexts } from '../../../platform/core/fx.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { LEVELS } from './data.js';
import { G, W, GROUND_Y, ANCHOR, PROJ_R, AMMO, AMMO_BUTTONS, blocks, targets, proj } from './state.js';
import { trajectoryPoints } from './physics.js';

const cv = $('cv'), ctx = cv.getContext('2d');
const ENEMY_LOOK = { skin: '#e3b98f', hair: '#201810', shirt: '#7a2d2d', trim: '#c99a4a', pants: '#2a2020', belt: '#c99a4a', hat: 'mongol', cap: '#3a2a1a', fur: '#d9c7a0', weapon: 'glaive', scale: .42 };
const TAU = Math.PI * 2, FALL_TIME = 1.2;

export function render() {
  const lv = Math.max(0, G.level), L = LEVELS[lv];
  ctx.save();
  if (G.shake > 0) ctx.translate((Math.random() - .5) * G.shake, (Math.random() - .5) * G.shake);
  drawSky(L, lv);
  drawFar(lv);
  drawMeadow();
  drawAnchor();
  for (const b of blocks) drawWall(b);
  for (const t of targets) drawEnemy(t);
  if (proj) drawProj(proj);
  if (G.dragging) drawAim();
  drawParticles(ctx, G.t); drawTexts(ctx, FB);
  ctx.restore();
  drawHud(L);
}

function drawSky(L, lv) {
  const sky = ctx.createLinearGradient(0, 0, 0, 420);
  sky.addColorStop(0, L.sky[0]); sky.addColorStop(1, L.sky[1]);
  ctx.fillStyle = sky; ctx.fillRect(-20, -20, W + 40, 440);
  if (lv === 5) {
    ell(ctx, 800, 80, 30, 30, '#f4f0d8'); ell(ctx, 790, 72, 26, 26, 'rgba(0,0,0,.08)');
  } else ell(ctx, 800, 84, 38, 38, 'rgba(255,240,200,.9)');
  // mây trôi chậm, lặp lại
  [[120, 70, 1.4, 10], [430, 110, 1, 7], [700, 50, 1.2, 13]].forEach(([x0, y, s, sp]) => {
    const x = ((x0 + G.t * sp) % (W + 200)) - 100;
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ell(ctx, x, y, 40 * s, 14 * s, 'rgba(255,255,255,.75)'); ell(ctx, x + 30 * s, y - 8 * s, 28 * s, 16 * s, 'rgba(255,255,255,.75)'); ell(ctx, x - 26 * s, y - 4 * s, 22 * s, 12 * s, 'rgba(255,255,255,.75)');
  });
}

// Đường núi/đồi cuộn theo chiều ngang với chu kỳ đúng bằng W nên lặp liền mạch.
function ridge(offset, base, amp, layers, col) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, 540);
  for (let x = 0; x <= W; x += 6) {
    const wx = x + offset; let h = 0;
    for (const [k, w, ph] of layers) h += w * Math.sin(TAU * k * wx / W + ph);
    ctx.lineTo(x, base + amp * h);
  }
  ctx.lineTo(W, 540); ctx.closePath(); ctx.fill();
}
function drawFar(lv) {
  const far = shade(LEVELS[lv].sky[1], -60), mid = shade(LEVELS[lv].sky[1], -95);
  ridge((G.t * 6) % W, 300, -70, [[1, .5, .3], [2, .3, 1.2], [3, .2, 2.1]], far);
  ridge((G.t * 16) % W, 350, -42, [[2, .5, .9], [4, .3, .2], [5, .2, 1.7]], mid);
  drawRiver();
  drawBamboo(30, 1); drawBamboo(W - 30, -1);
}
function drawRiver() {
  const g = ctx.createLinearGradient(0, 384, 0, 412);
  g.addColorStop(0, '#5aa6c4'); g.addColorStop(1, '#2f7396');
  ctx.fillStyle = g; ctx.fillRect(0, 386, W, 24);
  ctx.fillStyle = 'rgba(255,255,255,.45)';
  for (let i = 0; i < 14; i++) {
    const x = ((i * 97 + G.t * 60) % (W + 60)) - 30;
    ctx.fillRect(x, 394 + (i % 3) * 5, 22, 2);
  }
}
function drawMeadow() {
  const g = ctx.createLinearGradient(0, 410, 0, GROUND_Y + 60);
  g.addColorStop(0, '#8fbf66'); g.addColorStop(1, '#5f9a4a');
  ctx.fillStyle = g; ctx.fillRect(0, 410, W, 540 - 410);
  ctx.fillStyle = 'rgba(120,90,50,.35)'; ctx.beginPath(); ctx.ellipse(W / 2, 500, 560, 26, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(0, GROUND_Y, W, 3);
}
function drawBamboo(x, side) {
  const sway = Math.sin(G.t * 1.1 + side) * 3;
  for (let i = 0; i < 4; i++) {
    const bx = x + (i - 1.5) * 12 * side, h = 250 + (i % 2) * 40;
    ctx.fillStyle = i % 2 ? '#4f7d3a' : '#6aa04c';
    ctx.beginPath(); ctx.moveTo(bx - 4, 540); ctx.lineTo(bx - 4 + sway * .4, 540 - h); ctx.lineTo(bx + 4 + sway * .4, 540 - h); ctx.lineTo(bx + 4, 540); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    for (let y = 540 - 60; y > 540 - h; y -= 46) ctx.fillRect(bx - 4 + sway * .4, y, 8, 2);
  }
}
function drawAnchor() {
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(ctx, ANCHOR.x, GROUND_Y + 4, 30, 6, 'rgba(0,0,0,.2)');
  ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(ANCHOR.x - 18, GROUND_Y); ctx.lineTo(ANCHOR.x - 12, ANCHOR.y - 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ANCHOR.x + 18, GROUND_Y); ctx.lineTo(ANCHOR.x + 12, ANCHOR.y - 10); ctx.stroke();
  if (!G.dragging) {
    ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(ANCHOR.x - 12, ANCHOR.y - 10); ctx.lineTo(ANCHOR.x, ANCHOR.y); ctx.lineTo(ANCHOR.x + 12, ANCHOR.y - 10); ctx.stroke();
  }
}

// Hàng rào gỗ: thanh tre dọc, dây buộc ngang; rung khi vừa trúng đạn, nứt khi máu còn ít.
function drawWall(b) {
  const jolt = b.hurtT > 0 ? Math.sin(G.t * 90) * 2.5 * (b.hurtT / .14) : 0;
  const x0 = b.cx - b.w / 2 + jolt, y0 = b.cy - b.h / 2;
  ell(ctx, b.cx, GROUND_Y + 2, b.w * .7, 5, 'rgba(0,0,0,.2)');
  ctx.fillStyle = '#7a5a34'; rr(ctx, x0, y0, b.w, b.h, 4); ctx.fill();
  ctx.strokeStyle = shade('#7a5a34', -35); ctx.lineWidth = Math.max(1.5, b.w / 12);
  const slats = Math.max(2, Math.round(b.w / 13));
  for (let i = 0; i < slats; i++) {
    const sx = x0 + (i + .5) * b.w / slats;
    ctx.beginPath(); ctx.moveTo(sx, y0 + 3); ctx.lineTo(sx, y0 + b.h - 3); ctx.stroke();
  }
  ctx.strokeStyle = '#4a3a1e'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x0, y0 + b.h * .25); ctx.lineTo(x0 + b.w, y0 + b.h * .25); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x0, y0 + b.h * .75); ctx.lineTo(x0 + b.w, y0 + b.h * .75); ctx.stroke();
  if (b.hp < b.hp0 * .6) {
    ctx.strokeStyle = 'rgba(30,20,10,.75)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0 + b.w * .3, y0 + 8); ctx.lineTo(x0 + b.w * .55, y0 + b.h * .45); ctx.lineTo(x0 + b.w * .4, y0 + b.h * .62); ctx.stroke();
  }
  ctx.strokeStyle = shade('#7a5a34', -50); ctx.lineWidth = 2; rr(ctx, x0, y0, b.w, b.h, 4); ctx.stroke();
}

// Quân giặc đứng sau rào; trúng đạn thì nháy trắng và ngả người, gục hẳn xuống rồi mờ dần.
function drawEnemy(t) {
  const feetY = t.cy + t.r * 1.6;
  if (t.dead) {
    const a = Math.max(0, 1 - t.deadT / FALL_TIME);
    groundShadow(ctx, t.cx, feetY, .5 * a);
    drawChibi(ctx, t.cx, feetY, ENEMY_LOOK, { face: -1, t: G.t, alpha: a, ...POSES.dead({ st: t.deadT }) });
    return;
  }
  groundShadow(ctx, t.cx, feetY, .5);
  const hurt = t.hurtT > 0;
  const pose = hurt ? POSES.hurt() : POSES.idle({ t: G.t + (t.ph || 0) });
  drawChibi(ctx, t.cx, feetY, ENEMY_LOOK, { face: -1, t: G.t, flash: hurt ? 1 : 0, ...pose });
}

function drawProj(p) {
  const n = p.trail.length;
  p.trail.forEach((q, i) => {
    const k = (i + 1) / n;
    ell(ctx, q.x, q.y, PROJ_R * k * .6, PROJ_R * k * .6, p.kind === 'dau' ? `rgba(255,150,50,${k * .45})` : `rgba(60,50,40,${k * .3})`);
  });
  if (p.kind === 'dau') {
    ell(ctx, p.x, p.y, 24, 24, 'rgba(255,140,40,.35)');
    ell(ctx, p.x, p.y, 13, 13, '#ff9a2e'); ell(ctx, p.x, p.y, 6, 6, '#ffe08a');
  } else {
    ell(ctx, p.x, p.y, PROJ_R, PROJ_R, '#2a2630');
    ell(ctx, p.x - 4, p.y - 4, 4, 4, 'rgba(255,255,255,.35)');
  }
}

// Dây ná đang căng và đường bay dự kiến (đã tính gió).
function drawAim() {
  const a = G.aim;
  ctx.strokeStyle = '#3a2a18'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(ANCHOR.x - 12, ANCHOR.y - 10); ctx.lineTo(a.x, a.y); ctx.lineTo(ANCHOR.x + 12, ANCHOR.y - 10); ctx.stroke();
  const vx = (ANCHOR.x - a.x) * 7.5, vy = (ANCHOR.y - a.y) * 7.5;
  const pts = trajectoryPoints(ANCHOR.x, ANCHOR.y, vx, vy, G.wind);
  pts.forEach((p, i) => ell(ctx, p.x, p.y, 3.2, 3.2, `rgba(255,255,255,${.7 - i / pts.length * .5})`));
  ell(ctx, a.x, a.y, PROJ_R, PROJ_R, G.ammo === 'dau' ? '#ff9a2e' : '#2a2630');
}

function drawHud(L) {
  ctx.textAlign = 'left'; outlinedText(ctx, `Đạn: ${G.shotsLeft}`, 16, 30, `22px ${FD}`, '#ffe6a8');
  ctx.textAlign = 'center'; outlinedText(ctx, `Màn ${Math.max(0, G.level) + 1}/${LEVELS.length} · ${L.title}`, 480, 30, `20px ${FD}`, '#fff');
  const wind = G.wind;
  ctx.textAlign = 'right';
  outlinedText(ctx, wind ? `Gió ${wind > 0 ? '→' : '←'} ${Math.abs(Math.round(wind))}` : 'Gió lặng', 944, 30, `18px ${FB}`, '#fff');
  if (wind) {
    const dir = Math.sign(wind), len = Math.min(60, Math.abs(wind) * 2.2), base = 914, tip = base + dir * len, y = 46;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(base, y); ctx.lineTo(tip, y);
    ctx.moveTo(tip - dir * 8, y - 6); ctx.lineTo(tip, y); ctx.lineTo(tip - dir * 8, y + 6);
    ctx.stroke();
  }
  for (const b of AMMO_BUTTONS) {
    const off = b.kind === 'dau' && G.fireLeft <= 0, on = G.ammo === b.kind && !off;
    ctx.globalAlpha = off ? .4 : 1;
    ctx.fillStyle = on ? '#caa65a' : 'rgba(20,14,10,.55)';
    rr(ctx, b.x, b.y, b.w, b.h, 8); ctx.fill();
    ctx.strokeStyle = on ? '#fff' : 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.textAlign = 'left';
    const extra = b.kind === 'dau' ? ` ×${G.fireLeft}` : '';
    ctx.font = `17px ${FB}`; ctx.fillStyle = on ? '#201a10' : '#f3efe6';
    ctx.fillText(`${b.key} · ${AMMO[b.kind].name}${extra}`, b.x + 12, b.y + 23);
    ctx.globalAlpha = 1;
  }
}
