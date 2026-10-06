import { $ } from '../../../platform/core/util.js';
import { drawChibi } from '../../../platform/art/chibi.js';
import { POSES } from '../../../platform/art/poses.js';
import { ell, rr, shade, outlinedText } from '../../../platform/art/draw.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { ERAS, BUILD, GATE_MAX } from './data.js';
import { G, W, H, GATE_X, LANES, slots, enemies, shots, fires } from './state.js';
import { loadSave, isUnlocked } from './save.js';
import { card, BACK, pal, START, LORE_BTN, OVER_MENU, OVER_NEXT } from './ui.js';

const cv = $('cv'), ctx = cv.getContext('2d');
const PICK_KINDS = ['wall', 'tower', 'pit', 'fire'];

export function render() {
  if (G.mode === 'menu') return drawMenu();
  drawBackdrop(ERAS[G.era]);
  drawGround();
  drawCitadel(ERAS[G.era]);
  for (const s of slots) drawSlot(s);
  for (const e of enemies) drawEnemy(e);
  drawShots();
  drawHud();
  if (G.mode === 'intro') drawLore(ERAS[G.era]);
  if (G.mode === 'over') drawOver();
}

function drawMenu() {
  const save = loadSave();
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1d2630'); g.addColorStop(1, '#0c1014');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  outlinedText(ctx, 'Cổ Thành Ngàn Năm', W / 2, 74, `44px ${FD}`, '#ffe6a8');
  outlinedText(ctx, 'Chọn thời kỳ để giữ thành', W / 2, 104, `18px ${FB}`, '#c9cdd8');
  ERAS.forEach((e, i) => {
    const r = card(i), open = isUnlocked(i);
    ctx.fillStyle = open ? '#2a3442' : '#171c24';
    rr(ctx, r.x, r.y, r.w, r.h, 12); ctx.fill();
    ctx.strokeStyle = open ? e.accent : '#353d4b'; ctx.lineWidth = 2; ctx.stroke();
    drawCitadelMini(r.x + r.w / 2, r.y + 74, open ? e.accent : '#4a5260');
    ctx.textAlign = 'center';
    outlinedText(ctx, e.name, r.x + r.w / 2, r.y + 26, `20px ${FD}`, open ? '#fff' : '#7d8594');
    outlinedText(ctx, open ? `${e.year} · ${e.foe}` : 'Chưa mở', r.x + r.w / 2, r.y + 150, `15px ${FB}`, open ? '#c9cdd8' : '#7d8594');
    if (open) {
      const st = save.stars[i];
      for (let k = 0; k < 3; k++) outlinedText(ctx, '★', r.x + r.w / 2 - 34 + k * 34, r.y + 124, `22px ${FB}`, k < st ? '#ffd35a' : '#4a5260');
    }
  });
}

function drawCitadelMini(cx, cy, col) {
  ctx.fillStyle = col;
  ctx.fillRect(cx - 40, cy - 22, 80, 44);
  for (let k = -2; k <= 2; k++) ctx.fillRect(cx + k * 16 - 5, cy - 30, 10, 10);
  ctx.fillStyle = '#0c1014'; rr(ctx, cx - 9, cy - 2, 18, 24, 6); ctx.fill();
}

