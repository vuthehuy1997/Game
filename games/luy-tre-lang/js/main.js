import { startLoop } from '../../../platform/core/loop.js';
import { $ } from '../../../platform/core/util.js';
import { ac } from '../../../platform/core/audio.js';
import { held, pressed, bindKeys, bindTouch } from '../../../platform/core/input.js';
import { debugOn, exposeGlobals } from '../../../platform/core/debug.js';
import { mountHomeLink } from '../../../platform/ui/bar.js';
import * as D from './data.js';
import { TS, ITEMS, RECIPES, QUESTS, SHOP_BUY, SHOP_SELL } from './data.js';
import * as WLD from './world.js';
import * as ST from './state.js';
import { G, newGame, saveGame, loadGame, invCount } from './state.js';
import * as PL from './player.js';
import { heldItem, hitTile, placeTile, craft, nearBench, nearNpc, claimQuest, buy, sell } from './player.js';
import * as MB from './mobs.js';
import { attackMobs } from './mobs.js';
import * as FL from './flow.js';
import { tick } from './flow.js';
import * as RD from './render.js';
import { render, getCamera, W, H } from './render.js';
import { drawItemIcon } from './art.js';

const cv = $('cv'), stage = $('stage');
const hotbarEl = $('hotbar'), craftPanel = $('craftPanel'), craftList = $('craftList');
const shopPanel = $('shopPanel'), shopList = $('shopList');
const btnCraft = $('btnCraft'), btnTrade = $('btnTrade'), btnPlaceMode = $('btnPlaceMode'), btnNew = $('btnNew');

let placeMode = false;
cv.addEventListener('pointerdown', () => ac(), { once: true });
cv.addEventListener('contextmenu', e => e.preventDefault());

function screenToWorld(e) {
  const rect = cv.getBoundingClientRect();
  const sx = (e.clientX - rect.left) / rect.width * W, sy = (e.clientY - rect.top) / rect.height * H;
  const cam = getCamera();
  return { wx: sx + cam.x, wy: sy + cam.y };
}
cv.addEventListener('pointerdown', e => {
  const { wx, wy } = screenToWorld(e);
  const c = Math.floor(wx / TS), r = Math.floor(wy / TS);
  if (e.button === 2 || placeMode) { placeTile(c, r, heldItem()); return; }
  if (G.npc.active && Math.hypot(G.npc.x - wx, G.npc.y - wy) < 28) { openShop(); return; }
  const mob = G.mobs.find(m => Math.hypot(m.x - wx, m.y - wy) < 24);
  if (mob) { attackMobs(); return; }
  hitTile(c, r);
});

btnPlaceMode.addEventListener('click', () => { placeMode = !placeMode; btnPlaceMode.classList.toggle('act', placeMode); });
btnNew.addEventListener('click', () => { newGame(); closePanels(); });
btnCraft.addEventListener('click', () => toggle(craftPanel, renderCraftList));
btnTrade.addEventListener('click', () => openShop());
function openShop() { craftPanel.hidden = true; shopPanel.hidden = false; renderShopList(); }
function closePanels() { craftPanel.hidden = true; shopPanel.hidden = true; }
function toggle(panel, fill) {
  const open = panel.hidden;
  closePanels();
  if (open) { panel.hidden = false; fill(); }
}

function iconCanvas(itemId, size = 28) {
  const cv = document.createElement('canvas'); cv.className = 'icon'; cv.width = size; cv.height = size;
  if (itemId) drawItemIcon(cv.getContext('2d'), itemId, size / 2, size / 2, size * .92);
  return cv;
}

