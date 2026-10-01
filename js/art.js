'use strict';
// Đồ hoạ nhân vật chibi (vẽ bằng code), vũ khí, vò/thùng.

const LOOKS = {
  hero:     { skin: '#f6d2ae', hair: '#1c1410', hat: 'topknot', ribbon: '#e9b949', shirt: '#b3261e', trim: '#e9b949', pants: '#2a2630', belt: '#e9b949', tattoo: 1 },
  villager: { skin: '#e7bd96', hair: '#cfc9bf', hat: 'nonla', shirt: '#7d6048', trim: '#5b4533', pants: '#3b3129', belt: '#5b4533', old: 1 },
  pnl:      { skin: '#d9a57c', hair: '#1c1410', hat: 'khan', khan: '#6d4c2f', shirt: '#8a6a3e', trim: '#5b4533', pants: '#3b3129', belt: '#3b2a1a', tattoo: 1, weapon: 'spear' },
  hdv:      { skin: '#f0c9a3', hair: '#1c1410', hat: 'mu', mu: '#1a1616', shirt: '#6f1d1b', trim: '#e9b949', pants: '#2a1a1a', belt: '#e9b949', beard: 1 },
  elder:    { skin: '#e3b892', hair: '#ebe6dc', hat: 'khan', khan: '#3a3a3a', shirt: '#4b4f63', trim: '#2e3142', pants: '#2e3142', belt: '#2e3142', beard: 2, old: 1 },
  tbt:      { skin: '#e8bf98', hair: '#1c1410', hat: 'mu', mu: '#262222', shirt: '#23405c', trim: '#e9b949', pants: '#1b2633', belt: '#e9b949', beard: 1 },
  tqk:      { skin: '#f0c9a3', hair: '#1c1410', hat: 'mu', mu: '#1a1616', shirt: '#2f6b57', trim: '#e9b949', pants: '#1c3a30', belt: '#e9b949', beard: 1 },
  tqt:      { skin: '#f7d6b5', hair: '#1c1410', hat: 'topknot', ribbon: '#b3261e', shirt: '#d3641f', trim: '#f4e7c9', pants: '#3b2a1a', belt: '#f4e7c9', weapon: 'saber' },
  tkd:      { skin: '#eec39c', hair: '#1c1410', hat: 'mu', mu: '#141414', shirt: '#1f3f6b', trim: '#e9b949', pants: '#16263d', belt: '#e9b949', beard: 1, weapon: 'saber' },
  bandit:   { skin: '#c99a74', hair: '#1c1410', hat: 'bandana', band: '#8b1e1e', shirt: '#3b3a36', trim: '#27261f', pants: '#4a3f31', belt: '#27261f', weapon: 'club', angry: 1 },
  soldier:  { skin: '#e0b58c', hair: '#1c1410', hat: 'mongol', cap: '#5a3b24', fur: '#c9b28f', shirt: '#56697d', trim: '#c9b28f', pants: '#343c46', belt: '#2b2b2b', weapon: 'spear', angry: 1 },
  archer:   { skin: '#e0b58c', hair: '#1c1410', hat: 'mongol', cap: '#3d4a2c', fur: '#b8a07a', shirt: '#6d5a45', trim: '#b8a07a', pants: '#3a3228', belt: '#2b2b2b', weapon: 'bow', angry: 1 },
  shield:   { skin: '#dcae84', hair: '#1c1410', hat: 'helmet', helm: '#6e7178', plume: '#7a2a1e', shirt: '#444a5a', trim: '#8b8f99', pants: '#2c2f38', belt: '#2b2b2b', weapon: 'saber', shield: 1, angry: 1 },
  lancer:   { skin: '#dcae84', hair: '#1c1410', hat: 'helmet', helm: '#8a2a1f', plume: '#1b1b1b', shirt: '#3a2a2a', trim: '#c9a449', pants: '#262020', belt: '#c9a449', weapon: 'spear', angry: 1 },
  potter:   { skin: '#d9a97e', hair: '#1c1410', hat: 'mongol', cap: '#5a2a1a', fur: '#a08a6a', shirt: '#8a4a22', trim: '#d9a25a', pants: '#3a2a20', belt: '#2b2b2b', weapon: 'pot', angry: 1 },
  sword:    { skin: '#e0b58c', hair: '#1c1410', hat: 'mongol', cap: '#6b1f1f', fur: '#d9c7a0', shirt: '#7a3b2b', trim: '#d9c7a0', pants: '#33282a', belt: '#2b2b2b', weapon: 'saber', angry: 1 },
  heavy:    { skin: '#c99a74', hair: '#1c1410', hat: 'helmet', helm: '#3d4048', plume: '#5a1b14', shirt: '#2f3540', trim: '#8b8f99', pants: '#1f232b', belt: '#8b8f99', weapon: 'glaive', angry: 1, beard: 3, scale: 1.15 },
  drummer:  { skin: '#e0b58c', hair: '#1c1410', hat: 'mongol', cap: '#2a3a5a', fur: '#c9b28f', shirt: '#4a5a7a', trim: '#e9b949', pants: '#2a3040', belt: '#e9b949', weapon: 'drum', angry: 1 },
  bossBandit:  { skin: '#b98a64', hair: '#111', hat: 'bandana', band: '#111', shirt: '#5a1f1f', trim: '#2a1111', pants: '#2e2620', belt: '#c9a449', weapon: 'club', angry: 1, scar: 1, beard: 3, scale: 1.35 },
  bossCaptain: { skin: '#dcae84', hair: '#1c1410', hat: 'helmet', helm: '#9c7a33', plume: '#b3261e', shirt: '#3c4a5c', trim: '#c9a449', pants: '#262c36', belt: '#c9a449', weapon: 'saber', angry: 1, beard: 3, scale: 1.4 },
  bossToaDo:   { skin: '#e2b48a', hair: '#1c1410', hat: 'helmet', helm: '#a3a8b2', plume: '#1b1b1b', shirt: '#6b2b2b', trim: '#d9d2c2', pants: '#2a1d1d', belt: '#d9d2c2', weapon: 'glaive', angry: 1, beard: 3, scale: 1.45 },
  bossLyHang:  { skin: '#e2b48a', hair: '#1c1410', hat: 'helmet', helm: '#5d6b4a', plume: '#c9a449', shirt: '#2f4a3a', trim: '#c9a449', pants: '#1f2a22', belt: '#c9a449', weapon: 'saber', angry: 1, beard: 1, scale: 1.4 },
  bossZhang:   { skin: '#d8a97e', hair: '#1c1410', hat: 'mongol', cap: '#3a2a1a', fur: '#d9c7a0', shirt: '#7a5a2a', trim: '#e9b949', pants: '#2a2016', belt: '#e9b949', weapon: 'glaive', angry: 1, beard: 3, scale: 1.45 },
  bossOMN:     { skin: '#d8a97e', hair: '#1c1410', hat: 'mongol', cap: '#262320', fur: '#8a7a66', shirt: '#1f3d4f', trim: '#c9a449', pants: '#1a2530', belt: '#c9a449', weapon: 'glaive', angry: 1, beard: 3, scar: 1, scale: 1.5 },
};