function drawBackdrop(era) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, era.bg[0]); sky.addColorStop(1, era.bg[1]);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  const i = ERAS.indexOf(era);
  ctx.save();
  if (i === 0) {
    ctx.strokeStyle = 'rgba(0,0,0,.14)'; ctx.lineWidth = 6;
    for (const r of [60, 110, 160]) { ctx.beginPath(); ctx.ellipse(120, 300, r * 1.5, r * .9, 0, 0, Math.PI * 2); ctx.stroke(); }
  } else if (i === 1) {
    ctx.fillStyle = 'rgba(20,28,40,.45)';
    ctx.beginPath(); ctx.moveTo(0, 150);
    for (let x = 0; x <= W; x += 80) ctx.lineTo(x, 120 + Math.sin(x * .02) * 26);
    ctx.lineTo(W, 260); ctx.lineTo(0, 260); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(40,70,40,.5)'; ctx.lineWidth = 4;
    for (let x = 20; x < W; x += 56) { ctx.beginPath(); ctx.moveTo(x, 120); ctx.lineTo(x + 6, 40); ctx.stroke(); }
  } else if (i === 2) {
    ctx.fillStyle = 'rgba(70,110,50,.5)';
    for (let k = 0; k < 6; k++) ctx.fillRect(0, 380 + k * 22, W, 10);
  } else if (i === 3) {
    ctx.fillStyle = 'rgba(40,40,50,.35)';
    for (let y = 40; y < 200; y += 26) for (let x = (y / 26) % 2 ? 0 : 30; x < W; x += 60) ctx.fillRect(x, y, 56, 22);
  } else if (i === 4) {
    ctx.fillStyle = 'rgba(40,60,80,.55)'; ctx.fillRect(0, 420, W, 120);
    ctx.fillStyle = 'rgba(30,30,36,.5)';
    for (let x = 620; x < 940; x += 70) ctx.fillRect(x, 150, 48, 120);
  } else {
    ctx.fillStyle = 'rgba(30,44,30,.5)';
    ctx.beginPath(); ctx.moveTo(0, 240);
    for (let x = 0; x <= W; x += 90) ctx.lineTo(x, 160 + Math.sin(x * .03) * 30);
    ctx.lineTo(W, 300); ctx.lineTo(0, 300); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawGround() {
  for (const y of LANES) {
    ctx.fillStyle = 'rgba(90,70,45,.45)'; ctx.fillRect(GATE_X + 40, y - 14, W - GATE_X, 28);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(GATE_X + 40, y + 14, W - GATE_X, 3);
  }
}

function drawCitadel(era) {
  const x0 = 120, y0 = 110, w = GATE_X - x0 + 30, h = 340;
  ctx.fillStyle = shade(era.accent, -90);
  ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2;
  for (let y = y0 + 22; y < y0 + h; y += 26) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + w, y); ctx.stroke(); }
  for (let k = 0; k < 4; k++) ctx.fillRect(x0 + k * 34, y0 - 14, 20, 16);
  ctx.fillStyle = '#1a140e';
  rr(ctx, GATE_X - 44, 240, 46, 110, 22); ctx.fill();
  ctx.strokeStyle = era.accent; ctx.lineWidth = 3; rr(ctx, GATE_X - 44, 240, 46, 110, 22); ctx.stroke();
  const hp = Math.max(0, G.gateHp) / GATE_MAX;
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(GATE_X - 60, 210, 80, 8);
  ctx.fillStyle = hp > .4 ? '#7bd389' : '#e0604e'; ctx.fillRect(GATE_X - 60, 210, 80 * hp, 8);
}

function drawSlot(s) {
  if (!s.b) {
    if (G.mode === 'prep') {
      ctx.setLineDash([5, 6]); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(s.x, s.y, 30, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }
    return;
  }
  const b = s.b, flash = b.flash > 0;
  if (b.kind === 'wall') drawWall(s.x, s.y, b, flash);
  else if (b.kind === 'tower') drawTower(s.x, s.y, b, flash);
  else if (b.kind === 'pit') drawPit(s.x, s.y);
  else if (b.kind === 'fire') drawFire(s.x, s.y, b);
}

function hpBar(x, y, w, frac) {
  if (frac >= 1) return;
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x - w / 2, y, w, 5);
  ctx.fillStyle = frac > .4 ? '#7bd389' : '#e0604e'; ctx.fillRect(x - w / 2, y, w * Math.max(0, frac), 5);
}

function drawWall(x, y, b, flash) {
  ctx.fillStyle = flash ? '#d9c7a0' : '#8a8478';
  rr(ctx, x - 20, y - 46, 40, 92, 4); ctx.fill();
  ctx.fillStyle = shade('#8a8478', -30);
  ctx.fillRect(x - 22, y - 50, 12, 10); ctx.fillRect(x - 4, y - 50, 12, 10); ctx.fillRect(x + 12, y - 50, 12, 10);
  ctx.strokeStyle = shade('#8a8478', -55); ctx.lineWidth = 1.5;
  for (let k = -30; k <= 30; k += 15) { ctx.beginPath(); ctx.moveTo(x - 20, y + k); ctx.lineTo(x + 20, y + k); ctx.stroke(); }
  hpBar(x, y - 62, 44, b.hp / b.max);
}

