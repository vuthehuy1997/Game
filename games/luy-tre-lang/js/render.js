// Vẽ thế giới, nhân vật, quái, NPC và HUD.
import { clamp } from '../../../platform/core/util.js';
import { outlinedText } from '../../../platform/art/draw.js';
import { drawChibi } from '../../../platform/art/chibi.js';
import { FD, FB } from '../../../platform/ui/theme.js';
import { COLS, ROWS, TS, TILE, WEAPON_LOOK, BIOME_SKY, BIOME_NAME, MOB_DEF } from './data.js';
import { G } from './state.js';
import { getTile, biomeAt } from './world.js';
import { drawTile, drawMob, drawBackdrop } from './art.js';
import { heldItem } from './player.js';

export const W = 960, H = 540;
const HERO = { skin: '#f6d2ae', hair: '#1c1410', hat: 'nonla', shirt: '#2f6b57', trim: '#e9b949', pants: '#2a2630', belt: '#e9b949' };
const MERCHANT = { skin: '#e3b98f', hair: '#2a1e12', hat: 'khan', khan: '#8a3b1f', shirt: '#caa65a', trim: '#5a4228', pants: '#3a2a1a', belt: '#5a4228', beard: 1 };

export function getCamera() {
  return {
    x: clamp(G.px - W / 2, 0, COLS * TS - W),
    y: clamp(G.py - H * .6, 0, ROWS * TS - H),
  };
}

export function render(ctx) {
  const cam = getCamera(), night = G.time >= .5;
  const biome = biomeAt(Math.floor(G.px / TS));
  const pal = BIOME_SKY[biome][night ? 'night' : 'day'];
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, pal[0]); sky.addColorStop(1, pal[1]);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  drawBackdrop(ctx, biome, W, H);

  const c0 = Math.max(0, Math.floor(cam.x / TS)), c1 = Math.min(COLS - 1, Math.ceil((cam.x + W) / TS));
  const r0 = Math.max(0, Math.floor(cam.y / TS)), r1 = Math.min(ROWS - 1, Math.ceil((cam.y + H) / TS));
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
    const code = getTile(G.tiles, c, r); if (code === TILE.AIR) continue;
    const grassTop = getTile(G.tiles, c, r - 1) === TILE.AIR;
    drawTile(ctx, code, c * TS - cam.x, r * TS - cam.y, TS, grassTop);
  }
  if (night) { ctx.fillStyle = 'rgba(6,10,30,.38)'; ctx.fillRect(0, 0, W, H); }

  if (G.npc.active) drawChibi(ctx, G.npc.x - cam.x, G.npc.y - cam.y, MERCHANT, { face: -1, t: G.time * 10, scale: .62 });
  for (const m of G.mobs) drawMob(ctx, m.kind, m.x - cam.x, m.y - cam.y, G.time * 90 + G.day);

  const look = { ...HERO, weapon: WEAPON_LOOK[heldItem()] };
  drawChibi(ctx, G.px - cam.x, G.py - cam.y, look, { face: G.face, t: G.day + G.time, scale: .62, flash: G.hurt > 0 ? 1 : 0 });

  const boss = G.mobs.find(m => MOB_DEF[m.kind]?.boss);
  if (boss) drawBossBar(ctx, boss, MOB_DEF[boss.kind]);
  drawHud(ctx, night, biome);
}

function drawBossBar(ctx, mob, def) {
  const w = 260, x = (W - w) / 2, y = 84;
  ctx.textAlign = 'center';
  outlinedText(ctx, def.name, W / 2, y - 6, `16px ${FD}`, '#ffd76a');
  ctx.fillStyle = '#1118'; ctx.fillRect(x, y, w, 12);
  ctx.fillStyle = '#c23a4a'; ctx.fillRect(x, y, w * Math.max(0, mob.hp / def.hp), 12);
  ctx.strokeStyle = '#fff8'; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, w - 1, 11);
  ctx.textAlign = 'left';
}

// Vùng góc trên (trái: nút "← Game Hub", phải: các nút Chế tạo/Giao thương/Đặt/Ván mới) là HTML đè lên canvas;
// HUD vẽ ở y >= 78 để không bị hai dải nút đó che.
function drawHud(ctx, night, biome) {
  ctx.textAlign = 'left';
  ctx.fillStyle = '#1118'; ctx.fillRect(14, 78, 180, 16);
  ctx.fillStyle = G.hp > 30 ? '#8fdc6a' : '#e2574c'; ctx.fillRect(14, 78, 180 * Math.max(0, G.hp / G.maxHp), 16);
  ctx.strokeStyle = '#fff8'; ctx.lineWidth = 1; ctx.strokeRect(14, 78, 180, 16);
  outlinedText(ctx, `${Math.max(0, G.hp)}/${G.maxHp}`, 20, 91, `12px ${FB}`, '#fff');
  outlinedText(ctx, `Ngày ${G.day} · ${night ? 'Đêm' : 'Ngày'} · ${BIOME_NAME[biome]}`, 14, 114, `18px ${FD}`, '#ffe6a8');
  ctx.textAlign = 'right';
  outlinedText(ctx, `${G.gold} vàng`, W - 16, 96, `20px ${FD}`, '#ffd76a');
}
