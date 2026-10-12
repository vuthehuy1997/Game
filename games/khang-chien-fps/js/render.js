// Dựng hình giả-3D bằng raycasting (DDA) trên canvas 2D: dò NUM_RAYS tia để vẽ tường thành các dải dọc,
// rồi vẽ địch/vật phẩm như sprite luôn quay mặt về máy ảnh (billboard), dùng lại hệ vẽ chibi chung của
// Game Hub để giữ phong cách thống nhất. Không dùng WebGL/Three.js, không texture ảnh.
import { $ } from '../../../platform/core/util.js';
import { drawChibi } from '../../../platform/art/chibi.js';
import { POSES } from '../../../platform/art/poses.js';
import { ell, rr, shade, outlinedText } from '../../../platform/art/draw.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { G, P, enemies, pickups, grid, gridW, gridH } from './state.js';
import { castRay } from './raycast.js';
import { WEAPONS, CAMPAIGNS } from './data.js';

const cv = $('cv'), ctx = cv.getContext('2d');
const W = 960, H = 540, HORIZON = H / 2;
const FOV = 66 * Math.PI / 180, NUM_RAYS = 300, STRIP = W / NUM_RAYS;

// Màu vật liệu tường theo ký tự: mặt chính (side 0) / mặt hông tối hơn (side 1) — mẹo tạo chiều sâu
// kiểu raycasting cổ điển mà không cần texture ảnh.
const MATS = {
  '#': ['#5a4a36', '#3f3425'], T: ['#4a6b3a', '#33492a'], A: ['#7a7a74', '#55554f'],
  G: ['#8a6a3e', '#5f4a2a'], D: ['#6b5a3a', '#4a3d28'], B: ['#8f8f86', '#605f58'],
};

export function render() {
  ctx.save();
  if (G.shake > 0) ctx.translate((Math.random() - .5) * G.shake, (Math.random() - .5) * G.shake);
  drawSkyFloor();
  const depths = castWalls();
  drawSprites(depths);
  drawWeapon();
  ctx.restore();
  if (G.hitFlash > 0) { ctx.fillStyle = `rgba(160,20,20,${Math.min(.45, G.hitFlash)})`; ctx.fillRect(0, 0, W, H); }
  drawHud();
  drawMinimap();
}

function drawSkyFloor() {
  const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
  sky.addColorStop(0, '#2a3a2e'); sky.addColorStop(1, '#4a5a44');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, HORIZON);
  const floor = ctx.createLinearGradient(0, HORIZON, 0, H);
  floor.addColorStop(0, '#3a3024'); floor.addColorStop(1, '#1c1710');
  ctx.fillStyle = floor; ctx.fillRect(0, HORIZON, W, H - HORIZON);
}

function castWalls() {
  const depths = new Array(NUM_RAYS);
  for (let i = 0; i < NUM_RAYS; i++) {
    const a = P.angle - FOV / 2 + (i / NUM_RAYS) * FOV;
    const r = castRay(grid, P.x, P.y, a);
    const perp = Math.max(.05, r.dist * Math.cos(a - P.angle));
    depths[i] = perp;
    const lineH = Math.min(H * 1.6, H / perp);
    const mat = MATS[r.hit] || MATS['#'];
    const base = r.side === 1 ? mat[1] : mat[0];
    const fog = Math.max(0, Math.min(.82, perp / 11));
    ctx.fillStyle = shade(base, -Math.round(fog * 90));
    ctx.fillRect(Math.floor(i * STRIP), Math.floor(HORIZON - lineH / 2), Math.ceil(STRIP) + 1, Math.ceil(lineH));
  }
  return depths;
}

function enemyLook() { return CAMPAIGNS[G.campaign].enemyLook; }