function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function ell(c, x, y, rx, ry, col, rot = 0) { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, Math.PI * 2); c.fill(); }
const shadeCache = {};
function shade(hex, amt) {
  const k = hex + amt; if (shadeCache[k]) return shadeCache[k];
  const n = parseInt(hex.slice(1), 16), f = v => clamp(v + amt, 0, 255);
  return shadeCache[k] = `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
function limb(c, x, y, a, len, w, col) {
  const x2 = x + Math.sin(a) * len, y2 = y + Math.cos(a) * len;
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke();
  return [x2, y2];
}

// Vẽ nhân vật chibi: chân ở (x,y), mặt quay phải trong hệ toạ độ cục bộ.
// P: face, t, armF/armB/legF/legB (góc, 0 = buông xuống, dương = đưa ra trước), lean, bob, flash, alpha, down, wpn...
function drawChibi(c, x, y, L, P = {}) {
  const fl = P.flash > 0, F = col => fl ? '#fff6e0' : col;
  const s = (L.scale || 1) * (P.scale || 1), face = P.face || 1;
  c.save(); c.translate(x, y); c.scale(face * s, s);
  if (P.alpha != null) c.globalAlpha = P.alpha;
  if (P.down) { c.translate(0, -12 * P.down); c.rotate(-Math.PI / 2 * P.down); }
  c.rotate(P.lean || 0);
  c.translate(0, -(P.bob || 0));
  const armF = P.armF ?? .25, armB = P.armB ?? -.2, legF = P.legF ?? .08, legB = P.legB ?? -.08;
  if (P.flag) drawFlag(c, P.flag, P.t || 0, F);

  let ft = limb(c, -4, -26, legB, 22, 10, F(shade(L.pants, -18)));
  ell(c, ft[0] + 3, ft[1] + 1, 7, 4, F('#1b1411'));
  const hb = limb(c, -7, -46, armB, 19, 9, F(shade(L.shirt, -22)));
  ell(c, hb[0], hb[1], 5, 5, F(shade(L.skin, -12)));

  // thân áo giao lĩnh
  c.fillStyle = F(L.shirt); rr(c, -14, -54, 28, 32, 9); c.fill();
  c.beginPath(); c.moveTo(-15, -30); c.lineTo(15, -30); c.lineTo(18, -18); c.lineTo(-18, -18); c.closePath(); c.fill();
  c.strokeStyle = F(L.trim); c.lineWidth = 3; c.beginPath(); c.moveTo(-8, -53); c.lineTo(8, -36); c.stroke();
  c.fillStyle = F(L.belt); c.fillRect(-15, -34, 30, 5);

  ft = limb(c, 4, -26, legF, 22, 10, F(L.pants));
  ell(c, ft[0] + 3, ft[1] + 1, 7, 4, F('#1b1411'));

  // đầu
  const hx = 3, hy = -80, r = 25;
  if (L.hat === 'topknot' || L.hat === 'bandana') ell(c, hx - 4, hy + 2, r + 1, r - 1, F(L.hair));
  ell(c, hx, hy, r, r - 1, F(L.skin));
  ell(c, hx - 16, hy + 4, 5, 7, F(shade(L.skin, -10)));
  drawHat(c, L, hx, hy, r, F, P);
  const ey = hy + 3;
  if (P.hurtFace) {
    c.strokeStyle = F('#1b1411'); c.lineWidth = 2.5;
    [hx + 1, hx + 15].forEach(ex => { c.beginPath(); c.moveTo(ex - 4, ey - 4); c.lineTo(ex + 4, ey + 4); c.moveTo(ex + 4, ey - 4); c.lineTo(ex - 4, ey + 4); c.stroke(); });
  } else if (L.old || P.blink) {
    c.strokeStyle = F('#1b1411'); c.lineWidth = 2.5;
    [hx + 1, hx + 15].forEach(ex => { c.beginPath(); c.arc(ex, ey + 1, 4, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); });
  } else {
    [hx + 1, hx + 15].forEach(ex => { ell(c, ex, ey, 3.8, 5.4, F('#1b1411')); ell(c, ex + 1.2, ey - 2, 1.4, 1.8, '#fff'); });
  }
  if (L.angry) { c.strokeStyle = F('#1b1411'); c.lineWidth = 3; c.beginPath(); c.moveTo(hx - 5, ey - 11); c.lineTo(hx + 5, ey - 7); c.moveTo(hx + 21, ey - 11); c.lineTo(hx + 11, ey - 7); c.stroke(); }
  if (!L.angry && !L.beard) { const bl = fl ? '#fff6e0' : 'rgba(240,120,110,.45)'; ell(c, hx - 5, ey + 9, 4, 2.4, bl); ell(c, hx + 21, ey + 9, 4, 2.4, bl); }
  if (L.scar) { c.strokeStyle = F('#7a2a22'); c.lineWidth = 2; c.beginPath(); c.moveTo(hx + 10, ey - 12); c.lineTo(hx + 20, ey + 6); c.stroke(); }
  c.strokeStyle = F('#5a2a20'); c.lineWidth = 2;
  if (P.shout) ell(c, hx + 9, ey + 13, 4, 4, F('#5a2a20'));
  else if (L.angry) { c.beginPath(); c.moveTo(hx + 5, ey + 14); c.lineTo(hx + 13, ey + 13); c.stroke(); }
  else { c.beginPath(); c.arc(hx + 9, ey + 11, 3.5, .2, Math.PI - .2); c.stroke(); }
  if (L.beard === 1) { c.strokeStyle = F('#1c1410'); c.lineWidth = 2; c.beginPath(); c.moveTo(hx + 2, ey + 9); c.quadraticCurveTo(hx + 9, ey + 6, hx + 16, ey + 9); c.stroke(); ell(c, hx + 9, ey + 20, 3, 5, F('#1c1410')); }
  if (L.beard === 2) { c.fillStyle = F('#f2eee6'); c.beginPath(); c.moveTo(hx - 2, ey + 10); c.quadraticCurveTo(hx + 9, ey + 42, hx + 18, ey + 10); c.fill(); }
  if (L.beard === 3) { c.fillStyle = F('#1c1410'); c.beginPath(); c.moveTo(hx - 12, ey + 2); c.quadraticCurveTo(hx - 8, ey + 30, hx + 8, ey + 28); c.quadraticCurveTo(hx + 24, ey + 26, hx + 24, ey + 6); c.quadraticCurveTo(hx + 9, ey + 18, hx - 12, ey + 2); c.fill(); }

  // tay trước + vũ khí
  const [hx2, hy2] = limb(c, 7, -46, armF, 19, 9, F(L.shirt));
  if (L.tattoo) { c.fillStyle = F('#2a3a5a'); const mx = 7 + Math.sin(armF) * 10, my = -46 + Math.cos(armF) * 10; c.fillRect(mx - 2, my - 2, 4, 4); }
  if (L.weapon && !P.noWeapon) drawWeapon(c, L.weapon, hx2, hy2, P.wpn ?? .25, F, P);
  ell(c, hx2, hy2, 5.5, 5.5, F(L.skin));
  if (L.shield) {
    c.save(); c.translate(15, -40); c.rotate(P.shieldRot || 0);
    c.fillStyle = F('#7a4a26'); rr(c, -4, -26, 16, 52, 7); c.fill();
    c.strokeStyle = F('#b7b9be'); c.lineWidth = 3; rr(c, -4, -26, 16, 52, 7); c.stroke();
    ell(c, 4, 0, 5, 5, F('#d9d2c2')); c.restore();
  }
  if (P.poison) { c.globalAlpha = .35; ell(c, hx, hy, r + 2, r + 1, '#6fd06a'); }
  c.restore();
}

// Cờ hiệu cắm sau lưng: 'cap' = đội trưởng (cờ đuôi nheo đỏ), 'cmd' = chỉ huy (cờ lệnh viền vàng)
function drawFlag(c, rank, t, F) {
  const big = rank === 'cmd', top = big ? -158 : -140, wv = Math.sin(t * 5) * 4;
  c.strokeStyle = F('#4a2e1a'); c.lineWidth = 3; c.beginPath(); c.moveTo(-10, -30); c.lineTo(-16, top); c.stroke();
  c.fillStyle = F(big ? '#8b1e1e' : '#b3261e'); c.beginPath(); c.moveTo(-16, top);
  if (big) { c.lineTo(-54, top + 4 + wv); c.lineTo(-52, top + 40 + wv); c.lineTo(-15, top + 36); }
  else { c.lineTo(-48, top + 12 + wv); c.lineTo(-15, top + 24); }
  c.closePath(); c.fill();
  if (big) { c.strokeStyle = F('#e9b949'); c.lineWidth = 2; c.stroke(); ell(c, -34, top + 20 + wv / 2, 6, 6, F('#e9b949')); }
  ell(c, -16, top - 3, 3, 3, F('#e9b949'));
}
function drawHat(c, L, hx, hy, r, F, P) {
  const sw = Math.sin((P.t || 0) * 6) * 3;
  switch (L.hat) {
    case 'topknot':
      c.fillStyle = F(L.hair); c.beginPath(); c.arc(hx, hy - 2, r + 1, Math.PI * 1.02, Math.PI * 1.98); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(hx + 4, hy - 16); c.quadraticCurveTo(hx + 22, hy - 14, hx + 26, hy - 2); c.lineTo(hx + 12, hy - 10); c.closePath(); c.fill();
      ell(c, hx - 5, hy - r - 6, 10, 9, F(L.hair));
      c.strokeStyle = F(L.ribbon || '#e9b949'); c.lineWidth = 3; c.beginPath(); c.moveTo(hx - 13, hy - r - 2); c.lineTo(hx + 3, hy - r - 2); c.stroke();
      c.beginPath(); c.moveTo(hx - 13, hy - r - 2); c.quadraticCurveTo(hx - 24, hy - r + 4 + sw, hx - 30, hy - r + 12 + sw); c.stroke();
      break;
    case 'nonla':
      c.fillStyle = F(L.hair); c.beginPath(); c.arc(hx, hy - 2, r, Math.PI, Math.PI * 2); c.fill();
      c.fillStyle = F('#e8d39a'); c.beginPath(); c.moveTo(hx - 40, hy - 8); c.lineTo(hx + 1, hy - 50); c.lineTo(hx + 44, hy - 8); c.quadraticCurveTo(hx + 2, hy - 2, hx - 40, hy - 8); c.fill();
      c.strokeStyle = F('#b89c5e'); c.lineWidth = 1.2;
      for (let i = 1; i < 4; i++) { const k = i / 4; c.beginPath(); c.moveTo(hx + 1 - 41 * k, hy - 50 + 42 * k); c.lineTo(hx + 1 + 43 * k, hy - 50 + 42 * k); c.stroke(); }
      break;
    case 'khan':
      c.fillStyle = F(L.hair); c.beginPath(); c.arc(hx, hy - 2, r, Math.PI * 1.05, Math.PI * 1.95); c.fill();
      c.fillStyle = F(L.khan); c.beginPath(); c.ellipse(hx, hy - 13, r + 2, 13, 0, Math.PI, Math.PI * 2); c.fill();
      c.fillRect(hx - r - 2, hy - 14, (r + 2) * 2, 7);
      c.strokeStyle = F(shade(L.khan, -25)); c.lineWidth = 2;
      for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(hx - r + 2, hy - 10 - i * 6); c.quadraticCurveTo(hx, hy - 16 - i * 7, hx + r - 2, hy - 10 - i * 6); c.stroke(); }
      break;
    case 'mu':
      c.fillStyle = F(L.hair); c.beginPath(); c.arc(hx, hy - 2, r, Math.PI * 1.02, Math.PI * 1.98); c.fill();
      c.fillStyle = F(L.mu); rr(c, hx - 20, hy - r - 20, 40, 30, 12); c.fill();
      c.fillRect(hx - r, hy - 16, r * 2, 8);
      ell(c, hx - r - 14, hy - 14, 16, 4.5, F(L.mu), -.15); ell(c, hx + r + 14, hy - 14, 16, 4.5, F(L.mu), .15);
      c.fillStyle = F('#e9b949'); c.fillRect(hx - 3, hy - r - 12, 6, 6);
      break;
    case 'bandana':
      c.fillStyle = F(L.hair);
      c.beginPath(); c.moveTo(hx - r, hy - 4);
      for (let i = 0; i <= 6; i++) { const a = Math.PI + i * Math.PI / 6, k = r + (i % 2 ? 9 : 1); c.lineTo(hx + Math.cos(a) * k, hy - 4 + Math.sin(a) * k); }
      c.closePath(); c.fill();
      c.fillStyle = F(L.band); c.fillRect(hx - r, hy - 16, r * 2, 8);
      c.beginPath(); c.moveTo(hx - r, hy - 16); c.lineTo(hx - r - 16, hy - 8 + sw); c.lineTo(hx - r - 12, hy - 2 + sw); c.lineTo(hx - r, hy - 9); c.fill();
      break;
    case 'mongol':
      c.fillStyle = F(L.cap); c.beginPath(); c.moveTo(hx - r + 2, hy - 12); c.quadraticCurveTo(hx, hy - r - 34, hx + r - 2, hy - 12); c.fill();
      ell(c, hx, hy - r - 16, 4, 4, F('#b3261e'));
      c.fillStyle = F(L.fur); rr(c, hx - r - 4, hy - 18, (r + 4) * 2, 11, 5); c.fill();
      rr(c, hx - r - 4, hy - 12, 9, 20, 4); c.fill();
      break;
    case 'helmet':
      c.fillStyle = F(L.helm); c.beginPath(); c.arc(hx, hy - 6, r + 3, Math.PI, Math.PI * 2); c.fill();
      c.fillStyle = F(shade(L.helm, -30)); c.fillRect(hx - r - 4, hy - 9, (r + 4) * 2, 5);
      c.fillStyle = F(shade(L.helm, -15)); c.beginPath(); c.moveTo(hx - r - 3, hy - 6); c.lineTo(hx - r - 8, hy + 14); c.lineTo(hx - r + 6, hy + 10); c.lineTo(hx - r + 4, hy - 6); c.fill();
      c.strokeStyle = F(shade(L.helm, 20)); c.lineWidth = 3; c.beginPath(); c.moveTo(hx, hy - r - 8); c.lineTo(hx, hy - r - 20); c.stroke();
      c.fillStyle = F(L.plume); c.beginPath(); c.moveTo(hx, hy - r - 20); c.quadraticCurveTo(hx - 18, hy - r - 26 + sw, hx - 26, hy - r - 10 + sw); c.quadraticCurveTo(hx - 12, hy - r - 14, hx, hy - r - 16); c.fill();
      break;
  }
}

function drawWeapon(c, kind, x, y, a, F, P) {
  c.save(); c.translate(x, y); c.rotate(a); c.lineCap = 'round';
  if (kind === 'spear') {
    c.strokeStyle = F('#7a5230'); c.lineWidth = 4; c.beginPath(); c.moveTo(0, 30); c.lineTo(0, -62); c.stroke();
    c.fillStyle = F('#d7d9de'); c.beginPath(); c.moveTo(-5, -60); c.lineTo(0, -80); c.lineTo(5, -60); c.fill();
    c.fillStyle = F('#b3261e'); c.beginPath(); c.moveTo(-5, -58); c.lineTo(5, -58); c.lineTo(2, -46); c.lineTo(-2, -46); c.fill();
  } else if (kind === 'club') {
    c.strokeStyle = F('#6b4424'); c.lineWidth = 8; c.beginPath(); c.moveTo(0, 8); c.lineTo(0, -40); c.stroke();
    ell(c, 0, -42, 7, 9, F('#5a381d'));
  } else if (kind === 'saber') {
    c.strokeStyle = F('#3a2a1a'); c.lineWidth = 4; c.beginPath(); c.moveTo(0, 6); c.lineTo(0, -4); c.stroke();
    c.fillStyle = F('#c9a449'); c.fillRect(-6, -6, 12, 3);
    c.fillStyle = F('#dfe2e8'); c.beginPath(); c.moveTo(-3, -6); c.quadraticCurveTo(-2, -36, 10, -52); c.quadraticCurveTo(6, -30, 3, -6); c.fill();
  } else if (kind === 'glaive') {
    c.strokeStyle = F('#4a2e1a'); c.lineWidth = 5; c.beginPath(); c.moveTo(0, 34); c.lineTo(0, -46); c.stroke();
    c.fillStyle = F('#dfe2e8'); c.beginPath(); c.moveTo(-3, -44); c.quadraticCurveTo(-4, -76, 14, -88); c.quadraticCurveTo(14, -62, 5, -44); c.fill();
    c.fillStyle = F('#b3261e'); c.beginPath(); c.arc(0, -44, 5, 0, Math.PI * 2); c.fill();
  } else if (kind === 'bow') {
    c.rotate(-a + Math.PI / 2 - .1);
    c.strokeStyle = F('#5a381d'); c.lineWidth = 4; c.beginPath(); c.arc(-14, 0, 28, -1.1, 1.1); c.stroke();
    c.strokeStyle = F('#e8e0cc'); c.lineWidth = 1; c.beginPath(); c.moveTo(-14 + Math.cos(-1.1) * 28, Math.sin(-1.1) * 28); c.lineTo(-14 + Math.cos(1.1) * 28, Math.sin(1.1) * 28); c.stroke();
  } else if (kind === 'drum') {
    // dùi trống trên tay, trống đeo trước bụng
    c.strokeStyle = F('#6b4424'); c.lineWidth = 3; c.beginPath(); c.moveTo(0, 4); c.lineTo(0, -26); c.stroke(); ell(c, 0, -27, 4, 4, F('#b3261e'));
    c.rotate(-a); c.translate(-x, -y);
    ell(c, 14, -36, 13, 15, F('#8a3b1f')); ell(c, 20, -36, 7, 13, F('#e8d9b0'));
    c.strokeStyle = F('#e9b949'); c.lineWidth = 2; c.beginPath(); c.ellipse(14, -36, 13, 15, 0, 0, Math.PI * 2); c.stroke();
  } else if (kind === 'pot') {
    c.rotate(-a);
    drawPot(c, 0, -8, F, P.t || 0);
  }
  c.restore();
}
function drawPot(c, x, y, F = v => v, t = 0) {
  ell(c, x, y, 10, 9, F('#7a4a2a'));
  c.fillStyle = F('#5a341c'); c.fillRect(x - 5, y - 13, 10, 5);
  c.strokeStyle = F('#c9b28f'); c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - 13); c.quadraticCurveTo(x + 4, y - 20, x + 2, y - 24); c.stroke();
  ell(c, x + 2, y - 25, 3 + Math.sin(t * 30), 3 + Math.sin(t * 30), '#ffd35a');
}

// Vò sành và thùng gỗ đập được
function drawProp(c, p) {
  const x = p.x, y = p.gy + 2, sh = p.shake > 0 ? Math.sin(p.shake * 80) * 3 : 0;
  ell(c, x, y, 22, 5, 'rgba(0,0,0,.25)');
  c.save(); c.translate(x + sh, y);
  if (p.kind === 'jar') {
    c.fillStyle = '#8a5a34'; c.beginPath(); c.moveTo(-12, -44); c.quadraticCurveTo(-26, -30, -16, 0); c.lineTo(16, 0); c.quadraticCurveTo(26, -30, 12, -44); c.closePath(); c.fill();
    c.fillStyle = '#6b4226'; c.fillRect(-13, -50, 26, 7);
    c.strokeStyle = '#c9a36b'; c.lineWidth = 2; c.beginPath(); c.moveTo(-18, -24); c.quadraticCurveTo(0, -18, 18, -24); c.stroke();
    c.fillStyle = '#b3261e'; c.fillRect(-7, -36, 14, 10); c.fillStyle = '#f4e7c9'; c.font = `9px ${FB}`; c.textAlign = 'center'; c.fillText('rượu', 0, -28);
  } else {
    c.fillStyle = '#9a6a3a'; c.fillRect(-22, -42, 44, 42);
    c.strokeStyle = '#6b4424'; c.lineWidth = 3; c.strokeRect(-22, -42, 44, 42);
    c.beginPath(); c.moveTo(-22, -42); c.lineTo(22, 0); c.moveTo(22, -42); c.lineTo(-22, 0); c.stroke();
  }
  c.restore();
}
