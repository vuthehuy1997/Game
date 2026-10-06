// Vẽ toàn bộ màn hình: bản đồ, bảng công trình, thông tin ô đất, thanh trên và thông báo.
import { $ } from '../../../platform/core/util.js';
import { outlinedText } from '../../../platform/art/draw.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { G } from './state.js';
import { COLS, N, TERRAIN, BUILDINGS, CHAPTERS, EVENTS, EXPAND_FOOD } from './data.js';
import { tileVisibility, terrainOf, buildingAt, rates, expandIssue, ownedCount, unlockedKinds, defenseOf, goalFor } from './logic.js';
import { drawBuilding, drawIcon, drawTerrain, drawLock } from './art.js';
import { BOX, PANEL, INFO, EXPAND_BTN, CARD_BTN, CARD, PALETTE, tileRect, slotPos, paletteRect } from './ui.js';

const cv = $('cv'), ctx = cv.getContext('2d');
const GOLD = '#e9b949', INK = '#ffe6a8', PARCH = '#e8d6a8', WOOD = '#2b1d12';
const REASON = {
  owned: 'Đã thuộc về ta', water: 'Sông không chiếm được', locked: 'Chưa mở ở chương này',
  not_frontier: 'Chỉ khai phá sát đất ta', need_outpost: 'Cần một đồn để chiếm núi',
  need_pop: 'Cần ít nhất 3 dân', gold: 'Thiếu vàng', food: 'Thiếu lương thực',
};
const SIGN = v => (v >= 0 ? '+' : '') + v.toFixed(1);

export function render() {
  ctx.save();
  background();
  drawMap();
  drawTop();
  drawPanel();
  drawInfo();
  drawNote();
  ctx.restore();
  if (G.mode !== 'play') drawCard();
}

function background() {
  const g = ctx.createLinearGradient(0, 0, 0, 540);
  g.addColorStop(0, '#2a1f14'); g.addColorStop(1, '#14110c');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 540);
  ctx.fillStyle = 'rgba(255,220,150,.04)';
  for (let k = 0; k < 6; k++) ctx.fillRect(0, 84 + k * 80, 960, 1);
  ctx.fillStyle = PARCH;
  roundRect(BOX.x - 10, BOX.y - 8, BOX.tw * COLS + 14, BOX.th * (N / COLS) + 14, 10); ctx.fill();
  ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 3; ctx.stroke();
}

function drawMap() {
  const t = G.t;
  for (let i = 0; i < N; i++) {
    const r = tileRect(i), vis = tileVisibility(i), terr = terrainOf(i), seed = i + 1;
    if (vis === 'owned' || vis === 'frontier' || vis === 'water') {
      ctx.save();
      if (vis === 'frontier') ctx.globalAlpha = .62;
      ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
      drawTerrain(ctx, terr, r.x, r.y, r.w, r.h, seed, t);
      ctx.restore();
    } else if (vis === 'fog') {
      ctx.fillStyle = '#4b4438'; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = 'rgba(255,255,255,.07)';
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(r.x + 16 + k * 22, r.y + 22 + (k % 2) * 30, 14, 6, 0, 0, Math.PI * 2); ctx.fill(); }
    } else if (vis === 'locked') {
      ctx.fillStyle = '#2a261f'; ctx.fillRect(r.x, r.y, r.w, r.h);
      drawLock(ctx, r.x + r.w / 2, r.y + r.h / 2, 1.1);
    }

    if (vis === 'owned') {
      for (let s = 0; s < 3; s++) {
        const k = buildingAt(i, s);
        if (!k) continue;
        const p = slotPos(i, s);
        drawBuilding(ctx, k, p.x, p.y, .78, t + s * .3);
      }
      ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
    } else {
      ctx.strokeStyle = vis === 'frontier' ? 'rgba(233,185,73,.8)' : 'rgba(0,0,0,.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash(vis === 'frontier' ? [5, 4] : []);
      ctx.strokeRect(r.x + .5, r.y + .5, r.w - 1, r.h - 1);
      ctx.setLineDash([]);
    }

    if (G.sel.tile === i) {
      const pulse = .5 + .5 * Math.sin(t * 5);
      ctx.strokeStyle = `rgba(255,211,90,${.6 + .4 * pulse})`; ctx.lineWidth = 3;
      ctx.strokeRect(r.x - 1, r.y - 1, r.w + 2, r.h + 2);
    }
    if (i === 9 && G.owned[i]) {
      ctx.fillStyle = '#b3261e'; ctx.fillRect(r.x + 6, r.y + 5, 2, 14);
      ctx.beginPath(); ctx.moveTo(r.x + 8, r.y + 5); ctx.lineTo(r.x + 18, r.y + 8); ctx.lineTo(r.x + 8, r.y + 11); ctx.fill();
    }
  }
}