function drawTower(x, y, b, flash) {
  ctx.fillStyle = '#5a3a1e';
  ctx.fillRect(x - 20, y - 6, 5, 50); ctx.fillRect(x + 15, y - 6, 5, 50);
  ctx.fillStyle = flash ? '#e9b949' : '#8a5a2a';
  ctx.fillRect(x - 26, y - 14, 52, 10);
  ctx.fillStyle = '#6b4424';
  ctx.beginPath(); ctx.moveTo(x - 30, y - 14); ctx.lineTo(x, y - 40); ctx.lineTo(x + 30, y - 14); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x - 24, y - 20); ctx.quadraticCurveTo(x, y - 34, x + 24, y - 20); ctx.stroke();
  ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 24, y - 20); ctx.lineTo(x + 24, y - 20); ctx.stroke();
  hpBar(x, y - 58, 52, b.hp / b.max);
}

function drawPit(x, y) {
  ell(ctx, x, y + 12, 28, 9, '#1a140e');
  ctx.fillStyle = '#6b5a3a';
  for (let k = -18; k <= 18; k += 9) { ctx.beginPath(); ctx.moveTo(x + k - 3, y + 12); ctx.lineTo(x + k, y - 6); ctx.lineTo(x + k + 3, y + 12); ctx.closePath(); ctx.fill(); }
}