function drawSprites(depths) {
  const items = [];
  for (const e of enemies) items.push({ type: 'enemy', ref: e, x: e.x, y: e.y });
  for (const p of pickups) items.push({ type: 'pickup', ref: p, x: p.x, y: p.y });
  for (const it of items) {
    const dx = it.x - P.x, dy = it.y - P.y, dist = Math.hypot(dx, dy);
    let ang = Math.atan2(dy, dx) - P.angle;
    ang = ((ang + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    if (Math.abs(ang) > FOV / 2 + .3 || dist < .2) continue;
    const col = Math.max(0, Math.min(NUM_RAYS - 1, Math.floor((ang + FOV / 2) / FOV * NUM_RAYS)));
    if (dist > depths[col] + .15) continue; // bị tường che
    it.dist = dist; it.screenX = (ang + FOV / 2) / FOV * W;
    it.alpha = Math.max(0, Math.min(1, 1 - Math.max(0, dist - 9) / 2));
  }
  const visible = items.filter(it => it.dist != null).sort((a, b) => b.dist - a.dist);
  for (const it of visible) {
    const halfWall = H / (2 * it.dist), feetY = HORIZON + halfWall;
    if (it.type === 'enemy') drawEnemySprite(it.ref, it.screenX, feetY, halfWall, it.alpha);
    else drawPickupSprite(it.ref, it.screenX, feetY, halfWall, it.alpha);
  }
}

function drawEnemySprite(e, sx, feetY, halfWall, alpha) {
  const look = enemyLook(), scale = halfWall * 2 * .88 / 105;
  let pose;
  if (e.hp <= 0) pose = POSES.dead({ st: e.deadT });
  else if (e.hurtT > 0) pose = POSES.hurt();
  else if (e.state === 'alert' && e.walk) pose = POSES.run({ walk: e.walk });
  else pose = POSES.idle({ t: G.t });
  ctx.save();
  ctx.globalAlpha = alpha * (e.hp <= 0 ? Math.max(0, 1 - e.deadT / .9) : 1);
  drawChibi(ctx, sx, feetY, look, { face: 1, t: G.t, scale, flash: e.hurtT > .1 ? 1 : 0, ...pose });
  ctx.restore();
}

function drawPickupSprite(p, sx, feetY, halfWall, alpha) {
  const s = Math.max(6, halfWall * .5);
  ctx.save();
  ctx.globalAlpha = alpha * (.75 + Math.sin(G.t * 5) * .25);
  ell(ctx, sx, feetY - s, s, s, p.kind === 'health' ? '#7bd389' : '#e9b949');
  ctx.restore();
}

function drawWeapon() {
  const bob = P.moving ? Math.sin(P.walk) * 8 : 0;
  const recoil = Math.min(18, P.muzzle * 30);
  ctx.save();
  ctx.translate(W / 2 + 70, H - 10 + bob * .4 - recoil);
  ctx.fillStyle = '#3a2e22'; rr(ctx, -18, -90, 36, 100, 8); ctx.fill();
  ctx.fillStyle = '#20231f'; ctx.fillRect(-10, -150, 20, 70);
  if (P.muzzle > .5) {
    ctx.globalAlpha = (P.muzzle - .5) * 2;
    ell(ctx, 0, -152, 16, 16, '#ffe6a8'); ell(ctx, 0, -152, 7, 7, '#fff3cf');
  }
  ctx.restore();
}

function drawHud() {
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 9, H / 2); ctx.lineTo(W / 2 - 3, H / 2); ctx.moveTo(W / 2 + 3, H / 2); ctx.lineTo(W / 2 + 9, H / 2);
  ctx.moveTo(W / 2, H / 2 - 9); ctx.lineTo(W / 2, H / 2 - 3); ctx.moveTo(W / 2, H / 2 + 3); ctx.lineTo(W / 2, H / 2 + 9);
  ctx.stroke();

  ctx.textAlign = 'left';
  barHud(16, 16, 190, 16, P.hp / P.maxHp, '#d9453b');
  outlinedText(ctx, `Máu ${Math.ceil(P.hp)}`, 20, 29, `12px ${FB}`, '#fff');
  const w = WEAPONS[P.weapon];
  outlinedText(ctx, P.reloadT > 0 ? 'Đang nạp…' : `${w.name}: ${P.ammo}/${w.mag}`, 16, 60, `16px ${FD}`, '#ffe6a8');

  ctx.textAlign = 'right';
  outlinedText(ctx, CAMPAIGNS[G.campaign].name + ' · Màn ' + (G.level + 1), W - 16, 28, `16px ${FD}`, '#fff');
  outlinedText(ctx, `Diệt: ${G.kills}/${G.needKills}`, W - 16, 50, `14px ${FB}`, G.kills >= G.needKills ? '#7bd389' : '#ddd');

  if (G.toastT > 0) {
    ctx.textAlign = 'center'; ctx.globalAlpha = Math.min(1, G.toastT);
    outlinedText(ctx, G.toastTxt, W / 2, 86, `20px ${FD}`, '#ffe6a8');
    ctx.globalAlpha = 1;
  }
  if (G.kills >= G.needKills) {
    ctx.textAlign = 'center';
    outlinedText(ctx, 'Tới điểm tập kết để hoàn thành màn', W / 2, H - 54, `14px ${FB}`, '#ffe6a8');
  }
}
function barHud(x, y, w, h, frac, col) {
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col; ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.strokeRect(x, y, w, h);
}

function drawMinimap() {
  const mw = 150, mh = 120, mx = W - mw - 14, my = H - mh - 14, cell = Math.min(mw / gridW, mh / gridH);
  ctx.save();
  ctx.globalAlpha = .88;
  ctx.fillStyle = 'rgba(10,12,10,.65)'; rr(ctx, mx - 4, my - 4, gridW * cell + 8, gridH * cell + 8, 6); ctx.fill();
  for (let y = 0; y < gridH; y++) for (let x = 0; x < gridW; x++) {
    ctx.fillStyle = grid[y][x] === '.' ? 'rgba(220,220,210,.22)' : 'rgba(120,110,90,.9)';
    ctx.fillRect(mx + x * cell, my + y * cell, cell - .5, cell - .5);
  }
  for (const e of enemies) if (e.hp > 0) ell(ctx, mx + e.x * cell, my + e.y * cell, 2.6, 2.6, '#e0604e');
  ctx.save();
  ctx.translate(mx + P.x * cell, my + P.y * cell); ctx.rotate(P.angle);
  ctx.fillStyle = '#7bd389';
  ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-3, -3); ctx.lineTo(-3, 3); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.restore();
}