function drawTop() {
  ctx.fillStyle = WOOD; ctx.fillRect(0, 0, 960, 76);
  ctx.fillStyle = GOLD; ctx.fillRect(0, 76, 960, 2);
  const ch = CHAPTERS[G.chapter];
  ctx.textAlign = 'left';
  outlinedText(ctx, 'Nam Tiến Đại Việt', 150, 36, `26px ${FD}`, INK);
  outlinedText(ctx, `Chương ${G.chapter + 1} · ${ch.name} (${ch.years})`, 18, 64, `15px ${FB}`, '#fff');
  const r = rates();
  const cells = [
    ['Lương thực', Math.floor(G.res.food), SIGN(r.foodNet)],
    ['Vàng', Math.floor(G.res.gold), SIGN(r.gold)],
    ['Dân', `${Math.floor(G.res.pop)}/${r.popCap}`, ''],
    ['Uy tín', Math.floor(G.res.prestige), SIGN(r.prestige)],
  ];
  cells.forEach(([label, v, rate], k) => {
    const x = 430 + k * 124;
    outlinedText(ctx, label, x, 30, `13px ${FB}`, '#d8c9a0');
    outlinedText(ctx, String(v), x, 56, `20px ${FD}`, INK);
    if (rate) outlinedText(ctx, rate + '/s', x + ctx.measureText(String(v)).width + 8, 56, `13px ${FB}`, rate.startsWith('-') ? '#ff9a8a' : '#9be3a8');
  });
  ctx.textAlign = 'left';
}

function drawPanel() {
  ctx.fillStyle = 'rgba(43,29,18,.94)'; roundRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 10); ctx.fill();
  ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 2; ctx.stroke();
  ctx.textAlign = 'left';
  outlinedText(ctx, 'Công trình', PANEL.x + 12, PANEL.y + 24, `18px ${FD}`, INK);
  const unlocked = unlockedKinds();
  PALETTE.forEach((k, idx) => {
    const b = paletteRect(idx);
    const isRemove = k === 'remove', ok = isRemove || unlocked.includes(k), sel = G.sel.kind === k;
    ctx.fillStyle = ok ? (sel ? '#6a4a22' : '#4a3626') : '#2e2620';
    roundRect(b.x, b.y, b.w, b.h, 7); ctx.fill();
    ctx.strokeStyle = sel ? GOLD : 'rgba(255,255,255,.12)'; ctx.lineWidth = sel ? 2.5 : 1; ctx.stroke();
    if (isRemove) {
      ctx.strokeStyle = '#e0604e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(b.x + 12, b.y + 14); ctx.lineTo(b.x + 28, b.y + 30); ctx.moveTo(b.x + 28, b.y + 14); ctx.lineTo(b.x + 12, b.y + 30); ctx.stroke();
      outlinedText(ctx, 'Dỡ bỏ', b.x + 38, b.y + 27, `14px ${FB}`, '#fff');
      return;
    }
    drawIcon(ctx, k, b.x + 20, b.y + 23, 34, G.t);
    if (!ok) drawLock(ctx, b.x + 20, b.y + 23, .6);
    outlinedText(ctx, BUILDINGS[k].name, b.x + 37, b.y + 17, `13px ${FB}`, ok ? '#fff' : '#9d9485');
    const c = BUILDINGS[k].cost;
    if (!ok) outlinedText(ctx, `Chương ${BUILDINGS[k].chapter + 1}`, b.x + 37, b.y + 33, `11px ${FB}`, '#8a8070');
    else {
      outlinedText(ctx, `${c.gold} vàng`, b.x + 37, b.y + 31, `11px ${FB}`, '#f2d98a');
      if (c.food) outlinedText(ctx, `${c.food} lương`, b.x + 37, b.y + 42, `11px ${FB}`, '#9be3a8');
    }
  });
}

function drawInfo() {
  const b = INFO;
  ctx.fillStyle = 'rgba(43,29,18,.94)'; roundRect(b.x, b.y, b.w, b.h, 10); ctx.fill();
  ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 2; ctx.stroke();
  ctx.textAlign = 'left';
  const i = G.sel.tile;
  if (i < 0) {
    outlinedText(ctx, 'Chọn một ô trên bản đồ', b.x + 12, b.y + 28, `15px ${FB}`, '#d8c9a0');
    outlinedText(ctx, 'Ô sát đất ta có thể khai phá.', b.x + 12, b.y + 50, `13px ${FB}`, '#a89a80');
    return;
  }
  const t = TERRAIN[terrainOf(i)], vis = tileVisibility(i);
  outlinedText(ctx, t.name, b.x + 12, b.y + 26, `18px ${FD}`, INK);
  const status = { owned: 'Đất của ta', frontier: 'Có thể khai phá', fog: 'Chưa thăm dò', water: 'Không chiếm được', locked: 'Chưa mở ở chương này' }[vis];
  outlinedText(ctx, status, b.x + 12, b.y + 46, `13px ${FB}`, '#fff');
  if (vis === 'owned') {
    outlinedText(ctx, `Phòng thủ ${defenseOf(i)} · ${Math.round(t.food * 100)}% sản lượng`, b.x + 12, b.y + 64, `13px ${FB}`, '#d8c9a0');
    outlinedText(ctx, G.sel.kind === 'remove' ? 'Bấm công trình để dỡ (hoàn 50%)' : 'Chọn công trình rồi bấm ô trống để xây', b.x + 12, b.y + 84, `12px ${FB}`, '#a89a80');
  }
  if (vis === 'frontier' || vis === 'fog') outlinedText(ctx, 'Khai phá để mở vùng này', b.x + 12, b.y + 64, `12px ${FB}`, '#d8c9a0');
  if (vis === 'frontier') {
    const why = expandIssue(i);
    const can = why === null;
    ctx.fillStyle = can ? '#3f8a52' : '#4a3626';
    roundRect(EXPAND_BTN.x, EXPAND_BTN.y, EXPAND_BTN.w, EXPAND_BTN.h, 8); ctx.fill();
    ctx.strokeStyle = can ? '#9be3a8' : '#6b4a2a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.textAlign = 'center';
    outlinedText(ctx, `Khai phá · ${t.expand} vàng · ${EXPAND_FOOD} lương`, EXPAND_BTN.x + EXPAND_BTN.w / 2, EXPAND_BTN.y + 23, `13px ${FB}`, '#fff');
    ctx.textAlign = 'left';
    if (!can) outlinedText(ctx, REASON[why] || '', b.x + 12, b.y + 140 - 4, `12px ${FB}`, '#ffb3a6');
  }
}