function drawFire(x, y, b) {
  const ready = b.cd <= 0;
  ell(ctx, x, y + 14, 24, 8, 'rgba(0,0,0,.28)');
  ell(ctx, x, y, 22, 16, '#9a7a2a');
  ell(ctx, x - 6, y - 6, 8, 4, '#d7b656');
  ctx.fillStyle = '#6b4a1a'; ctx.fillRect(x - 10, y + 12, 20, 4);
  if (ready) {
    const f = Math.sin(G.t * 18) * 4;
    ctx.fillStyle = '#ffa54a';
    ctx.beginPath(); ctx.moveTo(x - 12, y - 14); ctx.quadraticCurveTo(x, y - 40 - f, x + 12, y - 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffe08a';
    ctx.beginPath(); ctx.moveTo(x - 5, y - 16); ctx.quadraticCurveTo(x, y - 28 - f, x + 5, y - 16); ctx.closePath(); ctx.fill();
  } else {
    ell(ctx, x - 4 + Math.sin(G.t * 3) * 3, y - 24 - (G.t * 10 % 16), 5, 5, 'rgba(180,170,160,.45)');
  }
}

function drawEnemy(e) {
  const y = LANES[e.lane];
  if (e.hidden) {
    ell(ctx, e.x, y + 10, 26, 10, 'rgba(60,40,20,.8)');
    ell(ctx, e.x, y + 4, 14, 6, 'rgba(20,14,8,.9)');
    return;
  }
  const d = e.spec, walking = { t: G.t, walk: e.walk };
  if (d.cav) {
    ell(ctx, e.x, y + 16, 34, 12, 'rgba(0,0,0,.25)');
    ctx.fillStyle = '#5a3a1e'; ctx.beginPath(); ctx.ellipse(e.x, y + 2, 28, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#3a2412'; ctx.lineWidth = 4;
    const s = Math.sin(e.walk) * 8;
    ctx.beginPath(); ctx.moveTo(e.x - 16, y + 10); ctx.lineTo(e.x - 18 + s, y + 26); ctx.moveTo(e.x + 16, y + 10); ctx.lineTo(e.x + 18 - s, y + 26); ctx.stroke();
    drawChibi(ctx, e.x, y - 6, d.look, { face: -1, t: G.t, scale: .8, ...POSES.run(walking) });
  } else if (d.cannon) {
    const big = !!d.shellEvery;
    ell(ctx, e.x + 8, y + 22, big ? 40 : 34, 8, 'rgba(0,0,0,.25)');
    ctx.fillStyle = '#4a3a2a'; ctx.fillRect(e.x - 26, y + 6, big ? 52 : 46, big ? 12 : 10);
    ctx.fillStyle = '#2a2a2a'; ell(ctx, e.x - 22, y + 20, 7, 7, '#2a2a2a'); ell(ctx, e.x + 22, y + 20, 7, 7, '#2a2a2a');
    ctx.fillStyle = big ? '#7a8590' : '#5a5a5a';
    ctx.save(); ctx.translate(e.x - 26, y + 2); ctx.rotate(-.25); ctx.fillRect(-6, -6, big ? 42 : 36, big ? 9 : 7); ctx.restore();
    drawChibi(ctx, e.x + 6, y + 4, d.look, { face: -1, t: G.t, scale: big ? .95 : .9, ...POSES.idle({ t: G.t }) });
  } else {
    ell(ctx, e.x, y + 16, 26, 8, 'rgba(0,0,0,.25)');
    drawChibi(ctx, e.x, y + 16, d.look, { face: -1, t: G.t, scale: d.shield ? 1.05 : .95, ...POSES.run(walking) });
  }
  hpBar(e.x, y - 80, 40, e.hp / e.max);
}

function drawShots() {
  for (const s of shots) {
    ctx.globalAlpha = Math.max(0, s.t / .25);
    ctx.strokeStyle = '#f3e2b0'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  for (const f of fires) {
    const k = 1 - f.t / .6;
    ctx.globalAlpha = Math.max(0, f.t / .6) * .6;
    ctx.fillStyle = '#ff8a3a';
    ctx.beginPath(); ctx.arc(f.x, f.y, f.r * k, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawHud() {
  const e = ERAS[G.era];
  drawBackBtn('← Bản đồ');
  ctx.textAlign = 'left';
  outlinedText(ctx, `${e.name} · ${e.year}`, 150, 36, `20px ${FD}`, '#ffe6a8');
  outlinedText(ctx, `Vàng ${Math.floor(G.gold)}`, 16, 106, `18px ${FB}`, '#ffd35a');
  ctx.textAlign = 'right';
  outlinedText(ctx, `Đợt ${Math.min(G.wave + 1, e.waves.length)}/${e.waves.length} · ${G.mode === 'battle' ? 'Chiến đấu' : 'Chuẩn bị'}`, W - 16, 36, `17px ${FB}`, '#fff');
  outlinedText(ctx, `Luật: ${e.ruleName}`, W - 16, 60, `14px ${FB}`, '#c9cdd8');
  if (G.mode === 'prep') {
    ctx.textAlign = 'center';
    for (let k = 0; k < PICK_KINDS.length; k++) drawPalBtn(k, PICK_KINDS[k]);
    drawStartBtn(G.wave + 1);
  }
  ctx.textAlign = 'left';
}

function drawPalBtn(k, kind) {
  const r = pal(k), d = BUILD[kind], sel = G.pick === kind;
  ctx.fillStyle = sel ? '#e9b949' : 'rgba(20,24,30,.8)';
  rr(ctx, r.x, r.y, r.w, r.h, 8); ctx.fill();
  ctx.strokeStyle = sel ? '#fff' : 'rgba(255,255,255,.3)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.textAlign = 'center';
  outlinedText(ctx, `${k + 1}. ${d.name}`, r.x + r.w / 2, r.y + 19, `15px ${FB}`, sel ? '#1b1d24' : '#fff', sel ? 'rgba(255,255,255,.4)' : undefined, 2);
  outlinedText(ctx, `${d.cost} vàng`, r.x + r.w / 2, r.y + 36, `13px ${FB}`, sel ? '#3a2a10' : '#ffd35a', sel ? 'rgba(255,255,255,.4)' : undefined, 2);
}

function drawStartBtn(n) {
  ctx.fillStyle = '#b3261e';
  rr(ctx, START.x, START.y, START.w, START.h, 10); ctx.fill();
  ctx.textAlign = 'center';
  outlinedText(ctx, `Đánh đợt ${n}  (Space)`, START.x + START.w / 2, START.y + 30, `16px ${FB}`, '#fff');
}

function drawBackBtn(label) {
  const r = BACK;
  ctx.fillStyle = 'rgba(20,24,30,.8)'; rr(ctx, r.x, r.y, r.w, r.h, 8); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.textAlign = 'center';
  outlinedText(ctx, label, r.x + r.w / 2, r.y + 21, `14px ${FB}`, '#fff', undefined, 2);
}

function drawLore(e) {
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, W, H);
  const x = 150, y = 90, w = 660, h = 360;
  ctx.fillStyle = '#1d2530'; rr(ctx, x, y, w, h, 14); ctx.fill();
  ctx.strokeStyle = e.accent; ctx.lineWidth = 3; ctx.stroke();
  ctx.textAlign = 'center';
  outlinedText(ctx, e.name, W / 2, y + 56, `34px ${FD}`, '#ffe6a8');
  outlinedText(ctx, `${e.king} · ${e.year} · ${e.foe}`, W / 2, y + 88, `17px ${FB}`, '#c9cdd8');
  ctx.textAlign = 'left';
  wrapText(e.lore, W / 2 - 280, y + 130, 560, 26, `19px ${FB}`, '#eeede8');
  ctx.textAlign = 'center';
  outlinedText(ctx, `Quân địch: ${e.tiers.map(k => e.troops[k].name).join(' · ')}`, W / 2, y + 262, `15px ${FB}`, '#c9cdd8');
  outlinedText(ctx, `Luật thời kỳ: ${e.ruleName} — ${e.ruleText}`, W / 2, y + 290, `15px ${FB}`, '#ffd35a');
  ctx.fillStyle = '#b3261e'; rr(ctx, LORE_BTN.x, LORE_BTN.y, LORE_BTN.w, LORE_BTN.h, 10); ctx.fill();
  outlinedText(ctx, 'Vào trận', LORE_BTN.x + LORE_BTN.w / 2, LORE_BTN.y + 32, `20px ${FD}`, '#fff');
}

function drawOver() {
  const e = ERAS[G.era], won = G.result === 'won';
  ctx.fillStyle = 'rgba(0,0,0,.62)'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  outlinedText(ctx, won ? 'Thành giữ vững!' : 'Thành thất thủ', W / 2, 200, `46px ${FD}`, won ? '#ffe6a8' : '#ff8a7a');
  outlinedText(ctx, won ? `${e.name} · ${e.year} đã qua` : `Cổng thành đã bị phá tại ${e.name}`, W / 2, 240, `20px ${FB}`, '#eeede8');
  if (won) for (let k = 0; k < 3; k++) outlinedText(ctx, '★', W / 2 - 60 + k * 60, 296, `40px ${FB}`, k < G.stars ? '#ffd35a' : '#4a5260');
  drawMenuBtn(OVER_MENU, 'Về bản đồ');
  const nextOk = won && G.era + 1 < ERAS.length && isUnlocked(G.era + 1);
  if (nextOk) drawMenuBtn(OVER_NEXT, 'Thời kỳ sau');
}

function drawMenuBtn(r, label) {
  ctx.fillStyle = '#2a3442'; rr(ctx, r.x, r.y, r.w, r.h, 10); ctx.fill();
  ctx.strokeStyle = '#e9b949'; ctx.lineWidth = 2; ctx.stroke();
  ctx.textAlign = 'center';
  outlinedText(ctx, label, r.x + r.w / 2, r.y + 31, `18px ${FB}`, '#fff');
}

function wrapText(text, x, y, maxW, lineH, font, color) {
  ctx.font = font; ctx.fillStyle = color;
  let line = '', yy = y;
  for (const word of text.split(' ')) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, yy); line = word; yy += lineH; }
    else line = test;
  }
  if (line) ctx.fillText(line, x, yy);
}