function fmtNeed(need) { return Object.entries(need).map(([it, q]) => `x${q} ${ITEMS[it].name}`).join(', '); }
function renderCraftList() {
  craftList.innerHTML = '';
  const h = document.createElement('h2'); h.textContent = 'Chế tạo'; craftList.appendChild(h);
  for (const rec of RECIPES) {
    const ok = Object.entries(rec.need).every(([it, q]) => invCount(G.inv, it) >= q) && (!rec.bench || nearBench());
    const row = document.createElement('div'); row.className = 'row';
    row.appendChild(iconCanvas(rec.out));
    const span = document.createElement('span');
    span.innerHTML = `<b>${ITEMS[rec.out].name}</b> x${rec.qty}<small>${fmtNeed(rec.need)}${rec.bench ? ' · cần bàn chế tác' : ''}</small>`;
    row.appendChild(span);
    const b = document.createElement('button'); b.className = 'btn'; b.textContent = 'Làm'; b.disabled = !ok;
    b.addEventListener('click', () => { craft(rec.id); renderCraftList(); });
    row.appendChild(b); craftList.appendChild(row);
  }
  const close = document.createElement('button'); close.className = 'btn ghost close'; close.textContent = 'Đóng';
  close.addEventListener('click', closePanels); craftList.appendChild(close);
}
function renderShopList() {
  shopList.innerHTML = '';
  const h = document.createElement('h2'); h.textContent = 'Thương nhân · ' + G.gold + ' vàng'; shopList.appendChild(h);
  for (const it of SHOP_BUY) {
    const row = document.createElement('div'); row.className = 'row';
    row.appendChild(iconCanvas(it.item));
    const span = document.createElement('span'); span.innerHTML = `<b>${ITEMS[it.item].name}</b><small>${it.price} vàng</small>`;
    row.appendChild(span);
    const b = document.createElement('button'); b.className = 'btn'; b.textContent = 'Mua'; b.disabled = G.gold < it.price;
    b.addEventListener('click', () => { buy(it.item, it.price); renderShopList(); });
    row.appendChild(b); shopList.appendChild(row);
  }
  for (const [item, price] of Object.entries(SHOP_SELL)) {
    const have = invCount(G.inv, item);
    const row = document.createElement('div'); row.className = 'row';
    row.appendChild(iconCanvas(item));
    const span = document.createElement('span'); span.innerHTML = `<b>${ITEMS[item].name}</b><small>bán ${price} vàng/cái · đang có ${have}</small>`;
    row.appendChild(span);
    const b = document.createElement('button'); b.className = 'btn'; b.textContent = 'Bán'; b.disabled = have <= 0;
    b.addEventListener('click', () => { sell(item, price, 1); renderShopList(); });
    row.appendChild(b); shopList.appendChild(row);
  }
  for (const q of G.quests) {
    const def = QUESTS.find(x => x.id === q.id);
    const row = document.createElement('div'); row.className = 'row';
    if (def.item) row.appendChild(iconCanvas(def.item));
    const span = document.createElement('span'); span.innerHTML = `<b>${def.text}</b><small>${q.have}/${q.need}${q.claimed ? ' · đã nhận' : ''}</small>`;
    row.appendChild(span);
    const b = document.createElement('button'); b.className = 'btn'; b.textContent = 'Nhận'; b.disabled = q.claimed || q.have < q.need;
    b.addEventListener('click', () => { claimQuest(q.id); renderShopList(); });
    row.appendChild(b); shopList.appendChild(row);
  }
  const close = document.createElement('button'); close.className = 'btn ghost close'; close.textContent = 'Đóng';
  close.addEventListener('click', closePanels); shopList.appendChild(close);
}

function renderHotbar() {
  hotbarEl.innerHTML = '';
  G.inv.forEach((s, i) => {
    const b = document.createElement('button'); b.className = 'slot' + (i === G.sel ? ' sel' : '');
    b.appendChild(iconCanvas(s ? s.item : null));
    if (s) { const n = document.createElement('b'); n.textContent = s.count; b.appendChild(n); }
    b.addEventListener('pointerdown', e => { e.preventDefault(); G.sel = i; });
    hotbarEl.appendChild(b);
  });
}

const keymap = { KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', Space: 'jump', KeyW: 'jump', ArrowUp: 'jump', KeyE: 'craft', KeyF: 'trade' };
for (let i = 0; i < 8; i++) keymap['Digit' + (i + 1)] = 'slot' + i;
bindKeys(keymap, {
  onPress: k => {
    ac();
    if (k === 'craft') toggle(craftPanel, renderCraftList);
    else if (k === 'trade') { if (nearNpc()) openShop(); }
    else if (k.startsWith('slot')) G.sel = Number(k.slice(4));
  },
});
bindTouch($('touch'));
mountHomeLink(stage);

loadGame();

let paused = false;
function update(dt) { if (!paused) tick(dt); }
function frame() { render(cv.getContext('2d')); btnTrade.hidden = !nearNpc(); renderHotbar(); }

setInterval(saveGame, 5000);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });

if (debugOn()) exposeGlobals([D, WLD, ST, PL, MB, FL, RD, { G, update, held, pressed, pause: v => { paused = v; } }]);
startLoop(update, frame);