function drawNote() {
  ctx.fillStyle = 'rgba(20,16,11,.9)'; ctx.fillRect(0, 490, 960, 50);
  const E = G.ev;
  let text = G.note.text, color = G.note.color;
  if (E.pending) { text = `${EVENTS[E.pending].warn} (${Math.ceil(E.warn)}s)`; color = '#ffd35a'; }
  else if (E.active && EVENTS[E.active].text) { text = `${EVENTS[E.active].text} (${Math.ceil(E.timer)}s)`; color = '#9be3a8'; }
  ctx.textAlign = 'left';
  outlinedText(ctx, text || 'Bấm ô đất để xem thông tin.', 20, 520, `16px ${FB}`, color);
  const g = goalFor();
  ctx.textAlign = 'right';
  outlinedText(ctx, `Mục tiêu: ${ownedCount()}/${g.tiles} vùng · ${Math.floor(G.res.prestige)}/${g.prestige} uy tín`, 944, 520, `14px ${FB}`, '#fff');
  ctx.textAlign = 'left';
}

function drawCard() {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, 960, 540);
  ctx.fillStyle = PARCH; roundRect(CARD.x, CARD.y, CARD.w, CARD.h, 14); ctx.fill();
  ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 4; ctx.stroke();
  const ch = CHAPTERS[G.chapter];
  let title, body, btn;
  if (G.mode === 'intro') { title = `Chương ${G.chapter + 1}: ${ch.name} · ${ch.years}`; body = ch.lore; btn = 'Bắt đầu'; }
  else if (G.mode === 'done') {
    const last = G.chapter + 1 >= CHAPTERS.length;
    title = `Hoàn thành chương ${G.chapter + 1}`;
    body = last ? 'Đất Đại Việt đã mở rộng tới Gia Định.' : `Đã đủ ${goalFor().tiles} vùng và ${goalFor().prestige} uy tín. Sang chương tiếp theo: ${CHAPTERS[G.chapter + 1].name} (${CHAPTERS[G.chapter + 1].years}).`;
    btn = last ? 'Xem kết thúc' : 'Sang chương sau';
  } else if (G.mode === 'lost') { title = 'Mất mùa, đói kém'; body = 'Dân làng không đủ lương thực nên tan đi nhiều. Thử lại chương này từ đầu.'; btn = 'Thử lại'; }
  else { title = 'Nam tiến hoàn tất'; body = 'Từ Thăng Long đến Gia Định, bờ cõi Đại Việt đã được mở rộng qua bốn thời kỳ.'; btn = 'Chơi lại từ đầu'; }
  ctx.textAlign = 'center';
  outlinedText(ctx, title, CARD.x + CARD.w / 2, CARD.y + 52, `28px ${FD}`, '#6b3a1e', 'rgba(0,0,0,0)', 0);
  ctx.textAlign = 'left';
  wrap(body, CARD.x + 40, CARD.y + 100, CARD.w - 80, 24, `17px ${FB}`, '#3a2a1a');
  ctx.fillStyle = '#8b2f1f';
  roundRect(CARD_BTN.x, CARD_BTN.y, CARD_BTN.w, CARD_BTN.h, 10); ctx.fill();
  ctx.textAlign = 'center';
  outlinedText(ctx, btn, CARD_BTN.x + CARD_BTN.w / 2, CARD_BTN.y + 30, `19px ${FD}`, '#fff');
  ctx.restore();
}

function wrap(text, x, y, maxW, lh, font, color) {
  ctx.font = font; ctx.fillStyle = color;
  const words = text.split(' ');
  let line = '', yy = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, yy); line = w; yy += lh; }
    else line = test;
  }
  if (line) ctx.fillText(line, x, yy);
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
